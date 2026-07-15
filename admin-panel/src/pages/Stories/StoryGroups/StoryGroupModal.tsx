// frontend/src/pages/Stories/StoryGroups/StoryGroupModal.tsx
import { useRef, useState } from "react";
import {
  useCreateStoryGroupMutation,
  useUpdateStoryGroupMutation,
  useUploadStoryGroupCoverMutation,
  type StoryGroupRecord,
  type MediaType,
} from "./storyGroup.api";
import { extractApiError, getUploadUrl } from "../../../lib/apiClient";

const ACCENT = "#D4300F";
const MEDIA_TYPES: MediaType[] = ["image", "video"];

interface FieldErrors {
  title?: string;
  coverMediaUrl?: string;
  cover?: string;
  displayOrder?: string;
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

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

const inputClass =
  "w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white";

export default function StoryGroupModal({
  open,
  onClose,
  group,
}: {
  open: boolean;
  onClose: () => void;
  group?: StoryGroupRecord | null;
}) {
  const isEditMode = !!group;

  const [title, setTitle] = useState(group ? group.title : "");
  const [coverMediaType, setCoverMediaType] = useState<MediaType>(group?.coverMediaType ?? "image");
  const [coverMediaUrl, setCoverMediaUrl] = useState(
    group?.coverMediaType === "video" ? group.coverMediaUrl : "",
  );
  const [displayOrder, setDisplayOrder] = useState(group ? String(group.displayOrder) : "");
  const [isActive, setIsActive] = useState<boolean>(group?.isActive ?? true);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");

  const [createStoryGroup, { isLoading: creating }] = useCreateStoryGroupMutation();
  const [updateStoryGroup, { isLoading: updating }] = useUpdateStoryGroupMutation();
  const saving = creating || updating;

  const [uploadStoryGroupCover, { isLoading: uploadingCover }] = useUploadStoryGroupCoverMutation();
  const [coverUrl, setCoverUrl] = useState<string | null>(
    group?.coverMediaType === "image" ? group.coverMediaUrl : null,
  );
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverError, setCoverError] = useState("");
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleCoverSelect = async (file: File | undefined) => {
    if (!file) return;
    setCoverError("");

    if (!isEditMode) {
      setPendingCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
      return;
    }

    if (!group) return;

    const objectUrl = URL.createObjectURL(file);
    setCoverPreview(objectUrl);

    try {
      const result = await uploadStoryGroupCover({ id: group.id, file }).unwrap();
      setCoverUrl(result.coverMediaUrl);
      setCoverMediaType("image");
    } catch (err) {
      setCoverError(extractApiError(err));
    } finally {
      URL.revokeObjectURL(objectUrl);
      setCoverPreview(null);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setTitle("");
    setCoverMediaType("image");
    setCoverMediaUrl("");
    setDisplayOrder("");
    setIsActive(true);
    setErrors({});
    setServerError("");
    setPendingCoverFile(null);
    setCoverPreview(null);
    setCoverError("");
  };

  if (!open) return null;

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};

    if (title.trim().length < 2) {
      next.title = "Title must be at least 2 characters.";
    } else if (title.trim().length > 100) {
      next.title = "Title must be at most 100 characters.";
    }

    if (!displayOrder.trim()) {
      next.displayOrder = "Display order is required.";
    } else if (!/^\d+$/.test(displayOrder.trim())) {
      next.displayOrder = "Must be a whole number, 0 or greater.";
    }

