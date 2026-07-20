// src/pages/Home/Testimonials/TestimonialModal.tsx
import { useRef, useState } from "react";
import {
  useCreateTestimonialMutation,
  useUpdateTestimonialMutation,
  useUploadTestimonialPhotoMutation,
  type TestimonialRecord,
} from "./testimonial.api";
import { extractApiError, getUploadUrl } from "../../../lib/apiClient";

const ACCENT = "#D4300F";

interface FieldErrors {
  customerName?: string;
  quote?: string;
  rating?: string;
}

function Field({ label, children, optional }: { label: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1.5">
        {label} {optional && <span className="normal-case font-medium text-[#c0bab0]">(optional)</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white";

export default function TestimonialModal({
  open,
  onClose,
  testimonial,
}: {
  open: boolean;
  onClose: () => void;
  // Present -> edit mode. Absent/null -> create mode.
  testimonial?: TestimonialRecord | null;
}) {
  const isEditMode = !!testimonial;

  const [customerName, setCustomerName] = useState(testimonial?.customerName ?? "");
  const [customerCity, setCustomerCity] = useState(testimonial?.customerCity ?? "");
  const [rating, setRating] = useState(testimonial?.rating ?? "");
  const [quote, setQuote] = useState(testimonial?.quote ?? "");
  const [displayOrder, setDisplayOrder] = useState(testimonial?.displayOrder ?? 0);
  const [isActive, setIsActive] = useState<boolean>(testimonial?.isActive ?? true);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");

  const [createTestimonial, { isLoading: creating }] = useCreateTestimonialMutation();
  const [updateTestimonial, { isLoading: updating }] = useUpdateTestimonialMutation();
  const saving = creating || updating;

  // Photo is optional — same upload mechanics as OfferModal.tsx's
  // image, minus the "required on create" rule.
  const [uploadPhoto, { isLoading: uploadingPhoto }] = useUploadTestimonialPhotoMutation();
  const [photoUrl, setPhotoUrl] = useState<string | null>(testimonial?.photoUrl ?? null);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = async (file: File | undefined) => {
    if (!file) return;
    setPhotoError("");

    if (!isEditMode) {
      setPendingPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      return;
    }

    if (!testimonial) return;

    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview(objectUrl);

    try {
      const result = await uploadPhoto({ id: testimonial.id, file }).unwrap();
      setPhotoUrl(result.photoUrl);
    } catch (err) {
      setPhotoError(extractApiError(err));
    } finally {
      URL.revokeObjectURL(objectUrl);
      setPhotoPreview(null);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setCustomerName("");
    setCustomerCity("");
    setRating("");
    setQuote("");
    setDisplayOrder(0);
    setIsActive(true);
    setErrors({});
    setServerError("");
    setPendingPhotoFile(null);
    setPhotoPreview(null);
    setPhotoError("");
  };

  if (!open) return null;

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!customerName.trim()) next.customerName = "Customer name is required.";
    if (!quote.trim()) next.quote = "Quote is required.";
    if (rating !== "" && (Number(rating) < 1 || Number(rating) > 5)) {
      next.rating = "Rating must be between 1 and 5.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    const formFields = {
      userId: null,
      customerName: customerName.trim(),
      customerCity: customerCity.trim() || null,
      rating: rating === "" ? null : Number(rating),
      quote: quote.trim(),
      displayOrder,
      isActive,
    };

    try {
      if (isEditMode && testimonial) {
        await updateTestimonial({ id: testimonial.id, input: formFields }).unwrap();
      } else {
        await createTestimonial({ ...formFields, photo: pendingPhotoFile }).unwrap();
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
      <div className="w-full max-w-[560px] bg-white border border-[#e8e4dc] rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h2 className="text-[#1c1a17] text-lg font-black">
              {isEditMode ? "Edit testimonial" : "Add testimonial"}
            </h2>
            <p className="text-[#a39e96] text-xs mt-1">
              {isEditMode ? "Update this testimonial's details" : "Customer name and quote are required; photo is optional."}
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
            <div className="w-14 h-14 rounded-full border bg-[#f7f5f1] overflow-hidden flex items-center justify-center shrink-0" style={{ borderColor: "#e2ddd5" }}>
              {photoPreview || photoUrl ? (
                <img
                  src={photoPreview ?? getUploadUrl(photoUrl) ?? undefined}
                  alt={isEditMode ? "Customer photo" : "Customer photo preview"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c0bab0" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
                </svg>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="cursor-pointer text-[11px] font-bold px-3 py-1.5 rounded-lg border border-[#e2ddd5] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors disabled:opacity-50"
              >
                {uploadingPhoto ? "Uploading..." : photoUrl || pendingPhotoFile ? "Change photo" : "Upload photo"}
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(e) => handlePhotoSelect(e.target.files?.[0])}
                className="hidden"
              />
              <p className="text-[10px] text-[#a39e96] mt-1">JPG, PNG, WEBP or AVIF, up to 2MB.</p>
              {photoError && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{photoError}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Customer name">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Rohit Sharma"
                className={inputClass}
                style={{ borderColor: errors.customerName ? "#f0997b" : "#e2ddd5" }}
              />
              {errors.customerName && (
                <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.customerName}</p>
              )}
            </Field>
            <Field label="City" optional>
              <input
                type="text"
                value={customerCity}
                onChange={(e) => setCustomerCity(e.target.value)}
                placeholder="e.g. Mumbai"
                className={inputClass}
                style={{ borderColor: "#e2ddd5" }}
              />
            </Field>
          </div>

          <Field label="Quote">
            <textarea
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="What did the customer say?"
              rows={4}
              maxLength={500}
              className={`${inputClass} resize-none`}
              style={{ borderColor: errors.quote ? "#f0997b" : "#e2ddd5" }}
            />
            {errors.quote && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.quote}</p>}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Rating (1–5)" optional>
              <input
                type="number"
                min={1}
                max={5}
                step="0.5"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                placeholder="e.g. 4.5"
                className={inputClass}
                style={{
                  borderColor: errors.rating ? "#f0997b" : "#e2ddd5",
                  boxShadow: errors.rating ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
                }}
              />
              {errors.rating && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.rating}</p>}
            </Field>
            <Field label="Display order" optional>
              <input
                type="number"
                min={0}
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
                className={inputClass}
                style={{ borderColor: "#e2ddd5" }}
              />
            </Field>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded accent-[#D4300F] cursor-pointer"
            />
            <span className="text-sm font-medium text-[#4a4640]">Visible on site</span>
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
                "Add testimonial"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
