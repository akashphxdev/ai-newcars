// frontend/src/pages/Stories/StoryItems/StoryItemModal.tsx
import { useState } from "react";
import {
  useCreateStoryItemMutation,
  useUpdateStoryItemMutation,
  useUploadStoryItemMediaMutation,
  type StoryItemRecord,
  type MediaType,
  type StoryItemStatus,
} from "./storyItem.api";
import { useGetStoryGroupsQuery } from "../StoryGroups/storyGroup.api";
import { extractApiError, getUploadUrl } from "../../../lib/apiClient";
import MediaUploadField from "../../../components/common/MediaUploadField";

const ACCENT = "#D4300F";
const MEDIA_TYPES: MediaType[] = ["image", "video"];
const STATUS_OPTIONS: StoryItemStatus[] = ["draft", "published", "scheduled"];

// Accept/size hints per media type — the actual size/mime enforcement
// lives server-side in upload.middleware.ts's mediaUploader; these just
// keep the file picker and helper text in sync with it.
const MEDIA_ACCEPT: Record<MediaType, string> = {
  image: "image/jpeg,image/png,image/webp",
  video: "video/mp4,video/webm,video/quicktime",
};
const MEDIA_HINT: Record<MediaType, string> = {
  image: "JPG, PNG or WEBP, up to 2MB.",
  video: "MP4, WEBM or MOV, up to 100MB.",
};

interface FieldErrors {
  groupId?: string;
  media?: string;
  link?: string;
  displayOrder?: string;
  startAt?: string;
  endAt?: string;
}

