// lib/features.ts
//
// Flags for surfaces that are built but not ready to be public.
//
// Buy Used Car depends on a Cars24/Spinny tie-up that is not in place,
// so every used-car surface is gated on this one constant rather than
// being deleted — turning it back on is a one-line change instead of an
// archaeology exercise, and the API, page and card stay covered by the
// build in the meantime.
export const BUY_USED_CARS_ENABLED = false;
