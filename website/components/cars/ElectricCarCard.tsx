import Image from "next/image";
import Link from "next/link";
import { StarIcon, BoltIcon, ClockIcon, GaugeIcon, BatteryIcon } from "@/components/common/icons";
import { formatSinglePrice } from "@/lib/format";
import type { HomeCar } from "@/features/cars/car.types";

const ORANGE = "#f2650f";
const DARK = "#0f172a";
const MUTED = "#64748b";
const BORDER = "#e5e7eb";
const SURFACE = "#f4f5f9";
const TEAL = "#0d9488";
const TEAL_SOFT = "#e6f6f4";
const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='200' viewBox='0 0 320 200'%3E%3Crect width='320' height='200' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='13' fill='%239ca3af'%3EImage unavailable%3C/text%3E%3C/svg%3E";

const MiniSpec = ({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) => (
  <div className="flex items-center gap-2 rounded-xl px-2.5 py-2" style={{ background: SURFACE }}>
    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg" style={{ background: TEAL_SOFT, color: TEAL }}>
      {icon}
    </span>
    <div className="leading-tight">
      <p className="text-[12px] font-bold" style={{ color: DARK }}>
        {value}
      </p>
      <p className="text-[9.5px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
        {label}
      </p>
    </div>
  </div>
);

export default function ElectricCarCard({ car }: { car: HomeCar }) {
  const modelUrl = `/${car.brand.slug}-cars/${car.slug}`;

  return (
    <div
      className="flex h-full w-[320px] shrink-0 flex-col overflow-hidden rounded-2xl bg-white transition-all duration-300 hover:-translate-y-1"
      style={{ border: `1px solid ${BORDER}`, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}
    >
      <div className="relative aspect-[16/10] overflow-hidden" style={{ background: SURFACE }}>
        <Link href={modelUrl} className="absolute inset-0 z-0" aria-label={`View ${car.brand.name} ${car.name} details`}>
          <Image src={car.coverImageUrl ?? FALLBACK_IMG} alt={`${car.brand.name} ${car.name}`} fill sizes="320px" className="object-cover" />
        </Link>
        <span
          className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white"
          style={{ background: TEAL }}
        >
          <BoltIcon className="size-3.5" />
          Electric
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3.5 px-4 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>
              {car.brand.name}
            </p>
            <h3 className="text-[17px] font-bold leading-tight" style={{ color: DARK }}>
              {car.name}
            </h3>
          </div>
          {car.ratingAvg && (
            <div className="flex shrink-0 items-center gap-1 pt-0.5">
              <StarIcon filled className="size-3 text-amber-400" />
              <span className="text-[12.5px] font-bold" style={{ color: DARK }}>
                {car.ratingAvg}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <MiniSpec icon={<BatteryIcon className="size-4" />} value={car.specs?.batteryCapacity ? `${car.specs.batteryCapacity} kWh` : "-"} label="Battery" />
          <MiniSpec icon={<ClockIcon className="size-4" />} value={car.specs?.chargeTime ?? "-"} label="Charging" />
          <MiniSpec icon={<GaugeIcon className="size-4" />} value={car.specs?.topSpeedKmph ? `${car.specs.topSpeedKmph} km/h` : "-"} label="Top Speed" />
          <MiniSpec icon={<BoltIcon className="size-3.5" />} value={formatSinglePrice(car.priceMin)} label="Starting Price" />
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 px-4 pb-4 pt-3.5">
        <Link
          href={modelUrl}
          className="flex h-11 flex-1 items-center justify-center rounded-xl px-3 text-[12.5px] font-bold"
          style={{ border: `1px solid ${BORDER}`, color: DARK }}
        >
          View Details
        </Link>
        <Link
          href={modelUrl}
          className="flex h-11 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-[12.5px] font-bold transition-colors hover:bg-orange-50"
          style={{ border: `1.5px solid ${ORANGE}`, color: ORANGE }}
        >
          Check Offers
        </Link>
      </div>
    </div>
  );
}
