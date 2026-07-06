// src/modules/newCars/feature/feature.types.ts

export interface FeatureVariantSummary {
  id: number;
  variantName: string;
  model: { id: number; name: string; brand: { id: number; name: string } };
}

export interface FeatureRecord {
  id: number;
  variantId: number;
  airbagsCount: number | null;
  absWithEbd: boolean;
  esc: boolean;
  hillAssist: boolean;
  rearParkingCamera: boolean;
  frontParkingSensors: boolean;
  tpms: boolean;
  isofixMounts: boolean;
  // Decimal fields come back from Prisma serialized as strings — same
  // convention used across CarModel/CarVariant/PowertrainIce.
  ncapRating: string | null;
  sunroof: boolean;
  keylessEntry: boolean;
  pushButtonStart: boolean;
  cruiseControl: boolean;
  climateControl: boolean;
  rearAcVents: boolean;
  autoDimmingMirror: boolean;
  powerWindows: boolean;
  upholsteryType: string | null;
  adjustableSeats: boolean;
  ventilatedSeats: boolean;
  rearArmrest: boolean;
  ledHeadlamps: boolean;
  ledDrls: boolean;
  alloyWheels: boolean;
  roofRails: boolean;
  fogLamps: boolean;
  touchscreenSizeInch: string | null;
  androidAuto: boolean;
  appleCarplay: boolean;
  connectedCarTech: boolean;
  numberOfSpeakers: number | null;
  wirelessCharging: boolean;
  extraFeatures: string | null;
  createdAt: Date;
  variant: FeatureVariantSummary;
}