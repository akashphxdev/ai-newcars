// features/cars/car.types.ts
//
// Mirrors admin-backend's PublicHomeCarRecord (modules/public/home/car) —
// backs LatestCars / PopularCars / UpcomingLaunches / ElectricCars.

export type HomeCarType = "latest" | "popular" | "upcoming" | "electric";

export interface CarSpecs {
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

export interface HomeCar {
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
  specs: CarSpecs | null;
}
