"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ChevronIcon, CloseIcon } from "@/components/common/icons";
import { buildSwatchBackground } from "@/lib/colorSwatch";
import type { CarDetailImage, CarDetailColor } from "@/features/cars/car.types";

// admin-panel's fixed angle vocabulary (ImageModal.tsx / image.validation.ts
// ANGLES) — same 9 values, so labels here always match what an admin
// actually picked when uploading, nothing invented.
const ANGLE_LABELS: Record<string, string> = {
  front: "Front",
  rear: "Rear",
  side: "Side",
  interior: "Interior",
  dashboard: "Dashboard",
  boot: "Boot",
  wheel: "Wheel",
  top: "Top",
  other: "Other",
};
const ANGLE_ORDER = ["front", "rear", "side", "wheel", "top", "boot", "interior", "dashboard", "other"];

function angleKey(img: CarDetailImage): string {
  return img.angle && ANGLE_LABELS[img.angle] ? img.angle : "other";
}

// Fills whatever height its parent gives it (the page fixes the outer
// shell to h-screen) — no internal scrolling, everything sized via flex.
export default function CarPhotosViewer({
  images,
  colors,
  carLabel,
}: {
  images: CarDetailImage[];
  colors: CarDetailColor[];
  carLabel: string;
}) {
  const [activeAngle, setActiveAngle] = useState<string | "all">("all");
  // Colour and angle now combine (selecting a colour scopes the angle
  // pills — and their counts — to that colour's photos, rather than the
  // two being mutually exclusive).
  const [activeColor, setActiveColor] = useState<CarDetailColor | null>(null);
  const [index, setIndex] = useState(0);

  const colorScoped = activeColor ? images.filter((img) => img.colorId === activeColor.id) : images;

  const pills = useMemo(() => {
    const counts = new Map<string, number>();
    for (const img of colorScoped) counts.set(angleKey(img), (counts.get(angleKey(img)) ?? 0) + 1);
    return ANGLE_ORDER.filter((a) => counts.has(a)).map((a) => ({ key: a, label: ANGLE_LABELS[a], count: counts.get(a)! }));
  }, [colorScoped]);

  const filtered = activeAngle === "all" ? colorScoped : colorScoped.filter((img) => angleKey(img) === activeAngle);
  const current = filtered[Math.min(index, filtered.length - 1)];
  // A colour can be selected with no gallery photos tagged to it at all —
  // fall back to its own single representative photo (CarColor.imageUrl).
  // If it HAS tagged photos but just none matching the current angle,
  // that's a real "no results for this filter" case, not a fallback.
  const fallbackImage = activeColor && colorScoped.length === 0 ? activeColor.imageUrl : null;
  const displayImage = fallbackImage ?? current?.imageUrl;
  const displayCaption = activeColor
    ? activeColor.colorName
    : current?.angle && ANGLE_LABELS[current.angle]
      ? ANGLE_LABELS[current.angle]
      : null;

  function selectAngle(angle: string | "all") {
    setActiveAngle(angle);
    setIndex(0);
  }

  function selectThumbnail(i: number) {
    setIndex(i);
  }

  function go(delta: number) {
    setIndex((i) => (i + delta + filtered.length) % filtered.length);
  }

  function selectColor(color: CarDetailColor) {
    const hasContent = Boolean(color.imageUrl) || images.some((img) => img.colorId === color.id);
    if (!hasContent) return;
    setActiveColor((prev) => (prev?.id === color.id ? null : color));
    setActiveAngle("all");
    setIndex(0);
  }

  function clearColor() {
    setActiveColor(null);
    setActiveAngle("all");
    setIndex(0);
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-white/60">
        No photos available for the {carLabel} yet.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {pills.length > 1 && (
        <div className="flex shrink-0 gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
          <button
            type="button"
            onClick={() => selectAngle("all")}
            className={`shrink-0 cursor-pointer whitespace-nowrap rounded-full border px-4 py-2 text-[12.5px] font-semibold transition-colors ${
              activeAngle === "all" ? "border-brand text-brand" : "border-white/20 text-white/70 hover:border-white/40"
            }`}
          >
            All ({colorScoped.length})
          </button>
          {pills.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => selectAngle(p.key)}
              className={`shrink-0 cursor-pointer whitespace-nowrap rounded-full border px-4 py-2 text-[12.5px] font-semibold transition-colors ${
                activeAngle === p.key ? "border-brand text-brand" : "border-white/20 text-white/70 hover:border-white/40"
              }`}
            >
              {p.label} ({p.count})
            </button>
          ))}
        </div>
      )}

      <div className="relative min-h-0 flex-1 px-4">
        {displayImage ? (
          <Image
            key={fallbackImage ? `color-${activeColor?.id}` : current?.id}
            src={displayImage}
            alt={`${carLabel}${displayCaption ? ` ${displayCaption}` : ""}`}
            fill
            priority
            sizes="100vw"
            className="object-contain"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-white/60">
            No {activeAngle !== "all" ? ANGLE_LABELS[activeAngle] : ""} photos in {activeColor?.colorName} yet.
          </div>
        )}

        {!fallbackImage && filtered.length > 1 && (
          <>
            <span className="absolute right-6 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white">
              {index + 1}/{filtered.length}
            </span>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous image"
              className="absolute left-6 top-1/2 flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
            >
              <ChevronIcon dir="left" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next image"
              className="absolute right-6 top-1/2 flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
            >
              <ChevronIcon dir="right" />
            </button>
          </>
        )}

        {displayImage && displayCaption && (
          <span className="absolute bottom-3 left-6 rounded-md bg-black/70 px-2.5 py-1 text-[11.5px] font-semibold text-white">
            {carLabel} {displayCaption}
          </span>
        )}
      </div>

      {colors.length > 0 && (
        <div className="flex shrink-0 items-center gap-2.5 overflow-x-auto px-4 py-3 scrollbar-none">
          <span className="shrink-0 text-[11.5px] font-semibold text-white/50">Colours:</span>
          <button
            type="button"
            onClick={clearColor}
            aria-label="Show all photos"
            title="All"
            className={`flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 bg-white text-ink transition-colors ${
              activeColor === null ? "border-brand" : "border-white/40"
            }`}
          >
            <CloseIcon className="size-3.5" />
          </button>
          {colors.map((color) => {
            const hasContent = Boolean(color.imageUrl) || images.some((img) => img.colorId === color.id);
            return (
              <button
                key={color.id}
                type="button"
                onClick={() => selectColor(color)}
                title={color.colorName}
                aria-label={`View ${carLabel} in ${color.colorName}`}
                className={`size-6 shrink-0 rounded-full border-2 transition-colors ${
                  hasContent ? "cursor-pointer" : "cursor-default opacity-50"
                } ${activeColor?.id === color.id ? "border-brand" : "border-white/40"}`}
                style={{ background: buildSwatchBackground(color.shades) }}
              />
            );
          })}
        </div>
      )}

      {filtered.length > 1 && (
        <div className="flex shrink-0 gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
          {filtered.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => selectThumbnail(i)}
              className={`relative aspect-4/3 h-14 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 transition-colors ${
                i === index ? "border-brand" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={img.imageUrl} alt={`${carLabel} thumbnail ${i + 1}`} fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
