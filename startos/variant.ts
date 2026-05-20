import { BUILD_VARIANT } from './variant.gen'

// The build flavor, baked at build time (see scripts/gen-variant.js).
export const isPlayerbots = BUILD_VARIANT === 'playerbots'

export const packageId = isPlayerbots ? 'azerothcore-playerbots' : 'azerothcore'
export const packageTitle = isPlayerbots
  ? 'AzerothCore Playerbots'
  : 'AzerothCore'

// Which manifest image id backs each server role.
// Vanilla uses the separate official acore images; playerbots uses one
// consolidated fork image ('acore') built from Dockerfile.playerbots.
export const roleImage = {
  database: 'database',
  clientData: 'client-data',
  auth: isPlayerbots ? 'acore' : 'authserver',
  world: isPlayerbots ? 'acore' : 'worldserver',
  dbImport: isPlayerbots ? 'acore' : 'db-import',
} as const
