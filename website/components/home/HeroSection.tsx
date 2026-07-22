"use client";
import { useState, useEffect, useRef } from "react";

const heroSlides = [
  // {
  //   type: "video",
  //   src: "/video/herovideo.mp4",
  //   headline: "YOUR NEXT DRIVE\nSTARTS HERE.",
  //   model: "CARS_BEST_SEEKER",
  //   sub: "Exclusive deep-dive previews, performance analyses, and bespoke early access. Elevate your drive.",
  // },
  {
    type: "image",
    src: "https://s7ap1.scene7.com/is/image/tatamotors/new-punch-inner-banner-new?$B-1920-667-D$&fit=crop&fmt=webp",
    headline: "DISCOVER YOUR PRIME,\nEXPERIENTIAL DRIVE.",
    model: "AETHEL_EV S1.",
    sub: "Exclusive deep-dive previews, performance analyses, and bespoke early access. Elevate your drive.",
  },
  // {
  //   type: "image",
  //   src: "https://www.hyundai.com/content/dam/hyundai/in/en/images/home/banner/exter-home-newpc-banner.jpg",
  //   headline: "POWER MEETS\nELEGANCE.",
  //   model: "NOVA_GT PRO.",
  //   sub: "Zero-emission performance redefined. Book your exclusive test drive today in Jaipur.",
  // },
  {
    type: "image",
    src: "https://s7ap1.scene7.com/is/image/tatamotors/desktop-tiago-new?$BA-1920-925-D$&fit=crop&fmt=avif-alpha",
    headline: "THE FUTURE\nARRIVES NOW.",
    model: "SOLARIS X7.",
    sub: "Autonomous-ready, AI-integrated, and crafted for tomorrow's roads. Experience it first.",
  },
  // {
  //   type: "image",
  //   src: "https://www.hyundai.com/content/dam/hyundai/in/en/data/find-a-car/Creta/Highlights/home/cretakingknightinnerkv-pc.jpg",
  //   headline: "BUILT FOR THE\nOPEN ROAD.",
  //   model: "TERRAIN_X OFFROAD.",
  //   sub: "All-terrain capability meets refined comfort. Engineered for every journey, on or off the map.",
  // },
  {
    type: "image",
    src: "https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=1920&auto=format&fit=crop",
    headline: "SPEED HAS A\nNEW SIGNATURE.",
    model: "VELOCE_R TURBO.",
    sub: "Track-tuned performance with everyday drivability. Feel every horsepower the moment you press start.",
  },
  {
    type: "image",
    src: "https://www.kia.com/content/dam/kia2/in/en/images/our-vehicles/syros_ev/main_d.png",
    headline: "LUXURY,\nREIMAGINED.",
    model: "AURELIA GRAND.",
    sub: "Handcrafted interiors, whisper-quiet cabins, and effortless power. This is what arriving feels like.",
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

const ORANGE = "#f2650f";
const ORANGE_HOVER = "#d9560a";
const DARK = "#111827";

export default function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(true);
  const [budget, setBudget] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [carTab, setCarTab] = useState("new");

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
    <section className="relative w-full overflow-hidden font-body" style={{ minHeight: 560, background: DARK }}>
      <div className="h-160 sm:h-[88vh]" />
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
        <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${DARK}eb, ${DARK}73, transparent)` }} />
        <div className="absolute inset-0" style={{ background: `linear-gradient(0deg, ${DARK}cc, transparent, transparent)` }} />
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(242,101,15,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(242,101,15,0.5) 1px,transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
      </div>

      {/* LEFT COLUMN */}
      <div className="absolute left-0 top-0 h-full w-full md:w-[58%] flex flex-col justify-center z-10 px-4 sm:px-4 md:px-[max(1rem,calc((100vw-80rem)/2+1rem))]">
        <div className={`transition-opacity duration-400 mb-8 ${fade ? "opacity-100" : "opacity-0"}`}>
          <p className="text-[10px] tracking-[0.4em] uppercase mb-3 font-semibold" style={{ color: ORANGE }}>
            AI Integrated Experience
          </p>
          <h1 className="font-head text-3xl md:text-[2.4rem] lg:text-[2.8rem] font-bold text-white leading-tight mb-1 tracking-tight">
            {slide.headline.split("\n").map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </h1>
          <h2 className="font-head text-lg md:text-xl font-extrabold mb-3" style={{ color: ORANGE }}>
            {slide.model}
          </h2>
          <p className="text-[13px] text-[#c7ccd6] leading-relaxed mb-6 max-w-lg">{slide.sub}</p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-2xl">
          <div className="flex gap-2">
            <button
              onClick={() => setCarTab("new")}
              className="px-8 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all"
              style={
                carTab === "new"
                  ? { background: ORANGE, color: "#fff" }
                  : { background: "rgba(255,255,255,0.06)", color: "#9aa1ad", border: "1px solid rgba(255,255,255,0.12)" }
              }
              onMouseEnter={(e) => {
                if (carTab !== "new") e.currentTarget.style.color = "#f4f5f9";
              }}
              onMouseLeave={(e) => {
                if (carTab !== "new") e.currentTarget.style.color = "#9aa1ad";
              }}
            >
              New Car
            </button>
            <button
              onClick={() => setCarTab("used")}
              className="px-8 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all"
              style={
                carTab === "used"
                  ? { background: ORANGE, color: "#fff" }
                  : { background: "rgba(255,255,255,0.06)", color: "#9aa1ad", border: "1px solid rgba(255,255,255,0.12)" }
              }
              onMouseEnter={(e) => {
                if (carTab !== "used") e.currentTarget.style.color = "#f4f5f9";
              }}
              onMouseLeave={(e) => {
                if (carTab !== "used") e.currentTarget.style.color = "#9aa1ad";
              }}
            >
              Used Car
            </button>
          </div>

          <div
            className="backdrop-blur-xl rounded-2xl p-2 flex flex-col sm:flex-row sm:items-center gap-2 w-full shadow-2xl"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            <div className="relative flex-1 w-full">
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full appearance-none text-sm sm:text-base font-medium rounded-xl pl-5 pr-9 py-3 sm:py-4 outline-none cursor-pointer transition-all"
                style={{
                  background: "rgba(17,24,39,0.5)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.8)",
                  backgroundImage: "none",
                }}
              >
                {budgetOptions.map((o) => (
                  <option key={o.value} value={o.value} style={{ background: DARK, color: "#fff" }}>
                    {o.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: "#9aa1ad" }}>
                ▼
              </span>
            </div>

            <div className="hidden sm:block w-px h-9 flex-shrink-0" style={{ background: "rgba(255,255,255,0.12)" }} />

            <div className="relative flex-1 w-full">
              <select
                value={bodyType}
                onChange={(e) => setBodyType(e.target.value)}
                className="w-full appearance-none text-sm sm:text-base font-medium rounded-xl pl-5 pr-9 py-3 sm:py-4 outline-none cursor-pointer transition-all"
                style={{
                  background: "rgba(17,24,39,0.5)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.8)",
                  backgroundImage: "none",
                }}
              >
                {bodyOptions.map((o) => (
                  <option key={o.value} value={o.value} style={{ background: DARK, color: "#fff" }}>
                    {o.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: "#9aa1ad" }}>
                ▼
              </span>
            </div>

            <button
              onClick={handleSearch}
              className="w-full sm:w-auto flex-shrink-0 text-white font-bold text-sm sm:text-base px-8 py-3.5 sm:py-4 rounded-xl transition-all tracking-wide shadow-lg"
              style={{ background: ORANGE }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ORANGE_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.background = ORANGE)}
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
            style={i === current ? { background: ORANGE } : {}}
          />
        ))}
      </div>
    </section>
  );
}