"use client";
import { useRef, useState, useEffect, useCallback } from "react";

type CarSide = {
  brand: string;
  name: string;
  price: string;
  img: string;
  slug: string;
};

type Pair = {
  id: string;
  left: CarSide;
  right: CarSide;
};

const PAIRS: Pair[] = [
  {
    id: "sierra-nexon",
    left: {
      brand: "Tata",
      name: "Sierra",
      price: "₹14.99 - 19.99 Lakh",
      img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Tata/Sierra/12271/1765181428462/front-left-side-47.jpg?tr=w-300",
      slug: "tata-sierra",
    },
    right: {
      brand: "Tata",
      name: "Nexon",
      price: "₹8.10 - 15.60 Lakh",
      img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Tata/Nexon/11115/1779101151711/front-left-side-47.jpg?tr=w-300",
      slug: "tata-nexon",
    },
  },
  {
    id: "scorpion-thar",
    left: {
      brand: "Mahindra",
      name: "Scorpio-N",
      price: "₹13.65 - 24.60 Lakh",
      img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Mahindra/Scorpio-N/10818/1755775730308/front-left-side-47.jpg?tr=w-300",
      slug: "mahindra-scorpio-n",
    },
    right: {
      brand: "Mahindra",
      name: "Thar Roxx",
      price: "₹12.99 - 22.49 Lakh",
      img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Mahindra/Thar/12264/1776055307473/front-left-side-47.jpg?tr=w-300",
      slug: "mahindra-thar-roxx",
    },
  },
  {
    id: "evitara-punchev",
    left: {
      brand: "Maruti Suzuki",
      name: "e-Vitara",
      price: "₹17.00 - 24.00 Lakh",
      img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Maruti/e-Vitara/13326/1771560398854/front-left-side-47.jpg?tr=w-300",
      slug: "maruti-suzuki-e-vitara",
    },
    right: {
      brand: "Tata",
      name: "Punch EV",
      price: "₹10.99 - 15.49 Lakh",
      img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Tata/Punch-EV/13330/1772693950592/front-left-side-47.jpg?tr=w-300",
      slug: "tata-punch-ev",
    },
  },
  {
    id: "brezza-duster",
    left: {
      brand: "Maruti Suzuki",
      name: "Brezza",
      price: "₹8.34 - 14.14 Lakh",
      img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Maruti/Brezza/10400/1770885013083/front-left-side-47.jpg?tr=w-300",
      slug: "maruti-suzuki-brezza",
    },
    right: {
      brand: "Renault",
      name: "Duster",
      price: "₹9.99 - 17.49 Lakh",
      img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Renault/Duster/9674/1774331005907/front-left-side-47.jpg?tr=w-300",
      slug: "renault-duster",
    },
  },
  {
    id: "punch-fronx",
    left: {
      brand: "Tata",
      name: "Punch",
      price: "₹6.00 - 10.20 Lakh",
      img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Tata/Punch/13243/1768986024623/front-left-side-47.jpg?tr=w-300",
      slug: "tata-punch",
    },
    right: {
      brand: "Maruti Suzuki",
      name: "Fronx",
      price: "₹7.51 - 13.06 Lakh",
      img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Maruti/FRONX/9916/1771931850505/front-left-side-47.jpg?tr=w-300",
      slug: "maruti-suzuki-fronx",
    },
  },
];

const ORANGE = "#f2650f";
const DARK = "#111827";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";
const SURFACE = "#f4f5f9";
const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='225' viewBox='0 0 300 225'%3E%3Crect width='300' height='225' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='13' fill='%239ca3af'%3EImage unavailable%3C/text%3E%3C/svg%3E";

const ChevronIcon = ({ dir = "right" }: { dir?: "left" | "right" }) => (
  <svg
    className="size-3.5"
    viewBox="0 0 12 12"
    fill="none"
    style={{ transform: dir === "left" ? "rotate(180deg)" : "none" }}
  >
    <path d="M2 6h8M8 2l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CarSideBlock = ({ car }: { car: CarSide }) => (
  <div className="flex-1 min-w-0">
    <p className="truncate text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
      {car.brand}
    </p>
    <p className="truncate text-[13.5px] font-bold" style={{ color: DARK }}>
      {car.name}
    </p>
    <p className="mt-0.5 text-[12px] font-bold" style={{ color: DARK }}>
      {car.price}
      <span className="ml-0.5 align-top text-[9px]" style={{ color: MUTED }}>
        *
      </span>
    </p>
  </div>
);

