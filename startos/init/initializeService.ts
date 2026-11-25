import { utils } from '@start9labs/start-sdk'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'

export const initializeService = sdk.setupOnInit(async (effects, kind) => {
  // Seed defaults on every init so new schema defaults apply on upgrade.
  await storeJson.merge(effects, {})

  const password = () =>
    utils.getDefaultString({ charset: 'a-z,A-Z,0-9', len: 32 })

  // Generate the MySQL root password once at install.
  if (kind === 'install')
    await storeJson.merge(effects, { dbPassword: password() })

  // Every init, not install alone: an install updated or switched from the
  // other flavor's older build has none, and no migration of ours runs there.
  if (!(await storeJson.read((s) => s.serverDbPassword).once()))
    await storeJson.merge(effects, { serverDbPassword: password() })
})
