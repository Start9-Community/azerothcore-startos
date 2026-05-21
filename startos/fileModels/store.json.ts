import { z, FileHelper } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

export const defaultRealmName = 'AzerothCore'

// Package-internal state. Written only by our init + actions, so .const()
// gives automatic restart-on-change.
const storeConfigSchema = z.object({
  // Generated once at install, root password for the bundled MySQL.
  dbPassword: z.string().catch(''),
  // Display name of the realm shown in the client's realm list.
  realmName: z.string().catch(defaultRealmName),
  // The address written into the realm list (what clients connect to for the
  // world server). Empty = auto-resolve a non-local IPv4. Set via the
  // "Set Realm Address" action when a box has multiple networks.
  realmAddress: z.string().catch(''),
})

export type StoreConfig = z.infer<typeof storeConfigSchema>

export const storeJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: 'start9/store.json' },
  storeConfigSchema,
)
