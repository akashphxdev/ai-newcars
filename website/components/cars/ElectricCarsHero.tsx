import Image from "next/image";
import Link from "next/link";

type Feature = { label: string; desc: string; icon: React.ReactNode };

// currentColor throughout — each icon inherits text-ev (top row) or
// text-white (bottom bar) from its wrapper span instead of a hardcoded stroke.
const LeafIcon = () => (
  <svg className="size-5" viewBox="0 0 24 24" fill="none">
    <path d="M5 19c8 1 14-5 14-13-8 0-14 5-14 13Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M6 18c3-4 6-7 12-11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const BoltIcon = () => (
  <svg className="size-5" viewBox="0 0 24 24" fill="none">
    <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

const ChipIcon = () => (
  <svg className="size-5" viewBox="0 0 24 24" fill="none">
    <rect x="7" y="7" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    <path d="M9 3v2M12 3v2M15 3v2M9 19v2M12 19v2M15 19v2M3 9h2M3 12h2M3 15h2M19 9h2M19 12h2M19 15h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const RangeIcon = () => (
  <svg className="size-5" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
    <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="size-5" viewBox="0 0 24 24" fill="none">
    <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChatIcon = () => (
  <svg className="size-5" viewBox="0 0 24 24" fill="none">
    <path d="M4 5h16v11H9l-5 4V5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

const ScaleIcon = () => (
  <svg className="size-5" viewBox="0 0 24 24" fill="none">
    <path d="M12 3v18M6 7l-3 6a3 3 0 0 0 6 0l-3-6ZM18 7l-3 6a3 3 0 0 0 6 0l-3-6Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 21h16M6 7h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const TOP_FEATURES: Feature[] = [
  { icon: <LeafIcon />, label: "Zero Emissions", desc: "Cleaner tomorrow" },
  { icon: <BoltIcon />, label: "Lower Running Cost", desc: "Save more every day" },
  { icon: <ChipIcon />, label: "Advanced Technology", desc: "Smarter & safer driving" },
];

const BOTTOM_FEATURES: Feature[] = [
  { icon: <RangeIcon />, label: "Wide Range", desc: "Hatchbacks, SUVs & Sedans" },
  { icon: <ShieldIcon />, label: "Trusted Brands", desc: "Best electric car makers" },
  { icon: <ChatIcon />, label: "Expert Reviews", desc: "Detailed & unbiased reviews" },
  { icon: <ScaleIcon />, label: "Easy Comparison", desc: "Compare & find your perfect EV" },
];

const TopFeature = ({ feature }: { feature: Feature }) => (
  <div className="flex items-center gap-3">
    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface text-ev shadow-sm">{feature.icon}</span>
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

export default function ElectricCarsHero() {
  return (
    <div className="relative w-full overflow-hidden" style={{ minHeight: 460 }}>
      <Image src="/electric-page-image.png" alt="Electric cars" fill priority sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/55 via-white/25 to-transparent" />

      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-between px-4 py-8 sm:py-10" style={{ minHeight: 460 }}>
        <div>
          <nav className="flex items-center gap-1.5 text-[13px] font-semibold" aria-label="Breadcrumb">
            <Link href="/" className="text-ink">
              Home
            </Link>
            <span className="text-muted">{">"}</span>
            <span className="text-ev">Electric Cars</span>
          </nav>

          <h1 className="mt-4 font-head text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
            All <span className="text-ev">Electric</span> Cars
          </h1>
          <p className="mt-2 text-lg font-medium text-ink">Drive the future with zero emissions</p>

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
