// src/pages/Ai/Stories/AiStoryItemEditModal.tsx
import { useState } from "react";
import { useUpdateAiStoryItemMutation, type AiStoryItemRecord } from "./aiStoryItem.api";
import { extractApiError, getUploadUrl } from "../../../lib/apiClient";

const ACCENT = "#D4300F";
const MAX_LENGTH = 300;

// Same remount-via-key wrapper pattern as AiFaqEditModal.tsx — the form
// reads its starting values straight from props on mount, no effect
// needed to "sync" them in afterward.
export default function AiStoryItemEditModal({
  open,
  onClose,
  item,
}: {
  open: boolean;
  onClose: () => void;
  item: AiStoryItemRecord | null;
}) {
  if (!open || !item) return null;
  return <AiStoryItemEditModalForm key={item.id} onClose={onClose} item={item} />;
}

function AiStoryItemEditModalForm({ onClose, item }: { onClose: () => void; item: AiStoryItemRecord }) {
  const [description, setDescription] = useState(item.description);
  const [error, setError] = useState("");
  const [serverError, setServerError] = useState("");

  const [updateAiStoryItem, { isLoading: saving }] = useUpdateAiStoryItemMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    if (description.trim().length < 2) {
      setError("Caption is required.");
      return;
    }
    if (description.trim().length > MAX_LENGTH) {
      setError(`Caption must be ${MAX_LENGTH} characters or fewer.`);
      return;
    }
    setError("");

    try {
      await updateAiStoryItem({ id: item.id, input: { description: description.trim() } }).unwrap();
      onClose();
    } catch (err) {
      setServerError(extractApiError(err));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[480px] bg-white border border-[#e8e4dc] rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h2 className="text-[#1c1a17] text-lg font-black">Edit AI Story Caption</h2>
            <p className="text-[#a39e96] text-xs mt-1">
              For "{item.group.title}" — edits apply before approval/publish only.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
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
          <div className="w-full h-40 rounded-xl overflow-hidden border border-[#e8e4dc] bg-[#f7f5f1]">
            <img
              src={getUploadUrl(item.mediaUrl) ?? undefined}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a39e96]">
                Caption <span className="text-[#D4300F]">*</span>
              </label>
              <span
                className={`text-[10px] font-semibold ${
                  description.trim().length > MAX_LENGTH ? "text-[#D4300F]" : "text-[#a39e96]"
                }`}
              >
                {description.trim().length}/{MAX_LENGTH}
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              maxLength={MAX_LENGTH}
              className="w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border border-[#e2ddd5] rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
            />
          </div>

          {error && <p className="text-[11px] font-medium text-[#D4300F]">{error}</p>}

          {serverError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
              <p className="text-red-500 text-xs font-medium">{serverError}</p>
            </div>
          )}

          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
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
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
