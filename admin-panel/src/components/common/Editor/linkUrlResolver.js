// src/components/common/Editor/linkUrlResolver.js
//
// Single place the "Smart link" feature (Brand / Car Model search inside
// the article editor) asks for a public-site URL. The public website
// (../../../../website) doesn't have brand/car-model detail pages built
// yet, so both resolvers below return null for now — the Smart Link
// modal falls back to inserting plain (unlinked) text and the admin can
// paste a URL manually via the regular "Add link" button once one exists.
//
// Once the website ships those routes, come back here and fill in the
// real path — every article written before AND after that point will
// pick up working links automatically, since content only stores the
// slug via the resolver, never a hardcoded URL.
//
//   export function resolveBrandUrl(brand) {
//     return `${PUBLIC_SITE_URL}/brands/${brand.slug}`;
//   }
//   export function resolveCarModelUrl(model) {
//     return `${PUBLIC_SITE_URL}/cars/${model.slug}`;
//   }

// eslint-disable-next-line no-unused-vars
export function resolveBrandUrl(brand) {
  return null;
}

// eslint-disable-next-line no-unused-vars
export function resolveCarModelUrl(model) {
  return null;
}
