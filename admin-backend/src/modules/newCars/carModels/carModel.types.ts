// src/modules/newCars/carModels/carModel.types.ts

// Returned by the dedicated "replace cover image" endpoint — mirrors
// image.types.ts's ImageReplaceFileResult, kept minimal on purpose so the
// admin panel's cover-upload widget doesn't need the whole CarModel payload
// just to update a thumbnail preview.
export interface CarModelCoverImageResult {
  id: number;
  coverImageUrl: string | null;
}