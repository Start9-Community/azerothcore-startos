import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const v16_0_0_0 = VersionInfo.of({
  version: '#playerbots:16.0.0:0',
  releaseNotes: {
    en_US:
      'AzerothCore Playerbots for StartOS: the mod-playerbots fork with AI players on by default and a Playerbots Settings action to disable or tune them. Shares the `azerothcore` package id with the vanilla flavor, so you can switch flavors in place keeping your world and characters.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
    // Cross-flavor switch from the vanilla flavor (unflavored `16.x` versions).
    // No data movement is needed: the auth/world/character databases live in the
    // shared `main` volume and the fork's db-import applies its own schema on the
    // next boot (and creates acore_playerbots). Declared so StartOS offers the
    // in-place flavor switch.
    other: {
      ['^16']: {
        // vanilla -> playerbots
        up: async ({ effects }) => {},
        // playerbots -> vanilla
        down: async ({ effects }) => {},
      },
    },
  },
}).satisfies('16.0.0:0')
