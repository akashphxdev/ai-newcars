-- AlterTable
ALTER TABLE "ai_automation_rules" ADD COLUMN     "auto_publish" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "delete_strategy" VARCHAR(20) NOT NULL DEFAULT 'latest',
ADD COLUMN     "language" VARCHAR(20) NOT NULL DEFAULT 'english',
ADD COLUMN     "max_total" INTEGER;

-- AlterTable
ALTER TABLE "car_faqs" ADD COLUMN     "view_count" INTEGER NOT NULL DEFAULT 0;
