import { setupManifest } from '@start9labs/start-sdk'
import { longDescription, shortDescription } from './i18n'

// AzerothCore's official prebuilt images (acore/ac-wotlk-*). Pinned to immutable
// digests for reproducible builds. The source tag for the acore images was
// 16.0.0-dev at pin time; when bumping the upstream version, re-resolve these
// with `docker buildx imagetools inspect <ref>`.
const MYSQL =
  'mysql:8.4@sha256:c36050afdca850f23cef85703f84c7531a5ae155a11b5ee1c60acb09937c4084'
const AC_AUTHSERVER =
  'acore/ac-wotlk-authserver:16.0.0-dev@sha256:2fe28f96f331b4d95f7b8fb7cb21cdec76d19f517770c8104b67ab47c66e4881'
const AC_WORLDSERVER =
  'acore/ac-wotlk-worldserver:16.0.0-dev@sha256:ff51228b30cbe657f64d2b76614d1098482198c9db7ecbd132615140a1641d32'
const AC_DB_IMPORT =
  'acore/ac-wotlk-db-import:16.0.0-dev@sha256:d72f9f531d6c637f1aab9e888785f06bc13d69e469f47d49205f5cb41512dc0a'
const AC_CLIENT_DATA =
  'acore/ac-wotlk-client-data:16.0.0-dev@sha256:9d60578f2971638ab680cb15dc4f48f52da3ac058c60d3d60a1f0fe24c96e68d'

const ARCH_X86: ['x86_64'] = ['x86_64']

export const manifest = setupManifest({
  // Shared with the Playerbots flavor (Start9-Community/azerothcore-startos,
  // `playerbots` branch) so a user can switch flavors in place, keeping their
  // world and characters.
  id: 'azerothcore',
  title: 'AzerothCore',
  license: 'MIT',
  packageRepo: 'https://github.com/Start9-Community/azerothcore-startos',
  upstreamRepo: 'https://github.com/azerothcore/azerothcore-wotlk',
  marketingUrl: 'https://www.azerothcore.org/',
  donationUrl: 'https://www.azerothcore.org/#donate',
  description: {
    short: shortDescription,
    long: longDescription,
  },
  volumes: ['main'],
  images: {
    database: { source: { dockerTag: MYSQL }, arch: ARCH_X86 },
    authserver: { source: { dockerTag: AC_AUTHSERVER }, arch: ARCH_X86 },
    worldserver: { source: { dockerTag: AC_WORLDSERVER }, arch: ARCH_X86 },
    'db-import': { source: { dockerTag: AC_DB_IMPORT }, arch: ARCH_X86 },
    'client-data': { source: { dockerTag: AC_CLIENT_DATA }, arch: ARCH_X86 },
  },
  dependencies: {},
})
