// src/pages/Ai/Faqs/AiFaqEditModal.tsx
import { useRef, useState } from "react";
import { useUpdateAiFaqMutation, type AiFaqRecord } from "./aiFaq.api";
import { extractApiError } from "../../../lib/apiClient";

const ACCENT = "#D4300F";

// Same remount-via-key wrapper pattern as AdvertiserModal.tsx — the form
// reads its starting values straight from props on mount, no effect
// needed to "sync" them in afterward.
export default function AiFaqEditModal({
  open,
  onClose,
  faq,
}: {
  open: boolean;
  onClose: () => void;
  faq: AiFaqRecord | null;
}) {
  if (!open || !faq) return null;
  return <AiFaqEditModalForm key={faq.id} onClose={onClose} faq={faq} />;
}

function AiFaqEditModalForm({ onClose, faq }: { onClose: () => void; faq: AiFaqRecord }) {
  const [question, setQuestion] = useState(faq.question);
  const [answer, setAnswer] = useState(faq.answer);
  const [error, setError] = useState("");
  const [serverError, setServerError] = useState("");
  const questionRef = useRef<HTMLTextAreaElement>(null);

  const [updateAiFaq, { isLoading: saving }] = useUpdateAiFaqMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    if (question.trim().length < 5) {
      setError("Question must be at least 5 characters.");
      return;
    }
    if (!answer.trim()) {
      setError("Answer is required.");
      return;
    }
    setError("");

    try {
      await updateAiFaq({ id: faq.id, input: { question: question.trim(), answer: answer.trim() } }).unwrap();
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
      <div className="w-full max-w-[560px] bg-white border border-[#e8e4dc] rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h2 className="text-[#1c1a17] text-lg font-black">Edit AI FAQ</h2>
            <p className="text-[#a39e96] text-xs mt-1">
              For "{faq.model.brand.name} {faq.model.name}" — edits apply before approval/publish only.
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
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1.5">
              Question <span className="text-[#D4300F]">*</span>
            </label>
            <textarea
              ref={questionRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={2}
              maxLength={255}
              className="w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border border-[#e2ddd5] rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1.5">
              Answer <span className="text-[#D4300F]">*</span>
            </label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={6}
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
