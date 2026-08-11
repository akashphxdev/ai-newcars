// components/cars/ModelHero.tsx
//
// The model page's opening screen: the car and what identifying it costs,
// side by side. The photograph fades out under the text on the left rather
// than carrying a dark scrim — these are bright location shots, and
// scrimming one to force white text on top reads as a mistake.
//
// Deliberately not a mode of CarModelHero: that component is a split
// gallery/spec layout, right for a variant page where the reader has
// chosen the car and is comparing trims.

import Image from "next/image";
import KeySpecsStrip from "./KeySpecsStrip";
import { StarIcon } from "@/components/common/icons";
import { formatPriceRange, formatSinglePrice, carTitle } from "@/lib/format";
import type { CarDetailResult, CarDetailSelectedVariant } from "@/features/cars/car.types";

// The catalogue holds studio cut-outs and location photography in the same
// `looks` set with nothing to tell them apart — except that the studio
// shot is the one flagged isPrimary. Across a sample of four models that
// held for all 32 `looks` images, so the first unflagged one is the
// photograph, and the flagged one is the fallback when a model has only
// the studio shot.
function pickHeroImage(car: CarDetailResult): string | null {
  const looks = car.images.filter((img) => img.angle === "looks");
  const onLocation = looks.find((img) => !img.isPrimary);
  return onLocation?.imageUrl ?? looks[0]?.imageUrl ?? car.coverImageUrl;
}

export default function ModelHero({
  car,
  variant,
}: {
  car: CarDetailResult;
  variant: CarDetailSelectedVariant | null;
}) {
  const isUpcoming = car.launchStatus !== "available";
  const hero = pickHeroImage(car);
  const priceLabel = isUpcoming
    ? formatSinglePrice(car.priceMin, "Price to be announced")
    : formatPriceRange(car.priceMin, car.priceMax);

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="relative">
        {/* Text sits on the left over white, so the photograph is faded
            out beneath it rather than being covered with a dark scrim. */}
        <div className="relative aspect-[16/9] w-full sm:aspect-[2/1] lg:aspect-[21/9]">
          {hero ? (
            <Image
              src={hero}
              alt={carTitle(car)}
              fill
              priority
              sizes="(min-width: 1024px) 1000px, 100vw"
              className="object-cover object-right"
            />
          ) : (
            <div className="size-full bg-page" />
          )}
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(95deg,var(--color-surface)_0%,var(--color-surface)_28%,rgba(255,255,255,0.72)_44%,transparent_66%)]"
          />

          <div className="absolute inset-y-0 left-0 flex max-w-[58%] flex-col justify-center p-5 sm:p-7 lg:p-9">
            <h1 className="font-head text-[26px] font-extrabold leading-[1.04] tracking-normal text-ink sm:text-[36px] lg:text-[44px]">
              {carTitle(car)}
            </h1>
            <p className="mt-1.5 text-[12.5px] font-semibold text-muted sm:text-[13.5px]">
              {car.brand.name}
              <span className="mx-1.5 text-faint">•</span>
              {variant?.isElectric && <span className="text-ev">Electric </span>}
              {car.bodyType?.name ?? "Car"}
            </p>

            {car.ratingAvg && (
              <div className="mt-3 flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <StarIcon filled className="size-4" />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
                  Expert rating
                  <span className="mt-0.5 block font-head text-[17px] font-extrabold normal-case tracking-normal text-ink">
                    {car.ratingAvg}
                    <span className="text-[12px] font-semibold text-muted">/5</span>
                  </span>
                </span>
              </div>
            )}

            <div className="mt-4 hidden sm:block">
              <p className="text-[11px] font-semibold text-muted">Ex-showroom price</p>
              <p className="mt-0.5 font-head text-[22px] font-extrabold leading-none text-ink lg:text-[26px]">
                {priceLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-border-soft sm:hidden">
          <div className="p-5">
            <p className="text-[11px] font-semibold text-muted">Ex-showroom price</p>
            <p className="mt-0.5 font-head text-[22px] font-extrabold leading-none text-ink">
              {priceLabel}
            </p>
          </div>
        </div>
      </div>

      <KeySpecsStrip variant={variant} bare />
    </section>
  );
}
