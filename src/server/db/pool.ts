import pg from 'pg'
import 'dotenv/config'

const { Pool } = pg

if (!process.env.EXTERNAL_DATABASE_URL) {
  throw new Error('EXTERNAL_DATABASE_URL is not set')
}

export const pool = new Pool({
  connectionString: process.env.EXTERNAL_DATABASE_URL,
  // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  ssl: process.env.EXTERNAL_DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
})
