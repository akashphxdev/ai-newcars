// src/pages/newCars/PowertrainIce/PowertrainIceModal.tsx
import { useState } from "react";
import {
  useCreatePowertrainIceMutation,
  useUpdatePowertrainIceMutation,
  type PowertrainIceRecord,
  type FuelType,
  type IceTransmissionType,
  type Drivetrain,
} from "./powertrainIce.api";
import { useGetVariantsQuery } from "../Variants/variant.api";
import { useGetCarModelsQuery } from "../carModels/carModel.api";
import { useGetBrandsQuery } from "../Brands/brand.api";
import { extractApiError } from "../../../lib/apiClient";

const ACCENT = "#D4300F";

const FUEL_TYPES: { value: FuelType; label: string }[] = [
  { value: "petrol", label: "Petrol" },
  { value: "diesel", label: "Diesel" },
  { value: "cng", label: "CNG" },
  { value: "lpg", label: "LPG" },
  { value: "hybrid", label: "Hybrid" },
];

const TRANSMISSION_TYPES: { value: IceTransmissionType; label: string }[] = [
  { value: "manual", label: "Manual" },
  { value: "automatic", label: "Automatic" },
  { value: "amt", label: "AMT" },
  { value: "cvt", label: "CVT" },
  { value: "dct", label: "DCT" },
];

const DRIVETRAINS: { value: Drivetrain; label: string }[] = [
  { value: "FWD", label: "FWD" },
  { value: "RWD", label: "RWD" },
  { value: "AWD", label: "AWD" },
  { value: "4WD", label: "4WD" },
];

interface FieldErrors {
  brandId?: string;
  modelId?: string;
  variantId?: string;
  fuelType?: string;
}

// All spec fields are stored as plain strings in local state (mirrors
// input value directly) and converted to number | null on submit — this
// is a "form data bag", not the raw payload shape. Only variantId and
// fuelType are validated as truly required; everything else is optional
// spec data filled in progressively.
interface FormState {
  variantId: number | "";
  fuelType: FuelType | "";
  fuelTypeSubCategory: string;
  fuelTankCapacity: string;
  cngTankCapacity: string;
  kerbWeight: string;
  engineDisplacement: string;
  cubicCapacity: string;
  cylinders: string;
  cylinderCapacity: string;
  transmissionType: IceTransmissionType | "";
  transmissionSubType: string;
  transmissionSpeed: string;
  numGears: string;
  isFourByFour: boolean;
  drivetrain: Drivetrain | "";
  powerPs: string;
  powerMinRpm: string;
  powerMaxRpm: string;
  powerWeight: string;
  torqueNm: string;
  torqueMinRpm: string;
  torqueMaxRpm: string;
  torqueWeight: string;
  claimedFe: string;
  realWorldMileage: string;
  cityMileage: string;
  highwayMileage: string;
  topSpeedKmph: string;
  topSpeedTimeSec: string;
  realWorldUrl: string;
  cityUrl: string;
  highwayUrl: string;
  isDefault: boolean;
}

function buildInitialState(p?: PowertrainIceRecord | null): FormState {
  return {
    variantId: p?.variantId ?? "",
    fuelType: p?.fuelType ?? "",
    fuelTypeSubCategory: p?.fuelTypeSubCategory ?? "",
    fuelTankCapacity: p?.fuelTankCapacity ?? "",
    cngTankCapacity: p?.cngTankCapacity ?? "",
    kerbWeight: p?.kerbWeight != null ? String(p.kerbWeight) : "",
    engineDisplacement: p?.engineDisplacement ?? "",
    cubicCapacity: p?.cubicCapacity != null ? String(p.cubicCapacity) : "",
    cylinders: p?.cylinders != null ? String(p.cylinders) : "",
    cylinderCapacity: p?.cylinderCapacity ?? "",
    transmissionType: p?.transmissionType ?? "",
    transmissionSubType: p?.transmissionSubType ?? "",
    transmissionSpeed: p?.transmissionSpeed != null ? String(p.transmissionSpeed) : "",
    numGears: p?.numGears != null ? String(p.numGears) : "",
    isFourByFour: p?.isFourByFour ?? false,
    drivetrain: p?.drivetrain ?? "",
    powerPs: p?.powerPs != null ? String(p.powerPs) : "",
    powerMinRpm: p?.powerMinRpm != null ? String(p.powerMinRpm) : "",
    powerMaxRpm: p?.powerMaxRpm != null ? String(p.powerMaxRpm) : "",
    powerWeight: p?.powerWeight ?? "",
    torqueNm: p?.torqueNm != null ? String(p.torqueNm) : "",
    torqueMinRpm: p?.torqueMinRpm != null ? String(p.torqueMinRpm) : "",
    torqueMaxRpm: p?.torqueMaxRpm != null ? String(p.torqueMaxRpm) : "",
    torqueWeight: p?.torqueWeight ?? "",
    claimedFe: p?.claimedFe ?? "",
    realWorldMileage: p?.realWorldMileage ?? "",
    cityMileage: p?.cityMileage ?? "",
    highwayMileage: p?.highwayMileage ?? "",
    topSpeedKmph: p?.topSpeedKmph != null ? String(p.topSpeedKmph) : "",
    topSpeedTimeSec: p?.topSpeedTimeSec ?? "",
    realWorldUrl: p?.realWorldUrl ?? "",
    cityUrl: p?.cityUrl ?? "",
    highwayUrl: p?.highwayUrl ?? "",
    isDefault: p?.isDefault ?? false,
  };
}

