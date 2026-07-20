// src/pages/Home/Banners/BannerModal.tsx
import { useRef, useState } from "react";
import {
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useUploadBannerMediaMutation,
  type BannerRecord,
} from "./banner.api";
import { BANNER_MEDIA_TYPE_OPTIONS } from "../../../lib/lookups";
import { extractApiError, getUploadUrl } from "../../../lib/apiClient";

const ACCENT = "#D4300F";

interface FieldErrors {
  name?: string;
  tagLabel?: string;
  heading?: string;
  highlightText?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
  media?: string;
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
const selectClass =
  "cursor-pointer w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white";

export default function BannerModal({
  open,
  onClose,
  banner,
}: {
  open: boolean;
  onClose: () => void;
  // Present -> edit mode. Absent/null -> create mode.
  banner?: BannerRecord | null;
}) {
  const isEditMode = !!banner;

  const [name, setName] = useState(banner?.name ?? "");
  const [tagLabel, setTagLabel] = useState(banner?.tagLabel ?? "");
  const [heading, setHeading] = useState(banner?.heading ?? "");
  const [highlightText, setHighlightText] = useState(banner?.highlightText ?? "");
  const [description, setDescription] = useState(banner?.description ?? "");
  const [mediaType, setMediaType] = useState<number>(banner?.mediaType ?? 1);
  const [ctaText, setCtaText] = useState(banner?.ctaText ?? "");
  const [ctaLink, setCtaLink] = useState(banner?.ctaLink ?? "");
  const [displayOrder, setDisplayOrder] = useState(banner?.displayOrder ?? 0);
  const [isActive, setIsActive] = useState<boolean>(banner?.isActive ?? true);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");

  const [createBanner, { isLoading: creating }] = useCreateBannerMutation();
  const [updateBanner, { isLoading: updating }] = useUpdateBannerMutation();
  const saving = creating || updating;

  // Media is required on create — same upload mechanics as
  // OfferModal.tsx's image (instant re-upload in edit mode via a
  // dedicated mutation; held in local state and sent with the form on
  // create mode).
  const [uploadBannerMedia, { isLoading: uploadingMedia }] = useUploadBannerMediaMutation();
  const currentMediaUrl = banner ? (banner.mediaType === 1 ? banner.imageUrl : banner.videoUrl) : null;
  const [mediaUrl, setMediaUrl] = useState<string | null>(currentMediaUrl);
  const [pendingMediaFile, setPendingMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState("");
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const handleMediaSelect = async (file: File | undefined) => {
    if (!file) return;
    setMediaError("");

    if (!isEditMode) {
      // Create mode: nothing to upload yet — just hold the file and
      // preview it. Actual upload happens on form submit.
      setPendingMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
      return;
    }

    if (!banner) return;

    const objectUrl = URL.createObjectURL(file);
    setMediaPreview(objectUrl);

    try {
      const result = await uploadBannerMedia({ id: banner.id, mediaType, file }).unwrap();
      setMediaUrl(result.mediaType === 1 ? result.imageUrl : result.videoUrl);
    } catch (err) {
      setMediaError(extractApiError(err));
    } finally {
      URL.revokeObjectURL(objectUrl);
      setMediaPreview(null);
      if (mediaInputRef.current) mediaInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setName("");
    setTagLabel("");
    setHeading("");
    setHighlightText("");
    setDescription("");
    setMediaType(1);
    setCtaText("");
    setCtaLink("");
    setDisplayOrder(0);
    setIsActive(true);
    setErrors({});
    setServerError("");
    setPendingMediaFile(null);
    setMediaPreview(null);
    setMediaError("");
  };

  if (!open) return null;

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = "Name is required.";
    if (!tagLabel.trim()) next.tagLabel = "Tag label is required.";
    if (!heading.trim()) next.heading = "Heading is required.";
    if (!highlightText.trim()) next.highlightText = "Highlight text is required.";
    if (!description.trim()) next.description = "Description is required.";
    if (!ctaText.trim()) next.ctaText = "CTA text is required.";
    if (!ctaLink.trim()) next.ctaLink = "CTA link is required.";
    // Media is required on create. In edit mode media already exists
    // (or was uploaded separately above) — nothing to validate.
    if (!isEditMode && !pendingMediaFile) {
      next.media = "Banner media is required.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    const formFields = {
      name: name.trim(),
      tagLabel: tagLabel.trim(),
      heading: heading.trim(),
      highlightText: highlightText.trim(),
      description: description.trim(),
      mediaType,
      ctaText: ctaText.trim(),
      ctaLink: ctaLink.trim(),
      displayOrder,
      isActive,
    };

    try {
      if (isEditMode && banner) {
        await updateBanner({ id: banner.id, input: formFields }).unwrap();
      } else {
        // pendingMediaFile is guaranteed non-null here — validate()
        // above already blocked submission without one in create mode.
        await createBanner({ ...formFields, media: pendingMediaFile as File }).unwrap();
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
      <div className="w-full max-w-[600px] bg-white border border-[#e8e4dc] rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h2 className="text-[#1c1a17] text-lg font-black">{isEditMode ? "Edit banner" : "Add banner"}</h2>
            <p className="text-[#a39e96] text-xs mt-1">
              {isEditMode ? "Update this banner's details" : "All fields and media are required."}
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
              className="w-14 h-14 rounded-xl border bg-[#f7f5f1] overflow-hidden flex items-center justify-center shrink-0"
              style={{ borderColor: errors.media ? "#f0997b" : "#e2ddd5" }}
            >
              {mediaPreview || mediaUrl ? (
                mediaType === 1 ? (
                  <img
                    src={mediaPreview ?? getUploadUrl(mediaUrl) ?? undefined}
                    alt={isEditMode ? "Banner media" : "Banner media preview"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={mediaPreview ?? getUploadUrl(mediaUrl) ?? undefined}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                )
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
                onClick={() => mediaInputRef.current?.click()}
                disabled={uploadingMedia}
                className="cursor-pointer text-[11px] font-bold px-3 py-1.5 rounded-lg border border-[#e2ddd5] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors disabled:opacity-50"
              >
                {uploadingMedia ? "Uploading..." : mediaUrl || pendingMediaFile ? "Change media" : "Upload media"}
              </button>
              <input
                ref={mediaInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime"
                onChange={(e) => handleMediaSelect(e.target.files?.[0])}
                className="hidden"
              />
              <p className="text-[10px] text-[#a39e96] mt-1">JPG/PNG/WEBP/AVIF up to 2MB, or MP4/WEBM/MOV up to 100MB.</p>
              {errors.media && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.media}</p>}
              {mediaError && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{mediaError}</p>}
            </div>
          </div>

          <Field label="Media type">
            <select
              value={mediaType}
              onChange={(e) => setMediaType(Number(e.target.value))}
              className={selectClass}
              style={{ borderColor: "#e2ddd5" }}
            >
              {BANNER_MEDIA_TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Summer Sale Banner"
                className={inputClass}
                style={{ borderColor: errors.name ? "#f0997b" : "#e2ddd5" }}
              />
              {errors.name && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.name}</p>}
            </Field>
            <Field label="Tag label">
              <input
                type="text"
                value={tagLabel}
                onChange={(e) => setTagLabel(e.target.value)}
                placeholder="e.g. Limited Time"
                className={inputClass}
                style={{ borderColor: errors.tagLabel ? "#f0997b" : "#e2ddd5" }}
              />
              {errors.tagLabel && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.tagLabel}</p>}
            </Field>
          </div>

          <Field label="Heading">
            <input
              type="text"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              placeholder="e.g. Drive Home Your Dream Car"
              className={inputClass}
              style={{ borderColor: errors.heading ? "#f0997b" : "#e2ddd5" }}
            />
            {errors.heading && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.heading}</p>}
          </Field>

          <Field label="Highlight text">
            <input
              type="text"
              value={highlightText}
              onChange={(e) => setHighlightText(e.target.value)}
              placeholder="e.g. Today"
              className={inputClass}
              style={{ borderColor: errors.highlightText ? "#f0997b" : "#e2ddd5" }}
            />
            {errors.highlightText && (
              <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.highlightText}</p>
            )}
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short supporting line shown below the heading"
              rows={3}
              maxLength={300}
              className={`${inputClass} resize-none`}
              style={{ borderColor: errors.description ? "#f0997b" : "#e2ddd5" }}
            />
            {errors.description && (
              <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.description}</p>
            )}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="CTA text">
              <input
                type="text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="e.g. Explore Now"
                className={inputClass}
                style={{ borderColor: errors.ctaText ? "#f0997b" : "#e2ddd5" }}
              />
              {errors.ctaText && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.ctaText}</p>}
            </Field>
            <Field label="CTA link">
              <input
                type="text"
                value={ctaLink}
                onChange={(e) => setCtaLink(e.target.value)}
                placeholder="https://..."
                className={inputClass}
                style={{ borderColor: errors.ctaLink ? "#f0997b" : "#e2ddd5" }}
              />
              {errors.ctaLink && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.ctaLink}</p>}
            </Field>
          </div>

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

          <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded accent-[#D4300F] cursor-pointer"
            />
            <span className="text-sm font-medium text-[#4a4640]">Active</span>
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
                "Create banner"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
