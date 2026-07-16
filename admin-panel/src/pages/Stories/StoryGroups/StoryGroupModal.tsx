// frontend/src/pages/Stories/StoryGroups/StoryGroupModal.tsx
import { useState } from "react";
import {
  useCreateStoryGroupMutation,
  useUpdateStoryGroupMutation,
  useUploadStoryGroupCoverMutation,
  type StoryGroupRecord,
  type MediaType,
} from "./storyGroup.api";
import { extractApiError, getUploadUrl } from "../../../lib/apiClient";
import MediaUploadField from "../../../components/common/MediaUploadField";

const ACCENT = "#D4300F";
const MEDIA_TYPES: MediaType[] = ["image", "video"];

// Accept/size hints per media type — the actual size/mime enforcement
// lives server-side in upload.middleware.ts's mediaUploader; these just
// keep the file picker and helper text in sync with it.
const COVER_ACCEPT: Record<MediaType, string> = {
  image: "image/jpeg,image/png,image/webp",
  video: "video/mp4,video/webm,video/quicktime",
};
const COVER_HINT: Record<MediaType, string> = {
  image: "JPG, PNG or WEBP, up to 2MB.",
  video: "MP4, WEBM or MOV, up to 100MB.",
};

interface FieldErrors {
  title?: string;
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
  const [displayOrder, setDisplayOrder] = useState(group ? String(group.displayOrder) : "");
  const [isActive, setIsActive] = useState<boolean>(group?.isActive ?? true);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");

  const [createStoryGroup, { isLoading: creating }] = useCreateStoryGroupMutation();
  const [updateStoryGroup, { isLoading: updating }] = useUpdateStoryGroupMutation();
  const saving = creating || updating;

  const [uploadStoryGroupCover, { isLoading: uploadingCover }] = useUploadStoryGroupCoverMutation();
  const [coverUrl, setCoverUrl] = useState<string | null>(group?.coverMediaUrl ?? null);
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverError, setCoverError] = useState("");

  const handleCoverTypeChange = (type: MediaType) => {
    setCoverMediaType(type);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setPendingCoverFile(null);
    setCoverPreview(null);
    setCoverError("");
    setCoverUrl(group?.coverMediaType === type ? group.coverMediaUrl : null);
  };

  const handleCoverSelect = async (file: File) => {
    setCoverError("");

    if (!isEditMode) {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      setPendingCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
      return;
    }

    if (!group) return;

    const objectUrl = URL.createObjectURL(file);
    setCoverPreview(objectUrl);

    try {
      const result = await uploadStoryGroupCover({ id: group.id, file, coverMediaType }).unwrap();
      setCoverUrl(result.coverMediaUrl);
    } catch (err) {
      setCoverError(extractApiError(err));
    } finally {
      URL.revokeObjectURL(objectUrl);
      setCoverPreview(null);
    }
  };

  const resetForm = () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setTitle("");
    setCoverMediaType("image");
    setDisplayOrder("");
    setIsActive(true);
    setErrors({});
    setServerError("");
    setCoverUrl(null);
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

    if (!isEditMode && !pendingCoverFile) {
      next.cover = `Cover ${coverMediaType} is required.`;
    } else if (isEditMode && !coverUrl) {
      next.cover = "Upload a cover first (use the button above).";
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
            displayOrder: Number(displayOrder),
            isActive,
          },
        }).unwrap();
      } else {
        await createStoryGroup({
          title: title.trim(),
          coverMediaType,
          displayOrder: Number(displayOrder),
          isActive,
          cover: pendingCoverFile as File,
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
                  onClick={() => handleCoverTypeChange(type)}
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

          <MediaUploadField
            label="cover"
            accept={COVER_ACCEPT[coverMediaType]}
            hint={COVER_HINT[coverMediaType]}
            previewUrl={coverPreview ?? getUploadUrl(coverUrl)}
            isVideo={coverMediaType === "video"}
            onSelect={handleCoverSelect}
            uploading={uploadingCover}
            hasValue={!!(coverUrl || pendingCoverFile)}
            error={errors.cover || coverError}
          />

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
