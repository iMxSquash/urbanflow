CREATE TABLE bike_stations (
  id               TEXT        PRIMARY KEY,
  name             TEXT        NOT NULL,
  location         GEOGRAPHY(POINT, 4326) NOT NULL,
  capacity         INTEGER     NOT NULL DEFAULT 0,
  bikes_available  INTEGER     NOT NULL DEFAULT 0,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bike_stations_location ON bike_stations USING GIST (location);
