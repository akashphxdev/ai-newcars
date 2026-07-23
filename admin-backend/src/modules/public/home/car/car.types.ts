// src/modules/public/home/car/car.types.ts
//
// Public-safe shape — flattens the one representative variant + its
// powertrain (ICE or electric) into a single `specs` block, since the
// homepage cards only ever show one row of specs per car, not the full
// variant/powertrain breakdown the admin panel edits.

export interface PublicHomeCarSpecs {
  seatingCapacity: number | null;
  engineCc: number | null;
  mileage: string | null;
  powerPs: number | null;
  torqueNm: number | null;
  batteryCapacity: string | null;
  range: number | null;
  chargeTime: string | null;
  topSpeedKmph: number | null;
}

export interface PublicHomeCarRecord {
  id: number;
  name: string;
  slug: string;
  brand: { id: number; name: string };
  bodyType: { id: number; name: string } | null;
  launchStatus: string;
  expectedLaunchDate: string | null;
  priceMin: string | null;
  priceMax: string | null;
  ratingAvg: string | null;
  coverImageUrl: string | null;
  isElectric: boolean;
  specs: PublicHomeCarSpecs | null;
}
