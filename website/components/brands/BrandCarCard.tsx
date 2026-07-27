import Image from "next/image";
import Link from "next/link";
import { WishlistButton } from "@/components/common/CardBits";
import { PowerIcon, TorqueIcon, GaugeIcon, BatteryIcon, ClockIcon, StarIcon } from "@/components/common/icons";
import { formatPriceRange } from "@/lib/format";
import type { HomeCar } from "@/features/cars/car.types";

const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='225' viewBox='0 0 300 225'%3E%3Crect width='300' height='225' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='13' fill='%239ca3af'%3EImage unavailable%3C/text%3E%3C/svg%3E";

const Spec = ({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) => (
  <div className="flex items-center gap-1.5">
    <span className="text-faint">{icon}</span>
    <div className="leading-tight">
      <p className="text-[12px] font-bold text-ink">{value}</p>
      <p className="text-[10px] font-medium text-muted">{label}</p>
    </div>
  </div>
);

// Grid card (unlike Popularcars/ElectricCarCard, which are shrink-0 rail
// cards) — full width of its grid cell. Specs branch on isElectric since
// a brand's lineup can mix ICE and EV models.
export default function BrandCarCard({ car }: { car: HomeCar }) {
  const modelUrl = `/${car.brand.slug}-cars/${car.slug}`;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-4/3 overflow-hidden bg-page">
        <Link href={modelUrl} className="absolute inset-0 z-0" aria-label={`View ${car.brand.name} ${car.name} details`}>
          <Image src={car.coverImageUrl ?? FALLBACK_IMG} alt={`${car.brand.name} ${car.name}`} fill sizes="280px" className="object-cover" />
        </Link>

        {car.bodyType && (
          <span className="absolute left-3 top-3 z-10 rounded-md bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink">
            {car.bodyType.name}
          </span>
        )}
        <div className="absolute right-3 top-3 z-10">
          <WishlistButton size="md" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-3.5 pt-3.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted">{car.brand.name}</p>
            <h3 className="text-[15px] font-bold leading-tight text-ink">{car.name}</h3>
          </div>
          {car.ratingAvg && (
            <div className="flex shrink-0 items-center gap-1 pt-0.5">
              <StarIcon filled className="size-3 text-amber-400" />
              <span className="text-[12px] font-bold text-ink">{car.ratingAvg}</span>
            </div>
          )}
        </div>

        <p className="text-[15.5px] font-bold text-ink">{formatPriceRange(car.priceMin, car.priceMax)}</p>

        <div className="flex items-center justify-between border-t border-border-soft pt-3">
          {car.isElectric ? (
            <>
              <Spec icon={<BatteryIcon className="size-4" />} value={car.specs?.batteryCapacity ? `${car.specs.batteryCapacity} kWh` : "-"} label="Battery" />
              <Spec icon={<GaugeIcon className="size-4" />} value={car.specs?.range ? `${car.specs.range} km` : "-"} label="Range" />
              <Spec icon={<ClockIcon className="size-4" />} value={car.specs?.chargeTime ?? "-"} label="Charging" />
            </>
          ) : (
            <>
              <Spec icon={<PowerIcon className="size-4" />} value={car.specs?.powerPs ? `${car.specs.powerPs} PS` : "-"} label="Power" />
              <Spec icon={<TorqueIcon className="size-4" />} value={car.specs?.torqueNm ? `${car.specs.torqueNm} Nm` : "-"} label="Torque" />
              <Spec icon={<GaugeIcon className="size-4" />} value={car.specs?.mileage ? `${car.specs.mileage} km/l` : "-"} label="Mileage" />
            </>
          )}
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 px-3.5 pb-3.5 pt-3">
        <Link
          href={modelUrl}
          className="flex-1 rounded-xl border border-border px-3 py-2.5 text-center text-[12px] font-bold text-ink"
        >
          View Details
        </Link>
        <Link
          href={modelUrl}
          className="flex-1 whitespace-nowrap rounded-xl border-[1.5px] border-brand px-3 py-2.5 text-center text-[12px] font-bold text-brand transition-colors hover:bg-orange-50"
        >
          Check Offers
        </Link>
      </div>
    </div>
  );
}
