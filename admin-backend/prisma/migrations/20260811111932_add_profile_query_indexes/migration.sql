-- CreateIndex
CREATE INDEX "buy_new_car_leads_user_id_created_at_idx" ON "buy_new_car_leads"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "insurance_leads_user_id_created_at_idx" ON "insurance_leads"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "launch_notify_leads_user_id_is_active_created_at_idx" ON "launch_notify_leads"("user_id", "is_active", "created_at");

-- CreateIndex
CREATE INDEX "loan_leads_user_id_created_at_idx" ON "loan_leads"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "price_drop_alert_leads_user_id_is_active_created_at_idx" ON "price_drop_alert_leads"("user_id", "is_active", "created_at");

-- CreateIndex
CREATE INDEX "reviews_user_id_created_at_idx" ON "reviews"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "soft_leads_user_id_created_at_idx" ON "soft_leads"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "wishlists_user_id_created_at_idx" ON "wishlists"("user_id", "created_at");
