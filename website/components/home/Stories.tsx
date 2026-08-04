"use client";
import { useState } from "react";
import SectionHeader from "@/components/common/SectionHeader";
import ScrollArrows from "@/components/common/ScrollArrows";
import { useScrollRail } from "@/components/common/useScrollRail";
import StoryCard from "@/components/stories/StoryCard";
import StoryViewer from "@/components/stories/StoryViewer";
import type { StoryGroup } from "@/features/stories/story.types";

export default function Stories({ groups }: { groups: StoryGroup[] }) {
  const [openGroupIndex, setOpenGroupIndex] = useState<number | null>(null);
  const { trackRef, canScrollLeft, canScrollRight, updateArrows, scrollBy } = useScrollRail<HTMLDivElement>();

  if (groups.length === 0) return null;

  return (
    <section className="bg-surface py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow="From The Newsroom"
          title="Stories"
          subtitle="Tap through news, road tests, and analysis in a minute"
          href="/stories"
          linkLabel="View all stories"
          after={
            <ScrollArrows
              canScrollLeft={canScrollLeft}
              canScrollRight={canScrollRight}
              onLeft={() => scrollBy("left")}
              onRight={() => scrollBy("right")}
            />
          }
        />

        <div ref={trackRef} onScroll={updateArrows} className="scrollbar-none flex gap-4 overflow-x-auto pb-2">
          {groups.map((group, i) => (
            <StoryCard key={group.id} group={group} onOpen={() => setOpenGroupIndex(i)} className="w-49 shrink-0" />
          ))}
        </div>
      </div>

      {openGroupIndex !== null && (
        <StoryViewer group={groups[openGroupIndex]} startIndex={0} onClose={() => setOpenGroupIndex(null)} />
      )}
    </section>
  );
}
