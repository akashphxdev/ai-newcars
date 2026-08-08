"use client";

import { useState } from "react";
import Image from "next/image";
import { formatSinglePrice } from "@/lib/format";
import { buildSwatchBackground } from "@/lib/colorSwatch";
import type { CarDetailColor } from "@/features/cars/car.types";

// Plain display list — name, swatch, price delta. Colour -> photo
// switching lives in the hero gallery above (CarModelGallery), not here.
export default function CarModelColours({ colors, modelName }: { colors: CarDetailColor[]; modelName: string }) {
  const firstWithImage = colors.findIndex((color) => color.imageUrl);
  const [selectedIndex, setSelectedIndex] = useState(firstWithImage >= 0 ? firstWithImage : 0);
  const selected = colors[selectedIndex] ?? colors[0];

  return (
    <div className="grid overflow-hidden bg-[#151515] text-white lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]">
      <div className="relative min-h-[330px] bg-[#242424] sm:min-h-[480px]">
        {selected?.imageUrl ? (
          <Image src={selected.imageUrl} alt={`${modelName} in ${selected.colorName}`} fill sizes="(min-width: 1024px) 850px, 100vw" className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/55">Colour image unavailable</div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-black/70 px-5 py-4 backdrop-blur-sm sm:px-7">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand">Selected finish</p>
          <p className="mt-1 font-head text-xl font-bold">{selected?.colorName}</p>
        </div>
      </div>

      <div className="flex flex-col justify-center px-5 py-7 sm:px-8 lg:px-10">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-brand">Paint studio</p>
        <h3 className="mt-2 font-head text-2xl font-extrabold leading-tight sm:text-3xl">Find your finish.</h3>
        <p className="mt-3 text-[12.5px] leading-6 text-white/60">Choose a colour to preview the available factory finish.</p>

        <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-5">
          {colors.map((color, index) => (
            <button key={color.id} type="button" onClick={() => setSelectedIndex(index)} className="group text-left">
              <span
                className={`block size-9 rounded-full border-2 transition-transform group-hover:scale-105 ${selected?.id === color.id ? "border-brand" : "border-white/35"}`}
                style={{ background: buildSwatchBackground(color.shades) }}
              />
              <span className="mt-2 block text-[11.5px] font-bold text-white">{color.colorName}</span>
              {color.additionalCost && Number(color.additionalCost) > 0 && (
                <span className="mt-0.5 block text-[10.5px] text-white/50">+{formatSinglePrice(color.additionalCost)}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
