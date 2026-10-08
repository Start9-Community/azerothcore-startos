import { sdk } from '../../sdk'
import { i18n } from '../../i18n'
import { storeJson } from '../../fileModels/store.json'
import { PLAYERBOTS_DEFAULTS } from '../../utils'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  enabled: Value.toggle({
    name: i18n('Enable Playerbots'),
    description: i18n(
      'Populate the world with AI players. Turn off for a vanilla (empty) server.',
    ),
    default: true,
  }),
  minBots: Value.number({
    name: i18n('Minimum Random Bots'),
    description: i18n(
      'The number of bots online is a random pick between this and the maximum, picked again from time to time. Set both to the same value for a fixed population.',
    ),
    required: true,
    default: 20,
    integer: true,
    min: 0,
    max: 1000,
  }),
  maxBots: Value.number({
    name: i18n('Maximum Random Bots'),
    description: i18n(
      'The top of that range. Every bot is a logged-in character on the world server, so lower this first if the server is short of memory.',
    ),
    required: true,
    default: 40,
    integer: true,
    min: 0,
    max: 1000,
  }),
})

// Bots are on by default; turning them off makes the server behave like vanilla.
export const configurePlayerbots = sdk.Action.withInput(
  'configure-playerbots',
  async ({ effects }) => ({
    name: i18n('Playerbots Settings'),
    description: i18n('Enable/disable AI players and tune the bot population'),
    warning: i18n('Saving restarts the server.'),
    allowedStatuses: 'any',
    group: i18n('Setup'),
    visibility: 'enabled',
  }),
  inputSpec,
  async ({ effects }) =>
    (await storeJson.read((s) => s.playerbots).once()) ?? PLAYERBOTS_DEFAULTS,
  async ({ effects, input }) => {
    const minBots = Math.min(input.minBots, input.maxBots)
    const maxBots = Math.max(input.minBots, input.maxBots)
    const swapped = minBots !== input.minBots || maxBots !== input.maxBots
    await storeJson.merge(effects, {
      playerbots: { enabled: input.enabled, minBots, maxBots },
    })
    await effects.restart()
    const base = input.enabled
      ? i18n('Bots enabled. The server is restarting.')
      : i18n('Bots disabled, vanilla mode. The server is restarting.')
    return {
      version: '1' as const,
      title: i18n('Playerbots Settings Updated'),
      message: swapped
        ? `${base} ${i18n('Minimum was higher than maximum, so the values were swapped.')}`
        : base,
      result: null,
    }
  },
)
