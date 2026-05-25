ALTER TABLE trips ADD COLUMN IF NOT EXISTS primary_mode TEXT;

UPDATE trips SET primary_mode = CASE
  WHEN 'tramway' = ANY(modes_used) THEN 'tramway'
  WHEN 'bus'     = ANY(modes_used) THEN 'bus'
  WHEN 'train'   = ANY(modes_used) THEN 'train'
  WHEN 'navibus' = ANY(modes_used) THEN 'navibus'
  WHEN 'bike'    = ANY(modes_used) THEN 'bike'
  WHEN 'scooter' = ANY(modes_used) THEN 'scooter'
  ELSE 'walk'
END;

ALTER TABLE trips ALTER COLUMN primary_mode SET NOT NULL;
ALTER TABLE trips ALTER COLUMN primary_mode SET DEFAULT 'walk';

CREATE INDEX IF NOT EXISTS idx_trips_user_primary_mode ON trips (user_id, primary_mode, created_at);
