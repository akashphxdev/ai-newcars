-- CreateTable
CREATE TABLE "countries" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(5) NOT NULL,
    "currency" VARCHAR(50),
    "currency_symbol" VARCHAR(10),
    "currency_code" VARCHAR(10),
    "exchange_rate" DECIMAL(12,6),
    "distance_unit" VARCHAR(10) DEFAULT 'KM',
    "fuel_unit" VARCHAR(10) DEFAULT 'Liter',
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "states" (
    "id" SERIAL NOT NULL,
    "country_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(10),

    CONSTRAINT "states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" SERIAL NOT NULL,
    "state_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" SERIAL NOT NULL,
    "district_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "is_metro" BOOLEAN NOT NULL DEFAULT false,
    "is_top_city" BOOLEAN NOT NULL DEFAULT false,
    "is_sell_car_enabled" BOOLEAN NOT NULL DEFAULT false,
    "logo_url" VARCHAR(255),

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "body_types" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "icon_url" VARCHAR(255),
    "description" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "body_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attribute_options" (
    "id" SERIAL NOT NULL,
    "category" VARCHAR(30) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,

    CONSTRAINT "attribute_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "role_name" VARCHAR(50) NOT NULL,
    "parent_role_id" INTEGER,
    "permission_ids" JSONB,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "module" VARCHAR(50) NOT NULL,
    "action" VARCHAR(20) NOT NULL,
    "permission_key" VARCHAR(100) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "mobile" VARCHAR(15) NOT NULL,
    "password_hash" VARCHAR(255),
    "role_id" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "access_start_date" DATE,
    "access_end_date" DATE,
    "last_login_at" TIMESTAMP(3),
    "last_login_ip" VARCHAR(45),
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "lock_type" VARCHAR(20),
    "locked_by" INTEGER,
    "locked_at" TIMESTAMP(3),
    "locked_reason" VARCHAR(255),
    "unlocked_by" INTEGER,
    "unlocked_at" TIMESTAMP(3),
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_logs" (
    "id" BIGSERIAL NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "description" VARCHAR(255),
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_otp_verifications" (
    "id" SERIAL NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "mobile" VARCHAR(15) NOT NULL,
    "otp_code" VARCHAR(6) NOT NULL,
    "purpose" VARCHAR(20) NOT NULL,
    "ip_address" VARCHAR(45),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_otp_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150),
    "mobile" VARCHAR(15) NOT NULL,
    "password_hash" VARCHAR(255),
    "city_id" INTEGER,
    "is_verified" BOOLEAN NOT NULL DEFAULT true,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "locked_at" TIMESTAMP(3),
    "locked_reason" VARCHAR(255),
    "last_login_at" TIMESTAMP(3),
    "last_login_ip" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_otp_verifications" (
    "id" SERIAL NOT NULL,
    "mobile" VARCHAR(15) NOT NULL,
    "otp_code" VARCHAR(6) NOT NULL,
    "purpose" VARCHAR(20) NOT NULL,
    "ip_address" VARCHAR(45),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_otp_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "logo_url" VARCHAR(255),
    "country_origin_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_models" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "body_type_id" INTEGER,
    "launch_status" VARCHAR(20) NOT NULL DEFAULT 'available',
    "expected_launch_date" DATE,
    "price_min" DECIMAL(12,2),
    "price_max" DECIMAL(12,2),
    "rating_avg" DECIMAL(3,2),
    "cover_image_url" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "car_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_variants" (
    "id" SERIAL NOT NULL,
    "model_id" INTEGER NOT NULL,
    "variant_name" VARCHAR(100) NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "seating_capacity" INTEGER NOT NULL,
    "transmission_id" INTEGER NOT NULL,
    "is_top_seller" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "car_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_powertrains_ice" (
    "id" SERIAL NOT NULL,
    "variant_id" INTEGER NOT NULL,
    "fuel_type" INTEGER NOT NULL,
    "fuel_type_sub_category" VARCHAR(30),
    "fuel_tank_capacity" DECIMAL(5,2),
    "cng_tank_capacity" DECIMAL(5,2),
    "kerb_weight" INTEGER,
    "engine_displacement" DECIMAL(5,2),
    "cubic_capacity" INTEGER,
    "cylinders" INTEGER,
    "cylinder_capacity" DECIMAL(6,2),
    "transmission_type_id" INTEGER,
    "transmission_sub_type" VARCHAR(20),
    "transmission_speed" INTEGER,
    "num_gears" INTEGER,
    "is_four_by_four" BOOLEAN NOT NULL DEFAULT false,
    "drivetrain_id" INTEGER,
    "power_ps" INTEGER,
    "power_min_rpm" INTEGER,
    "power_max_rpm" INTEGER,
    "power_weight" DECIMAL(6,2),
    "torque_nm" INTEGER,
    "torque_min_rpm" INTEGER,
    "torque_max_rpm" INTEGER,
    "torque_weight" DECIMAL(6,2),
    "claimed_fe" DECIMAL(5,2),
    "real_world_mileage" DECIMAL(5,2),
    "city_mileage" DECIMAL(5,2),
    "highway_mileage" DECIMAL(5,2),
    "top_speed_kmph" INTEGER,
    "top_speed_time_sec" DECIMAL(5,2),
    "real_world_url" VARCHAR(255),
    "city_url" VARCHAR(255),
    "highway_url" VARCHAR(255),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_by" INTEGER,
    "deleted_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "car_powertrains_ice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_powertrains_electric" (
    "id" SERIAL NOT NULL,
    "variant_id" INTEGER NOT NULL,
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
    "test_cycle_type" INTEGER,
    "top_speed_kmph" INTEGER,
    "top_speed_time_sec" DECIMAL(5,2),
    "ac_charging_output" DECIMAL(5,2),
    "ac_charging_time" DECIMAL(5,2),
    "charger_size_ac_3kw_hours" INTEGER,
    "charger_size_ac_7kw_hours" INTEGER,
    "charger_size_ac_11kw_hours" INTEGER,
    "charger_size_ac_22kw_hours" INTEGER,
    "dc_charging_output" DECIMAL(5,2),
    "dc_fast_charging_time" VARCHAR(50),
    "powertrain_bootspace" INTEGER,
    "battery_warranty_km" INTEGER,
    "battery_warranty_years" INTEGER,
    "motor_warranty_km" INTEGER,
    "motor_warranty_years" INTEGER,
    "standard_warranty_km" VARCHAR(20),
    "standard_warranty_years" INTEGER,
    "real_world_url" VARCHAR(255),
    "city_url" VARCHAR(255),
    "highway_url" VARCHAR(255),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_by" INTEGER,
    "deleted_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "car_powertrains_electric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_images" (
    "id" SERIAL NOT NULL,
    "model_id" INTEGER NOT NULL,
    "variant_id" INTEGER,
    "color_id" INTEGER,
    "image_url" VARCHAR(255) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "angle" VARCHAR(30),

    CONSTRAINT "car_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_features" (
    "id" SERIAL NOT NULL,
    "variant_id" INTEGER NOT NULL,
    "airbags_count" INTEGER,
    "abs_with_ebd" BOOLEAN NOT NULL DEFAULT false,
    "esc" BOOLEAN NOT NULL DEFAULT false,
    "hill_assist" BOOLEAN NOT NULL DEFAULT false,
    "rear_parking_camera" BOOLEAN NOT NULL DEFAULT false,
    "front_parking_sensors" BOOLEAN NOT NULL DEFAULT false,
    "tpms" BOOLEAN NOT NULL DEFAULT false,
    "isofix_mounts" BOOLEAN NOT NULL DEFAULT false,
    "ncap_rating" DECIMAL(2,1),
    "sunroof" BOOLEAN NOT NULL DEFAULT false,
    "keyless_entry" BOOLEAN NOT NULL DEFAULT false,
    "push_button_start" BOOLEAN NOT NULL DEFAULT false,
    "cruise_control" BOOLEAN NOT NULL DEFAULT false,
    "climate_control" BOOLEAN NOT NULL DEFAULT false,
    "rear_ac_vents" BOOLEAN NOT NULL DEFAULT false,
    "auto_dimming_mirror" BOOLEAN NOT NULL DEFAULT false,
    "power_windows" BOOLEAN NOT NULL DEFAULT false,
    "upholstery_type" VARCHAR(30),
    "adjustable_seats" BOOLEAN NOT NULL DEFAULT false,
    "ventilated_seats" BOOLEAN NOT NULL DEFAULT false,
    "rear_armrest" BOOLEAN NOT NULL DEFAULT false,
    "led_headlamps" BOOLEAN NOT NULL DEFAULT false,
    "led_drls" BOOLEAN NOT NULL DEFAULT false,
    "alloy_wheels" BOOLEAN NOT NULL DEFAULT false,
    "roof_rails" BOOLEAN NOT NULL DEFAULT false,
    "fog_lamps" BOOLEAN NOT NULL DEFAULT false,
    "touchscreen_size_inch" DECIMAL(3,1),
    "android_auto" BOOLEAN NOT NULL DEFAULT false,
    "apple_carplay" BOOLEAN NOT NULL DEFAULT false,
    "connected_car_tech" BOOLEAN NOT NULL DEFAULT false,
    "number_of_speakers" INTEGER,
    "wireless_charging" BOOLEAN NOT NULL DEFAULT false,
    "extra_features" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "car_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_faqs" (
    "id" SERIAL NOT NULL,
    "model_id" INTEGER NOT NULL,
    "question" VARCHAR(255) NOT NULL,
    "answer" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "car_faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_videos" (
    "id" SERIAL NOT NULL,
    "model_id" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "video_type" INTEGER NOT NULL,
    "video_url" VARCHAR(255) NOT NULL,
    "thumbnail_url" VARCHAR(255) NOT NULL,
    "duration_seconds" INTEGER NOT NULL,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "published_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "car_videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_colors" (
    "id" SERIAL NOT NULL,
    "model_id" INTEGER NOT NULL,
    "color_name" VARCHAR(50) NOT NULL,
    "image_url" VARCHAR(255),
    "additional_cost" DECIMAL(8,2),

    CONSTRAINT "car_colors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_color_shades" (
    "id" SERIAL NOT NULL,
    "color_id" INTEGER NOT NULL,
    "color_hex" VARCHAR(7) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "car_color_shades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "new_car_offers" (
    "id" SERIAL NOT NULL,
    "model_id" INTEGER NOT NULL,
    "variant_id" INTEGER,
    "city_id" INTEGER,
    "offer_type" INTEGER,
    "offer_amount" DECIMAL(10,2),
    "description" VARCHAR(255),
    "valid_from" DATE,
    "valid_until" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "image_url" VARCHAR(255) NOT NULL,

    CONSTRAINT "new_car_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "used_car_listings" (
    "id" SERIAL NOT NULL,
    "seller_id" INTEGER NOT NULL,
    "model_id" INTEGER NOT NULL,
    "variant_id" INTEGER,
    "powertrain_type" VARCHAR(10),
    "powertrain_id" INTEGER,
    "year" INTEGER,
    "registration_number" VARCHAR(20),
    "km_driven" INTEGER,
    "owner_count" INTEGER,
    "color" VARCHAR(50),
    "price" DECIMAL(12,2),
    "city_id" INTEGER NOT NULL,
    "insurance_valid_till" DATE,
    "is_inspected" BOOLEAN NOT NULL DEFAULT false,
    "inspection_report_url" VARCHAR(255),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "used_car_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "used_car_listing_images" (
    "id" SERIAL NOT NULL,
    "listing_id" INTEGER NOT NULL,
    "image_url" VARCHAR(255) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "used_car_listing_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sell_car_leads" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "name" VARCHAR(100),
    "mobile" VARCHAR(15) NOT NULL,
    "brand_id" INTEGER,
    "model_id" INTEGER,
    "year" INTEGER,
    "km_driven" INTEGER,
    "city_id" INTEGER,
    "status" VARCHAR(20) NOT NULL DEFAULT 'new',
    "lead_channel" VARCHAR(30),
    "utm_source" VARCHAR(100),
    "utm_medium" VARCHAR(100),
    "utm_campaign" VARCHAR(150),
    "landing_page" VARCHAR(255),
    "device_type" VARCHAR(20),
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sell_car_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buy_new_car_leads" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "name" VARCHAR(100),
    "mobile" VARCHAR(15) NOT NULL,
    "brand_id" INTEGER,
    "model_id" INTEGER,
    "city_id" INTEGER,
    "interest_type" VARCHAR(30),
    "status" VARCHAR(20) NOT NULL DEFAULT 'new',
    "lead_channel" VARCHAR(30),
    "utm_source" VARCHAR(100),
    "utm_medium" VARCHAR(100),
    "utm_campaign" VARCHAR(150),
    "landing_page" VARCHAR(255),
    "device_type" VARCHAR(20),
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buy_new_car_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buy_used_car_leads" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "name" VARCHAR(100),
    "mobile" VARCHAR(15) NOT NULL,
    "brand_id" INTEGER,
    "model_id" INTEGER,
    "listing_id" INTEGER,
    "status" VARCHAR(20) NOT NULL DEFAULT 'new',
    "lead_channel" VARCHAR(30),
    "utm_source" VARCHAR(100),
    "utm_medium" VARCHAR(100),
    "utm_campaign" VARCHAR(150),
    "landing_page" VARCHAR(255),
    "device_type" VARCHAR(20),
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buy_used_car_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_leads" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "name" VARCHAR(100),
    "mobile" VARCHAR(15) NOT NULL,
    "brand_id" INTEGER,
    "model_id" INTEGER,
    "registration_number" VARCHAR(20),
    "city_id" INTEGER,
    "status" VARCHAR(20) NOT NULL DEFAULT 'new',
    "lead_channel" VARCHAR(30),
    "utm_source" VARCHAR(100),
    "utm_medium" VARCHAR(100),
    "utm_campaign" VARCHAR(150),
    "landing_page" VARCHAR(255),
    "device_type" VARCHAR(20),
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insurance_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lenders" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "logo_url" VARCHAR(255),
    "min_interest_rate" DECIMAL(4,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "lenders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_leads" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "name" VARCHAR(100),
    "mobile" VARCHAR(15) NOT NULL,
    "brand_id" INTEGER,
    "model_id" INTEGER,
    "lender_id" INTEGER,
    "loan_amount" DECIMAL(12,2),
    "tenure_years" INTEGER,
    "monthly_income" DECIMAL(10,2),
    "status" VARCHAR(20) NOT NULL DEFAULT 'new',
    "lead_channel" VARCHAR(30),
    "utm_source" VARCHAR(100),
    "utm_medium" VARCHAR(100),
    "utm_campaign" VARCHAR(150),
    "landing_page" VARCHAR(255),
    "device_type" VARCHAR(20),
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soft_leads" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "mobile" VARCHAR(15),
    "brand_id" INTEGER,
    "model_id" INTEGER,
    "calculator_type" VARCHAR(20),
    "input_summary" VARCHAR(255),
    "status" VARCHAR(20) NOT NULL DEFAULT 'new',
    "lead_channel" VARCHAR(30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "soft_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_drop_alert_leads" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "mobile" VARCHAR(15) NOT NULL,
    "email" VARCHAR(150),
    "brand_id" INTEGER,
    "model_id" INTEGER,
    "alert_type" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notified_at" TIMESTAMP(3),
    "lead_channel" VARCHAR(30),
    "utm_source" VARCHAR(100),
    "utm_medium" VARCHAR(100),
    "utm_campaign" VARCHAR(150),
    "landing_page" VARCHAR(255),
    "device_type" VARCHAR(20),
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_drop_alert_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_activities" (
    "id" BIGSERIAL NOT NULL,
    "lead_type" VARCHAR(30) NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "activity_type" VARCHAR(20),
    "notes" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "model_id" INTEGER NOT NULL,
    "variant_id" INTEGER,
    "rating" DECIMAL(2,1),
    "title" VARCHAR(150),
    "body" TEXT,
    "ownership_duration" VARCHAR(50),
    "km_driven" INTEGER,
    "is_verified_owner" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "rejected_reason" VARCHAR(255),
    "helpful_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_category_scores" (
    "id" SERIAL NOT NULL,
    "review_id" INTEGER NOT NULL,
    "category" VARCHAR(30),
    "score" DECIMAL(2,1),

    CONSTRAINT "review_category_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_images" (
    "id" SERIAL NOT NULL,
    "review_id" INTEGER NOT NULL,
    "image_url" VARCHAR(255) NOT NULL,

    CONSTRAINT "review_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_helpful_votes" (
    "id" SERIAL NOT NULL,
    "review_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_helpful_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mileage_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "model_id" INTEGER,
    "odometer" INTEGER NOT NULL,
    "fuel_filled" DECIMAL(5,2) NOT NULL,
    "distance_covered" INTEGER,
    "mileage_result" DECIMAL(5,2),
    "logged_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mileage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_placements" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "page_type" VARCHAR(50),
    "ad_type" VARCHAR(20),
    "dimensions" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ad_placements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advertisers" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "contact_name" VARCHAR(100),
    "contact_mobile" VARCHAR(15),
    "contact_email" VARCHAR(150),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advertisers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_campaigns" (
    "id" SERIAL NOT NULL,
    "placement_id" INTEGER NOT NULL,
    "advertiser_id" INTEGER,
    "ad_type" VARCHAR(20) NOT NULL,
    "name" VARCHAR(150),
    "creative_image_url" VARCHAR(255),
    "target_url" VARCHAR(255),
    "network_slot_id" VARCHAR(150),
    "network_script" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_impressions" (
    "id" BIGSERIAL NOT NULL,
    "campaign_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "page_url" VARCHAR(255),
    "device_type" VARCHAR(20),
    "ip_address" VARCHAR(45),
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_impressions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_clicks" (
    "id" BIGSERIAL NOT NULL,
    "campaign_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "page_url" VARCHAR(255),
    "device_type" VARCHAR(20),
    "ip_address" VARCHAR(45),
    "clicked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" VARCHAR(150),
    "message" VARCHAR(300),
    "type" VARCHAR(30),
    "reference_type" VARCHAR(30),
    "reference_id" INTEGER,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_views" (
    "id" BIGSERIAL NOT NULL,
    "page_type" VARCHAR(30),
    "page_id" INTEGER,
    "user_id" INTEGER,
    "page_url" VARCHAR(255),
    "device_type" VARCHAR(20),
    "ip_address" VARCHAR(45),
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_logs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER,
    "search_query" VARCHAR(255),
    "results_count" INTEGER,
    "page_url" VARCHAR(255),
    "device_type" VARCHAR(20),
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo_meta" (
    "id" SERIAL NOT NULL,
    "page_type" VARCHAR(30) NOT NULL,
    "page_id" INTEGER,
    "static_page_slug" VARCHAR(100),
    "meta_title" VARCHAR(160),
    "meta_description" VARCHAR(300),
    "meta_keywords" VARCHAR(255),
    "canonical_url" VARCHAR(255),
    "og_image_url" VARCHAR(255),
    "robots_directive" VARCHAR(50),
    "schema_type" VARCHAR(50),
    "updated_by" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seo_meta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo_redirects" (
    "id" SERIAL NOT NULL,
    "old_path" VARCHAR(255) NOT NULL,
    "new_path" VARCHAR(255) NOT NULL,
    "redirect_type" INTEGER NOT NULL DEFAULT 301,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seo_redirects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sitemap_entries" (
    "id" SERIAL NOT NULL,
    "page_type" VARCHAR(30) NOT NULL,
    "page_id" INTEGER,
    "url_path" VARCHAR(255) NOT NULL,
    "priority" DECIMAL(2,1) DEFAULT 0.5,
    "change_frequency" VARCHAR(20),
    "is_included" BOOLEAN NOT NULL DEFAULT true,
    "last_modified" TIMESTAMP(3),

    CONSTRAINT "sitemap_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_addresses" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "address_type" VARCHAR(20),
    "address_line1" VARCHAR(255),
    "address_line2" VARCHAR(255),
    "city_id" INTEGER NOT NULL,
    "pincode" VARCHAR(10),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "article_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" SERIAL NOT NULL,
    "category_id" INTEGER NOT NULL,
    "author_id" INTEGER NOT NULL,
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_brands" (
    "id" SERIAL NOT NULL,
    "article_id" INTEGER NOT NULL,
    "brand_id" INTEGER NOT NULL,

    CONSTRAINT "article_brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_car_models" (
    "id" SERIAL NOT NULL,
    "article_id" INTEGER NOT NULL,
    "model_id" INTEGER NOT NULL,

    CONSTRAINT "article_car_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_comments" (
    "id" SERIAL NOT NULL,
    "article_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "parent_comment_id" INTEGER,
    "body" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'visible',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_groups" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "cover_media_type" VARCHAR(10) NOT NULL,
    "cover_media_url" VARCHAR(255) NOT NULL,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "story_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_items" (
    "id" SERIAL NOT NULL,
    "group_id" INTEGER NOT NULL,
    "media_type" VARCHAR(10) NOT NULL,
    "media_url" VARCHAR(255) NOT NULL,
    "description" VARCHAR(300),
    "link" VARCHAR(255),
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "story_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cities_slug_key" ON "cities"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "body_types_slug_key" ON "body_types"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "attribute_options_category_slug_key" ON "attribute_options"("category", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_permission_key_key" ON "permissions"("permission_key");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_mobile_key" ON "admin_users"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_mobile_key" ON "users"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "brands_slug_key" ON "brands"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "car_models_slug_key" ON "car_models"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "car_variants_model_id_variant_name_key" ON "car_variants"("model_id", "variant_name");

-- CreateIndex
CREATE UNIQUE INDEX "car_faqs_model_id_display_order_key" ON "car_faqs"("model_id", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "review_helpful_votes_review_id_user_id_key" ON "review_helpful_votes"("review_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ad_placements_slug_key" ON "ad_placements"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "seo_redirects_old_path_key" ON "seo_redirects"("old_path");

-- CreateIndex
CREATE UNIQUE INDEX "article_categories_slug_key" ON "article_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "article_brands_article_id_brand_id_key" ON "article_brands"("article_id", "brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "article_car_models_article_id_model_id_key" ON "article_car_models"("article_id", "model_id");

-- AddForeignKey
ALTER TABLE "states" ADD CONSTRAINT "states_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "districts" ADD CONSTRAINT "districts_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cities" ADD CONSTRAINT "cities_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_parent_role_id_fkey" FOREIGN KEY ("parent_role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_locked_by_fkey" FOREIGN KEY ("locked_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_unlocked_by_fkey" FOREIGN KEY ("unlocked_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_otp_verifications" ADD CONSTRAINT "admin_otp_verifications_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brands" ADD CONSTRAINT "brands_country_origin_id_fkey" FOREIGN KEY ("country_origin_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_models" ADD CONSTRAINT "car_models_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_models" ADD CONSTRAINT "car_models_body_type_id_fkey" FOREIGN KEY ("body_type_id") REFERENCES "body_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_variants" ADD CONSTRAINT "car_variants_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "car_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_variants" ADD CONSTRAINT "car_variants_transmission_id_fkey" FOREIGN KEY ("transmission_id") REFERENCES "attribute_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_powertrains_ice" ADD CONSTRAINT "car_powertrains_ice_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "car_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_powertrains_ice" ADD CONSTRAINT "car_powertrains_ice_transmission_type_id_fkey" FOREIGN KEY ("transmission_type_id") REFERENCES "attribute_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_powertrains_ice" ADD CONSTRAINT "car_powertrains_ice_drivetrain_id_fkey" FOREIGN KEY ("drivetrain_id") REFERENCES "attribute_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_powertrains_ice" ADD CONSTRAINT "car_powertrains_ice_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_powertrains_electric" ADD CONSTRAINT "car_powertrains_electric_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "car_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_powertrains_electric" ADD CONSTRAINT "car_powertrains_electric_drivetrain_id_fkey" FOREIGN KEY ("drivetrain_id") REFERENCES "attribute_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_powertrains_electric" ADD CONSTRAINT "car_powertrains_electric_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_images" ADD CONSTRAINT "car_images_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "car_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_images" ADD CONSTRAINT "car_images_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "car_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_images" ADD CONSTRAINT "car_images_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "car_colors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_features" ADD CONSTRAINT "car_features_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "car_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_faqs" ADD CONSTRAINT "car_faqs_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "car_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_videos" ADD CONSTRAINT "car_videos_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "car_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_colors" ADD CONSTRAINT "car_colors_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "car_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_color_shades" ADD CONSTRAINT "car_color_shades_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "car_colors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "new_car_offers" ADD CONSTRAINT "new_car_offers_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "car_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "new_car_offers" ADD CONSTRAINT "new_car_offers_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "car_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "new_car_offers" ADD CONSTRAINT "new_car_offers_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "used_car_listings" ADD CONSTRAINT "used_car_listings_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "used_car_listings" ADD CONSTRAINT "used_car_listings_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "car_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "used_car_listings" ADD CONSTRAINT "used_car_listings_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "car_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "used_car_listings" ADD CONSTRAINT "used_car_listings_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "used_car_listing_images" ADD CONSTRAINT "used_car_listing_images_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "used_car_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sell_car_leads" ADD CONSTRAINT "sell_car_leads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sell_car_leads" ADD CONSTRAINT "sell_car_leads_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sell_car_leads" ADD CONSTRAINT "sell_car_leads_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "car_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sell_car_leads" ADD CONSTRAINT "sell_car_leads_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buy_new_car_leads" ADD CONSTRAINT "buy_new_car_leads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buy_new_car_leads" ADD CONSTRAINT "buy_new_car_leads_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buy_new_car_leads" ADD CONSTRAINT "buy_new_car_leads_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "car_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buy_new_car_leads" ADD CONSTRAINT "buy_new_car_leads_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buy_used_car_leads" ADD CONSTRAINT "buy_used_car_leads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buy_used_car_leads" ADD CONSTRAINT "buy_used_car_leads_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buy_used_car_leads" ADD CONSTRAINT "buy_used_car_leads_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "car_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buy_used_car_leads" ADD CONSTRAINT "buy_used_car_leads_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "used_car_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_leads" ADD CONSTRAINT "insurance_leads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_leads" ADD CONSTRAINT "insurance_leads_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_leads" ADD CONSTRAINT "insurance_leads_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "car_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_leads" ADD CONSTRAINT "insurance_leads_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_leads" ADD CONSTRAINT "loan_leads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_leads" ADD CONSTRAINT "loan_leads_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_leads" ADD CONSTRAINT "loan_leads_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "car_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_leads" ADD CONSTRAINT "loan_leads_lender_id_fkey" FOREIGN KEY ("lender_id") REFERENCES "lenders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soft_leads" ADD CONSTRAINT "soft_leads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soft_leads" ADD CONSTRAINT "soft_leads_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soft_leads" ADD CONSTRAINT "soft_leads_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "car_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_drop_alert_leads" ADD CONSTRAINT "price_drop_alert_leads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_drop_alert_leads" ADD CONSTRAINT "price_drop_alert_leads_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_drop_alert_leads" ADD CONSTRAINT "price_drop_alert_leads_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "car_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "car_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "car_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_category_scores" ADD CONSTRAINT "review_category_scores_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_images" ADD CONSTRAINT "review_images_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_helpful_votes" ADD CONSTRAINT "review_helpful_votes_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_helpful_votes" ADD CONSTRAINT "review_helpful_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mileage_logs" ADD CONSTRAINT "mileage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mileage_logs" ADD CONSTRAINT "mileage_logs_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "car_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_placement_id_fkey" FOREIGN KEY ("placement_id") REFERENCES "ad_placements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_advertiser_id_fkey" FOREIGN KEY ("advertiser_id") REFERENCES "advertisers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_impressions" ADD CONSTRAINT "ad_impressions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "ad_campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_impressions" ADD CONSTRAINT "ad_impressions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_clicks" ADD CONSTRAINT "ad_clicks_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "ad_campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_clicks" ADD CONSTRAINT "ad_clicks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_logs" ADD CONSTRAINT "search_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seo_meta" ADD CONSTRAINT "seo_meta_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seo_redirects" ADD CONSTRAINT "seo_redirects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_categories" ADD CONSTRAINT "article_categories_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_categories" ADD CONSTRAINT "article_categories_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "article_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_brands" ADD CONSTRAINT "article_brands_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_brands" ADD CONSTRAINT "article_brands_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_car_models" ADD CONSTRAINT "article_car_models_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_car_models" ADD CONSTRAINT "article_car_models_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "car_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_comments" ADD CONSTRAINT "article_comments_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_comments" ADD CONSTRAINT "article_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_comments" ADD CONSTRAINT "article_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "article_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_groups" ADD CONSTRAINT "story_groups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_groups" ADD CONSTRAINT "story_groups_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_items" ADD CONSTRAINT "story_items_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "story_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_items" ADD CONSTRAINT "story_items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_items" ADD CONSTRAINT "story_items_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
