package store

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/shopspring/decimal"
)

// These two queries live outside sqlc for the same reason carcards.go
// does: their powertrain columns come through LEFT JOIN LATERAL, and
// sqlc cannot infer nullability across a lateral subquery — it types
// every such column as non-null (or as interface{}), which would panic on
// the first variant that has no ICE or no electric powertrain.

type VariantDetail struct {
	ID               int32
	VariantName      string
	Price            decimal.Decimal
	SeatingCapacity  int32
	TransmissionName *string

	LengthMm          *int32
	WidthMm           *int32
	HeightMm          *int32
	WheelBaseMm       *int32
	GroundClearanceMm *int32
	BootSpaceLitres   *int32
	FrontSuspension   *string
	RearSuspension    *string
	SteeringType      *string
	FrontBrakeType    *string
	RearBrakeType     *string

	HasICE              bool
	FuelType            *int32
	FuelTypeSubCategory *string
	FuelTankCapacity    decimal.NullDecimal
	CngTankCapacity     decimal.NullDecimal
	KerbWeight          *int32
	EngineDisplacement  decimal.NullDecimal
	CubicCapacity       *int32
	Cylinders           *int32
	NumGears            *int32
	IsFourByFour        bool
	IceDrivetrainName   *string
	IcePowerPs          *int32
	PowerMinRpm         *int32
	PowerMaxRpm         *int32
	IceTorqueNm         *int32
	TorqueMinRpm        *int32
	TorqueMaxRpm        *int32
	ClaimedFe           decimal.NullDecimal
	RealWorldMileage    decimal.NullDecimal
	IceTopSpeedKmph     *int32
	IceTopSpeedTimeSec  decimal.NullDecimal
	IceEmissionNorm     *string
	TurboCharger        bool

	IsElectric                bool
	NumMotors                 *int32
	MotorType                 *string
	BatteryCapacity           decimal.NullDecimal
	BatteryChemistry          *string
	ThermalManagementSystem   *string
	EvDrivetrainName          *string
	EvPowerPs                 *int32
	EvTorqueNm                *int32
	ClaimedRange              *int32
	RealWorldRange            *int32
	EvTopSpeedKmph            *int32
	EvTopSpeedTimeSec         decimal.NullDecimal
	AcChargingOutput          decimal.NullDecimal
	AcChargingTime            decimal.NullDecimal
	DcChargingOutput          decimal.NullDecimal
	DcFastChargingTime        *string
	BatteryWarrantyKm         *int32
	BatteryWarrantyYears      *int32
	MotorWarrantyKm           *int32
	MotorWarrantyYears        *int32
	StandardWarrantyKm        *string
	StandardWarrantyYears     *int32
	EvEmissionNorm            *string
	MotorPowerKw              decimal.NullDecimal
	ChargingPort              *string
	ChargingOptionsRaw        *string
	RegenerativeBraking       bool
	RegenerativeBrakingLevels *int32
}

const variantDetailSQL = `
SELECT
    v.id, v.variant_name, v.price, v.seating_capacity, t.name,
    v.length_mm, v.width_mm, v.height_mm, v.wheel_base_mm,
    v.ground_clearance_mm, v.boot_space_litres,
    v.front_suspension, v.rear_suspension, v.steering_type,
    v.front_brake_type, v.rear_brake_type,

    (i.id IS NOT NULL),
    i.fuel_type, i.fuel_type_sub_category, i.fuel_tank_capacity, i.cng_tank_capacity,
    i.kerb_weight, i.engine_displacement, i.cubic_capacity, i.cylinders, i.num_gears,
    coalesce(i.is_four_by_four, false), idt.name,
    i.power_ps, i.power_min_rpm, i.power_max_rpm,
    i.torque_nm, i.torque_min_rpm, i.torque_max_rpm,
    i.claimed_fe, i.real_world_mileage, i.top_speed_kmph, i.top_speed_time_sec,
    i.emission_norm_compliance, coalesce(i.turbo_charger, false),

    (e.id IS NOT NULL),
    e.num_motors, e.motor_type, e.battery_capacity, e.battery_chemistry,
    e.thermal_management_system, edt.name, e.power_ps, e.torque_nm,
    e.claimed_range, e.real_world_range, e.top_speed_kmph, e.top_speed_time_sec,
    e.ac_charging_output, e.ac_charging_time, e.dc_charging_output, e.dc_fast_charging_time,
    e.battery_warranty_km, e.battery_warranty_years, e.motor_warranty_km, e.motor_warranty_years,
    e.standard_warranty_km, e.standard_warranty_years,
    e.emission_norm_compliance, e.motor_power_kw, e.charging_port, e.charging_options_raw,
    coalesce(e.regenerative_braking, false), e.regenerative_braking_levels
FROM car_variants v
LEFT JOIN attribute_options t ON t.id = v.transmission_id
LEFT JOIN LATERAL (
    SELECT * FROM car_powertrains_ice p
    WHERE p.variant_id = v.id AND p.is_deleted = false
    ORDER BY p.is_default DESC LIMIT 1
) i ON true
LEFT JOIN attribute_options idt ON idt.id = i.drivetrain_id
LEFT JOIN LATERAL (
    SELECT * FROM car_powertrains_electric p
    WHERE p.variant_id = v.id AND p.is_deleted = false
    ORDER BY p.is_default DESC LIMIT 1
) e ON true
LEFT JOIN attribute_options edt ON edt.id = e.drivetrain_id
WHERE v.id = $1 AND v.model_id = $2`

