// components/common/CardBits.tsx
//
// Small pieces reused across every car/content card on the home page
// (spec pills, the save/wishlist heart button, the rating badge) —
// previously each section defined its own copy of these.
import { HeartIcon, StarIcon } from "./icons";

export function SpecPill({ icon, label, dark = false }: { icon: React.ReactNode; label: string; dark?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
        dark ? "bg-white/10 text-white/80" : "bg-page text-muted"
      }`}
    >
      {icon}
      {label}
    </span>
  );
}

/** Bare icon + label, no pill background — used where space is tighter (e.g. Latest Cars). */
export function SpecItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-muted">
      <span className="text-brand">{icon}</span>
      <span className="text-[10.5px] font-semibold whitespace-nowrap">{label}</span>
    </span>
  );
}

export function WishlistButton({ dark = false }: { dark?: boolean }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      aria-label="Save to wishlist"
      className={`flex size-7 shrink-0 items-center justify-center rounded-full backdrop-blur-sm transition-colors ${
        dark ? "bg-white/15 text-white hover:text-ev" : "bg-white/90 text-ink hover:text-brand"
      }`}
    >
      <HeartIcon />
    </button>
  );
}

export function RatingBadge({ rating }: { rating: number }) {
  return (
    <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-ink backdrop-blur-sm">
      <StarIcon filled className="size-3 text-amber-400" />
      {rating}
    </span>
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

/** Small rounded label pill, e.g. category/status badges on card images. */
export function Badge({
  children,
  tone = "brand",
}: {
  children: React.ReactNode;
  tone?: "brand" | "dark" | "light" | "ev";
}) {
  const tones: Record<string, string> = {
    brand: "bg-brand text-white",
    dark: "bg-ink/75 text-white backdrop-blur-sm",
    light: "bg-white/95 text-ink",
    ev: "bg-ev text-[#06120f]",
  };
  return (
    <span className={`inline-block rounded-full px-2 py-[3px] text-[9px] font-bold uppercase tracking-[0.04em] ${tones[tone]}`}>
      {children}
    </span>
  );
}
