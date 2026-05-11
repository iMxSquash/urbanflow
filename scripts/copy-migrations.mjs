import { cpSync } from 'fs'

cpSync('src/server/db/migrations', 'dist/server/db/migrations', { recursive: true })
