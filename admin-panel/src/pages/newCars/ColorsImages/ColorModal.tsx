// src/pages/newCars/ColorsImages/ColorModal.tsx
import { useRef, useState } from "react";
import {
  useCreateColorMutation,
  useUpdateColorMutation,
  useUploadColorImageMutation,
  type CarColorRecord,
} from "./color.api";
import { extractApiError, getUploadUrl } from "../../../lib/apiClient";

const ACCENT = "#D4300F";
const hexRegex = /^#[0-9a-fA-F]{6}$/;

interface FieldErrors {
  colorName?: string;
  colorHex?: string;
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

export default function ColorModal({
  open,
  onClose,
  modelId,
  color,
}: {
  open: boolean;
  onClose: () => void;
  // The car model this color is (or will be) scoped to. Fixed by the
  // parent's model selector — not editable from inside this modal.
  modelId: number;
  // Present -> edit mode. Absent/null -> create mode.
  color?: CarColorRecord | null;
}) {
  const isEditMode = !!color;

  const [colorName, setColorName] = useState(color ? color.colorName : "");
  const [colorHex, setColorHex] = useState(color?.colorHex ?? "#FFFFFF");
  const [isDualTone, setIsDualTone] = useState(color ? color.isDualTone : false);
  const [additionalCost, setAdditionalCost] = useState(
    color?.additionalCost != null ? color.additionalCost : "",
  );

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");

  const [createColor, { isLoading: creating }] = useCreateColorMutation();
  const [updateColor, { isLoading: updating }] = useUpdateColorMutation();
  const saving = creating || updating;

  // Swatch/reference image is optional — same upload mechanics as
  // BrandModal's logo, minus the "required on create" rule.
  const [uploadColorImage, { isLoading: uploadingImage }] = useUploadColorImageMutation();
  const [imageUrl, setImageUrl] = useState<string | null>(color?.imageUrl ?? null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (file: File | undefined) => {
    if (!file) return;
    setImageError("");

    if (!isEditMode) {
      setPendingImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      return;
    }

    if (!color) return;

    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);

    try {
      const result = await uploadColorImage({ id: color.id, file }).unwrap();
      setImageUrl(result.imageUrl);
    } catch (err) {
      setImageError(extractApiError(err));
    } finally {
      URL.revokeObjectURL(objectUrl);
      setImagePreview(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setColorName("");
    setColorHex("#FFFFFF");
    setIsDualTone(false);
    setAdditionalCost("");
    setErrors({});
    setServerError("");
    setPendingImageFile(null);
    setImagePreview(null);
    setImageError("");
  };

  if (!open) return null;

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (colorName.trim().length < 1) next.colorName = "Color name is required.";
    if (colorHex.trim() && !hexRegex.test(colorHex.trim())) {
      next.colorHex = 'Must be a 6-digit hex code (e.g. "#FFFFFF").';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    try {
      if (isEditMode && color) {
        await updateColor({
          id: color.id,
          input: {
            colorName: colorName.trim(),
            colorHex: colorHex.trim() || null,
            isDualTone,
            additionalCost: additionalCost === "" ? null : Number(additionalCost),
          },
        }).unwrap();
      } else {
        await createColor({
          modelId,
          colorName: colorName.trim(),
          colorHex: colorHex.trim() || undefined,
          isDualTone,
          additionalCost: additionalCost === "" ? undefined : Number(additionalCost),
          image: pendingImageFile ?? undefined,
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
            <h2 className="text-[#1c1a17] text-lg font-black">{isEditMode ? "Edit color" : "Add color"}</h2>
            <p className="text-[#a39e96] text-xs mt-1">
              {isEditMode ? `Update details for ${color?.colorName}` : "Add a new color option for this model."}
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
              className="w-14 h-14 rounded-xl border overflow-hidden flex items-center justify-center shrink-0"
              style={{
                borderColor: errors.colorHex ? "#f0997b" : "#e2ddd5",
                background: imagePreview || getUploadUrl(imageUrl) ? "#f7f5f1" : hexRegex.test(colorHex) ? colorHex : "#f7f5f1",
              }}
            >
              {(imagePreview || getUploadUrl(imageUrl)) && (
                <img
                  src={imagePreview ?? getUploadUrl(imageUrl) ?? undefined}
                  alt={isEditMode ? `${color?.colorName} swatch` : "Color image preview"}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploadingImage}
                className="cursor-pointer text-[11px] font-bold px-3 py-1.5 rounded-lg border border-[#e2ddd5] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors disabled:opacity-50"
              >
                {uploadingImage ? "Uploading..." : imageUrl || pendingImageFile ? "Change image" : "Upload image"}
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleImageSelect(e.target.files?.[0])}
                className="hidden"
              />
              <p className="text-[10px] text-[#a39e96] mt-1">Optional. JPG, PNG or WEBP, up to 2MB.</p>
              {imageError && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{imageError}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Color name">
              <input
                type="text"
                value={colorName}
                onChange={(e) => setColorName(e.target.value)}
                placeholder="e.g. Pearl White"
                className="w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
                style={{
                  borderColor: errors.colorName ? "#f0997b" : "#e2ddd5",
                  boxShadow: errors.colorName ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
                }}
              />
              {errors.colorName && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.colorName}</p>}
            </Field>

            <Field label="Hex code">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={hexRegex.test(colorHex) ? colorHex : "#ffffff"}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="cursor-pointer w-10 h-[42px] rounded-lg border border-[#e2ddd5] shrink-0"
                />
                <input
                  type="text"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  placeholder="#FFFFFF"
                  className="w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
                  style={{
                    borderColor: errors.colorHex ? "#f0997b" : "#e2ddd5",
                    boxShadow: errors.colorHex ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
                  }}
                />
              </div>
              {errors.colorHex && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.colorHex}</p>}
            </Field>
          </div>

          <Field label="Additional cost (optional)">
            <input
              type="number"
              min={0}
              step="0.01"
              value={additionalCost}
              onChange={(e) => setAdditionalCost(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="0.00"
              className="w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border border-[#e2ddd5] rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
            />
          </Field>

          <label className="flex items-center gap-1.5 cursor-pointer text-[12px] font-semibold text-[#4a4640] pt-1">
            <input
              type="checkbox"
              checked={isDualTone}
              onChange={(e) => setIsDualTone(e.target.checked)}
              className="cursor-pointer accent-[#D4300F]"
            />
            Dual tone
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
              {saving ? "Saving..." : isEditMode ? "Save changes" : "Add color"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}