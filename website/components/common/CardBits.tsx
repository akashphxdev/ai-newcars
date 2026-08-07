// components/common/CardBits.tsx
//
// Small pieces reused across every car/content card on the home page
// (the save/wishlist heart button, the star rating row) — previously
// each section defined its own copy of these.
"use client";
import { useEffect, useState } from "react";
import { HeartIcon, StarIcon } from "./icons";
import AuthModal from "./AuthModal";
import { getCurrentUserToken } from "@/features/auth/currentUser";
import { isWishlisted, toggleWishlist, ensureWishlistLoaded, subscribeWishlist } from "@/features/wishlist/wishlistStore";

export function WishlistButton({ modelId, size = "sm", dark = false }: { modelId: number; size?: "sm" | "md"; dark?: boolean }) {
  const [saved, setSaved] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    ensureWishlistLoaded();
    const sync = () => setSaved(isWishlisted(modelId));
    sync();
    return subscribeWishlist(sync);
  }, [modelId]);

  const sizing = size === "md" ? "size-8 bg-white" : "size-7 bg-white/90 backdrop-blur-sm";
  const idle = dark ? "text-white" : "text-ink";

  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!getCurrentUserToken()) {
            setAuthOpen(true);
            return;
          }
          if (busy) return;
          setBusy(true);
          try {
            await toggleWishlist(modelId);
          } catch {
            // Best-effort — wishlistStore already rolled the optimistic
            // update back; nothing further to show on a small icon button.
          } finally {
            setBusy(false);
          }
        }}
        aria-label="Save to wishlist"
        className={`flex shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors disabled:cursor-wait ${sizing} ${
          saved ? "text-brand" : idle
        }`}
      >
        <HeartIcon filled={saved} />
      </button>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </>
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
