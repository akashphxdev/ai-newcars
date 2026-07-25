import Image from "next/image";
import { StarIcon } from "@/components/common/icons";
import { formatSinglePrice } from "@/lib/format";
import VariantPicker from "./VariantPicker";
import type { CompareCarResult } from "@/features/compare/compare.types";

const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='200' viewBox='0 0 320 200'%3E%3Crect width='320' height='200' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='13' fill='%239ca3af'%3EImage unavailable%3C/text%3E%3C/svg%3E";

export default function CompareCarHeader({ car, paramKey }: { car: CompareCarResult; paramKey: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-5 text-center">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-page">
        <Image src={car.coverImageUrl ?? FALLBACK_IMG} alt={`${car.brand.name} ${car.name}`} fill sizes="320px" className="object-cover" />
      </div>

      <div>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">{car.brand.name}</p>
        <h2 className="text-[19px] font-bold leading-tight text-ink">{car.name}</h2>
      </div>

      {car.ratingAvg && (
        <div className="flex items-center gap-1">
          <StarIcon filled className="size-3.5 text-amber-400" />
          <span className="text-[12.5px] font-bold text-ink">{car.ratingAvg}</span>
        </div>
      )}

      <p className="text-[20px] font-bold text-ink">{formatSinglePrice(car.priceMin)}</p>

      <VariantPicker paramKey={paramKey} options={car.variantOptions} selectedId={car.selectedVariant?.id ?? null} />
    </div>
  );
}
