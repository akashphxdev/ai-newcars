// components/common/PageSidebar.tsx
//
// The rail that runs beside a page's main content: a few contextual
// links, and a reserved advertising slot.
//
// Every listing page was one full-width column, which left nowhere to
// cross-link the rest of the site and nowhere to put advertising. The
// links are passed in because what belongs here is different per page —
// a fuel page wants the running-cost tools, a news page wants the other
// categories — but the shape and the ad slot are the same everywhere.

import Link from "next/link";
import { ChevronIcon } from "@/components/common/icons";

export interface SidebarLink {
  href: string;
  label: string;
  note?: string;
}

export interface SidebarBlock {
  title: string;
  links: SidebarLink[];
}

export function SidebarAdSlot({ id }: { id: string }) {
  // Reserved rather than filled. No ad provider is configured, and a slot
  // that collapses to nothing would shift the page the day one is — so it
  // holds its height and says what it is instead of faking an advert.
  return (
    <div
      data-ad-slot={id}
      className="flex min-h-[250px] items-center justify-center rounded-xl border border-dashed border-border bg-page"
    >
      <span className="text-[11px] uppercase tracking-[0.12em] text-subtle">Advertisement</span>
    </div>
  );
}

export default function PageSidebar({
  blocks,
  adSlotId,
}: {
  blocks: SidebarBlock[];
  adSlotId: string;
}) {
  return (
    <aside className="space-y-5">
      {blocks
        .filter((b) => b.links.length > 0)
        .map((block) => (
          <div key={block.title} className="overflow-hidden rounded-xl border border-border bg-surface">
            <p className="border-b border-border-soft px-4 py-3 text-[12px] font-bold uppercase tracking-[0.1em] text-muted">
              {block.title}
            </p>
            <ul>
              {block.links.map((l) => (
                <li key={l.href} className="border-b border-border-soft last:border-b-0">
                  <Link
                    href={l.href}
                    className="flex items-center justify-between gap-3 px-4 py-3 no-underline transition-colors hover:bg-page"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-ink">{l.label}</span>
                      {l.note && <span className="block truncate text-[11px] text-muted">{l.note}</span>}
                    </span>
                    <ChevronIcon dir="right" className="size-3.5 shrink-0 text-faint" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

      <SidebarAdSlot id={adSlotId} />
    </aside>
  );
}
