// Header.tsx
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/useAuth";

const ACCENT = "#D4300F";

interface HeaderProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const date = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const time = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
  return (
    <div className="hidden md:flex flex-col items-end leading-none gap-0.5">
      <span className="text-[11px] font-semibold text-[#1c1a17] tabular-nums">{time}</span>
      <span className="text-[10px] text-[#a39e96]">{date}</span>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function AdminMenu() {
  const { admin, isLoading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 pl-2 border-l border-[#e8e4dc] px-2 py-1">
        <div className="w-7 h-7 rounded-full bg-[#f0ece6] animate-pulse" />
        <div className="hidden sm:flex flex-col gap-1">
          <div className="w-16 h-2.5 rounded bg-[#f0ece6] animate-pulse" />
          <div className="w-12 h-2 rounded bg-[#f0ece6] animate-pulse" />
        </div>
      </div>
    );
  }

  const displayName = admin?.name ?? "Admin";
  const displayRole = admin?.role?.roleName ?? "—";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="cursor-pointer flex items-center gap-2 pl-2 border-l border-[#e8e4dc] hover:bg-[#f7f5f1] rounded-lg px-2 py-1 transition-colors"
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
          style={{ background: ACCENT }}
        >
          {initials(displayName)}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-[12px] font-semibold text-[#1c1a17] leading-none">{displayName}</p>
          <p className="text-[10px] text-[#a39e96] mt-0.5">{displayRole}</p>
        </div>
        <svg
          width="10" height="10" viewBox="0 0 12 8" fill="none"
          className="text-[#c0bab0] hidden sm:block transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        >
          <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl border border-[#e8e4dc] shadow-lg overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-[#f0ece6] sm:hidden">
            <p className="text-[12px] font-semibold text-[#1c1a17] leading-none">{displayName}</p>
            <p className="text-[10px] text-[#a39e96] mt-1">{displayRole}</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="cursor-pointer w-full flex items-center gap-3 px-4 py-3 text-[12px] text-red-500 hover:bg-red-50 transition-colors text-left disabled:opacity-60"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function Header({ sidebarCollapsed, onToggleSidebar }: HeaderProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header
      className="h-14 bg-white border-b border-[#e8e4dc] flex items-center px-4 gap-3 sticky top-0 z-40"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      <button
        onClick={onToggleSidebar}
        className="cursor-pointer flex items-center justify-center w-8 h-8 rounded-lg border border-[#e4e0d8] text-[#7a7670] hover:bg-[#f7f5f1] transition-colors shrink-0"
        aria-label="Toggle sidebar"
      >
        {sidebarCollapsed ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="15" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        )}
      </button>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[#1c1a17] font-black text-[15px] tracking-tight">TimesAuto</span>
        <span className="text-[10px] font-bold text-[#a39e96] px-1.5 py-0.5 bg-[#f7f5f1] border border-[#e8e4dc] rounded-full">
          Admin
        </span>
      </div>

      <div className="flex-1 max-w-sm ml-2">
        <div className="flex items-center gap-2 bg-[#f7f5f1] border border-[#e8e4dc] rounded-lg px-3 py-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c0bab0" strokeWidth="1.8">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search anything..."
            className="flex-1 bg-transparent text-xs text-[#1c1a17] outline-none placeholder:text-[#c0bab0]"
          />
          <kbd className="hidden sm:inline text-[9px] font-bold text-[#c0bab0] bg-white border border-[#e8e4dc] rounded px-1 py-0.5">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <LiveClock />
        <div className="w-px h-6 bg-[#e8e4dc] mx-1" />

        <button
          onClick={toggleFullscreen}
          className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg border border-[#e4e0d8] text-[#7a7670] hover:bg-[#f7f5f1] transition-colors"
          aria-label="Toggle fullscreen"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M8 3v3a2 2 0 0 1-2 2H3" />
              <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
              <path d="M3 16h3a2 2 0 0 1 2 2v3" />
              <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M8 3H5a2 2 0 0 0-2 2v3" />
              <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
              <path d="M3 16v3a2 2 0 0 0 2 2h3" />
              <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
            </svg>
          )}
        </button>

        <button className="cursor-pointer relative w-8 h-8 flex items-center justify-center rounded-lg border border-[#e4e0d8] text-[#7a7670] hover:bg-[#f7f5f1] transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
        </button>

        <AdminMenu />
      </div>
    </header>
  );
}