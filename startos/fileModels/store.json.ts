import { z, FileHelper } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { PLAYERBOTS_DEFAULTS } from '../utils'

export const defaultRealmName = 'AzerothCore'

// Package-internal state. Written only by our init + actions, so .const()
// gives automatic restart-on-change.
const storeConfigSchema = z.object({
  // Generated once at install, root password for the bundled MySQL.
  dbPassword: z.string().catch(''),
  // Display name of the realm shown in the client's realm list.
  realmName: z.string().catch(defaultRealmName),
  // Whether the client-data download has completed at least once.
  clientDataReady: z.boolean().catch(false),
  // The address written into the realm list (what clients connect to for the
  // world server). Empty = auto-resolve a non-local IPv4. Set via the
  // "Set Realm Address" action when a box has multiple networks.
  realmAddress: z.string().catch(''),
  // Playerbots settings (playerbots variant only). Enabled by default, turning
  // it off makes the server behave like vanilla. Ignored by the vanilla build.
  playerbots: z
    .object({
      enabled: z.boolean().catch(PLAYERBOTS_DEFAULTS.enabled),
      minBots: z.number().int().catch(PLAYERBOTS_DEFAULTS.minBots),
      maxBots: z.number().int().catch(PLAYERBOTS_DEFAULTS.maxBots),
    })
    .catch({ ...PLAYERBOTS_DEFAULTS }),
})

export type StoreConfig = z.infer<typeof storeConfigSchema>

export const storeJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: 'start9/store.json' },
  storeConfigSchema,
)
