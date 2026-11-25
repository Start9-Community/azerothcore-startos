import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  authPort,
  dbName,
  dbPort,
  resolveRealmHost,
  sqlString,
  validateRealmAddress,
  worldPort,
} from './utils'

const dbGracePeriod = 30_000
const worldGracePeriod = 120_000 // first boot loads maps + DB, can be slow

// The wowgaming/client-data release the pinned client-data image's own
// downloader names (see UPDATING.md), and its Data.zip digest.
const CLIENT_DATA_VERSION = 'v19'
const CLIENT_DATA_SHA256 =
  'd37f19cbf3d1c57d965882340519e0275e0964554476117791ad06069a667b04'
const CLIENT_DATA_CMD: [string, ...string[]] = [
  'bash',
  '-c',
  `set -euo pipefail
d=/azerothcore/env/dist/data
if grep -qsx 'INSTALLED_VERSION=${CLIENT_DATA_VERSION}' "$d/data-version"; then
  echo "client data ${CLIENT_DATA_VERSION} present, skipping"; exit 0
fi
echo "downloading client data ${CLIENT_DATA_VERSION}"
curl -fsSL -o "$d/data.zip" https://github.com/wowgaming/client-data/releases/download/${CLIENT_DATA_VERSION}/data.zip
if ! echo "${CLIENT_DATA_SHA256}  $d/data.zip" | sha256sum -c -; then
  rm -f "$d/data.zip"; exit 1
fi
unzip -q -o "$d/data.zip" -d "$d/"
rm "$d/data.zip"
echo 'INSTALLED_VERSION=${CLIENT_DATA_VERSION}' > "$d/data-version"`,
]

// Secrets must never travel through `exec.env`. The SDK turns every entry into
// a `--env=KEY=VALUE` argument on `start-container`, and /proc/<pid>/cmdline is
// world-readable, so a password passed that way is visible to every local user
// for as long as the process runs. Each secret goes into a 0600 file in the
// subcontainer's own rootfs instead -- never the `main` volume, which is backed
// up -- and only the path travels in argv. `/etc` is used because none of the
// images mount over it.
const AC_DB_ENV = '/etc/ac-db.env'
const MYSQL_PW_FILE = '/etc/mysql-root-pw'
const MYSQL_CNF = '/etc/mysql-client.cnf'
const DB_USER_SQL = '/etc/ac-db-user.sql'

// The game-server account may access only the literal databases in `dbName`.
const serverDbUser = 'acore'
const serverDbAccount = `'${serverDbUser}'@'127.0.0.1'`

// Every acore image runs as this user, so the sourced file must be chowned to
// it: writeFile runs as root.
const acoreUser = 'acore'

const writeSecret = async (
  sub: {
    writeFile: (
      path: string,
      body: string,
      opts: { mode: number },
    ) => Promise<void>
    exec: (cmd: string[], opts?: { user?: string }) => Promise<unknown>
  },
  path: string,
  body: string,
  owner?: string,
) => {
  await sub.writeFile(path, body, { mode: 0o600 })
  if (owner)
    await sub.exec(['chown', `${owner}:${owner}`, path], { user: 'root' })
}

// AzerothCore has no file-based form for the *_DATABASE_INFO settings, so the
// command sources them. Run through each image's own entrypoint, which ends in
// `exec "$@"`; every acore image sets ACORE_COMPONENT to its binary name and
// puts the binary directory on PATH.
const AC_SOURCED_CMD = ['bash', '-c', `. ${AC_DB_ENV}; exec "$ACORE_COMPONENT"`]

const DB_IMPORT_CMD: [string, ...string[]] = [
  '/usr/bin/env',
  'bash',
  '/azerothcore/entrypoint.sh',
  ...AC_SOURCED_CMD,
]

// The password comes from MYSQL_CNF, written into the subcontainer beforehand.
const mysqlExec = (sql: string) => ({
  command: [
    'mysql',
    `--defaults-extra-file=${MYSQL_CNF}`,
    '-h',
    '127.0.0.1',
    '-P',
    dbPort.toString(),
    '-uroot',
    '-e',
    sql,
  ] as [string, ...string[]],
})

