// src/pages/Ads/Placements/PlacementModal.tsx
import { useEffect, useRef, useState } from "react";
import {
  useCreateAdPlacementMutation,
  useUpdateAdPlacementMutation,
  type AdPlacementRecord,
} from "./placement.api";
import { extractApiError } from "../../../lib/apiClient";
import { slugify } from "../../../lib/slugify";
import { PAGE_TYPE_OPTIONS, AD_TYPE_OPTIONS } from "../../../lib/lookups";

const ACCENT = "#D4300F";

// Common IAB ad sizes — the dropdown covers the usual cases, and
// "Customize..." drops into a free-text field for anything else.
const PIXEL_SIZE_PRESETS = [
  "300x250",
  "336x280",
  "728x90",
  "970x250",
  "160x600",
  "300x600",
  "320x50",
  "468x60",
];
const CUSTOM_OPTION = "__custom__";

interface FieldErrors {
  name?: string;
  slug?: string;
  pageType?: string;
  adType?: string;
  dimensions?: string;
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

const selectClass =
  "cursor-pointer w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white";

// Thin wrapper — only mounts the actual form when `open` is true, and
// remounts it (via `key`) whenever the target placement changes. This
// is what lets PlacementModalForm read its starting values straight
// from props during initial render instead of pushing them in from a
// useEffect after the fact, which is what was causing React's
// "setState synchronously within an effect" warning (cascading
// renders). See https://react.dev/learn/you-might-not-need-an-effect
// — "Adjusting state when a prop changes" — remounting via key is the
// documented fix for exactly this situation.
export default function PlacementModal({
  open,
  onClose,
  placement,
}: {
  open: boolean;
  onClose: () => void;
  // Present -> edit mode. Absent/null -> create mode.
  placement?: AdPlacementRecord | null;
}) {
  if (!open) return null;
  return (
    <PlacementModalForm key={placement?.id ?? "new"} onClose={onClose} placement={placement ?? null} />
  );
}

function PlacementModalForm({
  onClose,
  placement,
}: {
  onClose: () => void;
  placement: AdPlacementRecord | null;
}) {
  const isEditMode = !!placement;

  // Initial values come directly from props (lazy initializer runs
  // once, on mount) — no effect needed to "sync" them in afterward.
  const [name, setName] = useState(placement?.name ?? "");
  const [slug, setSlug] = useState(placement?.slug ?? "");
  // Tracks whether the admin has manually edited the slug field. While
  // false, the slug keeps auto-syncing with the name. When editing an
  // existing placement we start this as `true` — assume the slug is
  // already deliberate/hardcoded somewhere in the site, so don't
  // silently regenerate it just because the name changes.
  const [slugTouched, setSlugTouched] = useState(isEditMode);
  const [pageType, setPageType] = useState<number | "">(placement?.pageType ?? "");
  const [adType, setAdType] = useState<number | "">(placement?.adType ?? "");
  const [dimensions, setDimensions] = useState(placement?.dimensions ?? "");
  // Preset dropdown by default; drops into free-text if the existing
  // value isn't one of the presets (or the admin picks "Customize...").
  const [dimensionsMode, setDimensionsMode] = useState<"preset" | "custom">(
    placement?.dimensions && !PIXEL_SIZE_PRESETS.includes(placement.dimensions) ? "custom" : "preset",
  );
  const [isActive, setIsActive] = useState(placement?.isActive ?? true);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const [createAdPlacement, { isLoading: creating }] = useCreateAdPlacementMutation();
  const [updateAdPlacement, { isLoading: updating }] = useUpdateAdPlacementMutation();
  const saving = creating || updating;

  // Focus only — no setState here, so this doesn't trigger the same
  // warning (external-system side effect, exactly what effects are for).
  useEffect(() => {
    const focusTimer = setTimeout(() => nameRef.current?.focus(), 50);
    return () => clearTimeout(focusTimer);
  }, []);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugTouched(true);
    setSlug(value);
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};

    if (name.trim().length < 3) next.name = "Name must be at least 3 characters.";

    if (!slug.trim()) {
      next.slug = "Slug is required.";
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
      next.slug = 'Slug must be lowercase letters/numbers separated by hyphens (e.g. "homepage-top-banner").';
    }

