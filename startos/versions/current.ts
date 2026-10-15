import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '#playerbots:16.0.0:7',
  releaseNotes: {
    en_US: `- Warden is now off. It is an anti-cheat that has every client download and run a module sent by the server, which serves no purpose on a private realm.
- Database credentials are no longer passed on the command line, where any user with access to the server could read them from the process list.`,
    es_ES: `- Warden ahora está desactivado. Es un antitrampas que hace que cada cliente descargue y ejecute un módulo enviado por el servidor, lo cual no tiene sentido en un reino privado.
- Las credenciales de la base de datos ya no se pasan en la línea de comandos, donde cualquier usuario con acceso al servidor podía leerlas en la lista de procesos.`,
    de_DE: `- Warden ist jetzt deaktiviert. Dieses Anti-Cheat lässt jeden Client ein vom Server gesendetes Modul herunterladen und ausführen, was auf einem privaten Realm keinen Zweck hat.
- Die Datenbank-Anmeldedaten werden nicht mehr über die Befehlszeile übergeben, wo jeder Benutzer mit Zugriff auf den Server sie in der Prozessliste lesen konnte.`,
    pl_PL: `- Warden jest teraz wyłączony. To system antycheat, który każe każdemu klientowi pobrać i uruchomić moduł przesłany przez serwer, co na prywatnym realmie nie ma sensu.
- Dane uwierzytelniające bazy danych nie są już przekazywane w wierszu polecenia, gdzie każdy użytkownik z dostępem do serwera mógł je odczytać z listy procesów.`,
    fr_FR: `- Warden est désormais désactivé. Cet anti-triche fait télécharger et exécuter par chaque client un module envoyé par le serveur, ce qui n'a aucun intérêt sur un royaume privé.
- Les identifiants de la base de données ne sont plus transmis en ligne de commande, où tout utilisateur ayant accès au serveur pouvait les lire dans la liste des processus.`,
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
