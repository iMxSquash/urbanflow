import pg from 'pg'
import 'dotenv/config'

const { Pool } = pg

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // rejectUnauthorized: false — le pooler Supabase (aws-0-eu-west-3.pooler.supabase.com)
  // présente un certificat dont la chaîne n'est pas dans le CA bundle Node par défaut ;
  // la connexion reste chiffrée (TLS), seule la vérification de la chaîne est relâchée.
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
})
