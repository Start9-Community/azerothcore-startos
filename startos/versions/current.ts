import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '#playerbots:16.0.0:8',
  releaseNotes: {
    en_US: `Stops trusting certificates from a compromised certificate authority (eMudhra).`,
    es_ES: `Deja de confiar en los certificados de una autoridad de certificación comprometida (eMudhra).`,
    de_DE: `Vertraut Zertifikaten einer kompromittierten Zertifizierungsstelle (eMudhra) nicht mehr.`,
    pl_PL: `Przestaje ufać certyfikatom przejętego urzędu certyfikacji (eMudhra).`,
    fr_FR: `Ne fait plus confiance aux certificats d'une autorité de certification compromise (eMudhra).`,
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
}).satisfies('16.0.0:7')
