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

// Client-data download. `inst_download_client_data` is itself idempotent and
// version-aware: it compares its pinned data version against INSTALLED_VERSION
// in `data/data-version` (which lives in the `main` volume) and returns early
// when they match. Don't guard this on the data directory merely existing --
// upstream bumps the data version when the map format changes (v19 -> v20 for
// MMAP_VERSION 20), and a presence check would leave an upgraded install
// running the new worldserver against stale mmaps it rejects.
const CLIENT_DATA_CMD: [string, ...string[]] = [
  'bash',
  '-c',
  'source /azerothcore/apps/installer/includes/functions.sh && inst_download_client_data',
]

// Secrets must never travel through `exec.env`. The SDK turns every entry into
// a `--env=KEY=VALUE` argument on `start-container`, and /proc/<pid>/cmdline is
// world-readable, so a password passed that way is visible to every local user
// for as long as the process runs. Each secret goes into a 0600 file in the
// subcontainer's own rootfs instead -- never the `main` volume, which is backed
// up -- and only the path travels in argv. `/etc` is used because neither image
// mounts over it.
const AC_DB_ENV = '/etc/ac-db.env'
const MYSQL_PW_FILE = '/etc/mysql-root-pw'
const MYSQL_CNF = '/etc/mysql-client.cnf'

// Matches DOCKER_USER in Dockerfile.playerbots, which the image's USER sets.
const acoreUser = 'acore'

// Write a secret into a subcontainer before its command runs. writeFile runs as
// root, so a file the command must read as a non-root user needs chown.
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

