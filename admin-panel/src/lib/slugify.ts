// src/lib/slugify.ts
//
// Mirrors the backend's (now-removed) slugify() exactly, so the live
// preview shown in every Add/Edit form is the literal value that gets
// submitted and saved — the backend no longer auto-generates slugs.

export function slugify(input: string): string {
  return input
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
