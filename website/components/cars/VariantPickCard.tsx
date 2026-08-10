// components/cars/VariantPickCard.tsx
//
// The trim to look at first, above the table of every trim.
//
// A model with sixty-six variants gives a reader no way in: the entry car
// is cheapest and the top car has everything, and the interesting answer
// is neither. This names the trim carrying the most equipment per rupee
// and shows the arithmetic — what it adds, what it costs — because the
// figures are what make the pick checkable rather than an opinion.

import Link from "next/link";
import { formatSinglePrice, stripPrefix, slugify } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { VariantPick } from "@/features/cars/car.types";

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg bg-page px-3 py-2.5">
      <p className="text-[15px] font-black text-ink tabular-nums">{value}</p>
      <p className="mt-0.5 text-[11px] leading-tight text-muted">{label}</p>
    </div>
  );
}

export default function VariantPickCard({
  pick,
  car,
}: {
  pick: VariantPick;
  car: { name: string; slug: string; brand: { name: string; slug: string } };
}) {
  if (!pick.available || !pick.variantName || !pick.price) return null;

  // The model name already carries the brand, so one strip is the whole
  // job — same call the table below this card makes, so the two agree.
  const trim = stripPrefix(pick.variantName, car.name);
  const against = pick.comparedWith;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-border-soft bg-page px-4 py-3">
        <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-muted">
          Best equipped for the money
        </p>
        <p className="text-[11px] text-subtle">Across {car.name} trims</p>
      </div>

      <div className="p-4">
        <p className="text-[17px] font-black leading-tight text-ink">{trim}</p>
        <p className="mt-1 text-[13px] font-semibold text-brand">
          {formatSinglePrice(pick.price)} ex-showroom
        </p>

        {against && (
          <>
            <p className="mt-3 text-[13px] leading-relaxed text-body">
              It carries {against.extraFeatures} more of the features buyers shortlist on than the{" "}
              {stripPrefix(against.variantName, car.name)}, for{" "}
              {formatSinglePrice(against.extraCost)} more.
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Figure value={`+${against.extraFeatures}`} label="More features" />
              <Figure value={formatSinglePrice(against.extraCost)} label="More to pay" />
              <Figure value={String(pick.featureCount ?? 0)} label="Features in all" />
            </div>
          </>
        )}

        {pick.isEntryTrim && (
          <p className="mt-3 text-[13px] leading-relaxed text-body">
            The entry trim is itself the best equipped for its price — nothing above it adds
            enough to justify the step up on equipment alone.
          </p>
        )}

        <Link
          href={routes.variant(car.brand.slug, car.slug, slugify(pick.variantName))}
          className="mt-4 inline-flex text-[12.5px] font-bold text-brand no-underline hover:text-brand-hover"
        >
          See what this trim gets →
        </Link>

        <p className="mt-3 border-t border-border-soft pt-3 text-[11px] leading-relaxed text-subtle">
          Counted by equipment per rupee. It cannot know whether you want a diesel or a sunroof,
          so read it as where to start, not what to buy.
        </p>
      </div>
    </div>
  );
}