// Run an AC binary through the consolidated fork image entrypoint. AzerothCore
// has no file-based equivalent for the *_DATABASE_INFO settings, so the command
// sources them; the file holds `export` lines.
const acoreCmd = (binary: string): [string, ...string[]] => [
  '/usr/bin/env',
  'bash',
  '-c',
  `. ${AC_DB_ENV}; exec bash /azerothcore/entrypoint.sh ` +
    `/azerothcore/env/dist/bin/${binary}`,
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
  console.log('Starting AzerothCore (Playerbots)!')

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
      AC_PLAYERBOTS_DATABASE_INFO: conn(dbName.playerbots),
    })
      .map(([k, v]) => `export ${k}='${v}'`)
      .join('\n') + '\n'

  const mysqlCnfFile = `[client]\npassword=${store.dbPassword}\n`

  const botsOn = store.playerbots.enabled
  const serverEnv = {
    AC_DATA_DIR: '/azerothcore/env/dist/data',
    AC_CONSOLE_ENABLE: '0',
    // Warden is an anti-cheat that streams a compiled Windows module to every
    // client and has it execute there. That is pointless on a private realm,
    // and `Warden.ClientCheckFailAction` does not prevent it: the module is
    // sent from WardenWin::Init regardless, and the action only decides what
    // happens once a check fails. Off means the module is never sent.
    AC_WARDEN_ENABLED: '0',
    // AzerothCore env names split camelCase with underscores:
    // AiPlayerbot.Enabled -> AC_AI_PLAYERBOT_ENABLED, etc.
    AC_AI_PLAYERBOT_ENABLED: botsOn ? '1' : '0',
    AC_AI_PLAYERBOT_RANDOM_BOT_AUTOLOGIN: botsOn ? '1' : '0',
    AC_AI_PLAYERBOT_MIN_RANDOM_BOTS: String(store.playerbots.minBots),
    AC_AI_PLAYERBOT_MAX_RANDOM_BOTS: String(store.playerbots.maxBots),
    // Optional modules (compiled in, off by default), toggled via the Modules
    // action. Env names are the module's config key with camelCase split by
    // underscores (e.g. Transmogrification.Enable -> AC_TRANSMOGRIFICATION_ENABLE);
    // IndividualXp.Enabled takes a boolean string.
    AC_AUTO_REVIVE_ENABLE: store.modules.autoRevive ? '1' : '0',
    AC_TRANSMOGRIFICATION_ENABLE: store.modules.transmog ? '1' : '0',
    AC_LEARN_SPELLS_ENABLE: store.modules.learnSpells ? '1' : '0',
    AC_INDIVIDUAL_XP_ENABLED: store.modules.individualXp ? 'true' : 'false',
    AC_AOELOOT_ENABLE: store.modules.aoeLoot ? '1' : '0',
    AC_BUFF_ENABLE: store.modules.npcBuffer ? '1' : '0',
    AC_ENCHANTER_ENABLE: store.modules.npcEnchanter ? '1' : '0',
  }

  const exec = (binary: string) => ({
    command: acoreCmd(binary),
    env: {
      ...serverEnv,
      ACORE_COMPONENT: binary,
      // db-import populates every core DB: EnableDatabases is a bitmask
      // (1=auth, 2=characters, 4=world, 8=playerbots in the fork; 15=all).
      // The long-running servers must not migrate (0). Overrides the image ENV.
      ...(binary === 'dbimport'
        ? { AC_FORCE_CREATE_DB: '1', AC_UPDATES_ENABLE_DATABASES: '15' }
        : { AC_UPDATES_ENABLE_DATABASES: '0' }),
    },
  })

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

  const createDbsSub = sdk.SubContainer.of(
    effects,
    { imageId: 'database' },
    null,
    'create-dbs-sub',
  )
  await writeSecret(createDbsSub, MYSQL_CNF, mysqlCnfFile)

  const realmConfigSub = sdk.SubContainer.of(
    effects,
    { imageId: 'database' },
    null,
    'realm-config-sub',
  )
  await writeSecret(realmConfigSub, MYSQL_CNF, mysqlCnfFile)

  // The acore image runs as `acore`, so the sourced file must be chowned to it.
  const dbImportSub = sdk.SubContainer.of(
    effects,
    { imageId: 'acore' },
    null,
    'db-import-sub',
  )
  await writeSecret(dbImportSub, AC_DB_ENV, acDbEnvFile, acoreUser)

  const authserverSub = sdk.SubContainer.of(
    effects,
    { imageId: 'acore' },
    null,
    'authserver-sub',
  )
  await writeSecret(authserverSub, AC_DB_ENV, acDbEnvFile, acoreUser)

  const worldserverSub = sdk.SubContainer.of(
    effects,
    { imageId: 'acore' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'main',
      subpath: 'data',
      mountpoint: '/azerothcore/env/dist/data',
      readonly: true,
    }),
    'worldserver-sub',
  )
  await writeSecret(worldserverSub, AC_DB_ENV, acDbEnvFile, acoreUser)

  return (
    sdk.Daemons.of(effects)
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
        // Run as root: the `main` volume mountpoint is root-owned, and the
        // client-data image began declaring `USER acore` (uid 1000) in
        // 17.0.0-dev, which cannot write the zip or extract into it. The
        // 16.0.0-dev image ran as root implicitly, so this preserves the
        // behavior the download has always relied on.
        exec: { command: CLIENT_DATA_CMD, user: 'root' },
        requires: [],
      })
      // Create all databases up front (the fork's auto-create only makes the
      // first one). db-import then populates auth/world/characters/playerbots.
      .addOneshot('create-dbs', {
        subcontainer: createDbsSub,
        exec: mysqlExec(
          Object.values(dbName)
            .map(
              (db) =>
                `CREATE DATABASE IF NOT EXISTS ${db} ` +
                `DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;`,
            )
            .join(' '),
        ),
        requires: ['database'],
      })
      .addOneshot('db-import', {
        subcontainer: dbImportSub,
        exec: exec('dbimport'),
        requires: ['database', 'create-dbs'],
      })
      .addOneshot('realm-config', {
        subcontainer: realmConfigSub,
        exec: mysqlExec(realmSql),
        requires: ['db-import'],
      })
      .addDaemon('authserver', {
        subcontainer: authserverSub,
        exec: exec('authserver'),
        ready: authReady,
        requires: ['realm-config'],
      })
      .addDaemon('worldserver', {
        subcontainer: worldserverSub,
        exec: exec('worldserver'),
        ready: worldReady,
        requires: ['db-import', 'client-data', 'create-dbs'],
      })
  )
})
