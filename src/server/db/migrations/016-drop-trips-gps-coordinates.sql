-- Minimisation RGPD : les coordonnées précises de départ/arrivée ne sont lues
-- par aucune requête applicative (le CO2, les points et les badges se calculent
-- depuis modes_used/distanceKm des segments, jamais depuis origin/destination).
-- Les conserver en base au-delà de la requête qui les a produites contredit le
-- principe de minimisation (RGPD art. 5.1.c) et la promesse faite à l'utilisateur
-- dans Paramètres. On les supprime donc à la source plutôt que de les anonymiser.
DROP INDEX IF EXISTS idx_trips_origin;
DROP INDEX IF EXISTS idx_trips_destination;
ALTER TABLE trips DROP COLUMN IF EXISTS origin;
ALTER TABLE trips DROP COLUMN IF EXISTS destination;
