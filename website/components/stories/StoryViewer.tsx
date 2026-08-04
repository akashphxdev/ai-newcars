"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import StoryMedia from "./StoryMedia";
import { CloseIcon } from "@/components/common/icons";
import type { StoryGroup } from "@/features/stories/story.types";

const ORANGE = "#f2650f";
const SLIDE_MS = 6000;

// Full-screen viewer — pages through ONLY this group's items (never
// crosses into another group), and the ambient background collage is
// built from this same group's neighbouring items. Shared by the home
// page rail and the /stories "view all" grid.
export default function StoryViewer({ group, startIndex, onClose }: { group: StoryGroup; startIndex: number; onClose: () => void }) {
  const [index, setIndex] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const items = group.items;
  const item = items[index];
  const isVideo = item.mediaType === "video";

  const goTo = (next: number) => {
    if (next < 0) return;
    if (next >= items.length) {
      onClose();
      return;
    }
    setIndex(next);
    setProgress(0);
    startRef.current = Date.now();
  };

  useEffect(() => {
    startRef.current = Date.now();
  }, []);

  // Image items: fixed-duration timer drives both the progress bar and
  // auto-advance, same as before.
  useEffect(() => {
    if (isVideo || paused) return;
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min(100, (elapsed / SLIDE_MS) * 100);
      setProgress(pct);
      if (pct >= 100) {
        goTo(index + 1);
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, paused, isVideo]);

  // Video items: the video's own playback drives the progress bar, and it
  // only advances once the video actually finishes — never a fixed timer.
  useEffect(() => {
    if (!isVideo) return;
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      if (video.duration) setProgress((video.currentTime / video.duration) * 100);
    };
    const onEnded = () => goTo(index + 1);

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);
    if (paused) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, isVideo, paused]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goTo(index - 1);
      if (e.key === "ArrowRight") goTo(index + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black p-0 sm:p-4">
      <div
        className="relative h-full w-full max-w-md overflow-hidden bg-ink sm:h-[88vh] sm:rounded-2xl"
        onMouseDown={() => setPaused(true)}
        onMouseUp={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        {/* ambient background — this group's current item only, no blur.
            Muted/looping decorative copy (StoryMedia); the actual tracked
            playback (onEnded/progress) happens on the sharp card below. */}
        <div className="absolute inset-0">
          <StoryMedia mediaType={item.mediaType} mediaUrl={item.mediaUrl} alt="" sizes="400px" className="absolute inset-0 size-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/50" />

        {/* prev / next tap zones, sit under the header so the close button stays clickable */}
        <button aria-label="Previous story" className="absolute inset-y-0 left-0 z-10 w-1/3" onClick={() => goTo(index - 1)} />
        <button aria-label="Next story" className="absolute inset-y-0 right-0 z-10 w-1/3" onClick={() => goTo(index + 1)} />

        {/* header: progress + close, always on top and clickable */}
        <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex gap-1.5">
          {items.map((_, i) => (
            <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full"
                style={{
                  width: i < index ? "100%" : i === index ? `${progress}%` : "0%",
                  transition: i === index ? "none" : "width 150ms linear",
                  background: ORANGE,
                }}
              />
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="pointer-events-auto absolute right-3 top-7 z-20 rounded-full bg-black/30 p-1.5 text-white/90 backdrop-blur-sm transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ outlineColor: ORANGE }}
          aria-label="Close"
        >
          <CloseIcon />
        </button>

        {/* the story itself: a sharp card floating over the ambient
            background, with the title and this item's description
            underneath it. This is also the element that actually drives
            playback (ref/onEnded/progress). */}
        <div className="pointer-events-none relative z-10 flex h-full flex-col items-center justify-center gap-5 px-6 pt-10">
          <div className="relative w-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/15" style={{ maxHeight: "48vh", aspectRatio: "4/3" }}>
            {isVideo ? (
              <video key={item.id} ref={videoRef} src={item.mediaUrl} playsInline className="size-full object-cover" />
            ) : (
              <Image src={item.mediaUrl} alt={group.title} fill sizes="400px" className="object-cover" />
            )}
          </div>

          <div className="flex w-full flex-col gap-2 text-center">
            <h2 className="text-xl font-black leading-tight text-white">{group.title}</h2>
            {item.description && <p className="mx-auto max-w-[32ch] text-sm leading-relaxed text-white/75">{item.description}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
