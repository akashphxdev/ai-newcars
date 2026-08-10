"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronIcon, CloseIcon } from "@/components/common/icons";
import { buildSwatchBackground } from "@/lib/colorSwatch";
import type { CarDetailImage, CarDetailColor } from "@/features/cars/car.types";

const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500'%3E%3Crect width='800' height='500' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='20' fill='%239ca3af'%3EImage unavailable%3C/text%3E%3C/svg%3E";

// Gallery for the model detail hero — thumbnail rail + large image with
// prev/next. The blank dot clears back to the full gallery, and the 4th
// thumbnail slot and last slide both become a "View All" link once there
// are more photos than fit here.
//
// Colour selection deliberately does not filter by CarImage.colorId.
// That column is null on all 15,151 rows in the catalogue, so every dot
// tested as "no photos for this colour", rendered at half opacity, and
// ignored clicks — the picker had never worked. Each colour carries its
// own studio render instead (2,400 of 2,405 have one), which is what a
// visitor asking to see a colour actually wants. The colorId path is kept
// because it is strictly better when those tags eventually exist.
export default function CarModelGallery({
  images,
  colors,
  fallbackImage,
  alt,
  photosHref,
}: {
  images: CarDetailImage[];
  colors: CarDetailColor[];
  fallbackImage: string | null;
  alt: string;
  photosHref: string;
}) {
  const [activeColorId, setActiveColorId] = useState<number | null>(null);
  const [index, setIndex] = useState(0);

  const activeColor = colors.find((c) => c.id === activeColorId) ?? null;

  const colorHasContent = (color: CarDetailColor) =>
    Boolean(color.imageUrl) || images.some((img) => img.colorId === color.id);

  const gallery = useMemo(() => {
    if (activeColor) {
      const tagged = images.filter((img) => img.colorId === activeColor.id);
      if (tagged.length)
        return tagged.map((img) => ({ key: `img-${img.id}`, url: img.imageUrl, isRender: false }));
      return activeColor.imageUrl
        ? [{ key: `color-${activeColor.id}`, url: activeColor.imageUrl, isRender: true }]
        : [];
    }
    return images.map((img) => ({ key: `img-${img.id}`, url: img.imageUrl, isRender: false }));
  }, [activeColor, images]);

  const current = gallery[index]?.url ?? fallbackImage ?? FALLBACK_IMG;
  // Colour renders are only 360x240, against 930x620 for the photographs.
  // Stretched to fill the same frame they blur visibly, so they are shown
  // contained on the studio white they were shot on — displayed nearer
  // their real size, which reads as deliberate rather than soft.
  const currentIsRender = gallery[index]?.isRender ?? false;
  const isLastSlide = gallery.length > 1 && index === gallery.length - 1;
  const go = (delta: number) => setIndex((i) => (i + delta + gallery.length) % gallery.length);

  function selectColor(color: CarDetailColor) {
    if (!colorHasContent(color)) return;
    setActiveColorId((prev) => (prev === color.id ? null : color.id));
    setIndex(0);
  }

  const thumbs = gallery.slice(0, 3);
  const showViewAllThumb = gallery.length > 3;

  return (
    <div className="flex h-full min-h-[360px] flex-col-reverse bg-[#eef0f2] sm:min-h-[460px] sm:flex-row sm:items-stretch lg:min-h-[540px]">
      {gallery.length > 1 && (
        <div className="flex gap-2 overflow-x-auto border-t border-white/70 bg-white/85 p-2 sm:w-24 sm:shrink-0 sm:flex-col sm:overflow-y-auto sm:border-r sm:border-t-0 sm:p-3">
          {thumbs.map((slide, i) => (
            <button
              key={slide.key}
              type="button"
              onClick={() => setIndex(i)}
              className={`relative aspect-4/3 w-16 shrink-0 cursor-pointer overflow-hidden border-2 transition-colors sm:w-full ${
                i === index ? "border-brand" : "border-transparent hover:border-border"
              }`}
            >
              <Image src={slide.url} alt={`${alt} thumbnail ${i + 1}`} fill sizes="80px" className="object-cover" />
            </button>
          ))}
          {showViewAllThumb && (
            <Link
              href={photosHref}
              className="relative flex aspect-4/3 w-16 shrink-0 cursor-pointer items-center justify-center border-2 border-transparent bg-ink/80 text-center text-[10.5px] font-bold leading-tight text-white transition-colors hover:bg-ink sm:w-full"
            >
              View All
            </Link>
          )}
        </div>
      )}

      <div className="relative min-h-[300px] w-full flex-1 overflow-hidden bg-[#eef0f2] sm:min-h-0">
        <Image
          src={current}
          alt={alt}
          fill
          priority
          sizes="(min-width: 1024px) 760px, 100vw"
          className={currentIsRender ? "bg-white object-contain p-6 sm:p-10" : "object-cover"}
        />

        {gallery.length > 1 && (
          <>
            <span className="absolute right-3 top-3 rounded-md bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white">
              {index + 1}/{gallery.length}
            </span>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-ink shadow-md transition-colors hover:bg-white"
            >
              <ChevronIcon dir="left" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-ink shadow-md transition-colors hover:bg-white"
            >
              <ChevronIcon dir="right" />
            </button>
          </>
        )}

        {isLastSlide && (
          <Link
            href={photosHref}
            className="absolute bottom-3 right-3 rounded-md bg-white px-3 py-1.5 text-[11.5px] font-bold text-brand shadow-md transition-colors hover:bg-orange-50"
          >
            View All Photos →
          </Link>
        )}

        {colors.length > 0 && (
          <div className="absolute inset-x-3 bottom-3 flex max-w-full flex-wrap items-center gap-1.5 rounded-lg bg-black/65 px-3 py-2 backdrop-blur-sm sm:inset-x-auto sm:left-3 sm:max-w-[calc(100%-1.5rem)] sm:flex-nowrap">
            <span className="mr-0.5 shrink-0 text-[11px] font-semibold text-white">
              {activeColor ? activeColor.colorName : `${colors.length} colours`}
            </span>
            <button
              type="button"
              onClick={() => setActiveColorId(null)}
              aria-label="Show all photos"
              title="All"
              className={`flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 bg-white text-ink transition-[border-color,transform] hover:scale-110 ${
                activeColorId === null ? "border-brand" : "border-white/70"
              }`}
            >
              <CloseIcon className="size-2.5" />
            </button>
            <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto scrollbar-none">
              {colors.map((c) => {
                const hasContent = colorHasContent(c);
                const selected = activeColorId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectColor(c)}
                    title={c.colorName}
                    aria-label={`View ${alt} in ${c.colorName}`}
                    aria-pressed={selected}
                    className={`size-5 shrink-0 rounded-full border-2 transition-[border-color,transform] ${
                      hasContent ? "cursor-pointer hover:scale-110" : "cursor-default opacity-40"
                    } ${selected ? "scale-110 border-brand" : "border-white/70"}`}
                    style={{ background: buildSwatchBackground(c.shades) }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
