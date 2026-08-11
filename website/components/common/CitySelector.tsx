// components/common/CitySelector.tsx
//
// The header's city control. Resolution order, cheapest and least
// intrusive first:
//   1. A city the visitor already chose (localStorage) — wins silently.
//   2. GPS, only after an explicit tap. Never fired on page load: a
//      mis-tapped "Block" is sticky and costs the feature permanently.
//   3. Pick from the list.
//
// First-visit suggestion lives in CityPrompt, which asks in the middle of
// the screen — this control is for changing an answer, not collecting one.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PinIcon, SearchIcon } from "@/components/common/icons";
import { CITY_EVENT, getCurrentCity, saveCurrentCity } from "@/features/location/currentCity";
import { getLocationCities, reverseGeocode } from "@/features/location/location.api";
import type { LocationCity } from "@/features/location/location.types";

// City names repeat across states, so the state is what tells two
// Hyderabads apart. Only the slug reaches the client, so it is titled
// back for display rather than shipping a second field.
function stateLabel(slug?: string): string {
  if (!slug) return "";
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

// City-level accuracy is all this needs, so the cheap fix is fine and a
// 5-minute cached position is preferable to waking the GPS again.
const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10_000,
  maximumAge: 300_000,
};

export default function CitySelector({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const [city, setCity] = useState<LocationCity | null>(null);
  const [cities, setCities] = useState<LocationCity[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [locating, setLocating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCity(getCurrentCity());
    const sync = (e: Event) => setCity((e as CustomEvent<LocationCity>).detail);
    window.addEventListener(CITY_EVENT, sync);
    return () => window.removeEventListener(CITY_EVENT, sync);
  }, []);

  // Fetched on first open rather than on mount — most visits never touch
  // the picker, and this keeps it off the page-load path.
  const loadCities = useCallback(() => {
    if (cities.length) return;
    getLocationCities()
      .then(setCities)
      .catch(() => setNotice("Could not load cities."));
  }, [cities.length]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (next: LocationCity) => {
    saveCurrentCity(next);
    setOpen(false);
    setQuery("");
    setNotice(null);
  };

  const useMyLocation = () => {
    setNotice(null);
    if (!("geolocation" in navigator)) {
      setNotice("This browser can't share your location.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const hit = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
        if (hit?.city) {
          choose(hit.city);
          return;
        }
        // Recognised the place but we don't cover it — say which, so the
        // visitor knows the feature worked and picks a nearby city.
        setNotice(
          hit?.detected
            ? `We aren't in ${hit.detected} yet — pick a nearby city.`
            : "We couldn't work out your city.",
        );
        loadCities();
      },
      (err) => {
        setLocating(false);
        setNotice(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied — pick your city below."
            : "Couldn't get your location — pick your city below.",
        );
        loadCities();
      },
      GEO_OPTIONS,
    );
  };

  const q = query.trim().toLowerCase();
  const matches = (c: LocationCity) =>
    c.name.toLowerCase().includes(q) || (c.stateSlug ?? "").replace(/-/g, " ").includes(q);

  const shown = q ? cities.filter(matches) : cities;
  // Popular cities lead as a grid; a flat alphabetical list of 799 buried
  // Delhi and Mumbai below Jodhpur and made the control feel arbitrary.
  const popular = q ? [] : shown.filter((c) => c.isTopCity).slice(0, 12);
  const rest = q ? shown : shown.filter((c) => !c.isTopCity);

  const label = city?.name ?? "Select city";
  const isMobile = variant === "mobile";

  return (
    <div ref={boxRef} className={isMobile ? "relative w-full" : "relative shrink-0"}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          loadCities();
        }}
        aria-expanded={open}
        aria-label="Select your city"
        className={`flex cursor-pointer items-center gap-1 text-[13px] font-semibold text-ink ${
          isMobile ? "my-2 w-full py-2" : ""
        }`}
      >
        <span className="text-brand">
          <PinIcon />
        </span>
        {label}
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-2 w-[min(21rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_28px_70px_-28px_rgba(15,23,42,0.35)] ${
            isMobile ? "left-0" : "right-0"
          }`}
        >
          <div className="border-b border-border-soft bg-page px-4 py-3">
            <p className="text-[13.5px] font-bold text-ink">Choose your city</p>
            <p className="mt-0.5 text-[11.5px] leading-snug text-muted">
              Fuel prices and on-road costs change by city.
            </p>
          </div>

          <div className="p-3">
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-brand/30 bg-brand-soft px-3 py-2.5 text-[12.5px] font-bold text-brand transition-colors hover:bg-brand/10 disabled:opacity-60"
            >
              <PinIcon />
              {locating ? "Locating…" : "Use my current location"}
            </button>

            {notice && <p className="mt-2 text-[11px] leading-snug text-muted">{notice}</p>}

            <div className="mt-3 flex items-center gap-2 rounded-lg border border-border px-2.5 py-2 focus-within:border-brand">
              <span className="text-subtle">
                <SearchIcon />
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search 799 cities"
                className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-subtle"
              />
            </div>

            {popular.length > 0 && (
              <div className="mt-3">
                <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted">
                  Popular cities
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {popular.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => choose(c)}
                      className={`cursor-pointer truncate rounded-lg border px-2 py-2 text-[12px] font-semibold transition-colors ${
                        c.id === city?.id
                          ? "border-brand bg-brand-soft text-brand"
                          : "border-border text-ink hover:border-faint hover:bg-page"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3">
              {!q && rest.length > 0 && (
                <p className="mb-1 text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted">
                  All cities
                </p>
              )}
              <ul className="max-h-52 space-y-0.5 overflow-y-auto">
                {rest.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => choose(c)}
                      className={`flex w-full cursor-pointer items-baseline justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-page ${
                        c.id === city?.id ? "text-brand" : "text-ink"
                      }`}
                    >
                      <span className="truncate text-[13px] font-semibold">{c.name}</span>
                      <span className="shrink-0 text-[11px] text-muted">{stateLabel(c.stateSlug)}</span>
                    </button>
                  </li>
                ))}
                {cities.length > 0 && shown.length === 0 && (
                  <li className="px-2.5 py-3 text-center text-[12px] text-muted">
                    No city matches “{query}”.
                  </li>
                )}
                {cities.length === 0 && (
                  <li className="px-2.5 py-3 text-center text-[12px] text-muted">Loading cities…</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
