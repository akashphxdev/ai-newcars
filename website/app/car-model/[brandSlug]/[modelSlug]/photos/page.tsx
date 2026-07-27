import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCarImages } from "@/features/cars/car.api";
import { ChevronIcon } from "@/components/common/icons";
import CarPhotosViewer from "@/components/cars/CarPhotosViewer";

// "/tata-motors-cars/nexon/photos" via the rewrite in next.config.ts.
// Dedicated page (own lean API call) so browsing all photos doesn't need
// the full car-detail payload — see getCarImages in car.api.ts.
//
// Fullscreen, no-scroll viewer: fixed to the viewport height (h-screen +
// overflow-hidden), and the site's Header/Footer are hidden for this route
// (see lib/routes.ts's isChromelessRoute, checked by both components).

type Props = { params: Promise<{ brandSlug: string; modelSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brandSlug, modelSlug } = await params;
  const car = await getCarImages(brandSlug, modelSlug);
  if (!car) return {};

  const title = `${car.brand.name} ${car.name} Images`;
  return { title, description: `All photos of the ${car.brand.name} ${car.name} — exterior, interior, and colour options.` };
}

export default async function CarPhotosPage({ params }: Props) {
  const { brandSlug, modelSlug } = await params;
  const car = await getCarImages(brandSlug, modelSlug);
  if (!car) notFound();

  const carLabel = `${car.brand.name} ${car.name}`;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-black text-white">
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
        <Link href={`/${brandSlug}-cars/${modelSlug}`} className="flex items-center gap-3" aria-label="Back to overview">
          <ChevronIcon dir="left" className="size-4" />
          <span className="text-[15px] font-bold">{carLabel}</span>
        </Link>
        <span className="text-[12.5px] font-medium text-white/50">{car.images.length} photos</span>
      </div>

      <CarPhotosViewer images={car.images} colors={car.colors} carLabel={carLabel} />
    </div>
  );
}
