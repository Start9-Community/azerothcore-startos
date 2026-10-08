import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '#playerbots:16.0.0:6',
  releaseNotes: {
    en_US: `- Create Account's GM Level explains each level, and the account name and password fields say they are not case-sensitive.
- Set Realm Address's field points to the Auth Server interface for this server's addresses.
- Playerbots Settings explains how the minimum and maximum set the number of bots online.`,
    es_ES: `- El nivel de GM de Create Account explica cada nivel, y los campos de nombre de cuenta y contraseña indican que no distinguen mayúsculas de minúsculas.
- El campo de Set Realm Address remite a la interfaz Auth Server para ver las direcciones de este servidor.
- Playerbots Settings explica cómo el mínimo y el máximo determinan el número de bots conectados.`,
    de_DE: `- Die GM-Stufe in Create Account erklärt jede Stufe, und die Felder für Kontoname und Passwort geben an, dass Groß- und Kleinschreibung keine Rolle spielt.
- Das Feld von Set Realm Address verweist für die Adressen dieses Servers auf die Schnittstelle Auth Server.
- Playerbots Settings erklärt, wie Minimum und Maximum die Zahl der angemeldeten Bots bestimmen.`,
    pl_PL: `- Poziom GM w Create Account wyjaśnia każdy poziom, a pola nazwy konta i hasła informują, że wielkość liter nie ma znaczenia.
- Pole Set Realm Address odsyła do interfejsu Auth Server, gdzie widać adresy tego serwera.
- Playerbots Settings wyjaśnia, jak minimum i maksimum wyznaczają liczbę botów online.`,
    fr_FR: `- Le niveau GM de Create Account explique chaque niveau, et les champs du nom de compte et du mot de passe indiquent qu'ils ne sont pas sensibles à la casse.
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
