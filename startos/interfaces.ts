import { sdk } from './sdk'
import { i18n } from './i18n'
import { authPort, worldPort } from './utils'

// WoW 3.3.5 uses a raw TCP protocol (not HTTP), so it cannot run over Tor.
// Both interfaces are p2p / LAN+clearnet only, like a game server.
export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  // Auth server — the address players put in realmlist.wtf.
  const authMulti = sdk.MultiHost.of(effects, 'auth-multi')
  const authOrigin = await authMulti.bindPort(authPort, {
    protocol: null,
    preferredExternalPort: authPort,
    addSsl: null,
    secure: { ssl: false },
  })
  const authInterface = sdk.createInterface(effects, {
    name: i18n('Auth Server'),
    id: 'authserver',
    description: i18n('WoW login server. Point realmlist.wtf at this address.'),
    type: 'p2p',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })
  const authReceipt = await authOrigin.export([authInterface])

  // World server — clients connect here after auth hands off the realm.
  const worldMulti = sdk.MultiHost.of(effects, 'world-multi')
  const worldOrigin = await worldMulti.bindPort(worldPort, {
    protocol: null,
    preferredExternalPort: worldPort,
    addSsl: null,
    secure: { ssl: false },
  })
  const worldInterface = sdk.createInterface(effects, {
    name: i18n('World Server'),
    id: 'worldserver',
    description: i18n('WoW game world server'),
    type: 'p2p',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })
  const worldReceipt = await worldOrigin.export([worldInterface])

  return [authReceipt, worldReceipt]
})
