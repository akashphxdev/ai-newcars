/*
  Warnings:

  - You are about to drop the column `auto_pick_images` on the `ai_automation_rules` table. All the data in the column will be lost.
  - You are about to drop the column `image_folder` on the `ai_automation_rules` table. All the data in the column will be lost.
  - You are about to drop the column `auto_save_mode` on the `ai_settings` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `ai_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ai_automation_rules" DROP COLUMN "auto_pick_images",
DROP COLUMN "image_folder";

-- AlterTable
ALTER TABLE "ai_settings" DROP COLUMN "auto_save_mode",
DROP COLUMN "language";
