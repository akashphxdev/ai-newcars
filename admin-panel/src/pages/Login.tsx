

import { useState, useRef, useEffect, useCallback } from "react";
import { useLoginMutation, useVerifyOtpMutation, useResendOtpMutation } from "../lib/auth.api";

function getErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string" && msg) return msg;
  }
  return "Something went wrong. Please try again.";
}

// ─── UI constants ─────────────────────────────────────────────────────────────

const ACCENT = "#D4300F";

// ─── Shared Components ────────────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" className="shrink-0">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p className="text-red-500 text-xs font-medium">{message}</p>
    </div>
  );
}

function SubmitButton({ loading, label, loadingLabel }: {
  loading: boolean;
  label: string;
  loadingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
      style={{ background: ACCENT }}
    >
      {loading ? (
        <>
          <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          {loadingLabel}
        </>
      ) : label}
    </button>
  );
}

// ─── Step 1: Login Form ───────────────────────────────────────────────────────

interface LoginFormProps {
  onSuccess: (adminId: number, maskedMobile: string) => void;
}

function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);

  const [login, { isLoading: loading }] = useLoginMutation();

  useEffect(() => { emailRef.current?.focus(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Email is required."); return; }
    if (!password) { setError("Password is required."); return; }

    try {
      const data = await login({ email: email.trim().toLowerCase(), password }).unwrap();
      onSuccess(data.adminId, data.maskedMobile);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-[#1c1a17] text-lg font-black">Sign in</h2>
        <p className="text-[#a39e96] text-xs mt-1">Enter your credentials to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1.5">Email</label>
          <div className="flex items-center gap-2 rounded-xl border border-[#e2ddd5] bg-[#f7f5f1] px-3 py-2.5 focus-within:border-[#D4300F] focus-within:ring-2 focus-within:ring-[#D4300F]/10 focus-within:bg-white transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c0bab0" strokeWidth="1.5" className="shrink-0">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <input
              ref={emailRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@timesauto.in"
              autoComplete="email"
              className="flex-1 bg-transparent text-sm font-medium text-[#1c1a17] outline-none placeholder:text-[#c0bab0]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1.5">Password</label>
          <div className="flex items-center gap-2 rounded-xl border border-[#e2ddd5] bg-[#f7f5f1] px-3 py-2.5 focus-within:border-[#D4300F] focus-within:ring-2 focus-within:ring-[#D4300F]/10 focus-within:bg-white transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c0bab0" strokeWidth="1.5" className="shrink-0">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="flex-1 bg-transparent text-sm font-medium text-[#1c1a17] outline-none placeholder:text-[#c0bab0]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label="Toggle password"
              className="text-[#c0bab0] hover:text-[#7a7670] transition-colors"
            >
              {showPassword ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <ErrorBanner message={error} />
        <SubmitButton loading={loading} label="Continue" loadingLabel="Please wait..." />
      </form>
    </>
  );
}

// ─── Step 2: OTP Form ─────────────────────────────────────────────────────────

interface OtpFormProps {
  adminId: number;
  maskedMobile: string;
  onBack: () => void;
  onSuccess: () => void;
}

function OtpForm({ adminId, maskedMobile, onBack, onSuccess }: OtpFormProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [verifyOtp, { isLoading: loading }] = useVerifyOtpMutation();
  const [resendOtp] = useResendOtpMutation();

  useEffect(() => { document.getElementById("otp-0")?.focus(); }, []);

  const startTimer = useCallback(() => {
    clearInterval(timerRef.current!);
    setResendTimer(30);
    timerRef.current = setInterval(() => {
      setResendTimer((v) => {
        if (v <= 1) { clearInterval(timerRef.current!); return 0; }
        return v - 1;
      });
    }, 1000);
  }, []);

  // The setState call (setResendTimer, inside startTimer) is queued as a
  // microtask rather than called directly in the effect body — calling
  // setState synchronously in an effect body is what React 19's linter
  // flags as causing cascading renders. Same pattern used in
  // CreateAdminModal.tsx / EditAdminModal.tsx.
  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) startTimer();
    });
    return () => {
      cancelled = true;
      clearInterval(timerRef.current!);
    };
  }, [startTimer]);

  const handleChange = (val: string, idx: number) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0)
      document.getElementById(`otp-${idx - 1}`)?.focus();
  };

  const handleVerify = useCallback(async (digits: string) => {
    setError("");
    if (digits.length < 6) { setError("Please enter the complete 6-digit OTP."); return; }
    try {
      const data = await verifyOtp({ adminId, otp: digits }).unwrap();
      // Backend is Bearer-token based (see src/core/middleware/auth.ts) —
      // apiClient.ts reads this exact key on every request.
      localStorage.setItem("admin_token", data.token);
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err));
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => document.getElementById("otp-0")?.focus(), 0);
    }
  }, [adminId, onSuccess, verifyOtp]);

  useEffect(() => {
    const digits = otp.join("");
    if (digits.length === 6) {
      const timer = setTimeout(() => handleVerify(digits), 0);
      return () => clearTimeout(timer);
    }
  }, [otp, handleVerify]);

  const handleResend = async () => {
    setOtp(["", "", "", "", "", ""]);
    setError("");
    try {
      await resendOtp({ adminId }).unwrap();
      startTimer();
      setTimeout(() => document.getElementById("otp-0")?.focus(), 0);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-[#1c1a17] text-lg font-black">Verify OTP</h2>
        <p className="text-[#a39e96] text-xs mt-1">
          6-digit code sent to <span className="font-semibold text-[#7a7670]">{maskedMobile}</span>
        </p>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); handleVerify(otp.join("")); }} className="space-y-5">
        <div className="flex gap-2.5 justify-between">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              id={`otp-${idx}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              onFocus={(e) => e.target.select()}
              className="w-11 h-12 text-center text-[#1c1a17] text-lg font-bold bg-[#f7f5f1] border border-[#e2ddd5] rounded-xl outline-none transition-all focus:border-[#D4300F] focus:ring-2 focus:ring-[#D4300F]/10 focus:bg-white"
            />
          ))}
        </div>
        <ErrorBanner message={error} />
        <SubmitButton loading={loading} label="Verify & Sign In" loadingLabel="Verifying..." />
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => { onBack(); setError(""); }}
            className="text-[#a39e96] hover:text-[#1c1a17] text-xs font-medium transition-colors flex items-center gap-1"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </button>
          {resendTimer > 0 ? (
            <span className="text-[11px] text-[#c0bab0]">
              Resend in <span className="font-semibold tabular-nums text-[#7a7670]">{resendTimer}s</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="text-xs font-semibold hover:opacity-80 transition-opacity"
              style={{ color: ACCENT }}
            >
              Resend OTP
            </button>
          )}
        </div>
      </form>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [step, setStep] = useState<"login" | "otp">("login");
  const [adminId, setAdminId] = useState<number | null>(null);
  const [maskedMobile, setMaskedMobile] = useState("");

  const handleLoginSuccess = (id: number, mobile: string) => {
    setAdminId(id);
    setMaskedMobile(mobile);
    setStep("otp");
  };

  const handleOtpSuccess = () => {
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen bg-[#f7f5f1] flex items-center justify-center font-['Inter',sans-serif] px-4 py-12">
      <div className="w-full max-w-[400px]">

        <div className="flex flex-col items-center mb-8">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 shadow-md"
            style={{ background: ACCENT }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M18.5 10.5H5.5L3 15H21L18.5 10.5Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
              <circle cx="7" cy="17.5" r="1.5" fill="white" />
              <circle cx="17" cy="17.5" r="1.5" fill="white" />
              <path d="M5.5 10.5L7.5 6H16.5L18.5 10.5" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-[#1c1a17] font-black text-xl tracking-tight">TimesAuto</span>
          <span className="text-[#a39e96] text-xs mt-0.5 font-medium">Admin Portal</span>
        </div>

        <div className="bg-white border border-[#e8e4dc] rounded-2xl p-7 shadow-sm">
          {step === "login" && (
            <LoginForm onSuccess={handleLoginSuccess} />
          )}
          {step === "otp" && adminId !== null && (
            <OtpForm
              adminId={adminId}
              maskedMobile={maskedMobile}
              onBack={() => setStep("login")}
              onSuccess={handleOtpSuccess}
            />
          )}
        </div>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-[#e8e4dc]" />
          <span className="text-[#c0bab0] text-[10px] font-medium tracking-wider uppercase">Authorized access only</span>
          <div className="flex-1 h-px bg-[#e8e4dc]" />
        </div>

        <p className="text-center text-[#c0bab0] text-[11px]">
          © 2025 TimesAuto · All rights reserved
        </p>
      </div>
    </div>
  );
}