// GetVariantDetail returns the chassis fields plus the default ICE and
// electric powertrain in one round-trip. Prisma issued three queries here
// (variant, then each powertrain relation).
func GetVariantDetail(ctx context.Context, db *pgxpool.Pool, variantID, modelID int32) (*VariantDetail, error) {
	var d VariantDetail
	err := db.QueryRow(ctx, variantDetailSQL, variantID, modelID).Scan(
		&d.ID, &d.VariantName, &d.Price, &d.SeatingCapacity, &d.TransmissionName,
		&d.LengthMm, &d.WidthMm, &d.HeightMm, &d.WheelBaseMm,
		&d.GroundClearanceMm, &d.BootSpaceLitres,
		&d.FrontSuspension, &d.RearSuspension, &d.SteeringType,
		&d.FrontBrakeType, &d.RearBrakeType,

		&d.HasICE,
		&d.FuelType, &d.FuelTypeSubCategory, &d.FuelTankCapacity, &d.CngTankCapacity,
		&d.KerbWeight, &d.EngineDisplacement, &d.CubicCapacity, &d.Cylinders, &d.NumGears,
		&d.IsFourByFour, &d.IceDrivetrainName,
		&d.IcePowerPs, &d.PowerMinRpm, &d.PowerMaxRpm,
		&d.IceTorqueNm, &d.TorqueMinRpm, &d.TorqueMaxRpm,
		&d.ClaimedFe, &d.RealWorldMileage, &d.IceTopSpeedKmph, &d.IceTopSpeedTimeSec,
		&d.IceEmissionNorm, &d.TurboCharger,

		&d.IsElectric,
		&d.NumMotors, &d.MotorType, &d.BatteryCapacity, &d.BatteryChemistry,
		&d.ThermalManagementSystem, &d.EvDrivetrainName, &d.EvPowerPs, &d.EvTorqueNm,
		&d.ClaimedRange, &d.RealWorldRange, &d.EvTopSpeedKmph, &d.EvTopSpeedTimeSec,
		&d.AcChargingOutput, &d.AcChargingTime, &d.DcChargingOutput, &d.DcFastChargingTime,
		&d.BatteryWarrantyKm, &d.BatteryWarrantyYears, &d.MotorWarrantyKm, &d.MotorWarrantyYears,
		&d.StandardWarrantyKm, &d.StandardWarrantyYears,
		&d.EvEmissionNorm, &d.MotorPowerKw, &d.ChargingPort, &d.ChargingOptionsRaw,
		&d.RegenerativeBraking, &d.RegenerativeBrakingLevels,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, pgx.ErrNoRows
		}
		return nil, fmt.Errorf("get variant detail: %w", err)
	}
	return &d, nil
}

type VariantLookup struct {
	ID          int32
	VariantName string
	Price       decimal.Decimal
	FuelType    *int32
	IsElectric  bool
}

const variantsByModelSQL = `
SELECT v.id, v.variant_name, v.price, i.fuel_type, (e.id IS NOT NULL)
FROM car_variants v
LEFT JOIN LATERAL (
    SELECT p.fuel_type FROM car_powertrains_ice p
    WHERE p.variant_id = v.id AND p.is_deleted = false LIMIT 1
) i ON true
LEFT JOIN LATERAL (
    SELECT p.id FROM car_powertrains_electric p
    WHERE p.variant_id = v.id AND p.is_deleted = false LIMIT 1
) e ON true
WHERE v.model_id = $1
ORDER BY v.price ASC`

func ListVariantsByModel(ctx context.Context, db *pgxpool.Pool, modelID int32) ([]VariantLookup, error) {
	rows, err := db.Query(ctx, variantsByModelSQL, modelID)
	if err != nil {
		return nil, fmt.Errorf("list variants by model: %w", err)
	}
	defer rows.Close()

	out := []VariantLookup{}
	for rows.Next() {
		var v VariantLookup
		if err := rows.Scan(&v.ID, &v.VariantName, &v.Price, &v.FuelType, &v.IsElectric); err != nil {
			return nil, fmt.Errorf("scan variant lookup: %w", err)
		}
		out = append(out, v)
	}
	return out, rows.Err()
}
