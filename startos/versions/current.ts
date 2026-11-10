import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '#playerbots:16.0.0:9',
  releaseNotes: {
    en_US: `Game clients can now log in over the server's IPv6 addresses.`,
    es_ES: `Los clientes del juego ahora pueden iniciar sesión a través de las direcciones IPv6 del servidor.`,
    de_DE: `Spiel-Clients können sich jetzt über die IPv6-Adressen des Servers anmelden.`,
    pl_PL: `Klienty gry mogą teraz logować się przez adresy IPv6 serwera.`,
    fr_FR: `Les clients du jeu peuvent désormais s'authentifier via les adresses IPv6 du serveur.`,
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
