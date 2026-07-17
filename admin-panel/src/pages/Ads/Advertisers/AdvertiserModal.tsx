// src/pages/Ads/Advertisers/AdvertiserModal.tsx
import { useEffect, useRef, useState } from "react";
import {
  useCreateAdvertiserMutation,
  useUpdateAdvertiserMutation,
  type AdvertiserRecord,
} from "./advertiser.api";
import { extractApiError } from "../../../lib/apiClient";

const ACCENT = "#D4300F";

interface FieldErrors {
  name?: string;
  contactName?: string;
  contactMobile?: string;
  contactEmail?: string;
}

function RequiredMark() {
  return <span className="text-[#D4300F]">*</span>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1.5">
        {label} {required && <RequiredMark />}
      </label>
      {children}
    </div>
  );
}

function TextField({
  value,
  onChange,
  placeholder,
  error,
  inputRef,
  maxLength,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  maxLength?: number;
  type?: string;
}) {
  return (
    <div>
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
        style={{
          borderColor: error ? "#f0997b" : "#e2ddd5",
          boxShadow: error ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
        }}
      />
      {error && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{error}</p>}
    </div>
  );
}

// Thin wrapper — only mounts the actual form when `open` is true, and
// remounts it (via `key`) whenever the target advertiser changes. This
// is what lets AdvertiserModalForm read its starting values straight
// from props during initial render instead of pushing them in from a
// useEffect after the fact, which is what was causing React's
// "setState synchronously within an effect" warning (cascading
// renders). See https://react.dev/learn/you-might-not-need-an-effect
// — "Adjusting state when a prop changes" — remounting via key is the
// documented fix for exactly this situation.
export default function AdvertiserModal({
  open,
  onClose,
  advertiser,
}: {
  open: boolean;
  onClose: () => void;
  // Present -> edit mode. Absent/null -> create mode.
  advertiser?: AdvertiserRecord | null;
}) {
  if (!open) return null;
  return (
    <AdvertiserModalForm key={advertiser?.id ?? "new"} onClose={onClose} advertiser={advertiser ?? null} />
  );
}

function AdvertiserModalForm({
  onClose,
  advertiser,
}: {
  onClose: () => void;
  advertiser: AdvertiserRecord | null;
}) {
  const isEditMode = !!advertiser;

  // Initial values come directly from props (lazy initializer runs once,
  // on mount) — no effect needed to "sync" them in afterward.
  const [name, setName] = useState(advertiser?.name ?? "");
  const [contactName, setContactName] = useState(advertiser?.contactName ?? "");
  const [contactMobile, setContactMobile] = useState(advertiser?.contactMobile ?? "");
  const [contactEmail, setContactEmail] = useState(advertiser?.contactEmail ?? "");
  const [isActive, setIsActive] = useState(advertiser?.isActive ?? true);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const [createAdvertiser, { isLoading: creating }] = useCreateAdvertiserMutation();
  const [updateAdvertiser, { isLoading: updating }] = useUpdateAdvertiserMutation();
  const saving = creating || updating;

  // Focus only — no setState here, so this doesn't trigger the same
  // warning (external-system side effect, exactly what effects are for).
  useEffect(() => {
    const focusTimer = setTimeout(() => nameRef.current?.focus(), 50);
    return () => clearTimeout(focusTimer);
  }, []);

  // Strips anything outside the backend's allowed charset (digits,
  // +, -, space) as the admin types, instead of only catching it on
  // submit — same allowed set as the /^[0-9+\-\s]+$/ check in validate().
  const handleMobileChange = (value: string) => {
    setContactMobile(value.replace(/[^0-9+\-\s]/g, ""));
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};

    if (name.trim().length < 2) next.name = "Name must be at least 2 characters.";

    if (!contactName.trim()) next.contactName = "Contact person is required.";

    if (!contactMobile.trim()) {
      next.contactMobile = "Contact mobile is required.";
    } else if (!/^[0-9+\-\s]+$/.test(contactMobile.trim())) {
      next.contactMobile = "Enter a valid phone number.";
    }

    if (!contactEmail.trim()) {
      next.contactEmail = "Contact email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
      next.contactEmail = "Enter a valid email address.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    const payload = {
      name: name.trim(),
      contactName: contactName.trim(),
      contactMobile: contactMobile.trim(),
      contactEmail: contactEmail.trim(),
      isActive,
    };

    try {
      if (isEditMode && advertiser) {
        await updateAdvertiser({ id: advertiser.id, input: payload }).unwrap();
      } else {
        await createAdvertiser(payload).unwrap();
      }
      // No manual resetForm() needed — closing unmounts this component
      // entirely (the parent flips `open` to false), so its state is
      // thrown away for free. Reopening later mounts a brand-new
      // instance via the key-based remount above.
      onClose();
    } catch (err) {
      setServerError(extractApiError(err));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[440px] bg-white border border-[#e8e4dc] rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h2 className="text-[#1c1a17] text-lg font-black">
              {isEditMode ? "Edit advertiser" : "Add advertiser"}
            </h2>
            <p className="text-[#a39e96] text-xs mt-1">
              {isEditMode ? `Update details for ${advertiser?.name}` : "Add a new advertiser / client"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer text-[#c0bab0] hover:text-[#1c1a17] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-5 space-y-4" noValidate>
          <Field label="Company / Advertiser name" required>
            <TextField
              value={name}
              onChange={setName}
              placeholder="e.g. Bridgestone Tyres"
              error={errors.name}
              inputRef={nameRef}
              maxLength={150}
            />
          </Field>

          <Field label="Contact person" required>
            <TextField
              value={contactName}
              onChange={setContactName}
              placeholder="e.g. Rajesh Kumar"
              error={errors.contactName}
              maxLength={100}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact mobile" required>
              <TextField
                value={contactMobile}
                onChange={handleMobileChange}
                placeholder="e.g. 9876543210"
                error={errors.contactMobile}
                maxLength={15}
              />
            </Field>
            <Field label="Contact email" required>
              <TextField
                value={contactEmail}
                onChange={setContactEmail}
                placeholder="e.g. rajesh@brand.com"
                error={errors.contactEmail}
                maxLength={150}
                type="email"
              />
            </Field>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer text-[12px] font-semibold text-[#4a4640] pt-1">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="cursor-pointer accent-[#D4300F]"
            />
            Active
          </label>

          {serverError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
              <p className="text-red-500 text-xs font-medium">{serverError}</p>
            </div>
          )}

          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer flex-1 py-2.5 rounded-xl text-sm font-bold text-[#4a4640] border border-[#e2ddd5] hover:bg-[#f7f5f1] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="cursor-pointer flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: ACCENT }}
            >
              {saving ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Saving...
                </>
              ) : isEditMode ? (
                "Save changes"
              ) : (
                "Create advertiser"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}