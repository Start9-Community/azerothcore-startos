import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '#playerbots:16.0.0:2',
  releaseNotes: {
    en_US: 'Internal updates (start-sdk 2.0.x)',
    es_ES: 'Actualizaciones internas (start-sdk 2.0.x)',
    de_DE: 'Interne Aktualisierungen (start-sdk 2.0.x)',
    pl_PL: 'Aktualizacje wewnętrzne (start-sdk 2.0.x)',
    fr_FR: 'Mises à jour internes (start-sdk 2.0.x)',
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
        // playerbots -> vanilla: no-op by design. The acore_playerbots database
        // and any bot characters in acore_characters persist; the vanilla image
        // simply ignores them. They can be removed manually if desired.
        down: async ({ effects }) => {},
      },
    },
  },
}).satisfies('16.0.0:1')
