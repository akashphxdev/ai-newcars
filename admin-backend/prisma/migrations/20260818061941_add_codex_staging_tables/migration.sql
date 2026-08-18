-- CreateTable
CREATE TABLE "codex_runs" (
    "id" BIGSERIAL NOT NULL,
    "task_type" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'running',
    "prompt" TEXT,
    "source_url" VARCHAR(500),
    "error_message" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "codex_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codex_proposal_events" (
    "id" BIGSERIAL NOT NULL,
    "run_id" BIGINT,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" INTEGER,
    "action" VARCHAR(30) NOT NULL,
    "message" VARCHAR(255),
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "codex_proposal_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codex_brands" (
    "id" SERIAL NOT NULL,
    "run_id" BIGINT,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "logo_url" VARCHAR(255),
    "country_origin_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "proposal_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "reviewed_by" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "codex_brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codex_car_models" (
    "id" SERIAL NOT NULL,
    "run_id" BIGINT,
    "brand_id" INTEGER,
    "codex_brand_id" INTEGER,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "body_type_id" INTEGER,
    "launch_status" VARCHAR(20) NOT NULL DEFAULT 'available',
    "expected_launch_date" DATE,
    "price_min" DECIMAL(12,2),
    "price_max" DECIMAL(12,2),
    "rating_avg" DECIMAL(3,2),
    "cover_image_url" VARCHAR(255),
    "proposal_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "reviewed_by" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "codex_car_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codex_car_variants" (
    "id" SERIAL NOT NULL,
    "run_id" BIGINT,
    "model_id" INTEGER,
    "codex_model_id" INTEGER,
    "variant_name" VARCHAR(100) NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "seating_capacity" INTEGER NOT NULL,
    "transmission_id" INTEGER NOT NULL,
    "is_top_seller" BOOLEAN NOT NULL DEFAULT false,
    "length_mm" INTEGER,
    "width_mm" INTEGER,
    "height_mm" INTEGER,
    "wheel_base_mm" INTEGER,
    "ground_clearance_mm" INTEGER,
    "boot_space_litres" INTEGER,
    "front_suspension" VARCHAR(100),
    "rear_suspension" VARCHAR(100),
    "steering_type" VARCHAR(50),
    "front_brake_type" VARCHAR(50),
    "rear_brake_type" VARCHAR(50),
    "proposal_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "reviewed_by" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "codex_car_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codex_powertrains_ice" (
    "id" SERIAL NOT NULL,
    "run_id" BIGINT,
    "variant_id" INTEGER,
    "codex_variant_id" INTEGER,
    "fuel_type" INTEGER NOT NULL,
    "fuel_type_sub_category" VARCHAR(30),
    "fuel_tank_capacity" DECIMAL(5,2),
    "cng_tank_capacity" DECIMAL(5,2),
    "kerb_weight" INTEGER,
    "engine_displacement" DECIMAL(5,2),
    "cubic_capacity" INTEGER,
    "cylinders" INTEGER,
    "num_gears" INTEGER,
    "is_four_by_four" BOOLEAN NOT NULL DEFAULT false,
    "drivetrain_id" INTEGER,
    "power_ps" INTEGER,
    "power_min_rpm" INTEGER,
    "power_max_rpm" INTEGER,
    "torque_nm" INTEGER,
    "torque_min_rpm" INTEGER,
    "torque_max_rpm" INTEGER,
    "claimed_fe" DECIMAL(5,2),
    "real_world_mileage" DECIMAL(5,2),
    "top_speed_kmph" INTEGER,
    "top_speed_time_sec" DECIMAL(5,2),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_by" INTEGER,
    "deleted_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "emission_norm_compliance" VARCHAR(30),
    "turbo_charger" BOOLEAN NOT NULL DEFAULT false,
    "proposal_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "reviewed_by" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "codex_powertrains_ice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codex_powertrains_electric" (
    "id" SERIAL NOT NULL,
    "run_id" BIGINT,
    "variant_id" INTEGER,
    "codex_variant_id" INTEGER,
    "num_motors" INTEGER,
    "motor_type" VARCHAR(50),
    "battery_capacity" DECIMAL(6,2),
    "battery_chemistry" VARCHAR(30),
    "thermal_management_system" VARCHAR(50),
    "drivetrain_id" INTEGER,
    "power_ps" INTEGER,
    "torque_nm" INTEGER,
    "claimed_range" INTEGER,
    "real_world_range" INTEGER,
    "top_speed_kmph" INTEGER,
    "top_speed_time_sec" DECIMAL(5,2),
    "ac_charging_output" DECIMAL(5,2),
    "ac_charging_time" DECIMAL(5,2),
    "dc_charging_output" DECIMAL(5,2),
    "dc_fast_charging_time" VARCHAR(50),
    "battery_warranty_km" INTEGER,
    "battery_warranty_years" INTEGER,
    "motor_warranty_km" INTEGER,
    "motor_warranty_years" INTEGER,
    "standard_warranty_km" VARCHAR(20),
    "standard_warranty_years" INTEGER,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_by" INTEGER,
    "deleted_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "emission_norm_compliance" VARCHAR(30),
    "motor_power_kw" DECIMAL(6,2),
    "charging_port" VARCHAR(30),
    "charging_options_raw" VARCHAR(255),
    "regenerative_braking" BOOLEAN NOT NULL DEFAULT false,
    "regenerative_braking_levels" INTEGER,
    "proposal_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "reviewed_by" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "codex_powertrains_electric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codex_feature_categories" (
    "id" SERIAL NOT NULL,
    "run_id" BIGINT,
    "name" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "proposal_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "reviewed_by" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "codex_feature_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codex_features" (
    "id" SERIAL NOT NULL,
    "run_id" BIGINT,
    "name" VARCHAR(150) NOT NULL,
    "category_id" INTEGER,
    "codex_category_id" INTEGER,
    "proposal_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "reviewed_by" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "codex_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codex_variant_features" (
    "id" SERIAL NOT NULL,
    "run_id" BIGINT,
    "variant_id" INTEGER,
    "codex_variant_id" INTEGER,
    "feature_id" INTEGER,
    "codex_feature_id" INTEGER,
    "value" VARCHAR(100),
    "proposal_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "reviewed_by" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "codex_variant_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codex_car_colors" (
    "id" SERIAL NOT NULL,
    "run_id" BIGINT,
    "model_id" INTEGER,
    "codex_model_id" INTEGER,
    "color_name" VARCHAR(50) NOT NULL,
    "image_url" VARCHAR(255),
    "additional_cost" DECIMAL(8,2),
    "proposal_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "reviewed_by" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "codex_car_colors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codex_car_color_shades" (
    "id" SERIAL NOT NULL,
    "run_id" BIGINT,
    "color_id" INTEGER,
    "codex_color_id" INTEGER,
    "color_hex" VARCHAR(7) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "proposal_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "reviewed_by" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "codex_car_color_shades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codex_car_images" (
    "id" SERIAL NOT NULL,
    "run_id" BIGINT,
    "model_id" INTEGER,
    "codex_model_id" INTEGER,
    "color_id" INTEGER,
    "codex_color_id" INTEGER,
    "image_url" VARCHAR(255) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "angle" VARCHAR(30),
    "proposal_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "reviewed_by" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "codex_car_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codex_articles" (
    "id" SERIAL NOT NULL,
    "run_id" BIGINT,
    "category_id" INTEGER NOT NULL,
    "author_id" INTEGER,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "excerpt" VARCHAR(300),
    "body" TEXT,
    "cover_image_url" VARCHAR(255),
    "read_time_minutes" INTEGER,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "scheduled_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "meta_title" VARCHAR(160),
    "meta_description" VARCHAR(300),
    "meta_keywords" VARCHAR(255),
    "og_image_url" VARCHAR(255),
    "proposal_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "reviewed_by" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "codex_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codex_article_brands" (
    "id" SERIAL NOT NULL,
    "run_id" BIGINT,
    "article_id" INTEGER,
    "codex_article_id" INTEGER,
    "brand_id" INTEGER,
    "codex_brand_id" INTEGER,
    "proposal_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "reviewed_by" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "codex_article_brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codex_article_car_models" (
    "id" SERIAL NOT NULL,
    "run_id" BIGINT,
    "article_id" INTEGER,
    "codex_article_id" INTEGER,
    "model_id" INTEGER,
    "codex_model_id" INTEGER,
    "proposal_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "reviewed_by" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "codex_article_car_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codex_car_faqs" (
    "id" SERIAL NOT NULL,
    "run_id" BIGINT,
    "model_id" INTEGER,
    "codex_model_id" INTEGER,
    "question" VARCHAR(255) NOT NULL,
    "answer" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "proposal_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "reviewed_by" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "codex_car_faqs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "codex_runs_status_started_at_idx" ON "codex_runs"("status", "started_at");

-- CreateIndex
CREATE INDEX "codex_proposal_events_run_id_created_at_idx" ON "codex_proposal_events"("run_id", "created_at");

-- CreateIndex
CREATE INDEX "codex_proposal_events_entity_type_entity_id_idx" ON "codex_proposal_events"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "codex_brands_proposal_status_created_at_idx" ON "codex_brands"("proposal_status", "created_at");

-- CreateIndex
CREATE INDEX "codex_brands_slug_idx" ON "codex_brands"("slug");

-- CreateIndex
CREATE INDEX "codex_car_models_brand_id_idx" ON "codex_car_models"("brand_id");

-- CreateIndex
CREATE INDEX "codex_car_models_codex_brand_id_idx" ON "codex_car_models"("codex_brand_id");

-- CreateIndex
CREATE INDEX "codex_car_models_body_type_id_idx" ON "codex_car_models"("body_type_id");

-- CreateIndex
CREATE INDEX "codex_car_models_proposal_status_created_at_idx" ON "codex_car_models"("proposal_status", "created_at");

-- CreateIndex
CREATE INDEX "codex_car_models_slug_idx" ON "codex_car_models"("slug");

-- CreateIndex
CREATE INDEX "codex_car_variants_model_id_idx" ON "codex_car_variants"("model_id");

-- CreateIndex
CREATE INDEX "codex_car_variants_codex_model_id_idx" ON "codex_car_variants"("codex_model_id");

-- CreateIndex
CREATE INDEX "codex_car_variants_proposal_status_created_at_idx" ON "codex_car_variants"("proposal_status", "created_at");

-- CreateIndex
CREATE INDEX "codex_powertrains_ice_variant_id_idx" ON "codex_powertrains_ice"("variant_id");

-- CreateIndex
CREATE INDEX "codex_powertrains_ice_codex_variant_id_idx" ON "codex_powertrains_ice"("codex_variant_id");

-- CreateIndex
CREATE INDEX "codex_powertrains_ice_proposal_status_created_at_idx" ON "codex_powertrains_ice"("proposal_status", "created_at");

-- CreateIndex
CREATE INDEX "codex_powertrains_electric_variant_id_idx" ON "codex_powertrains_electric"("variant_id");

-- CreateIndex
CREATE INDEX "codex_powertrains_electric_codex_variant_id_idx" ON "codex_powertrains_electric"("codex_variant_id");

-- CreateIndex
CREATE INDEX "codex_powertrains_electric_proposal_status_created_at_idx" ON "codex_powertrains_electric"("proposal_status", "created_at");

-- CreateIndex
CREATE INDEX "codex_feature_categories_proposal_status_created_at_idx" ON "codex_feature_categories"("proposal_status", "created_at");

-- CreateIndex
CREATE INDEX "codex_feature_categories_name_idx" ON "codex_feature_categories"("name");

-- CreateIndex
CREATE INDEX "codex_features_category_id_idx" ON "codex_features"("category_id");

-- CreateIndex
CREATE INDEX "codex_features_codex_category_id_idx" ON "codex_features"("codex_category_id");

-- CreateIndex
CREATE INDEX "codex_features_proposal_status_created_at_idx" ON "codex_features"("proposal_status", "created_at");

-- CreateIndex
CREATE INDEX "codex_features_name_idx" ON "codex_features"("name");

-- CreateIndex
CREATE INDEX "codex_variant_features_variant_id_idx" ON "codex_variant_features"("variant_id");

-- CreateIndex
CREATE INDEX "codex_variant_features_codex_variant_id_idx" ON "codex_variant_features"("codex_variant_id");

-- CreateIndex
CREATE INDEX "codex_variant_features_feature_id_idx" ON "codex_variant_features"("feature_id");

-- CreateIndex
CREATE INDEX "codex_variant_features_codex_feature_id_idx" ON "codex_variant_features"("codex_feature_id");

-- CreateIndex
CREATE INDEX "codex_variant_features_proposal_status_created_at_idx" ON "codex_variant_features"("proposal_status", "created_at");

-- CreateIndex
CREATE INDEX "codex_car_colors_model_id_idx" ON "codex_car_colors"("model_id");

-- CreateIndex
CREATE INDEX "codex_car_colors_codex_model_id_idx" ON "codex_car_colors"("codex_model_id");

-- CreateIndex
CREATE INDEX "codex_car_colors_proposal_status_created_at_idx" ON "codex_car_colors"("proposal_status", "created_at");

-- CreateIndex
CREATE INDEX "codex_car_color_shades_color_id_idx" ON "codex_car_color_shades"("color_id");

-- CreateIndex
CREATE INDEX "codex_car_color_shades_codex_color_id_idx" ON "codex_car_color_shades"("codex_color_id");

-- CreateIndex
CREATE INDEX "codex_car_color_shades_proposal_status_created_at_idx" ON "codex_car_color_shades"("proposal_status", "created_at");

-- CreateIndex
CREATE INDEX "codex_car_images_model_id_idx" ON "codex_car_images"("model_id");

-- CreateIndex
CREATE INDEX "codex_car_images_codex_model_id_idx" ON "codex_car_images"("codex_model_id");

-- CreateIndex
CREATE INDEX "codex_car_images_color_id_idx" ON "codex_car_images"("color_id");

-- CreateIndex
CREATE INDEX "codex_car_images_codex_color_id_idx" ON "codex_car_images"("codex_color_id");

-- CreateIndex
CREATE INDEX "codex_car_images_proposal_status_created_at_idx" ON "codex_car_images"("proposal_status", "created_at");

-- CreateIndex
CREATE INDEX "codex_articles_category_id_idx" ON "codex_articles"("category_id");

-- CreateIndex
CREATE INDEX "codex_articles_slug_idx" ON "codex_articles"("slug");

-- CreateIndex
CREATE INDEX "codex_articles_proposal_status_created_at_idx" ON "codex_articles"("proposal_status", "created_at");

-- CreateIndex
CREATE INDEX "codex_article_brands_article_id_idx" ON "codex_article_brands"("article_id");

-- CreateIndex
CREATE INDEX "codex_article_brands_codex_article_id_idx" ON "codex_article_brands"("codex_article_id");

-- CreateIndex
CREATE INDEX "codex_article_brands_brand_id_idx" ON "codex_article_brands"("brand_id");

-- CreateIndex
CREATE INDEX "codex_article_brands_codex_brand_id_idx" ON "codex_article_brands"("codex_brand_id");

-- CreateIndex
CREATE INDEX "codex_article_brands_proposal_status_created_at_idx" ON "codex_article_brands"("proposal_status", "created_at");

-- CreateIndex
CREATE INDEX "codex_article_car_models_article_id_idx" ON "codex_article_car_models"("article_id");

-- CreateIndex
CREATE INDEX "codex_article_car_models_codex_article_id_idx" ON "codex_article_car_models"("codex_article_id");

-- CreateIndex
CREATE INDEX "codex_article_car_models_model_id_idx" ON "codex_article_car_models"("model_id");

-- CreateIndex
CREATE INDEX "codex_article_car_models_codex_model_id_idx" ON "codex_article_car_models"("codex_model_id");

-- CreateIndex
CREATE INDEX "codex_article_car_models_proposal_status_created_at_idx" ON "codex_article_car_models"("proposal_status", "created_at");

-- CreateIndex
CREATE INDEX "codex_car_faqs_model_id_idx" ON "codex_car_faqs"("model_id");

-- CreateIndex
CREATE INDEX "codex_car_faqs_codex_model_id_idx" ON "codex_car_faqs"("codex_model_id");

-- CreateIndex
CREATE INDEX "codex_car_faqs_proposal_status_created_at_idx" ON "codex_car_faqs"("proposal_status", "created_at");

-- AddForeignKey
ALTER TABLE "codex_proposal_events" ADD CONSTRAINT "codex_proposal_events_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "codex_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codex_brands" ADD CONSTRAINT "codex_brands_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "codex_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codex_car_models" ADD CONSTRAINT "codex_car_models_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "codex_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codex_car_models" ADD CONSTRAINT "codex_car_models_codex_brand_id_fkey" FOREIGN KEY ("codex_brand_id") REFERENCES "codex_brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codex_car_variants" ADD CONSTRAINT "codex_car_variants_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "codex_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codex_car_variants" ADD CONSTRAINT "codex_car_variants_codex_model_id_fkey" FOREIGN KEY ("codex_model_id") REFERENCES "codex_car_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codex_powertrains_ice" ADD CONSTRAINT "codex_powertrains_ice_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "codex_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codex_powertrains_ice" ADD CONSTRAINT "codex_powertrains_ice_codex_variant_id_fkey" FOREIGN KEY ("codex_variant_id") REFERENCES "codex_car_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codex_powertrains_electric" ADD CONSTRAINT "codex_powertrains_electric_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "codex_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codex_powertrains_electric" ADD CONSTRAINT "codex_powertrains_electric_codex_variant_id_fkey" FOREIGN KEY ("codex_variant_id") REFERENCES "codex_car_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codex_feature_categories" ADD CONSTRAINT "codex_feature_categories_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "codex_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codex_features" ADD CONSTRAINT "codex_features_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "codex_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codex_features" ADD CONSTRAINT "codex_features_codex_category_id_fkey" FOREIGN KEY ("codex_category_id") REFERENCES "codex_feature_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codex_variant_features" ADD CONSTRAINT "codex_variant_features_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "codex_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codex_variant_features" ADD CONSTRAINT "codex_variant_features_codex_variant_id_fkey" FOREIGN KEY ("codex_variant_id") REFERENCES "codex_car_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codex_variant_features" ADD CONSTRAINT "codex_variant_features_codex_feature_id_fkey" FOREIGN KEY ("codex_feature_id") REFERENCES "codex_features"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codex_car_colors" ADD CONSTRAINT "codex_car_colors_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "codex_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codex_car_colors" ADD CONSTRAINT "codex_car_colors_codex_model_id_fkey" FOREIGN KEY ("codex_model_id") REFERENCES "codex_car_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codex_car_color_shades" ADD CONSTRAINT "codex_car_color_shades_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "codex_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codex_car_color_shades" ADD CONSTRAINT "codex_car_color_shades_codex_color_id_fkey" FOREIGN KEY ("codex_color_id") REFERENCES "codex_car_colors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codex_car_images" ADD CONSTRAINT "codex_car_images_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "codex_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codex_car_images" ADD CONSTRAINT "codex_car_images_codex_model_id_fkey" FOREIGN KEY ("codex_model_id") REFERENCES "codex_car_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codex_car_images" ADD CONSTRAINT "codex_car_images_codex_color_id_fkey" FOREIGN KEY ("codex_color_id") REFERENCES "codex_car_colors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codex_articles" ADD CONSTRAINT "codex_articles_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "codex_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codex_article_brands" ADD CONSTRAINT "codex_article_brands_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "codex_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codex_article_brands" ADD CONSTRAINT "codex_article_brands_codex_article_id_fkey" FOREIGN KEY ("codex_article_id") REFERENCES "codex_articles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codex_article_brands" ADD CONSTRAINT "codex_article_brands_codex_brand_id_fkey" FOREIGN KEY ("codex_brand_id") REFERENCES "codex_brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codex_article_car_models" ADD CONSTRAINT "codex_article_car_models_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "codex_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codex_article_car_models" ADD CONSTRAINT "codex_article_car_models_codex_article_id_fkey" FOREIGN KEY ("codex_article_id") REFERENCES "codex_articles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codex_article_car_models" ADD CONSTRAINT "codex_article_car_models_codex_model_id_fkey" FOREIGN KEY ("codex_model_id") REFERENCES "codex_car_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codex_car_faqs" ADD CONSTRAINT "codex_car_faqs_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "codex_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codex_car_faqs" ADD CONSTRAINT "codex_car_faqs_codex_model_id_fkey" FOREIGN KEY ("codex_model_id") REFERENCES "codex_car_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;
