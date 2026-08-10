// components/cars/ModelHero.tsx
//
// The model page's opening screen: one large photograph of the car where
// it actually lives, with the identifying facts over it, and an action
// bar underneath.
//
// Deliberately not a mode of CarModelHero. That component is a split
// gallery/spec layout, which is right for a variant — where the reader
// has already chosen the car and is comparing trims — and wrong for the
// model page, where the job is to show the car. One component covering
// both would be a prop that swaps the entire layout, which is two
// components sharing a name.

import Image from "next/image";
import Link from "next/link";
import CarLeadActions from "./CarLeadActions";
import VariantSwitcher from "./VariantSwitcher";
import { WishlistButton } from "@/components/common/CardBits";
import { StarIcon, ShareIcon } from "@/components/common/icons";
import { formatPriceRange, formatSinglePrice, carTitle } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { CarDetailResult, CarDetailSelectedVariant } from "@/features/cars/car.types";

const DATE_FMT = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "long", year: "numeric" });

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

  const photoCount = car.images.length;

  return (
    <section className="border-b border-border bg-white">
      <div className="relative isolate">
        <div className="relative h-[300px] w-full sm:h-[420px] lg:h-[520px]">
          {hero ? (
            <Image
              src={hero}
              alt={carTitle(car)}
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
          ) : (
            <div className="size-full bg-page" />
          )}

          {/* The facts sit bottom-left, so the scrim is weighted there and
              fades out well before the car, which is framed right of centre
              in almost every one of these shots. */}
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(100deg,rgba(9,11,16,0.88)_0%,rgba(9,11,16,0.72)_26%,rgba(9,11,16,0.28)_50%,transparent_72%)]"
          />

          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 lg:p-10">
            <div className="mx-auto max-w-7xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                {car.brand.name}
                {car.bodyType && <span className="mx-2 text-white/40">•</span>}
                {car.bodyType?.name}
              </p>

              <h1 className="mt-2 font-head text-[34px] font-extrabold leading-[1.02] tracking-[-0.03em] text-white sm:text-[46px] lg:text-[56px]">
                {car.name}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                {car.ratingAvg && (
                  <span className="flex items-center gap-1.5 text-[13px] font-bold text-white">
                    <StarIcon filled className="size-4 text-amber-400" />
                    {car.ratingAvg}
                    <span className="font-medium text-white/60">expert rating</span>
                  </span>
                )}
                {isUpcoming && car.expectedLaunchDate && (
                  <span className="text-[12.5px] font-medium text-white/75">
                    Expected {DATE_FMT.format(new Date(car.expectedLaunchDate))}
                  </span>
                )}
              </div>

              <p className="mt-4 font-head text-[26px] font-extrabold leading-none text-white sm:text-[30px]">
                {priceLabel}
              </p>
              <p className="mt-1.5 text-[11.5px] text-white/60">
                Ex-showroom. On-road price varies by city.
              </p>

              <div className="mt-5 flex items-center gap-2">
                <WishlistButton modelId={car.id} size="md" />
                <button
                  type="button"
                  aria-label="Share"
                  className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-white/30 text-white transition-colors hover:border-white hover:bg-white/10"
                >
                  <ShareIcon className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-4 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {variant && (
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0 sm:max-w-xs">
                <VariantSwitcher
                  brandSlug={car.brand.slug}
                  modelSlug={car.slug}
                  currentVariantName={variant.variantName}
                  variantOptions={car.variantOptions}
                  variantCount={car.variantCount}
                />
              </div>
              <p className="shrink-0 text-[13px] font-bold text-ink">
                {formatSinglePrice(variant.price)}
                <span className="ml-1.5 text-[11px] font-medium text-muted">ex-showroom</span>
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={routes.modelPhotos(car.brand.slug, car.slug)}
              className="text-[12px] font-semibold text-muted no-underline transition-colors hover:text-brand"
            >
              {photoCount} photos <span aria-hidden>·</span> {car.colors.length} colours{" "}
              <span aria-hidden>·</span> {car.variantCount} variants <span aria-hidden>→</span>
            </Link>
            {variant && (
              <CarLeadActions
                brandId={car.brand.id}
                modelId={car.id}
                variantId={variant.id}
                carName={car.name}
                imageUrl={car.coverImageUrl}
                priceLabel={formatSinglePrice(variant.price)}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
