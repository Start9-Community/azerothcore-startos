import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '16.0.0:5',
  releaseNotes: {
    en_US: `Escapes backslashes in the realm name when the realmlist is written. Only single quotes were escaped before, so a realm name containing a backslash could corrupt the statement that registers the realm.

- Create Account's GM Level explains each level, and the account name and password fields say they are not case-sensitive.
- Set Realm Address's field points to the Auth Server interface for this server's addresses.`,
    es_ES: `Escapa las barras invertidas en el nombre del reino al escribir la lista de reinos. Antes solo se escapaban las comillas simples, por lo que un nombre de reino con una barra invertida podía corromper la instrucción que registra el reino.

- El nivel de GM de Create Account explica cada nivel, y los campos de nombre de cuenta y contraseña indican que no distinguen mayúsculas de minúsculas.
- El campo de Set Realm Address remite a la interfaz Auth Server para ver las direcciones de este servidor.`,
    de_DE: `Maskiert Backslashes im Realm-Namen beim Schreiben der Realmliste. Zuvor wurden nur einfache Anführungszeichen maskiert, sodass ein Realm-Name mit einem Backslash die Anweisung zur Registrierung des Realms beschädigen konnte.

- Die GM-Stufe in Create Account erklärt jede Stufe, und die Felder für Kontoname und Passwort geben an, dass Groß- und Kleinschreibung keine Rolle spielt.
- Das Feld von Set Realm Address verweist für die Adressen dieses Servers auf die Schnittstelle Auth Server.`,
    pl_PL: `Escapuje ukośniki odwrotne w nazwie realmu podczas zapisywania listy realmów. Wcześniej escapowane były tylko apostrofy, więc nazwa realmu zawierająca ukośnik odwrotny mogła uszkodzić instrukcję rejestrującą realm.

- Poziom GM w Create Account wyjaśnia każdy poziom, a pola nazwy konta i hasła informują, że wielkość liter nie ma znaczenia.
- Pole Set Realm Address odsyła do interfejsu Auth Server, gdzie widać adresy tego serwera.`,
    fr_FR: `Échappe les barres obliques inverses dans le nom du royaume lors de l'écriture de la liste des royaumes. Seules les apostrophes étaient échappées auparavant, si bien qu'un nom de royaume contenant une barre oblique inverse pouvait corrompre l'instruction qui enregistre le royaume.

- Le niveau GM de Create Account explique chaque niveau, et les champs du nom de compte et du mot de passe indiquent qu'ils ne sont pas sensibles à la casse.
- Le champ de Set Realm Address renvoie à l'interface Auth Server pour les adresses de ce serveur.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
