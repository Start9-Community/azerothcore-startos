import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const v_1_1_0 = VersionInfo.of({
  version: '1.1.0:0',
  releaseNotes: {
    en_US:
      'Add Playerbots edition (azerothcore-playerbots): the mod-playerbots fork compiled from source, with AI players on by default and a Playerbots Settings action to disable or tune them. Vanilla edition unchanged.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
