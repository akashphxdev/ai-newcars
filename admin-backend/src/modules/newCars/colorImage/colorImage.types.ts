// src/modules/newCars/colorImage/colorImage.types.ts

export interface ModelWithColorsOrImagesRecord {
  id: number;
  name: string;
  brand: { id: number; name: string };
  colorsCount: number;
  imagesCount: number;
}
