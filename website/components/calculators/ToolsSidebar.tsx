// components/calculators/ToolsSidebar.tsx
//
// The rail beside a calculator's editorial content: the other tools, and
// a reserved advertising slot.
//
// Someone working out an EMI is usually within one question of another
// tool — what deposit gets that EMI, what the fuel will cost — and there
// was no way to reach them from here. Cross-links belong beside the
// explainer and FAQ rather than the calculator itself, which needs the
// full width to be usable.

import Link from "next/link";
import { ChevronIcon } from "@/components/common/icons";
import { routes } from "@/lib/routes";

const TOOLS = [
  { href: routes.emiCalculator(), label: "Car loan EMI", note: "What it costs a month" },
  { href: routes.downPaymentCalculator(), label: "Down payment", note: "What to put down" },
  { href: routes.affordabilityCalculator(), label: "Affordability", note: "What your budget reaches" },
  { href: routes.mileageCalculator(), label: "Mileage & running cost", note: "What every km costs" },
  { href: routes.fuelComparisonCalculator(), label: "Petrol vs diesel vs CNG", note: "Which fuel pays off" },
  { href: routes.evChargingCalculator(), label: "EV charging time", note: "How long a charge takes" },
];

export default function ToolsSidebar({ currentHref }: { currentHref: string }) {
  const others = TOOLS.filter((t) => t.href !== currentHref);

  return (
    <aside className="space-y-5">
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <p className="border-b border-border-soft px-4 py-3 text-[12px] font-bold uppercase tracking-[0.1em] text-muted">
          More tools
        </p>
        <ul>
          {others.map((t) => (
            <li key={t.href} className="border-b border-border-soft last:border-b-0">
              <Link
                href={t.href}
                className="flex items-center justify-between gap-3 px-4 py-3 no-underline transition-colors hover:bg-page"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-ink">{t.label}</span>
                  <span className="block truncate text-[11px] text-muted">{t.note}</span>
                </span>
                <ChevronIcon dir="right" className="size-3.5 shrink-0 text-faint" />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Reserved rather than filled. No ad provider is configured, and a
          slot that collapses to nothing would shift the page when one is —
          so it holds its height and says what it is instead of rendering
          a fake advertisement. */}
      <div
        data-ad-slot="tools-sidebar"
        className="flex min-h-[250px] items-center justify-center rounded-xl border border-dashed border-border bg-page"
      >
        <span className="text-[11px] uppercase tracking-[0.12em] text-subtle">Advertisement</span>
      </div>
    </aside>
  );
}
