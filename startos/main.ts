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

// Client-data download, idempotent: skips if maps already present.
const CLIENT_DATA_CMD: [string, ...string[]] = [
  'bash',
  '-c',
  '[ -d /azerothcore/env/dist/data/dbc ] && echo "client data present, skipping" || (source /azerothcore/apps/installer/includes/functions.sh && inst_download_client_data)',
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
  const conn = (name: string) =>
    `127.0.0.1;${dbPort};root;${store.dbPassword};${name}`

  // Sourced from AC_DB_ENV rather than passed as env. Single quotes are safe:
  // dbPassword is generated from `a-z,A-Z,0-9` (see init/initializeService.ts),
  // so it cannot contain a quote, and the values' own `;` separators would
  // otherwise be read as shell command separators.
  const acDbEnvFile =
    Object.entries({
      AC_LOGIN_DATABASE_INFO: conn(dbName.auth),
      AC_WORLD_DATABASE_INFO: conn(dbName.world),
      AC_CHARACTER_DATABASE_INFO: conn(dbName.characters),
    })
      .map(([k, v]) => `export ${k}='${v}'`)
      .join('\n') + '\n'

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

  const dbImportSub = sdk.SubContainer.of(
    effects,
    { imageId: 'db-import' },
    null,
    'db-import-sub',
  )
  await writeSecret(dbImportSub, AC_DB_ENV, acDbEnvFile, acoreUser)

  const authserverSub = sdk.SubContainer.of(
    effects,
    { imageId: 'authserver' },
    null,
    'authserver-sub',
  )
  await writeSecret(authserverSub, AC_DB_ENV, acDbEnvFile, acoreUser)

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
  await writeSecret(worldserverSub, AC_DB_ENV, acDbEnvFile, acoreUser)

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
    .addDaemon('authserver', {
      subcontainer: authserverSub,
      exec: { command: sdk.useEntrypoint(AC_SOURCED_CMD), env: serverEnv },
      ready: authReady,
      requires: ['realm-config'],
    })
    .addDaemon('worldserver', {
      subcontainer: worldserverSub,
      exec: { command: sdk.useEntrypoint(AC_SOURCED_CMD), env: serverEnv },
      ready: worldReady,
      requires: ['db-import', 'client-data'],
    })
})
