import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '16.0.0:4',
  releaseNotes: {
    en_US:
      'Escapes backslashes in the realm name when the realmlist is written. Only single quotes were escaped before, so a realm name containing a backslash could corrupt the statement that registers the realm.',
    es_ES:
      'Escapa las barras invertidas en el nombre del reino al escribir la lista de reinos. Antes solo se escapaban las comillas simples, por lo que un nombre de reino con una barra invertida podía corromper la instrucción que registra el reino.',
    de_DE:
      'Maskiert Backslashes im Realm-Namen beim Schreiben der Realmliste. Zuvor wurden nur einfache Anführungszeichen maskiert, sodass ein Realm-Name mit einem Backslash die Anweisung zur Registrierung des Realms beschädigen konnte.',
    pl_PL:
      'Escapuje ukośniki odwrotne w nazwie realmu podczas zapisywania listy realmów. Wcześniej escapowane były tylko apostrofy, więc nazwa realmu zawierająca ukośnik odwrotny mogła uszkodzić instrukcję rejestrującą realm.',
    fr_FR:
      "Échappe les barres obliques inverses dans le nom du royaume lors de l'écriture de la liste des royaumes. Seules les apostrophes étaient échappées auparavant, si bien qu'un nom de royaume contenant une barre oblique inverse pouvait corrompre l'instruction qui enregistre le royaume.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
