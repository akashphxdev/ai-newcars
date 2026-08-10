// components/common/ShareButton.tsx
//
// The share control that actually shares. Native share sheet where the
// browser has one (phones), clipboard with a brief "Copied" state
// everywhere else — a visibly interactive control that does nothing
// erodes trust in every button around it.

"use client";

import { useRef, useState } from "react";
import { ShareIcon, CheckIcon } from "@/components/common/icons";

export default function ShareButton({
  title,
  label,
  className,
  iconClassName = "size-3.5",
}: {
  title: string;
  // With a label the copied state swaps the text; icon-only buttons swap
  // the icon for a check instead.
  label?: string;
  className?: string;
  iconClassName?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      // A dismissed share sheet rejects; that is a choice, not an error.
      try {
        await navigator.share({ title, url });
      } catch {}
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <button type="button" onClick={share} aria-label={label ?? "Share"} className={className}>
      {copied ? <CheckIcon className={`${iconClassName} text-ev`} /> : <ShareIcon className={iconClassName} />}
      {label && (copied ? "Copied" : label)}
    </button>
  );
}
