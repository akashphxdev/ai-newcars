"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CloseIcon, CompareIcon } from "@/components/common/icons";
import { getVariantPowertrainOptions } from "@/features/compare/compare.api";
import { savePendingCompareSelection } from "@/features/compare/comparePendingSelection";
import { getTrayItems, removeFromTray, clearTray, subscribeTray, MAX_TRAY_ITEMS, type CompareTrayItem } from "@/features/compare/compareTray";

const MIN_TRAY_ITEMS = 2;

const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='10' fill='%23e5e7eb'/%3E%3C/svg%3E";

// Mounted once in the root layout (like DevLoadTimeBadge) so it persists
// across navigation — a visitor can queue variants from any car-model
// page's Variants list, then finish the comparison from wherever they end
// up. Renders nothing until something's actually queued.
export default function CompareTray() {
  const router = useRouter();
  const [items, setItems] = useState<CompareTrayItem[]>([]);
  // Tracks the item count at the moment of dismissal, not a plain
  // boolean — so "re-show once something new is added" is a derived
  // comparison during render, not a separate effect resetting state.
  const [dismissedAtCount, setDismissedAtCount] = useState<number | null>(null);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    const sync = () => setItems(getTrayItems());
    sync();
    return subscribeTray(sync);
  }, []);

  const isDismissed = dismissedAtCount !== null && items.length <= dismissedAtCount;
  if (items.length === 0 || isDismissed) return null;

  const handleCompareNow = async () => {
    if (items.length < MIN_TRAY_ITEMS || comparing) return;
    setComparing(true);
    try {
      const powertrainIds = await Promise.all(
        items.map(async (item) => {
          const powertrains = await getVariantPowertrainOptions(item.modelSlug, item.variantId);
          return powertrains.find((p) => p.isDefault)?.id ?? powertrains[0]?.id;
        }),
      );

      const slugPath = items.map((i) => i.modelSlug).join("-vs-");
      savePendingCompareSelection({
        slugPath,
        variantIds: items.map((i) => i.variantId),
        powertrainIds,
      });
      clearTray();
      router.push(`/compare/${slugPath}`);
    } finally {
      setComparing(false);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
        <p className="shrink-0 text-[13.5px] font-extrabold text-ink">
          My Comparison <span className="font-medium text-muted">({items.length}/{MAX_TRAY_ITEMS})</span>
        </p>

        <div className="flex flex-1 flex-wrap items-center gap-2">
          {items.map((item) => (
            <div key={item.variantId} className="relative flex items-center gap-2 rounded-xl border border-border bg-surface py-1 pl-1 pr-3">
              <div className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-page">
                <Image src={item.imageUrl ?? FALLBACK_IMG} alt={item.carName} fill sizes="36px" className="object-cover" />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="max-w-32 truncate text-[12px] font-semibold text-ink">{item.carName}</span>
                {/* Same model can appear twice with different variants —
                    the variant name is what tells those two apart. */}
                <span className="max-w-32 truncate text-[10px] text-muted">{item.variantName}</span>
              </div>
              <button
                type="button"
                onClick={() => removeFromTray(item.variantId)}
                aria-label={`Remove ${item.carName} ${item.variantName}`}
                className="flex size-4 shrink-0 cursor-pointer items-center justify-center text-muted hover:text-brand"
              >
                <CloseIcon className="size-3" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleCompareNow}
          disabled={items.length < MIN_TRAY_ITEMS || comparing}
          className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-brand px-5 py-2.5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CompareIcon className="size-4" />
          {comparing ? "Loading…" : `Compare Now${items.length >= MIN_TRAY_ITEMS ? ` (${items.length})` : ""}`}
        </button>

        <button
          type="button"
          onClick={() => setDismissedAtCount(items.length)}
          aria-label="Dismiss comparison tray"
          className="flex shrink-0 cursor-pointer items-center justify-center text-muted hover:text-brand"
        >
          <CloseIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}
