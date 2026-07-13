// src/pages/newCars/AttributeOptions/AttributeOptionModal.tsx
import { useState } from "react";
import {
  useCreateAttributeOptionMutation,
  useUpdateAttributeOptionMutation,
  type AttributeOptionRecord,
  type AttributeOptionCategory,
} from "./attributeOption.api";
import { extractApiError } from "../../../lib/apiClient";

const ACCENT = "#D4300F";
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const CATEGORY_OPTIONS: { value: AttributeOptionCategory; label: string }[] = [
  { value: "transmission", label: "Transmission" },
  { value: "drivetrain", label: "Drivetrain" },
];

function slugify(input: string): string {
  return input
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface FieldErrors {
  category?: string;
  name?: string;
  slug?: string;
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

export default function AttributeOptionModal({
  open,
  onClose,
  defaultCategory,
  option,
}: {
  open: boolean;
  onClose: () => void;
  defaultCategory?: AttributeOptionCategory;
  option?: AttributeOptionRecord | null;
}) {
  const isEditMode = !!option;

  const [category, setCategory] = useState<AttributeOptionCategory>(
    (option?.category as AttributeOptionCategory) ?? defaultCategory ?? "transmission",
  );
  const [name, setName] = useState(option ? option.name : "");
  const [slug, setSlug] = useState(option ? option.slug : "");
  const [slugTouched, setSlugTouched] = useState(isEditMode);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");

  const [createAttributeOption, { isLoading: creating }] = useCreateAttributeOptionMutation();
  const [updateAttributeOption, { isLoading: updating }] = useUpdateAttributeOptionMutation();
  const saving = creating || updating;

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

  const resetForm = () => {
    setCategory(defaultCategory ?? "transmission");
    setName("");
    setSlug("");
    setSlugTouched(false);
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
    if (category !== "transmission" && category !== "drivetrain") {
      next.category = 'Category must be either "Transmission" or "Drivetrain".';
    }
    if (name.trim().length < 1) next.name = "Name is required.";
    if (!slug.trim()) {
      next.slug = "Slug is required.";
    } else if (!slugRegex.test(slug.trim())) {
      next.slug = 'Lowercase letters/numbers separated by hyphens (e.g. "manual").';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    try {
      if (isEditMode && option) {
        await updateAttributeOption({
          id: option.id,
          input: {
            category,
            name: name.trim(),
            slug: slug.trim(),
          },
        }).unwrap();
      } else {
        await createAttributeOption({
          category,
          name: name.trim(),
          slug: slug.trim(),
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
      <div className="w-full max-w-[440px] bg-white border border-[#e8e4dc] rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h2 className="text-[#1c1a17] text-lg font-black">
              {isEditMode ? "Edit option" : "Add option"}
            </h2>
            <p className="text-[#a39e96] text-xs mt-1">
              {isEditMode
                ? `Update details for ${option?.name}`
                : "Add a new lookup value (transmission or drivetrain type)."}
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
          <Field label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as AttributeOptionCategory)}
              disabled={!!defaultCategory && !isEditMode}
              className="w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white disabled:opacity-60"
              style={{
                borderColor: errors.category ? "#f0997b" : "#e2ddd5",
                boxShadow: errors.category ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
              }}
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.category}</p>}
          </Field>

          <Field label="Name">
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Manual"
              className="w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
              style={{
                borderColor: errors.name ? "#f0997b" : "#e2ddd5",
                boxShadow: errors.name ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
              }}
            />
            {errors.name && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.name}</p>}
          </Field>

          <Field label="Slug">
            <input
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="Auto-generated from name"
              className="w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
              style={{
                borderColor: errors.slug ? "#f0997b" : "#e2ddd5",
                boxShadow: errors.slug ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
              }}
            />
            {errors.slug && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.slug}</p>}
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
              {saving ? "Saving..." : isEditMode ? "Save changes" : "Add option"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}