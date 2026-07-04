// src/pages/newCars/carModels/CarModelModal.tsx
import { useRef, useState } from "react";
import {
  useCreateCarModelMutation,
  useUpdateCarModelMutation,
  type CarModelRecord,
  type BodyType,
  type LaunchStatus,
} from "./carModel.api";
import { useGetBrandsQuery } from "../Brands/brand.api";
import { extractApiError } from "../../../lib/apiClient";

const ACCENT = "#D4300F";

const BODY_TYPES: BodyType[] = [
  "hatchback",
  "sedan",
  "suv",
  "muv",
  "coupe",
  "convertible",
  "pickup",
  "van",
];

const LAUNCH_STATUS_OPTIONS: { value: LaunchStatus; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "upcoming", label: "Upcoming" },
  { value: "discontinued", label: "Discontinued" },
];

// Mirrors src/core/utils/slugify.ts on the backend exactly, so the live
// preview in the form matches what the server would generate.
function slugify(input: string): string {
  return input
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// yyyy-mm-dd for the <input type="date"> element.
function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

interface FieldErrors {
  name?: string;
  slug?: string;
  brandId?: string;
  priceMax?: string;
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

export default function CarModelModal({
  open,
  onClose,
  carModel,
}: {
  open: boolean;
  onClose: () => void;
  // Present -> edit mode. Absent/null -> create mode.
  carModel?: CarModelRecord | null;
}) {
  const isEditMode = !!carModel;

  // NOTE: same 100-row cap as elsewhere — fine while the brands table
  // stays under 100 rows.
  const { data: brandsData } = useGetBrandsQuery({ limit: 100, sortBy: "name", sortOrder: "asc" });
  const brands = brandsData?.data ?? [];
  const [brandId, setBrandId] = useState<number | "">(carModel?.brandId ?? "");
  const [name, setName] = useState(carModel ? carModel.name : "");
  const [slug, setSlug] = useState(carModel ? carModel.slug : "");
  // Once true, typing in Name no longer auto-regenerates Slug. Starts
  // true in edit mode (existing slug is intentional/possibly bookmarked).
  const [slugTouched, setSlugTouched] = useState(isEditMode);
  const [bodyType, setBodyType] = useState<BodyType | "">(carModel?.bodyType ?? "");
  const [launchStatus, setLaunchStatus] = useState<LaunchStatus>(carModel?.launchStatus ?? "available");
  const [expectedLaunchDate, setExpectedLaunchDate] = useState(
    toDateInputValue(carModel?.expectedLaunchDate ?? null),
  );
  const [priceMin, setPriceMin] = useState(carModel?.priceMin ?? "");
  const [priceMax, setPriceMax] = useState(carModel?.priceMax ?? "");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const [createCarModel, { isLoading: creating }] = useCreateCarModelMutation();
  const [updateCarModel, { isLoading: updating }] = useUpdateCarModelMutation();
  const saving = creating || updating;

  const resetForm = () => {
    setBrandId("");
    setName("");
    setSlug("");
    setSlugTouched(false);
    setBodyType("");
    setLaunchStatus("available");
    setExpectedLaunchDate("");
    setPriceMin("");
    setPriceMax("");
    setErrors({});
    setServerError("");
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
      next.slug = "Slug must be lowercase letters/numbers separated by hyphens (e.g. \"creta-2026\").";
    }
    if (!brandId) next.brandId = "Brand is required.";
    if (priceMin !== "" && priceMax !== "" && Number(priceMax) < Number(priceMin)) {
      next.priceMax = "Max price must be greater than or equal to min price.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    try {
      if (isEditMode && carModel) {
        await updateCarModel({
          id: carModel.id,
          input: {
            brandId: Number(brandId),
            name: name.trim(),
            slug: slug.trim() || undefined, // leave empty to let the backend auto-generate
            bodyType: bodyType || null,
            launchStatus,
            expectedLaunchDate: expectedLaunchDate || null,
            priceMin: priceMin === "" ? null : Number(priceMin),
            priceMax: priceMax === "" ? null : Number(priceMax),
          },
        }).unwrap();
      } else {
        await createCarModel({
          brandId: Number(brandId),
          name: name.trim(),
          slug: slug.trim() || undefined,
          bodyType: bodyType || undefined,
          launchStatus,
          expectedLaunchDate: expectedLaunchDate || undefined,
          priceMin: priceMin === "" ? undefined : Number(priceMin),
          priceMax: priceMax === "" ? undefined : Number(priceMax),
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
              {isEditMode ? "Edit car model" : "Add car model"}
            </h2>
            <p className="text-[#a39e96] text-xs mt-1">
              {isEditMode
                ? `Update details for ${carModel?.name}`
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <input
                ref={nameRef}
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Creta"
                className={inputClass}
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
                className={inputClass}
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

          <Field label="Brand">
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value ? Number(e.target.value) : "")}
              className="cursor-pointer w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
              style={{ borderColor: errors.brandId ? "#f0997b" : "#e2ddd5" }}
            >
              <option value="">Select a brand</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            {errors.brandId && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.brandId}</p>}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Body type (optional)">
              <select
                value={bodyType}
                onChange={(e) => setBodyType((e.target.value as BodyType) || "")}
                className="cursor-pointer w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border border-[#e2ddd5] rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white capitalize"
              >
                <option value="">None</option>
                {BODY_TYPES.map((bt) => (
                  <option key={bt} value={bt} className="capitalize">
                    {bt}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Launch status">
              <select
                value={launchStatus}
                onChange={(e) => setLaunchStatus(e.target.value as LaunchStatus)}
                className="cursor-pointer w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border border-[#e2ddd5] rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
              >
                {LAUNCH_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {launchStatus === "upcoming" && (
            <Field label="Expected launch date">
              <input
                type="date"
                value={expectedLaunchDate}
                onChange={(e) => setExpectedLaunchDate(e.target.value)}
                className={inputClass}
                style={{ borderColor: "#e2ddd5" }}
              />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Price min (₹, optional)">
              <input
                type="number"
                min={0}
                step="1000"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                placeholder="e.g. 1099000"
                className={inputClass}
                style={{ borderColor: "#e2ddd5" }}
              />
            </Field>

            <Field label="Price max (₹, optional)">
              <input
                type="number"
                min={0}
                step="1000"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder="e.g. 1999000"
                className={inputClass}
                style={{
                  borderColor: errors.priceMax ? "#f0997b" : "#e2ddd5",
                  boxShadow: errors.priceMax ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
                }}
              />
              {errors.priceMax && (
                <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.priceMax}</p>
              )}
            </Field>
          </div>

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
                "Create car model"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}