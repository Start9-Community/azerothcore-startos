import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const v16_0_0_0 = VersionInfo.of({
  version: '16.0.0:0',
  releaseNotes: {
    en_US:
      'AzerothCore for StartOS: auth + world servers, MySQL, automatic client-data download, and a realm-address picker. Account creation writes directly to the database via SRP6 (no SOAP). Shares the `azerothcore` package id with the Playerbots flavor, so you can switch flavors in place.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
