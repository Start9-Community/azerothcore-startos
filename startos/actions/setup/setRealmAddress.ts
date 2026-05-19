import { sdk } from '../../sdk'
import { i18n } from '../../i18n'
import { storeJson } from '../../fileModels/store.json'
import { resolveRealmHost } from '../../utils'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  realmAddress: Value.text({
    name: i18n('Realm Address'),
    description: i18n(
      'The address (LAN IP or hostname) game clients connect to. For home LAN play use your local 192.168.x.x address. Check the Connection Info action to see all available addresses.',
    ),
    required: true,
    default: null,
  }),
})

// Lets the user pick which address clients use to reach the world server.
// Needed when a box has multiple networks (LAN + tunnel), where auto-resolve
// can pick an address the game client can't reach.
export const setRealmAddress = sdk.Action.withInput(
  'set-realm-address',
  async ({ effects }) => ({
    name: i18n('Set Realm Address'),
    description: i18n(
      'Choose which address clients use to connect to the world server',
    ),
    warning: i18n('Changing this restarts the server.'),
    allowedStatuses: 'any',
    group: i18n('Setup'),
    visibility: 'enabled',
  }),
  inputSpec,
  // Prefill with the current choice, or the auto-resolved address.
  async ({ effects }) => {
    const current = (await storeJson.read((s) => s.realmAddress).once()) ?? ''
    const value = current || (await resolveRealmHost(effects))
    return { realmAddress: value }
  },
  async ({ effects, input }) => {
    await storeJson.merge(effects, { realmAddress: input.realmAddress.trim() })
    await effects.restart()
    return {
      version: '1' as const,
      title: i18n('Realm Address Updated'),
      message: i18n(
        'The server is restarting. Set your client realmlist.wtf to this same address.',
      ),
      result: {
        type: 'single' as const,
        value: `set realmlist ${input.realmAddress.trim()}`,
        copyable: true,
        qr: false,
        masked: false,
      },
    }
  },
)
