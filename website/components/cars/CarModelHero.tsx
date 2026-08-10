import Image from "next/image";
import CarModelGallery from "./CarModelGallery";
import CarLeadActions from "./CarLeadActions";
import CarLeadSecondaryActions from "./CarLeadSecondaryActions";
import VariantSwitcher from "./VariantSwitcher";
import { WishlistButton } from "@/components/common/CardBits";
import { StarIcon } from "@/components/common/icons";
import ShareButton from "@/components/common/ShareButton";
import { formatSinglePrice, carTitle } from "@/lib/format";
import type { CarDetailResult, CarDetailSelectedVariant } from "@/features/cars/car.types";
import { routes } from "@/lib/routes";

const DATE_FMT = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "long", year: "numeric" });

// One section, image left / info right (like a single hero row) — not two
// stacked cards. Only the name and price actually change per car;
// everything else here is the same static shell for every model.
export default function CarModelHero({
  car,
  variant,
  mode = "model",
}: {
  car: CarDetailResult;
  variant: CarDetailSelectedVariant | null;
  mode?: "model" | "variant";
}) {
  const isUpcoming = car.launchStatus !== "available";
  const title =
    mode === "variant" && variant
      ? variant.variantName.toLowerCase().startsWith(car.name.toLowerCase())
        ? variant.variantName
        : `${car.name} ${variant.variantName}`
      : car.name;

  return (
    <section className="overflow-hidden border-y border-border bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-[minmax(0,1.28fr)_minmax(360px,0.72fr)]">
        <div className="border-border lg:border-r">
        <CarModelGallery
          images={car.images}
          colors={car.colors}
          fallbackImage={car.coverImageUrl}
          alt={`${carTitle(car)}`}
          photosHref={routes.modelPhotos(car.brand.slug, car.slug)}
        />

        </div>

        <div className="flex flex-col justify-center px-5 py-7 sm:px-8 lg:px-10 lg:py-12">
          <div className="mb-5 flex items-center justify-between gap-4 border-b border-border pb-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-brand">
              {mode === "variant" ? "Variant detail" : `${car.bodyType?.name ?? "Car"} buying guide`}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <WishlistButton modelId={car.id} size="md" />
              <ShareButton
                title={carTitle(car)}
                iconClassName="size-4"
                className="flex size-9 cursor-pointer items-center justify-center border border-border text-muted transition-colors hover:border-brand hover:text-brand"
              />
            </div>
          </div>

          <div className="flex items-start justify-between gap-4">
          <div>
              <p className="text-[12px] font-semibold text-muted">{car.brand.name}</p>
              <h1 className="mt-1 font-head text-3xl font-extrabold leading-[1.05] text-ink sm:text-4xl lg:text-[44px]">{title}</h1>

              <div className="mt-4 flex flex-wrap items-center gap-3">
              {car.ratingAvg && (
                  <span className="flex items-center gap-1 bg-brand px-2.5 py-1 text-[12px] font-bold text-white">
                  {car.ratingAvg}
                  <StarIcon filled className="size-3" />
                </span>
              )}
              {isUpcoming && car.expectedLaunchDate && (
                <span className="text-[12.5px] font-medium text-muted">Expected launch: {DATE_FMT.format(new Date(car.expectedLaunchDate))}</span>
              )}
            </div>
          </div>

            {car.brand.logoUrl && (
                <div className="relative size-14 shrink-0 overflow-hidden border border-border bg-white">
                  <Image src={car.brand.logoUrl} alt={car.brand.name} fill sizes="56px" className="object-contain p-2" />
              </div>
            )}
          </div>

          {variant && (
            <div className="mt-7 border-t border-border pt-6">
              <p className="text-[10.5px] font-black uppercase tracking-[0.14em] text-muted">Ex-showroom price</p>
              <div className="mt-1 flex flex-wrap items-end gap-x-4 gap-y-2">
                <p className="font-head text-[30px] font-extrabold leading-none text-ink sm:text-[34px]">
              {formatSinglePrice(variant.price)}
                </p>
              <CarLeadActions
                brandId={car.brand.id}
                modelId={car.id}
                variantId={variant.id}
                carName={car.name}
                imageUrl={car.coverImageUrl}
                priceLabel={formatSinglePrice(variant.price)}
              />
              </div>
              <p className="mt-2 text-[11px] font-medium text-muted">Ex-showroom price. On-road price varies by location.</p>

              <div className="mt-5 max-w-sm">
              <VariantSwitcher
                brandSlug={car.brand.slug}
                modelSlug={car.slug}
                currentVariantName={variant.variantName}
                variantOptions={car.variantOptions}
                variantCount={car.variantCount}
              />
            </div>
              <p className="mt-5 max-w-md text-[13px] leading-6 text-muted">
                Compare verified dealer offers, finance options and the complete specification before choosing your {carTitle(car)}.
              </p>
          </div>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <CarLeadSecondaryActions
            brandId={car.brand.id}
            brandName={car.brand.name}
            modelId={car.id}
            carName={car.name}
            imageUrl={car.coverImageUrl}
          />
        </div>
      </div>
    </section>
  );
}
