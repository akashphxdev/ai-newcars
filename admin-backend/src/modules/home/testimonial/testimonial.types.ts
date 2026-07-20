// src/modules/home/testimonial/testimonial.types.ts

export interface TestimonialAdminSummary {
  id: number;
  name: string;
}

export interface TestimonialUserSummary {
  id: number;
  name: string;
}

export interface TestimonialRecord {
  id: number;
  userId: number | null;
  user: TestimonialUserSummary | null;
  customerName: string;
  customerCity: string | null;
  photoUrl: string | null;
  // Decimal field comes back from Prisma serialized as a string — same
  // convention as OfferRecord's offerAmount.
  rating: string | null;
  quote: string;
  // pending | approved | rejected — see TESTIMONIAL_STATUSES in testimonial.validation.ts.
  status: string;
  rejectedReason: string | null;
  reviewedBy: number | null;
  reviewedByAdmin: TestimonialAdminSummary | null;
  reviewedAt: Date | null;
  displayOrder: number;
  isActive: boolean;
  createdBy: number | null;
  createdByAdmin: TestimonialAdminSummary | null;
  createdAt: Date;
}

export interface TestimonialUploadPhotoResult {
  id: number;
  photoUrl: string;
}
