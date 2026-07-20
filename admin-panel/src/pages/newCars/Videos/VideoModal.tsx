// src/pages/newCars/Videos/VideoModal.tsx
import { useRef, useState } from "react";
import {
  useCreateVideoMutation,
  useUpdateVideoMutation,
  useUploadVideoThumbnailMutation,
  type VideoRecord,
} from "./video.api";
import { useGetCarModelOptionsQuery } from "../carModels/carModel.api";
import { VIDEO_TYPE_OPTIONS } from "../../../lib/lookups";
import { extractApiError, getUploadUrl } from "../../../lib/apiClient";

const ACCENT = "#D4300F";

// Every field here is required, on both Add and Edit — no optional
// fields in this module (same convention as faq/FaqModal.tsx). Thumbnail
// is required on create; on edit it's replaced via its own upload button
// (same split as BrandModal.tsx's logo).
interface FieldErrors {
  modelId?: string;
  title?: string;
  videoType?: string;
  videoUrl?: string;
  durationSeconds?: string;
  publishedAt?: string;
  thumbnail?: string;
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

const inputClass =
  "w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white";
const selectClass =
  "cursor-pointer w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white";

// Prisma dates arrive as full ISO strings — <input type="date"> needs
// just the yyyy-mm-dd portion.
function toDateInputValue(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export default function VideoModal({
  open,
  onClose,
  video,
}: {
  open: boolean;
  onClose: () => void;
  // Present -> edit mode. Absent/null -> create mode.
  video?: VideoRecord | null;
}) {
  const isEditMode = !!video;

  const { data: carModels = [] } = useGetCarModelOptionsQuery();

  const [modelId, setModelId] = useState<number | "">(video?.modelId ?? "");
  const [title, setTitle] = useState(video ? video.title : "");
  const [videoType, setVideoType] = useState<number | "">(video?.videoType ?? "");
  const [videoUrl, setVideoUrl] = useState(video ? video.videoUrl : "");
  const [durationSeconds, setDurationSeconds] = useState(
    video ? String(video.durationSeconds) : "",
  );
  const [publishedAt, setPublishedAt] = useState(toDateInputValue(video?.publishedAt));
  // No default — isActive must be an explicit, deliberate choice on
  // every save (same "all fields mandatory" rule as FaqModal.tsx).
  const [isActive, setIsActive] = useState<boolean>(video?.isActive ?? true);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  const [createVideo, { isLoading: creating }] = useCreateVideoMutation();
  const [updateVideo, { isLoading: updating }] = useUpdateVideoMutation();
  const saving = creating || updating;

  // Thumbnail is required on create — same upload mechanics as BrandModal.tsx's logo.
  const [uploadVideoThumbnail, { isLoading: uploadingThumbnail }] = useUploadVideoThumbnailMutation();
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(video?.thumbnailUrl ?? null);
  const [pendingThumbnailFile, setPendingThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState("");
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const handleThumbnailSelect = async (file: File | undefined) => {
    if (!file) return;
    setThumbnailError("");

    if (!isEditMode) {
      // Create mode: nothing to upload yet — just hold the file and
      // preview it. Actual upload happens on form submit.
      setPendingThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
      return;
    }

    if (!video) return;

    // Edit mode: instant local preview while the upload is in flight.
    const objectUrl = URL.createObjectURL(file);
    setThumbnailPreview(objectUrl);

    try {
      const result = await uploadVideoThumbnail({ id: video.id, file }).unwrap();
      setThumbnailUrl(result.thumbnailUrl);
    } catch (err) {
      setThumbnailError(extractApiError(err));
    } finally {
      URL.revokeObjectURL(objectUrl);
      setThumbnailPreview(null);
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setModelId("");
    setTitle("");
    setVideoType("");
    setVideoUrl("");
    setDurationSeconds("");
    setPublishedAt("");
    setIsActive(true);
    setErrors({});
    setServerError("");
    setPendingThumbnailFile(null);
    setThumbnailPreview(null);
    setThumbnailError("");
  };

  if (!open) return null;

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!modelId) next.modelId = "Car model is required.";
    if (title.trim().length < 2) next.title = "Title must be at least 2 characters.";
    if (!videoType) next.videoType = "Video type is required.";
    if (!videoUrl.trim() || !isValidUrl(videoUrl.trim())) next.videoUrl = "A valid video URL is required.";
    if (
      durationSeconds === "" ||
      !Number.isInteger(Number(durationSeconds)) ||
      Number(durationSeconds) <= 0
    ) {
      next.durationSeconds = "Duration is required (a positive whole number of seconds).";
    }
    if (!publishedAt) next.publishedAt = "Publish date is required.";
    // Thumbnail is required on create. In edit mode a thumbnail already
    // exists (or was replaced separately above) — nothing to validate here.
    if (!isEditMode && !pendingThumbnailFile) {
      next.thumbnail = "Video thumbnail is required.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    try {
      if (isEditMode && video) {
        await updateVideo({
          id: video.id,
          input: {
            modelId: Number(modelId),
            title: title.trim(),
            videoType: Number(videoType),
            videoUrl: videoUrl.trim(),
            durationSeconds: Number(durationSeconds),
            publishedAt,
            isActive,
          },
        }).unwrap();
      } else {
        // pendingThumbnailFile is guaranteed non-null here — validate()
        // above already blocked submission without one in create mode.
        await createVideo({
          modelId: Number(modelId),
          title: title.trim(),
          videoType: Number(videoType),
          videoUrl: videoUrl.trim(),
          durationSeconds: Number(durationSeconds),
          publishedAt,
          isActive,
          thumbnail: pendingThumbnailFile as File,
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
      <div className="w-full max-w-[600px] bg-white border border-[#e8e4dc] rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h2 className="text-[#1c1a17] text-lg font-black">
              {isEditMode ? "Edit video" : "Add video"}
            </h2>
            <p className="text-[#a39e96] text-xs mt-1">
              {isEditMode ? "Update this video's details" : "All fields are required."}
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
              style={{ borderColor: errors.thumbnail ? "#f0997b" : "#e2ddd5" }}
            >
              {thumbnailPreview || thumbnailUrl ? (
                <img
                  src={thumbnailPreview ?? getUploadUrl(thumbnailUrl) ?? undefined}
                  alt={isEditMode ? `${video?.title} thumbnail` : "Video thumbnail preview"}
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
                onClick={() => thumbnailInputRef.current?.click()}
                disabled={uploadingThumbnail}
                className="cursor-pointer text-[11px] font-bold px-3 py-1.5 rounded-lg border border-[#e2ddd5] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors disabled:opacity-50"
              >
                {uploadingThumbnail
                  ? "Uploading..."
                  : thumbnailUrl || pendingThumbnailFile
                  ? "Change thumbnail"
                  : "Upload thumbnail"}
              </button>
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(e) => handleThumbnailSelect(e.target.files?.[0])}
                className="hidden"
              />
              <p className="text-[10px] text-[#a39e96] mt-1">JPG, PNG, WEBP or AVIF, up to 2MB.</p>
              {errors.thumbnail && (
                <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.thumbnail}</p>
              )}
              {thumbnailError && (
                <p className="text-[11px] font-medium text-[#D4300F] mt-1">{thumbnailError}</p>
              )}
            </div>
          </div>

          <Field label="Car model">
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value ? Number(e.target.value) : "")}
              className={selectClass}
              style={{ borderColor: errors.modelId ? "#f0997b" : "#e2ddd5" }}
            >
              <option value="">Select a car model</option>
              {carModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.brand.name} — {m.name}
                </option>
              ))}
            </select>
            {errors.modelId && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.modelId}</p>}
          </Field>

          <Field label="Title">
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. First Look & Walkaround"
              className={inputClass}
              style={{
                borderColor: errors.title ? "#f0997b" : "#e2ddd5",
                boxShadow: errors.title ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
              }}
            />
            {errors.title && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.title}</p>}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Video type">
              <select
                value={videoType}
                onChange={(e) => setVideoType(e.target.value ? Number(e.target.value) : "")}
                className={selectClass}
                style={{ borderColor: errors.videoType ? "#f0997b" : "#e2ddd5" }}
              >
                <option value="">Select type</option>
                {VIDEO_TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {errors.videoType && (
                <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.videoType}</p>
              )}
            </Field>

            <Field label="Duration (seconds)">
              <input
                type="number"
                min={1}
                step="1"
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(e.target.value)}
                placeholder="e.g. 240"
                className={inputClass}
                style={{
                  borderColor: errors.durationSeconds ? "#f0997b" : "#e2ddd5",
                  boxShadow: errors.durationSeconds ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
                }}
              />
              {errors.durationSeconds && (
                <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.durationSeconds}</p>
              )}
            </Field>
          </div>

          <Field label="Video URL">
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="e.g. https://youtube.com/watch?v=..."
              className={inputClass}
              style={{
                borderColor: errors.videoUrl ? "#f0997b" : "#e2ddd5",
                boxShadow: errors.videoUrl ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
              }}
            />
            {errors.videoUrl && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.videoUrl}</p>}
          </Field>

          <Field label="Publish date">
            <input
              type="date"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              className={inputClass}
              style={{
                borderColor: errors.publishedAt ? "#f0997b" : "#e2ddd5",
                boxShadow: errors.publishedAt ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
              }}
            />
            {errors.publishedAt && (
              <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.publishedAt}</p>
            )}
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
                "Create video"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}