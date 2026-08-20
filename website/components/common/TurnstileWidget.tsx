"use client";

// components/common/TurnstileWidget.tsx
//
// Cloudflare Turnstile, as a controlled input that hands its token up.
//
// Shared because it belongs on every public form, not just one. The
// script is loaded once per page no matter how many widgets render, and
// the token is single-use: Cloudflare rejects a replay, so a form that
// fails validation server-side must reset the widget before resubmitting
// — which is what `resetKey` is for.

import { useCallback, useEffect, useRef, useState } from "react";

const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Turnstile failed to load")));
      return;
    }
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Turnstile failed to load"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export default function TurnstileWidget({
  onToken,
  resetKey = 0,
  className,
}: {
  onToken: (token: string) => void;
  // Bump to force a fresh challenge after a rejected submit.
  resetKey?: number;
  className?: string;
}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [failed, setFailed] = useState(false);

  // Held in a ref so re-rendering the parent does not tear down and
  // re-render the challenge, which would make the user solve it twice.
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  const render = useCallback(() => {
    if (!containerRef.current || !window.turnstile || !siteKey) return;
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token: string) => onTokenRef.current(token),
      "expired-callback": () => onTokenRef.current(""),
      "error-callback": () => {
        onTokenRef.current("");
        setFailed(true);
      },
      theme: "light",
    });
  }, [siteKey]);

  useEffect(() => {
    if (!siteKey) return;
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (!cancelled) render();
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [render, siteKey]);

  useEffect(() => {
    if (resetKey > 0 && widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      onTokenRef.current("");
    }
  }, [resetKey]);

  // Without a site key the challenge cannot render, and the server will
  // reject every submission. Saying so beats an invisible dead form.
  if (!siteKey) {
    return (
      <p className={className} role="alert" style={{ fontSize: "0.8rem", color: "#B45309" }}>
        Security check is unavailable right now. Please try again later.
      </p>
    );
  }

  return (
    <div className={className}>
      <div ref={containerRef} />
      {failed && (
        <p role="alert" style={{ fontSize: "0.8rem", color: "#B45309", marginTop: "0.5rem" }}>
          The security check could not load. Refresh the page and try again.
        </p>
      )}
    </div>
  );
}
