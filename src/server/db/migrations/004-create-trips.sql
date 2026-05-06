CREATE TABLE trips (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  origin          GEOGRAPHY(POINT, 4326) NOT NULL,
  destination     GEOGRAPHY(POINT, 4326) NOT NULL,
  modes_used      TEXT[]      NOT NULL DEFAULT '{}',
  co2_saved_grams INTEGER     NOT NULL DEFAULT 0,
  points_earned   INTEGER     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trips_user_id   ON trips (user_id);
CREATE INDEX idx_trips_origin    ON trips USING GIST (origin);
CREATE INDEX idx_trips_destination ON trips USING GIST (destination);
CREATE INDEX idx_trips_created_at ON trips (created_at);
