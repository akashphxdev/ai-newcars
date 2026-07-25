// features/testimonials/testimonial.types.ts
//
// Mirrors admin-backend's PublicHomeTestimonialRecord / PublicTestimonialSubmitResult
// (modules/public/home/testimonial).

export interface Testimonial {
  id: number;
  customerName: string;
  customerCity: string | null;
  photoUrl: string | null;
  rating: string | null;
  quote: string;
  createdAt: string;
}

export interface SubmitTestimonialInput {
  customerName: string;
  customerCity?: string;
  rating: number;
  quote: string;
}

export interface SubmitTestimonialResult {
  id: number;
  status: string;
}
