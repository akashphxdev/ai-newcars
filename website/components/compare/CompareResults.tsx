"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getCompareData } from "@/features/compare/compare.api";
import { takePendingCompareSelection, savePendingCompareSelection } from "@/features/compare/comparePendingSelection";
import CompareCarHeader from "./CompareCarHeader";
import AddCarSlot, { type SelectedCompareCar } from "./AddCarSlot";
import SpecComparison from "./SpecComparison";
import type { CompareCarResult, CarOption } from "@/features/compare/compare.types";

const MAX_CARS = 4;

// Owns the "which variant/powertrain per car" state client-side. Switching
// either dropdown re-fetches from the API and swaps the data in place —
// no navigation, so the URL stays clean regardless of what's selected.
// A "+ Add car" slot (once under MAX_CARS) extends the comparison the
// same way — new URL (one more slug), current selections carried across
// via the same sessionStorage handoff the compare-cars picker uses.
export default function CompareResults({
  initialCars,
  slugs,
  carOptions,
}: {
  initialCars: CompareCarResult[];
  slugs: string[];
  carOptions: CarOption[];
}) {
  const router = useRouter();
  const [cars, setCars] = useState(initialCars);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const pending = takePendingCompareSelection();
    if (!pending || pending.slugPath !== slugs.join("-vs-")) return;
    applySelection(pending.variantIds, pending.powertrainIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const byBrand = useMemo(() => {
    const map = new Map<string, CarOption[]>();
    for (const car of carOptions) {
      const list = map.get(car.brand.name) ?? [];
      list.push(car);
      map.set(car.brand.name, list);
    }
    return map;
  }, [carOptions]);
  const brands = useMemo(() => [...byBrand.keys()].sort(), [byBrand]);
  const excludeSlugs = new Set(cars.map((c) => c.slug));

  async function applySelection(variantIds: (number | undefined)[], powertrainIds: (number | undefined)[]) {
    setLoading(true);
    try {
      const data = await getCompareData(slugs, variantIds, powertrainIds);
      if (data) setCars(data.cars);
    } finally {
      setLoading(false);
    }
  }

  function handleVariantChange(index: number, variantId: number) {
    const variantIds = cars.map((c, i) => (i === index ? variantId : c.selectedVariant?.id));
    // New variant may not carry the same powertrain id — let it re-resolve
    // to that variant's own default rather than forcing a mismatched one.
    const powertrainIds = cars.map((c, i) => (i === index ? undefined : c.selectedPowertrain?.id));
    applySelection(variantIds, powertrainIds);
  }

  function handlePowertrainChange(index: number, powertrainId: number) {
    const variantIds = cars.map((c) => c.selectedVariant?.id);
    const powertrainIds = cars.map((c, i) => (i === index ? powertrainId : c.selectedPowertrain?.id));
    applySelection(variantIds, powertrainIds);
  }

  function handleAddCar(newCar: SelectedCompareCar) {
    const slugPath = [...slugs, newCar.slug].join("-vs-");
    savePendingCompareSelection({
      slugPath,
      variantIds: [...cars.map((c) => c.selectedVariant?.id), newCar.variantId],
      powertrainIds: [...cars.map((c) => c.selectedPowertrain?.id), newCar.powertrainId],
    });
    router.push(`/compare/${slugPath}`);
  }

  // Generic template (works for any 2-4 cars) — not car-specific copy, just
  // the names/prices interpolated in, same idea as CarDekho's intro line.
  const names = cars.map((c) => c.name);
  const introNames = names.length > 2 ? `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}` : names.join(" or ");

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-ink sm:text-[32px]">{names.join(" vs ")}</h1>
      <p className="mb-6 max-w-3xl text-[15px] leading-relaxed text-ink/70">
        Should you buy {introNames}? Compare price, performance, features, and specifications side-by-side to find the
        car that fits you best.
      </p>

      <div className="relative grid grid-cols-2 gap-2.5 sm:gap-6 lg:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
        {cars.map((car, i) => (
          <CompareCarHeader
            key={car.id}
            car={car}
            loading={loading}
            onVariantChange={(variantId) => handleVariantChange(i, variantId)}
            onPowertrainChange={(powertrainId) => handlePowertrainChange(i, powertrainId)}
          />
        ))}

        {/* Always fill up to MAX_CARS slots (2 cars + 2 empty "Add car"
            cards, not just one) so the grid never leaves a dangling gap —
            keyed on cars.length so every slot remounts (fresh state) when
            the count changes, same fix as the compare-cars picker. */}
        {Array.from({ length: MAX_CARS - cars.length }, (_, i) => (
          <AddCarSlot key={`${cars.length}-${i}`} brands={brands} byBrand={byBrand} excludeSlugs={excludeSlugs} onPick={handleAddCar} />
        ))}

        {cars.length === 2 && (
          <span className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-page bg-brand text-[10px] font-bold text-white sm:size-11 sm:text-[12px] lg:left-1/4">
            VS
          </span>
        )}
      </div>

      <div className="mt-6">
        <SpecComparison cars={cars} />
      </div>
    </>
  );
}
