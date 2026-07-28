"use client";

import { useEffect, useMemo, useState } from "react";
import { formatSinglePrice } from "@/lib/format";
import { GaugeIcon, PowerIcon, FuelIcon, BatteryIcon, CheckIcon, GearIcon, BoltIcon, ClockIcon } from "@/components/common/icons";
import type { CompareCarResult, CompareCarSpecs } from "@/features/compare/compare.types";

const TOTAL_SLOTS = 4;

// Index of the best value among the real (non-blank) cars for a given
// numeric row, or null when there's a tie / fewer than 2 comparable
// values — null means "don't highlight anything".
function bestIndex(values: (number | null)[], higherIsBetter = true): number | null {
  const known = values
    .map((v, i) => ({ v, i }))
    .filter((x): x is { v: number; i: number } => x.v != null);
  if (known.length < 2) return null;

  const best = higherIsBetter ? Math.max(...known.map((x) => x.v)) : Math.min(...known.map((x) => x.v));
  const winners = known.filter((x) => x.v === best);
  return winners.length === 1 ? winners[0].i : null;
}

// A row is "common" (hideable via the toggle) when every real car has the
// exact same value — comparing the already-formatted display values is
// enough since they're plain strings/numbers/booleans here.
function isCommonRow(values: unknown[], activeCount: number): boolean {
  const active = values.slice(0, activeCount);
  return active.length > 1 && active.every((v) => v === active[0]);
}

