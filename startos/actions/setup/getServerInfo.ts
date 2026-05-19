import { sdk } from '../../sdk'
import { i18n } from '../../i18n'
import { storeJson } from '../../fileModels/store.json'
import { authPort, resolveRealmHost } from '../../utils'

// Shows the player how to connect: the realmlist address + port.
export const getServerInfo = sdk.Action.withoutInput(
  'get-server-info',
  async ({ effects }) => ({
    name: i18n('Connection Info'),
    description: i18n('How to connect your WoW 3.3.5a client to this realm'),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Setup'),
    visibility: 'enabled',
  }),
  async ({ effects }) => {
    const override = (await storeJson.read((s) => s.realmAddress).once()) ?? ''
    const host = await resolveRealmHost(effects, override)

    return {
      version: '1' as const,
      title: i18n('Connection Info'),
      message: i18n(
        'Edit Data/enUS/realmlist.wtf in your 3.3.5a client and set the realmlist to the address below, then log in.',
      ),
      result: {
        type: 'group' as const,
        value: [
          {
            name: 'realmlist.wtf',
            description: null,
            type: 'single' as const,
            value: `set realmlist ${host}`,
            copyable: true,
            qr: false,
            masked: false,
          },
          {
            name: i18n('Auth Port'),
            description: null,
            type: 'single' as const,
            value: authPort.toString(),
            copyable: false,
            qr: false,
            masked: false,
          },
          {
            name: i18n('Client Version'),
            description: null,
            type: 'single' as const,
            value: '3.3.5a (build 12340)',
            copyable: false,
            qr: false,
            masked: false,
          },
        ],
      },
    }
  },
)
