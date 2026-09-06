import 'dotenv/config'

const REQUIRED_ENV = ['JWT_SECRET', 'JWT_REFRESH_SECRET'] as const
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`[server] Variable d'environnement manquante : ${key}`)
    process.exit(1)
  }
}

import { app } from './app.js'
import { runMigrations } from './db/migrate.js'
import { schedulePurgeJob } from './jobs/purge-old-trips.job.js'

const PORT = process.env.PORT ?? 3000

async function start(): Promise<void> {
  let dbAvailable = true
  try {
    await runMigrations()
  } catch (err) {
    dbAvailable = false
    console.warn('[server] DB indisponible, migrations ignorées :', (err as Error).message)
    if (process.env.NODE_ENV === 'production') {
      process.exit(1)
    }
  }

  if (dbAvailable && process.env.DEMO_MODE !== 'true') {
    schedulePurgeJob()
  }

  app.listen(PORT, () => {
    console.log(`[server] http://localhost:${PORT}`)
  })
}

start().catch((err) => {
  console.error(err)
  process.exit(1)
})