    if (pageType === "") next.pageType = "Page type is required.";
    if (adType === "") next.adType = "Ad type is required.";

    if (!dimensions.trim()) {
      next.dimensions = "Dimensions is required.";
    } else if (!/^\d+x\d+$/.test(dimensions.trim())) {
      next.dimensions = 'Dimensions must be in WIDTHxHEIGHT format (e.g. "970x250").';
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
      // Always the literal value shown on screen — whether it came
      // from auto-sync or a manual edit — so what's displayed is
      // exactly what gets saved.
      slug: slug.trim(),
      pageType: pageType as number,
      adType: adType as number,
      dimensions: dimensions.trim(),
      isActive,
    };

    try {
      if (isEditMode && placement) {
        await updateAdPlacement({ id: placement.id, input: payload }).unwrap();
      } else {
        await createAdPlacement(payload).unwrap();
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
      <div className="w-full max-w-[480px] bg-white border border-[#e8e4dc] rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h2 className="text-[#1c1a17] text-lg font-black">
              {isEditMode ? "Edit placement" : "Add placement"}
            </h2>
            <p className="text-[#a39e96] text-xs mt-1">
              {isEditMode ? `Update details for ${placement?.name}` : "Add a new ad slot / placement"}
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
          <Field label="Name" required>
            <TextField
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. Homepage Top Banner"
              error={errors.name}
              inputRef={nameRef}
              maxLength={100}
            />
          </Field>

          <Field label="Slug" required>
            <TextField
              value={slug}
              onChange={handleSlugChange}
              placeholder="Auto-generated from name"
              error={errors.slug}
              maxLength={100}
            />
            {!errors.slug && (
              <p className="text-[10px] text-[#a39e96] mt-1">
                {slugTouched
                  ? "Manually set. Changing this after the site already uses it will make that ad slot go blank."
                  : "Auto-syncing with name."}
              </p>
            )}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Page type" required>
              <select
                value={pageType}
                onChange={(e) => setPageType(e.target.value ? Number(e.target.value) : "")}
                className={selectClass}
                style={{ borderColor: errors.pageType ? "#f0997b" : "#e2ddd5" }}
              >
                <option value="">Select</option>
                {PAGE_TYPE_OPTIONS.map((pt) => (
                  <option key={pt.value} value={pt.value}>
                    {pt.label}
                  </option>
                ))}
              </select>
              {errors.pageType && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.pageType}</p>}
            </Field>

            <Field label="Ad type" required>
              <select
                value={adType}
                onChange={(e) => setAdType(e.target.value ? Number(e.target.value) : "")}
                className={selectClass}
                style={{ borderColor: errors.adType ? "#f0997b" : "#e2ddd5" }}
              >
                <option value="">Select</option>
                {AD_TYPE_OPTIONS.map((at) => (
                  <option key={at.value} value={at.value}>
                    {at.label}
                  </option>
                ))}
              </select>
              {errors.adType && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.adType}</p>}
            </Field>
          </div>

          <Field label="Dimensions" required>
            {dimensionsMode === "preset" ? (
              <select
                value={PIXEL_SIZE_PRESETS.includes(dimensions) ? dimensions : ""}
                onChange={(e) => {
                  if (e.target.value === CUSTOM_OPTION) {
                    setDimensionsMode("custom");
                    setDimensions("");
                  } else {
                    setDimensions(e.target.value);
                  }
                }}
                className={selectClass}
                style={{ borderColor: errors.dimensions ? "#f0997b" : "#e2ddd5" }}
              >
                <option value="">Select a size</option>
                {PIXEL_SIZE_PRESETS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
                <option value={CUSTOM_OPTION}>Customize...</option>
              </select>
            ) : (
              <div className="space-y-1.5">
                <TextField
                  value={dimensions}
                  onChange={setDimensions}
                  placeholder="e.g. 970x250"
                  error={errors.dimensions}
                  maxLength={20}
                />
                <button
                  type="button"
                  onClick={() => {
                    setDimensionsMode("preset");
                    setDimensions("");
                  }}
                  className="cursor-pointer text-[10px] font-semibold text-[#D4300F] hover:underline"
                >
                  ← Choose from presets instead
                </button>
              </div>
            )}
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
                "Create placement"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
