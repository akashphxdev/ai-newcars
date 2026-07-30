// src/pages/newCars/FeatureCategories/FeatureCategoryModal.tsx
import { useState } from "react";
import {
  useCreateFeatureCategoryMutation,
  useUpdateFeatureCategoryMutation,
  type FeatureCategoryRecord,
} from "./featureCategory.api";
import { extractApiError } from "../../../lib/apiClient";

const ACCENT = "#D4300F";

interface FieldErrors {
  name?: string;
  sortOrder?: string;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function FeatureCategoryModal({
  open,
  onClose,
  category,
  nextSortOrder = 0,
}: {
  open: boolean;
  onClose: () => void;
  category?: FeatureCategoryRecord | null;
  // Suggested default for Add mode only — one past whatever's currently
  // highest, so categories don't all pile up at the same sort position.
  nextSortOrder?: number;
}) {
  const isEditMode = !!category;

  const [name, setName] = useState(category ? category.name : "");
  const [sortOrder, setSortOrder] = useState(category ? String(category.sortOrder) : String(nextSortOrder));

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");

  const [createFeatureCategory, { isLoading: creating }] = useCreateFeatureCategoryMutation();
  const [updateFeatureCategory, { isLoading: updating }] = useUpdateFeatureCategoryMutation();
  const saving = creating || updating;

  const resetForm = () => {
    setName("");
    setSortOrder("0");
    setErrors({});
    setServerError("");
  };

  if (!open) return null;

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = "Name is required.";
    if (sortOrder.trim() && !/^\d+$/.test(sortOrder.trim())) next.sortOrder = "Must be a whole number.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    try {
      if (isEditMode && category) {
        await updateFeatureCategory({
          id: category.id,
          input: { name: name.trim(), sortOrder: sortOrder.trim() ? Number(sortOrder) : undefined },
        }).unwrap();
      } else {
        await createFeatureCategory({
          name: name.trim(),
          sortOrder: sortOrder.trim() ? Number(sortOrder) : undefined,
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
      <div className="w-full max-w-[420px] bg-white border border-[#e8e4dc] rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h2 className="text-[#1c1a17] text-lg font-black">
              {isEditMode ? "Edit category" : "Add feature category"}
            </h2>
            <p className="text-[#a39e96] text-xs mt-1">
              {isEditMode ? `Update details for ${category?.name}` : "Add a new feature category (e.g. Safety)."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
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
          <Field label="Name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Safety"
              className="w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
              style={{
                borderColor: errors.name ? "#f0997b" : "#e2ddd5",
                boxShadow: errors.name ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
              }}
            />
            {errors.name && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.name}</p>}
          </Field>

          <Field label="Sort order">
            <input
              type="number"
              min={0}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              placeholder="0"
              className="w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
              style={{
                borderColor: errors.sortOrder ? "#f0997b" : "#e2ddd5",
                boxShadow: errors.sortOrder ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
              }}
            />
            {errors.sortOrder ? (
              <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.sortOrder}</p>
            ) : (
              <p className="text-[10px] text-[#a39e96] mt-1">Lower numbers show first.</p>
            )}
          </Field>

          {serverError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
              <p className="text-red-500 text-xs font-medium">{serverError}</p>
            </div>
          )}

          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleClose}
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
              {saving ? "Saving..." : isEditMode ? "Save changes" : "Add category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
