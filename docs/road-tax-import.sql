-- Road tax rates for private four-wheelers, by state.
--
-- Basis differs by state: most tax a percentage of ex-showroom price, a few
-- (Rajasthan, West Bengal) band by engine displacement. fuel_type NULL means
-- the slab applies to every fuel; a row with an explicit fuel_type wins over
-- the NULL row for that fuel.
--
-- effective_from is mandatory rather than cosmetic: EV exemptions are being
-- withdrawn state by state (Karnataka ended its four-wheeler waiver in April
-- 2026, Madhya Pradesh let its own lapse in March 2026), so a rate without a
-- date cannot be reasoned about.
--
-- VERIFICATION STATUS: compiled from the 2026 secondary sources listed in
-- source_url. These are NOT official RTO notifications. Every row should be
-- checked against the issuing state's transport department before this drives
-- a user-facing price. See the report at the end of this file.

BEGIN;

CREATE TABLE IF NOT EXISTS road_tax_rates (
  id             serial PRIMARY KEY,
  state_id       integer NOT NULL REFERENCES states(id) ON DELETE CASCADE,
  fuel_type      text,
  basis          text NOT NULL CHECK (basis IN ('price', 'engine_cc')),
  slab_min       numeric(12,2) NOT NULL DEFAULT 0,
  slab_max       numeric(12,2),
  rate_pct       numeric(5,2) NOT NULL,
  min_amount     numeric(12,2),
  effective_from date NOT NULL,
  source_url     text,
  verified       boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT road_tax_slab_sane CHECK (slab_max IS NULL OR slab_max > slab_min),
  CONSTRAINT road_tax_fuel_known CHECK (
    fuel_type IS NULL OR fuel_type IN ('petrol','diesel','electric','cng')
  ),
  UNIQUE (state_id, fuel_type, basis, slab_min, effective_from)
);

-- Lookup path is always (state, fuel, date) -> slab containing the price.
CREATE INDEX IF NOT EXISTS road_tax_rates_lookup_idx
  ON road_tax_rates (state_id, effective_from DESC, slab_min);

-- Fixed, non-percentage charges. Kept per-state because HSRP and hypothecation
-- vary, while the central registration fee does not.
CREATE TABLE IF NOT EXISTS road_tax_fixed_charges (
  id             serial PRIMARY KEY,
  state_id       integer REFERENCES states(id) ON DELETE CASCADE,
  registration   numeric(10,2) NOT NULL DEFAULT 600,
  hsrp           numeric(10,2) NOT NULL DEFAULT 400,
  fastag         numeric(10,2) NOT NULL DEFAULT 500,
  hypothecation  numeric(10,2) NOT NULL DEFAULT 1500,
  effective_from date NOT NULL,
  source_url     text,
  UNIQUE (state_id, effective_from)
);

-- A NULL state_id row is the national default, used where we hold no
-- state-specific figures rather than showing nothing.
INSERT INTO road_tax_fixed_charges (state_id, effective_from, source_url)
SELECT NULL, DATE '2026-01-01',
       'https://www.windshieldexperts.com/blog/rto-charges-new-cars-india-2026/'
WHERE NOT EXISTS (
  SELECT 1 FROM road_tax_fixed_charges WHERE state_id IS NULL
);

COMMIT;

-- ---- percentage-of-price slabs ------------------------------------
BEGIN;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,'petrol','price',0,600000,4,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Delhi'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,'petrol','price',600000,1000000,7,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Delhi'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,'petrol','price',1000000,NULL,10,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Delhi'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,'diesel','price',0,600000,5,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Delhi'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,'diesel','price',600000,1000000,8.75,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Delhi'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,'diesel','price',1000000,NULL,12.5,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Delhi'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,'petrol','price',0,1000000,11,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Maharashtra'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,'petrol','price',1000000,2000000,12,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Maharashtra'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,'petrol','price',2000000,NULL,13,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Maharashtra'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,'diesel','price',0,1000000,13,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Maharashtra'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,'diesel','price',1000000,2000000,14,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Maharashtra'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,'diesel','price',2000000,NULL,15,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Maharashtra'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',0,500000,13,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Karnataka'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',500000,1000000,14,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Karnataka'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',1000000,2000000,17,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Karnataka'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',2000000,NULL,18,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Karnataka'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',0,1000000,12,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Tamil Nadu'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',1000000,NULL,13,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Tamil Nadu'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',0,500000,6,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Kerala'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',500000,1000000,8,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Kerala'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',1000000,1500000,10,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Kerala'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',1500000,2000000,15,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Kerala'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',2000000,NULL,20,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Kerala'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',0,1000000,8,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Uttar Pradesh'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',1000000,NULL,10,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Uttar Pradesh'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',0,600000,5,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Haryana'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',600000,2000000,8,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Haryana'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',2000000,4000000,10,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Haryana'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',4000000,NULL,12,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Haryana'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',0,NULL,6,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Gujarat'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',0,1000000,12,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Telangana'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',1000000,2000000,14,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Telangana'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',2000000,NULL,18,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Telangana'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',0,1000000,12,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Andhra Pradesh'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',1000000,NULL,14,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Andhra Pradesh'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',0,1000000,8,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Madhya Pradesh'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',1000000,NULL,10,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Madhya Pradesh'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',0,1500000,9.5,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Punjab'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',1500000,NULL,11.5,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Punjab'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',0,800000,8,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Bihar'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',800000,1500000,9,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Bihar'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',1500000,NULL,10,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Bihar'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',0,500000,6,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Odisha'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',500000,1000000,8,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Odisha'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',1000000,NULL,10,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Odisha'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',0,1500000,6,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Jharkhand'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',1500000,NULL,9,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Jharkhand'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',0,2000000,6,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Chandigarh'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',2000000,NULL,8,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Chandigarh'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',0,600000,9,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Goa'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',600000,1000000,11,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Goa'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',1000000,NULL,12,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Goa'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',0,400000,5,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Assam'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',400000,600000,6,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Assam'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',600000,1200000,7,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Assam'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',1200000,1500000,7.5,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Assam'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',1500000,NULL,9,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Assam'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',0,1500000,6,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Himachal Pradesh'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',1500000,NULL,7,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Himachal Pradesh'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',0,500000,8,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Uttarakhand'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',500000,1000000,9,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Uttarakhand'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',1000000,NULL,10,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Uttarakhand'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',0,1500000,9,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Jammu and Kashmir'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',1500000,NULL,10,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Jammu and Kashmir'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',0,1000000,4,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Puducherry'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',1000000,NULL,7,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Puducherry'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',0,500000,5,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Chhattisgarh'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',500000,NULL,6,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Chhattisgarh'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',0,200000,1,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Sikkim'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',200000,1000000,3,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Sikkim'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',1000000,2500000,4,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Sikkim'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'price',2500000,NULL,5,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Sikkim'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,'petrol','price',0,NULL,2.5,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Dadra and Nagar Haveli and Daman and Diu'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,'diesel','price',0,1000000,2.5,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Dadra and Nagar Haveli and Daman and Diu'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,'diesel','price',1000000,NULL,3,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Dadra and Nagar Haveli and Daman and Diu'
ON CONFLICT DO NOTHING;

