import Image from "next/image";
import { formatSinglePrice } from "@/lib/format";
import type { RandomComparisonPair, RandomPairCar } from "@/features/compare/compare.types";

const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 200 150'%3E%3Crect width='200' height='150' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='11' fill='%239ca3af'%3EImage unavailable%3C/text%3E%3C/svg%3E";

const CarImage = ({ car }: { car: RandomPairCar }) => (
  <div className="relative aspect-4/3 w-1/2 overflow-hidden">
    <Image src={car.coverImageUrl ?? FALLBACK_IMG} alt={`${car.brand.name} ${car.name}`} fill sizes="160px" className="object-cover" />
  </div>
);

const CarInfo = ({ car }: { car: RandomPairCar }) => (
  <div className="min-w-0 flex-1 text-center">
    <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted">{car.brand.name}</p>
    <p className="truncate text-[12.5px] font-bold text-ink">{car.name}</p>
    <p className="text-[12px] font-bold text-brand">{formatSinglePrice(car.priceMin)}</p>
  </div>
);

// Images sit flush against each other (no gap, same background either
// side of the seam) with the VS badge overlaid on top of the join —
// matches the home page's Comparecars.tsx card treatment instead of
// leaving a gap between two separately-boxed photos.
export default function BrandCompareCard({ pair }: { pair: RandomComparisonPair }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative flex bg-page">
        <CarImage car={pair.carA} />
        <CarImage car={pair.carB} />

        <span className="absolute left-1/2 top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-brand bg-white text-[11.5px] font-extrabold text-brand">
          VS
        </span>
      </div>

      <div className="flex items-start gap-3 px-4 pb-4 pt-4">
        <CarInfo car={pair.carA} />
        <div className="mt-1 h-10 w-px shrink-0 bg-border-soft" />
        <CarInfo car={pair.carB} />
      </div>

      <a
        href={`/compare/${pair.carA.slug}-vs-${pair.carB.slug}`}
        className="flex items-center justify-center gap-1.5 truncate border-t border-border px-3 py-2.5 text-[12px] font-semibold text-brand transition-colors hover:bg-page"
      >
        Compare with {pair.carB.name} →
      </a>
    </div>
  );
}
