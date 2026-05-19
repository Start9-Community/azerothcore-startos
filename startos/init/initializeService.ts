import { utils } from '@start9labs/start-sdk'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'

export const initializeService = sdk.setupOnInit(async (effects, kind) => {
  // Seed defaults on every init so new schema defaults apply on upgrade.
  await storeJson.merge(effects, {})

  if (kind !== 'install') return

  // Generate the MySQL root password once at install.
  await storeJson.merge(effects, {
    dbPassword: utils.getDefaultString({
      charset: 'a-z,A-Z,0-9',
      len: 32,
    }),
  })
})
