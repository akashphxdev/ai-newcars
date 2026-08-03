// src/pages/BuyLeads/Lenders/LenderModal.tsx
import { useRef, useState } from "react";
import { useCreateLenderMutation, useUpdateLenderMutation, useUploadLenderLogoMutation, type LenderRecord } from "./lender.api";
import { extractApiError, getUploadUrl } from "../../../lib/apiClient";

const ACCENT = "#D4300F";

interface FieldErrors {
  name?: string;
  minInterestRate?: string;
  maxInterestRate?: string;
  maxLoanAmount?: string;
  maxTenureYears?: string;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white";

export default function LenderModal({
  open,
  onClose,
  lender,
}: {
  open: boolean;
  onClose: () => void;
  // Present -> edit mode. Absent/null -> create mode.
  lender?: LenderRecord | null;
}) {
  const isEditMode = !!lender;

  const [name, setName] = useState(lender ? lender.name : "");
  const [minInterestRate, setMinInterestRate] = useState(lender?.minInterestRate ?? "");
  const [maxInterestRate, setMaxInterestRate] = useState(lender?.maxInterestRate ?? "");
  const [maxLoanAmount, setMaxLoanAmount] = useState(lender?.maxLoanAmount ?? "");
  const [maxTenureYears, setMaxTenureYears] = useState(lender?.maxTenureYears != null ? String(lender.maxTenureYears) : "");
  const [isActive, setIsActive] = useState(lender ? lender.isActive : true);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");

  const [createLender, { isLoading: creating }] = useCreateLenderMutation();
  const [updateLender, { isLoading: updating }] = useUpdateLenderMutation();
  const saving = creating || updating;

  // Logo is optional here (unlike Brand's mandatory logo) — same upload
  // mechanics as BrandModal otherwise.
  const [uploadLenderLogo, { isLoading: uploadingLogo }] = useUploadLenderLogoMutation();
  const [logoUrl, setLogoUrl] = useState<string | null>(lender?.logoUrl ?? null);
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoSelect = async (file: File | undefined) => {
    if (!file) return;
    setLogoError("");

    if (!isEditMode) {
      setPendingLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      return;
    }

    if (!lender) return;

    const objectUrl = URL.createObjectURL(file);
    setLogoPreview(objectUrl);

    try {
      const result = await uploadLenderLogo({ id: lender.id, file }).unwrap();
      setLogoUrl(result.logoUrl);
    } catch (err) {
      setLogoError(extractApiError(err));
    } finally {
      URL.revokeObjectURL(objectUrl);
      setLogoPreview(null);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setName("");
    setMinInterestRate("");
    setMaxInterestRate("");
    setMaxLoanAmount("");
    setMaxTenureYears("");
    setIsActive(true);
    setErrors({});
    setServerError("");
    setPendingLogoFile(null);
    setLogoPreview(null);
    setLogoError("");
  };

  if (!open) return null;

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (name.trim().length < 2) next.name = "Name must be at least 2 characters.";
    if (minInterestRate !== "" && Number(minInterestRate) < 0) next.minInterestRate = "Must be 0 or more.";
    if (maxInterestRate !== "" && Number(maxInterestRate) < 0) next.maxInterestRate = "Must be 0 or more.";
    if (minInterestRate !== "" && maxInterestRate !== "" && Number(maxInterestRate) < Number(minInterestRate)) {
      next.maxInterestRate = "Must be greater than or equal to min interest rate.";
    }
    if (maxLoanAmount !== "" && Number(maxLoanAmount) < 0) next.maxLoanAmount = "Must be 0 or more.";
    if (maxTenureYears !== "" && (Number(maxTenureYears) < 1 || Number(maxTenureYears) > 30)) {
      next.maxTenureYears = "Must be between 1 and 30.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    try {
      if (isEditMode && lender) {
        await updateLender({
          id: lender.id,
          input: {
            name: name.trim(),
            minInterestRate: minInterestRate === "" ? null : Number(minInterestRate),
            maxInterestRate: maxInterestRate === "" ? null : Number(maxInterestRate),
            maxLoanAmount: maxLoanAmount === "" ? null : Number(maxLoanAmount),
            maxTenureYears: maxTenureYears === "" ? null : Number(maxTenureYears),
            isActive,
          },
        }).unwrap();
      } else {
        await createLender({
          name: name.trim(),
          minInterestRate: minInterestRate === "" ? undefined : Number(minInterestRate),
          maxInterestRate: maxInterestRate === "" ? undefined : Number(maxInterestRate),
          maxLoanAmount: maxLoanAmount === "" ? undefined : Number(maxLoanAmount),
          maxTenureYears: maxTenureYears === "" ? undefined : Number(maxTenureYears),
          isActive,
          logo: pendingLogoFile ?? undefined,
        }).unwrap();
      }
      resetForm();
      onClose();
    } catch (err) {
      setServerError(extractApiError(err));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="w-full max-w-[520px] bg-white border border-[#e8e4dc] rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h2 className="text-[#1c1a17] text-lg font-black">{isEditMode ? "Edit lender" : "Add lender"}</h2>
            <p className="text-[#a39e96] text-xs mt-1">
              {isEditMode ? `Update details for ${lender?.name}` : "Only name is required — fill the rest in whenever you have it."}
            </p>
          </div>
          <button type="button" onClick={handleClose} aria-label="Close" className="cursor-pointer text-[#c0bab0] hover:text-[#1c1a17] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-5 space-y-4" noValidate>
          <div className="flex items-center gap-3 pb-1">
            <div className="w-14 h-14 rounded-xl border bg-[#f7f5f1] overflow-hidden flex items-center justify-center shrink-0" style={{ borderColor: "#e2ddd5" }}>
              {logoPreview || logoUrl ? (
                <img src={logoPreview ?? getUploadUrl(logoUrl) ?? undefined} alt={isEditMode ? `${lender?.name} logo` : "Lender logo preview"} className="w-full h-full object-cover" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c0bab0" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="cursor-pointer text-[11px] font-bold px-3 py-1.5 rounded-lg border border-[#e2ddd5] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors disabled:opacity-50"
              >
                {uploadingLogo ? "Uploading..." : logoUrl || pendingLogoFile ? "Change logo" : "Upload logo (optional)"}
              </button>
              <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(e) => handleLogoSelect(e.target.files?.[0])} className="hidden" />
              <p className="text-[10px] text-[#a39e96] mt-1">JPG, PNG, WEBP or AVIF, up to 2MB.</p>
              {logoError && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{logoError}</p>}
            </div>
          </div>

          <Field label="Name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. HDFC Bank"
              className={inputClass}
              style={{ borderColor: errors.name ? "#f0997b" : "#e2ddd5", boxShadow: errors.name ? "0 0 0 2px rgba(216,90,48,0.1)" : "none" }}
            />
            {errors.name && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.name}</p>}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Min Interest Rate (%)">
              <input
                type="number"
                step="0.01"
                min="0"
                value={minInterestRate}
                onChange={(e) => setMinInterestRate(e.target.value)}
                placeholder="e.g. 8.5"
                className={inputClass}
                style={{ borderColor: errors.minInterestRate ? "#f0997b" : "#e2ddd5" }}
              />
              {errors.minInterestRate && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.minInterestRate}</p>}
            </Field>
            <Field label="Max Interest Rate (%)">
              <input
                type="number"
                step="0.01"
                min="0"
                value={maxInterestRate}
                onChange={(e) => setMaxInterestRate(e.target.value)}
                placeholder="e.g. 12"
                className={inputClass}
                style={{ borderColor: errors.maxInterestRate ? "#f0997b" : "#e2ddd5" }}
              />
              {errors.maxInterestRate && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.maxInterestRate}</p>}
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Max Loan Amount (₹)">
              <input
                type="number"
                step="1"
                min="0"
                value={maxLoanAmount}
                onChange={(e) => setMaxLoanAmount(e.target.value)}
                placeholder="e.g. 5000000"
                className={inputClass}
                style={{ borderColor: errors.maxLoanAmount ? "#f0997b" : "#e2ddd5" }}
              />
              {errors.maxLoanAmount && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.maxLoanAmount}</p>}
            </Field>
            <Field label="Max Tenure (Years)">
              <input
                type="number"
                step="1"
                min="1"
                max="30"
                value={maxTenureYears}
                onChange={(e) => setMaxTenureYears(e.target.value)}
                placeholder="e.g. 7"
                className={inputClass}
                style={{ borderColor: errors.maxTenureYears ? "#f0997b" : "#e2ddd5" }}
              />
              {errors.maxTenureYears && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.maxTenureYears}</p>}
            </Field>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer text-[12px] font-semibold text-[#4a4640] pt-1">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="cursor-pointer accent-[#D4300F]" />
            Active
          </label>

          {serverError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
              <p className="text-red-500 text-xs font-medium">{serverError}</p>
            </div>
          )}

          <div className="flex items-center gap-2.5 pt-1">
            <button type="button" onClick={handleClose} className="cursor-pointer flex-1 py-2.5 rounded-xl text-sm font-bold text-[#4a4640] border border-[#e2ddd5] hover:bg-[#f7f5f1] transition-colors">
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
                "Create lender"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
