ALTER TABLE mobility_profiles
  ADD COLUMN IF NOT EXISTS pmr_accessibility BOOLEAN NOT NULL DEFAULT false;
