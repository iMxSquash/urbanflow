CREATE TYPE threshold_type AS ENUM (
  'total_trips',
  'total_co2_saved_grams',
  'total_points',
  'streak_days'
);

CREATE TABLE badges (
  id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT           NOT NULL UNIQUE,
  description      TEXT           NOT NULL,
  threshold_type   threshold_type NOT NULL,
  threshold_value  INTEGER        NOT NULL
);
