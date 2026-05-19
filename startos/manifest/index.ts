import { setupManifest } from '@start9labs/start-sdk'
import { longDescription, shortDescription } from './i18n'

// AzerothCore publishes official prebuilt images under the `acore` Docker Hub
// org (acore/ac-wotlk-*). We reference them directly — no custom build/hosting
// required for vanilla AzerothCore.
//
// Pin to a specific tag (not `master`) for reproducible installs. Update the
// tag in a new version entry under startos/versions/ when bumping.
const ACORE_TAG = '16.0.0-dev' // TODO: pin to an immutable digest for reproducibility

export const manifest = setupManifest({
  id: 'azerothcore',
  title: 'AzerothCore',
  license: 'MIT',
  packageRepo: 'https://github.com/kwsantiago/azerothcore-startos',
  upstreamRepo: 'https://github.com/azerothcore/azerothcore-wotlk',
  marketingUrl: 'https://www.azerothcore.org/',
  donationUrl: 'https://www.azerothcore.org/#donate',
  description: {
    short: shortDescription,
    long: longDescription,
  },
  volumes: ['main'],
  images: {
    // MySQL backend — holds acore_auth, acore_world, acore_characters.
    database: {
      source: { dockerTag: 'mysql:8.4' },
      arch: ['x86_64', 'aarch64'],
    },
    // Authserver — handles login + realmlist (port 3724).
    authserver: {
      source: { dockerTag: `acore/ac-wotlk-authserver:${ACORE_TAG}` },
      arch: ['x86_64', 'aarch64'],
    },
    // Worldserver — main game server (port 8085, SOAP 7878).
    worldserver: {
      source: { dockerTag: `acore/ac-wotlk-worldserver:${ACORE_TAG}` },
      arch: ['x86_64', 'aarch64'],
    },
    // One-shot DB importer — creates/updates the three databases, then exits.
    'db-import': {
      source: { dockerTag: `acore/ac-wotlk-db-import:${ACORE_TAG}` },
      arch: ['x86_64', 'aarch64'],
    },
    // One-shot client-data downloader — pulls maps/vmaps/mmaps/dbc (~1.1GB),
    // then exits. Output lands on the `main` volume at env/dist/data.
    'client-data': {
      source: { dockerTag: `acore/ac-wotlk-client-data:${ACORE_TAG}` },
      arch: ['x86_64', 'aarch64'],
    },
  },
  dependencies: {},
})