function Field({
  label,
  children,
  optional,
}: {
  label: string;
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1.5">
        {label} {optional && <span className="normal-case font-medium text-[#c0bab0]">(optional)</span>}
      </label>
      {children}
    </div>
  );
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const inputClass =
  "w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white";
const selectClass = `cursor-pointer ${inputClass}`;

export default function StoryItemModal({
  open,
  onClose,
  item,
}: {
  open: boolean;
  onClose: () => void;
  item?: StoryItemRecord | null;
}) {
  const isEditMode = !!item;

  const { data: groupsData } = useGetStoryGroupsQuery({ page: 1, limit: 100, sortBy: "title", sortOrder: "asc" });
  const groups = groupsData?.data ?? [];

  const [groupId, setGroupId] = useState<number | "">(item?.groupId ?? "");
  const [mediaType, setMediaType] = useState<MediaType>(item?.mediaType ?? "image");
  const [description, setDescription] = useState(item?.description ?? "");
  const [link, setLink] = useState(item?.link ?? "");
  const [status, setStatus] = useState<StoryItemStatus>(item?.status ?? "draft");
  const [startAt, setStartAt] = useState(toDatetimeLocal(item?.startAt));
  const [endAt, setEndAt] = useState(toDatetimeLocal(item?.endAt));
  const [displayOrder, setDisplayOrder] = useState(item ? String(item.displayOrder) : "");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");

  const [createStoryItem, { isLoading: creating }] = useCreateStoryItemMutation();
  const [updateStoryItem, { isLoading: updating }] = useUpdateStoryItemMutation();
  const saving = creating || updating;

  const [uploadStoryItemMedia, { isLoading: uploadingMedia }] = useUploadStoryItemMediaMutation();
  const [mediaFileUrl, setMediaFileUrl] = useState<string | null>(item?.mediaUrl ?? null);
  const [pendingMediaFile, setPendingMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState("");

  const handleMediaTypeChange = (type: MediaType) => {
    setMediaType(type);
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setPendingMediaFile(null);
    setMediaPreview(null);
    setMediaError("");
    setMediaFileUrl(item?.mediaType === type ? item.mediaUrl : null);
  };

  const handleMediaSelect = async (file: File) => {
    setMediaError("");

    if (!isEditMode) {
      if (mediaPreview) URL.revokeObjectURL(mediaPreview);
      setPendingMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
      return;
    }

    if (!item) return;

    const objectUrl = URL.createObjectURL(file);
    setMediaPreview(objectUrl);

    try {
      const result = await uploadStoryItemMedia({ id: item.id, file, mediaType }).unwrap();
      setMediaFileUrl(result.mediaUrl);
    } catch (err) {
      setMediaError(extractApiError(err));
    } finally {
      URL.revokeObjectURL(objectUrl);
      setMediaPreview(null);
    }
  };

  const resetForm = () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setGroupId("");
    setMediaType("image");
    setDescription("");
    setLink("");
    setStatus("draft");
    setStartAt("");
    setEndAt("");
    setDisplayOrder("");
    setErrors({});
    setServerError("");
    setMediaFileUrl(null);
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
    if (!groupId) next.groupId = "Story group is required.";

    if (!isEditMode && !pendingMediaFile) {
      next.media = `Media ${mediaType} is required.`;
    } else if (isEditMode && !mediaFileUrl) {
      next.media = "Upload the media first (use the button above).";
    }

    if (link.trim() && !isValidUrl(link.trim())) {
      next.link = "Must be a valid URL.";
    }

    if (!displayOrder.trim()) {
      next.displayOrder = "Display order is required.";
    } else if (!/^\d+$/.test(displayOrder.trim())) {
      next.displayOrder = "Must be a whole number, 0 or greater.";
    }

    if (status === "scheduled" && !startAt) {
      next.startAt = "Start date/time is required for scheduled items.";
    }

    if (startAt && endAt && new Date(startAt) > new Date(endAt)) {
      next.endAt = "End must be on or after start.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    const commonInput = {
      groupId: Number(groupId),
      mediaType,
      description: description.trim() || null,
      link: link.trim() || null,
      status,
      startAt: fromDatetimeLocal(startAt),
      endAt: fromDatetimeLocal(endAt),
      displayOrder: Number(displayOrder),
    };

    try {
      if (isEditMode && item) {
        await updateStoryItem({ id: item.id, input: commonInput }).unwrap();
      } else {
        await createStoryItem({
          ...commonInput,
          media: pendingMediaFile as File,
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
      <div className="w-full max-w-[560px] bg-white border border-[#e8e4dc] rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h2 className="text-[#1c1a17] text-lg font-black">
              {isEditMode ? "Edit story item" : "Add story item"}
            </h2>
            <p className="text-[#a39e96] text-xs mt-1">
              {isEditMode
                ? "Update this slide's details"
                : "Group and media are required; description/link are optional."}
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
          <Field label="Story group">
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value ? Number(e.target.value) : "")}
              className={selectClass}
              style={{ borderColor: errors.groupId ? "#f0997b" : "#e2ddd5" }}
            >
              <option value="">Select a story group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
            {errors.groupId && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.groupId}</p>}
          </Field>

          <Field label="Media type">
            <div className="flex gap-2">
              {MEDIA_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleMediaTypeChange(type)}
                  className="cursor-pointer flex-1 text-[12px] font-bold px-3 py-2 rounded-xl border capitalize transition-colors"
                  style={
                    mediaType === type
                      ? { background: ACCENT, borderColor: ACCENT, color: "#fff" }
                      : { background: "#f7f5f1", borderColor: "#e2ddd5", color: "#4a4640" }
                  }
                >
                  {type}
                </button>
              ))}
            </div>
          </Field>

          <MediaUploadField
            label="media"
            accept={MEDIA_ACCEPT[mediaType]}
            hint={MEDIA_HINT[mediaType]}
            previewUrl={mediaPreview ?? getUploadUrl(mediaFileUrl)}
            isVideo={mediaType === "video"}
            onSelect={handleMediaSelect}
            uploading={uploadingMedia}
            hasValue={!!(mediaFileUrl || pendingMediaFile)}
            error={errors.media || mediaError}
          />

          <Field label="Description" optional>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short caption shown on the slide"
              rows={3}
              maxLength={300}
              className={`${inputClass} resize-none`}
              style={{ borderColor: "#e2ddd5" }}
            />
          </Field>

          <Field label="Link" optional>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="e.g. https://timesauto.in/cars/creta"
              maxLength={255}
              className={inputClass}
              style={{
                borderColor: errors.link ? "#f0997b" : "#e2ddd5",
                boxShadow: errors.link ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
              }}
            />
            {errors.link && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.link}</p>}
          </Field>

          <Field label="Status">
            <select
              value={status}
              onChange={(e) => {
                const next = e.target.value as StoryItemStatus;
                setStatus(next);
                // Clear stale start/end values when moving away from
                // "scheduled" so they don't silently save alongside an
                // unrelated status.
                if (next !== "scheduled") {
                  setStartAt("");
                  setEndAt("");
                }
              }}
              className={selectClass}
              style={{ borderColor: "#e2ddd5" }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s}
                </option>
              ))}
            </select>
          </Field>

          {status === "scheduled" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start">
                <input
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  className={inputClass}
                  style={{
                    borderColor: errors.startAt ? "#f0997b" : "#e2ddd5",
                    boxShadow: errors.startAt ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
                  }}
                />
                {errors.startAt && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.startAt}</p>}
              </Field>

              <Field label="End" optional>
                <input
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  className={inputClass}
                  style={{
                    borderColor: errors.endAt ? "#f0997b" : "#e2ddd5",
                    boxShadow: errors.endAt ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
                  }}
                />
                {errors.endAt && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.endAt}</p>}
              </Field>
            </div>
          )}

          <Field label="Display order">
            <input
              type="number"
              min={0}
              step="1"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              placeholder="e.g. 1"
              className={inputClass}
              style={{
                borderColor: errors.displayOrder ? "#f0997b" : "#e2ddd5",
                boxShadow: errors.displayOrder ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
              }}
            />
            <p className="text-[10px] text-[#a39e96] mt-1">Must be unique within the selected story group.</p>
            {errors.displayOrder && (
              <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.displayOrder}</p>
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
                "Create story item"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
