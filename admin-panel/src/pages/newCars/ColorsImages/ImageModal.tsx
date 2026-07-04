// src/pages/newCars/ColorsImages/ImageModal.tsx
import { useRef, useState } from "react";
import {
  useCreateImageMutation,
  useUpdateImageMutation,
  useReplaceImageFileMutation,
  type CarImageRecord,
  type CarImageAngle,
} from "./image.api";
import { useGetVariantsQuery } from "../Variants/variant.api";
import { extractApiError, getUploadUrl } from "../../../lib/apiClient";

const ACCENT = "#D4300F";

const ANGLES: { value: CarImageAngle; label: string }[] = [
  { value: "front", label: "Front" },
  { value: "rear", label: "Rear" },
  { value: "side", label: "Side" },
  { value: "interior", label: "Interior" },
  { value: "dashboard", label: "Dashboard" },
  { value: "boot", label: "Boot" },
  { value: "wheel", label: "Wheel" },
  { value: "top", label: "Top" },
  { value: "other", label: "Other" },
];

interface FieldErrors {
  image?: string;
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

export default function ImageModal({
  open,
  onClose,
  modelId,
  image,
}: {
  open: boolean;
  onClose: () => void;
  // The car model this image is (or will be) scoped to. Fixed by the
  // parent's model selector — not editable from inside this modal.
  modelId: number;
  // Present -> edit mode. Absent/null -> create mode.
  image?: CarImageRecord | null;
}) {
  const isEditMode = !!image;

  // Variants belonging to this model — lets the admin optionally pin a
  // gallery photo to one specific variant instead of the model at large.
  const { data: variantsData } = useGetVariantsQuery({ modelId, limit: 100, sortBy: "variantName", sortOrder: "asc" });
  const variants = variantsData?.data ?? [];

  const [variantId, setVariantId] = useState<number | "">(image?.variantId ?? "");
  const [angle, setAngle] = useState<CarImageAngle | "">(image?.angle ?? "");
  const [isPrimary, setIsPrimary] = useState(image ? image.isPrimary : false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");

  const [createImage, { isLoading: creating }] = useCreateImageMutation();
  const [updateImage, { isLoading: updating }] = useUpdateImageMutation();
  const saving = creating || updating;

  // Replacing the underlying file is a separate call, same mechanics
  // as BrandModal's logo replace-in-edit-mode flow.
  const [replaceImageFile, { isLoading: replacing }] = useReplaceImageFileMutation();
  const [imageUrl, setImageUrl] = useState<string | null>(image?.imageUrl ?? null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File | undefined) => {
    if (!file) return;
    setFileError("");

    if (!isEditMode) {
      setPendingImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      return;
    }

    if (!image) return;

    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);

    try {
      const result = await replaceImageFile({ id: image.id, file }).unwrap();
      setImageUrl(result.imageUrl);
    } catch (err) {
      setFileError(extractApiError(err));
    } finally {
      URL.revokeObjectURL(objectUrl);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setVariantId("");
    setAngle("");
    setIsPrimary(false);
    setErrors({});
    setServerError("");
    setPendingImageFile(null);
    setImagePreview(null);
    setFileError("");
  };

  if (!open) return null;

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!isEditMode && !pendingImageFile) {
      next.image = "An image file is required.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    try {
      if (isEditMode && image) {
        await updateImage({
          id: image.id,
          input: {
            variantId: variantId === "" ? null : Number(variantId),
            angle: angle === "" ? null : angle,
            isPrimary,
          },
        }).unwrap();
      } else {
        await createImage({
          modelId,
          variantId: variantId === "" ? undefined : Number(variantId),
          angle: angle === "" ? undefined : angle,
          isPrimary,
          image: pendingImageFile as File,
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
            <h2 className="text-[#1c1a17] text-lg font-black">{isEditMode ? "Edit image" : "Add image"}</h2>
            <p className="text-[#a39e96] text-xs mt-1">
              {isEditMode ? "Update this gallery image's details." : "Upload a new gallery image for this model."}
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
              className="w-20 h-14 rounded-xl border bg-[#f7f5f1] overflow-hidden flex items-center justify-center shrink-0"
              style={{ borderColor: errors.image ? "#f0997b" : "#e2ddd5" }}
            >
              {imagePreview || getUploadUrl(imageUrl) ? (
                <img
                  src={imagePreview ?? getUploadUrl(imageUrl) ?? undefined}
                  alt="Gallery preview"
                  className="w-full h-full object-cover"
                />
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
                onClick={() => fileInputRef.current?.click()}
                disabled={replacing}
                className="cursor-pointer text-[11px] font-bold px-3 py-1.5 rounded-lg border border-[#e2ddd5] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors disabled:opacity-50"
              >
                {replacing ? "Uploading..." : imageUrl || pendingImageFile ? "Replace image" : "Upload image"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
                className="hidden"
              />
              <p className="text-[10px] text-[#a39e96] mt-1">JPG, PNG or WEBP, up to 2MB.</p>
              {errors.image && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.image}</p>}
              {fileError && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{fileError}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Angle (optional)">
              <select
                value={angle}
                onChange={(e) => setAngle(e.target.value as CarImageAngle | "")}
                className="cursor-pointer w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border border-[#e2ddd5] rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
              >
                <option value="">None</option>
                {ANGLES.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Variant (optional)">
              <select
                value={variantId}
                onChange={(e) => setVariantId(e.target.value ? Number(e.target.value) : "")}
                className="cursor-pointer w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border border-[#e2ddd5] rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
              >
                <option value="">Applies to whole model</option>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.variantName}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer text-[12px] font-semibold text-[#4a4640] pt-1">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="cursor-pointer accent-[#D4300F]"
            />
            Set as primary/cover image
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
              {saving ? "Saving..." : isEditMode ? "Save changes" : "Add image"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}