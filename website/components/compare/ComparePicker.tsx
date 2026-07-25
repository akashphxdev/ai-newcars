"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CloseIcon } from "@/components/common/icons";
import { formatSinglePrice } from "@/lib/format";
import type { CarOption } from "@/features/compare/compare.types";

const MAX_CARS = 4;
const MIN_CARS = 2;

const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='12' fill='%23e5e7eb'/%3E%3C/svg%3E";

const AddCarSlot = ({
  brands,
  byBrand,
  excludeSlugs,
  onPick,
}: {
  brands: string[];
  byBrand: Map<string, CarOption[]>;
  excludeSlugs: Set<string>;
  onPick: (car: CarOption) => void;
}) => {
  const [brand, setBrand] = useState("");
  const models = (brand ? byBrand.get(brand) ?? [] : []).filter((m) => !excludeSlugs.has(m.slug));

  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-surface p-3 text-center">
      <div className="flex aspect-4/3 w-full items-center justify-center rounded-xl border border-dashed border-border bg-page">
        <span className="flex size-9 items-center justify-center rounded-full bg-brand/10 text-xl font-bold leading-none text-brand">+</span>
      </div>
      <select
        value={brand}
        onChange={(e) => setBrand(e.target.value)}
        className="w-full cursor-pointer rounded-lg border border-border bg-page px-2.5 py-2 text-[12.5px] font-semibold text-ink outline-none"
      >
        <option value="">Select Brand</option>
        {brands.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>
      <select
        value=""
        disabled={!brand}
        onChange={(e) => {
          const car = models.find((m) => m.slug === e.target.value);
          if (car) onPick(car);
        }}
        className="w-full cursor-pointer rounded-lg border border-border bg-page px-2.5 py-2 text-[12.5px] font-semibold text-ink outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">{brand ? "Select Model" : "Pick a brand first"}</option>
        {models.map((m) => (
          <option key={m.id} value={m.slug}>
            {m.name}
          </option>
        ))}
      </select>
    </div>
  );
};

const FilledSlot = ({ car, onRemove }: { car: CarOption; onRemove: () => void }) => (
  <div className="relative flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-3 text-center">
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove ${car.name}`}
      className="absolute right-2 top-2 flex size-5 cursor-pointer items-center justify-center rounded-full bg-page text-muted hover:text-brand"
    >
      <CloseIcon className="size-3.5" />
    </button>
    <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-page">
      <Image src={car.coverImageUrl ?? FALLBACK_IMG} alt={car.name} fill sizes="200px" className="object-cover" />
    </div>
    <div className="min-w-0">
      <p className="truncate text-[10.5px] font-semibold uppercase tracking-wide text-muted">{car.brand.name}</p>
      <p className="truncate text-[13.5px] font-bold text-ink">{car.name}</p>
      <p className="truncate text-[12px] font-bold text-brand">{formatSinglePrice(car.priceMin)}</p>
    </div>
  </div>
);

// The "compare any cars" entry point — the random-pairs list below only
// ever shows already-available cars paired up two at a time, this is
// what lets a visitor build their own 2-4 car comparison from scratch,
// brand first then model, same as picking a car anywhere else on the site.
//
// Selected cars are packed to the front of the grid (rather than staying
// pinned to whichever slot they were added in) — keeps the empty "add"
// placeholders trailing at the end, and guarantees the two selected cars
// always land in the first two grid cells so the VS badge between them
// never has to guess a position.
export default function ComparePicker({ options }: { options: CarOption[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<CarOption[]>([]);

  const byBrand = useMemo(() => {
    const map = new Map<string, CarOption[]>();
    for (const car of options) {
      const list = map.get(car.brand.name) ?? [];
      list.push(car);
      map.set(car.brand.name, list);
    }
    return map;
  }, [options]);

  const brands = useMemo(() => [...byBrand.keys()].sort(), [byBrand]);
  const excludeSlugs = new Set(selected.map((c) => c.slug));
  const emptySlotCount = MAX_CARS - selected.length;

  const addCar = (car: CarOption) => {
    if (selected.length >= MAX_CARS) return;
    setSelected((prev) => [...prev, car]);
  };

  const removeCar = (slug: string) => {
    setSelected((prev) => prev.filter((c) => c.slug !== slug));
  };

  const handleCompare = () => {
    if (selected.length < MIN_CARS) return;
    router.push(`/compare/${selected.map((c) => c.slug).join("-vs-")}`);
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[14.5px] font-bold text-ink">
          Select Cars to Compare{" "}
          <span className="font-medium text-muted">
            ({selected.length}/{MAX_CARS} selected)
          </span>
        </h3>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => setSelected([])}
            className="cursor-pointer text-[12px] font-semibold text-muted hover:text-brand"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="relative grid grid-cols-2 gap-3 lg:grid-cols-4">
        {selected.map((car) => (
          <FilledSlot key={car.slug} car={car} onRemove={() => removeCar(car.slug)} />
        ))}
        {Array.from({ length: emptySlotCount }, (_, i) => (
          <AddCarSlot key={i} brands={brands} byBrand={byBrand} excludeSlugs={excludeSlugs} onPick={addCar} />
        ))}

        {selected.length === 2 && (
          <span className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-page bg-brand text-[11px] font-bold text-white lg:left-1/4">
            VS
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={handleCompare}
        disabled={selected.length < MIN_CARS}
        className="mt-4 w-full cursor-pointer rounded-xl bg-brand py-2.5 text-[13.5px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
      >
        Compare{selected.length >= MIN_CARS ? ` (${selected.length})` : ""}
      </button>
    </div>
  );
}
