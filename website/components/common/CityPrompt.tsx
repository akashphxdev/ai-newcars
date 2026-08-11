// components/common/CityPrompt.tsx
//
// The first-visit question: which city are you in?
//
// Nearly everything priced on this site — on-road cost, road tax, fuel,
// running cost — is answered per city, and a visitor with no city set
// sees "pick your city" placeholders in place of the numbers they came
// for. The header's control alone was too quiet to fix that: it is one
// small label competing with a nav bar, and on mobile it sits inside a
// closed drawer.
//
// So this asks once, in the middle of the screen, and never again after
// it is answered or dismissed. Cloudflare's IP hint pre-fills the answer
// when the edge sends one, which turns the question into a single tap;
// without it the same modal offers the picker instead of guessing.
//
// GPS is offered but never fired on load — a mis-tapped "Block" is sticky
// and costs the feature permanently.

"use client";

import { useEffect, useState } from "react";
import { PinIcon, CloseIcon, ChevronIcon } from "@/components/common/icons";
import {
  dismissCityPrompt,
  getCurrentCity,
  isCityPromptDismissed,
  saveCurrentCity,
} from "@/features/location/currentCity";
import { detectCityFromIp, getLocationCities, reverseGeocode } from "@/features/location/location.api";
import type { LocationCity } from "@/features/location/location.types";

const GEO_OPTIONS: PositionOptions = { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 };

export default function CityPrompt() {
  const [open, setOpen] = useState(false);
  const [suggested, setSuggested] = useState<LocationCity | null>(null);
  const [cities, setCities] = useState<LocationCity[]>([]);
  const [picking, setPicking] = useState(false);
  const [locating, setLocating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (getCurrentCity() || isCityPromptDismissed()) return;
    let alive = true;

    // The hint is a nicety, not a gate: the modal opens either way, so a
    // visitor whose edge sends no city still gets asked.
    detectCityFromIp().then((hit) => {
      if (!alive) return;
      if (hit?.city) setSuggested(hit.city);
      else setPicking(true);
      setOpen(true);
    });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!picking || cities.length) return;
    getLocationCities()
      .then(setCities)
      .catch(() => setNotice("Could not load cities."));
  }, [picking, cities.length]);

  // Escape dismisses, like any modal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() {
    dismissCityPrompt();
    setOpen(false);
  }

  function choose(city: LocationCity) {
    saveCurrentCity(city);
    setOpen(false);
  }

  function useExactLocation() {
    setNotice(null);
    if (!("geolocation" in navigator)) {
      setNotice("This browser can't share your location.");
      setPicking(true);
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
        setNotice(hit?.detected ? `We aren't in ${hit.detected} yet — pick a nearby city.` : "We couldn't work out your city.");
        setPicking(true);
      },
      (err) => {
        setLocating(false);
        setNotice(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied — pick your city below."
            : "Couldn't get your location — pick your city below.",
        );
        setPicking(true);
      },
      GEO_OPTIONS,
    );
  }

  if (!open) return null;

  const popular = cities.filter((c) => c.isTopCity).slice(0, 12);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Dismissing by backdrop counts as an answer of "not now" — the
          prompt should not reappear on the next page view. */}
      <button
        type="button"
        aria-label="Close"
        onClick={close}
        className="absolute inset-0 cursor-default bg-ink/25 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="city-prompt-title"
        className="relative w-full max-w-[27rem] overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_30px_80px_-20px_rgba(15,23,42,0.45)]"
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-page hover:text-ink"
        >
          <CloseIcon className="size-4" />
        </button>

        <div className="flex gap-4 p-5 sm:p-6">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <PinIcon className="size-5" />
          </span>

          <div className="min-w-0 flex-1 pr-6">
            {!picking && suggested ? (
              <>
                <h2 id="city-prompt-title" className="text-[17px] font-extrabold leading-tight text-ink">
                  Are you in {suggested.name}?
                </h2>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                  We&apos;ll show on-road prices, fuel rates and running costs for your city. You can change it
                  anytime from the header.
                </p>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => choose(suggested)}
                    className="flex-1 cursor-pointer rounded-xl bg-brand px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-brand-hover"
                  >
                    Yes, {suggested.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPicking(true)}
                    className="flex-1 cursor-pointer rounded-xl border border-border px-4 py-2.5 text-[13px] font-bold text-ink transition-colors hover:border-brand hover:text-brand"
                  >
                    No, change
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 id="city-prompt-title" className="text-[17px] font-extrabold leading-tight text-ink">
                  Which city are you in?
                </h2>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                  On-road price, road tax and fuel rates all change by city.
                </p>

                {notice && <p className="mt-2.5 text-[11.5px] leading-snug text-muted">{notice}</p>}

                {popular.length > 0 ? (
                  <div className="mt-4 grid grid-cols-3 gap-1.5">
                    {popular.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => choose(c)}
                        className="cursor-pointer truncate rounded-lg border border-border px-2 py-2 text-[12px] font-semibold text-ink transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-[12.5px] text-muted">Loading cities…</p>
                )}

                <button
                  type="button"
                  onClick={close}
                  className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1 text-[12.5px] font-bold text-brand transition-colors hover:text-brand-hover"
                >
                  Choose from all cities in the header
                  <ChevronIcon className="size-3" />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={useExactLocation}
              disabled={locating}
              className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 border-t border-border-soft pt-3 text-[12.5px] font-semibold text-muted transition-colors hover:text-brand disabled:opacity-60"
            >
              <PinIcon className="size-3.5" />
              {locating ? "Locating…" : "Use my exact location instead"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
