// components/common/icons.tsx
//
// Every small icon used across the site, in one place. Backed by
// lucide-react (tree-shaken — only icons imported here ship), wrapped so
// call sites keep the same names and default sizes they always had.
// Custom art survives only where lucide has no honest equivalent: the
// engine block, the road, the two-panel compare glyph.
//
// Semantics are fixed, not per-caller: GaugeIcon means mileage/efficiency,
// RoadIcon means range/distance, BatteryIcon means battery, PowerIcon
// means power, FuelIcon means fuel type, EngineIcon means engine. Pick by
// meaning, not by shape.

import {
  ArrowRight,
  Armchair,
  BatteryCharging,
  Bell,
  Calculator,
  Car,
  Check,
  ChevronDown,
  Clock,
  Cog,
  Droplet,
  Flame,
  Fuel,
  Gauge,
  Heart,
  IndianRupee,
  Lock,
  Luggage,
  MapPin,
  Minus,
  Pencil,
  Percent,
  Phone,
  Plug,
  RotateCw,
  Ruler,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Thermometer,
  Wallet,
  X,
  Zap,
} from "lucide-react";

type IconProps = { className?: string };

const W = 1.7;

export const ChevronIcon = ({ className = "size-3.5", dir = "right" }: IconProps & { dir?: "left" | "right" }) => (
  <ArrowRight className={className} strokeWidth={W} style={dir === "left" ? { transform: "rotate(180deg)" } : undefined} />
);

export const PhoneIcon = ({ className = "size-4" }: IconProps) => <Phone className={className} strokeWidth={W} />;
export const ChevronDownIcon = ({ className = "size-4" }: IconProps) => <ChevronDown className={className} strokeWidth={2.5} />;

export const HeartIcon = ({ className = "size-3.5", filled = false }: IconProps & { filled?: boolean }) => (
  <Heart className={className} strokeWidth={W} fill={filled ? "currentColor" : "none"} />
);
export const StarIcon = ({ className = "size-3", filled = false }: IconProps & { filled?: boolean }) => (
  <Star className={className} strokeWidth={1.3} fill={filled ? "currentColor" : "none"} />
);

export const PowerIcon = ({ className = "size-3" }: IconProps) => <Zap className={className} strokeWidth={W} />;
export const BoltIcon = PowerIcon;
export const TorqueIcon = ({ className = "size-3" }: IconProps) => <RotateCw className={className} strokeWidth={W} />;
export const GaugeIcon = ({ className = "size-3" }: IconProps) => <Gauge className={className} strokeWidth={W} />;
export const SeatIcon = ({ className = "size-4" }: IconProps) => <Armchair className={className} strokeWidth={W} />;
export const FuelIcon = ({ className = "size-3" }: IconProps) => <Fuel className={className} strokeWidth={W} />;
export const GearIcon = ({ className = "size-3" }: IconProps) => <Cog className={className} strokeWidth={W} />;
export const ClockIcon = ({ className = "size-3" }: IconProps) => <Clock className={className} strokeWidth={W} />;
export const BatteryIcon = ({ className = "size-3" }: IconProps) => <BatteryCharging className={className} strokeWidth={1.6} />;

export const CloseIcon = ({ className = "size-5" }: IconProps) => <X className={className} strokeWidth={2.2} />;
export const CheckIcon = ({ className = "size-4" }: IconProps) => <Check className={className} strokeWidth={2.4} />;
export const MinusIcon = ({ className = "size-4" }: IconProps) => <Minus className={className} strokeWidth={2.4} />;
export const EditIcon = ({ className = "size-3.5" }: IconProps) => <Pencil className={className} strokeWidth={1.8} />;
export const ShareIcon = ({ className = "size-4" }: IconProps) => <Share2 className={className} strokeWidth={1.8} />;
export const BellIcon = ({ className = "size-4" }: IconProps) => <Bell className={className} strokeWidth={W} />;
export const TagIcon = ({ className = "size-4" }: IconProps) => <Tag className={className} strokeWidth={W} />;
export const PercentIcon = ({ className = "size-4" }: IconProps) => <Percent className={className} strokeWidth={W} />;
export const ShieldIcon = ({ className = "size-4" }: IconProps) => <ShieldCheck className={className} strokeWidth={W} />;
export const LockIcon = ({ className = "size-3.5" }: IconProps) => <Lock className={className} strokeWidth={W} />;
export const FlameIcon = ({ className = "size-4" }: IconProps) => <Flame className={className} strokeWidth={W} />;
export const ThermometerIcon = ({ className = "size-4" }: IconProps) => <Thermometer className={className} strokeWidth={W} />;
export const CalculatorIcon = ({ className = "size-4" }: IconProps) => <Calculator className={className} strokeWidth={W} />;
export const SearchIcon = ({ className = "size-[15px]" }: IconProps) => <Search className={className} strokeWidth={1.8} />;
export const PinIcon = ({ className = "size-3.5" }: IconProps) => <MapPin className={className} strokeWidth={1.8} />;
export const WalletIcon = ({ className = "size-5" }: IconProps) => <Wallet className={className} strokeWidth={1.6} />;
export const SparkleIcon = ({ className = "size-4" }: IconProps) => <Sparkles className={className} strokeWidth={W} />;

export const CarIcon = ({ className = "size-4" }: IconProps) => <Car className={className} strokeWidth={W} />;
export const RulerIcon = ({ className = "size-4" }: IconProps) => <Ruler className={className} strokeWidth={W} />;
export const PlugIcon = ({ className = "size-4" }: IconProps) => <Plug className={className} strokeWidth={W} />;
export const RupeeIcon = ({ className = "size-4" }: IconProps) => <IndianRupee className={className} strokeWidth={W} />;
export const DropletIcon = ({ className = "size-4" }: IconProps) => <Droplet className={className} strokeWidth={W} />;
export const BootIcon = ({ className = "size-4" }: IconProps) => <Luggage className={className} strokeWidth={W} />;

// No lucide equivalent — house art.
export const EngineIcon = ({ className = "size-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="M3 13v3a1 1 0 0 0 1 1h1M3 13V9a1 1 0 0 1 1-1h6l3 3h4a2 2 0 0 1 2 2v2a1 1 0 0 1-1 1h-1M3 13h9" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M7 17v2M11 17v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const RoadIcon = ({ className = "size-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="M9 3 5 21M15 3l4 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 4v3M12 10.5v3M12 17v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

export const CompareIcon = ({ className = "size-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="6" width="8" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    <rect x="13" y="6" width="8" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    <path d="m16 20 3-3-3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
