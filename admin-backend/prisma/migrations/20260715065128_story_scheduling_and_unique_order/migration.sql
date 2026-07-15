/*
  Warnings:

  - You are about to drop the column `is_active` on the `story_items` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[display_order]` on the table `story_groups` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[group_id,display_order]` on the table `story_items` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "story_groups" ALTER COLUMN "display_order" DROP DEFAULT;

-- AlterTable
ALTER TABLE "story_items" DROP COLUMN "is_active",
ADD COLUMN     "end_at" TIMESTAMP(3),
ADD COLUMN     "start_at" TIMESTAMP(3),
ADD COLUMN     "status" VARCHAR(10) NOT NULL DEFAULT 'draft',
ALTER COLUMN "display_order" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "story_groups_display_order_key" ON "story_groups"("display_order");

-- CreateIndex
CREATE UNIQUE INDEX "story_items_group_id_display_order_key" ON "story_items"("group_id", "display_order");
