import { readdir, readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type pg from 'pg'
import { pool } from './pool.js'

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'migrations')

async function ensureMigrationsTable(client: pg.PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   TEXT        PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
}

async function getAppliedMigrations(client: pg.PoolClient): Promise<Set<string>> {
  const result = await client.query<{ filename: string }>('SELECT filename FROM schema_migrations ORDER BY filename')
  return new Set(result.rows.map((r) => r.filename))
}

export async function runMigrations(): Promise<void> {
  const client = await pool.connect()

  try {
    await ensureMigrationsTable(client)
    const applied = await getAppliedMigrations(client)

    const files = (await readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith('.sql'))
      .sort()

    const pending = files.filter((f) => !applied.has(f))

    if (pending.length === 0) {
      console.log('[migrate] Aucune migration en attente.')
      return
    }

    for (const filename of pending) {
      const sql = await readFile(join(MIGRATIONS_DIR, filename), 'utf-8')

      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename])
        await client.query('COMMIT')
        console.log(`[migrate] ✓ ${filename}`)
      } catch (err) {
        await client.query('ROLLBACK')
        throw new Error(`[migrate] Échec sur ${filename}: ${(err as Error).message}`, { cause: err })
      }
    }

    console.log(`[migrate] ${pending.length} migration(s) appliquée(s).`)
  } finally {
    client.release()
  }
}
