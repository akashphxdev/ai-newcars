/*
  Warnings:

  - You are about to drop the column `charger_size_ac_11kw_hours` on the `car_powertrains_electric` table. All the data in the column will be lost.
  - You are about to drop the column `charger_size_ac_22kw_hours` on the `car_powertrains_electric` table. All the data in the column will be lost.
  - You are about to drop the column `charger_size_ac_3kw_hours` on the `car_powertrains_electric` table. All the data in the column will be lost.
  - You are about to drop the column `charger_size_ac_7kw_hours` on the `car_powertrains_electric` table. All the data in the column will be lost.
  - You are about to drop the column `city_url` on the `car_powertrains_electric` table. All the data in the column will be lost.
  - You are about to drop the column `highway_url` on the `car_powertrains_electric` table. All the data in the column will be lost.
  - You are about to drop the column `powertrain_bootspace` on the `car_powertrains_electric` table. All the data in the column will be lost.
  - You are about to drop the column `real_world_url` on the `car_powertrains_electric` table. All the data in the column will be lost.
  - You are about to drop the column `test_cycle_type` on the `car_powertrains_electric` table. All the data in the column will be lost.
  - You are about to drop the column `city_mileage` on the `car_powertrains_ice` table. All the data in the column will be lost.
  - You are about to drop the column `city_url` on the `car_powertrains_ice` table. All the data in the column will be lost.
  - You are about to drop the column `cylinder_capacity` on the `car_powertrains_ice` table. All the data in the column will be lost.
  - You are about to drop the column `highway_mileage` on the `car_powertrains_ice` table. All the data in the column will be lost.
  - You are about to drop the column `highway_url` on the `car_powertrains_ice` table. All the data in the column will be lost.
  - You are about to drop the column `power_weight` on the `car_powertrains_ice` table. All the data in the column will be lost.
  - You are about to drop the column `real_world_url` on the `car_powertrains_ice` table. All the data in the column will be lost.
  - You are about to drop the column `torque_weight` on the `car_powertrains_ice` table. All the data in the column will be lost.
  - You are about to drop the column `transmission_speed` on the `car_powertrains_ice` table. All the data in the column will be lost.
  - You are about to drop the column `transmission_sub_type` on the `car_powertrains_ice` table. All the data in the column will be lost.
  - You are about to drop the column `transmission_type_id` on the `car_powertrains_ice` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "car_powertrains_ice" DROP CONSTRAINT "car_powertrains_ice_transmission_type_id_fkey";

-- AlterTable
ALTER TABLE "car_powertrains_electric" DROP COLUMN "charger_size_ac_11kw_hours",
DROP COLUMN "charger_size_ac_22kw_hours",
DROP COLUMN "charger_size_ac_3kw_hours",
DROP COLUMN "charger_size_ac_7kw_hours",
DROP COLUMN "city_url",
DROP COLUMN "highway_url",
DROP COLUMN "powertrain_bootspace",
DROP COLUMN "real_world_url",
DROP COLUMN "test_cycle_type",
ADD COLUMN     "charging_options_raw" VARCHAR(255),
ADD COLUMN     "charging_port" VARCHAR(30),
ADD COLUMN     "emission_norm_compliance" VARCHAR(30),
ADD COLUMN     "motor_power_kw" DECIMAL(6,2),
ADD COLUMN     "regenerative_braking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "regenerative_braking_levels" INTEGER;

-- AlterTable
ALTER TABLE "car_powertrains_ice" DROP COLUMN "city_mileage",
DROP COLUMN "city_url",
DROP COLUMN "cylinder_capacity",
DROP COLUMN "highway_mileage",
DROP COLUMN "highway_url",
DROP COLUMN "power_weight",
DROP COLUMN "real_world_url",
DROP COLUMN "torque_weight",
DROP COLUMN "transmission_speed",
DROP COLUMN "transmission_sub_type",
DROP COLUMN "transmission_type_id",
ADD COLUMN     "emission_norm_compliance" VARCHAR(30),
ADD COLUMN     "turbo_charger" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "car_variants" ADD COLUMN     "boot_space_litres" INTEGER,
ADD COLUMN     "front_brake_type" VARCHAR(50),
ADD COLUMN     "front_suspension" VARCHAR(100),
ADD COLUMN     "ground_clearance_mm" INTEGER,
ADD COLUMN     "height_mm" INTEGER,
ADD COLUMN     "length_mm" INTEGER,
ADD COLUMN     "rear_brake_type" VARCHAR(50),
ADD COLUMN     "rear_suspension" VARCHAR(100),
ADD COLUMN     "steering_type" VARCHAR(50),
ADD COLUMN     "wheel_base_mm" INTEGER,
ADD COLUMN     "width_mm" INTEGER;
