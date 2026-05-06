CREATE TYPE preference_mode AS ENUM ('eco', 'fast', 'balanced');

CREATE TABLE mobility_profiles (
  user_id           UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  preferred_modes   TEXT[]          NOT NULL DEFAULT '{}',
  max_walk_minutes  INTEGER         NOT NULL DEFAULT 15,
  preference        preference_mode NOT NULL DEFAULT 'balanced',
  updated_at        TIMESTAMPTZ     NOT NULL DEFAULT now()
);