// "" -> null (clears the field on the server), otherwise Number(value).
function numOrNull(value: string): number | null {
  return value === "" ? null : Number(value);
}

// "" -> null, otherwise the trimmed string.
function strOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{error}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 pt-1">
      <p className="text-[11px] font-black uppercase tracking-wider text-[#1c1a17] border-b border-[#f0ece6] pb-1.5">
        {title}
      </p>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

const inputClass =
  "w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border border-[#e2ddd5] rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white";
const selectClass = "cursor-pointer " + inputClass;

export default function PowertrainIceModal({
  open,
  onClose,
  powertrain,
}: {
  open: boolean;
  onClose: () => void;
  // Present -> edit mode. Absent/null -> create mode.
  powertrain?: PowertrainIceRecord | null;
}) {
  const isEditMode = !!powertrain;

  // NOTE: same 100-row cap used elsewhere (Brand dropdown, CarModel
  // dropdown in VariantModal) — fine while the variants table stays
  // under 100 rows.
  const { data: variantsData } = useGetVariantsQuery({ limit: 100, sortBy: "variantName", sortOrder: "asc" });
  const variants = variantsData?.data ?? [];

  const { data: brandsData } = useGetBrandsQuery({ limit: 100, sortBy: "name", sortOrder: "asc" });
  const brands = brandsData?.data ?? [];

  const { data: carModelsData } = useGetCarModelsQuery({ limit: 100, sortBy: "name", sortOrder: "asc" });
  const carModels = carModelsData?.data ?? [];

  // brandId/modelId are UI-only cascading filters — only variantId is
  // actually part of the submitted payload.
  const [brandId, setBrandId] = useState<number | "">(powertrain?.variant.model.brand.id ?? "");
  const [modelId, setModelId] = useState<number | "">(powertrain?.variant.model.id ?? "");
  const modelsForBrand = brandId ? carModels.filter((m) => m.brandId === brandId) : [];
  const variantsForModel = modelId ? variants.filter((v) => v.modelId === modelId) : [];

  const [form, setForm] = useState<FormState>(buildInitialState(powertrain));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");

  const [createPowertrainIce, { isLoading: creating }] = useCreatePowertrainIceMutation();
  const [updatePowertrainIce, { isLoading: updating }] = useUpdatePowertrainIceMutation();
  const saving = creating || updating;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  if (!open) return null;

  const handleClose = () => {
    setForm(buildInitialState(null));
    setBrandId("");
    setModelId("");
    setErrors({});
    setServerError("");
    onClose();
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!brandId) next.brandId = "Brand is required.";
    if (!modelId) next.modelId = "Car model is required.";
    if (!form.variantId) next.variantId = "Variant is required.";
    if (!form.fuelType) next.fuelType = "Fuel type is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    const payload = {
      variantId: Number(form.variantId),
      fuelType: form.fuelType as FuelType,
      fuelTypeSubCategory: strOrNull(form.fuelTypeSubCategory),
      fuelTankCapacity: numOrNull(form.fuelTankCapacity),
      cngTankCapacity: numOrNull(form.cngTankCapacity),
      kerbWeight: numOrNull(form.kerbWeight),
      engineDisplacement: numOrNull(form.engineDisplacement),
      cubicCapacity: numOrNull(form.cubicCapacity),
      cylinders: numOrNull(form.cylinders),
      cylinderCapacity: numOrNull(form.cylinderCapacity),
      transmissionType: form.transmissionType || null,
      transmissionSubType: strOrNull(form.transmissionSubType),
      transmissionSpeed: numOrNull(form.transmissionSpeed),
      numGears: numOrNull(form.numGears),
      isFourByFour: form.isFourByFour,
      drivetrain: form.drivetrain || null,
      powerPs: numOrNull(form.powerPs),
      powerMinRpm: numOrNull(form.powerMinRpm),
      powerMaxRpm: numOrNull(form.powerMaxRpm),
      powerWeight: numOrNull(form.powerWeight),
      torqueNm: numOrNull(form.torqueNm),
      torqueMinRpm: numOrNull(form.torqueMinRpm),
      torqueMaxRpm: numOrNull(form.torqueMaxRpm),
      torqueWeight: numOrNull(form.torqueWeight),
      claimedFe: numOrNull(form.claimedFe),
      realWorldMileage: numOrNull(form.realWorldMileage),
      cityMileage: numOrNull(form.cityMileage),
      highwayMileage: numOrNull(form.highwayMileage),
      topSpeedKmph: numOrNull(form.topSpeedKmph),
      topSpeedTimeSec: numOrNull(form.topSpeedTimeSec),
      realWorldUrl: strOrNull(form.realWorldUrl),
      cityUrl: strOrNull(form.cityUrl),
      highwayUrl: strOrNull(form.highwayUrl),
      isDefault: form.isDefault,
    };

    try {
      if (isEditMode && powertrain) {
        await updatePowertrainIce({ id: powertrain.id, input: payload }).unwrap();
      } else {
        await createPowertrainIce(payload).unwrap();
      }
      handleClose();
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
      <div className="w-full max-w-[720px] bg-white border border-[#e8e4dc] rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-[#1c1a17] text-lg font-black">
              {isEditMode ? "Edit ICE powertrain" : "Add ICE powertrain"}
            </h2>
            <p className="text-[#a39e96] text-xs mt-1">
              {isEditMode
                ? `Update spec details for "${powertrain?.variant.variantName}"`
                : "Variant and fuel type are required — everything else can be filled in later."}
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
          <Section title="Basics">
            <Field label="Brand" error={errors.brandId}>
              <select
                value={brandId}
                onChange={(e) => {
                  const next = e.target.value ? Number(e.target.value) : "";
                  setBrandId(next);
                  setModelId("");
                  set("variantId", "");
                }}
                className={selectClass}
              >
                <option value="">Select a brand</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Car model" error={errors.modelId}>
              <select
                value={modelId}
                onChange={(e) => {
                  const next = e.target.value ? Number(e.target.value) : "";
                  setModelId(next);
                  set("variantId", "");
                }}
                disabled={!brandId}
                className={selectClass + " disabled:opacity-50 disabled:cursor-not-allowed"}
              >
                <option value="">{brandId ? "Select a car model" : "Select a brand first"}</option>
                {modelsForBrand.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Variant" error={errors.variantId}>
              <select
                value={form.variantId}
                onChange={(e) => set("variantId", e.target.value ? Number(e.target.value) : "")}
                disabled={!modelId}
                className={selectClass + " disabled:opacity-50 disabled:cursor-not-allowed"}
              >
                <option value="">{modelId ? "Select a variant" : "Select a car model first"}</option>
                {variantsForModel.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.variantName}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fuel type" error={errors.fuelType}>
              <select
                value={form.fuelType}
                onChange={(e) => set("fuelType", (e.target.value as FuelType) || "")}
                className={selectClass}
              >
                <option value="">Select fuel type</option>
                {FUEL_TYPES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fuel type sub-category">
              <input
                type="text"
                value={form.fuelTypeSubCategory}
                onChange={(e) => set("fuelTypeSubCategory", e.target.value)}
                placeholder="e.g. Turbo, Strong Hybrid"
                className={inputClass}
              />
            </Field>
            <Field label="Kerb weight (kg)">
              <input
                type="number"
                min={0}
                value={form.kerbWeight}
                onChange={(e) => set("kerbWeight", e.target.value)}
                className={inputClass}
              />
            </Field>
          </Section>

          <Section title="Engine & tank">
            <Field label="Fuel tank capacity (L)">
              <input type="number" min={0} step="0.1" value={form.fuelTankCapacity} onChange={(e) => set("fuelTankCapacity", e.target.value)} className={inputClass} />
            </Field>
            <Field label="CNG tank capacity (kg)">
              <input type="number" min={0} step="0.1" value={form.cngTankCapacity} onChange={(e) => set("cngTankCapacity", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Engine displacement (L)">
              <input type="number" min={0} step="0.01" value={form.engineDisplacement} onChange={(e) => set("engineDisplacement", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Cubic capacity (cc)">
              <input type="number" min={0} value={form.cubicCapacity} onChange={(e) => set("cubicCapacity", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Cylinders">
              <input type="number" min={0} value={form.cylinders} onChange={(e) => set("cylinders", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Cylinder capacity (cc)">
              <input type="number" min={0} step="0.1" value={form.cylinderCapacity} onChange={(e) => set("cylinderCapacity", e.target.value)} className={inputClass} />
            </Field>
          </Section>

          <Section title="Transmission & drivetrain">
            <Field label="Transmission type">
              <select value={form.transmissionType} onChange={(e) => set("transmissionType", (e.target.value as IceTransmissionType) || "")} className={selectClass}>
                <option value="">Not set</option>
                {TRANSMISSION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Transmission sub-type">
              <input type="text" value={form.transmissionSubType} onChange={(e) => set("transmissionSubType", e.target.value)} placeholder="e.g. Dual-clutch" className={inputClass} />
            </Field>
            <Field label="Transmission speed">
              <input type="number" min={0} value={form.transmissionSpeed} onChange={(e) => set("transmissionSpeed", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Number of gears">
              <input type="number" min={0} value={form.numGears} onChange={(e) => set("numGears", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Drivetrain">
              <select value={form.drivetrain} onChange={(e) => set("drivetrain", (e.target.value as Drivetrain) || "")} className={selectClass}>
                <option value="">Not set</option>
                {DRIVETRAINS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </Field>
            <div className="flex items-end pb-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={form.isFourByFour} onChange={(e) => set("isFourByFour", e.target.checked)} className="w-4 h-4 rounded accent-[#D4300F] cursor-pointer" />
                <span className="text-sm font-medium text-[#4a4640]">Is 4x4</span>
              </label>
            </div>
          </Section>

          <Section title="Power & torque">
            <Field label="Power (PS)">
              <input type="number" min={0} value={form.powerPs} onChange={(e) => set("powerPs", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Power-to-weight">
              <input type="number" min={0} step="0.01" value={form.powerWeight} onChange={(e) => set("powerWeight", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Power min RPM">
              <input type="number" min={0} value={form.powerMinRpm} onChange={(e) => set("powerMinRpm", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Power max RPM">
              <input type="number" min={0} value={form.powerMaxRpm} onChange={(e) => set("powerMaxRpm", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Torque (Nm)">
              <input type="number" min={0} value={form.torqueNm} onChange={(e) => set("torqueNm", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Torque-to-weight">
              <input type="number" min={0} step="0.01" value={form.torqueWeight} onChange={(e) => set("torqueWeight", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Torque min RPM">
              <input type="number" min={0} value={form.torqueMinRpm} onChange={(e) => set("torqueMinRpm", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Torque max RPM">
              <input type="number" min={0} value={form.torqueMaxRpm} onChange={(e) => set("torqueMaxRpm", e.target.value)} className={inputClass} />
            </Field>
          </Section>

          <Section title="Mileage & performance">
            <Field label="Claimed FE (kmpl)">
              <input type="number" min={0} step="0.01" value={form.claimedFe} onChange={(e) => set("claimedFe", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Real world mileage (kmpl)">
              <input type="number" min={0} step="0.01" value={form.realWorldMileage} onChange={(e) => set("realWorldMileage", e.target.value)} className={inputClass} />
            </Field>
            <Field label="City mileage (kmpl)">
              <input type="number" min={0} step="0.01" value={form.cityMileage} onChange={(e) => set("cityMileage", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Highway mileage (kmpl)">
              <input type="number" min={0} step="0.01" value={form.highwayMileage} onChange={(e) => set("highwayMileage", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Top speed (km/h)">
              <input type="number" min={0} value={form.topSpeedKmph} onChange={(e) => set("topSpeedKmph", e.target.value)} className={inputClass} />
            </Field>
            <Field label="0-100 time (sec)">
              <input type="number" min={0} step="0.1" value={form.topSpeedTimeSec} onChange={(e) => set("topSpeedTimeSec", e.target.value)} className={inputClass} />
            </Field>
          </Section>

          <Section title="Test-run URLs">
            <Field label="Real-world test URL">
              <input type="url" value={form.realWorldUrl} onChange={(e) => set("realWorldUrl", e.target.value)} placeholder="https://..." className={inputClass} />
            </Field>
            <Field label="City test URL">
              <input type="url" value={form.cityUrl} onChange={(e) => set("cityUrl", e.target.value)} placeholder="https://..." className={inputClass} />
            </Field>
            <Field label="Highway test URL">
              <input type="url" value={form.highwayUrl} onChange={(e) => set("highwayUrl", e.target.value)} placeholder="https://..." className={inputClass} />
            </Field>
          </Section>

          <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => set("isDefault", e.target.checked)}
              className="w-4 h-4 rounded accent-[#D4300F] cursor-pointer"
            />
            <span className="text-sm font-medium text-[#4a4640]">
              Set as default ICE powertrain for this variant
            </span>
          </label>

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
                "Create powertrain"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}