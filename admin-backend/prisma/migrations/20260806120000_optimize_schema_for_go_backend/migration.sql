-- ============================================================
-- 1. roles.permission_ids (jsonb) -> role_permissions join table
--
-- The JSON array could not be joined or indexed: requirePermission
-- needed two round-trips (role, then permissions IN (...)), and
-- deleting a permission had to load every role, filter its array in
-- application code and write each row back — a racy read-modify-write
-- that a foreign key with ON DELETE CASCADE now handles in one
-- statement.
-- ============================================================

CREATE TABLE "role_permissions" (
    "role_id"       INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,
    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id")
);

ALTER TABLE "role_permissions"
    ADD CONSTRAINT "role_permissions_role_id_fkey"
    FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "role_permissions"
    ADD CONSTRAINT "role_permissions_permission_id_fkey"
    FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Reverse lookup ("which roles hold permission X") — impossible before.
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

-- Backfill. Ignores ids in the JSON array that no longer point at a live
-- permission row — those are exactly the dangling references the old
-- delete-time cleanup was trying (and failing, on any concurrent write)
-- to prevent.
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN LATERAL jsonb_array_elements_text(
    CASE WHEN jsonb_typeof(r."permission_ids") = 'array'
         THEN r."permission_ids"
         ELSE '[]'::jsonb
    END
) AS elem(val)
JOIN "permissions" p ON p."id" = elem.val::INTEGER
ON CONFLICT DO NOTHING;

ALTER TABLE "roles" DROP COLUMN "permission_ids";


-- ============================================================
-- 2. car_models: denormalised fuel availability + variant count
--
-- The /new-cars browse page computed its four fuel facet counts with
-- correlated three-level EXISTS subqueries
-- (car_models -> car_variants -> car_powertrains_*), and every browse
-- query carried a fifth EXISTS just to assert "has at least one
-- variant". These columns collapse all five into indexed predicates on
-- car_models itself.
-- ============================================================

ALTER TABLE "car_models"
    ADD COLUMN "has_petrol"    BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "has_diesel"    BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "has_cng"       BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "has_electric"  BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "variant_count" INTEGER NOT NULL DEFAULT 0;

