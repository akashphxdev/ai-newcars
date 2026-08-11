export interface ProfileUserSummary {
  id: number;
  name: string;
  email: string | null;
  mobile: string;
  city: { id: number; name: string } | null;
  isVerified: boolean;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface ProfileStats {
  savedCars: number;
  enquiries: number;
  reviews: number;
  activeAlerts: number;
}

export interface ProfileCarSummary {
  id: number;
  name: string;
  slug: string;
  launchStatus: string;
  priceMin: string | null;
  priceMax: string | null;
  coverImageUrl: string | null;
  brand: { id: number; name: string; slug: string };
}

export interface ProfileSavedCar {
  id: number;
  modelId: number;
  createdAt: string;
  model: ProfileCarSummary;
}

export interface ProfileEnquiry {
  id: number;
  type: "new_car" | "loan" | "insurance" | "price_drop" | "launch_notify" | "soft_lead";
  label: string;
  status: string;
  createdAt: string;
  brand: { id: number; name: string; slug: string } | null;
  model: { id: number; name: string; slug: string } | null;
  detail: string | null;
}

export interface ProfileReview {
  id: number;
  rating: string | null;
  title: string | null;
  body: string | null;
  status: string;
  helpfulCount: number;
  createdAt: string;
  model: { id: number; name: string; slug: string; brand: { id: number; name: string; slug: string } };
  variant: { id: number; variantName: string } | null;
}

export interface ProfileAlert {
  id: number;
  type: "price_drop" | "launch_notify";
  label: string;
  isActive: boolean;
  notifiedAt: string | null;
  createdAt: string;
  model: { id: number; name: string; slug: string } | null;
  brand: { id: number; name: string; slug: string } | null;
}

export interface ProfileOverview {
  user: ProfileUserSummary;
  stats: ProfileStats;
  savedCars: ProfileSavedCar[];
  recentEnquiries: ProfileEnquiry[];
  reviews: ProfileReview[];
  alerts: ProfileAlert[];
}
