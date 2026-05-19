import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import { authPort, dbName, dbPort, resolveRealmHost, worldPort } from './utils'

const dbGracePeriod = 30_000
const worldGracePeriod = 120_000 // first boot loads maps + DB, can be slow

// Client-data download, made idempotent: skips if maps are already present so
// it only actually downloads (~1.1GB) on first boot.
const CLIENT_DATA_CMD: [string, ...string[]] = [
  'bash',
  '-c',
  '[ -d /azerothcore/env/dist/data/dbc ] && echo "client data present, skipping" || (source /azerothcore/apps/installer/includes/functions.sh && inst_download_client_data)',
]

// db-import entrypoint (inspected from acore/ac-wotlk-db-import). Idempotent —
// the auto-updater only applies missing SQL.
const DB_IMPORT_CMD: [string, ...string[]] = [
  '/usr/bin/env',
  'bash',
  '/azerothcore/entrypoint.sh',
  '/azerothcore/env/dist/bin/dbimport',
]

export const main = sdk.setupMain(async ({ effects }) => {
  console.log('Starting AzerothCore!')

  const store = await storeJson.read().const(effects)
  if (!store) throw new Error('no store.json')

  const host = await resolveRealmHost(effects, store.realmAddress)
  console.log(`Realm address resolved to ${host}`)

  const dbEnv = { MYSQL_ROOT_PASSWORD: store.dbPassword }

  // AzerothCore DB connection format: "host;port;user;password;dbname"
  const conn = (name: string) =>
    `127.0.0.1;${dbPort};root;${store.dbPassword};${name}`

  const serverEnv = {
    AC_LOGIN_DATABASE_INFO: conn(dbName.auth),
    AC_WORLD_DATABASE_INFO: conn(dbName.world),
    AC_CHARACTER_DATABASE_INFO: conn(dbName.characters),
    AC_DATA_DIR: '/azerothcore/env/dist/data',
    // Disable the interactive "AC>" console prompt — pointless in a daemon and
    // it spams the StartOS logs.
    AC_CONSOLE_ENABLE: '0',
  }

  // Realm config: point the realm list at THIS host so clients can connect.
  // Runs in a mysql:8.4 subcontainer (has the mysql client) after db-import.
  const realmSql =
    `UPDATE ${dbName.auth}.realmlist ` +
    `SET address='${host}', localAddress='${host}', ` +
    `port=${worldPort}, name='${store.realmName.replace(/'/g, '')}' ` +
    `WHERE id=1;`

  const dataMount = sdk.Mounts.of().mountVolume({
    volumeId: 'main',
    subpath: 'data',
    mountpoint: '/azerothcore/env/dist/data',
    readonly: false,
  })

  return sdk.Daemons.of(effects)
    // 1. MySQL — must be healthy before any DB work.
    .addDaemon('database', {
      subcontainer: await sdk.SubContainer.of(
        effects,
        { imageId: 'database' },
        sdk.Mounts.of().mountVolume({
          volumeId: 'main',
          subpath: 'mysql',
          mountpoint: '/var/lib/mysql',
          readonly: false,
        }),
        'database-sub',
      ),
      exec: { command: sdk.useEntrypoint(), env: dbEnv },
      ready: {
        display: i18n('Database'),
        gracePeriod: dbGracePeriod,
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, dbPort, {
            successMessage: i18n('Database is ready'),
            errorMessage: i18n('Database is starting'),
          }),
      },
      requires: [],
    })
    // 2. Client data — one-shot, downloads maps on first boot (idempotent).
    .addOneshot('client-data', {
      subcontainer: await sdk.SubContainer.of(
        effects,
        { imageId: 'client-data' },
        dataMount,
        'client-data-sub',
      ),
      exec: { command: CLIENT_DATA_CMD },
      requires: [],
    })
    // 3. DB import — one-shot, creates/updates the three databases. Needs DB up.
    .addOneshot('db-import', {
      subcontainer: await sdk.SubContainer.of(
        effects,
        { imageId: 'db-import' },
        null,
        'db-import-sub',
      ),
      exec: { command: DB_IMPORT_CMD, env: serverEnv },
      requires: ['database'],
    })
    // 4. Realm config — one-shot, writes this host's address into realmlist.
    .addOneshot('realm-config', {
      subcontainer: await sdk.SubContainer.of(
        effects,
        { imageId: 'database' },
        null,
        'realm-config-sub',
      ),
      exec: {
        command: [
          'mysql',
          '-h',
          '127.0.0.1',
          '-P',
          dbPort.toString(),
          '-uroot',
          `-p${store.dbPassword}`,
          '-e',
          realmSql,
        ] as [string, ...string[]],
      },
      requires: ['db-import'],
    })
    // 5. Auth server — after the DB exists and is configured.
    .addDaemon('authserver', {
      subcontainer: await sdk.SubContainer.of(
        effects,
        { imageId: 'authserver' },
        null,
        'authserver-sub',
      ),
      exec: { command: sdk.useEntrypoint(), env: serverEnv },
      ready: {
        display: i18n('Auth Server'),
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, authPort, {
            successMessage: i18n('Auth server is ready'),
            errorMessage: i18n('Auth server is starting'),
          }),
      },
      requires: ['realm-config'],
    })
    // 6. World server — the game. Needs maps (client-data) + DB.
    .addDaemon('worldserver', {
      subcontainer: await sdk.SubContainer.of(
        effects,
        { imageId: 'worldserver' },
        sdk.Mounts.of().mountVolume({
          volumeId: 'main',
          subpath: 'data',
          mountpoint: '/azerothcore/env/dist/data',
          readonly: true,
        }),
        'worldserver-sub',
      ),
      exec: { command: sdk.useEntrypoint(), env: serverEnv },
      ready: {
        display: i18n('World Server'),
        gracePeriod: worldGracePeriod,
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, worldPort, {
            successMessage: i18n('World server is ready'),
            errorMessage: i18n('World server is loading'),
          }),
      },
      requires: ['db-import', 'client-data'],
    })
})
