// components/cars/TrimLadder.tsx
//
// Where this trim sits in the range: the trim one step below, this one,
// and the trim one step up, with the rupee gap to each.
//
// A variant page answers "what does this trim have" but the decision is
// always relative — is the step up worth it, does the step down lose
// anything I care about. The sibling list is already fetched to resolve
// the URL slug, so this costs no extra request.

import Link from "next/link";
import { ChevronIcon, StarIcon } from "@/components/common/icons";
import { formatSinglePrice, stripPrefix, slugify } from "@/lib/format";
import { topSellerId } from "@/lib/topSeller";
import { formatRupee } from "@/lib/calculatorFormat";
import { routes } from "@/lib/routes";
import type { CarDetailVariantOption } from "@/features/cars/car.types";

function Delta({ amount }: { amount: number }) {
  if (amount === 0) return null;
  const less = amount < 0;
  return (
    <p className={`mt-1 text-[11.5px] font-bold ${less ? "text-ev" : "text-brand"}`}>
      {formatRupee(Math.abs(amount))} {less ? "less" : "more"}
    </p>
  );
}

export default function TrimLadder({
  variants,
  currentId,
  carName,
  brandSlug,
  modelSlug,
}: {
  variants: CarDetailVariantOption[];
  currentId: number;
  carName: string;
  brandSlug: string;
  modelSlug: string;
}) {
  const ladder = [...variants].sort((a, b) => Number(a.price) - Number(b.price));
  const at = ladder.findIndex((v) => v.id === currentId);
  if (at === -1 || ladder.length < 2) return null;

  const badgedId = topSellerId(ladder);
  const current = ladder[at];
  const below = at > 0 ? ladder[at - 1] : null;
  const above = at < ladder.length - 1 ? ladder[at + 1] : null;
  const price = Number(current.price);

  const cell = (v: CarDetailVariantOption, role: "below" | "above") => (
    <Link
      href={routes.variant(brandSlug, modelSlug, slugify(v.variantName))}
      className="group flex min-w-0 flex-col justify-between rounded-xl border border-border bg-surface p-4 no-underline transition-colors hover:border-brand"
    >
      <div>
        <p className="flex items-center gap-1.5 text-[10.5px] font-black uppercase tracking-[0.12em] text-muted">
          {role === "below" && <ChevronIcon dir="left" className="size-3 text-faint" />}
          {role === "below" ? "One step down" : "One step up"}
          {role === "above" && <ChevronIcon className="size-3 text-faint" />}
        </p>
        <p className="mt-2 truncate text-[14px] font-extrabold text-ink group-hover:text-brand">
          {stripPrefix(v.variantName, carName)}
          {v.id === badgedId && (
            <span className="ml-1.5 inline-flex translate-y-[-1px] items-center gap-0.5 rounded bg-brand-soft px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.06em] text-brand">
              <StarIcon filled className="size-2" />
              Top seller
            </span>
          )}
        </p>
      </div>
      <div className="mt-3">
        <p className="text-[13px] font-bold text-ink tabular-nums">{formatSinglePrice(v.price)}</p>
        <Delta amount={Number(v.price) - price} />
      </div>
    </Link>
  );

  return (
    <div className={`grid gap-3 ${below && above ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
      {below && cell(below, "below")}

      <div className="flex min-w-0 flex-col justify-between rounded-xl border-2 border-ink bg-ink p-4 text-white">
        <div>
          <p className="text-[10.5px] font-black uppercase tracking-[0.12em] text-white/55">
            You are looking at
          </p>
          <p className="mt-2 truncate text-[14px] font-extrabold">
            {stripPrefix(current.variantName, carName)}
          </p>
        </div>
        <div className="mt-3">
          <p className="text-[13px] font-bold tabular-nums">{formatSinglePrice(current.price)}</p>
          <p className="mt-1 text-[11.5px] text-white/55">
            Trim {at + 1} of {ladder.length}, cheapest first
          </p>
        </div>
      </div>

      {above && cell(above, "above")}
    </div>
  );
}
