// components/cars/KeySpecsStrip.tsx
//
// The six or seven numbers a buyer checks before anything else. Rivals
// put these directly under the hero; ours were reachable only by opening
// the full specification table, which is a click too far for the facts
// that decide whether the car is even a candidate.
//
// A spec with no value is dropped rather than rendered as a dash, so the
// strip never pads itself out with blanks to look complete.

import { BoltIcon, GaugeIcon, FuelIcon, ClockIcon, StarIcon, PinIcon } from "@/components/common/icons";
import type { CarDetailSelectedVariant } from "@/features/cars/car.types";

type Spec = { label: string; value: string; icon: React.ReactNode };

function buildSpecs(v: CarDetailSelectedVariant): Spec[] {
  const specs: Spec[] = [];

  if (v.isElectric && v.electric) {
    const e = v.electric;
    if (e.batteryCapacity) {
      specs.push({ label: "Battery", value: `${e.batteryCapacity} kWh`, icon: <BoltIcon className="size-4" /> });
    }
    // The claimed figure is the one the manufacturer publishes; the
    // real-world number is only ever an estimate, so it is labelled.
    if (e.realWorldRange) {
      specs.push({ label: "Range (est.)", value: `${e.realWorldRange} km`, icon: <GaugeIcon className="size-4" /> });
    } else if (e.claimedRange) {
      specs.push({ label: "Claimed range", value: `${e.claimedRange} km`, icon: <GaugeIcon className="size-4" /> });
    }
    if (e.powerPs) specs.push({ label: "Power", value: `${e.powerPs} PS`, icon: <BoltIcon className="size-4" /> });
    if (e.torqueNm) specs.push({ label: "Torque", value: `${e.torqueNm} Nm`, icon: <BoltIcon className="size-4" /> });
  } else if (v.ice) {
    const i = v.ice;
    // cubicCapacity is cc; engineDisplacement is litres. Buyers read cc,
    // so that leads, with litres as the fallback labelled correctly.
    if (i.cubicCapacity) {
      specs.push({ label: "Engine", value: `${i.cubicCapacity} cc`, icon: <GaugeIcon className="size-4" /> });
    } else if (i.engineDisplacement) {
      specs.push({ label: "Engine", value: `${i.engineDisplacement} L`, icon: <GaugeIcon className="size-4" /> });
    }
    if (i.powerPs) specs.push({ label: "Power", value: `${i.powerPs} PS`, icon: <BoltIcon className="size-4" /> });
    if (i.torqueNm) specs.push({ label: "Torque", value: `${i.torqueNm} Nm`, icon: <BoltIcon className="size-4" /> });
    // claimedFe is the rated figure; real_world_mileage is empty across
    // the whole catalogue, so this is what there is to show.
    if (i.claimedFe) {
      specs.push({ label: "Mileage", value: `${i.claimedFe} kmpl`, icon: <FuelIcon className="size-4" /> });
    }
    if (i.fuelType) specs.push({ label: "Fuel", value: i.fuelType, icon: <FuelIcon className="size-4" /> });
  }

  if (v.transmission) {
    specs.push({ label: "Transmission", value: v.transmission, icon: <ClockIcon className="size-4" /> });
  }
  if (v.seatingCapacity) {
    specs.push({ label: "Seating", value: `${v.seatingCapacity} seats`, icon: <StarIcon className="size-4" /> });
  }

  return specs;
}

export default function KeySpecsStrip({
  variant,
  bare = false,
}: {
  variant: CarDetailSelectedVariant | null;
  // Inside the hero card the strip supplies only its own row; standalone
  // it brings the section band around it.
  bare?: boolean;
}) {
  if (!variant) return null;
  const specs = buildSpecs(variant);
  if (specs.length === 0) return null;

  const list = (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
      {specs.slice(0, 5).map((s) => (
        <li key={s.label} className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-page text-brand">
            {s.icon}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-bold text-ink">{s.value}</span>
            <span className="block truncate text-[10.5px] text-muted">{s.label}</span>
          </span>
        </li>
      ))}
    </ul>
  );

  if (bare) return <div className="border-t border-border-soft p-5">{list}</div>;

  return (
    <section className="border-b border-border bg-page">
      <div className="mx-auto max-w-7xl px-5 py-4 sm:px-8">{list}</div>
    </section>
  );
}
