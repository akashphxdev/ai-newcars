// components/cars/SpecificationsSection.tsx
//
// Section 6 of the v2 model page. The specification tables, grouped the
// way a reader looks for them rather than the way the database stores
// them.
//
// Rows with no value are dropped and a group with no rows disappears
// entirely. A spec sheet padded with dashes looks like missing data even
// where the car simply has no such figure, and it makes the gaps we do
// have harder to see.
//
// No dimension diagram: the mockup's line drawing is an illustration per
// model and we hold none, so the numbers stand on their own rather than
// being wrapped around a placeholder.

"use client";

import type { CarDetailSelectedVariant } from "@/features/cars/car.types";

type Row = [string, string | null | undefined];

function rows(...items: Row[]): [string, string][] {
  return items.filter((r): r is [string, string] => {
    const v = r[1];
    return v !== null && v !== undefined && v !== "" && v !== "null";
  });
}

function num(v: number | null | undefined, unit: string): string | null {
  return v === null || v === undefined ? null : `${v.toLocaleString("en-IN")} ${unit}`;
}

function warranty(years: number | null | undefined, km: number | string | null | undefined): string | null {
  if (!years && !km) return null;
  const y = years ? `${years} years` : null;
  const k = km ? `${Number(km).toLocaleString("en-IN")} km` : null;
  return [y, k].filter(Boolean).join(" / ");
}

function buildGroups(v: CarDetailSelectedVariant): { title: string; rows: Row[] }[] {
  const d = v.dimensions;
  const e = v.electric;
  const i = v.ice;

  const powertrain = e
    ? {
        title: "Battery & motor",
        rows: rows(
          ["Battery capacity", e.batteryCapacity ? `${e.batteryCapacity} kWh` : null],
          ["Battery chemistry", e.batteryChemistry],
          ["Thermal management", e.thermalManagementSystem],
          ["Motor", e.motorType],
          ["Motors", e.numMotors ? String(e.numMotors) : null],
          // Some EVs carry only the kW figure. Requiring PS hid a power
          // rating we hold, on a spec sheet whose job is to show it.
          [
            "Max power",
            e.powerPs
              ? `${e.powerPs} PS${e.motorPowerKw ? ` (${e.motorPowerKw} kW)` : ""}`
              : e.motorPowerKw
                ? `${e.motorPowerKw} kW`
                : null,
          ],
          ["Max torque", num(e.torqueNm, "Nm")],
          ["Drivetrain", e.drivetrain],
          ["Transmission", v.transmission],
          ["Charging port", e.chargingPort],
        ),
      }
    : {
        title: "Engine",
        rows: rows(
          ["Engine", i?.cubicCapacity ? `${i.cubicCapacity} cc` : null],
          ["Fuel", i?.fuelType],
          ["Cylinders", i?.cylinders ? String(i.cylinders) : null],
          ["Max power", num(i?.powerPs ?? null, "PS")],
          ["Max torque", num(i?.torqueNm ?? null, "Nm")],
          ["Gears", i?.numGears ? String(i.numGears) : null],
          ["Drivetrain", i?.drivetrain],
          ["Transmission", v.transmission],
          ["Emission norm", i?.emissionNormCompliance],
        ),
      };

  const performance = e
    ? {
        title: "Performance & charging",
        rows: rows(
          ["Claimed range", num(e.claimedRange, "km")],
          ["Top speed", num(e.topSpeedKmph, "km/h")],
          ["0-100 km/h", e.topSpeedTimeSec ? `${e.topSpeedTimeSec} sec` : null],
          ["AC charging", e.acChargingOutput ? `${e.acChargingOutput} kW` : null],
          ["AC charge time", e.acChargingTime ? `${e.acChargingTime} h` : null],
          ["DC fast charging", e.dcChargingOutput ? `${e.dcChargingOutput} kW` : null],
          ["DC charge time", e.dcFastChargingTime],
          [
            "Regenerative braking",
            e.regenerativeBraking
              ? e.regenerativeBrakingLevels
                ? `Yes (${e.regenerativeBrakingLevels} levels)`
                : "Yes"
              : null,
          ],
        ),
      }
    : {
        title: "Performance & efficiency",
        rows: rows(
          ["Rated mileage", i?.claimedFe ? `${i.claimedFe} kmpl` : null],
          ["Top speed", num(i?.topSpeedKmph ?? null, "km/h")],
          ["Fuel tank", i?.fuelTankCapacity ? `${i.fuelTankCapacity} litres` : null],
          ["CNG tank", i?.cngTankCapacity ? `${i.cngTankCapacity} kg` : null],
          ["Kerb weight", num(i?.kerbWeight ?? null, "kg")],
        ),
      };

  return [
    powertrain,
    performance,
    {
      title: "Dimensions",
      rows: rows(
        ["Length", num(d.length, "mm")],
        ["Width", num(d.width, "mm")],
        ["Height", num(d.height, "mm")],
        ["Wheelbase", num(d.wheelBase, "mm")],
        ["Ground clearance", num(d.groundClearance, "mm")],
        ["Boot space", num(d.bootSpace, "litres")],
        ["Seating", v.seatingCapacity ? `${v.seatingCapacity} seats` : null],
      ),
    },
    {
      title: "Suspension, brakes & steering",
      rows: rows(
        ["Front suspension", d.frontSuspension],
        ["Rear suspension", d.rearSuspension],
        ["Front brake", d.frontBrakeType],
        ["Rear brake", d.rearBrakeType],
        ["Steering", d.steeringType],
      ),
    },
    {
      title: "Warranty",
      rows: rows(
        ["Vehicle", warranty(e?.standardWarrantyYears, e?.standardWarrantyKm)],
        ["Battery", warranty(e?.batteryWarrantyYears, e?.batteryWarrantyKm)],
        ["Motor", warranty(e?.motorWarrantyYears, e?.motorWarrantyKm)],
      ),
    },
  ].filter((g) => g.rows.length > 0);
}

export default function SpecificationsSection({
  variant,
  carName,
}: {
  variant: CarDetailSelectedVariant;
  carName: string;
}) {
  const groups = buildGroups(variant);
  if (!groups.length) return null;

  function downloadSpecs() {
    const lines: string[] = [[carName, variant.variantName].join(" — "), ""];
    for (const g of groups) {
      lines.push(g.title);
      for (const [k, val] of g.rows) lines.push(`${k},${String(val).replace(/,/g, "")}`);
      lines.push("");
    }
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${carName.toLowerCase().replace(/\s+/g, "-")}-specifications.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="grid gap-5 lg:grid-cols-2">
        {groups.map((g) => (
          <div key={g.title} className="overflow-hidden rounded-2xl border border-border bg-surface">
            <p className="border-b border-border-soft bg-page px-5 py-3 text-[11px] font-bold uppercase tracking-[0.1em] text-brand">
              {g.title}
            </p>
            <dl className="divide-y divide-border-soft">
              {g.rows.map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-4 px-5 py-2.5">
                  <dt className="text-[12.5px] text-muted">{label}</dt>
                  <dd className="text-right text-[12.5px] font-semibold text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={downloadSpecs}
        className="mt-5 cursor-pointer rounded-xl border border-border bg-surface px-4 py-2.5 text-[12.5px] font-bold text-ink transition-colors hover:border-brand hover:text-brand"
      >
        Download specifications (CSV)
      </button>
    </div>
  );
}
