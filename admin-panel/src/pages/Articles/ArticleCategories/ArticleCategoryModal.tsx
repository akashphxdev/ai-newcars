// src/pages/Articles/ArticleCategories/ArticleCategoryModal.tsx
import { useEffect, useRef, useState } from "react";
import {
  useCreateArticleCategoryMutation,
  useUpdateArticleCategoryMutation,
  type ArticleCategoryRecord,
} from "./articleCategory.api";
import { extractApiError } from "../../../lib/apiClient";

const ACCENT = "#D4300F";

// Mirrors src/core/utils/slugify.ts on the backend exactly, so the
// live preview in the form matches what the server would generate.
// Same copy used in BrandModal.tsx / CityModal.tsx / BodyTypeModal.tsx.
function slugify(input: string): string {
  return input
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface FieldErrors {
  name?: string;
  slug?: string;
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

export default function ArticleCategoryModal({
  open,
  onClose,
  category,
}: {
  open: boolean;
  onClose: () => void;
  // Present -> edit mode. Absent/null -> create mode.
  category?: ArticleCategoryRecord | null;
}) {
  const isEditMode = !!category;

  const [name, setName] = useState(category ? category.name : "");
  const [slug, setSlug] = useState(category ? category.slug : "");
  // Tracks whether the admin has manually edited the slug field. While
  // false, the slug keeps auto-syncing with the name — on create AND
  // on edit (e.g. renaming a category regenerates its slug too, unless
  // the admin has already hand-edited it). Same pattern as
  // BrandModal.tsx's slugTouched.
  const [slugTouched, setSlugTouched] = useState(false);
  const [isActive, setIsActive] = useState(category ? category.isActive : true);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const [createArticleCategory, { isLoading: creating }] = useCreateArticleCategoryMutation();
  const [updateArticleCategory, { isLoading: updating }] = useUpdateArticleCategoryMutation();
  const saving = creating || updating;

  const resetForm = () => {
    setName("");
    setSlug("");
    setSlugTouched(false);
    setIsActive(true);
    setErrors({});
    setServerError("");
  };

  useEffect(() => {
    if (!open) return;
    const focusTimer = setTimeout(() => nameRef.current?.focus(), 50);
    return () => clearTimeout(focusTimer);
  }, [open]);

  if (!open) return null;

  const handleClose = () => {
    resetForm();
    onClose();
  };

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
    if (name.trim().length < 2) next.name = "Name must be at least 2 characters.";
    if (slug.trim() && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
      next.slug = 'Slug must be lowercase letters/numbers separated by hyphens (e.g. "reviews").';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    try {
      if (isEditMode && category) {
        await updateArticleCategory({
          id: category.id,
          input: {
            name: name.trim(),
            // Untouched -> send undefined so the backend regenerates the
            // slug from the (possibly changed) name, same as create.
            slug: slugTouched ? slug.trim() || undefined : undefined,
            isActive,
          },
        }).unwrap();
      } else {
        await createArticleCategory({
          name: name.trim(),
          slug: slug.trim() || undefined,
          isActive,
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
              {isEditMode ? "Edit category" : "Add category"}
            </h2>
            <p className="text-[#a39e96] text-xs mt-1">
              {isEditMode ? `Update details for ${category?.name}` : "Add a new article category"}
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
          <Field label="Name" required>
            <TextField value={name} onChange={handleNameChange} placeholder="e.g. Reviews" error={errors.name} inputRef={nameRef} maxLength={50} />
          </Field>

          <Field label="Slug">
            <TextField
              value={slug}
              onChange={handleSlugChange}
              placeholder="Auto-generated from name"
              error={errors.slug}
              maxLength={50}
            />
            {!errors.slug && (
              <p className="text-[10px] text-[#a39e96] mt-1">
                {slugTouched ? "Manually edited." : "Auto-syncing with name."}
              </p>
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
                "Create category"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}