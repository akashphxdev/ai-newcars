import Image from "next/image";
import { formatSinglePrice } from "@/lib/format";
import type { RandomComparisonPair, RandomPairCar } from "@/features/compare/compare.types";

const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='12' fill='%23e5e7eb'/%3E%3C/svg%3E";

const MiniCar = ({ car }: { car: RandomPairCar }) => (
  <div className="flex flex-1 items-center gap-3">
    <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-page">
      <Image src={car.coverImageUrl ?? FALLBACK_IMG} alt={car.name} fill sizes="96px" className="object-cover" />
    </div>
    <div className="min-w-0">
      <p className="truncate text-[10.5px] font-semibold uppercase tracking-wide text-muted">{car.brand.name}</p>
      <p className="truncate text-[14.5px] font-bold text-ink">{car.name}</p>
      <p className="text-[13px] font-bold text-brand">{formatSinglePrice(car.priceMin)}</p>
    </div>
  </div>
);

export default function RandomPairRow({ pair }: { pair: RandomComparisonPair }) {
  return (
    <div className="flex flex-col gap-4 border-b border-border-soft px-4 py-4 last:border-b-0 sm:flex-row sm:items-center sm:gap-3 sm:px-6">
      <MiniCar car={pair.carA} />
      <span className="flex size-8 shrink-0 items-center justify-center self-center rounded-full bg-page text-[11px] font-bold text-muted">
        VS
      </span>
      <MiniCar car={pair.carB} />
      <a
        href={`/compare/${pair.carA.slug}-vs-${pair.carB.slug}`}
        className="shrink-0 whitespace-nowrap rounded-xl border border-brand px-4 py-2.5 text-center text-[12.5px] font-bold text-brand transition-colors hover:bg-orange-50"
      >
        View Comparison
      </a>
    </div>
  );
}
