// src/pages/Brands/BrandModal.tsx
import { useRef, useState } from "react";
import {
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useUploadBrandLogoMutation,
  type BrandRecord,
} from "./brand.api";
import { useGetCountriesQuery } from "../../Locations/Countries/country.api";
import { extractApiError, getUploadUrl } from "../../../lib/apiClient";

const ACCENT = "#D4300F";

// Mirrors src/core/utils/slugify.ts on the backend exactly, so the
// live preview in the form matches what the server would generate.
function slugify(input: string): string {
  return input
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface FieldErrors {
  name?: string;
  slug?: string;
  logo?: string;
  countryOriginId?: string;
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

export default function BrandModal({
  open,
  onClose,
  brand,
}: {
  open: boolean;
  onClose: () => void;
  // Present -> edit mode. Absent/null -> create mode.
  brand?: BrandRecord | null;
}) {
  const isEditMode = !!brand;

  // NOTE: same 100-row cap as elsewhere (Locations pages) — fine while
  // the countries table stays under 100 rows.
  const { data: countriesData } = useGetCountriesQuery({ limit: 100, sortBy: "name", sortOrder: "asc" });
  const countries = countriesData?.data ?? [];

  const [countryOriginId, setCountryOriginId] = useState<number | "">(brand?.countryOriginId ?? "");
  const [name, setName] = useState(brand ? brand.name : "");
  const [slug, setSlug] = useState(brand ? brand.slug : "");
  const [slugTouched, setSlugTouched] = useState(false);
  const [isActive, setIsActive] = useState(brand ? brand.isActive : true);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const [createBrand, { isLoading: creating }] = useCreateBrandMutation();
  const [updateBrand, { isLoading: updating }] = useUpdateBrandMutation();
  const saving = creating || updating;

  // Logo is required on create — same upload mechanics as CityModal.
  const [uploadBrandLogo, { isLoading: uploadingLogo }] = useUploadBrandLogoMutation();
  const [logoUrl, setLogoUrl] = useState<string | null>(brand?.logoUrl ?? null);
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoSelect = async (file: File | undefined) => {
    if (!file) return;
    setLogoError("");

    if (!isEditMode) {
      // Create mode: nothing to upload yet — just hold the file and
      // preview it. Actual upload happens on form submit.
      setPendingLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      return;
    }

    if (!brand) return;

    // Edit mode: instant local preview while the upload is in flight.
    const objectUrl = URL.createObjectURL(file);
    setLogoPreview(objectUrl);

    try {
      const result = await uploadBrandLogo({ id: brand.id, file }).unwrap();
      setLogoUrl(result.logoUrl);
    } catch (err) {
      setLogoError(extractApiError(err));
    } finally {
      URL.revokeObjectURL(objectUrl);
      setLogoPreview(null);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setCountryOriginId("");
    setName("");
    setSlug("");
    setSlugTouched(false);
    setIsActive(true);
    setErrors({});
    setServerError("");
    setPendingLogoFile(null);
    setLogoPreview(null);
    setLogoError("");
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugTouched(true);
    setSlug(value);
  };

  if (!open) return null;

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (name.trim().length < 2) next.name = "Name must be at least 2 characters.";
    if (slug.trim() && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
      next.slug = "Slug must be lowercase letters/numbers separated by hyphens (e.g. \"toyota\").";
    }
    // Logo is required on create. In edit mode a logo already exists
    // (or was uploaded separately above) — nothing to validate here.
    if (!isEditMode && !pendingLogoFile) {
      next.logo = "Brand logo is required.";
    }
    if (countryOriginId === "") {
      next.countryOriginId = "Country of origin is required.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    try {
      if (isEditMode && brand) {
        await updateBrand({
          id: brand.id,
          input: {
            name: name.trim(),
            slug: slugTouched ? slug.trim() || undefined : undefined, // leave empty to let the backend auto-generate
            // Explicit null clears an existing country-of-origin.
            countryOriginId: Number(countryOriginId),
            isActive,
          },
        }).unwrap();
      } else {
        // pendingLogoFile is guaranteed non-null here — validate() above
        // already blocked submission without one in create mode.
        await createBrand({
          name: name.trim(),
          slug: slug.trim() || undefined,
          countryOriginId: Number(countryOriginId),
          isActive,
          logo: pendingLogoFile as File,
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
            <h2 className="text-[#1c1a17] text-lg font-black">{isEditMode ? "Edit brand" : "Add brand"}</h2>
            <p className="text-[#a39e96] text-xs mt-1">
              {isEditMode
                ? `Update details for ${brand?.name}`
                : "Slug is auto-generated from the name, but you can edit it."}
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
          <div className="flex items-center gap-3 pb-1">
            <div
              className="w-14 h-14 rounded-xl border bg-[#f7f5f1] overflow-hidden flex items-center justify-center shrink-0"
              style={{ borderColor: errors.logo ? "#f0997b" : "#e2ddd5" }}
            >
              {logoPreview || logoUrl ? (
                <img
                  src={logoPreview ?? getUploadUrl(logoUrl) ?? undefined}
                  alt={isEditMode ? `${brand?.name} logo` : "Brand logo preview"}
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
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="cursor-pointer text-[11px] font-bold px-3 py-1.5 rounded-lg border border-[#e2ddd5] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors disabled:opacity-50"
              >
                {uploadingLogo ? "Uploading..." : logoUrl || pendingLogoFile ? "Change logo" : "Upload logo"}
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleLogoSelect(e.target.files?.[0])}
                className="hidden"
              />
              <p className="text-[10px] text-[#a39e96] mt-1">JPG, PNG or WEBP, up to 2MB.</p>
              {errors.logo && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.logo}</p>}
              {logoError && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{logoError}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <input
                ref={nameRef}
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Toyota"
                className="w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
                style={{
                  borderColor: errors.name ? "#f0997b" : "#e2ddd5",
                  boxShadow: errors.name ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
                }}
              />
              {errors.name && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.name}</p>}
            </Field>

            <Field label="Slug">
              <input
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="auto-generated from name"
                className="w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
                style={{
                  borderColor: errors.slug ? "#f0997b" : "#e2ddd5",
                  boxShadow: errors.slug ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
                }}
              />
              {errors.slug ? (
                <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.slug}</p>
              ) : (
                <p className="text-[11px] text-[#a39e96] mt-1">
                  {slugTouched ? "Manually edited." : "Auto-syncing with name."}
                </p>
              )}
            </Field>
          </div>

          <Field label="Country of origin">
            <select
              value={countryOriginId}
              onChange={(e) => setCountryOriginId(e.target.value ? Number(e.target.value) : "")}
              className="cursor-pointer w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
              style={{ borderColor: errors.countryOriginId ? "#f0997b" : "#e2ddd5" }}
            >
              <option value="">Select a country</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.countryOriginId && (
              <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.countryOriginId}</p>
            )}
          </Field>

          <label className="flex items-center gap-1.5 cursor-pointer text-[12px] font-semibold text-[#4a4640] pt-1">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="cursor-pointer accent-[#D4300F]"
            />
            Active
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
                "Create brand"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}