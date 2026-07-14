// src/pages/newCars/BodyTypes/BodyTypeModal.tsx
import { useRef, useState } from "react";
import {
  useCreateBodyTypeMutation,
  useUpdateBodyTypeMutation,
  useUploadBodyTypeIconMutation,
  type BodyTypeRecord,
} from "./bodyType.api";
import { extractApiError, getUploadUrl } from "../../../lib/apiClient";
import { slugify } from "../../../lib/slugify";

const ACCENT = "#D4300F";
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface FieldErrors {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
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

export default function BodyTypeModal({
  open,
  onClose,
  bodyType,
}: {
  open: boolean;
  onClose: () => void;
  bodyType?: BodyTypeRecord | null;
}) {
  const isEditMode = !!bodyType;

  const [name, setName] = useState(bodyType ? bodyType.name : "");
  const [slug, setSlug] = useState(bodyType ? bodyType.slug : "");
  // Starts un-touched even in edit mode, so changing the name keeps
  // auto-syncing the slug (same as create) until the user manually edits it.
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState(bodyType?.description ?? "");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");

  const [createBodyType, { isLoading: creating }] = useCreateBodyTypeMutation();
  const [updateBodyType, { isLoading: updating }] = useUpdateBodyTypeMutation();
  const saving = creating || updating;

  const [uploadBodyTypeIcon, { isLoading: uploadingIcon }] = useUploadBodyTypeIconMutation();
  const [iconUrl, setIconUrl] = useState<string | null>(bodyType?.iconUrl ?? null);
  const [pendingIconFile, setPendingIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [iconError, setIconError] = useState("");
  const iconInputRef = useRef<HTMLInputElement>(null);

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

  const handleIconSelect = async (file: File | undefined) => {
    if (!file) return;
    setIconError("");

    if (!isEditMode) {
      setPendingIconFile(file);
      setIconPreview(URL.createObjectURL(file));
      return;
    }

    if (!bodyType) return;

    const objectUrl = URL.createObjectURL(file);
    setIconPreview(objectUrl);

    try {
      const result = await uploadBodyTypeIcon({ id: bodyType.id, file }).unwrap();
      setIconUrl(result.iconUrl);
    } catch (err) {
      setIconError(extractApiError(err));
    } finally {
      URL.revokeObjectURL(objectUrl);
      setIconPreview(null);
      if (iconInputRef.current) iconInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    if (iconPreview) URL.revokeObjectURL(iconPreview);
    setName("");
    setSlug("");
    setSlugTouched(false);
    setDescription("");
    setErrors({});
    setServerError("");
    setPendingIconFile(null);
    setIconPreview(null);
    setIconError("");
  };

  if (!open) return null;

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (name.trim().length < 2) next.name = "Name must be at least 2 characters.";
    if (!slug.trim()) {
      next.slug = "Slug is required.";
    } else if (!slugRegex.test(slug.trim())) {
      next.slug = 'Lowercase letters/numbers separated by hyphens (e.g. "suv").';
    }
    if (!description.trim()) next.description = "Description is required.";
    if (!isEditMode && !pendingIconFile) next.icon = "Icon is required.";
    if (isEditMode && !iconUrl) next.icon = "Icon is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    try {
      if (isEditMode && bodyType) {
        await updateBodyType({
          id: bodyType.id,
          input: {
            name: name.trim(),
            // Always the literal value shown on screen — whether it came
            // from auto-sync or a manual edit — so what's displayed is
            // exactly what gets saved.
            slug: slug.trim(),
            description: description.trim(),
          },
        }).unwrap();
      } else {
        await createBodyType({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim(),
          icon: pendingIconFile as File,
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
      <div className="w-full max-w-[480px] bg-white border border-[#e8e4dc] rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h2 className="text-[#1c1a17] text-lg font-black">
              {isEditMode ? "Edit body type" : "Add body type"}
            </h2>
            <p className="text-[#a39e96] text-xs mt-1">
              {isEditMode ? `Update details for ${bodyType?.name}` : "Add a new body type (e.g. SUV, Sedan)."}
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
          <div className="flex items-center gap-3 pb-1">
            <div
              className="w-14 h-14 rounded-xl border overflow-hidden flex items-center justify-center shrink-0 bg-[#f7f5f1]"
              style={{ borderColor: errors.icon ? "#f0997b" : "#e2ddd5" }}
            >
              {(iconPreview || getUploadUrl(iconUrl)) && (
                <img
                  src={iconPreview ?? getUploadUrl(iconUrl) ?? undefined}
                  alt={isEditMode ? `${bodyType?.name} icon` : "Body type icon preview"}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => iconInputRef.current?.click()}
                disabled={uploadingIcon}
                className="cursor-pointer text-[11px] font-bold px-3 py-1.5 rounded-lg border border-[#e2ddd5] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors disabled:opacity-50"
              >
                {uploadingIcon ? "Uploading..." : iconUrl || pendingIconFile ? "Change icon" : "Upload icon"}
              </button>
              <input
                ref={iconInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                onChange={(e) => handleIconSelect(e.target.files?.[0])}
                className="hidden"
              />
              <p className="text-[10px] text-[#a39e96] mt-1">Required. JPG, PNG, SVG or WEBP, up to 2MB.</p>
              {(iconError || errors.icon) && (
                <p className="text-[11px] font-medium text-[#D4300F] mt-1">{iconError || errors.icon}</p>
              )}
            </div>
          </div>

          <Field label="Name">
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. SUV"
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
            {errors.slug ? (
              <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.slug}</p>
            ) : (
              <p className="text-[10px] text-[#a39e96] mt-1">
                {slugTouched ? "Manually edited." : "Auto-syncing with name."}
              </p>
            )}
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description shown in the admin listing"
              rows={3}
              className="w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white resize-none"
              style={{
                borderColor: errors.description ? "#f0997b" : "#e2ddd5",
                boxShadow: errors.description ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
              }}
            />
            {errors.description && (
              <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.description}</p>
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
              {saving ? "Saving..." : isEditMode ? "Save changes" : "Add body type"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}