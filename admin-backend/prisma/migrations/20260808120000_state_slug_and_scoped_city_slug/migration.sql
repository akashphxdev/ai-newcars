-- Fuel-price pages are addressed as /fuel-price/<state>/<city>, so states
-- need a slug and city slugs only have to be unique inside their state.

ALTER TABLE "states" ADD COLUMN IF NOT EXISTS "slug" varchar(100);

UPDATE "states"
SET "slug" = trim(both '-' from regexp_replace(lower("name"), '[^a-z0-9]+', '-', 'g'))
WHERE "slug" IS NULL;

ALTER TABLE "states" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "states_slug_key" ON "states"("slug");

-- 39 city slugs carried a "-<state>" suffix purely to stay globally
-- unique (e.g. "aurangabad-bihar"). Scoping the constraint to the state
-- lets them drop it, so the URL reads /fuel-price/bihar/aurangabad.
--
-- Derived from the name rather than by trimming the suffix off the slug:
-- trimming cannot tell an artificial "-delhi" from the real one in "New
-- Delhi", and turns 15 cities into "new", "south", "west" and friends.
-- Verified collision-free within every state before being applied.
DROP INDEX IF EXISTS "cities_slug_key";

UPDATE "cities"
SET "slug" = trim(both '-' from regexp_replace(lower("name"), '[^a-z0-9]+', '-', 'g'))
WHERE "slug" <> trim(both '-' from regexp_replace(lower("name"), '[^a-z0-9]+', '-', 'g'));

CREATE UNIQUE INDEX IF NOT EXISTS "cities_state_id_slug_key" ON "cities"("state_id", "slug");
