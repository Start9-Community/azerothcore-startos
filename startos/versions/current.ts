import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '#playerbots:16.0.0:6',
  releaseNotes: {
    en_US: `Updates the mod-playerbots fork and the Playerbots module to their August 2026 revisions, picking up three months of bot behavior and core fixes. Upstream changed the pathfinding data format, so the game client data moves to v20 and is re-downloaded once on the next start. Also updates the Transmogrification and AoE Loot modules and MySQL.

- Create Account's GM Level explains each level, and the account name and password fields say they are not case-sensitive.
- Set Realm Address's field points to the Auth Server interface for this server's addresses.
- Playerbots Settings explains how the minimum and maximum set the number of bots online.`,
    es_ES: `Actualiza el fork de mod-playerbots y el módulo Playerbots a sus revisiones de agosto de 2026, incorporando tres meses de correcciones del comportamiento de los bots y del núcleo. El formato de los datos de navegación cambió en el proyecto original, por lo que los datos del cliente pasan a la v20 y se descargan de nuevo una vez al iniciar. También actualiza los módulos Transmogrification y AoE Loot y MySQL.

- El nivel de GM de Create Account explica cada nivel, y los campos de nombre de cuenta y contraseña indican que no distinguen mayúsculas de minúsculas.
- El campo de Set Realm Address remite a la interfaz Auth Server para ver las direcciones de este servidor.
- Playerbots Settings explica cómo el mínimo y el máximo determinan el número de bots conectados.`,
    de_DE: `Aktualisiert den mod-playerbots-Fork und das Playerbots-Modul auf ihre Stände von August 2026 und bringt drei Monate an Korrekturen am Bot-Verhalten und am Kern mit. Da sich das Format der Wegfindungsdaten stromaufwärts geändert hat, wechseln die Client-Daten auf v20 und werden beim nächsten Start einmalig neu heruntergeladen. Aktualisiert außerdem die Module Transmogrification und AoE Loot sowie MySQL.

- Die GM-Stufe in Create Account erklärt jede Stufe, und die Felder für Kontoname und Passwort geben an, dass Groß- und Kleinschreibung keine Rolle spielt.
- Das Feld von Set Realm Address verweist für die Adressen dieses Servers auf die Schnittstelle Auth Server.
- Playerbots Settings erklärt, wie Minimum und Maximum die Zahl der angemeldeten Bots bestimmen.`,
    pl_PL: `Aktualizuje fork mod-playerbots oraz moduł Playerbots do wersji z sierpnia 2026, wprowadzając trzy miesiące poprawek zachowania botów i rdzenia. Format danych nawigacji zmienił się w projekcie źródłowym, więc dane klienta przechodzą na v20 i zostaną jednorazowo pobrane ponownie przy następnym uruchomieniu. Aktualizuje także moduły Transmogrification i AoE Loot oraz MySQL.

- Poziom GM w Create Account wyjaśnia każdy poziom, a pola nazwy konta i hasła informują, że wielkość liter nie ma znaczenia.
- Pole Set Realm Address odsyła do interfejsu Auth Server, gdzie widać adresy tego serwera.
- Playerbots Settings wyjaśnia, jak minimum i maksimum wyznaczają liczbę botów online.`,
    fr_FR: `Met à jour le fork mod-playerbots et le module Playerbots vers leurs révisions d'août 2026, apportant trois mois de corrections du comportement des bots et du cœur. Le format des données de navigation ayant changé en amont, les données du client passent en v20 et sont retéléchargées une fois au prochain démarrage. Met également à jour les modules Transmogrification et AoE Loot ainsi que MySQL.

- Le niveau GM de Create Account explique chaque niveau, et les champs du nom de compte et du mot de passe indiquent qu'ils ne sont pas sensibles à la casse.
- Le champ de Set Realm Address renvoie à l'interface Auth Server pour les adresses de ce serveur.
- Playerbots Settings explique comment le minimum et le maximum fixent le nombre de bots connectés.`,
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
}).satisfies('16.0.0:5')
