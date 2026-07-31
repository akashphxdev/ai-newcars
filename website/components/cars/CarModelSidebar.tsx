import { CheckIcon, PowerIcon, GaugeIcon, GearIcon, FuelIcon } from "@/components/common/icons";
import type { CarDetailSelectedVariant } from "@/features/cars/car.types";

// Sidebar for the model detail page — key highlights + safety features
// only (price/CTAs live in CarModelHero now). Every value here comes
// straight off the selected variant's real spec/feature data.
export default function CarModelSidebar({ variant }: { variant: CarDetailSelectedVariant | null }) {
  if (!variant) return null;

  const highlights: { icon: React.ReactNode; label: string; value: string }[] = [];

  if (variant.isElectric && variant.electric) {
    const e = variant.electric;
    highlights.push({ icon: <FuelIcon className="size-4" />, label: "Battery", value: e.batteryCapacity ? `${e.batteryCapacity} kWh` : "-" });
    highlights.push({ icon: <PowerIcon className="size-4" />, label: "Power", value: e.powerPs ? `${e.powerPs} PS` : "-" });
    highlights.push({ icon: <GaugeIcon className="size-4" />, label: "Range", value: e.claimedRange ? `${e.claimedRange} km` : "-" });
    if (variant.dimensions.bootSpace) highlights.push({ icon: <GaugeIcon className="size-4" />, label: "Boot Space", value: `${variant.dimensions.bootSpace} L` });
  } else if (variant.ice) {
    const ice = variant.ice;
    highlights.push({
      icon: <FuelIcon className="size-4" />,
      label: "Engine",
      value: ice.engineDisplacement ? `${Math.round(Number(ice.engineDisplacement))} cc ${ice.fuelType ?? ""}`.trim() : ice.fuelType ?? "-",
    });
    highlights.push({ icon: <PowerIcon className="size-4" />, label: "Power", value: ice.powerPs ? `${ice.powerPs} PS` : "-" });
    highlights.push({ icon: <GaugeIcon className="size-4" />, label: "Mileage", value: ice.claimedFe ? `${ice.claimedFe} km/l` : "-" });
  }

  highlights.push({ icon: <GearIcon className="size-4" />, label: "Seating Capacity", value: `${variant.seatingCapacity} Seater` });
  if (variant.transmission) highlights.push({ icon: <GearIcon className="size-4" />, label: "Transmission", value: variant.transmission });

  // Safety is singled out by category name — same convention the
  // car-model page uses for its dedicated Safety section — capped to a
  // handful of items since this is a sidebar teaser, not the full list.
  const safety = variant.features.find((g) => g.categoryName.toLowerCase() === "safety");
  const safetyItems: string[] = (safety?.items ?? [])
    .slice(0, 6)
    .map((item) => (item.value ? `${item.name}: ${item.value}` : item.name));

  return (
    <div className="flex flex-col gap-4 lg:sticky lg:top-20">
      {highlights.length > 0 && (
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-[14px] font-extrabold text-ink">Key Highlights</p>
          <div className="mt-3 flex flex-col gap-3">
            {highlights.map((h) => (
              <div key={h.label} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[12.5px] text-muted">
                  <span className="text-brand">{h.icon}</span>
                  {h.label}
                </span>
                <span className="text-[12.5px] font-bold text-ink">{h.value}</span>
              </div>
            ))}
          </div>
          <a href="#specs" className="mt-3 block text-[12.5px] font-semibold text-brand hover:underline">
            View Complete Specs →
          </a>
        </div>
      )}

      {safetyItems.length > 0 && (
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-[14px] font-extrabold text-ink">Safety Features</p>
          <div className="mt-3 flex flex-col gap-2.5">
            {safetyItems.map((label) => (
              <div key={label} className="flex items-center gap-2 text-[12.5px] font-medium text-ink">
                <CheckIcon className="size-4 shrink-0 text-green-600" />
                {label}
              </div>
            ))}
          </div>
          <a href="#safety" className="mt-3 block text-[12.5px] font-semibold text-brand hover:underline">
            View All Features →
          </a>
        </div>
      )}
    </div>
  );
}
