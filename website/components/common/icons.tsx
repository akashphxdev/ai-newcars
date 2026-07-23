// components/common/icons.tsx
//
// Every small inline SVG icon used across the home page sections, in one
// place — these were previously copy-pasted (identically) into 4-5
// different section files. Add new icons here rather than inlining one
// in a component again.

type IconProps = { className?: string };

export const ChevronIcon = ({ className = "size-3.5", dir = "right" }: IconProps & { dir?: "left" | "right" }) => (
  <svg className={className} viewBox="0 0 12 12" fill="none" style={{ transform: dir === "left" ? "rotate(180deg)" : "none" }}>
    <path d="M2 6h8M8 2l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const HeartIcon = ({ className = "size-3.5", filled = false }: IconProps & { filled?: boolean }) => (
  <svg className={className} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"}>
    <path
      d="M12 20.5s-7.5-4.6-10-9.4C.5 7.6 2.4 4 6 4c2.1 0 3.7 1.2 6 3.6C14.3 5.2 15.9 4 18 4c3.6 0 5.5 3.6 4 7.1-2.5 4.8-10 9.4-10 9.4Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
  </svg>
);

export const StarIcon = ({ className = "size-3", filled = false }: IconProps & { filled?: boolean }) => (
  <svg className={className} viewBox="0 0 20 20" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.3">
    <path d="M10 2.5 12.5 7.5 18 8.3 14 12.2 15 17.7 10 15 5 17.7 6 12.2 2 8.3 7.5 7.5 10 2.5Z" strokeLinejoin="round" />
  </svg>
);

export const PowerIcon = ({ className = "size-3" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  </svg>
);

export const TorqueIcon = ({ className = "size-3" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.7" />
    <path d="M12 7.5v4.7l3.2 1.9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const GaugeIcon = ({ className = "size-3" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="M4 14.5a8 8 0 1 1 16 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M12 14.5 16.2 9.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <circle cx="12" cy="14.5" r="1.1" fill="currentColor" />
  </svg>
);

export const FuelIcon = ({ className = "size-3" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="M5 21V8l5-5h4v3h2a2 2 0 0 1 2 2v9.5a1.5 1.5 0 0 1-3 0V13a1 1 0 0 0-1-1h-1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 21h9M5 12h9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

export const GearIcon = ({ className = "size-3" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
    <path d="M12 4v2.5M12 17.5V20M4 12h2.5M17.5 12H20M6.3 6.3l1.8 1.8M15.9 15.9l1.8 1.8M6.3 17.7l1.8-1.8M15.9 8.1l1.8-1.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

export const BoltIcon = ({ className = "size-3" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  </svg>
);

export const ClockIcon = ({ className = "size-3" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
    <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CloseIcon = ({ className = "size-5" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
