"use client"

type Review = {
  name: string;
  verified: boolean;
  car: string;
  rating: number;
  date: string;
  title: string;
  body: string;
  ownership: string;
  badge?: string;
};

const OVERALL_RATING = 4.3;
const TOTAL_REVIEWS = 1842;

const DISTRIBUTION = [
  { stars: 5, pct: 58 },
  { stars: 4, pct: 27 },
  { stars: 3, pct: 9 },
  { stars: 2, pct: 4 },
  { stars: 1, pct: 2 },
];

const CATEGORY_SCORES = [
  { label: "Mileage", score: 4.1 },
  { label: "Comfort", score: 4.5 },
  { label: "Performance", score: 4.2 },
  { label: "Build quality", score: 4.4 },
];

const REVIEWS: Review[] = [
  {
    name: "Rohit Sharma",
    verified: true,
    car: "Hyundai Creta 2023",
    rating: 5,
    date: "2 weeks ago",
    title: "Best family SUV in this budget, no second thoughts",
    body: "Driven it for 8 months now, mostly city plus a few highway trips. Mileage matches what the dealer promised and the cabin stays quiet even at 100+ km/h. Service costs are a bit on the higher side but worth it.",
    ownership: "8 months of ownership",
    badge: "Top Rated",
  },
  {
    name: "Ananya Desai",
    verified: true,
    car: "Tata Nexon EV 2024",
    rating: 4,
    date: "1 month ago",
    title: "Great daily driver, charging infra still catching up",
    body: "Range is genuinely close to claimed figures if you drive sensibly. My only complaint is finding fast chargers outside the city — planning road trips needs some homework.",
    ownership: "1 year of ownership",
    badge: "Helpful",
  },
  {
    name: "Vikram Singh",
    verified: false,
    car: "Maruti Suzuki Swift 2022",
    rating: 5,
    date: "3 weeks ago",
    title: "Reliable, cheap to maintain, exactly what I needed",
    body: "Bought it as a second car for my wife's commute. Zero issues in two years, and service costs are the lowest among all the cars I've owned.",
    ownership: "2 years of ownership",
    badge: "Most Helpful",
  },
  {
    name: "Priya Nair",
    verified: true,
    car: "Mahindra Scorpio-N 2023",
    rating: 4,
    date: "5 days ago",
    title: "Commanding road presence, but it does drink fuel",
    body: "Love the ride height and how it handles bad roads, which matter a lot where I live. Just be ready for the fuel bills if you're doing a lot of city driving.",
    ownership: "6 months of ownership",
    badge: "Recent",
  },
];

const StarRow = ({ rating, size = "size-3.5" }: { rating: number; size?: string }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <svg
        key={i}
        className={`${size} ${i <= Math.round(rating) ? "text-amber-400" : "text-gray-200"}`}
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M10 1.5 12.5 7 18.5 7.8 14 12 15.2 18 10 15 4.8 18 6 12 1.5 7.8 7.5 7Z" />
      </svg>
    ))}
  </div>
);

const VerifiedBadge = () => (
  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
    <svg className="size-3" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2 14.5 4.2 17.8 3.8 18.6 7 21.5 8.6 20.4 11.8 21.5 15 18.6 16.6 17.8 19.8 14.5 19.4 12 21.6 9.5 19.4 6.2 19.8 5.4 16.6 2.5 15 3.6 11.8 2.5 8.6 5.4 7 6.2 3.8 9.5 4.2Z"
        fill="currentColor"
      />
      <path d="M8.5 12.2 11 14.7 15.5 9.8" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    Verified
  </span>
);

const ReviewCard = ({ review }: { review: Review }) => (
  <div className="group relative flex flex-col gap-2 rounded-xl bg-white p-4 ring-1 ring-gray-200 transition-shadow duration-300 hover:shadow-lg">
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-bold text-gray-900">{review.name}</p>
          {review.verified && <VerifiedBadge />}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{review.car}</p>
      </div>
      <button className="rounded-full bg-gray-100 p-1.5 opacity-0 transition-all group-hover:opacity-100">
        <svg className="size-3.5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        </svg>
      </button>
    </div>

    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5">
        <StarRow rating={review.rating} size="size-3" />
        {review.badge && (
          <span className="inline-block rounded-full bg-red-600 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">
            {review.badge}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium text-gray-400">{review.date}</span>
    </div>

    <div>
      <h3 className="text-xs font-bold text-gray-900 line-clamp-2">{review.title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-gray-600 line-clamp-3">{review.body}</p>
    </div>

    <div className="flex items-center justify-between border-t border-gray-100 pt-2">
      <p className="text-[10px] font-semibold text-gray-500">{review.ownership}</p>
      <div className="flex items-center gap-2">
        <button className="text-[10px] font-semibold text-gray-500 hover:text-red-600 transition-colors">
          Helpful
        </button>
        <span className="text-gray-300">·</span>
        <button className="text-[10px] font-semibold text-gray-500 hover:text-red-600 transition-colors">
          Share
        </button>
      </div>
    </div>
  </div>
);

export default function Reviews() {
  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8">
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-red-600">From Real Owners</p>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Reviews</h2>
          <p className="mt-1 text-xs text-gray-500">Honest feedback from people who've owned and driven these cars</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
          {/* Rating summary */}
          <div className="flex flex-col gap-5 rounded-xl bg-gray-50 p-5 ring-1 ring-gray-200">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-gray-900">{OVERALL_RATING}</span>
                <span className="text-sm font-medium text-gray-400">/ 5</span>
              </div>
              <StarRow rating={OVERALL_RATING} size="size-4" />
              <p className="mt-2 text-[10px] font-semibold text-gray-500">
                {TOTAL_REVIEWS.toLocaleString("en-IN")} reviews
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {DISTRIBUTION.map((d) => (
                <div key={d.stars} className="flex items-center gap-2">
                  <span className="w-4 text-[10px] font-semibold text-gray-600">{d.stars}★</span>
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${d.pct}%` }} />
                  </div>
                  <span className="w-7 text-right text-[10px] font-medium text-gray-500">{d.pct}%</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t border-gray-200 pt-4">
              {CATEGORY_SCORES.map((c) => (
                <div key={c.label} className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-gray-600">{c.label}</span>
                  <div className="flex items-center gap-1">
                    <div className="h-1 w-12 overflow-hidden rounded-full bg-gray-200">
                      <div className="h-full rounded-full bg-amber-400" style={{ width: `${(c.score / 5) * 100}%` }} />
                    </div>
                    <span className="w-8 text-right text-[10px] font-bold text-gray-900">{c.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Review list */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {REVIEWS.map((review) => (
              <ReviewCard key={review.name} review={review} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}