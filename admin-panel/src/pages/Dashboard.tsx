// Dashboard.tsx
// Usage: Drop inside AdminLayout's <Outlet />

const ACCENT = "#D4300F";

// ─── Static Data (replace with API calls later) ───────────────────────────────

const STAT_CARDS = [
  {
    label: "Total Users",
    value: "24,318",
    sub: "+142 today",
    positive: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    label: "New Car Leads",
    value: "1,284",
    sub: "+24 today",
    positive: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M18.5 10.5H5.5L3 15H21L18.5 10.5Z" strokeLinejoin="round" />
        <circle cx="7" cy="17.5" r="1.5" />
        <circle cx="17" cy="17.5" r="1.5" />
        <path d="M5.5 10.5L7.5 6H16.5L18.5 10.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Used Car Listings",
    value: "3,902",
    sub: "-8 from yesterday",
    positive: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    label: "Sell Car Leads",
    value: "487",
    sub: "+8 today",
    positive: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    label: "Insurance Leads",
    value: "319",
    sub: "+5 today",
    positive: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    label: "Loan Leads",
    value: "208",
    sub: "+3 today",
    positive: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
  },
  {
    label: "Published Stories",
    value: "742",
    sub: "+2 today",
    positive: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  {
    label: "Active Ad Campaigns",
    value: "31",
    sub: "3 expiring soon",
    positive: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
];

const LEAD_TABLE = [
  { id: 1001, name: "Ravi Kumar", mobile: "98XXXXXX12", type: "New Car", model: "Maruti Suzuki Brezza", city: "Jaipur", status: "new", time: "2 min ago" },
  { id: 1002, name: "Priya Sharma", mobile: "97XXXXXX44", type: "Insurance", model: "Hyundai Creta", city: "Delhi", status: "contacted", time: "14 min ago" },
  { id: 1003, name: "Arjun Mehta", mobile: "96XXXXXX78", type: "Loan", model: "Tata Nexon EV", city: "Mumbai", status: "new", time: "28 min ago" },
  { id: 1004, name: "Sneha Patel", mobile: "95XXXXXX31", type: "Sell Car", model: "Honda City", city: "Ahmedabad", status: "closed", time: "1 hr ago" },
  { id: 1005, name: "Mohit Singh", mobile: "94XXXXXX55", type: "New Car", model: "Kia Seltos", city: "Lucknow", status: "new", time: "1 hr ago" },
  { id: 1006, name: "Divya Nair", mobile: "93XXXXXX09", type: "Used Car", model: "Maruti Baleno", city: "Bangalore", status: "contacted", time: "2 hr ago" },
  { id: 1007, name: "Rahul Joshi", mobile: "92XXXXXX66", type: "New Car", model: "Toyota Innova", city: "Pune", status: "closed", time: "3 hr ago" },
];

const RECENT_STORIES = [
  { title: "Top 5 SUVs under 15 Lakh in 2025", category: "Buying Guide", views: 14200, status: "published", author: "Admin" },
  { title: "Tata Nexon EV vs MG ZS EV — Full Comparison", category: "Comparison", views: 9800, status: "published", author: "Admin" },
  { title: "How to check a used car before buying", category: "Tips", views: 6400, status: "published", author: "Admin" },
  { title: "Best mileage cars for highway trips", category: "Buying Guide", views: 4100, status: "draft", author: "Admin" },
  { title: "Maruti Suzuki Swift 2025 — First Look", category: "News", views: 3200, status: "published", author: "Admin" },
];

const TOP_MODELS = [
  { name: "Maruti Suzuki Brezza", brand: "Maruti Suzuki", leads: 312, reviews: 94, bodyType: "SUV" },
  { name: "Hyundai Creta", brand: "Hyundai", leads: 278, reviews: 118, bodyType: "SUV" },
  { name: "Tata Nexon EV", brand: "Tata", leads: 241, reviews: 76, bodyType: "SUV" },
  { name: "Kia Seltos", brand: "Kia", leads: 198, reviews: 62, bodyType: "SUV" },
  { name: "Toyota Innova Crysta", brand: "Toyota", leads: 164, reviews: 88, bodyType: "MPV" },
];

const PENDING_REVIEWS = [
  { user: "Amit R.", model: "Honda City", rating: 4.5, excerpt: "Great mileage, comfortable on highways.", time: "10 min ago" },
  { user: "Pooja M.", model: "Hyundai i20", rating: 3.0, excerpt: "Average after-sales service, decent car.", time: "45 min ago" },
  { user: "Suresh K.", model: "Tata Punch", rating: 5.0, excerpt: "Best budget car I've owned, build quality superb.", time: "1 hr ago" },
];

const ACTIVITY_LOG = [
  { action: "New lead assigned", detail: "Buy New Car — Ravi Kumar (Jaipur)", time: "2 min ago" },
  { action: "Story published", detail: "Top 5 SUVs under 15 Lakh in 2025", time: "18 min ago" },
  { action: "Review approved", detail: "Tata Punch — Suresh K. (5 star)", time: "1 hr ago" },
  { action: "Used car listed", detail: "Honda City 2021 — Ahmedabad", time: "2 hr ago" },
  { action: "Ad campaign started", detail: "Hyundai — Summer Offer Banner", time: "3 hr ago" },
  { action: "Admin logged in", detail: "Super Admin — 192.168.1.10", time: "4 hr ago" },
  { action: "OTP verified", detail: "Admin mobile verification", time: "5 hr ago" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    new:       { bg: "#eef6ff", text: "#1d72c4", label: "New" },
    contacted: { bg: "#fef3e2", text: "#b45309", label: "Contacted" },
    closed:    { bg: "#f0fdf4", text: "#15803d", label: "Closed" },
    published: { bg: "#f0fdf4", text: "#15803d", label: "Published" },
    draft:     { bg: "#f7f5f1", text: "#7a7670", label: "Draft" },
    pending:   { bg: "#fef3e2", text: "#b45309", label: "Pending" },
  };
  const s = map[status] ?? { bg: "#f7f5f1", text: "#7a7670", label: status };
  return (
    <span
      className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="11" height="11" viewBox="0 0 24 24"
          fill={i <= Math.round(rating) ? ACCENT : "none"}
          stroke={i <= Math.round(rating) ? ACCENT : "#d1cdc7"}
          strokeWidth="1.5"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      <span className="text-[11px] font-semibold text-[#7a7670] ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

// ─── Section: Stat Cards ──────────────────────────────────────────────────────
function StatCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {STAT_CARDS.map((card) => (
        <div key={card.label} className="bg-white border border-[#e8e4dc] rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#a39e96]">{card.label}</span>
            <span className="text-[#c0bab0]">{card.icon}</span>
          </div>
          <p className="text-2xl font-black text-[#1c1a17] leading-none">{card.value}</p>
          <p className={`text-[11px] font-medium ${card.positive ? "text-emerald-600" : "text-red-400"}`}>
            {card.sub}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Section: Recent Leads Table ──────────────────────────────────────────────
function RecentLeads() {
  return (
    <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#f0ece6]">
        <h2 className="text-[13px] font-bold text-[#1c1a17]">Recent Leads</h2>
        <button className="cursor-pointer text-[11px] font-semibold hover:opacity-75 transition-opacity" style={{ color: ACCENT }}>
          View all
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-[#f7f5f1] border-b border-[#f0ece6]">
              {["ID", "Name", "Mobile", "Type", "Model", "City", "Status", "Time"].map((h) => (
                <th key={h} className="text-left text-[10px] font-bold uppercase tracking-wider text-[#a39e96] px-4 py-2.5 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LEAD_TABLE.map((row) => (
              <tr
                key={row.id}
                className="border-b border-[#f7f5f1] hover:bg-[#fef9f8] transition-colors cursor-pointer"
              >
                <td className="px-4 py-3 text-[#a39e96] font-mono">#{row.id}</td>
                <td className="px-4 py-3 font-semibold text-[#1c1a17] whitespace-nowrap">{row.name}</td>
                <td className="px-4 py-3 text-[#7a7670] font-mono">{row.mobile}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fef2f0] text-[#D4300F]">
                    {row.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#4a4640] whitespace-nowrap">{row.model}</td>
                <td className="px-4 py-3 text-[#7a7670]">{row.city}</td>
                <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                <td className="px-4 py-3 text-[#c0bab0] whitespace-nowrap">{row.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Section: Top Car Models ──────────────────────────────────────────────────
function TopModels() {
  const max = Math.max(...TOP_MODELS.map((m) => m.leads));
  return (
    <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#f0ece6]">
        <h2 className="text-[13px] font-bold text-[#1c1a17]">Top Car Models by Leads</h2>
        <button className="cursor-pointer text-[11px] font-semibold hover:opacity-75 transition-opacity" style={{ color: ACCENT }}>
          View all
        </button>
      </div>
      <div className="p-4 space-y-3">
        {TOP_MODELS.map((model, i) => (
          <div key={model.name} className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-[#c0bab0] w-4 shrink-0">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <span className="text-[12px] font-semibold text-[#1c1a17]">{model.name}</span>
                  <span className="ml-2 text-[10px] text-[#a39e96]">{model.bodyType}</span>
                </div>
                <span className="text-[12px] font-bold text-[#1c1a17]">{model.leads} leads</span>
              </div>
              <div className="h-1.5 bg-[#f0ece6] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${(model.leads / max) * 100}%`, background: ACCENT }}
                />
              </div>
            </div>
            <span className="text-[11px] text-[#a39e96] shrink-0">{model.reviews} reviews</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section: Recent Stories ──────────────────────────────────────────────────
function RecentStories() {
  return (
    <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#f0ece6]">
        <h2 className="text-[13px] font-bold text-[#1c1a17]">Recent Stories</h2>
        <button className="cursor-pointer text-[11px] font-semibold hover:opacity-75 transition-opacity" style={{ color: ACCENT }}>
          View all
        </button>
      </div>
      <div className="divide-y divide-[#f7f5f1]">
        {RECENT_STORIES.map((story) => (
          <div key={story.title} className="flex items-start justify-between gap-3 px-5 py-3.5 hover:bg-[#fef9f8] transition-colors cursor-pointer">
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-semibold text-[#1c1a17] truncate">{story.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-bold text-[#D4300F] bg-[#fef2f0] px-1.5 py-0.5 rounded">{story.category}</span>
                <span className="text-[11px] text-[#a39e96]">{story.views.toLocaleString()} views</span>
              </div>
            </div>
            <StatusBadge status={story.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section: Pending Reviews ─────────────────────────────────────────────────
function PendingReviews() {
  return (
    <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#f0ece6]">
        <h2 className="text-[13px] font-bold text-[#1c1a17]">Pending Reviews</h2>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
          style={{ background: ACCENT }}
        >
          {PENDING_REVIEWS.length}
        </span>
      </div>
      <div className="divide-y divide-[#f7f5f1]">
        {PENDING_REVIEWS.map((r) => (
          <div key={r.user + r.model} className="px-5 py-3.5 hover:bg-[#fef9f8] transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[12px] font-semibold text-[#1c1a17]">{r.user}</span>
                <span className="text-[11px] text-[#a39e96] ml-2">on {r.model}</span>
              </div>
              <span className="text-[10px] text-[#c0bab0]">{r.time}</span>
            </div>
            <StarRating rating={r.rating} />
            <p className="text-[11px] text-[#7a7670] mt-1 truncate">{r.excerpt}</p>
            <div className="flex items-center gap-2 mt-2">
              <button
                className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg text-white transition-opacity hover:opacity-80"
                style={{ background: ACCENT }}
              >
                Approve
              </button>
              <button className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#e8e4dc] text-[#7a7670] hover:bg-[#f7f5f1] transition-colors">
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section: Activity Log ────────────────────────────────────────────────────
function ActivityLog() {
  return (
    <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#f0ece6]">
        <h2 className="text-[13px] font-bold text-[#1c1a17]">Activity Log</h2>
      </div>
      <div className="p-4 space-y-3">
        {ACTIVITY_LOG.map((log, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: ACCENT }} />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-[#1c1a17]">{log.action}</p>
              <p className="text-[11px] text-[#a39e96] truncate">{log.detail}</p>
            </div>
            <span className="text-[10px] text-[#c0bab0] whitespace-nowrap shrink-0">{log.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section: Lead Type Split ─────────────────────────────────────────────────
const LEAD_SPLIT = [
  { label: "New Car",   count: 1284, pct: 45 },
  { label: "Used Car",  count: 487,  pct: 17 },
  { label: "Sell Car",  count: 319,  pct: 11 },
  { label: "Insurance", count: 319,  pct: 11 },
  { label: "Loan",      count: 208,  pct: 8  },
  { label: "Soft Lead", count: 172,  pct: 6  },
  { label: "Price Drop",count: 57,   pct: 2  },
];

const SPLIT_COLORS = ["#D4300F", "#e05a3a", "#e87a5e", "#ef9a82", "#f4b8a4", "#f8d4c8", "#fbece6"];

function LeadSplit() {
  return (
    <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#f0ece6]">
        <h2 className="text-[13px] font-bold text-[#1c1a17]">Lead Type Breakdown</h2>
      </div>
      <div className="p-4 space-y-2.5">
        {LEAD_SPLIT.map((item, i) => (
          <div key={item.label} className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: SPLIT_COLORS[i] }} />
            <span className="text-[12px] text-[#4a4640] flex-1">{item.label}</span>
            <div className="w-24 h-1.5 bg-[#f0ece6] rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${item.pct}%`, background: SPLIT_COLORS[i] }} />
            </div>
            <span className="text-[11px] font-semibold text-[#7a7670] w-8 text-right">{item.pct}%</span>
            <span className="text-[11px] text-[#c0bab0] w-12 text-right">{item.count.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Quick Stats Row ──────────────────────────────────────────────────────────
function QuickStats() {
  const items = [
    { label: "Active Brands", value: "28" },
    { label: "Car Models", value: "184" },
    { label: "Variants", value: "912" },
    { label: "Active Offers", value: "47" },
    { label: "Admin Users", value: "6" },
    { label: "Ad Campaigns", value: "31" },
    { label: "Page Views Today", value: "18,420" },
    { label: "Searches Today", value: "4,210" },
  ];
  return (
    <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
      {items.map((item) => (
        <div key={item.label} className="bg-white border border-[#e8e4dc] rounded-xl px-3 py-3 text-center">
          <p className="text-[15px] font-black text-[#1c1a17] leading-none">{item.value}</p>
          <p className="text-[9.5px] font-semibold uppercase tracking-wide text-[#a39e96] mt-1 leading-tight">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function Dashboard() {
  return (
    <div className="space-y-5 max-w-[1400px]">

      {/* Page heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-black text-[#1c1a17]">Dashboard</h1>
          <p className="text-[12px] text-[#a39e96] mt-0.5">Welcome back, Admin. Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="cursor-pointer text-[12px] text-[#4a4640] bg-white border border-[#e8e4dc] rounded-lg px-3 py-1.5 outline-none">
            <option>Today</option>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>This month</option>
          </select>
          <button
            className="cursor-pointer text-[12px] font-semibold text-white px-3 py-1.5 rounded-lg transition-opacity hover:opacity-90"
            style={{ background: ACCENT }}
          >
            Export
          </button>
        </div>
      </div>

      {/* Quick stat strip */}
      <QuickStats />

      {/* Main stat cards */}
      <StatCards />

      {/* Recent leads table — full width */}
      <RecentLeads />

      {/* 3-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <TopModels />
        </div>
        <LeadSplit />
      </div>

      {/* Bottom 3-col */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <RecentStories />
        <PendingReviews />
        <ActivityLog />
      </div>

    </div>
  );
}