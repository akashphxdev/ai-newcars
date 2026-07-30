/*
  Warnings:

  - You are about to drop the `car_features` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "car_features" DROP CONSTRAINT "car_features_variant_id_fkey";

-- DropTable
DROP TABLE "car_features";

-- CreateTable
CREATE TABLE "feature_categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "features" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "category_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_features" (
    "id" SERIAL NOT NULL,
    "variant_id" INTEGER NOT NULL,
    "feature_id" INTEGER NOT NULL,
    "value" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "variant_features_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feature_categories_name_key" ON "feature_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "features_name_key" ON "features"("name");

-- CreateIndex
CREATE UNIQUE INDEX "variant_features_variant_id_feature_id_key" ON "variant_features"("variant_id", "feature_id");

-- AddForeignKey
ALTER TABLE "features" ADD CONSTRAINT "features_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "feature_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_features" ADD CONSTRAINT "variant_features_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "car_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_features" ADD CONSTRAINT "variant_features_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
