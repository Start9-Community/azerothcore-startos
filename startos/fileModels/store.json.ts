import { z, FileHelper } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { MODULE_DEFAULTS, PLAYERBOTS_DEFAULTS } from '../utils'

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
  // Playerbots settings. Enabled by default; turning it off makes the server
  // behave like the vanilla flavor.
  playerbots: z
    .object({
      enabled: z.boolean().catch(PLAYERBOTS_DEFAULTS.enabled),
      minBots: z.number().int().catch(PLAYERBOTS_DEFAULTS.minBots),
      maxBots: z.number().int().catch(PLAYERBOTS_DEFAULTS.maxBots),
    })
    .catch({ ...PLAYERBOTS_DEFAULTS }),
  // Optional gameplay modules (compiled in, off by default). Toggled via the
  // Modules action; behavior applies to GM accounts only.
  modules: z
    .object({
      autoRevive: z.boolean().catch(MODULE_DEFAULTS.autoRevive),
      transmog: z.boolean().catch(MODULE_DEFAULTS.transmog),
      learnSpells: z.boolean().catch(MODULE_DEFAULTS.learnSpells),
      individualXp: z.boolean().catch(MODULE_DEFAULTS.individualXp),
      aoeLoot: z.boolean().catch(MODULE_DEFAULTS.aoeLoot),
      npcBuffer: z.boolean().catch(MODULE_DEFAULTS.npcBuffer),
      npcEnchanter: z.boolean().catch(MODULE_DEFAULTS.npcEnchanter),
    })
    .catch({ ...MODULE_DEFAULTS }),
})

export type StoreConfig = z.infer<typeof storeConfigSchema>

export const storeJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: 'start9/store.json' },
  storeConfigSchema,
)
