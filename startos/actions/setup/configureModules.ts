import { sdk } from '../../sdk'
import { i18n } from '../../i18n'
import { storeJson } from '../../fileModels/store.json'
import { MODULE_DEFAULTS } from '../../utils'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  autoRevive: Value.toggle({
    name: i18n('Auto-Revive (GM only)'),
    description: i18n(
      'Instantly revive GM accounts on death instead of releasing spirit. Affects GM accounts only; normal players are unaffected.',
    ),
    default: false,
  }),
  transmog: Value.toggle({
    name: i18n('Transmogrification'),
    description: i18n(
      'Adds a transmog NPC to change the appearance of your gear while keeping its stats.',
    ),
    default: false,
  }),
  learnSpells: Value.toggle({
    name: i18n('Auto-Learn Spells'),
    description: i18n(
      'Automatically learn class spells and ranks on level up, skipping class trainers.',
    ),
    default: false,
  }),
  individualXp: Value.toggle({
    name: i18n('Individual XP Rate'),
    description: i18n(
      'Let each player set their own XP rate (via in-game command) instead of a single server-wide rate.',
    ),
    default: false,
  }),
  aoeLoot: Value.toggle({
    name: i18n('AoE Loot'),
    description: i18n('Loot all nearby corpses at once with a single action.'),
    default: false,
  }),
  npcBuffer: Value.toggle({
    name: i18n('Buff NPC'),
    description: i18n(
      'Adds an NPC that applies common buffs on demand. Handy for solo/small groups missing buff classes.',
    ),
    default: false,
  }),
  npcEnchanter: Value.toggle({
    name: i18n('Enchanter NPC'),
    description: i18n(
      'Adds an NPC that applies enchants to your gear, without needing an enchanter.',
    ),
    default: false,
  }),
})

// Optional gameplay modules. Each is compiled into the image but off by default;
// this action flips the runtime config flags. Add more toggles here as modules
// are baked into Dockerfile.playerbots.
export const configureModules = sdk.Action.withInput(
  'configure-modules',
  async ({ effects }) => ({
    name: i18n('Modules'),
    description: i18n('Enable or disable optional gameplay modules'),
    warning: i18n('Saving restarts the server.'),
    allowedStatuses: 'any',
    group: i18n('Setup'),
    visibility: 'enabled',
  }),
  inputSpec,
  async ({ effects }) =>
    (await storeJson.read((s) => s.modules).once()) ?? MODULE_DEFAULTS,
  async ({ effects, input }) => {
    await storeJson.merge(effects, {
      modules: {
        autoRevive: input.autoRevive,
        transmog: input.transmog,
        learnSpells: input.learnSpells,
        individualXp: input.individualXp,
        aoeLoot: input.aoeLoot,
        npcBuffer: input.npcBuffer,
        npcEnchanter: input.npcEnchanter,
      },
    })
    await effects.restart()
    return {
      version: '1' as const,
      title: i18n('Modules Updated'),
      message: i18n('Module settings saved. The server is restarting.'),
      result: null,
    }
  },
)
