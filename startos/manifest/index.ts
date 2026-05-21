import { setupManifest } from '@start9labs/start-sdk'
import { longDescription, shortDescription } from './i18n'

// Playerbots flavor. The auth/world/db-import roles are served by one
// consolidated image ('acore') built from the mod-playerbots fork; `database`
// and `client-data` reuse the official upstream images (pinned by digest).
const MYSQL =
  'mysql:8.4@sha256:c36050afdca850f23cef85703f84c7531a5ae155a11b5ee1c60acb09937c4084'
const AC_CLIENT_DATA =
  'acore/ac-wotlk-client-data:16.0.0-dev@sha256:9d60578f2971638ab680cb15dc4f48f52da3ac058c60d3d60a1f0fe24c96e68d'

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
