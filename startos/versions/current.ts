import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '16.0.0:8',
  releaseNotes: {
    en_US: `- The game client data download is checked against a pinned checksum, and a download that doesn't match is refused.
- The auth and world servers connect to the database with their own account, limited to the AzerothCore databases.
- After switching from the Playerbots flavor, the game client data this flavor needs is downloaded on the next start.`,
    es_ES: `- La descarga de los datos del cliente del juego se comprueba con una suma de verificación fijada, y se rechaza una descarga que no coincida.
- Los servidores de autenticación y de mundo se conectan a la base de datos con su propia cuenta, limitada a las bases de datos de AzerothCore.
- Tras cambiar desde la variante Playerbots, los datos del cliente del juego que necesita esta variante se descargan en el siguiente inicio.`,
    de_DE: `- Der Download der Spiel-Client-Daten wird gegen eine festgelegte Prüfsumme geprüft, und ein abweichender Download wird abgelehnt.
- Auth- und Weltserver verbinden sich mit einem eigenen, auf die AzerothCore-Datenbanken beschränkten Konto mit der Datenbank.
- Nach einem Wechsel von der Playerbots-Variante werden die Spiel-Client-Daten, die diese Variante benötigt, beim nächsten Start heruntergeladen.`,
    pl_PL: `- Pobierane dane klienta gry są sprawdzane względem przypiętej sumy kontrolnej, a niezgodne pobranie jest odrzucane.
- Serwery logowania i świata łączą się z bazą danych własnym kontem, ograniczonym do baz danych AzerothCore.
- Po przejściu z wariantu Playerbots dane klienta gry potrzebne temu wariantowi są pobierane przy następnym uruchomieniu.`,
    fr_FR: `- Le téléchargement des données du client de jeu est vérifié par rapport à une somme de contrôle épinglée, et un téléchargement qui ne correspond pas est refusé.
- Les serveurs d'authentification et de monde se connectent à la base de données avec leur propre compte, limité aux bases de données AzerothCore.
- Après un passage depuis la variante Playerbots, les données du client de jeu nécessaires à cette variante sont téléchargées au prochain démarrage.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
