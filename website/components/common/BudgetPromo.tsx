// components/common/BudgetPromo.tsx
//
// The budget panel in the Tools menu: set a ceiling, go straight to the
// cars under it.
//
// Every other route into the catalogue asks the reader to pick a filter
// after they arrive. This asks the one question that actually narrows a
// car search — what can I spend — before the page loads, so the listing
// opens already answering it.

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { routes } from "@/lib/routes";

// Lakh, matched to the bands the New Cars menu already offers so the two
// never disagree about where the range ends.
const MIN = 5;
const MAX = 25;

export default function BudgetPromo({ onNavigate }: { onNavigate: () => void }) {
  const [lakh, setLakh] = useState(15);
  const atCeiling = lakh >= MAX;
  // Past the top of the slider the question flips from "under" to "above",
  // because there is no upper bound to promise.
  const href = atCeiling
    ? `${routes.newCars()}?minPrice=${MAX * 100000}`
    : `${routes.newCars()}?maxPrice=${lakh * 100000}`;

  return (
    <div className="ml-auto hidden w-[300px] shrink-0 flex-col rounded-2xl bg-brand-soft/60 p-5 xl:flex">
      <p className="font-head text-[19px] font-extrabold leading-tight text-ink">
        Find the right car
        <br />
        for your budget
      </p>
      <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
        Set a ceiling and see every model under it.
      </p>

      <div className="relative my-4 h-[110px]">
        <Image
          src="/design/ev-charging.png"
          alt=""
          fill
          sizes="300px"
          className="pointer-events-none object-contain"
        />
      </div>

      <div className="rounded-xl bg-surface p-3.5">
        <div className="flex items-center justify-between text-[12px] font-bold text-ink tabular-nums">
          <span>₹{MIN}L</span>
          <span className="text-brand">{atCeiling ? `₹${MAX}L+` : `₹${lakh}L`}</span>
        </div>
        <input
          type="range"
          min={MIN}
          max={MAX}
          step={1}
          value={lakh}
          onChange={(e) => setLakh(Number(e.target.value))}
          aria-label="Maximum budget in lakh"
          className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full outline-none
            [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand
            [&::-webkit-slider-thumb]:shadow-[0_0_0_3px_var(--color-surface)]
            [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-brand"
          style={{
            background: `linear-gradient(to right, var(--color-brand) ${((lakh - MIN) / (MAX - MIN)) * 100}%, var(--color-border) ${((lakh - MIN) / (MAX - MIN)) * 100}%)`,
          }}
        />
        <Link
          href={href}
          onClick={onNavigate}
          className="mt-3.5 block rounded-lg bg-brand py-2.5 text-center text-[13px] font-bold text-white no-underline transition-colors hover:bg-brand-hover"
        >
          Explore cars
        </Link>
      </div>
    </div>
  );
}