const CarImage = ({ car }: { car: CarSide }) => {
  const [src, setSrc] = useState(car.img);
  return (
    <img
      src={src}
      alt={car.brand + " " + car.name}
      loading="lazy"
      onError={() => setSrc(FALLBACK_IMG)}
      className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
    />
  );
};

const Card = ({ pair }: { pair: Pair }) => (
  <article
    className="group flex h-full w-[300px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-white transition-all duration-300 hover:-translate-y-1 motion-reduce:hover:translate-y-0"
    style={{ border: "1px solid " + BORDER, boxShadow: "0 1px 2px rgba(17,24,39,0.04)" }}
    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 14px 30px rgba(17,24,39,0.12)")}
    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 1px 2px rgba(17,24,39,0.04)")}
  >
    <div className="relative flex" style={{ background: SURFACE }}>
      <div className="aspect-[4/3] w-1/2 overflow-hidden">
        <CarImage car={pair.left} />
      </div>
      <div className="aspect-[4/3] w-1/2 overflow-hidden">
        <CarImage car={pair.right} />
      </div>

      <span
        className="absolute left-1/2 top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[11.5px] font-extrabold"
        style={{ color: ORANGE, border: "1px solid " + ORANGE, background: "#f3f4f6" }}
      >
        VS
      </span>
    </div>

    <div className="flex items-start gap-3 px-4 pt-4">
      <CarSideBlock car={pair.left} />
      <div className="mt-1 h-10 w-px shrink-0" style={{ background: "#f0f1f4" }} />
      <CarSideBlock car={pair.right} />
    </div>

    <div className="mt-auto px-4 pb-4 pt-3.5">
      <a
        href={`/compare/${pair.left.slug}-vs-${pair.right.slug}`}
        className="flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-xl py-2.5 text-[12.5px] font-bold transition-colors hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ border: `1.5px solid ${ORANGE}`, color: ORANGE, outlineColor: ORANGE }}
      >
        Compare {pair.left.name} vs {pair.right.name}
      </a>
    </div>
  </article>
);

export default function CompareCars() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = trackRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    window.addEventListener("resize", updateArrows);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows]);

  const scrollBy = (dir: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section className="font-body py-12 sm:py-16" style={{ background: SURFACE }}>
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: ORANGE }}>
              Decide Faster
            </p>
            <h2 className="font-head text-2xl sm:text-[28px] font-bold tracking-tight" style={{ color: DARK }}>
              Compare to buy the right car
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/compare"
              className="inline-flex items-center gap-1.5 text-[12.5px] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded"
              style={{ color: DARK, outlineColor: ORANGE }}
            >
              View all comparisons
              <ChevronIcon />
            </a>
            <div className="hidden items-center gap-1.5 sm:flex">
              <button
                type="button"
                aria-label="Scroll left"
                onClick={() => scrollBy("left")}
                disabled={!canScrollLeft}
                className="flex size-8 items-center justify-center rounded-full bg-white transition-colors disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ border: "1px solid " + BORDER, color: DARK, outlineColor: ORANGE }}
              >
                <ChevronIcon dir="left" />
              </button>
              <button
                type="button"
                aria-label="Scroll right"
                onClick={() => scrollBy("right")}
                disabled={!canScrollRight}
                className="flex size-8 items-center justify-center rounded-full bg-white transition-colors disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ border: "1px solid " + BORDER, color: DARK, outlineColor: ORANGE }}
              >
                <ChevronIcon />
              </button>
            </div>
          </div>
        </div>

        <div className="relative">
          {/* edge fades hint that the row scrolls, especially useful on mobile where arrows are hidden */}
          <div
            className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-8 transition-opacity duration-200 ${canScrollLeft ? "opacity-100" : "opacity-0"}`}
            style={{ background: `linear-gradient(to right, ${SURFACE}, transparent)` }}
          />
          <div
            className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-8 transition-opacity duration-200 ${canScrollRight ? "opacity-100" : "opacity-0"}`}
            style={{ background: `linear-gradient(to left, ${SURFACE}, transparent)` }}
          />

          <div
            ref={trackRef}
            onScroll={updateArrows}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {PAIRS.map((pair) => (
              <Card key={pair.id} pair={pair} />
            ))}
          </div>
        </div>

        <p className="mt-3 text-[11px]" style={{ color: MUTED }}>
          *Ex-showroom price, New Delhi
        </p>
      </div>
    </section>
  );
}