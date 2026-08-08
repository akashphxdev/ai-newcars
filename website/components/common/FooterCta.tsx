// components/common/FooterCta.tsx
//
// The dark band above the footer. Separate from Footer because Footer is
// already a 378-line server component assembling site settings, body
// types and article categories; this needs none of that and reads better
// as its own piece than as a fifth section inside it.

import Image from "next/image";
import Link from "next/link";
import { ShieldIcon, TagIcon, LockIcon } from "@/components/common/icons";
import { routes } from "@/lib/routes";

// Three, not the design's four. The fourth was "10M+ users every month",
// which is a traffic claim nobody has verified — the others are all
// statements about the product itself and are true today.
const ASSURANCES = [
  { icon: <ShieldIcon className="size-5" />, title: "Expert reviews", sub: "you can trust" },
  { icon: <TagIcon className="size-5" />, title: "Best prices", sub: "& offers" },
  { icon: <LockIcon className="size-5" />, title: "Secure & private", sub: "experience" },
];

export default function FooterCta() {
  return (
    <section className="relative isolate overflow-hidden bg-ink">
      <Image
        src="/design/footer-night-road.png"
        alt=""
        fill
        sizes="100vw"
        className="pointer-events-none object-cover object-right"
      />
      {/* The headline sits on the left, where the photograph is darkest;
          this keeps it legible without flattening the road on the right. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(9,11,16,0.96)_0%,rgba(9,11,16,0.86)_38%,rgba(9,11,16,0.25)_72%,transparent_100%)]"
      />

      <div className="relative mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12 lg:py-14">
        <h2 className="max-w-xl text-balance font-head text-[27px] font-extrabold leading-[1.07] tracking-[-0.03em] text-white sm:text-[33px] lg:text-[38px]">
          Ready to shortlist your next car?
        </h2>
        <p className="mt-2.5 max-w-lg text-[14px] leading-6 text-white/70 sm:text-[15px]">
          Compare prices, ownership costs, offers, and reviews before you visit the showroom.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={routes.newCars()}
            className="inline-flex min-h-11 items-center gap-2.5 rounded-[7px] bg-brand px-5 text-[13.5px] font-bold text-white no-underline transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-0"
          >
            Start searching <span aria-hidden>→</span>
          </Link>
          <Link
            href={routes.compare()}
            className="inline-flex min-h-11 items-center gap-2.5 rounded-[7px] border border-white/35 px-5 text-[13.5px] font-bold text-white no-underline transition-colors hover:border-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Compare cars <span aria-hidden>→</span>
          </Link>
        </div>

        <ul className="mt-8 flex flex-wrap items-center gap-x-9 gap-y-4">
          {ASSURANCES.map((a) => (
            <li key={a.title} className="flex items-center gap-3">
              <span className="shrink-0 text-white/55">{a.icon}</span>
              <span className="text-[12.5px] leading-tight text-white/85">
                <span className="block font-bold">{a.title}</span>
                <span className="block text-white/55">{a.sub}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
