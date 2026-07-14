// src/pages/newCars/PowertrainIce/PowertrainIceModal.tsx
import { useEffect, useState } from "react";
import {
  useCreatePowertrainIceMutation,
  useUpdatePowertrainIceMutation,
  useGetPowertrainIceByIdQuery,
  type PowertrainIceRecord,
  type FuelType,
} from "./powertrainIce.api";
import { useGetVariantOptionsQuery } from "../Variants/variant.api";
import { useGetCarModelOptionsQuery } from "../carModels/carModel.api";
import { useGetBrandOptionsQuery } from "../Brands/brand.api";
import { useGetAttributeOptionsGroupedQuery } from "../AttributeOptions/attributeOption.api";
import { extractApiError } from "../../../lib/apiClient";
import { FUEL_TYPE_OPTIONS } from "../../../lib/lookups";

const ACCENT = "#D4300F";

interface FieldErrors {
  brandId?: string;
  modelId?: string;
  variantId?: string;
  fuelType?: string;
  kerbWeight?: string;
  engineDisplacement?: string;
  cylinders?: string;
  transmissionTypeId?: string;
  powerPs?: string;
  torqueNm?: string;
}

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
  transmissionTypeId: number | "";
  transmissionSubType: string;
  transmissionSpeed: string;
  numGears: string;
  isFourByFour: boolean;
  drivetrainId: number | "";
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
    transmissionTypeId: p?.transmissionTypeId ?? "",
    transmissionSubType: p?.transmissionSubType ?? "",
    transmissionSpeed: p?.transmissionSpeed != null ? String(p.transmissionSpeed) : "",
    numGears: p?.numGears != null ? String(p.numGears) : "",
    isFourByFour: p?.isFourByFour ?? false,
    drivetrainId: p?.drivetrainId ?? "",
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

function numOrNull(value: string): number | null {
  return value === "" ? null : Number(value);
}

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
  editId,
}: {
  open: boolean;
  onClose: () => void;
  // Only the row's id comes in from the listing (it only holds the
  // lightweight table fields now) — the modal fetches the full spec
  // sheet itself so Edit never overwrites fields it can't see.
  editId?: number | null;
}) {
  const isEditMode = editId != null;

  const { data: powertrain, isFetching: loadingPowertrain } = useGetPowertrainIceByIdQuery(editId ?? 0, {
    skip: editId == null,
  });

  const { data: brands = [] } = useGetBrandOptionsQuery();

  const { data: attributeOptionsGrouped } = useGetAttributeOptionsGroupedQuery();
  const transmissionTypes = attributeOptionsGrouped?.transmission ?? [];
  const drivetrains = attributeOptionsGrouped?.drivetrain ?? [];

  const [brandId, setBrandId] = useState<number | "">("");
  const [modelId, setModelId] = useState<number | "">("");
  // Scoped server-side to the chosen brand/model — options-endpoint, no row cap.
  const { data: modelsForBrand = [] } = useGetCarModelOptionsQuery(
    brandId ? { brandId: Number(brandId) } : undefined,
    { skip: !brandId },
  );
  const { data: variantsForModel = [] } = useGetVariantOptionsQuery(
    modelId ? { modelId: Number(modelId) } : undefined,
    { skip: !modelId },
  );

  const [form, setForm] = useState<FormState>(buildInitialState(null));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");

  // Full record arrives async (fresh fetch, or instantly from cache if
  // this row was already expanded) — sync the form once it's here.
  useEffect(() => {
    if (powertrain) {
      setForm(buildInitialState(powertrain));
      setBrandId(powertrain.variant.model.brand.id);
      setModelId(powertrain.variant.model.id);
    }
  }, [powertrain]);

  const [createPowertrainIce, { isLoading: creating }] = useCreatePowertrainIceMutation();
  const [updatePowertrainIce, { isLoading: updating }] = useUpdatePowertrainIceMutation();
  const saving = creating || updating;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  if (!open) return null;

  // Edit mode, but the full record hasn't arrived yet — show a small
  // loading state instead of a form that would look empty/wrong for a
  // moment. Usually instant if this row was already expanded (cached).
  if (isEditMode && !powertrain) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="w-full max-w-[720px] bg-white border border-[#e8e4dc] rounded-2xl shadow-xl p-10 text-center">
          <p className="text-[#a39e96] text-sm font-medium">
            {loadingPowertrain ? "Loading powertrain details..." : "Powertrain not found."}
          </p>
        </div>
      </div>
    );
  }

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
    if (form.kerbWeight === "" || Number(form.kerbWeight) < 0) next.kerbWeight = "Kerb weight is required.";
    if (form.engineDisplacement === "" || Number(form.engineDisplacement) <= 0)
      next.engineDisplacement = "Engine displacement is required.";
    if (form.cylinders === "" || Number(form.cylinders) <= 0) next.cylinders = "Cylinders is required.";
    if (!form.transmissionTypeId) next.transmissionTypeId = "Transmission type is required.";
    if (form.powerPs === "" || Number(form.powerPs) <= 0) next.powerPs = "Power (PS) is required.";
    if (form.torqueNm === "" || Number(form.torqueNm) <= 0) next.torqueNm = "Torque (Nm) is required.";
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
      transmissionTypeId: form.transmissionTypeId === "" ? null : Number(form.transmissionTypeId),
      transmissionSubType: strOrNull(form.transmissionSubType),
      transmissionSpeed: numOrNull(form.transmissionSpeed),
      numGears: numOrNull(form.numGears),
      isFourByFour: form.isFourByFour,
      drivetrainId: form.drivetrainId === "" ? null : Number(form.drivetrainId),
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
                : "Variant, fuel type, kerb weight, displacement, cylinders, transmission, power and torque are required — everything else can be filled in later."}
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
                onChange={(e) => set("fuelType", e.target.value ? (Number(e.target.value) as FuelType) : "")}
                className={selectClass}
              >
                <option value="">Select fuel type</option>
                {FUEL_TYPE_OPTIONS.map((f) => (
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
            <Field label="Kerb weight (kg)" error={errors.kerbWeight}>
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
            <Field label="Engine displacement (L)" error={errors.engineDisplacement}>
              <input type="number" min={0} step="0.01" value={form.engineDisplacement} onChange={(e) => set("engineDisplacement", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Cubic capacity (cc)">
              <input type="number" min={0} value={form.cubicCapacity} onChange={(e) => set("cubicCapacity", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Cylinders" error={errors.cylinders}>
              <input type="number" min={0} value={form.cylinders} onChange={(e) => set("cylinders", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Cylinder capacity (cc)">
              <input type="number" min={0} step="0.1" value={form.cylinderCapacity} onChange={(e) => set("cylinderCapacity", e.target.value)} className={inputClass} />
            </Field>
          </Section>

          <Section title="Transmission & drivetrain">
            <Field label="Transmission type" error={errors.transmissionTypeId}>
              <select
                value={form.transmissionTypeId}
                onChange={(e) => set("transmissionTypeId", e.target.value ? Number(e.target.value) : "")}
                className={selectClass}
              >
                <option value="">Not set</option>
                {transmissionTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
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
              <select
                value={form.drivetrainId}
                onChange={(e) => set("drivetrainId", e.target.value ? Number(e.target.value) : "")}
                className={selectClass}
              >
                <option value="">Not set</option>
                {drivetrains.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
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
            <Field label="Power (PS)" error={errors.powerPs}>
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
            <Field label="Torque (Nm)" error={errors.torqueNm}>
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