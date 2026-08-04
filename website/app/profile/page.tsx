import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Profile | TimesAuto",
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-7xl flex-col items-center justify-center px-4 py-16 text-center">
      <span className="rounded-full border-[1.5px] border-brand px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-brand">
        Coming Soon
      </span>
      <h1 className="mt-5 font-head text-2xl font-extrabold text-ink sm:text-3xl">Your Profile</h1>
      <p className="mt-2 max-w-md text-[14px] leading-relaxed text-muted">
        We&apos;re building your profile page — saved cars, reviews, and lead history will all live here soon.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-xl border-[1.5px] border-brand px-5 py-2.5 text-[13px] font-bold text-brand transition-colors hover:bg-orange-50"
      >
        Back to Home
      </Link>
    </div>
  );
}
