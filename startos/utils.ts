// Auth server, WoW client connects here first for login + realm list.
export const authPort = 3724

// World server, the actual game server the client connects to after auth.
export const worldPort = 8085

// MySQL, internal only, never exposed as an interface.
export const dbPort = 3306

// The core databases AzerothCore uses. The Playerbots flavor adds a fourth
// (acore_playerbots) for the mod-playerbots fork.
export const dbName = {
  auth: 'acore_auth',
  world: 'acore_world',
  characters: 'acore_characters',
  playerbots: 'acore_playerbots',
} as const

// Default playerbots settings. Referenced by the store schema fallback and the
// configure-playerbots action prefill.
export const PLAYERBOTS_DEFAULTS = {
  enabled: true,
  minBots: 20,
  maxBots: 40,
} as const

import { T } from '@start9labs/start-sdk'
import { sdk } from './sdk'

// A realm address must be a plain IPv4/IPv6 literal or DNS hostname. Reject
// anything outside this charset so it can't break out of the SQL string it's
// interpolated into in main.ts.
const realmAddressPattern = /^[A-Za-z0-9.:-]+$/

export function validateRealmAddress(value: string): string {
  const trimmed = value.trim()
  if (!realmAddressPattern.test(trimmed)) {
    throw new Error(
      'Invalid realm address: only letters, digits, dots, colons, and hyphens are allowed.',
    )
  }
  return trimmed
}

// Escape a string for safe interpolation into a single-quoted MySQL literal:
// escape backslashes first, then double single quotes (MySQL's documented
// string escaping) so it can't break out of the literal passed to `mysql -e`.
export function sqlString(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "''")}'`
}

// Resolve the realm address: an explicit user choice (store.realmAddress) wins;
// otherwise auto-pick a non-local IPv4. With multiple networks (LAN + tunnel)
// the auto-pick may be wrong, that's what the override is for.
export async function resolveRealmHost(
  effects: T.Effects,
  override?: string,
): Promise<string> {
  const chosen = override?.trim()
  if (chosen) return chosen
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
