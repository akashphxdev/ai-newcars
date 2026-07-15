"use client";
import { useState, useEffect, useRef } from "react";

const heroSlides = [
  {
    type: "video",
    src: "/video/herovideo.mp4",
    headline: "YOUR NEXT DRIVE\nSTARTS HERE.",
    model: "CARS_BEST_SEEKER",
    sub: "Exclusive deep-dive previews, performance analyses, and bespoke early access. Elevate your drive.",
  },
  {
    type: "image",
    src: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1600&q=80",
    headline: "DISCOVER YOUR PRIME,\nEXPERIENTIAL DRIVE.",
    model: "AETHEL_EV S1.",
    sub: "Exclusive deep-dive previews, performance analyses, and bespoke early access. Elevate your drive.",
  },
  {
    type: "image",
    src: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1600&q=80",
    headline: "POWER MEETS\nELEGANCE.",
    model: "NOVA_GT PRO.",
    sub: "Zero-emission performance redefined. Book your exclusive test drive today in Jaipur.",
  },
  {
    type: "image",
    src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80",
    headline: "THE FUTURE\nARRIVES NOW.",
    model: "SOLARIS X7.",
    sub: "Autonomous-ready, AI-integrated, and crafted for tomorrow's roads. Experience it first.",
  },
];

const budgetOptions = [
  { value: "", label: "Select Budget" },
  { value: "u10", label: "Under Rs.10 Lakh" },
  { value: "10-25", label: "Rs.10L - Rs.25L" },
  { value: "25-50", label: "Rs.25L - Rs.50L" },
  { value: "50-100", label: "Rs.50L - Rs.1Cr" },
  { value: "a100", label: "Above Rs.1 Crore" },
];

const bodyOptions = [
  { value: "", label: "Select Body Type" },
  { value: "sedan", label: "Sedan" },
  { value: "suv", label: "SUV" },
  { value: "hatchback", label: "Hatchback" },
  { value: "coupe", label: "Coupe" },
  { value: "mpv", label: "MPV" },
  { value: "convertible", label: "Convertible" },
  { value: "pickup", label: "Pickup Truck" },
];

