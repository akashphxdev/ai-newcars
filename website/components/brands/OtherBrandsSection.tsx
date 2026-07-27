import Image from "next/image";
import SectionHeader from "@/components/common/SectionHeader";
import type { BrandWithCount } from "@/features/brands/brand.types";

const FALLBACK_LOGO =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='16' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='11' fill='%239ca3af'%3ELogo%3C/text%3E%3C/svg%3E";

// Bottom-of-page nav — logo-forward cards (mirrors BrandsGrid.tsx's
// card, the /brands index page's own style) rather than the text-only
// chip strip used on the body-type page, since brands actually have
// logos worth showing.
export default function OtherBrandsSection({ brands, currentSlug }: { brands: BrandWithCount[]; currentSlug: string }) {
  const others = brands.filter((b) => b.slug !== currentSlug && b.count > 0);
  if (others.length === 0) return null;

  return (
    <section className="bg-surface py-12 sm:py-14">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow="Keep Exploring"
          title="Explore other brands"
          subtitle="Browse cars from other manufacturers"
          href="/brands"
          linkLabel="View all brands"
        />

        <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {others.map((b) => (
            <a
              key={b.id}
              href={`/${b.slug}-cars`}
              className="flex w-[140px] shrink-0 flex-col items-center gap-3 rounded-2xl border border-border bg-white p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative size-14">
                <Image src={b.logoUrl ?? FALLBACK_LOGO} alt={b.name} fill sizes="56px" className="object-contain" />
              </div>
              <div>
                <p className="truncate text-[13px] font-bold text-ink">{b.name}</p>
                <p className="text-[11px] text-muted">
                  {b.count} model{b.count === 1 ? "" : "s"}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
