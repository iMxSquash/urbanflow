import cron from 'node-cron'
import { pool } from '../db/pool.js'

const RETENTION_MONTHS = 12

// Purge RGPD (12 mois, cf. CLAUDE.md) : trajets et récompenses échangées ne
// sont conservés que le temps nécessaire aux statistiques annuelles du
// dashboard citoyen. Passé ce délai, l'historique est effacé.
export async function purgeOldTrips(): Promise<{ trips: number; redemptions: number }> {
  const trips = await pool.query(
    `DELETE FROM trips WHERE created_at < now() - interval '${RETENTION_MONTHS} months'`
  )
  const redemptions = await pool.query(
    `DELETE FROM reward_redemptions WHERE redeemed_at < now() - interval '${RETENTION_MONTHS} months'`
  )
  return { trips: trips.rowCount ?? 0, redemptions: redemptions.rowCount ?? 0 }
}

// Exécution quotidienne à 3h15 (heure de Paris), en dehors des heures de pointe.
export function schedulePurgeJob(): void {
  cron.schedule(
    '15 3 * * *',
    () => {
      purgeOldTrips()
        .then(({ trips, redemptions }) => {
          if (trips > 0 || redemptions > 0) {
            console.log(`[purge] ${trips} trajet(s), ${redemptions} récompense(s) supprimés (> 12 mois)`)
          }
        })
        .catch((err: unknown) => {
          console.error('[purge] échec de la purge RGPD :', err)
        })
    },
    { timezone: 'Europe/Paris' }
  )
}
