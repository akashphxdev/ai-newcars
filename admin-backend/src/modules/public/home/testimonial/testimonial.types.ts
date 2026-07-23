// src/modules/public/home/testimonial/testimonial.types.ts
//
// Public-safe shape — no user/moderation/audit fields, only what the
// website's Reviews (testimonials) section needs to render a card.

export interface PublicHomeTestimonialRecord {
  id: number;
  customerName: string;
  customerCity: string | null;
  photoUrl: string | null;
  rating: string | null;
  quote: string;
  createdAt: string;
}

export interface PublicTestimonialSubmitResult {
  id: number;
  status: string;
}
