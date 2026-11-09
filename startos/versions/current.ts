import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '16.0.0:8',
  releaseNotes: {
    en_US: `Game clients can now connect over the server's IPv6 addresses.`,
    es_ES: `Los clientes del juego ahora pueden conectarse a través de las direcciones IPv6 del servidor.`,
    de_DE: `Spiel-Clients können sich jetzt über die IPv6-Adressen des Servers verbinden.`,
    pl_PL: `Klienty gry mogą teraz łączyć się przez adresy IPv6 serwera.`,
    fr_FR: `Les clients du jeu peuvent désormais se connecter via les adresses IPv6 du serveur.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
