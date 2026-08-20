-- Scrap car leads.
--
-- Hand-written rather than taken from `prisma migrate diff`: the local
-- database that command reads is well behind production, so its output
-- also contained DROP TABLE article_comments / page_views and CREATE
-- TABLE fuel_prices / wishlists. Do not run that script anywhere.
--
-- Column types and the created_at / updated_at convention match
-- insurance_leads, verified against production.

BEGIN;

CREATE TABLE "scrap_car_leads" (
    "id"                           SERIAL       NOT NULL,
    "user_id"                      INTEGER,
    "name"                         VARCHAR(100),
    "mobile"                       VARCHAR(15)  NOT NULL,
    "email"                        VARCHAR(150),
    "brand_id"                     INTEGER,
    "model_id"                     INTEGER,
    -- Free-text fallbacks: a car old enough to scrap is often not in the
    -- catalogue, and refusing it would lose the lead entirely.
    "brand_name"                   VARCHAR(100),
    "model_name"                   VARCHAR(100),
    "registration_number"          VARCHAR(20),
    "registration_year"            INTEGER,
    "registration_state_id"        INTEGER,
    "city_id"                      INTEGER,
    "fuel_type"                    VARCHAR(20),
    "vehicle_condition"            VARCHAR(20),
    "has_original_rc"              BOOLEAN,
    "is_hypothecated"              BOOLEAN,
    "has_pending_challan"          BOOLEAN,
    "wants_certificate_of_deposit" BOOLEAN,
    "preferred_pickup_date"        DATE,
    "quoted_price"                 DECIMAL(12,2),
    "notes"                        TEXT,
    "status"                       VARCHAR(20)  NOT NULL DEFAULT 'new',
    "lead_channel"                 VARCHAR(30),
    "utm_source"                   VARCHAR(100),
    "utm_medium"                   VARCHAR(100),
    "utm_campaign"                 VARCHAR(150),
    "landing_page"                 VARCHAR(255),
    "device_type"                  VARCHAR(20),
    "ip_address"                   VARCHAR(45),
    "created_at"                   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"                   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scrap_car_leads_pkey" PRIMARY KEY ("id")
);

-- Serves the admin list, which is filtered by status and ordered by date.
CREATE INDEX "scrap_car_leads_status_created_at_idx" ON "scrap_car_leads"("status", "created_at");
-- Admin search, and the public duplicate check.
CREATE INDEX "scrap_car_leads_mobile_idx"              ON "scrap_car_leads"("mobile");
CREATE INDEX "scrap_car_leads_registration_number_idx" ON "scrap_car_leads"("registration_number");
CREATE INDEX "scrap_car_leads_city_id_idx"             ON "scrap_car_leads"("city_id");

-- SET NULL throughout: deleting a brand or city must never delete a lead.
ALTER TABLE "scrap_car_leads" ADD CONSTRAINT "scrap_car_leads_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "scrap_car_leads" ADD CONSTRAINT "scrap_car_leads_brand_id_fkey"
    FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "scrap_car_leads" ADD CONSTRAINT "scrap_car_leads_model_id_fkey"
    FOREIGN KEY ("model_id") REFERENCES "car_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "scrap_car_leads" ADD CONSTRAINT "scrap_car_leads_registration_state_id_fkey"
    FOREIGN KEY ("registration_state_id") REFERENCES "states"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "scrap_car_leads" ADD CONSTRAINT "scrap_car_leads_city_id_fkey"
    FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
