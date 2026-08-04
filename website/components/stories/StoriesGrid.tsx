"use client";
import { useState } from "react";
import StoryCard from "./StoryCard";
import StoryViewer from "./StoryViewer";
import type { StoryGroup } from "@/features/stories/story.types";

// Grid layout for the /stories "view all" page — same StoryCard/StoryViewer
// the home page rail uses, just arranged in a wrapping grid instead of a
// horizontal scroll rail.
export default function StoriesGrid({ groups }: { groups: StoryGroup[] }) {
  const [openGroupIndex, setOpenGroupIndex] = useState<number | null>(null);

  if (groups.length === 0) {
    return <p className="rounded-2xl border border-border bg-surface p-8 text-center text-muted">No stories right now — check back soon.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {groups.map((group, i) => (
          <StoryCard key={group.id} group={group} onOpen={() => setOpenGroupIndex(i)} />
        ))}
      </div>

      {openGroupIndex !== null && (
        <StoryViewer group={groups[openGroupIndex]} startIndex={0} onClose={() => setOpenGroupIndex(null)} />
      )}
    </>
  );
}
