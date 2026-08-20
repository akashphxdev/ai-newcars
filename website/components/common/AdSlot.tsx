// components/common/AdSlot.tsx
//
// A booked placement, filled either by the in-house ad server or by a
// third-party network tag.
//
// The slot reserves its height whether or not an ad arrives — an empty
// slot that collapses would shift the page the day one is sold, and most
// placements are unsold most of the time.
//
// The impression is recorded when the creative is actually on screen, not
// when it is fetched: a slot three screens below the fold that nobody
// scrolled to was never seen, and billing an advertiser for it would be
// counting the wrong thing.
//
// A network tag is injected rather than rendered. React's JSX and
// dangerouslySetInnerHTML both refuse to execute <script>, so the element
// has to be built by hand — and because that script then runs with the
// same reach over the page as our own code, it is not injected until the
// slot is nearly in view. Nothing is fetched for a slot nobody reaches.

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { getAd, recordClick, recordImpression, type ServedAd } from "@/features/ads/ad.api";
import { getUploadUrl } from "@/lib/apiClient";

// "300x250" -> [300, 250]. A malformed value falls back to the common
// rectangle rather than rendering a zero-sized image.
function sizeOf(dimensions: string): [number, number] {
  const [w, h] = dimensions.split("x").map((n) => Number(n.trim()));
  return Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0 ? [w, h] : [300, 250];
}

export default function AdSlot({
  placement,
  id,
  className = "",
}: {
  // The placement's slug in the admin panel — this is what is booked.
  placement: string;
  // Where on the site this slot sits. Kept for the data attribute so a
  // slot can be found in the DOM without guessing at its placement.
  id: string;
  className?: string;
}) {
  const [ad, setAd] = useState<ServedAd | null>(null);
  const impressionId = useRef<number | null>(null);
  const seen = useRef(false);
  const injected = useRef(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    getAd(placement).then((hit) => {
      if (alive) setAd(hit);
    });
    return () => {
      alive = false;
    };
  }, [placement]);

  useEffect(() => {
    if (!ad || !box.current || seen.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || seen.current) continue;
          // Once only: a reader scrolling past twice saw one ad.
          seen.current = true;
          observer.disconnect();
          recordImpression(ad).then((id) => {
            impressionId.current = id;
          });
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(box.current);
    return () => observer.disconnect();
  }, [ad]);

  // Injected a screen early, so the network has time to fill before the
  // reader arrives — a tag that starts loading at the moment the slot
  // becomes visible shows an empty box for as long as it takes.
  useEffect(() => {
    const scriptSrc = ad?.scriptSrc;
    if (ad?.creativeType !== "script" || !scriptSrc || !box.current || injected.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || injected.current) continue;
          injected.current = true;
          observer.disconnect();

          const script = document.createElement("script");
          for (const [name, value] of Object.entries(ad.scriptAttrs ?? {})) {
            // The server strips these already; not trusting that twice
            // costs one comparison.
            if (!/^on/i.test(name)) script.setAttribute(name, value);
          }
          script.src = scriptSrc;
          script.async = true;
          box.current?.appendChild(script);
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(box.current);
    return () => observer.disconnect();
  }, [ad]);

  const [width, height] = ad ? sizeOf(ad.dimensions) : [300, 250];
  const src = getUploadUrl(ad?.imageUrl);

  // The network writes its own creative into this box, so there is
  // nothing of ours to render inside it — only the reserved space and the
  // label that has to appear whether or not the tag fills.
  if (ad?.creativeType === "script") {
    return (
      <div ref={box} data-ad-slot={id} data-ad-campaign={ad.campaignId} className={className}>
        <div style={{ minHeight: height }} />
        <p className="mt-1 text-center text-[10px] uppercase tracking-[0.12em] text-subtle">Advertisement</p>
      </div>
    );
  }

  if (!ad || !src) {
    return (
      <div
        ref={box}
        data-ad-slot={id}
        className={`flex min-h-[250px] items-center justify-center rounded-xl border border-dashed border-border bg-page ${className}`}
      >
        <span className="text-[11px] uppercase tracking-[0.12em] text-subtle">Advertisement</span>
      </div>
    );
  }

  return (
    <div ref={box} data-ad-slot={id} data-ad-campaign={ad.campaignId} className={className}>
      <a
        href={ad.targetUrl}
        target="_blank"
        rel="noopener sponsored"
        onClick={() => recordClick(ad, impressionId.current)}
        className="block overflow-hidden rounded-xl border border-border no-underline"
      >
        <Image
          src={src}
          alt={ad.name}
          width={width}
          height={height}
          sizes={`${width}px`}
          className="h-auto w-full"
        />
      </a>
      <p className="mt-1 text-center text-[10px] uppercase tracking-[0.12em] text-subtle">Advertisement</p>
    </div>
  );
}
