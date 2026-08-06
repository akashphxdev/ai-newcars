// src/pages/Seo/SeoMeta/DynamicSeoMetaModal.tsx
//
// Add/edit modal for Brand/Model/Variant/BodyType/News Category SEO rows.
// Sibling to SeoMetaModal.tsx (which only handles the fixed static-page
// list) — this one picks its target via pageType + EntityPicker instead,
// since these are open-ended, searchable entities rather than a short
// fixed list.
import { useEffect, useRef, useState } from "react";
import { useCreateSeoMetaMutation, useUpdateSeoMetaMutation, type SeoMetaRecord } from "./seoMeta.api";
import { extractApiError } from "../../../lib/apiClient";
import { DYNAMIC_SEO_PAGE_TYPE_OPTIONS } from "../../../lib/lookups";
import EntityPicker from "../../../components/common/EntityPicker";
import {
  Field,
  SectionCard,
  TextField,
  TextAreaField,
  SchemaJsonField,
  selectClass,
  InfoSectionIcon,
  SearchEngineSectionIcon,
  SocialSectionIcon,
} from "../../../components/common/SeoFormFields";

const ACCENT = "#D4300F";
const ROBOTS_PRESETS = ["index,follow", "noindex,follow", "index,nofollow", "noindex,nofollow"];

// One entry per JSON-LD schema.org type this form can author. Keys must
// match the SeoMeta columns 1:1 (vehicleSchema, faqSchema, ...) — same
// list as SeoMetaModal.tsx's SCHEMA_FIELDS.
const SCHEMA_FIELDS = [
  { key: "vehicleSchema", label: "Vehicle / Product schema", hint: "Specs, price & rating — schema.org/Car or /Product." },
  { key: "faqSchema", label: "FAQ schema", hint: "schema.org/FAQPage — question/answer pairs shown on this page." },
  { key: "reviewSchema", label: "Review schema", hint: "schema.org/Review or AggregateRating." },
  { key: "articleSchema", label: "Article schema", hint: "schema.org/Article — for blog/news pages." },
  { key: "authorSchema", label: "Author schema", hint: "schema.org/Person — content author profile." },
  { key: "breadcrumbSchema", label: "Breadcrumb schema", hint: "schema.org/BreadcrumbList — navigation path." },
] as const;

type SchemaFieldKey = (typeof SCHEMA_FIELDS)[number]["key"];

interface FieldErrors {
  pageType?: string;
  entity?: string;
  metaTitle?: string;
  metaDescription?: string;
  schema?: Partial<Record<SchemaFieldKey, string>>;
}

// Thin wrapper — only mounts the actual form when `open` is true, and
// remounts it (via `key`) whenever the target seoMeta changes. Same
// pattern as PlacementModal.tsx.
export default function DynamicSeoMetaModal({
  open,
  onClose,
  seoMeta,
  defaultPageType,
}: {
  open: boolean;
  onClose: () => void;
  seoMeta?: SeoMetaRecord | null;
  // Pre-selects the page type when adding — the list screen already has
  // a Model/Variant tab selected, so a new entry should default to that.
  defaultPageType?: number;
}) {
  if (!open) return null;
  return (
    <DynamicSeoMetaForm
      key={seoMeta?.id ?? "new"}
      onClose={onClose}
      seoMeta={seoMeta ?? null}
      defaultPageType={defaultPageType}
    />
  );
}

