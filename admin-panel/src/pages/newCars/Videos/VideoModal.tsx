// src/pages/newCars/Videos/VideoModal.tsx
import { useRef, useState } from "react";
import {
  useCreateVideoMutation,
  useUpdateVideoMutation,
  VIDEO_TYPES,
  type VideoRecord,
  type VideoTypeValue,
} from "./video.api";
import { useGetCarModelsQuery } from "../carModels/carModel.api";
import { extractApiError } from "../../../lib/apiClient";

const ACCENT = "#D4300F";

const VIDEO_TYPE_LABELS: Record<VideoTypeValue, string> = {
  review: "Review",
  teaser: "Teaser",
  walkaround: "Walkaround",
  comparison: "Comparison",
  launch: "Launch",
  other: "Other",
};

// modelId, title and videoUrl are required — videoType, thumbnailUrl,
// durationSeconds and publishedAt are all optional, mirroring the
// schema's own nullable columns.
interface FieldErrors {
  modelId?: string;
  title?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  durationSeconds?: string;
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

// Prisma dates arrive as full ISO strings — <input type="date"> needs
// just the yyyy-mm-dd portion.
function toDateInputValue(value: string | null): string {
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

  // NOTE: same 100-row cap used elsewhere (Brand dropdown, Country
  // dropdown, Variant/Offer modals).
  const { data: carModelsData } = useGetCarModelsQuery({ limit: 100, sortBy: "name", sortOrder: "asc" });
  const carModels = carModelsData?.data ?? [];

  const [modelId, setModelId] = useState<number | "">(video?.modelId ?? "");
  const [title, setTitle] = useState(video ? video.title : "");
  const [videoType, setVideoType] = useState<VideoTypeValue | "">(
    (video?.videoType as VideoTypeValue) ?? "",
  );
  const [videoUrl, setVideoUrl] = useState(video ? video.videoUrl : "");
  const [thumbnailUrl, setThumbnailUrl] = useState(video?.thumbnailUrl ?? "");
  const [durationSeconds, setDurationSeconds] = useState(
    video?.durationSeconds != null ? String(video.durationSeconds) : "",
  );
  const [publishedAt, setPublishedAt] = useState(toDateInputValue(video?.publishedAt ?? null));

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  const [createVideo, { isLoading: creating }] = useCreateVideoMutation();
  const [updateVideo, { isLoading: updating }] = useUpdateVideoMutation();
  const saving = creating || updating;

  const resetForm = () => {
    setModelId("");
    setTitle("");
    setVideoType("");
    setVideoUrl("");
    setThumbnailUrl("");
    setDurationSeconds("");
    setPublishedAt("");
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
    if (!modelId) next.modelId = "Car model is required.";
    if (title.trim().length < 2) next.title = "Title must be at least 2 characters.";
    if (!videoUrl.trim() || !isValidUrl(videoUrl.trim())) next.videoUrl = "A valid video URL is required.";
    if (thumbnailUrl.trim() && !isValidUrl(thumbnailUrl.trim())) {
      next.thumbnailUrl = "Thumbnail URL must be a valid URL.";
    }
    if (durationSeconds !== "" && (!Number.isInteger(Number(durationSeconds)) || Number(durationSeconds) <= 0)) {
      next.durationSeconds = "Duration must be a positive whole number of seconds.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    // validate() above already guarantees modelId/videoUrl are set — the
    // cast here just satisfies TypeScript.
    const payload = {
      modelId: Number(modelId),
      title: title.trim(),
      videoType: videoType || null,
      videoUrl: videoUrl.trim(),
      thumbnailUrl: thumbnailUrl.trim() || null,
      durationSeconds: durationSeconds === "" ? null : Number(durationSeconds),
      publishedAt: publishedAt || null,
    };

    try {
      if (isEditMode && video) {
        await updateVideo({ id: video.id, input: payload }).unwrap();
      } else {
        await createVideo(payload).unwrap();
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
              {isEditMode ? "Update this video's details" : "Car model, title and video URL are required."}
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
            <Field label="Video type" optional>
              <select
                value={videoType}
                onChange={(e) => setVideoType((e.target.value as VideoTypeValue) || "")}
                className={selectClass}
                style={{ borderColor: "#e2ddd5" }}
              >
                <option value="">Select type</option>
                {VIDEO_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {VIDEO_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Duration (seconds)" optional>
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

          <Field label="Thumbnail URL" optional>
            <input
              type="text"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="e.g. https://.../thumbnail.jpg"
              className={inputClass}
              style={{
                borderColor: errors.thumbnailUrl ? "#f0997b" : "#e2ddd5",
                boxShadow: errors.thumbnailUrl ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
              }}
            />
            {errors.thumbnailUrl && (
              <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.thumbnailUrl}</p>
            )}
          </Field>

          <Field label="Publish date" optional>
            <input
              type="date"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              className={inputClass}
              style={{ borderColor: "#e2ddd5" }}
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