import { sdk } from './sdk'

// The `main` volume holds the MySQL data dir, client-data, and config.
// MySQL flushes to disk on graceful shutdown, which StartOS performs before
// a backup, so a plain volume backup is consistent for a single-instance DB.
export const { createBackup, restoreInit } = sdk.setupBackups(
  async ({ effects }) => sdk.Backups.ofVolumes('main'),
)
