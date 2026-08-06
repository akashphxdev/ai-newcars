// src/pages/Seo/SeoRedirects/SeoRedirectModal.tsx
import { useEffect, useRef, useState } from "react";
import {
  useCreateSeoRedirectMutation,
  useUpdateSeoRedirectMutation,
  type SeoRedirectRecord,
  type RedirectType,
} from "./seoRedirect.api";
import { extractApiError } from "../../../lib/apiClient";

const ACCENT = "#D4300F";

interface FieldErrors {
  oldPath?: string;
  newPath?: string;
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
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  maxLength?: number;
}) {
  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white font-mono"
        style={{
          borderColor: error ? "#f0997b" : "#e2ddd5",
          boxShadow: error ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
        }}
      />
      {error && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{error}</p>}
    </div>
  );
}

const selectClass =
  "cursor-pointer w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white";

// Thin wrapper — only mounts the actual form when `open` is true, and
// remounts it (via `key`) whenever the target redirect changes. Same
// "remount instead of sync-in-effect" convention as PlacementModal.tsx.
export default function SeoRedirectModal({
  open,
  onClose,
  redirect,
}: {
  open: boolean;
  onClose: () => void;
  // Present -> edit mode. Absent/null -> create mode.
  redirect?: SeoRedirectRecord | null;
}) {
  if (!open) return null;
  return <SeoRedirectModalForm key={redirect?.id ?? "new"} onClose={onClose} redirect={redirect ?? null} />;
}

function SeoRedirectModalForm({
  onClose,
  redirect,
}: {
  onClose: () => void;
  redirect: SeoRedirectRecord | null;
}) {
  const isEditMode = !!redirect;

  const [oldPath, setOldPath] = useState(redirect?.oldPath ?? "");
  const [newPath, setNewPath] = useState(redirect?.newPath ?? "");
  const [redirectType, setRedirectType] = useState<RedirectType>(redirect?.redirectType ?? 301);
  const [isActive, setIsActive] = useState(redirect?.isActive ?? true);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const oldPathRef = useRef<HTMLInputElement>(null);

  const [createSeoRedirect, { isLoading: creating }] = useCreateSeoRedirectMutation();
  const [updateSeoRedirect, { isLoading: updating }] = useUpdateSeoRedirectMutation();
  const saving = creating || updating;

  useEffect(() => {
    const focusTimer = setTimeout(() => oldPathRef.current?.focus(), 50);
    return () => clearTimeout(focusTimer);
  }, []);

  const normalizePath = (v: string) => {
    const trimmed = v.trim();
    if (!trimmed) return trimmed;
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    const oldTrimmed = normalizePath(oldPath);
    const newTrimmed = normalizePath(newPath);

    if (!oldTrimmed) next.oldPath = "Old path is required.";
    if (!newTrimmed) next.newPath = "New path is required.";
    if (oldTrimmed && newTrimmed && oldTrimmed === newTrimmed) {
      next.newPath = "New path must be different from old path.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    const payload = {
      oldPath: normalizePath(oldPath),
      newPath: normalizePath(newPath),
      redirectType,
      isActive,
    };

    try {
      if (isEditMode && redirect) {
        await updateSeoRedirect({ id: redirect.id, input: payload }).unwrap();
      } else {
        await createSeoRedirect(payload).unwrap();
      }
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
      <div className="w-full max-w-[480px] bg-white border border-[#e8e4dc] rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h2 className="text-[#1c1a17] text-lg font-black">{isEditMode ? "Edit redirect" : "Add redirect"}</h2>
            <p className="text-[#a39e96] text-xs mt-1">
              {isEditMode ? `Update where "${redirect?.oldPath}" points to` : "Send visitors from an old URL to a new one"}
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
          <Field label="Old path" required>
            <TextField
              value={oldPath}
              onChange={setOldPath}
              placeholder="/old-page-url"
              error={errors.oldPath}
              inputRef={oldPathRef}
              maxLength={255}
            />
            <p className="text-[10px] text-[#a39e96] mt-1">The URL that no longer exists — visitors hitting this get redirected.</p>
          </Field>

          <Field label="New path" required>
            <TextField value={newPath} onChange={setNewPath} placeholder="/new-page-url" error={errors.newPath} maxLength={255} />
          </Field>

          <Field label="Redirect type" required>
            <select value={redirectType} onChange={(e) => setRedirectType(Number(e.target.value) as RedirectType)} className={selectClass}>
              <option value={301}>301 — Permanent</option>
              <option value={302}>302 — Temporary</option>
            </select>
            <p className="text-[10px] text-[#a39e96] mt-1">
              {redirectType === 301 ? "Search engines transfer ranking to the new URL." : "Use only for short-term changes."}
            </p>
          </Field>

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
                "Create redirect"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
