"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { signupRequestOtp, signupVerifyOtp, loginRequestOtp, loginVerifyOtp, resendOtp } from "@/features/auth/auth.api";

const ORANGE = "#f2650f";
const DARK = "#111827";
const MUTED = "#6b7280";
const FAINT = "#9ca3af";
const BORDER = "#e5e7eb";
const SURFACE = "#ffffff";

function getErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return "Something went wrong. Please try again.";
}

type Tab = "login" | "signup";
type Step = "form" | "otp";

const ErrorText = ({ message }: { message: string }) => {
  if (!message) return null;
  return (
    <p className="text-xs font-medium" style={{ color: "#ef4444" }}>
      {message}
    </p>
  );
};

const SubmitButton = ({ loading, label, loadingLabel }: { loading: boolean; label: string; loadingLabel: string }) => (
  <button
    type="submit"
    disabled={loading}
    className="rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
    style={{ background: ORANGE }}
  >
    {loading ? loadingLabel : label}
  </button>
);

// Login: just a mobile number — matches User.mobile being the account's
// unique identifier. Signup additionally collects name + email, since
// the OTP itself always goes to email (see admin-backend's auth.service
// for why the OTP row binds mobile+email together rather than trusting
// whatever email a verify request claims).
function LoginPane({ onSuccess }: { onSuccess: (token: string) => void }) {
  const [step, setStep] = useState<Step>("form");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  useEffect(() => () => clearInterval(timerRef.current!), []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (mobile.length !== 10) { setError("Enter a valid 10-digit mobile number."); return; }
    setLoading(true);
    try {
      const res = await loginRequestOtp({ mobile });
      setMaskedEmail(res.maskedEmail);
      setStep("otp");
      startTimer();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) { setError("Enter the 6-digit OTP."); return; }
    setLoading(true);
    try {
      const res = await loginVerifyOtp({ mobile, otp });
      onSuccess(res.token);
    } catch (err) {
      setError(getErrorMessage(err));
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await resendOtp({ mobile, purpose: "login" });
      setOtp("");
      startTimer();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (step === "form") {
    return (
      <form onSubmit={handleSendOtp} className="flex flex-col gap-3">
        <div className="flex items-center gap-2 rounded-lg px-3 py-2.5" style={{ border: `1px solid ${BORDER}` }}>
          <span className="text-sm font-medium" style={{ color: MUTED }}>+91</span>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
            placeholder="Mobile number"
            autoFocus
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: DARK }}
          />
        </div>
        <ErrorText message={error} />
        <SubmitButton loading={loading} label="Send OTP" loadingLabel="Sending..." />
      </form>
    );
  }

  return (
    <form onSubmit={handleVerify} className="flex flex-col gap-3">
      <p className="text-xs" style={{ color: MUTED }}>
        OTP sent to <span className="font-semibold" style={{ color: DARK }}>{maskedEmail}</span>{" "}
        <button type="button" onClick={() => setStep("form")} className="font-semibold" style={{ color: ORANGE }}>
          Change
        </button>
      </p>
      <input
        type="text"
        inputMode="numeric"
        maxLength={6}
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
        placeholder="Enter OTP"
        autoFocus
        className="w-full rounded-lg px-3 py-2.5 text-center text-sm tracking-[0.3em] outline-none"
        style={{ border: `1px solid ${BORDER}`, color: DARK }}
      />
      <ErrorText message={error} />
      <SubmitButton loading={loading} label="Verify" loadingLabel="Verifying..." />
      <p className="text-center text-xs" style={{ color: MUTED }}>
        {resendTimer > 0 ? (
          <>Resend OTP in {resendTimer}s</>
        ) : (
          <button type="button" onClick={handleResend} className="font-semibold" style={{ color: ORANGE }}>
            Resend OTP
          </button>
        )}
      </p>
    </form>
  );
}

