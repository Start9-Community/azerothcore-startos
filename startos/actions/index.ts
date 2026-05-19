import { sdk } from '../sdk'
import { createAccount } from './setup/createAccount'
import { getServerInfo } from './setup/getServerInfo'
import { setRealmAddress } from './setup/setRealmAddress'

export const actions = sdk.Actions.of()
  .addAction(getServerInfo)
  .addAction(setRealmAddress)
  .addAction(createAccount)
