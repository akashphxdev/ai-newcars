// components/common/SectionSkeleton.tsx
//
// Suspense fallback for homepage sections — matches each section's real
// height (via minHeight) so content doesn't shift the page down once the
// real cards stream in (avoids a layout-shift/CLS hit).

const SURFACE = "#f4f5f9";

export default function SectionSkeleton({ minHeight = 360 }: { minHeight?: number }) {
  return (
    <section className="py-12 sm:py-16" style={{ background: SURFACE }} aria-hidden="true">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-7 h-7 w-56 animate-pulse rounded-lg bg-black/10" />
        <div
          className="flex gap-4 overflow-hidden"
          style={{ minHeight }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-full w-[280px] shrink-0 animate-pulse rounded-2xl bg-black/5"
              style={{ minHeight }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