const Section = ({ id, title, icon, children }: { id: string; title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div id={id} className="scroll-mt-32 overflow-hidden rounded-2xl border border-border bg-surface">
    <h2 className="flex items-center gap-2 border-b border-border-soft px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-ink sm:px-6">
      <span className="text-brand">{icon}</span>
      {title}
    </h2>
    {/* Rows below carry their own min-width — on narrow screens the label +
        columns don't fit, so this scrolls horizontally instead of squishing
        every value into an unreadable sliver. */}
    <div className="overflow-x-auto">{children}</div>
  </div>
);

// label column + N value columns, each with a floor width so a 4-car table
// never gets crushed below readability on mobile.
const rowGridStyle = (count: number): React.CSSProperties => ({
  gridTemplateColumns: `96px repeat(${count}, minmax(84px, 1fr))`,
  minWidth: `${96 + count * 96}px`,
});

const Row = ({
  label,
  values,
  better,
  activeCount,
  hidden,
}: {
  label: string;
  values: React.ReactNode[];
  better?: number | null;
  activeCount: number;
  hidden: boolean;
}) => {
  if (hidden) return null;
  return (
    <div
      className="grid items-center gap-3 border-b border-border-soft px-4 py-3.5 transition-colors last:border-b-0 odd:bg-white even:bg-brand/5 hover:bg-orange-50 sm:px-6"
      style={rowGridStyle(values.length)}
    >
      <div className="whitespace-nowrap text-[9.5px] font-semibold uppercase tracking-wide text-muted sm:text-[10.5px]">{label}</div>
      {values.map((v, i) => (
        <div key={i} className={`truncate text-center text-[12px] font-bold sm:text-[13.5px] ${i === better ? "text-brand" : "text-ink"}`}>
          {i < activeCount ? v : ""}
        </div>
      ))}
    </div>
  );
};

const FeatureRow = ({ label, values, activeCount, hidden }: { label: string; values: boolean[]; activeCount: number; hidden: boolean }) => {
  if (hidden) return null;
  return (
    <div
      className="grid items-center gap-3 border-b border-border-soft px-4 py-3 transition-colors last:border-b-0 odd:bg-white even:bg-brand/5 hover:bg-orange-50 sm:px-6"
      style={rowGridStyle(values.length)}
    >
      <div className="whitespace-nowrap text-[9.5px] font-semibold uppercase tracking-wide text-muted sm:text-[10.5px]">{label}</div>
      {values.map((v, i) => (
        <div key={i} className="flex justify-center">
          {i < activeCount && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-[9.5px] font-bold sm:text-[10.5px] ${v ? "bg-ev/10 text-ev" : "bg-page text-faint"}`}
            >
              {v ? "Yes" : "No"}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

const NA = "N/A";
const num = (v: string | number | null | undefined) => (v == null ? null : Number(v));

const NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "performance", label: "Performance" },
  { id: "engine", label: "Engine & Fuel", iceOnly: true },
  { id: "battery", label: "Battery", electricOnly: true },
  { id: "safety", label: "Safety" },
  { id: "comfort", label: "Comfort" },
  { id: "exterior", label: "Exterior" },
  { id: "technology", label: "Technology" },
];

// The card grid above always shows TOTAL_SLOTS (4) cards — 2 real + 2
// "Add car" — so this table always has 4 columns too, blank past however
// many real cars are actually selected, rather than resizing to match.
export default function SpecComparison({ cars }: { cars: CompareCarResult[] }) {
  const [hideCommon, setHideCommon] = useState(false);
  const [activeId, setActiveId] = useState<string>(NAV_ITEMS[0].id);

  const activeCount = cars.length;
  const carSlots: (CompareCarResult | null)[] = [...cars, ...Array(TOTAL_SLOTS - activeCount).fill(null)];
  const specsList: (CompareCarSpecs | null)[] = carSlots.map((c) => c?.specs ?? null);
  const prices = carSlots.map((c) => num(c?.priceMin));
  const ratings = carSlots.map((c) => num(c?.ratingAvg));
  const anyIce = cars.some((c) => !c.isElectric);
  const anyElectric = cars.some((c) => c.isElectric);

  const row = (label: string, values: React.ReactNode[], better?: number | null) => (
    <Row label={label} values={values} better={better} activeCount={activeCount} hidden={hideCommon && isCommonRow(values, activeCount)} />
  );
  const featureRow = (label: string, values: boolean[]) => (
    <FeatureRow label={label} values={values} activeCount={activeCount} hidden={hideCommon && isCommonRow(values, activeCount)} />
  );

  const navItems = useMemo(
    () => NAV_ITEMS.filter((n) => (!n.iceOnly || anyIce) && (!n.electricOnly || anyElectric)),
    [anyIce, anyElectric],
  );

  useEffect(() => {
    const sections = navItems.map((n) => document.getElementById(n.id)).filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "-120px 0px -70% 0px", threshold: 0 },
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [navItems]);

  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-16 z-40 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white px-4 py-3 shadow-sm sm:px-6">
        <nav className="flex flex-wrap gap-x-4 gap-y-1.5">
          {navItems.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              className={`border-b-2 pb-0.5 text-[12px] font-semibold transition-colors hover:text-brand ${
                activeId === n.id ? "border-brand text-brand" : "border-transparent text-ink"
              }`}
            >
              {n.label}
            </a>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => setHideCommon((v) => !v)}
          className={`shrink-0 cursor-pointer rounded-full border px-3.5 py-1.5 text-[11.5px] font-bold transition-colors ${
            hideCommon ? "border-brand bg-orange-50 text-brand" : "border-border text-muted hover:border-brand hover:text-brand"
          }`}
        >
          {hideCommon ? "Showing differences only" : "Hide common specs"}
        </button>
      </div>

      <Section id="overview" title="Overview" icon={<GaugeIcon className="size-4" />}>
        {row("Starting Price", carSlots.map((c) => (c ? formatSinglePrice(c.priceMin) : "")), bestIndex(prices, false))}
        {row("Rating", carSlots.map((c) => (c?.ratingAvg ? `${c.ratingAvg}★` : NA)), bestIndex(ratings))}
        {row("Body Type", carSlots.map((c) => c?.bodyType?.name ?? NA))}
        {row("Seating Capacity", specsList.map((s) => s?.seatingCapacity ?? NA))}
        {row("Transmission", specsList.map((s) => s?.transmission ?? NA))}
        {row("Drivetrain", specsList.map((s) => s?.drivetrain ?? NA))}
        {row("Fuel Type", carSlots.map((c, i) => (c?.isElectric ? "Electric" : specsList[i]?.fuelType ?? NA)))}
      </Section>

      <Section id="performance" title="Power & Performance" icon={<PowerIcon className="size-4" />}>
        {row(
          "Power",
          specsList.map((s) => (s?.powerPs ? `${s.powerPs} PS` : NA)),
          bestIndex(specsList.map((s) => s?.powerPs ?? null)),
        )}
        {row(
          "Torque",
          specsList.map((s) => (s?.torqueNm ? `${s.torqueNm} Nm` : NA)),
          bestIndex(specsList.map((s) => s?.torqueNm ?? null)),
        )}
        {row(
          "Top Speed",
          specsList.map((s) => (s?.topSpeedKmph ? `${s.topSpeedKmph} km/h` : NA)),
          bestIndex(specsList.map((s) => s?.topSpeedKmph ?? null)),
        )}
      </Section>

      {anyIce && (
        <Section id="engine" title="Engine & Fuel" icon={<FuelIcon className="size-4" />}>
          {row("Engine Displacement", specsList.map((s) => (s?.engineDisplacementCc ? `${s.engineDisplacementCc} cc` : NA)))}
          {row("Cylinders", specsList.map((s) => s?.cylinders ?? NA))}
          {row("Fuel Type Variant", specsList.map((s) => s?.fuelTypeSubCategory ?? NA))}
          {row("Gearbox Type", specsList.map((s) => s?.gearboxType ?? NA))}
          {row("Number of Gears", specsList.map((s) => s?.numGears ?? NA))}
          {featureRow("4x4 / AWD", specsList.map((s) => s?.isFourByFour ?? false))}
          {row(
            "Mileage (ARAI)",
            specsList.map((s) => (s?.mileage ? `${s.mileage} km/l` : NA)),
            bestIndex(specsList.map((s) => num(s?.mileage))),
          )}
          {row("City Mileage", specsList.map((s) => (s?.cityMileage ? `${s.cityMileage} km/l` : NA)))}
          {row("Highway Mileage", specsList.map((s) => (s?.highwayMileage ? `${s.highwayMileage} km/l` : NA)))}
          {row("Fuel Tank Capacity", specsList.map((s) => (s?.fuelTankCapacity ? `${s.fuelTankCapacity} L` : NA)))}
          {row("CNG Tank Capacity", specsList.map((s) => (s?.cngTankCapacity ? `${s.cngTankCapacity} kg` : NA)))}
          {row("Kerb Weight", specsList.map((s) => (s?.kerbWeight ? `${s.kerbWeight} kg` : NA)))}
        </Section>
      )}

      {anyElectric && (
        <Section id="battery" title="Battery & Charging" icon={<BatteryIcon className="size-4" />}>
          {row(
            "Battery Capacity",
            specsList.map((s) => (s?.batteryCapacity ? `${s.batteryCapacity} kWh` : NA)),
            bestIndex(specsList.map((s) => num(s?.batteryCapacity))),
          )}
          {row("Battery Chemistry", specsList.map((s) => s?.batteryChemistry ?? NA))}
          {row(
            "Claimed Range",
            specsList.map((s) => (s?.claimedRange ? `${s.claimedRange} km` : NA)),
            bestIndex(specsList.map((s) => s?.claimedRange ?? null)),
          )}
          {row(
            "Real-World Range",
            specsList.map((s) => (s?.realWorldRange ? `${s.realWorldRange} km` : NA)),
            bestIndex(specsList.map((s) => s?.realWorldRange ?? null)),
          )}
          {row("DC Fast Charging", specsList.map((s) => s?.chargeTime ?? NA))}
          {row("AC Charging Time", specsList.map((s) => (s?.acChargingTime ? `${s.acChargingTime} hrs` : NA)))}
          {row("Boot Space", specsList.map((s) => (s?.powertrainBootspace ? `${s.powertrainBootspace} L` : NA)))}
          {row("Battery Warranty", specsList.map((s) => (s?.batteryWarrantyYears ? `${s.batteryWarrantyYears} years` : NA)))}
        </Section>
      )}

      <Section id="safety" title="Safety" icon={<CheckIcon className="size-4" />}>
        {row("NCAP Rating", specsList.map((s) => (s?.features.ncapRating ? `${s.features.ncapRating}★` : NA)))}
        {row("Airbags", specsList.map((s) => s?.features.airbagsCount ?? NA))}
        {featureRow("ABS with EBD", specsList.map((s) => s?.features.absWithEbd ?? false))}
        {featureRow("Electronic Stability Control", specsList.map((s) => s?.features.esc ?? false))}
        {featureRow("Hill Hold Assist", specsList.map((s) => s?.features.hillAssist ?? false))}
        {featureRow("Rear Parking Camera", specsList.map((s) => s?.features.rearParkingCamera ?? false))}
        {featureRow("Front Parking Sensors", specsList.map((s) => s?.features.frontParkingSensors ?? false))}
        {featureRow("Tyre Pressure Monitor", specsList.map((s) => s?.features.tpms ?? false))}
        {featureRow("ISOFIX Mounts", specsList.map((s) => s?.features.isofixMounts ?? false))}
      </Section>

      <Section id="comfort" title="Comfort & Convenience" icon={<GearIcon className="size-4" />}>
        {featureRow("Sunroof", specsList.map((s) => s?.features.sunroof ?? false))}
        {featureRow("Cruise Control", specsList.map((s) => s?.features.cruiseControl ?? false))}
        {featureRow("Climate Control", specsList.map((s) => s?.features.climateControl ?? false))}
        {featureRow("Rear AC Vents", specsList.map((s) => s?.features.rearAcVents ?? false))}
        {featureRow("Keyless Entry", specsList.map((s) => s?.features.keylessEntry ?? false))}
        {featureRow("Push Button Start", specsList.map((s) => s?.features.pushButtonStart ?? false))}
        {featureRow("Power Windows", specsList.map((s) => s?.features.powerWindows ?? false))}
        {featureRow("Auto Dimming Mirror", specsList.map((s) => s?.features.autoDimmingMirror ?? false))}
        {featureRow("Adjustable Seats", specsList.map((s) => s?.features.adjustableSeats ?? false))}
        {featureRow("Ventilated Seats", specsList.map((s) => s?.features.ventilatedSeats ?? false))}
        {featureRow("Rear Armrest", specsList.map((s) => s?.features.rearArmrest ?? false))}
        {row("Upholstery", specsList.map((s) => s?.features.upholsteryType ?? NA))}
      </Section>

      <Section id="exterior" title="Exterior" icon={<BoltIcon className="size-4" />}>
        {featureRow("LED Headlamps", specsList.map((s) => s?.features.ledHeadlamps ?? false))}
        {featureRow("LED DRLs", specsList.map((s) => s?.features.ledDrls ?? false))}
        {featureRow("Alloy Wheels", specsList.map((s) => s?.features.alloyWheels ?? false))}
        {featureRow("Roof Rails", specsList.map((s) => s?.features.roofRails ?? false))}
        {featureRow("Fog Lamps", specsList.map((s) => s?.features.fogLamps ?? false))}
      </Section>

      <Section id="technology" title="Technology" icon={<ClockIcon className="size-4" />}>
        {row("Touchscreen Size", specsList.map((s) => (s?.features.touchscreenSizeInch ? `${s.features.touchscreenSizeInch}"` : NA)))}
        {featureRow("Android Auto", specsList.map((s) => s?.features.androidAuto ?? false))}
        {featureRow("Apple CarPlay", specsList.map((s) => s?.features.appleCarplay ?? false))}
        {featureRow("Connected Car Tech", specsList.map((s) => s?.features.connectedCarTech ?? false))}
        {row("Speakers", specsList.map((s) => s?.features.numberOfSpeakers ?? NA))}
        {featureRow("Wireless Charging", specsList.map((s) => s?.features.wirelessCharging ?? false))}
      </Section>
    </div>
  );
}
