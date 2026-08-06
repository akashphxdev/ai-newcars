// src/pages/Seo/SeoMeta/SeoMetaModal.tsx
//
// Inline SEO form for a single STATIC page. Used from AllSeoMetas.tsx as
// the right-hand panel: the left sidebar picks a static page (fixed list,
// see STATIC_PAGE_SLUG_OPTIONS in lib/lookups.ts) and this form edits
// exactly that page's SEO row. There is no "page type" / "entity" picker
// here anymore — pageType is always SEO_PAGE_TYPE.STATIC and the slug is
// whatever the sidebar selected, so a duplicate entry for the same page
// can't be created from this screen.
//
// Component name kept as SeoMetaModal (default export) so App.tsx / the
// parent list don't need an import-name change, even though it no longer
// renders as a modal overlay.
import { useEffect, useRef, useState } from "react";
import { useCreateSeoMetaMutation, useUpdateSeoMetaMutation, type SeoMetaRecord } from "./seoMeta.api";
import { extractApiError } from "../../../lib/apiClient";
import { SEO_PAGE_TYPE } from "../../../lib/lookups";
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
// match the SeoMeta columns 1:1 (vehicleSchema, faqSchema, ...).
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
  metaTitle?: string;
  metaDescription?: string;
  schema?: Partial<Record<SchemaFieldKey, string>>;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Thin wrapper — remounts the actual form (via `key={slug}`) whenever the
// sidebar selection changes, so any unsaved edits for the previous page
// are dropped instead of leaking into the newly selected page's form.
export default function SeoMetaModal({
  slug,
  slugLabel,
  seoMeta,
}: {
  slug: string;
  slugLabel: string;
  seoMeta: SeoMetaRecord | null;
}) {
  return <SeoMetaForm key={slug} slug={slug} slugLabel={slugLabel} seoMeta={seoMeta} />;
}

function SeoMetaForm({ slug, slugLabel, seoMeta }: { slug: string; slugLabel: string; seoMeta: SeoMetaRecord | null }) {
  const isEditMode = !!seoMeta;

  const [activeTab, setActiveTab] = useState<"meta" | "schema">("meta");

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

  // Structured-data JSON strings, one per schema.org type.
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
  const [justSaved, setJustSaved] = useState(false);
  const metaTitleRef = useRef<HTMLInputElement>(null);

  const [createSeoMeta, { isLoading: creating }] = useCreateSeoMetaMutation();
  const [updateSeoMeta, { isLoading: updating }] = useUpdateSeoMetaMutation();
  const saving = creating || updating;

  useEffect(() => {
    const focusTimer = setTimeout(() => metaTitleRef.current?.focus(), 50);
    return () => clearTimeout(focusTimer);
  }, []);

  // Clear the "Saved" banner a couple seconds after it appears.
  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(false), 2500);
    return () => clearTimeout(t);
  }, [justSaved]);

  const validate = (): boolean => {
    const next: FieldErrors = {};

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

    // If the only problems are in the schema tab, jump there so the admin
    // isn't left staring at a "Meta Info" tab with no visible error.
    const hasMetaTabError = !!(next.metaTitle || next.metaDescription);
    if (!hasMetaTabError && next.schema) setActiveTab("schema");
    else if (hasMetaTabError) setActiveTab("meta");

    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    setJustSaved(false);
    if (!validate()) return;

    const payload = {
      pageType: SEO_PAGE_TYPE.STATIC as number,
      entityId: null,
      staticPageSlug: slug,
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
      setJustSaved(true);
    } catch (err) {
      setServerError(extractApiError(err));
    }
  };

  return (
    <div className="bg-white border border-[#e8e4dc] rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(28,26,23,0.04)]">
      <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#ece7dd] bg-gradient-to-b from-[#fefaf8] to-white">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[#1c1a17] text-lg font-black">{slugLabel}</h2>
            <span
              className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ color: ACCENT, background: "#fbeae6" }}
            >
              Static page
            </span>
          </div>
          <p className="text-[#a39e96] text-xs mt-1">
            {isEditMode
              ? `Last updated ${fmtDate(seoMeta?.updatedAt)} by ${seoMeta?.updatedByAdmin?.name ?? "—"}`
              : "No SEO entry yet for this page — fill the form below to create one."}
          </p>
        </div>
        {justSaved && (
          <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full whitespace-nowrap">
            ✓ Saved
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-6 pt-4 border-b border-[#ece7dd] bg-[#fefaf8]">
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
          <SectionCard title="Basic Info" icon={<InfoSectionIcon />}>
            <Field label="Meta title" required>
              <TextField
                value={metaTitle}
                onChange={setMetaTitle}
                placeholder="e.g. Maruti Suzuki Cars — Price, Models & Specs"
                error={errors.metaTitle}
                maxLength={255}
                inputRef={metaTitleRef}
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
              <TextField value={metaKeywords} onChange={setMetaKeywords} placeholder="e.g. maruti suzuki, cars, price" />
            </Field>

            <Field label="H1 tag">
              <TextField value={h1Tag} onChange={setH1Tag} placeholder="e.g. Maruti Suzuki Cars in India" maxLength={255} />
            </Field>
          </SectionCard>

          <SectionCard title="Search Engine" icon={<SearchEngineSectionIcon />}>
            <Field label="Canonical URL">
              <TextField value={canonicalUrl} onChange={setCanonicalUrl} placeholder="https://example.com/brand/maruti-suzuki" />
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
  );
}
