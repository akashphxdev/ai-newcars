// lib/routes.ts
//
// Routes that render their own full-page chrome (dark fullscreen viewers,
// maintenance mode) and shouldn't get the site's Header/Footer. Checked by
// both components, so it lives here instead of being duplicated.
const CHROMELESS_PATTERNS = [
  /^\/maintenance$/,
  // "/tata-motors-cars/nexon/photos" — the fullscreen photo viewer.
  /^\/[a-z0-9-]+-cars\/[a-z0-9-]+\/photos$/,
];

export function isChromelessRoute(pathname: string): boolean {
  return CHROMELESS_PATTERNS.some((pattern) => pattern.test(pathname));
}
