-- CreateIndex
CREATE INDEX "admin_logs_admin_id_created_at_idx" ON "admin_logs"("admin_id", "created_at");

-- CreateIndex
CREATE INDEX "admin_otp_verifications_mobile_purpose_idx" ON "admin_otp_verifications"("mobile", "purpose");

-- CreateIndex
CREATE INDEX "admin_users_role_id_idx" ON "admin_users"("role_id");

-- CreateIndex
CREATE INDEX "article_brands_brand_id_idx" ON "article_brands"("brand_id");

-- CreateIndex
CREATE INDEX "article_car_models_model_id_idx" ON "article_car_models"("model_id");

-- CreateIndex
CREATE INDEX "articles_status_is_active_published_at_idx" ON "articles"("status", "is_active", "published_at");

-- CreateIndex
CREATE INDEX "articles_category_id_idx" ON "articles"("category_id");

-- CreateIndex
CREATE INDEX "buy_used_car_leads_status_created_at_idx" ON "buy_used_car_leads"("status", "created_at");

-- CreateIndex
CREATE INDEX "buy_used_car_leads_mobile_idx" ON "buy_used_car_leads"("mobile");

-- CreateIndex
CREATE INDEX "buy_used_car_leads_brand_id_model_id_idx" ON "buy_used_car_leads"("brand_id", "model_id");

-- CreateIndex
CREATE INDEX "car_colors_model_id_idx" ON "car_colors"("model_id");

-- CreateIndex
CREATE INDEX "car_images_model_id_idx" ON "car_images"("model_id");

-- CreateIndex
CREATE INDEX "car_models_brand_id_idx" ON "car_models"("brand_id");

-- CreateIndex
CREATE INDEX "car_models_body_type_id_idx" ON "car_models"("body_type_id");

-- CreateIndex
CREATE INDEX "car_models_launch_status_idx" ON "car_models"("launch_status");

-- CreateIndex
CREATE INDEX "car_models_price_min_idx" ON "car_models"("price_min");

-- CreateIndex
CREATE INDEX "car_powertrains_electric_variant_id_is_deleted_idx" ON "car_powertrains_electric"("variant_id", "is_deleted");

-- CreateIndex
CREATE INDEX "car_powertrains_ice_variant_id_is_deleted_idx" ON "car_powertrains_ice"("variant_id", "is_deleted");

-- CreateIndex
CREATE INDEX "car_variants_model_id_idx" ON "car_variants"("model_id");

-- CreateIndex
CREATE INDEX "cities_state_id_idx" ON "cities"("state_id");

-- CreateIndex
CREATE INDEX "lead_activities_lead_type_lead_id_idx" ON "lead_activities"("lead_type", "lead_id");

-- CreateIndex
CREATE INDEX "lead_activities_admin_id_idx" ON "lead_activities"("admin_id");

-- CreateIndex
CREATE INDEX "new_car_offers_model_id_idx" ON "new_car_offers"("model_id");

-- CreateIndex
CREATE INDEX "new_car_offers_is_active_idx" ON "new_car_offers"("is_active");

-- CreateIndex
CREATE INDEX "sell_car_leads_status_created_at_idx" ON "sell_car_leads"("status", "created_at");

-- CreateIndex
CREATE INDEX "sell_car_leads_mobile_idx" ON "sell_car_leads"("mobile");

-- CreateIndex
CREATE INDEX "sell_car_leads_brand_id_model_id_idx" ON "sell_car_leads"("brand_id", "model_id");

-- CreateIndex
CREATE INDEX "states_country_id_idx" ON "states"("country_id");

-- CreateIndex
CREATE INDEX "used_car_listings_model_id_idx" ON "used_car_listings"("model_id");

-- CreateIndex
CREATE INDEX "used_car_listings_city_id_idx" ON "used_car_listings"("city_id");

-- CreateIndex
CREATE INDEX "used_car_listings_seller_id_idx" ON "used_car_listings"("seller_id");

-- CreateIndex
CREATE INDEX "used_car_listings_status_idx" ON "used_car_listings"("status");

-- CreateIndex
CREATE INDEX "user_otp_verifications_mobile_purpose_idx" ON "user_otp_verifications"("mobile", "purpose");
