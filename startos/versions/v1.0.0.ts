import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const v_1_0_0 = VersionInfo.of({
  version: '1.0.0:1',
  releaseNotes: {
    en_US:
      'Account creation via direct DB + SRP6 (no SOAP); disable noisy AC console; realm address picker.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
