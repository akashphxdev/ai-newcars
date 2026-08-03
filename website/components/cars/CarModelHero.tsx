import Image from "next/image";
import Link from "next/link";
import CarModelGallery from "./CarModelGallery";
import CarLeadActions from "./CarLeadActions";
import { WishlistButton } from "@/components/common/CardBits";
import { StarIcon, ShareIcon } from "@/components/common/icons";
import { formatSinglePrice } from "@/lib/format";
import type { CarDetailResult, CarDetailSelectedVariant } from "@/features/cars/car.types";

const DATE_FMT = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "long", year: "numeric" });

// One section, image left / info right (like a single hero row) — not two
// stacked cards. Only the name and price actually change per car;
// everything else here is the same static shell for every model.
export default function CarModelHero({ car, variant }: { car: CarDetailResult; variant: CarDetailSelectedVariant | null }) {
  const isUpcoming = car.launchStatus !== "available";

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_420px]">
      <CarModelGallery
        images={car.images}
        colors={car.colors}
        fallbackImage={car.coverImageUrl}
        alt={`${car.brand.name} ${car.name}`}
        photosHref={`/${car.brand.slug}-cars/${car.slug}/photos`}
      />

      <div className="flex flex-col justify-center gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-head text-2xl font-extrabold leading-tight text-ink sm:text-3xl">{car.name}</h1>
              <WishlistButton size="md" />
              <button type="button" aria-label="Share" className="flex size-8 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:text-brand">
                <ShareIcon className="size-4" />
              </button>
            </div>

            <div className="mt-2 flex items-center gap-3">
              {car.ratingAvg && (
                <span className="flex items-center gap-1 rounded-md bg-green-600 px-2 py-0.5 text-[12px] font-bold text-white">
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
            <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-white">
              <Image src={car.brand.logoUrl} alt={car.brand.name} fill sizes="48px" className="object-contain p-1.5" />
            </div>
          )}
        </div>

        {variant && (
          <>
            <div className="border-t border-border pt-4">
              <p className="text-[12.5px] font-bold uppercase tracking-wide text-muted">Ex-Showroom Price</p>
              <p className="mt-1 text-[26px] font-extrabold text-ink">{formatSinglePrice(variant.price)}</p>
              <p className="text-[11.5px] font-medium text-faint">*Ex-showroom price, actual on-road price may vary by location</p>
              <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
                Get the best price, exclusive offers, and a hassle-free booking experience for your {car.brand.name} {car.name}.
              </p>
            </div>

            <CarLeadActions
              brandId={car.brand.id}
              brandName={car.brand.name}
              modelId={car.id}
              variantId={variant.id}
              carName={car.name}
              imageUrl={car.coverImageUrl}
              priceLabel={formatSinglePrice(variant.price)}
            />

            <Link href="/car-loan-emi-calculator" className="block text-center text-[12.5px] font-semibold text-brand hover:underline">
              Calculate EMI →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
