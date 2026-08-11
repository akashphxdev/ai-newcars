"use client";

import { useState } from "react";
import Image from "next/image";
import { formatSinglePrice } from "@/lib/format";
import { buildSwatchBackground } from "@/lib/colorSwatch";
import type { CarDetailColor } from "@/features/cars/car.types";

export default function CarModelColours({ colors, modelName }: { colors: CarDetailColor[]; modelName: string }) {
  const firstWithImage = colors.findIndex((color) => color.imageUrl);
  const [selectedIndex, setSelectedIndex] = useState(firstWithImage >= 0 ? firstWithImage : 0);
  const selected = colors[selectedIndex] ?? colors[0];

  return (
    <div className="grid overflow-hidden rounded-lg border border-border bg-white lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="relative min-h-[260px] bg-[#f3f4f6] sm:min-h-[450px]">
        {selected?.imageUrl ? (
          <Image
            src={selected.imageUrl}
            alt={`${modelName} in ${selected.colorName}`}
            fill
            sizes="(min-width: 1024px) 650px, 100vw"
            className="object-contain p-5 mix-blend-multiply sm:p-8"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted">Colour image unavailable</div>
        )}

        <div className="absolute left-4 top-4 rounded-lg border border-white/80 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">Selected finish</p>
          <p className="mt-0.5 text-[13px] font-extrabold text-ink">{selected?.colorName}</p>
        </div>

        <p className="absolute bottom-4 right-4 text-[11px] font-bold text-muted tabular-nums">
          {String(selectedIndex + 1).padStart(2, "0")} / {String(colors.length).padStart(2, "0")}
        </p>
      </div>

      <div className="border-t border-border p-4 sm:p-5 lg:border-l lg:border-t-0">
        <div className="flex items-end justify-between gap-3 border-b border-border pb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand">Available colours</p>
            <h3 className="mt-1 text-[15px] font-extrabold text-ink">Select a finish</h3>
          </div>
          <span className="text-[11px] font-semibold text-muted">{colors.length} options</span>
        </div>

        <div className="mt-3 grid max-h-[248px] gap-1 overflow-y-auto pr-1 sm:grid-cols-2 lg:max-h-[390px] lg:grid-cols-1">
          {colors.map((color, index) => (
            <button
              key={color.id}
              type="button"
              aria-pressed={selected?.id === color.id}
              onClick={() => setSelectedIndex(index)}
              className={`group flex min-h-14 w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                selected?.id === color.id
                  ? "border-brand bg-brand-soft"
                  : "border-transparent hover:border-border hover:bg-page"
              }`}
            >
              <span
                className={`block size-8 shrink-0 rounded-full border-2 shadow-sm transition-transform group-hover:scale-105 ${
                  selected?.id === color.id ? "border-brand" : "border-white"
                }`}
                style={{ background: buildSwatchBackground(color.shades) }}
              />
              <span className="min-w-0">
                <span className="block text-[12px] font-bold leading-4 text-ink">{color.colorName}</span>
                <span className="mt-0.5 block text-[10.5px] text-muted">
                  {color.additionalCost && Number(color.additionalCost) > 0
                    ? `+${formatSinglePrice(color.additionalCost)}`
                    : "No additional cost"}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
