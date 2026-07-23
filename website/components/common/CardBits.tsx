// components/common/CardBits.tsx
//
// Small pieces reused across every car/content card on the home page
// (the save/wishlist heart button, the star rating row) — previously
// each section defined its own copy of these.
"use client";
import { useState } from "react";
import { HeartIcon, StarIcon } from "./icons";

export function WishlistButton({ size = "sm", dark = false }: { size?: "sm" | "md"; dark?: boolean }) {
  const [saved, setSaved] = useState(false);

  const sizing = size === "md" ? "size-8 bg-white" : "size-7 bg-white/90 backdrop-blur-sm";
  const idle = dark ? "text-white" : "text-ink";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setSaved((s) => !s);
      }}
      aria-label="Save to wishlist"
      className={`flex shrink-0 items-center justify-center rounded-full transition-colors ${sizing} ${
        saved ? "text-brand" : idle
      }`}
    >
      <HeartIcon filled={saved} />
    </button>
  );
}

export function StarRow({ rating, size = "size-3.5" }: { rating: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon key={i} filled={i <= Math.round(rating)} className={`${size} ${i <= Math.round(rating) ? "text-amber-400" : "text-border"}`} />
      ))}
    </div>
  );
}