export default function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(true);
  const [budget, setBudget] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [carTab, setCarTab] = useState("new");

  // ✅ Fix 1: proper types diye
  const videoRef = useRef<HTMLVideoElement>(null);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const slide = heroSlides[current];

  const advance = () => {
    clearInterval(timer.current);
    setFade(false);
    setTimeout(() => {
      setCurrent((p) => (p + 1) % heroSlides.length);
      setFade(true);
    }, 350);
  };

  const startTimer = (idx: number) => {
    clearInterval(timer.current);
    if (heroSlides[idx].type === "image") {
      timer.current = setInterval(advance, 4500);
    }
  };

  useEffect(() => {
    startTimer(0);
    return () => clearInterval(timer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // ✅ Fix 2: videoRef.current ab HTMLVideoElement hai, currentTime exist karta hai
    if (slide.type === "video" && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
    if (slide.type === "image") {
      startTimer(current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const jumpTo = (i: number) => {
    clearInterval(timer.current);
    setFade(false);
    setTimeout(() => {
      setCurrent(i);
      setFade(true);
    }, 300);
  };

  const handleSearch = () => {
    console.log("Search:", { budget, bodyType });
  };

  return (
    <section
      className="relative w-full overflow-hidden bg-[#1c1a17] font-sans"
      style={{ height: "88vh", minHeight: 560 }}
    >
      {/* BACKGROUNDS */}
      <div className={`absolute inset-0 z-0 transition-opacity duration-400 ${fade ? "opacity-100" : "opacity-0"}`}>
        {heroSlides.map((s, i) =>
          s.type === "video" ? (
            <video
              key={i}
              ref={i === 0 ? videoRef : null}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-400 ${
                i === current ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
              src={s.src}
              autoPlay
              muted
              playsInline
              onEnded={advance}
            />
          ) : (
            <img
              key={i}
              src={s.src}
              alt={s.model}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-400 ${
                i === current ? "opacity-100" : "opacity-0"
              }`}
            />
          )
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1c1a17]/92 via-[#1c1a17]/45 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1c1a17]/80 via-transparent to-transparent" />
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(212,48,15,0.4) 1px,transparent 1px),linear-gradient(90deg,rgba(212,48,15,0.4) 1px,transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
      </div>

      {/* LEFT COLUMN */}
      <div className="absolute left-0 top-0 h-full w-full md:w-[58%] flex flex-col justify-center z-10 px-4 sm:px-4 md:px-[max(1rem,calc((100vw-80rem)/2+1rem))]">
        <div className={`transition-opacity duration-400 mb-8 ${fade ? "opacity-100" : "opacity-0"}`}>
          <p className="text-[10px] tracking-[0.4em] uppercase mb-3 font-semibold" style={{ color: "#D4300F" }}>
            AI Integrated Experience
          </p>
          <h1 className="text-3xl md:text-[2.4rem] lg:text-[2.8rem] font-extrabold text-white leading-tight mb-1 tracking-tight">
            {slide.headline.split("\n").map((line, i) => (
              <span key={i} className="block">{line}</span>
            ))}
          </h1>
          <h2 className="text-lg md:text-xl font-extrabold mb-3" style={{ color: "#D4300F" }}>
            {slide.model}
          </h2>
          <p className="text-[13px] text-[#c0bab0] leading-relaxed mb-6 max-w-lg">
            {slide.sub}
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-2xl">
          <div className="flex gap-2">
            <button
              onClick={() => setCarTab("new")}
              className="px-8 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all"
              style={
                carTab === "new"
                  ? { background: "#D4300F", color: "#fff" }
                  : { background: "rgba(44,42,39,0.70)", color: "#c0bab0", border: "1px solid rgba(232,228,220,0.15)" }
              }
              onMouseEnter={(e) => { if (carTab !== "new") e.currentTarget.style.color = "#f7f5f1"; }}
              onMouseLeave={(e) => { if (carTab !== "new") e.currentTarget.style.color = "#c0bab0"; }}
            >
              New Car
            </button>
            <button
              onClick={() => setCarTab("used")}
              className="px-8 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all"
              style={
                carTab === "used"
                  ? { background: "#D4300F", color: "#fff" }
                  : { background: "rgba(44,42,39,0.70)", color: "#c0bab0", border: "1px solid rgba(232,228,220,0.15)" }
              }
              onMouseEnter={(e) => { if (carTab !== "used") e.currentTarget.style.color = "#f7f5f1"; }}
              onMouseLeave={(e) => { if (carTab !== "used") e.currentTarget.style.color = "#c0bab0"; }}
            >
              Used Car
            </button>
          </div>

          <div className="bg-[#2c2a27]/70 backdrop-blur-xl border border-[#e8e4dc]/15 rounded-2xl p-2 flex items-center gap-2 w-full shadow-2xl">
            <div className="relative flex-1">
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full appearance-none bg-[#1c1a17]/60 border border-[#e8e4dc]/12 text-[#f7f5f1]/80 text-base font-medium rounded-xl pl-5 pr-9 py-4 outline-none cursor-pointer transition-all hover:text-[#f7f5f1]"
                style={{ backgroundImage: "none" }}
              >
                {budgetOptions.map((o) => (
                  <option key={o.value} value={o.value} className="bg-[#2c2a27] text-white">
                    {o.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#a39e96] text-[10px]">▼</span>
            </div>

            <div className="w-px h-9 bg-[#e8e4dc]/15 flex-shrink-0" />

            <div className="relative flex-1">
              <select
                value={bodyType}
                onChange={(e) => setBodyType(e.target.value)}
                className="w-full appearance-none bg-[#1c1a17]/60 border border-[#e8e4dc]/12 text-[#f7f5f1]/80 text-base font-medium rounded-xl pl-5 pr-9 py-4 outline-none cursor-pointer transition-all hover:text-[#f7f5f1]"
                style={{ backgroundImage: "none" }}
              >
                {bodyOptions.map((o) => (
                  <option key={o.value} value={o.value} className="bg-[#2c2a27] text-white">
                    {o.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#a39e96] text-[10px]">▼</span>
            </div>

            <button
              onClick={handleSearch}
              className="flex-shrink-0 text-white font-bold text-base px-8 py-4 rounded-xl transition-all tracking-wide shadow-lg"
              style={{ background: "#D4300F" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#b82a0c")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#D4300F")}
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* SLIDE DOTS */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => jumpTo(i)}
            className={`rounded-full transition-all duration-300 ${
              i === current ? "w-6 h-2" : "w-2 h-2 bg-white/30 hover:bg-white/60"
            }`}
            style={i === current ? { background: "#D4300F" } : {}}
          />
        ))}
      </div>
    </section>
  );
}