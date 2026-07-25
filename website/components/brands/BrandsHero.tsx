import Image from "next/image";
import Link from "next/link";

type Feature = { label: string; desc: string; icon: React.ReactNode };

// currentColor throughout — each icon inherits text-brand (top row) or
// text-white (bottom bar) from its wrapper span instead of a hardcoded stroke.
const GridIcon = () => (
  <svg className="size-5" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

const CheckShieldIcon = () => (
  <svg className="size-5" viewBox="0 0 24 24" fill="none">
    <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ScaleIcon = () => (
  <svg className="size-5" viewBox="0 0 24 24" fill="none">
    <path d="M12 3v18M6 7l-3 6a3 3 0 0 0 6 0l-3-6ZM18 7l-3 6a3 3 0 0 0 6 0l-3-6Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 21h16M6 7h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const BadgeIcon = () => (
  <svg className="size-5" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
    <path d="M9 14l-2 7 5-2.5L17 21l-2-7" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

const SparkleIcon = () => (
  <svg className="size-5" viewBox="0 0 24 24" fill="none">
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M17.5 17.5 15 15M6 18l2.5-2.5M17.5 6.5 15 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const ChatIcon = () => (
  <svg className="size-5" viewBox="0 0 24 24" fill="none">
    <path d="M4 5h16v11H9l-5 4V5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

const TagIcon = () => (
  <svg className="size-5" viewBox="0 0 24 24" fill="none">
    <path d="M12 3h6a3 3 0 0 1 3 3v6l-9 9-9-9 9-9Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <circle cx="15" cy="9" r="1.4" fill="currentColor" />
  </svg>
);

const TOP_FEATURES: Feature[] = [
  { icon: <GridIcon />, label: "Wide Selection", desc: "Every major manufacturer" },
  { icon: <CheckShieldIcon />, label: "Verified Info", desc: "Accurate specs & pricing" },
  { icon: <ScaleIcon />, label: "Easy Comparison", desc: "Compare models side by side" },
];

const BOTTOM_FEATURES: Feature[] = [
  { icon: <BadgeIcon />, label: "Genuine Listings", desc: "100% verified brands" },
  { icon: <SparkleIcon />, label: "Latest Models", desc: "Always up to date" },
  { icon: <ChatIcon />, label: "Expert Reviews", desc: "In-depth & unbiased" },
  { icon: <TagIcon />, label: "Best Deals", desc: "Compare offers instantly" },
];

const TopFeature = ({ feature }: { feature: Feature }) => (
  <div className="flex items-center gap-3">
    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface text-brand shadow-sm">{feature.icon}</span>
    <div>
      <p className="text-[13.5px] font-bold text-ink">{feature.label}</p>
      <p className="text-[12px] font-medium text-muted">{feature.desc}</p>
    </div>
  </div>
);

const BottomFeature = ({ feature }: { feature: Feature }) => (
  <div className="flex items-center gap-3">
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm">{feature.icon}</span>
    <div>
      <p className="text-[13.5px] font-bold text-white">{feature.label}</p>
      <p className="text-[11.5px] font-medium text-white/70">{feature.desc}</p>
    </div>
  </div>
);

export default function BrandsHero() {
  return (
    <div className="relative w-full overflow-hidden" style={{ minHeight: 460 }}>
      <Image src="/brand-page-image.png" alt="Car brands" fill priority sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/55 via-white/25 to-transparent" />

      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-between px-4 py-8 sm:py-10" style={{ minHeight: 460 }}>
        <div>
          <nav className="flex items-center gap-1.5 text-[13px] font-semibold" aria-label="Breadcrumb">
            <Link href="/" className="text-ink">
              Home
            </Link>
            <span className="text-muted">{">"}</span>
            <span className="text-brand">Brands</span>
          </nav>

          <h1 className="mt-4 font-head text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
            All Car <span className="text-brand">Brands</span>
          </h1>
          <p className="mt-2 text-lg font-medium text-ink">Find your perfect manufacturer, all in one place</p>

          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-4">
            {TOP_FEATURES.map((f) => (
              <TopFeature key={f.label} feature={f} />
            ))}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-y-4 rounded-2xl bg-ink/55 px-5 py-4 sm:grid-cols-4 sm:gap-y-0">
          {BOTTOM_FEATURES.map((f) => (
            <BottomFeature key={f.label} feature={f} />
          ))}
        </div>
      </div>
    </div>
  );
}
