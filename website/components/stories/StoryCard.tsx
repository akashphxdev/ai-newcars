import StoryMedia from "./StoryMedia";
import type { StoryGroup } from "@/features/stories/story.types";

const ORANGE = "#f2650f";

// Editorial card: one per group (not per item) — clicking it opens the
// group's own items in the viewer, starting from the first one. Shared by
// the home page rail (fixed width) and the /stories "view all" grid
// (fills its grid cell) — width is the caller's concern, not this card's.
export default function StoryCard({ group, onOpen, className = "" }: { group: StoryGroup; onOpen: () => void; className?: string }) {
  return (
    <article
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className={`group relative aspect-3/4 cursor-pointer overflow-hidden rounded-2xl text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${className}`}
      style={{ outlineColor: ORANGE }}
    >
      <StoryMedia
        mediaType={group.coverMediaType}
        mediaUrl={group.coverMediaUrl}
        alt={group.title}
        sizes="196px"
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/5" />

      <span className="absolute left-1/2 top-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="ml-0.5 size-4" fill={ORANGE}>
          <path d="M8 5.14v13.72c0 .53.6.85 1.05.56l10.6-6.86a.67.67 0 0 0 0-1.12L9.05 4.58A.67.67 0 0 0 8 5.14z" />
        </svg>
      </span>

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-4">
        <h3 className="line-clamp-2 text-[14px] font-black leading-snug text-white">{group.title}</h3>
        <p className="text-[10.5px] font-semibold text-white/60">
          {group.items.length} {group.items.length === 1 ? "story" : "stories"}
        </p>
      </div>
    </article>
  );
}
