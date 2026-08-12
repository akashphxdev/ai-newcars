// lib/comparable.ts
//
// Which two cars are worth putting side by side.
//
// A comparison only means something between cars the same buyer could
// actually choose between. Offering a ten-lakh hatchback against a
// crore-and-a-half saloon produces a page that answers nobody's question,
// and — because /compare/{a}-vs-{b} is a real URL for any pair — hundreds
// of thousands of them are reachable by construction.
//
// The rule is price alone, deliberately. Body type is a good signal for
// what to *recommend* (the rails use it), but too strict for what to
// *allow*: someone cross-shopping a Thar against a Creta is asking a real
// question, and a body-type rule would refuse it.

// The dearer car may cost up to this multiple of the cheaper one. Two and
// a half times covers a genuine stretch — a ten-lakh budget looking at
// twenty-five — while a fifteen-fold gap fails clearly.
export const MAX_PRICE_RATIO = 2.5;

export function isComparablePrice(a: string | null, b: string | null): boolean {
  const priceA = Number(a);
  const priceB = Number(b);
  // A car we hold no price for cannot be judged, so it is allowed rather
  // than hidden — the alternative is silently dropping it from the picker
  // with no way for anyone to notice.
  if (!(priceA > 0) || !(priceB > 0)) return true;
  return Math.max(priceA, priceB) / Math.min(priceA, priceB) <= MAX_PRICE_RATIO;
}

// A set is comparable when every car in it is comparable with every
// other: three cars where the outer two are far apart is still a bad
// comparison, even if each is close to the middle one.
export function isComparableSet(prices: (string | null)[]): boolean {
  for (let i = 0; i < prices.length; i++) {
    for (let j = i + 1; j < prices.length; j++) {
      if (!isComparablePrice(prices[i], prices[j])) return false;
    }
  }
  return true;
}
