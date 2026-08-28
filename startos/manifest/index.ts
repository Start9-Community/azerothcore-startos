import { setupManifest } from '@start9labs/start-sdk'
import { longDescription, shortDescription } from './i18n'

// Playerbots flavor. The auth/world/db-import roles are served by one
// consolidated image ('acore') built from the mod-playerbots fork; `database`
// and `client-data` reuse the official upstream images (pinned by digest).
const MYSQL =
  'mysql:8.4@sha256:b3b90af2a6552ae30c266fdb7d5dd55f3afb72404bb78d37fe8a23eb857fd3fb'
const AC_CLIENT_DATA =
  'acore/ac-wotlk-client-data:17.0.0-dev@sha256:86a10168cf6a1e54a8895bef5938a940872332d92232e9af9848e862de1d7a2a'

const ARCH_X86: ['x86_64'] = ['x86_64']

export const manifest = setupManifest({
  // Shared with the vanilla flavor (Start9-Community/azerothcore-startos, `main`
  // branch) so a user can switch flavors in place, keeping world + characters.
  id: 'azerothcore',
  title: 'AzerothCore Playerbots',
  license: 'MIT',
  packageRepo:
    'https://github.com/Start9-Community/azerothcore-startos/tree/playerbots',
  upstreamRepo: 'https://github.com/mod-playerbots/azerothcore-wotlk',
  marketingUrl: 'https://www.azerothcore.org/',
  donationUrl: 'https://www.azerothcore.org/#donate',
  description: {
    short: shortDescription,
    long: longDescription,
  },
  volumes: ['main'],
  images: {
    database: { source: { dockerTag: MYSQL }, arch: ARCH_X86 },
    // The mod-playerbots fork, compiled from source at pack time (auth + world +
    // db-import in one image). The fork/module commits are pinned in
    // Dockerfile.playerbots. The first build is slow; Docker layer-caches the
    // compile, so later repacks are quick. See UPDATING.md.
    acore: {
      source: { dockerBuild: { dockerfile: './Dockerfile.playerbots' } },
      arch: ARCH_X86,
    },
    'client-data': { source: { dockerTag: AC_CLIENT_DATA }, arch: ARCH_X86 },
  },
  dependencies: {},
})
