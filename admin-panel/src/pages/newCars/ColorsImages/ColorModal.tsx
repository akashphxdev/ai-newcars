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
const MAX_SHADES = 4;

interface FieldErrors {
  colorName?: string;
  shades?: string;
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
  modelId: number;
  color?: CarColorRecord | null;
}) {
  const isEditMode = !!color;

  const [colorName, setColorName] = useState(color ? color.colorName : "");
  const [shades, setShades] = useState<string[]>(
    color ? color.shades.map((s) => s.colorHex) : ["#FFFFFF"],
  );
  const [additionalCost, setAdditionalCost] = useState(
    color?.additionalCost != null ? color.additionalCost : "",
  );

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");

  const [createColor, { isLoading: creating }] = useCreateColorMutation();
  const [updateColor, { isLoading: updating }] = useUpdateColorMutation();
  const saving = creating || updating;

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
    setShades(["#FFFFFF"]);
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

  const setShadeAt = (index: number, value: string) =>
    setShades((prev) => prev.map((s, i) => (i === index ? value : s)));

  const addShade = () => {
    if (shades.length >= MAX_SHADES) return;
    setShades((prev) => [...prev, "#FFFFFF"]);
  };

  const removeShade = (index: number) =>
    setShades((prev) => prev.filter((_, i) => i !== index));

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (colorName.trim().length < 1) next.colorName = "Color name is required.";
    const nonEmptyShades = shades.map((s) => s.trim()).filter(Boolean);
    const invalidShade = nonEmptyShades.find((s) => !hexRegex.test(s));
    if (invalidShade) {
      next.shades = `"${invalidShade}" isn't a valid 6-digit hex code (e.g. "#FFFFFF").`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    const cleanShades = shades.map((s) => s.trim()).filter(Boolean);

    try {
      if (isEditMode && color) {
        await updateColor({
          id: color.id,
          input: {
            colorName: colorName.trim(),
            colorHexes: cleanShades,
            additionalCost: additionalCost === "" ? null : Number(additionalCost),
          },
        }).unwrap();
      } else {
        await createColor({
          modelId,
          colorName: colorName.trim(),
          colorHexes: cleanShades.length > 0 ? cleanShades : undefined,
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

  const validShades = shades.map((s) => s.trim()).filter((s) => hexRegex.test(s));
  const swatchBackground =
    validShades.length === 0
      ? "#f7f5f1"
      : validShades.length === 1
        ? validShades[0]
        : `linear-gradient(90deg, ${validShades
            .map((hex, i) => `${hex} ${(i / validShades.length) * 100}%, ${hex} ${((i + 1) / validShades.length) * 100}%`)
            .join(", ")})`;

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
                borderColor: errors.shades ? "#f0997b" : "#e2ddd5",
                background: imagePreview || getUploadUrl(imageUrl) ? "#f7f5f1" : swatchBackground,
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

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a39e96]">
                Shades (optional — add 2+ for a mix color)
              </label>
              {shades.length < MAX_SHADES && (
                <button
                  type="button"
                  onClick={addShade}
                  className="cursor-pointer text-[10.5px] font-bold px-2 py-1 rounded-lg border border-[#e2ddd5] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors"
                >
                  + Add another shade
                </button>
              )}
            </div>

            {shades.length === 0 && (
              <p className="text-[11px] text-[#a39e96] italic">
                No shades — this color will be represented by name{imageUrl || pendingImageFile ? " and photo" : ""} only.
              </p>
            )}

            <div className="space-y-2">
              {shades.map((hex, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={hexRegex.test(hex) ? hex : "#ffffff"}
                    onChange={(e) => setShadeAt(i, e.target.value)}
                    className="cursor-pointer w-10 h-[42px] rounded-lg border border-[#e2ddd5] shrink-0"
                  />
                  <input
                    type="text"
                    value={hex}
                    onChange={(e) => setShadeAt(i, e.target.value)}
                    placeholder="#FFFFFF"
                    className="w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border border-[#e2ddd5] rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => removeShade(i)}
                    aria-label="Remove shade"
                    className="cursor-pointer shrink-0 w-9 h-9 rounded-lg border border-[#e2ddd5] text-[#a39e96] hover:text-[#D4300F] hover:border-red-200 hover:bg-red-50 transition-colors flex items-center justify-center"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            {errors.shades && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.shades}</p>}
            <p className="text-[10px] text-[#a39e96] mt-1">Up to {MAX_SHADES} shades per color.</p>
          </div>

          <Field label="Additional cost (optional)">
            <input
              type="number"
              min={0}
              step="0.01"
              value={additionalCost}
              onChange={(e) => setAdditionalCost(e.target.value)}
              placeholder="0.00"
              className="w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border border-[#e2ddd5] rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
            />
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
              {saving ? "Saving..." : isEditMode ? "Save changes" : "Add color"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