function SignupPane({ onSuccess }: { onSuccess: (token: string) => void }) {
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  useEffect(() => () => clearInterval(timerRef.current!), []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Name is required."); return; }
    if (mobile.length !== 10) { setError("Enter a valid 10-digit mobile number."); return; }
    if (!email.trim()) { setError("Email is required."); return; }
    setLoading(true);
    try {
      const res = await signupRequestOtp({ name: name.trim(), mobile, email: email.trim().toLowerCase() });
      setMaskedEmail(res.maskedEmail);
      setStep("otp");
      startTimer();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) { setError("Enter the 6-digit OTP."); return; }
    setLoading(true);
    try {
      const res = await signupVerifyOtp({ name: name.trim(), mobile, otp });
      onSuccess(res.token);
    } catch (err) {
      setError(getErrorMessage(err));
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await resendOtp({ mobile, purpose: "signup" });
      setOtp("");
      startTimer();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (step === "form") {
    return (
      <form onSubmit={handleSendOtp} className="flex flex-col gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          autoFocus
          className="rounded-lg px-3 py-2.5 text-sm outline-none"
          style={{ border: `1px solid ${BORDER}`, color: DARK }}
        />
        <div className="flex items-center gap-2 rounded-lg px-3 py-2.5" style={{ border: `1px solid ${BORDER}` }}>
          <span className="text-sm font-medium" style={{ color: MUTED }}>+91</span>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
            placeholder="Mobile number"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: DARK }}
          />
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className="rounded-lg px-3 py-2.5 text-sm outline-none"
          style={{ border: `1px solid ${BORDER}`, color: DARK }}
        />
        <p className="text-[11px]" style={{ color: FAINT }}>We&apos;ll send a one-time code to this email.</p>
        <ErrorText message={error} />
        <SubmitButton loading={loading} label="Send OTP" loadingLabel="Sending..." />
      </form>
    );
  }

  return (
    <form onSubmit={handleVerify} className="flex flex-col gap-3">
      <p className="text-xs" style={{ color: MUTED }}>
        OTP sent to <span className="font-semibold" style={{ color: DARK }}>{maskedEmail}</span>{" "}
        <button type="button" onClick={() => setStep("form")} className="font-semibold" style={{ color: ORANGE }}>
          Change
        </button>
      </p>
      <input
        type="text"
        inputMode="numeric"
        maxLength={6}
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
        placeholder="Enter OTP"
        autoFocus
        className="w-full rounded-lg px-3 py-2.5 text-center text-sm tracking-[0.3em] outline-none"
        style={{ border: `1px solid ${BORDER}`, color: DARK }}
      />
      <ErrorText message={error} />
      <SubmitButton loading={loading} label="Verify & Create Account" loadingLabel="Verifying..." />
      <p className="text-center text-xs" style={{ color: MUTED }}>
        {resendTimer > 0 ? (
          <>Resend OTP in {resendTimer}s</>
        ) : (
          <button type="button" onClick={handleResend} className="font-semibold" style={{ color: ORANGE }}>
            Resend OTP
          </button>
        )}
      </p>
    </form>
  );
}

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("login");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSuccess = (token: string) => {
    localStorage.setItem("user_token", token);
    onClose();
    window.location.reload();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm rounded-xl p-6" style={{ background: SURFACE }} onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <div className="flex gap-1 rounded-lg p-1" style={{ background: "#f4f5f9" }}>
            {(["login", "signup"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className="rounded-md px-3.5 py-1.5 text-sm font-bold capitalize transition-colors"
                style={tab === t ? { background: SURFACE, color: DARK, boxShadow: "0 1px 2px rgba(17,24,39,0.08)" } : { color: MUTED }}
              >
                {t === "login" ? "Log in" : "Sign up"}
              </button>
            ))}
          </div>
          <button onClick={onClose} aria-label="Close" style={{ color: FAINT }}>
            <svg className="size-5" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {tab === "login" ? <LoginPane onSuccess={handleSuccess} /> : <SignupPane onSuccess={handleSuccess} />}
      </div>
    </div>
  );
}
