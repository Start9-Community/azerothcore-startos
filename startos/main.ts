import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  authPort,
  dbName,
  dbPort,
  resolveRealmHost,
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

const DB_IMPORT_CMD: [string, ...string[]] = [
  '/usr/bin/env',
  'bash',
  '/azerothcore/entrypoint.sh',
  '/azerothcore/env/dist/bin/dbimport',
]

const mysqlExec = (pw: string, sql: string) => ({
  command: [
    'mysql',
    '-h',
    '127.0.0.1',
    '-P',
    dbPort.toString(),
    '-uroot',
    '-e',
    sql,
  ] as [string, ...string[]],
  // Pass the root password via env, not argv, so it never appears in the
  // process list.
  env: { MYSQL_PWD: pw },
})

export const main = sdk.setupMain(async ({ effects }) => {
  console.log('Starting AzerothCore!')

  const store = await storeJson.read().const(effects)
  if (!store) throw new Error('no store.json')

  const host = validateRealmAddress(
    await resolveRealmHost(effects, store.realmAddress),
  )
  console.log(`Realm address resolved to ${host}`)

  const dbEnv = { MYSQL_ROOT_PASSWORD: store.dbPassword }
  const conn = (name: string) =>
    `127.0.0.1;${dbPort};root;${store.dbPassword};${name}`

  const serverEnv: Record<string, string> = {
    AC_LOGIN_DATABASE_INFO: conn(dbName.auth),
    AC_WORLD_DATABASE_INFO: conn(dbName.world),
    AC_CHARACTER_DATABASE_INFO: conn(dbName.characters),
    AC_DATA_DIR: '/azerothcore/env/dist/data',
    AC_CONSOLE_ENABLE: '0',
  }

  const realmSql =
    `UPDATE ${dbName.auth}.realmlist ` +
    `SET address='${host}', localAddress='${host}', ` +
    `port=${worldPort}, name='${store.realmName.replace(/'/g, "''")}' ` +
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

  return sdk.Daemons.of(effects)
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
      ready: dbReady,
      requires: [],
    })
    .addOneshot('client-data', {
      subcontainer: await sdk.SubContainer.of(
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
      subcontainer: await sdk.SubContainer.of(
        effects,
        { imageId: 'db-import' },
        null,
        'db-import-sub',
      ),
      exec: { command: DB_IMPORT_CMD, env: serverEnv },
      requires: ['database'],
    })
    .addOneshot('realm-config', {
      subcontainer: await sdk.SubContainer.of(
        effects,
        { imageId: 'database' },
        null,
        'realm-config-sub',
      ),
      exec: mysqlExec(store.dbPassword, realmSql),
      requires: ['db-import'],
    })
    .addDaemon('authserver', {
      subcontainer: await sdk.SubContainer.of(
        effects,
        { imageId: 'authserver' },
        null,
        'authserver-sub',
      ),
      exec: { command: sdk.useEntrypoint(), env: serverEnv },
      ready: authReady,
      requires: ['realm-config'],
    })
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
      ready: worldReady,
      requires: ['db-import', 'client-data'],
    })
})
