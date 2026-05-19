// Auth server — WoW client connects here first for login + realm list.
export const authPort = 3724

// World server — the actual game server the client connects to after auth.
export const worldPort = 8085

// SOAP API on the worldserver — used for remote console commands
// (account creation, GM level, etc.). Bound to localhost only.
export const soapPort = 7878

// MySQL — internal only, never exposed as an interface.
export const dbPort = 3306

// Database connection constants (internal localhost between subcontainers).
export const dbHost = '127.0.0.1'
export const dbUser = 'root'
// Generated once at install in initializeService and stored in store.json.
export const dbName = {
  auth: 'acore_auth',
  world: 'acore_world',
  characters: 'acore_characters',
} as const

import { T } from '@start9labs/start-sdk'
import { sdk } from './sdk'

// Resolve the realm address: an explicit user choice (store.realmAddress) wins;
// otherwise auto-pick a non-local IPv4. With multiple networks (LAN + tunnel)
// the auto-pick may be wrong — that's what the override is for.
export async function resolveRealmHost(
  effects: T.Effects,
  override?: string,
): Promise<string> {
  if (override && override.trim()) return override.trim()
  const iface = await sdk.serviceInterface.getOwn(effects, 'authserver').once()
  const addr = iface?.addressInfo
  if (!addr) return '127.0.0.1'
  const ipv4s = addr.nonLocal
    .filter({ kind: 'ipv4' })
    .hostnames.map((h) => h.hostname)
  // Prefer a typical home-LAN address (192.168.x) over VPN/tunnel ranges
  // (10.x, 172.16-31.x) that the game client usually can't reach.
  const homeLan = ipv4s.find((h) => h.startsWith('192.168.'))
  if (homeLan) return homeLan
  if (ipv4s[0]) return ipv4s[0]
  const any = addr.nonLocal.hostnames[0]?.hostname
  return any ?? '127.0.0.1'
}

// All reachable hostnames for the auth interface (for display + selection).
export async function listRealmHosts(effects: T.Effects): Promise<string[]> {
  const iface = await sdk.serviceInterface.getOwn(effects, 'authserver').once()
  const addr = iface?.addressInfo
  if (!addr) return []
  return addr.hostnames.map((h) => h.hostname)
}
