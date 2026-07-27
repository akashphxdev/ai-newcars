"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronIcon, CloseIcon } from "@/components/common/icons";
import { buildSwatchBackground } from "@/lib/colorSwatch";
import type { CarDetailImage, CarDetailColor } from "@/features/cars/car.types";

const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500'%3E%3Crect width='800' height='500' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='20' fill='%239ca3af'%3EImage unavailable%3C/text%3E%3C/svg%3E";

// Gallery for the model detail hero — thumbnail rail + large image with
// prev/next. Clicking a colour dot filters the main image AND thumbnails
// down to that colour's tagged photos (CarImage.colorId); the blank dot
// clears back to the full gallery. The 4th thumbnail slot and the last
// slide of the main image both become a "View All" link to the full
// /photos page once there are more photos than fit here.
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

  const gallery = activeColorId ? images.filter((img) => img.colorId === activeColorId) : images;
  const current = gallery[index]?.imageUrl ?? fallbackImage ?? FALLBACK_IMG;
  const isLastSlide = gallery.length > 1 && index === gallery.length - 1;
  const go = (delta: number) => setIndex((i) => (i + delta + gallery.length) % gallery.length);

  function selectColor(color: CarDetailColor) {
    const hasContent = images.some((img) => img.colorId === color.id);
    if (!hasContent) return;
    setActiveColorId((prev) => (prev === color.id ? null : color.id));
    setIndex(0);
  }

  const thumbs = gallery.slice(0, 3);
  const showViewAllThumb = gallery.length > 3;

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-start">
      {gallery.length > 1 && (
        <div className="flex gap-2 overflow-x-auto sm:w-20 sm:shrink-0 sm:flex-col sm:overflow-y-auto">
          {thumbs.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`relative aspect-4/3 w-16 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 transition-colors sm:w-full ${
                i === index ? "border-brand" : "border-transparent hover:border-border"
              }`}
            >
              <Image src={img.imageUrl} alt={`${alt} thumbnail ${i + 1}`} fill sizes="80px" className="object-cover" />
            </button>
          ))}
          {showViewAllThumb && (
            <Link
              href={photosHref}
              className="relative flex aspect-4/3 w-16 shrink-0 cursor-pointer items-center justify-center rounded-lg border-2 border-transparent bg-ink/80 text-center text-[10.5px] font-bold leading-tight text-white transition-colors hover:bg-ink sm:w-full"
            >
              View All
            </Link>
          )}
        </div>
      )}

      <div className="relative aspect-2/1 w-full max-w-130 overflow-hidden rounded-2xl bg-surface">
        <Image src={current} alt={alt} fill priority sizes="(min-width: 1024px) 520px, 100vw" className="object-cover" />

        {gallery.length > 1 && (
          <>
            <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white">
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
            className="absolute bottom-3 right-3 rounded-full bg-white px-3 py-1.5 text-[11.5px] font-bold text-brand shadow-md transition-colors hover:bg-orange-50"
          >
            View All Photos →
          </Link>
        )}

        {colors.length > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1.5">
            <span className="mr-0.5 text-[11px] font-semibold text-white">Colours:</span>
            <button
              type="button"
              onClick={() => setActiveColorId(null)}
              aria-label="Show all photos"
              title="All"
              className={`flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full border bg-white text-ink transition-colors ${
                activeColorId === null ? "border-brand" : "border-white/70"
              }`}
            >
              <CloseIcon className="size-2.5" />
            </button>
            {colors.slice(0, 6).map((c) => {
              const hasContent = images.some((img) => img.colorId === c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectColor(c)}
                  title={c.colorName}
                  aria-label={`View ${alt} in ${c.colorName}`}
                  className={`size-4 rounded-full border transition-colors ${
                    hasContent ? "cursor-pointer" : "cursor-default opacity-50"
                  } ${activeColorId === c.id ? "border-brand" : "border-white/70"}`}
                  style={{ background: buildSwatchBackground(c.shades) }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