    if (coverMediaType === "video") {
      if (!coverMediaUrl.trim()) {
        next.coverMediaUrl = "Video URL is required.";
      } else if (!isValidUrl(coverMediaUrl.trim())) {
        next.coverMediaUrl = "Must be a valid URL.";
      } else if (coverMediaUrl.trim().length > 255) {
        next.coverMediaUrl = "Must be 255 characters or fewer.";
      }
    } else if (!isEditMode && !pendingCoverFile) {
      next.cover = "Cover image is required.";
    } else if (isEditMode && !coverUrl) {
      next.cover = "Upload a cover image first (use the button above).";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    try {
      if (isEditMode && group) {
        await updateStoryGroup({
          id: group.id,
          input: {
            title: title.trim(),
            coverMediaType,
            coverMediaUrl: coverMediaType === "video" ? coverMediaUrl.trim() : undefined,
            displayOrder: Number(displayOrder),
            isActive,
          },
        }).unwrap();
      } else {
        await createStoryGroup({
          title: title.trim(),
          coverMediaType,
          coverMediaUrl: coverMediaType === "video" ? coverMediaUrl.trim() : undefined,
          displayOrder: Number(displayOrder),
          isActive,
          cover: coverMediaType === "image" ? (pendingCoverFile as File) : undefined,
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
      <div className="w-full max-w-[520px] bg-white border border-[#e8e4dc] rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h2 className="text-[#1c1a17] text-lg font-black">
              {isEditMode ? "Edit story group" : "Add story group"}
            </h2>
            <p className="text-[#a39e96] text-xs mt-1">
              {isEditMode ? `Update details for ${group?.title}` : "Create a new story group."}
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
          <Field label="Title">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Top 5 SUVs this month"
              maxLength={100}
              className={inputClass}
              style={{
                borderColor: errors.title ? "#f0997b" : "#e2ddd5",
                boxShadow: errors.title ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
              }}
            />
            {errors.title && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.title}</p>}
          </Field>

          <Field label="Cover type">
            <div className="flex gap-2">
              {MEDIA_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setCoverMediaType(type)}
                  className="cursor-pointer flex-1 text-[12px] font-bold px-3 py-2 rounded-xl border capitalize transition-colors"
                  style={
                    coverMediaType === type
                      ? { background: ACCENT, borderColor: ACCENT, color: "#fff" }
                      : { background: "#f7f5f1", borderColor: "#e2ddd5", color: "#4a4640" }
                  }
                >
                  {type}
                </button>
              ))}
            </div>
          </Field>

          {coverMediaType === "image" ? (
            <div className="flex items-center gap-3 pb-1">
              <div
                className="w-14 h-14 rounded-xl border bg-[#f7f5f1] overflow-hidden flex items-center justify-center shrink-0"
                style={{ borderColor: errors.cover ? "#f0997b" : "#e2ddd5" }}
              >
                {coverPreview || getUploadUrl(coverUrl) ? (
                  <img
                    src={coverPreview ?? getUploadUrl(coverUrl) ?? undefined}
                    alt="Cover preview"
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
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="cursor-pointer text-[11px] font-bold px-3 py-1.5 rounded-lg border border-[#e2ddd5] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors disabled:opacity-50"
                >
                  {uploadingCover
                    ? "Uploading..."
                    : coverUrl || pendingCoverFile
                    ? "Change cover image"
                    : "Upload cover image"}
                </button>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleCoverSelect(e.target.files?.[0])}
                  className="hidden"
                />
                <p className="text-[10px] text-[#a39e96] mt-1">JPG, PNG or WEBP, up to 2MB.</p>
                {(errors.cover || coverError) && (
                  <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.cover || coverError}</p>
                )}
              </div>
            </div>
          ) : (
            <Field label="Cover video URL">
              <input
                type="text"
                value={coverMediaUrl}
                onChange={(e) => setCoverMediaUrl(e.target.value)}
                placeholder="https://..."
                maxLength={255}
                className={inputClass}
                style={{
                  borderColor: errors.coverMediaUrl ? "#f0997b" : "#e2ddd5",
                  boxShadow: errors.coverMediaUrl ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
                }}
              />
              {errors.coverMediaUrl && (
                <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.coverMediaUrl}</p>
              )}
            </Field>
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
            <p className="text-[10px] text-[#a39e96] mt-1">Must be unique across all story groups.</p>
            {errors.displayOrder && (
              <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.displayOrder}</p>
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
                "Create story group"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}