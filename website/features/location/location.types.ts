// features/location/location.types.ts

export interface LocationCity {
  id: number;
  name: string;
  slug: string;
  isTopCity: boolean;
}

// Both /location/detect (Cloudflare IP hint) and /location/reverse (GPS)
// answer in this shape. `city` is null when the place was recognised but
// is not one we cover — `detected` still carries the raw name so the UI
// can say which place it was.
export interface DetectedLocation {
  city: LocationCity | null;
  detected: string;
  source: "ip" | "gps" | "";
}
