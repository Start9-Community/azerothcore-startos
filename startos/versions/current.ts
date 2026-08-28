import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '#playerbots:16.0.0:5',
  releaseNotes: {
    en_US:
      'Updates the mod-playerbots fork and the Playerbots module to their August 2026 revisions, picking up three months of bot behavior and core fixes. Upstream changed the pathfinding data format, so the game client data moves to v20 and is re-downloaded once on the next start. Also updates the Transmogrification and AoE Loot modules and MySQL.',
    es_ES:
      'Actualiza el fork de mod-playerbots y el módulo Playerbots a sus revisiones de agosto de 2026, incorporando tres meses de correcciones del comportamiento de los bots y del núcleo. El formato de los datos de navegación cambió en el proyecto original, por lo que los datos del cliente pasan a la v20 y se descargan de nuevo una vez al iniciar. También actualiza los módulos Transmogrification y AoE Loot y MySQL.',
    de_DE:
      'Aktualisiert den mod-playerbots-Fork und das Playerbots-Modul auf ihre Stände von August 2026 und bringt drei Monate an Korrekturen am Bot-Verhalten und am Kern mit. Da sich das Format der Wegfindungsdaten stromaufwärts geändert hat, wechseln die Client-Daten auf v20 und werden beim nächsten Start einmalig neu heruntergeladen. Aktualisiert außerdem die Module Transmogrification und AoE Loot sowie MySQL.',
    pl_PL:
      'Aktualizuje fork mod-playerbots oraz moduł Playerbots do wersji z sierpnia 2026, wprowadzając trzy miesiące poprawek zachowania botów i rdzenia. Format danych nawigacji zmienił się w projekcie źródłowym, więc dane klienta przechodzą na v20 i zostaną jednorazowo pobrane ponownie przy następnym uruchomieniu. Aktualizuje także moduły Transmogrification i AoE Loot oraz MySQL.',
    fr_FR:
      "Met à jour le fork mod-playerbots et le module Playerbots vers leurs révisions d'août 2026, apportant trois mois de corrections du comportement des bots et du cœur. Le format des données de navigation ayant changé en amont, les données du client passent en v20 et sont retéléchargées une fois au prochain démarrage. Met également à jour les modules Transmogrification et AoE Loot ainsi que MySQL.",
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
}).satisfies('16.0.0:4')
