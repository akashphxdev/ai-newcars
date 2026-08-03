// features/states/state.types.ts
//
// Mirrors admin-backend's public /states/options — lightweight,
// unpaginated, every state in one shot. Used wherever State is just a
// dropdown (insurance wizard's Registration State field).

export interface StateOption {
  id: number;
  name: string;
}