function DynamicSeoMetaForm({
  onClose,
  seoMeta,
  defaultPageType,
}: {
  onClose: () => void;
  seoMeta: SeoMetaRecord | null;
  defaultPageType?: number;
}) {
  const isEditMode = !!seoMeta;

  const [activeTab, setActiveTab] = useState<"meta" | "schema">("meta");

  const [pageType, setPageType] = useState<number | "">(seoMeta?.pageType ?? defaultPageType ?? "");
  const [entityId, setEntityId] = useState<number | null>(seoMeta?.entityId ?? null);
  const [metaTitle, setMetaTitle] = useState(seoMeta?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(seoMeta?.metaDescription ?? "");
  const [metaKeywords, setMetaKeywords] = useState(seoMeta?.metaKeywords ?? "");
  const [canonicalUrl, setCanonicalUrl] = useState(seoMeta?.canonicalUrl ?? "");
  const [h1Tag, setH1Tag] = useState(seoMeta?.h1Tag ?? "");
  const [ogTitle, setOgTitle] = useState(seoMeta?.ogTitle ?? "");
  const [ogDescription, setOgDescription] = useState(seoMeta?.ogDescription ?? "");
  const [ogImage, setOgImage] = useState(seoMeta?.ogImage ?? "");
  const [robotsMeta, setRobotsMeta] = useState(seoMeta?.robotsMeta ?? "index,follow");
  const [status, setStatus] = useState(seoMeta?.status ?? true);

  const [schemaValues, setSchemaValues] = useState<Record<SchemaFieldKey, string>>({
    vehicleSchema: seoMeta?.vehicleSchema ?? "",
    faqSchema: seoMeta?.faqSchema ?? "",
    reviewSchema: seoMeta?.reviewSchema ?? "",
    articleSchema: seoMeta?.articleSchema ?? "",
    authorSchema: seoMeta?.authorSchema ?? "",
    breadcrumbSchema: seoMeta?.breadcrumbSchema ?? "",
  });
  const setSchemaValue = (key: SchemaFieldKey, value: string) =>
    setSchemaValues((prev) => ({ ...prev, [key]: value }));

  const filledSchemaCount = Object.values(schemaValues).filter((v) => v.trim()).length;

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const pageTypeRef = useRef<HTMLSelectElement>(null);

  const [createSeoMeta, { isLoading: creating }] = useCreateSeoMetaMutation();
  const [updateSeoMeta, { isLoading: updating }] = useUpdateSeoMetaMutation();
  const saving = creating || updating;

  useEffect(() => {
    const focusTimer = setTimeout(() => pageTypeRef.current?.focus(), 50);
    return () => clearTimeout(focusTimer);
  }, []);

  const handlePageTypeChange = (value: number | "") => {
    setPageType(value);
    // Switching page type invalidates whatever entity was picked for the old one.
    setEntityId(null);
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (pageType === "") next.pageType = "Page type is required.";

    if (metaTitle.trim().length < 10) next.metaTitle = "Meta title must be at least 10 characters.";
    else if (metaTitle.trim().length > 255) next.metaTitle = "Meta title must be at most 255 characters.";

    if (metaDescription.trim().length < 20) next.metaDescription = "Meta description must be at least 20 characters.";
    else if (metaDescription.trim().length > 500) next.metaDescription = "Meta description must be at most 500 characters.";

    const schemaErrors: Partial<Record<SchemaFieldKey, string>> = {};
    for (const field of SCHEMA_FIELDS) {
      const raw = schemaValues[field.key].trim();
      if (!raw) continue;
      try {
        JSON.parse(raw);
      } catch {
        schemaErrors[field.key] = "Must be valid JSON.";
      }
    }
    if (Object.keys(schemaErrors).length > 0) next.schema = schemaErrors;

    setErrors(next);

    const hasMetaTabError = !!(next.pageType || next.entity || next.metaTitle || next.metaDescription);
    if (!hasMetaTabError && next.schema) setActiveTab("schema");
    else if (hasMetaTabError) setActiveTab("meta");

    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    const payload = {
      pageType: pageType as number,
      entityId,
      staticPageSlug: null,
      metaTitle: metaTitle.trim(),
      metaDescription: metaDescription.trim(),
      metaKeywords: metaKeywords.trim() || null,
      canonicalUrl: canonicalUrl.trim() || null,
      h1Tag: h1Tag.trim() || null,
      ogTitle: ogTitle.trim() || null,
      ogDescription: ogDescription.trim() || null,
      ogImage: ogImage.trim() || null,
      robotsMeta: robotsMeta.trim() || null,
      vehicleSchema: schemaValues.vehicleSchema.trim() || null,
      faqSchema: schemaValues.faqSchema.trim() || null,
      reviewSchema: schemaValues.reviewSchema.trim() || null,
      articleSchema: schemaValues.articleSchema.trim() || null,
      authorSchema: schemaValues.authorSchema.trim() || null,
      breadcrumbSchema: schemaValues.breadcrumbSchema.trim() || null,
      status,
    };

    try {
      if (isEditMode && seoMeta) {
        await updateSeoMeta({ id: seoMeta.id, input: payload }).unwrap();
      } else {
        await createSeoMeta(payload).unwrap();
      }
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
        <div className="flex items-center justify-between px-6 pt-6 pb-4 bg-gradient-to-b from-[#fefaf8] to-white">
          <div>
            <h2 className="text-[#1c1a17] text-lg font-black">{isEditMode ? "Edit SEO entry" : "Add SEO entry"}</h2>
            <p className="text-[#a39e96] text-xs mt-1">
              {isEditMode ? `Update SEO entry #${seoMeta?.id}` : "Add meta tags & structured data for a page"}
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

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 border-b border-[#ece7dd] bg-[#fefaf8]">
          <button
            type="button"
            onClick={() => setActiveTab("meta")}
            className={`cursor-pointer text-[12px] font-bold px-3.5 py-2.5 rounded-t-lg border-b-2 transition-colors ${
              activeTab === "meta" ? "text-[#1c1a17]" : "text-[#a39e96] border-transparent hover:text-[#4a4640]"
            }`}
            style={{ borderColor: activeTab === "meta" ? ACCENT : "transparent" }}
          >
            Meta Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("schema")}
            className={`cursor-pointer text-[12px] font-bold px-3.5 py-2.5 rounded-t-lg border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "schema" ? "text-[#1c1a17]" : "text-[#a39e96] border-transparent hover:text-[#4a4640]"
            }`}
            style={{ borderColor: activeTab === "schema" ? ACCENT : "transparent" }}
          >
            Structured Data
            {filledSchemaCount > 0 && (
              <span
                className="text-[9px] font-black text-white rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center"
                style={{ background: ACCENT }}
              >
                {filledSchemaCount}
              </span>
            )}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-5 space-y-4" noValidate>
          {/* ---------------- Meta Info tab ---------------- */}
          <div className={activeTab === "meta" ? "space-y-4" : "hidden"}>
            <SectionCard title="Page Target" icon={<InfoSectionIcon />}>
              <Field label="Page type" required>
                <select
                  ref={pageTypeRef}
                  value={pageType}
                  onChange={(e) => handlePageTypeChange(e.target.value ? Number(e.target.value) : "")}
                  className={selectClass}
                  style={{ borderColor: errors.pageType ? "#f0997b" : "#e2ddd5" }}
                  disabled={isEditMode}
                >
                  <option value="">Select</option>
                  {DYNAMIC_SEO_PAGE_TYPE_OPTIONS.map((pt) => (
                    <option key={pt.value} value={pt.value}>
                      {pt.label}
                    </option>
                  ))}
                </select>
                {errors.pageType && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.pageType}</p>}
                {isEditMode && <p className="text-[10px] text-[#a39e96] mt-1">Page type can't change after creation — delete and re-add instead.</p>}
              </Field>

              <Field label="Entity">
                <EntityPicker pageType={pageType} entityId={entityId} onEntityIdChange={setEntityId} error={errors.entity} />
              </Field>
            </SectionCard>

            <SectionCard title="Basic Info" icon={<InfoSectionIcon />}>
              <Field label="Meta title" required>
                <TextField
                  value={metaTitle}
                  onChange={setMetaTitle}
                  placeholder="e.g. Maruti Suzuki Swift — Price, Specs & Mileage"
                  error={errors.metaTitle}
                  maxLength={255}
                />
              </Field>

              <Field label="Meta description" required>
                <TextAreaField
                  value={metaDescription}
                  onChange={setMetaDescription}
                  placeholder="Short description shown in search results"
                  maxLength={500}
                  error={errors.metaDescription}
                />
              </Field>

              <Field label="Meta keywords" hint="Optional, comma-separated.">
                <TextField value={metaKeywords} onChange={setMetaKeywords} placeholder="e.g. maruti suzuki swift, price, mileage" />
              </Field>

              <Field label="H1 tag">
                <TextField value={h1Tag} onChange={setH1Tag} placeholder="e.g. Maruti Suzuki Swift" maxLength={255} />
              </Field>
            </SectionCard>

            <SectionCard title="Search Engine" icon={<SearchEngineSectionIcon />}>
              <Field label="Canonical URL">
                <TextField value={canonicalUrl} onChange={setCanonicalUrl} placeholder="https://example.com/car-model/maruti-suzuki/swift" />
              </Field>

              <Field label="Robots meta">
                <select
                  value={ROBOTS_PRESETS.includes(robotsMeta) ? robotsMeta : ""}
                  onChange={(e) => setRobotsMeta(e.target.value)}
                  className={selectClass}
                >
                  <option value="" disabled>
                    Select
                  </option>
                  {ROBOTS_PRESETS.map((preset) => (
                    <option key={preset} value={preset}>
                      {preset}
                    </option>
                  ))}
                </select>
              </Field>

              <label className="flex items-center gap-1.5 cursor-pointer text-[12px] font-semibold text-[#4a4640] pt-1">
                <input
                  type="checkbox"
                  checked={status}
                  onChange={(e) => setStatus(e.target.checked)}
                  className="cursor-pointer accent-[#D4300F]"
                />
                Active
              </label>
            </SectionCard>

            <SectionCard title="Social Preview" icon={<SocialSectionIcon />}>
              <div className="grid grid-cols-2 gap-3">
                <Field label="OG title" hint="Falls back to meta title if blank.">
                  <TextField value={ogTitle} onChange={setOgTitle} maxLength={255} />
                </Field>
                <Field label="OG image URL">
                  <TextField value={ogImage} onChange={setOgImage} placeholder="https://..." />
                </Field>
              </div>

              <Field label="OG description" hint="Falls back to meta description if blank.">
                <TextAreaField value={ogDescription} onChange={setOgDescription} maxLength={500} />
              </Field>
            </SectionCard>
          </div>

          {/* ---------------- Structured Data tab ---------------- */}
          <div className={activeTab === "schema" ? "space-y-3" : "hidden"}>
            <p className="text-[11px] text-[#a39e96] -mt-1 mb-1">
              Leave any of these blank if that schema type doesn't apply to this page — it will simply not render.
            </p>
            {SCHEMA_FIELDS.map((field) => (
              <SchemaJsonField
                key={field.key}
                label={field.label}
                hint={field.hint}
                value={schemaValues[field.key]}
                onChange={(v) => setSchemaValue(field.key, v)}
                error={errors.schema?.[field.key]}
              />
            ))}
          </div>

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
              {saving ? "Saving..." : isEditMode ? "Save changes" : "Create SEO entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
