import { sdk } from '../sdk'
import { isPlayerbots } from '../variant'
import { createAccount } from './setup/createAccount'
import { getServerInfo } from './setup/getServerInfo'
import { setRealmAddress } from './setup/setRealmAddress'
import { configurePlayerbots } from './setup/configurePlayerbots'

const base = sdk.Actions.of()
  .addAction(getServerInfo)
  .addAction(setRealmAddress)
  .addAction(createAccount)

// The playerbots settings action only exists in the playerbots variant.
export const actions = isPlayerbots
  ? base.addAction(configurePlayerbots)
  : base
