// src/pages/Ai/Articles/AiArticleEditModal.tsx
import { useState } from "react";
import { useUpdateAiArticleMutation, type AiArticleRecord } from "./aiArticle.api";
import { extractApiError } from "../../../lib/apiClient";

const ACCENT = "#D4300F";

// Same remount-via-key wrapper pattern as AiFaqEditModal.tsx — the form
// reads its starting values straight from props on mount, no effect
// needed to "sync" them in afterward.
export default function AiArticleEditModal({
  open,
  onClose,
  article,
}: {
  open: boolean;
  onClose: () => void;
  article: AiArticleRecord | null;
}) {
  if (!open || !article) return null;
  return <AiArticleEditModalForm key={article.id} onClose={onClose} article={article} />;
}

function AiArticleEditModalForm({ onClose, article }: { onClose: () => void; article: AiArticleRecord }) {
  const [title, setTitle] = useState(article.title);
  const [slug, setSlug] = useState(article.slug);
  const [excerpt, setExcerpt] = useState(article.excerpt);
  const [body, setBody] = useState(article.body);
  const [metaTitle, setMetaTitle] = useState(article.metaTitle);
  const [metaDescription, setMetaDescription] = useState(article.metaDescription);
  const [metaKeywords, setMetaKeywords] = useState(article.metaKeywords);
  const [error, setError] = useState("");
  const [serverError, setServerError] = useState("");

  const [updateAiArticle, { isLoading: saving }] = useUpdateAiArticleMutation();

  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (title.trim().length > 200) {
      setError("Title must be at most 200 characters.");
      return;
    }
    if (!slug.trim() || !slugRegex.test(slug.trim().toLowerCase())) {
      setError("Slug must be lowercase letters/numbers separated by hyphens.");
      return;
    }
    if (!excerpt.trim()) {
      setError("Excerpt is required.");
      return;
    }
    if (excerpt.trim().length > 300) {
      setError("Excerpt must be at most 300 characters.");
      return;
    }
    if (!body.trim()) {
      setError("Article content is required.");
      return;
    }
    if (!metaTitle.trim() || metaTitle.trim().length > 160) {
      setError("Meta title is required and must be at most 160 characters.");
      return;
    }
    if (!metaDescription.trim() || metaDescription.trim().length > 300) {
      setError("Meta description is required and must be at most 300 characters.");
      return;
    }
    if (!metaKeywords.trim() || metaKeywords.trim().length > 255) {
      setError("Meta keywords are required and must be at most 255 characters.");
      return;
    }
    setError("");

    try {
      await updateAiArticle({
        id: article.id,
        input: {
          title: title.trim(),
          slug: slug.trim().toLowerCase(),
          excerpt: excerpt.trim(),
          body: body.trim(),
          metaTitle: metaTitle.trim(),
          metaDescription: metaDescription.trim(),
          metaKeywords: metaKeywords.trim(),
        },
      }).unwrap();
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
      <div className="w-full max-w-[640px] bg-white border border-[#e8e4dc] rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h2 className="text-[#1c1a17] text-lg font-black">Edit AI Article</h2>
            <p className="text-[#a39e96] text-xs mt-1">
              For "{article.brand.name}" — edits apply before approval/publish only.
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
              Title <span className="text-[#D4300F]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className="w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border border-[#e2ddd5] rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1.5">
              Slug <span className="text-[#D4300F]">*</span>
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              maxLength={200}
              className="w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border border-[#e2ddd5] rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1.5">
              Excerpt <span className="text-[#D4300F]">*</span>
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              maxLength={300}
              className="w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border border-[#e2ddd5] rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1.5">
              Body <span className="text-[#D4300F]">*</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              className="w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border border-[#e2ddd5] rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1.5">
              Meta Title <span className="text-[#D4300F]">*</span>
            </label>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              maxLength={160}
              className="w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border border-[#e2ddd5] rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1.5">
              Meta Description <span className="text-[#D4300F]">*</span>
            </label>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={2}
              maxLength={300}
              className="w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border border-[#e2ddd5] rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1.5">
              Meta Keywords <span className="text-[#D4300F]">*</span>
            </label>
            <input
              type="text"
              value={metaKeywords}
              onChange={(e) => setMetaKeywords(e.target.value)}
              maxLength={255}
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
