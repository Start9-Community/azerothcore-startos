import { T } from '@start9labs/start-sdk'
import { createConnection, Connection } from 'mysql2/promise'
import { storeJson } from './fileModels/store.json'
import { dbPort } from './utils'

// Connect to the running MySQL daemon from an action context. Actions don't
// share the daemon's loopback, so (as the Minecraft package does for RCON) we
// try 127.0.0.1, then the container IP, then the OS IP.
export async function dbConnect(
  effects: T.Effects,
  database?: string,
): Promise<Connection> {
  const password = (await storeJson.read((s) => s.dbPassword).once()) ?? ''
  const hosts = ['127.0.0.1']
  const [containerIp, osIp] = await Promise.all([
    effects.getContainerIp({}).catch(() => null),
    effects.getOsIp().catch(() => null),
  ])
  for (const h of [containerIp, osIp]) {
    if (h && !hosts.includes(h)) hosts.push(h)
  }

  let lastErr: unknown
  for (const host of hosts) {
    try {
      return await createConnection({
        host,
        port: dbPort,
        user: 'root',
        password,
        database,
        connectTimeout: 5_000,
      })
    } catch (e) {
      lastErr = e
    }
  }
  throw new Error(
    `Could not connect to the database. ${
      lastErr instanceof Error ? lastErr.message : String(lastErr)
    }`,
  )
}