export const main = sdk.setupMain(async ({ effects }) => {
  console.log('Starting AzerothCore!')

  const store = await storeJson.read().const(effects)
  if (!store) throw new Error('no store.json')

  const host = validateRealmAddress(
    await resolveRealmHost(effects, store.realmAddress),
  )
  console.log(`Realm address resolved to ${host}`)

  // The mysql image resolves MYSQL_ROOT_PASSWORD from a *_FILE variant
  // (file_env in its docker-entrypoint.sh), so only the path is passed.
  const dbEnv = { MYSQL_ROOT_PASSWORD_FILE: MYSQL_PW_FILE }
  const dbEnvFile = (user: string, password: string) =>
    Object.entries({
      AC_LOGIN_DATABASE_INFO: dbName.auth,
      AC_WORLD_DATABASE_INFO: dbName.world,
      AC_CHARACTER_DATABASE_INFO: dbName.characters,
    })
      .map(
        ([k, db]) =>
          `export ${k}='127.0.0.1;${dbPort};${user};${password};${db}'`,
      )
      .join('\n') + '\n'

  // Sourced from AC_DB_ENV rather than passed as env. Single quotes are safe:
  // both passwords are generated from `a-z,A-Z,0-9` (see
  // init/initializeService.ts), so they cannot contain a quote, and the values'
  // own `;` separators would otherwise be read as shell command separators.
  const importDbEnvFile = dbEnvFile('root', store.dbPassword)
  const serverDbEnvFile = dbEnvFile(serverDbUser, store.serverDbPassword)

  // Every start, so the account always matches store.json.
  const dbUserSqlFile =
    [
      `CREATE USER IF NOT EXISTS ${serverDbAccount} IDENTIFIED BY '${store.serverDbPassword}';`,
      `ALTER USER ${serverDbAccount} IDENTIFIED BY '${store.serverDbPassword}';`,
      `REVOKE ALL PRIVILEGES, GRANT OPTION FROM ${serverDbAccount};`,
      // Database-level GRANT treats unescaped underscores as wildcards.
      ...Object.values(dbName).map(
        (db) =>
          `GRANT ALL PRIVILEGES ON \`${db.replace(/_/g, '\\_')}\`.* TO ${serverDbAccount};`,
      ),
    ].join('\n') + '\n'

  const mysqlCnfFile = `[client]\npassword=${store.dbPassword}\n`

  const serverEnv: Record<string, string> = {
    AC_DATA_DIR: '/azerothcore/env/dist/data',
    AC_CONSOLE_ENABLE: '0',
    // Warden is an anti-cheat that streams a compiled Windows module to every
    // client and has it execute there. That is pointless on a private realm,
    // and `Warden.ClientCheckFailAction` does not prevent it: the module is
    // sent from WardenWin::Init regardless, and the action only decides what
    // happens once a check fails. Off means the module is never sent.
    AC_WARDEN_ENABLED: '0',
  }

  // host is charset-whitelisted by validateRealmAddress (no quotes/backslashes)
  // and worldPort is a numeric constant. realmName is the only free-text field,
  // so it's escaped via sqlString before interpolation.
  const realmSql =
    `UPDATE ${dbName.auth}.realmlist ` +
    `SET address='${host}', localAddress='${host}', ` +
    `port=${worldPort}, name=${sqlString(store.realmName)} ` +
    `WHERE id=1;`

  const dbReady = {
    display: i18n('Database'),
    gracePeriod: dbGracePeriod,
    fn: () =>
      sdk.healthCheck.checkPortListening(effects, dbPort, {
        successMessage: i18n('Database is ready'),
        errorMessage: i18n('Database is starting'),
      }),
  }
  const authReady = {
    display: i18n('Auth Server'),
    fn: () =>
      sdk.healthCheck.checkPortListening(effects, authPort, {
        successMessage: i18n('Auth server is ready'),
        errorMessage: i18n('Auth server is starting'),
      }),
  }
  const worldReady = {
    display: i18n('World Server'),
    gracePeriod: worldGracePeriod,
    fn: () =>
      sdk.healthCheck.checkPortListening(effects, worldPort, {
        successMessage: i18n('World server is ready'),
        errorMessage: i18n('World server is loading'),
      }),
  }

  // Built up front rather than inline in the chain because each needs its
  // secret file written before its command runs.
  const databaseSub = sdk.SubContainer.of(
    effects,
    { imageId: 'database' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'main',
      subpath: 'mysql',
      mountpoint: '/var/lib/mysql',
      readonly: false,
    }),
    'database-sub',
  )
  await writeSecret(databaseSub, MYSQL_PW_FILE, store.dbPassword)

  const realmConfigSub = sdk.SubContainer.of(
    effects,
    { imageId: 'database' },
    null,
    'realm-config-sub',
  )
  await writeSecret(realmConfigSub, MYSQL_CNF, mysqlCnfFile)

  const dbUserSub = sdk.SubContainer.of(
    effects,
    { imageId: 'database' },
    null,
    'db-user-sub',
  )
  await writeSecret(dbUserSub, MYSQL_CNF, mysqlCnfFile)
  await writeSecret(dbUserSub, DB_USER_SQL, dbUserSqlFile)

  const dbImportSub = sdk.SubContainer.of(
    effects,
    { imageId: 'db-import' },
    null,
    'db-import-sub',
  )
  await writeSecret(dbImportSub, AC_DB_ENV, importDbEnvFile, acoreUser)

  const authserverSub = sdk.SubContainer.of(
    effects,
    { imageId: 'authserver' },
    null,
    'authserver-sub',
  )
  await writeSecret(authserverSub, AC_DB_ENV, serverDbEnvFile, acoreUser)

  const worldserverSub = sdk.SubContainer.of(
    effects,
    { imageId: 'worldserver' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'main',
      subpath: 'data',
      mountpoint: '/azerothcore/env/dist/data',
      readonly: true,
    }),
    'worldserver-sub',
  )
  await writeSecret(worldserverSub, AC_DB_ENV, serverDbEnvFile, acoreUser)

  return sdk.Daemons.of(effects)
    .addDaemon('database', {
      subcontainer: databaseSub,
      exec: { command: sdk.useEntrypoint(), env: dbEnv },
      ready: dbReady,
      requires: [],
    })
    .addOneshot('client-data', {
      subcontainer: sdk.SubContainer.of(
        effects,
        { imageId: 'client-data' },
        sdk.Mounts.of().mountVolume({
          volumeId: 'main',
          subpath: 'data',
          mountpoint: '/azerothcore/env/dist/data',
          readonly: false,
        }),
        'client-data-sub',
      ),
      exec: { command: CLIENT_DATA_CMD },
      requires: [],
    })
    .addOneshot('db-import', {
      subcontainer: dbImportSub,
      exec: { command: DB_IMPORT_CMD, env: serverEnv },
      requires: ['database'],
    })
    .addOneshot('realm-config', {
      subcontainer: realmConfigSub,
      exec: mysqlExec(realmSql),
      requires: ['db-import'],
    })
    .addOneshot('db-user', {
      subcontainer: dbUserSub,
      exec: mysqlExec(`source ${DB_USER_SQL}`),
      requires: ['database'],
    })
    .addDaemon('authserver', {
      subcontainer: authserverSub,
      exec: { command: sdk.useEntrypoint(AC_SOURCED_CMD), env: serverEnv },
      ready: authReady,
      requires: ['realm-config', 'db-user'],
    })
    .addDaemon('worldserver', {
      subcontainer: worldserverSub,
      exec: { command: sdk.useEntrypoint(AC_SOURCED_CMD), env: serverEnv },
      ready: worldReady,
      requires: ['db-import', 'client-data', 'db-user'],
    })
})
