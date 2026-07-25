// features/testimonials/testimonial.api.ts

import { apiFetch, getUploadUrl } from "@/lib/apiClient";
import type { Testimonial, SubmitTestimonialInput, SubmitTestimonialResult } from "./testimonial.types";

export async function getHomeTestimonials(limit = 10): Promise<Testimonial[]> {
  const testimonials = await apiFetch<Testimonial[]>(`/home/testimonials?limit=${limit}`, { next: { revalidate: 120 } });
  return testimonials.map((t) => ({ ...t, photoUrl: getUploadUrl(t.photoUrl) }));
}

// Called from the client-side "write a review" form — a mutation, so
// never cached.
export function submitTestimonial(input: SubmitTestimonialInput): Promise<SubmitTestimonialResult> {
  return apiFetch<SubmitTestimonialResult>("/home/testimonials", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
