// src/core/utils/slugify.ts

export function slugify(input: string): string {
  return input
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // any run of non-alphanumeric -> single hyphen
    .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens
}