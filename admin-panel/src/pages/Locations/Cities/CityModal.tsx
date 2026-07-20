// src/pages/Locations/CityModal.tsx

import { useRef, useState } from "react";
import {
  useCreateCityMutation,
  useUpdateCityMutation,
  useUploadCityLogoMutation,
  type CityRecord,
} from "./city.api";
import { useGetDistrictOptionsQuery } from "../Districts/district.api";
import { useGetStateOptionsQuery } from "../States/state.api";
import { useGetCountryOptionsQuery } from "../Countries/country.api";
import { extractApiError, getUploadUrl } from "../../../lib/apiClient";
import { slugify } from "../../../lib/slugify";

const ACCENT = "#D4300F";

interface FieldErrors {
  districtId?: string;
  name?: string;
  slug?: string;
  logo?: string;
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

export default function CityModal({
  open,
  onClose,
  city,
}: {
  open: boolean;
  onClose: () => void;
  // Present -> edit mode. Absent/null -> create mode.
  city?: CityRecord | null;
}) {
  const isEditMode = !!city;

  const { data: countries = [] } = useGetCountryOptionsQuery();

  const [countryId, setCountryId] = useState<number | "">(
    city?.district?.state?.country?.id ?? ""
  );
  const [stateId, setStateId] = useState<number | "">(city?.district?.state?.id ?? "");
  const [districtId, setDistrictId] = useState<number | "">(city ? city.districtId : "");
  const [name, setName] = useState(city ? city.name : "");
  const [slug, setSlug] = useState(city ? city.slug : "");
  // Once true, typing in Name no longer auto-regenerates Slug. Starts
  // true in edit mode (existing slug is intentional/possibly bookmarked).
  const [slugTouched, setSlugTouched] = useState(isEditMode);
  const [isMetro, setIsMetro] = useState(city ? city.isMetro : false);
  const [isTopCity, setIsTopCity] = useState(city ? city.isTopCity : false);
  const [isSellCarEnabled, setIsSellCarEnabled] = useState(city ? city.isSellCarEnabled : false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const { data: states = [] } = useGetStateOptionsQuery({ countryId: countryId || undefined });

  const { data: districts = [] } = useGetDistrictOptionsQuery({ stateId: stateId || undefined });

  const [createCity, { isLoading: creating }] = useCreateCityMutation();
  const [updateCity, { isLoading: updating }] = useUpdateCityMutation();
  const saving = creating || updating;

  const [uploadCityLogo, { isLoading: uploadingLogo }] = useUploadCityLogoMutation();
  const [logoUrl, setLogoUrl] = useState<string | null>(city?.logoUrl ?? null);
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

    if (!city) return;

    // Edit mode: instant local preview while the upload is in flight.
    const objectUrl = URL.createObjectURL(file);
    setLogoPreview(objectUrl);

    try {
      const result = await uploadCityLogo({ id: city.id, file }).unwrap();
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
    setCountryId("");
    setStateId("");
    setDistrictId("");
    setName("");
    setSlug("");
    setSlugTouched(false);
    setIsMetro(false);
    setIsTopCity(false);
    setIsSellCarEnabled(false);
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
    if (!districtId) next.districtId = "Please select a district.";
    if (name.trim().length < 2) next.name = "Name must be at least 2 characters.";
    if (!slug.trim()) {
      next.slug = "Slug is required.";
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
      next.slug = "Slug must be lowercase letters/numbers separated by hyphens (e.g. \"new-delhi\").";
    }
    // Logo is required on create. In edit mode a logo already exists
    // (or was uploaded separately above) — nothing to validate here.
    if (!isEditMode && !pendingLogoFile) {
      next.logo = "City logo is required.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    const payload = {
      districtId: Number(districtId),
      name: name.trim(),
      // Always the literal value shown on screen — whether it came from
      // auto-sync or a manual edit — so what's displayed is exactly what
      // gets saved.
      slug: slug.trim(),
      isMetro,
      isTopCity,
      isSellCarEnabled,
    };

    try {
      if (isEditMode && city) {
        await updateCity({ id: city.id, input: payload }).unwrap();
      } else {
        // pendingLogoFile is guaranteed non-null here — validate() above
        // already blocked submission without one in create mode.
        await createCity({ ...payload, logo: pendingLogoFile as File }).unwrap();
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
            <h2 className="text-[#1c1a17] text-lg font-black">{isEditMode ? "Edit city" : "Add city"}</h2>
            <p className="text-[#a39e96] text-xs mt-1">
              {isEditMode
                ? `Update details for ${city?.name}`
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
                  alt={isEditMode ? `${city?.name} logo` : "City logo preview"}
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
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(e) => handleLogoSelect(e.target.files?.[0])}
                className="hidden"
              />
              <p className="text-[10px] text-[#a39e96] mt-1">JPG, PNG, WEBP or AVIF, up to 2MB. Required.</p>
              {errors.logo && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.logo}</p>}
              {logoError && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{logoError}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Country">
              <select
                value={countryId}
                onChange={(e) => {
                  setCountryId(e.target.value ? Number(e.target.value) : "");
                  setStateId("");
                  setDistrictId("");
                }}
                className="cursor-pointer w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border border-[#e2ddd5] rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
              >
                <option value="">Select</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="State">
              <select
                value={stateId}
                onChange={(e) => {
                  setStateId(e.target.value ? Number(e.target.value) : "");
                  setDistrictId("");
                }}
                disabled={!countryId}
                className="cursor-pointer w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border border-[#e2ddd5] rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white disabled:opacity-60"
              >
                <option value="">{countryId ? "Select" : "—"}</option>
                {states.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="District">
              <select
                value={districtId}
                onChange={(e) => setDistrictId(e.target.value ? Number(e.target.value) : "")}
                disabled={!stateId}
                className="cursor-pointer w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white disabled:opacity-60"
                style={{
                  borderColor: errors.districtId ? "#f0997b" : "#e2ddd5",
                  boxShadow: errors.districtId ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
                }}
              >
                <option value="">{stateId ? "Select" : "—"}</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              {errors.districtId && (
                <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.districtId}</p>
              )}
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <input
                ref={nameRef}
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. New Delhi"
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

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer text-[12px] font-semibold text-[#4a4640]">
              <input
                type="checkbox"
                checked={isMetro}
                onChange={(e) => setIsMetro(e.target.checked)}
                className="cursor-pointer accent-[#D4300F]"
              />
              Metro
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-[12px] font-semibold text-[#4a4640]">
              <input
                type="checkbox"
                checked={isTopCity}
                onChange={(e) => setIsTopCity(e.target.checked)}
                className="cursor-pointer accent-[#D4300F]"
              />
              Top city
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-[12px] font-semibold text-[#4a4640]">
              <input
                type="checkbox"
                checked={isSellCarEnabled}
                onChange={(e) => setIsSellCarEnabled(e.target.checked)}
                className="cursor-pointer accent-[#D4300F]"
              />
              Sell car enabled
            </label>
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
                "Create city"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}