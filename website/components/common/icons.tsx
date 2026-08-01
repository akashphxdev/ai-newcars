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

export const ChevronDownIcon = ({ className = "size-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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

export const BatteryIcon = ({ className = "size-3" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <rect x="2.5" y="7" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M20.5 10v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M6 10.5h4l-1.5 3H10l-2.5 3 .8-2.5H6.8L6 10.5Z" fill="currentColor" />
  </svg>
);

export const CloseIcon = ({ className = "size-5" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const CheckIcon = ({ className = "size-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const MinusIcon = ({ className = "size-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

export const EditIcon = ({ className = "size-3.5" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ShareIcon = ({ className = "size-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <circle cx="18" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="6" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="18" cy="19" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8.2 10.7 15.8 6.3M8.2 13.3l7.6 4.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const BellIcon = ({ className = "size-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

export const TagIcon = ({ className = "size-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M20.5 12.5 12.8 20.2a1.5 1.5 0 0 1-2.1 0l-6.9-6.9a1.5 1.5 0 0 1 0-2.1L11.5 3.5H19a1.5 1.5 0 0 1 1.5 1.5v7.5Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="15.5" cy="8.5" r="1.3" fill="currentColor" />
  </svg>
);

export const PercentIcon = ({ className = "size-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="M18 6 6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <circle cx="7.5" cy="6.5" r="2" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="16.5" cy="17.5" r="2" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);

export const ShieldIcon = ({ className = "size-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 3.5 19 6v5.5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-2.5Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const LockIcon = ({ className = "size-3.5" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M8 11V7.5a4 4 0 0 1 8 0V11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <circle cx="12" cy="15.5" r="1.2" fill="currentColor" />
  </svg>
);

export const FlameIcon = ({ className = "size-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2.5c1 3-3 4.5-3 8a3 3 0 0 0 6 0c1 1 1.5 2.3 1.5 3.5a4.5 4.5 0 0 1-9 0c0-4.5 4.5-6 4.5-11.5Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const RoadIcon = ({ className = "size-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="M9 3 5 21M15 3l4 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 4v3M12 10.5v3M12 17v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

export const ThermometerIcon = ({ className = "size-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 14.5V5a2 2 0 1 0-4 0v9.5a4 4 0 1 0 4 0Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="10" cy="16.5" r="1.3" fill="currentColor" />
  </svg>
);
