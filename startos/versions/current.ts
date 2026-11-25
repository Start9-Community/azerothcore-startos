import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '#playerbots:16.0.0:10',
  releaseNotes: {
    en_US: `- The game client data download is checked against a pinned checksum, and a download that doesn't match is refused.
- The auth and world servers connect to the database with their own account, limited to the AzerothCore databases.`,
    es_ES: `- La descarga de los datos del cliente del juego se comprueba con una suma de verificación fijada, y se rechaza una descarga que no coincida.
- Los servidores de autenticación y de mundo se conectan a la base de datos con su propia cuenta, limitada a las bases de datos de AzerothCore.`,
    de_DE: `- Der Download der Spiel-Client-Daten wird gegen eine festgelegte Prüfsumme geprüft, und ein abweichender Download wird abgelehnt.
- Auth- und Weltserver verbinden sich mit einem eigenen, auf die AzerothCore-Datenbanken beschränkten Konto mit der Datenbank.`,
    pl_PL: `- Pobierane dane klienta gry są sprawdzane względem przypiętej sumy kontrolnej, a niezgodne pobranie jest odrzucane.
- Serwery logowania i świata łączą się z bazą danych własnym kontem, ograniczonym do baz danych AzerothCore.`,
    fr_FR: `- Le téléchargement des données du client de jeu est vérifié par rapport à une somme de contrôle épinglée, et un téléchargement qui ne correspond pas est refusé.
- Les serveurs d'authentification et de monde se connectent à la base de données avec leur propre compte, limité aux bases de données AzerothCore.`,
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
}).satisfies('16.0.0:8')
