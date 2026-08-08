"use client";

import { useState } from "react";
import { BellIcon, ShareIcon } from "@/components/common/icons";
import type { FuelName, FuelPoint } from "@/features/fuel/fuel.types";

export default function FuelCityActions({
  city,
  state,
  prices,
}: {
  city: string;
  state: string;
  prices: Partial<Record<FuelName, FuelPoint>>;
}) {
  const [alertsOn, setAlertsOn] = useState(false);
  const [status, setStatus] = useState("");

  async function share() {
    const shareData = {
      title: `Fuel prices in ${city}`,
      text: `Latest petrol, diesel and CNG prices in ${city}, ${state}.`,
      url: window.location.href,
    };
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
    await navigator.clipboard.writeText(window.location.href);
    setStatus("Link copied");
  }

  function download() {
    const rows = [
      ["Fuel", "Price", "Change", "Updated"],
      ...(["petrol", "diesel", "cng"] as FuelName[])
        .filter((fuel) => prices[fuel])
        .map((fuel) => [fuel, prices[fuel]!.price, prices[fuel]!.change, prices[fuel]!.updatedOn]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${city.toLowerCase().replaceAll(" ", "-")}-fuel-prices.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Report downloaded");
  }

  return (
    <div id="fuel-alert" className="flex flex-wrap items-center gap-2.5">
      <button type="button" onClick={share} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-[6px] border border-border bg-surface px-4 text-[11px] font-bold text-ink hover:bg-page">
        <ShareIcon className="size-4" /> Share
      </button>
      <button type="button" onClick={download} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-[6px] border border-border bg-surface px-4 text-[11px] font-bold text-ink hover:bg-page">
        <span className="text-base leading-none">↓</span> Download report
      </button>
      <button type="button" aria-pressed={alertsOn} onClick={() => { setAlertsOn((current) => !current); setStatus(alertsOn ? "Alert removed" : "Price alert enabled"); }} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-[6px] bg-brand px-4 text-[11px] font-bold text-white transition-colors hover:bg-brand-hover">
        <BellIcon className="size-4" /> {alertsOn ? "Alert enabled" : "Set price alert"}
      </button>
      <span aria-live="polite" className="min-w-20 text-[10px] font-semibold text-ev">{status}</span>
    </div>
  );
}
