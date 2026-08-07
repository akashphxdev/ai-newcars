-- Daily retail fuel prices per city, sourced from the sptspl scraper API.
-- One row per city/fuel/day: the upstream stores several scrapes a day for
-- the same key, so the unique constraint is what makes both the backfill
-- and the daily cron idempotent.
CREATE TABLE IF NOT EXISTS fuel_prices (
  id            bigserial PRIMARY KEY,
  city_id       integer NOT NULL REFERENCES cities(id),
  fuel_type     smallint NOT NULL,
  price         numeric(10,2) NOT NULL,
  price_change  numeric(10,2) NOT NULL DEFAULT 0,
  applicable_on date NOT NULL,
  created_at    timestamp(3) NOT NULL DEFAULT now(),
  CONSTRAINT fuel_prices_fuel_type_check CHECK (fuel_type IN (1,2,3)),
  CONSTRAINT fuel_prices_unique UNIQUE (city_id, fuel_type, applicable_on)
);

-- Serves "latest price for this city" and the history series, which are
-- the only two shapes the public endpoints ask for.
CREATE INDEX IF NOT EXISTS fuel_prices_latest_idx ON fuel_prices (city_id, fuel_type, applicable_on DESC);
CREATE INDEX IF NOT EXISTS fuel_prices_day_idx ON fuel_prices (applicable_on DESC);
