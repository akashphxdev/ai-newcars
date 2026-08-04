import type { Metadata } from "next";
import Link from "next/link";
import { getHomeStories } from "@/features/stories/story.api";
import StoriesGrid from "@/components/stories/StoriesGrid";

export const metadata: Metadata = {
  title: "Stories | TimesAuto",
  description: "Tap through the latest news, road tests, and analysis from the TimesAuto newsroom.",
};

export default async function StoriesPage() {
  const groups = await getHomeStories(30);

  return (
    <div>
      <div className="border-b border-border bg-page">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
          <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-[13px] font-semibold" aria-label="Breadcrumb">
            <Link href="/" className="text-ink">
              Home
            </Link>
            <span className="text-muted">{">"}</span>
            <span className="text-brand">Stories</span>
          </nav>

          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">Stories</h1>
          <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed font-normal text-muted">
            Tap through news, road tests, and analysis in a minute — from the TimesAuto newsroom.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <StoriesGrid groups={groups} />
      </div>
    </div>
  );
}