-- ---- engine-displacement slabs (cc) -------------------------------
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,'petrol','engine_cc',0,800,6,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Rajasthan'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,'petrol','engine_cc',800,1200,9,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Rajasthan'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,'petrol','engine_cc',1200,NULL,10,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Rajasthan'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,'diesel','engine_cc',0,800,8,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Rajasthan'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,'diesel','engine_cc',800,1200,11,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Rajasthan'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,'diesel','engine_cc',1200,NULL,12,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='Rajasthan'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'engine_cc',0,800,5.5,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='West Bengal'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'engine_cc',800,1490,5.5,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='West Bengal'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'engine_cc',1490,1990,5.5,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='West Bengal'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,NULL,'engine_cc',1990,NULL,5.5,DATE '2026-04-01','https://greentax.in/blog/road-tax-rates-india-state-wise-2026' FROM states WHERE name='West Bengal'
ON CONFLICT DO NOTHING;

-- ---- electric vehicles --------------------------------------------
-- Fourteen states/UTs still waive road tax on EVs entirely. Applying the
-- petrol slab to an EV would overstate its on-road price by over a lakh.
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,'electric','price',0,NULL,0,DATE '2026-04-01','https://greentax.in/blog/ev-subsidy-state-wise-2026' FROM states WHERE name='Delhi'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,'electric','price',0,NULL,0,DATE '2026-04-01','https://greentax.in/blog/ev-subsidy-state-wise-2026' FROM states WHERE name='Maharashtra'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,'electric','price',0,NULL,0,DATE '2026-04-01','https://greentax.in/blog/ev-subsidy-state-wise-2026' FROM states WHERE name='Tamil Nadu'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,'electric','price',0,NULL,0,DATE '2026-04-01','https://greentax.in/blog/ev-subsidy-state-wise-2026' FROM states WHERE name='Telangana'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,'electric','price',0,NULL,0,DATE '2026-04-01','https://greentax.in/blog/ev-subsidy-state-wise-2026' FROM states WHERE name='Andhra Pradesh'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,'electric','price',0,NULL,0,DATE '2026-04-01','https://greentax.in/blog/ev-subsidy-state-wise-2026' FROM states WHERE name='Punjab'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,'electric','price',0,NULL,0,DATE '2026-04-01','https://greentax.in/blog/ev-subsidy-state-wise-2026' FROM states WHERE name='Uttar Pradesh'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,'electric','price',0,NULL,0,DATE '2026-04-01','https://greentax.in/blog/ev-subsidy-state-wise-2026' FROM states WHERE name='Rajasthan'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,'electric','price',0,NULL,0,DATE '2026-04-01','https://greentax.in/blog/ev-subsidy-state-wise-2026' FROM states WHERE name='Jharkhand'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,'electric','price',0,NULL,0,DATE '2026-04-01','https://greentax.in/blog/ev-subsidy-state-wise-2026' FROM states WHERE name='Chhattisgarh'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,'electric','price',0,NULL,0,DATE '2026-04-01','https://greentax.in/blog/ev-subsidy-state-wise-2026' FROM states WHERE name='Chandigarh'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,'electric','price',0,NULL,0,DATE '2026-04-01','https://greentax.in/blog/ev-subsidy-state-wise-2026' FROM states WHERE name='Jammu and Kashmir'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,'electric','price',0,NULL,0,DATE '2026-04-01','https://greentax.in/blog/ev-subsidy-state-wise-2026' FROM states WHERE name='Ladakh'
ON CONFLICT DO NOTHING;
INSERT INTO road_tax_rates (state_id,fuel_type,basis,slab_min,slab_max,rate_pct,effective_from,source_url)
SELECT id,'electric','price',0,NULL,1.0,DATE '2026-04-01','https://greentax.in/blog/ev-subsidy-state-wise-2026' FROM states WHERE name='Gujarat'
ON CONFLICT DO NOTHING;

COMMIT;
