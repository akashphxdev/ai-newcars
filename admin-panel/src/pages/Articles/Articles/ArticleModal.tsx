// src/pages/Articles/Articles/ArticleModal.tsx
import { useEffect, useRef, useState } from "react";
import {
  useCreateArticleMutation,
  useUpdateArticleMutation,
  type ArticleRecord,
  type ArticleStatus,
} from "./article.api";
import { useGetArticleCategoriesQuery } from "../ArticleCategories/articleCategory.api";
import { useGetAdminsQuery } from "../../AdminUsers/AllAdmins/admin.api";
import { useGetBrandOptionsQuery } from "../../newCars/Brands/brand.api";
import { useGetCarModelOptionsQuery } from "../../newCars/carModels/carModel.api";
import { useAuth } from "../../../context/useAuth";
import { extractApiError, getUploadUrl } from "../../../lib/apiClient";
import { slugify } from "../../../lib/slugify";
import Editor from "../../../components/common/Editor/Editor";

const ACCENT = "#D4300F";

interface FieldErrors {
  categoryId?: string;
  authorId?: string;
  title?: string;
  slug?: string;
  body?: string;
  scheduledAt?: string;
}

function RequiredMark() {
  return <span className="text-[#D4300F]">*</span>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1.5">
        {label} {required && <RequiredMark />}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white";
const selectClass = `cursor-pointer ${inputClass}`;

// Local-datetime <-> ISO helpers for the <input type="datetime-local">
// used by the schedule picker.
function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ArticleModal({
  open,
  onClose,
  article,
}: {
  open: boolean;
  onClose: () => void;
  // Present -> edit mode. Absent/null -> create mode.
  article?: ArticleRecord | null;
}) {
  const isEditMode = !!article;
  const { admin: currentAdmin } = useAuth();

  const [categoryId, setCategoryId] = useState<number | "">("");
  const [authorId, setAuthorId] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [readTimeMinutes, setReadTimeMinutes] = useState<string>("");
  const [status, setStatus] = useState<ArticleStatus>("draft");
  const [isActive, setIsActive] = useState(true);
  const [scheduledAt, setScheduledAt] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState("");
  const [brandIds, setBrandIds] = useState<number[]>([]);
  const [modelIds, setModelIds] = useState<number[]>([]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  // Tracks whether the admin has hand-edited the slug — while false, the
  // slug keeps auto-deriving from the title live (visible auto-generate).
  // Once they type directly into the slug field, it locks and stops
  // following the title.
  const [slugTouched, setSlugTouched] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  const { data: categoriesData } = useGetArticleCategoriesQuery({ page: 1, limit: 100, isActive: true });
  const { data: adminsData } = useGetAdminsQuery({ page: 1, limit: 100 });
  const { data: brands = [] } = useGetBrandOptionsQuery();
  const { data: models = [] } = useGetCarModelOptionsQuery();

  const categories = categoriesData?.data ?? [];
  const admins = adminsData?.data ?? [];

  const [createArticle, { isLoading: creating }] = useCreateArticleMutation();
  const [updateArticle, { isLoading: updating }] = useUpdateArticleMutation();
  const saving = creating || updating;

  const resetForm = () => {
    setCategoryId("");
    // Defaults the byline to whoever is creating it — still a plain
    // dropdown, so it can be reassigned to any admin before saving.
    setAuthorId(currentAdmin?.id ?? "");
    setTitle("");
    setSlug("");
    setExcerpt("");
    setBody("");
    setReadTimeMinutes("");
    setStatus("draft");
    setIsActive(true);
    setScheduledAt("");
    setMetaTitle("");
    setMetaDescription("");
    setMetaKeywords("");
    setOgImageUrl("");
    setBrandIds([]);
    setModelIds([]);
    setCoverImage(null);
    setCoverPreview(null);
    setSlugTouched(false);
    setErrors({});
    setServerError("");
  };

  useEffect(() => {
    if (!open) return;

    if (article) {
      setCategoryId(article.categoryId);
      setAuthorId(article.authorId);
      setTitle(article.title);
      setSlug(article.slug);
      setExcerpt(article.excerpt ?? "");
      setBody(article.body ?? "");
      setReadTimeMinutes(article.readTimeMinutes != null ? String(article.readTimeMinutes) : "");
      setStatus(article.status);
      setIsActive(article.isActive);
      setScheduledAt(toLocalInputValue(article.scheduledAt));
      setMetaTitle(article.metaTitle ?? "");
      setMetaDescription(article.metaDescription ?? "");
      setMetaKeywords(article.metaKeywords ?? "");
      setOgImageUrl(article.ogImageUrl ?? "");
      setBrandIds(article.brands.map((b) => b.id));
      setModelIds(article.models.map((m) => m.id));
      setCoverImage(null);
      setCoverPreview(getUploadUrl(article.coverImageUrl));
      setSlugTouched(false);
    } else {
      resetForm();
    }
    setErrors({});
    setServerError("");

    const focusTimer = setTimeout(() => titleRef.current?.focus(), 50);
    return () => clearTimeout(focusTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, article]);

  if (!open) return null;

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const toggleBrand = (id: number) => {
    setBrandIds((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]));
  };
  const toggleModel = (id: number) => {
    setModelIds((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  };
  const handleSlugChange = (value: string) => {
    setSlugTouched(true);
    setSlug(value);
  };

  const handleCoverChange = (file: File | null) => {
    setCoverImage(file);
    if (file) setCoverPreview(URL.createObjectURL(file));
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!categoryId) next.categoryId = "Category is required.";
    if (!authorId) next.authorId = "Author is required.";
    if (title.trim().length < 3) next.title = "Title must be at least 3 characters.";
    if (!slug.trim()) {
      next.slug = "Slug is required.";
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
      next.slug = "Slug must be lowercase letters/numbers separated by hyphens.";
    }
    if (!body.trim() || body.trim() === "<p></p>") next.body = "Article content is required.";
    if (status === "scheduled") {
      if (!scheduledAt) {
        next.scheduledAt = "Pick a date/time to schedule this article.";
      } else if (new Date(scheduledAt).getTime() <= Date.now()) {
        next.scheduledAt = "Scheduled time must be in the future.";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    const payload = {
      categoryId: Number(categoryId),
      authorId: Number(authorId),
      title: title.trim(),
      // Always the literal value shown on screen — whether it came from
      // auto-sync or a manual edit — so what's displayed is exactly what
      // gets saved.
      slug: slug.trim(),
      excerpt: excerpt.trim() || null,
      body,
      readTimeMinutes: readTimeMinutes.trim() ? Number(readTimeMinutes) : null,
      status,
      isActive,
      scheduledAt: status === "scheduled" && scheduledAt ? new Date(scheduledAt).toISOString() : null,
      metaTitle: metaTitle.trim() || null,
      metaDescription: metaDescription.trim() || null,
      metaKeywords: metaKeywords.trim() || null,
      ogImageUrl: ogImageUrl.trim() || null,
      brandIds,
      modelIds,
      coverImage: coverImage ?? undefined,
    };

    try {
      if (isEditMode && article) {
        await updateArticle({ id: article.id, input: payload }).unwrap();
      } else {
        await createArticle(payload).unwrap();
      }
      resetForm();
      onClose();
    } catch (err) {
      setServerError(extractApiError(err));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="w-full max-w-[900px] bg-white border border-[#e8e4dc] rounded-2xl shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h2 className="text-[#1c1a17] text-lg font-black">{isEditMode ? "Edit article" : "Add article"}</h2>
            <p className="text-[#a39e96] text-xs mt-1">
              {isEditMode ? `Update details for ${article?.title}` : "Write and publish a new article"}
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

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-5 space-y-5" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category" required>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : "")}
                className={selectClass}
                style={{ borderColor: errors.categoryId ? "#f0997b" : "#e2ddd5" }}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.categoryId && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.categoryId}</p>}
            </Field>

            <Field label="Author" required>
              <select
                value={authorId}
                onChange={(e) => setAuthorId(e.target.value ? Number(e.target.value) : "")}
                className={selectClass}
                style={{ borderColor: errors.authorId ? "#f0997b" : "#e2ddd5" }}
              >
                <option value="">Select author</option>
                {admins.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              {errors.authorId && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.authorId}</p>}
              <p className="text-[10px] text-[#a39e96] mt-1">
                Defaults to you — change it to credit the article to a different admin.
              </p>
            </Field>
          </div>

          <Field label="Title" required>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. 5 things to check before buying a used SUV"
              className={inputClass}
              style={{ borderColor: errors.title ? "#f0997b" : "#e2ddd5" }}
              maxLength={200}
            />
            {errors.title && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.title}</p>}
          </Field>

          <Field label="Slug" required>
            <input
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="Auto-generated from title — edit to customize"
              className={inputClass}
              style={{ borderColor: errors.slug ? "#f0997b" : "#e2ddd5" }}
              maxLength={200}
            />
            {errors.slug ? (
              <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.slug}</p>
            ) : (
              <p className="text-[10px] text-[#a39e96] mt-1">
                {slugTouched
                  ? "Custom slug — won't change if you edit the title again."
                  : "Auto-generated from the title. Start typing here to set your own."}
              </p>
            )}
          </Field>

          <Field label="Excerpt">
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Short summary shown in article listings"
              rows={2}
              maxLength={300}
              className={inputClass}
              style={{ borderColor: "#e2ddd5" }}
            />
          </Field>

          <Field label="Content" required>
            <Editor
              content={body}
              onChange={setBody}
              onStatsChange={(stats: { readTimeMinutes: number }) => {
                // Only auto-fill while empty / untouched — an admin who
                // manually overrides the read time shouldn't have it
                // silently recalculated on every keystroke.
                setReadTimeMinutes((prev) => (prev === "" ? String(stats.readTimeMinutes) : prev));
              }}
            />
            {errors.body && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.body}</p>}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Cover image">
              <div className="flex items-center gap-3">
                {coverPreview && (
                  <img src={coverPreview} alt="" className="w-14 h-14 rounded-lg object-cover border border-[#e8e4dc]" />
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleCoverChange(e.target.files?.[0] ?? null)}
                  className="text-xs"
                />
              </div>
            </Field>

            <Field label="Read time (minutes)">
              <input
                type="number"
                min="0"
                value={readTimeMinutes}
                onChange={(e) => setReadTimeMinutes(e.target.value)}
                placeholder="Auto-filled from content"
                className={inputClass}
                style={{ borderColor: "#e2ddd5" }}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Status" required>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ArticleStatus)}
                className={selectClass}
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
              </select>
            </Field>

            {status === "scheduled" && (
              <Field label="Publish at" required>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className={inputClass}
                  style={{ borderColor: errors.scheduledAt ? "#f0997b" : "#e2ddd5" }}
                />
                {errors.scheduledAt && (
                  <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.scheduledAt}</p>
                )}
              </Field>
            )}
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer text-[12px] font-semibold text-[#4a4640]">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="cursor-pointer accent-[#D4300F]"
            />
            Active
          </label>

          {/* Brand / model tagging — multi-select for comparison/roundup
              pieces that cover more than one brand or model. */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Related brands">
              <div className="max-h-32 overflow-y-auto border border-[#e2ddd5] rounded-xl p-2 space-y-1 bg-[#f7f5f1]">
                {brands.length === 0 && <p className="text-[11px] text-[#a39e96] px-1">No brands found.</p>}
                {brands.map((b) => (
                  <label key={b.id} className="flex items-center gap-1.5 cursor-pointer text-[12px] text-[#4a4640] px-1 py-0.5">
                    <input
                      type="checkbox"
                      checked={brandIds.includes(b.id)}
                      onChange={() => toggleBrand(b.id)}
                      className="cursor-pointer accent-[#D4300F]"
                    />
                    {b.name}
                  </label>
                ))}
              </div>
            </Field>

            <Field label="Related car models">
              <div className="max-h-32 overflow-y-auto border border-[#e2ddd5] rounded-xl p-2 space-y-1 bg-[#f7f5f1]">
                {models.length === 0 && <p className="text-[11px] text-[#a39e96] px-1">No car models found.</p>}
                {models.map((m) => (
                  <label key={m.id} className="flex items-center gap-1.5 cursor-pointer text-[12px] text-[#4a4640] px-1 py-0.5">
                    <input
                      type="checkbox"
                      checked={modelIds.includes(m.id)}
                      onChange={() => toggleModel(m.id)}
                      className="cursor-pointer accent-[#D4300F]"
                    />
                    {m.name}
                  </label>
                ))}
              </div>
            </Field>
          </div>

          {/* SEO — kept directly on the article (not the shared SeoMeta
              table used elsewhere in this project, by explicit request). */}
          <div className="border-t border-[#e8e4dc] pt-4 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#a39e96]">SEO</p>
            <Field label="Meta title">
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                maxLength={160}
                className={inputClass}
                style={{ borderColor: "#e2ddd5" }}
              />
            </Field>
            <Field label="Meta description">
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={2}
                maxLength={300}
                className={inputClass}
                style={{ borderColor: "#e2ddd5" }}
              />
            </Field>
            <Field label="Meta keywords">
              <input
                type="text"
                value={metaKeywords}
                onChange={(e) => setMetaKeywords(e.target.value)}
                placeholder="Comma-separated"
                maxLength={255}
                className={inputClass}
                style={{ borderColor: "#e2ddd5" }}
              />
            </Field>
            <Field label="Social share image (OG image URL)">
              <div className="flex items-center gap-3">
                {ogImageUrl && (
                  <img
                    src={ogImageUrl}
                    alt=""
                    className="w-14 h-14 rounded-lg object-cover border border-[#e8e4dc]"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                    onLoad={(e) => (e.currentTarget.style.display = "block")}
                  />
                )}
                <input
                  type="url"
                  value={ogImageUrl}
                  onChange={(e) => setOgImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  maxLength={255}
                  className={`${inputClass} flex-1`}
                  style={{ borderColor: "#e2ddd5" }}
                />
              </div>
              <p className="text-[10px] text-[#a39e96] mt-1">
                Shown as the preview image when this article is shared on social media. Leave blank to fall back to
                the cover image.
              </p>
            </Field>
          </div>

          {serverError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
              <p className="text-red-500 text-xs font-medium">{serverError}</p>
            </div>
          )}

          <div className="flex items-center gap-2.5 pt-1 sticky bottom-0 bg-white">
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
                "Create article"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}