-- Recomputes every derived column for one model from its variants and
-- their live (non-deleted) powertrains. Single source of truth for both
-- the backfill below and the triggers that follow, so the two can never
-- disagree about what "has_petrol" means.
--
-- Fuel codes match FUEL_TYPE_LABELS in the application layer:
-- 1=Petrol 2=Diesel 3=CNG 4=LPG 5=Hybrid. Only the four the browse
-- filter actually exposes get a column.
CREATE OR REPLACE FUNCTION refresh_car_model_derived(p_model_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE "car_models" m
    SET "variant_count" = d.cnt,
        "has_petrol"    = d.petrol,
        "has_diesel"    = d.diesel,
        "has_cng"       = d.cng,
        "has_electric"  = d.electric
    FROM (
        SELECT
            COUNT(v."id")                                          AS cnt,
            COALESCE(bool_or(i."fuel_type" = 1), false)            AS petrol,
            COALESCE(bool_or(i."fuel_type" = 2), false)            AS diesel,
            COALESCE(bool_or(i."fuel_type" = 3), false)            AS cng,
            COALESCE(bool_or(e."id" IS NOT NULL), false)           AS electric
        FROM "car_variants" v
        LEFT JOIN "car_powertrains_ice" i
               ON i."variant_id" = v."id" AND i."is_deleted" = false
        LEFT JOIN "car_powertrains_electric" e
               ON e."variant_id" = v."id" AND e."is_deleted" = false
        WHERE v."model_id" = p_model_id
    ) d
    WHERE m."id" = p_model_id;
END;
$$ LANGUAGE plpgsql;

-- Backfill existing rows.
DO $$
DECLARE m_id INTEGER;
BEGIN
    FOR m_id IN SELECT "id" FROM "car_models" LOOP
        PERFORM refresh_car_model_derived(m_id);
    END LOOP;
END $$;

-- Trigger plumbing. Maintenance lives in the database rather than the
-- application because the Node admin backend and the Go public service
-- both write these tables during the migration period — a trigger is the
-- only place the rule cannot drift out of sync between them.

CREATE OR REPLACE FUNCTION trg_car_variant_derived()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM refresh_car_model_derived(OLD."model_id");
        RETURN OLD;
    END IF;

    PERFORM refresh_car_model_derived(NEW."model_id");
    -- A variant moved between models leaves the old model stale.
    IF TG_OP = 'UPDATE' AND OLD."model_id" IS DISTINCT FROM NEW."model_id" THEN
        PERFORM refresh_car_model_derived(OLD."model_id");
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "car_variants_derived_aiud"
AFTER INSERT OR UPDATE OF "model_id" OR DELETE ON "car_variants"
FOR EACH ROW EXECUTE FUNCTION trg_car_variant_derived();

-- Powertrain rows reach car_models one hop away, through their variant.
CREATE OR REPLACE FUNCTION trg_car_powertrain_derived()
RETURNS TRIGGER AS $$
DECLARE
    v_model_id     INTEGER;
    v_old_model_id INTEGER;
BEGIN
    IF TG_OP <> 'INSERT' THEN
        SELECT "model_id" INTO v_old_model_id FROM "car_variants" WHERE "id" = OLD."variant_id";
        IF v_old_model_id IS NOT NULL THEN
            PERFORM refresh_car_model_derived(v_old_model_id);
        END IF;
    END IF;

    IF TG_OP <> 'DELETE' THEN
        SELECT "model_id" INTO v_model_id FROM "car_variants" WHERE "id" = NEW."variant_id";
        IF v_model_id IS NOT NULL AND v_model_id IS DISTINCT FROM v_old_model_id THEN
            PERFORM refresh_car_model_derived(v_model_id);
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- is_deleted is a soft delete, so it has to fire the same recompute a
-- hard DELETE would.
CREATE TRIGGER "car_powertrains_ice_derived_aiud"
AFTER INSERT OR UPDATE OF "variant_id", "fuel_type", "is_deleted" OR DELETE ON "car_powertrains_ice"
FOR EACH ROW EXECUTE FUNCTION trg_car_powertrain_derived();

CREATE TRIGGER "car_powertrains_electric_derived_aiud"
AFTER INSERT OR UPDATE OF "variant_id", "is_deleted" OR DELETE ON "car_powertrains_electric"
FOR EACH ROW EXECUTE FUNCTION trg_car_powertrain_derived();


-- ============================================================
-- 3. Composite indexes for the browse page's real filter+sort pairs
--
-- The pre-existing indexes on car_models are all single-column, and
-- Postgres can only use one per scan — so a browse request filtered by
-- launch_status still heap-scanned to sort by price or rating.
-- ============================================================

CREATE INDEX "car_models_browse_price_idx"
    ON "car_models"("launch_status", "price_min")
    WHERE "variant_count" > 0;

CREATE INDEX "car_models_browse_rating_idx"
    ON "car_models"("launch_status", "rating_avg" DESC NULLS LAST, "created_at" DESC)
    WHERE "variant_count" > 0;

CREATE INDEX "car_models_brand_status_idx"  ON "car_models"("brand_id", "launch_status");
CREATE INDEX "car_models_body_status_idx"   ON "car_models"("body_type_id", "launch_status");

-- Facet counts scan by a single fuel flag; partial indexes keep each one
-- to just the rows that offer that fuel.
CREATE INDEX "car_models_has_petrol_idx"   ON "car_models"("launch_status") WHERE "has_petrol";
CREATE INDEX "car_models_has_diesel_idx"   ON "car_models"("launch_status") WHERE "has_diesel";
CREATE INDEX "car_models_has_cng_idx"      ON "car_models"("launch_status") WHERE "has_cng";
CREATE INDEX "car_models_has_electric_idx" ON "car_models"("launch_status") WHERE "has_electric";

-- Redundant now that both composite browse indexes lead with
-- launch_status and car_models_browse_price_idx covers (status, price).
DROP INDEX IF EXISTS "car_models_launch_status_idx";
DROP INDEX IF EXISTS "car_models_price_min_idx";
