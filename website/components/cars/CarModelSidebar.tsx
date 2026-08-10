import { CheckIcon, PowerIcon, GaugeIcon, GearIcon, BatteryIcon, RoadIcon, BootIcon, EngineIcon, SeatIcon } from "@/components/common/icons";
import type { CarDetailSelectedVariant } from "@/features/cars/car.types";

// Sidebar for the model detail page — key highlights + safety features
// only (price/CTAs live in CarModelHero now). Every value here comes
// straight off the selected variant's real spec/feature data.
export default function CarModelSidebar({ variant }: { variant: CarDetailSelectedVariant | null }) {
  if (!variant) return null;

  const highlights: { icon: React.ReactNode; label: string; value: string }[] = [];

  if (variant.isElectric && variant.electric) {
    const e = variant.electric;
    highlights.push({ icon: <BatteryIcon className="size-4" />, label: "Battery", value: e.batteryCapacity ? `${e.batteryCapacity} kWh` : "-" });
    highlights.push({ icon: <PowerIcon className="size-4" />, label: "Power", value: e.powerPs ? `${e.powerPs} PS` : "-" });
    highlights.push({ icon: <RoadIcon className="size-4" />, label: "Range", value: e.claimedRange ? `${e.claimedRange} km` : "-" });
    if (variant.dimensions.bootSpace) highlights.push({ icon: <BootIcon className="size-4" />, label: "Boot Space", value: `${variant.dimensions.bootSpace} L` });
  } else if (variant.ice) {
    const ice = variant.ice;
    const rawDisplacement = ice.engineDisplacement ? Number(ice.engineDisplacement) : null;
    const capacityCc = ice.cubicCapacity
      ?? (rawDisplacement && Number.isFinite(rawDisplacement)
        ? Math.round(rawDisplacement < 20 ? rawDisplacement * 1000 : rawDisplacement)
        : null);
    highlights.push({
      icon: <EngineIcon className="size-4" />,
      label: "Engine",
      value: capacityCc ? `${capacityCc} cc ${ice.fuelType ?? ""}`.trim() : ice.fuelType ?? "-",
    });
    highlights.push({ icon: <PowerIcon className="size-4" />, label: "Power", value: ice.powerPs ? `${ice.powerPs} PS` : "-" });
    highlights.push({ icon: <GaugeIcon className="size-4" />, label: "Mileage", value: ice.claimedFe ? `${ice.claimedFe} km/l` : "-" });
  }

  highlights.push({ icon: <SeatIcon className="size-4" />, label: "Seating Capacity", value: `${variant.seatingCapacity} Seater` });
  if (variant.transmission) highlights.push({ icon: <GearIcon className="size-4" />, label: "Transmission", value: variant.transmission });

  // Safety is singled out by category name — same convention the
  // car-model page uses for its dedicated Safety section — capped to a
  // handful of items since this is a sidebar teaser, not the full list.
  const safety = variant.features.find((g) => g.categoryName.toLowerCase() === "safety");
  const safetyItems: string[] = (safety?.items ?? [])
    .slice(0, 6)
    .map((item) => (item.value ? `${item.name}: ${item.value}` : item.name));

  return (
    <div className="grid border-y border-border bg-white md:grid-cols-2">
      {highlights.length > 0 && (
        <div className="p-5 sm:p-7 md:border-r md:border-border">
          <p className="text-[10.5px] font-black uppercase tracking-[0.13em] text-brand">Key ownership facts</p>
          <div className="mt-5 flex flex-col">
            {highlights.map((h) => (
              <div key={h.label} className="flex items-center justify-between gap-5 border-b border-border-soft py-3 last:border-b-0">
                <span className="flex items-center gap-2 text-[12.5px] text-muted">
                  <span className="text-brand">{h.icon}</span>
                  {h.label}
                </span>
                <span className="text-[12.5px] font-bold text-ink">{h.value}</span>
              </div>
            ))}
          </div>
          <a href="#performance" className="mt-5 block text-[11px] font-black uppercase tracking-[0.08em] text-brand hover:underline">
            Review performance
          </a>
        </div>
      )}

      {safetyItems.length > 0 && (
        <div className="border-t border-border p-5 sm:p-7 md:border-t-0">
          <p className="text-[10.5px] font-black uppercase tracking-[0.13em] text-ev">Safety included</p>
          <div className="mt-5 flex flex-col gap-2.5">
            {safetyItems.map((label) => (
              <div key={label} className="flex items-center gap-2 text-[12.5px] font-medium text-ink">
                <CheckIcon className="size-4 shrink-0 text-green-600" />
                {label}
              </div>
            ))}
          </div>
          <a href="#safety" className="mt-5 block text-[11px] font-black uppercase tracking-[0.08em] text-brand hover:underline">
            View all safety features
          </a>
        </div>
      )}
    </div>
  );
}
