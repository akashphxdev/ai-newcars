"use client";
import Image from "next/image";
import SectionHeader from "@/components/common/SectionHeader";
import ScrollArrows from "@/components/common/ScrollArrows";
import { useScrollRail } from "@/components/common/useScrollRail";
import type { BodyType } from "@/features/bodyTypes/bodyType.types";

const DARK = "#111827";
const BORDER = "#e5e7eb";
const FALLBACK_ICON =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='16' fill='%23e5e7eb'/%3E%3C/svg%3E";

const BodyTypeCard = ({ bodyType }: { bodyType: BodyType }) => (
  <a
    href={`/new-cars/body-type/${bodyType.slug}`}
    className="flex w-38.75 shrink-0 flex-col items-center gap-3 rounded-2xl bg-surface p-4 text-center transition-colors hover:border-brand"
    style={{ border: `1px solid ${BORDER}` }}
  >
    <div className="relative size-14">
      <Image src={bodyType.iconUrl ?? FALLBACK_ICON} alt={bodyType.name} fill sizes="56px" className="object-contain" />
    </div>
    <span className="text-[13px] font-bold" style={{ color: DARK }}>
      {bodyType.name}
    </span>
  </a>
);

export default function BodyTypes({ bodyTypes }: { bodyTypes: BodyType[] }) {
  const { trackRef, canScrollLeft, canScrollRight, updateArrows, scrollBy } = useScrollRail<HTMLDivElement>();

  if (bodyTypes.length === 0) return null;

  return (
    <section style={{ background: "#fff" }} className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow="Find Your Fit"
          title="Search by category"
          subtitle="Browse new cars by body type — from compact hatchbacks to full-size SUVs"
          after={
            <ScrollArrows
              canScrollLeft={canScrollLeft}
              canScrollRight={canScrollRight}
              onLeft={() => scrollBy("left")}
              onRight={() => scrollBy("right")}
            />
          }
        />

        <div ref={trackRef} onScroll={updateArrows} className="scrollbar-none flex gap-6 overflow-x-auto pb-2">
          {bodyTypes.map((bodyType) => (
            <BodyTypeCard key={bodyType.id} bodyType={bodyType} />
          ))}
        </div>
      </div>
    </section>
  );
}
