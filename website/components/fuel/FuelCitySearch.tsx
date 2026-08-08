"use client";

// Search across every city we hold a price for. The 798-entry index is
// ~55 KB, so it is fetched on first focus rather than shipped with the
// page — the landing page must not carry it just in case someone types.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PinIcon, SearchIcon } from "@/components/common/icons";
import { getFuelCityIndex } from "@/features/fuel/fuel.api";
import type { FuelCityIndexEntry } from "@/features/fuel/fuel.types";
import { CITY_EVENT, getCurrentCity } from "@/features/location/currentCity";
import type { LocationCity } from "@/features/location/location.types";
import { routes } from "@/lib/routes";

const MAX_RESULTS = 8;

// The price feed is district-based, so the name people type is often not
// the name we store. Without these, searching "Bangalore" or "Kochi" —
// two of the most common queries — returns nothing at all.
const ALIASES: Record<string, string> = {
  bangalore: "bengaluru",
  bombay: "mumbai",
  calcutta: "kolkata",
  madras: "chennai",
  cochin: "ernakulam",
  kochi: "ernakulam",
  trivandrum: "thiruvananthapuram",
  calicut: "kozhikode",
  mysore: "mysuru",
  pondicherry: "puducherry",
  gurgaon: "gurugram",
  baroda: "vadodara",
  poona: "pune",
  delhi: "new delhi",
};

// One shared copy per tab: the search appears on the landing page and in
// the city page's "change city" control, and they must not fetch twice.
let indexCache: FuelCityIndexEntry[] | null = null;
let indexRequest: Promise<FuelCityIndexEntry[]> | null = null;

function loadIndex(): Promise<FuelCityIndexEntry[]> {
  if (indexCache?.length) return Promise.resolve(indexCache);
  indexRequest ??= getFuelCityIndex().then((rows) => {
    // An empty result is a failure, not an answer — do not cache it, or
    // one blocked request disables search for the rest of the visit.
    if (rows.length > 0) indexCache = rows;
    indexRequest = null;
    return rows;
  });
  return indexRequest;
}

export default function FuelCitySearch({
  autoFocus = false,
  placeholder = "Search any city — Pune, Jaipur, Kochi…",
}: {
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cities, setCities] = useState<FuelCityIndexEntry[]>(indexCache ?? []);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [savedCity, setSavedCity] = useState<LocationCity | null>(null);
  const [failed, setFailed] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const read = () => setSavedCity(getCurrentCity());
    read();
    window.addEventListener(CITY_EVENT, read);
    return () => window.removeEventListener(CITY_EVENT, read);
  }, []);

  const ensureIndex = useCallback(() => {
    if (cities.length > 0 || loading) return;
    setLoading(true);
    setFailed(false);
    loadIndex()
      .then((rows) => {
        setCities(rows);
        setFailed(rows.length === 0);
      })
      .finally(() => setLoading(false));
  }, [cities.length, loading]);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const results = useMemo(() => {
    const typed = query.trim().toLowerCase();
    if (typed.length < 2) return [];
    // An alias only kicks in on a full match, so typing "ba" still
    // offers every city starting with those letters.
    const q = ALIASES[typed] ?? typed;
    // Prefix matches first — someone typing "kol" wants Kolkata, not
    // every city with "kol" buried in the middle.
    const starts: FuelCityIndexEntry[] = [];
    const contains: FuelCityIndexEntry[] = [];
    for (const city of cities) {
      const name = city.cityName.toLowerCase();
      if (name.startsWith(q)) starts.push(city);
      else if (name.includes(q) || city.stateName.toLowerCase().startsWith(q)) contains.push(city);
      if (starts.length >= MAX_RESULTS) break;
    }
    return [...starts, ...contains].slice(0, MAX_RESULTS);
  }, [cities, query]);

  function go(city: FuelCityIndexEntry) {
    setOpen(false);
    router.push(routes.fuelPriceInCity(city.stateSlug, city.citySlug));
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") return setOpen(false);
    if (results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(results[active]);
    }
  }

  const showPanel = open && query.trim().length >= 2;

  return (
    <div ref={boxRef} className="relative w-full">
      <label className="flex min-h-12 items-center gap-3 rounded-[7px] border border-border bg-surface px-4 shadow-[0_18px_48px_-38px_rgba(17,24,39,0.7)] transition focus-within:-translate-y-px focus-within:border-brand hover:border-faint">
        <SearchIcon className="size-5 shrink-0 text-muted" />
        <input
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls="fuel-city-results"
          aria-label="Search for a city"
          autoFocus={autoFocus}
          value={query}
          placeholder={placeholder}
          onFocus={() => { ensureIndex(); setOpen(true); }}
          onChange={(event) => {
            ensureIndex();
            setOpen(true);
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent text-[13.5px] text-ink outline-none placeholder:text-subtle"
        />
      </label>

      {showPanel && (
        <div
          id="fuel-city-results"
          role="listbox"
          className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-[7px] border border-border bg-surface shadow-[0_26px_72px_-36px_rgba(17,24,39,0.72)]"
        >
          {loading && cities.length === 0 ? (
            <p className="px-4 py-4 text-[12px] text-muted">Loading cities…</p>
          ) : failed ? (
            <p className="px-4 py-4 text-[12px] text-muted">
              Couldn&apos;t load the city list.{" "}
              <Link href={`${routes.fuelPrice()}#state-directory`} className="font-bold text-brand no-underline">
                Browse by state instead →
              </Link>
            </p>
          ) : results.length === 0 ? (
            <p className="px-4 py-4 text-[12px] text-muted">
              No city matches “{query.trim()}” among the {cities.length} cities we cover.
            </p>
          ) : (
            results.map((city, index) => (
              <button
                key={`${city.stateSlug}/${city.citySlug}`}
                type="button"
                role="option"
                aria-selected={index === active}
                onMouseEnter={() => setActive(index)}
                onClick={() => go(city)}
                className={`flex w-full cursor-pointer items-center gap-3 border-b border-border-soft px-4 py-3 text-left transition last:border-b-0 ${
                  index === active ? "bg-[#fff3eb]" : "hover:bg-page"
                }`}
              >
                <PinIcon className="size-4 shrink-0 text-muted" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold text-ink">{city.cityName}</span>
                  <span className="block truncate text-[10.5px] text-muted">{city.stateName}</span>
                </span>
                <span aria-hidden className="text-[11px] font-bold text-brand">→</span>
              </button>
            ))
          )}
        </div>
      )}

      {savedCity?.stateSlug && !showPanel && (
        <p className="mt-2.5 text-[11px] text-muted">
          Your city:{" "}
          <Link
            href={routes.fuelPriceInCity(savedCity.stateSlug, savedCity.slug)}
            className="font-bold text-brand no-underline hover:text-brand-hover"
          >
            {savedCity.name} →
          </Link>
        </p>
      )}
    </div>
  );
}
