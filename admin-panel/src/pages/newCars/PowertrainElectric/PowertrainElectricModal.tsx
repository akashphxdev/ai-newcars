// src/pages/newCars/PowertrainElectric/PowertrainElectricModal.tsx
import { useEffect, useState } from "react";
import {
  useCreatePowertrainElectricMutation,
  useUpdatePowertrainElectricMutation,
  useGetPowertrainElectricByIdQuery,
  type PowertrainElectricRecord,
  type TestCycleType,
} from "./powertrainElectric.api";
import { useGetVariantOptionsQuery } from "../Variants/variant.api";
import { useGetCarModelOptionsQuery } from "../carModels/carModel.api";
import { useGetBrandOptionsQuery } from "../Brands/brand.api";
import { useGetAttributeOptionsGroupedQuery } from "../AttributeOptions/attributeOption.api";
import { extractApiError } from "../../../lib/apiClient";
import { TEST_CYCLE_TYPE_OPTIONS } from "../../../lib/lookups";

const ACCENT = "#D4300F";

interface FieldErrors {
  brandId?: string;
  modelId?: string;
  variantId?: string;
  batteryCapacity?: string;
  drivetrainId?: string;
  powerPs?: string;
  torqueNm?: string;
  claimedRange?: string;
}
interface FormState {
  variantId: number | "";
  numMotors: string;
  motorType: string;
  batteryCapacity: string;
  batteryChemistry: string;
  thermalManagementSystem: string;
  drivetrainId: number | "";
  powerPs: string;
  torqueNm: string;
  claimedRange: string;
  realWorldRange: string;
  testCycleType: TestCycleType | "";
  topSpeedKmph: string;
  topSpeedTimeSec: string;
  acChargingOutput: string;
  acChargingTime: string;
  chargerSizeAc3kwHours: string;
  chargerSizeAc7kwHours: string;
  chargerSizeAc11kwHours: string;
  chargerSizeAc22kwHours: string;
  dcChargingOutput: string;
  dcFastChargingTime: string;
  powertrainBootspace: string;
  batteryWarrantyKm: string;
  batteryWarrantyYears: string;
  motorWarrantyKm: string;
  motorWarrantyYears: string;
  standardWarrantyKm: string;
  standardWarrantyYears: string;
  realWorldUrl: string;
  cityUrl: string;
  highwayUrl: string;
  isDefault: boolean;
}

function buildInitialState(p?: PowertrainElectricRecord | null): FormState {
  return {
    variantId: p?.variantId ?? "",
    numMotors: p?.numMotors != null ? String(p.numMotors) : "",
    motorType: p?.motorType ?? "",
    batteryCapacity: p?.batteryCapacity ?? "",
    batteryChemistry: p?.batteryChemistry ?? "",
    thermalManagementSystem: p?.thermalManagementSystem ?? "",
    drivetrainId: p?.drivetrainId ?? "",
    powerPs: p?.powerPs != null ? String(p.powerPs) : "",
    torqueNm: p?.torqueNm != null ? String(p.torqueNm) : "",
    claimedRange: p?.claimedRange != null ? String(p.claimedRange) : "",
    realWorldRange: p?.realWorldRange != null ? String(p.realWorldRange) : "",
    testCycleType: p?.testCycleType ?? "",
    topSpeedKmph: p?.topSpeedKmph != null ? String(p.topSpeedKmph) : "",
    topSpeedTimeSec: p?.topSpeedTimeSec ?? "",
    acChargingOutput: p?.acChargingOutput ?? "",
    acChargingTime: p?.acChargingTime ?? "",
    chargerSizeAc3kwHours: p?.chargerSizeAc3kwHours != null ? String(p.chargerSizeAc3kwHours) : "",
    chargerSizeAc7kwHours: p?.chargerSizeAc7kwHours != null ? String(p.chargerSizeAc7kwHours) : "",
    chargerSizeAc11kwHours: p?.chargerSizeAc11kwHours != null ? String(p.chargerSizeAc11kwHours) : "",
    chargerSizeAc22kwHours: p?.chargerSizeAc22kwHours != null ? String(p.chargerSizeAc22kwHours) : "",
    dcChargingOutput: p?.dcChargingOutput ?? "",
    dcFastChargingTime: p?.dcFastChargingTime ?? "",
    powertrainBootspace: p?.powertrainBootspace != null ? String(p.powertrainBootspace) : "",
    batteryWarrantyKm: p?.batteryWarrantyKm != null ? String(p.batteryWarrantyKm) : "",
    batteryWarrantyYears: p?.batteryWarrantyYears != null ? String(p.batteryWarrantyYears) : "",
    motorWarrantyKm: p?.motorWarrantyKm != null ? String(p.motorWarrantyKm) : "",
    motorWarrantyYears: p?.motorWarrantyYears != null ? String(p.motorWarrantyYears) : "",
    standardWarrantyKm: p?.standardWarrantyKm ?? "",
    standardWarrantyYears: p?.standardWarrantyYears != null ? String(p.standardWarrantyYears) : "",
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

export default function PowertrainElectricModal({
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

  const { data: powertrain, isFetching: loadingPowertrain } = useGetPowertrainElectricByIdQuery(editId ?? 0, {
    skip: editId == null,
  });

  const { data: brands = [] } = useGetBrandOptionsQuery();

  const { data: attributeOptionsGrouped } = useGetAttributeOptionsGroupedQuery();
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

  const [createPowertrainElectric, { isLoading: creating }] = useCreatePowertrainElectricMutation();
  const [updatePowertrainElectric, { isLoading: updating }] = useUpdatePowertrainElectricMutation();
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
    if (form.batteryCapacity === "" || Number(form.batteryCapacity) <= 0)
      next.batteryCapacity = "Battery capacity is required.";
    if (!form.drivetrainId) next.drivetrainId = "Drivetrain is required.";
    if (form.powerPs === "" || Number(form.powerPs) <= 0) next.powerPs = "Power (PS) is required.";
    if (form.torqueNm === "" || Number(form.torqueNm) <= 0) next.torqueNm = "Torque (Nm) is required.";
    if (form.claimedRange === "" || Number(form.claimedRange) <= 0) next.claimedRange = "Claimed range is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    const payload = {
      variantId: Number(form.variantId),
      numMotors: numOrNull(form.numMotors),
      motorType: strOrNull(form.motorType),
      batteryCapacity: numOrNull(form.batteryCapacity),
      batteryChemistry: strOrNull(form.batteryChemistry),
      thermalManagementSystem: strOrNull(form.thermalManagementSystem),
      drivetrainId: form.drivetrainId === "" ? null : Number(form.drivetrainId),
      powerPs: numOrNull(form.powerPs),
      torqueNm: numOrNull(form.torqueNm),
      claimedRange: numOrNull(form.claimedRange),
      realWorldRange: numOrNull(form.realWorldRange),
      testCycleType: form.testCycleType || null,
      topSpeedKmph: numOrNull(form.topSpeedKmph),
      topSpeedTimeSec: numOrNull(form.topSpeedTimeSec),
      acChargingOutput: numOrNull(form.acChargingOutput),
      acChargingTime: numOrNull(form.acChargingTime),
      chargerSizeAc3kwHours: numOrNull(form.chargerSizeAc3kwHours),
      chargerSizeAc7kwHours: numOrNull(form.chargerSizeAc7kwHours),
      chargerSizeAc11kwHours: numOrNull(form.chargerSizeAc11kwHours),
      chargerSizeAc22kwHours: numOrNull(form.chargerSizeAc22kwHours),
      dcChargingOutput: numOrNull(form.dcChargingOutput),
      dcFastChargingTime: strOrNull(form.dcFastChargingTime),
      powertrainBootspace: numOrNull(form.powertrainBootspace),
      batteryWarrantyKm: numOrNull(form.batteryWarrantyKm),
      batteryWarrantyYears: numOrNull(form.batteryWarrantyYears),
      motorWarrantyKm: numOrNull(form.motorWarrantyKm),
      motorWarrantyYears: numOrNull(form.motorWarrantyYears),
      standardWarrantyKm: strOrNull(form.standardWarrantyKm),
      standardWarrantyYears: numOrNull(form.standardWarrantyYears),
      realWorldUrl: strOrNull(form.realWorldUrl),
      cityUrl: strOrNull(form.cityUrl),
      highwayUrl: strOrNull(form.highwayUrl),
      isDefault: form.isDefault,
    };

    try {
      if (isEditMode && powertrain) {
        await updatePowertrainElectric({ id: powertrain.id, input: payload }).unwrap();
      } else {
        await createPowertrainElectric(payload).unwrap();
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
              {isEditMode ? "Edit Electric powertrain" : "Add Electric powertrain"}
            </h2>
            <p className="text-[#a39e96] text-xs mt-1">
              {isEditMode
                ? `Update spec details for "${powertrain?.variant.variantName}"`
                : "Variant, battery capacity, drivetrain, power, torque and claimed range are required — everything else can be filled in later."}
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
            <Field label="Drivetrain" error={errors.drivetrainId}>
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
          </Section>

          <Section title="Motor & battery">
            <Field label="Number of motors">
              <input type="number" min={0} value={form.numMotors} onChange={(e) => set("numMotors", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Motor type">
              <input type="text" value={form.motorType} onChange={(e) => set("motorType", e.target.value)} placeholder="e.g. PMSM" className={inputClass} />
            </Field>
            <Field label="Battery capacity (kWh)" error={errors.batteryCapacity}>
              <input type="number" min={0} step="0.1" value={form.batteryCapacity} onChange={(e) => set("batteryCapacity", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Battery chemistry">
              <input type="text" value={form.batteryChemistry} onChange={(e) => set("batteryChemistry", e.target.value)} placeholder="e.g. LFP, NMC" className={inputClass} />
            </Field>
            <Field label="Thermal management system">
              <input type="text" value={form.thermalManagementSystem} onChange={(e) => set("thermalManagementSystem", e.target.value)} placeholder="e.g. Liquid cooled" className={inputClass} />
            </Field>
            <Field label="Bootspace (L)">
              <input type="number" min={0} value={form.powertrainBootspace} onChange={(e) => set("powertrainBootspace", e.target.value)} className={inputClass} />
            </Field>
          </Section>

          <Section title="Power, range & performance">
            <Field label="Power (PS)" error={errors.powerPs}>
              <input type="number" min={0} value={form.powerPs} onChange={(e) => set("powerPs", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Torque (Nm)" error={errors.torqueNm}>
              <input type="number" min={0} value={form.torqueNm} onChange={(e) => set("torqueNm", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Claimed range (km)" error={errors.claimedRange}>
              <input type="number" min={0} value={form.claimedRange} onChange={(e) => set("claimedRange", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Real world range (km)">
              <input type="number" min={0} value={form.realWorldRange} onChange={(e) => set("realWorldRange", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Test cycle type">
              <select value={form.testCycleType} onChange={(e) => set("testCycleType", e.target.value ? (Number(e.target.value) as TestCycleType) : "")} className={selectClass}>
                <option value="">Not set</option>
                {TEST_CYCLE_TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Top speed (km/h)">
              <input type="number" min={0} value={form.topSpeedKmph} onChange={(e) => set("topSpeedKmph", e.target.value)} className={inputClass} />
            </Field>
            <Field label="0-100 time (sec)">
              <input type="number" min={0} step="0.1" value={form.topSpeedTimeSec} onChange={(e) => set("topSpeedTimeSec", e.target.value)} className={inputClass} />
            </Field>
          </Section>

          <Section title="Charging">
            <Field label="AC charging output (kW)">
              <input type="number" min={0} step="0.1" value={form.acChargingOutput} onChange={(e) => set("acChargingOutput", e.target.value)} className={inputClass} />
            </Field>
            <Field label="AC charging time (hrs)">
              <input type="number" min={0} step="0.1" value={form.acChargingTime} onChange={(e) => set("acChargingTime", e.target.value)} className={inputClass} />
            </Field>
            <Field label="3 kW charger time (hrs)">
              <input type="number" min={0} value={form.chargerSizeAc3kwHours} onChange={(e) => set("chargerSizeAc3kwHours", e.target.value)} className={inputClass} />
            </Field>
            <Field label="7 kW charger time (hrs)">
              <input type="number" min={0} value={form.chargerSizeAc7kwHours} onChange={(e) => set("chargerSizeAc7kwHours", e.target.value)} className={inputClass} />
            </Field>
            <Field label="11 kW charger time (hrs)">
              <input type="number" min={0} value={form.chargerSizeAc11kwHours} onChange={(e) => set("chargerSizeAc11kwHours", e.target.value)} className={inputClass} />
            </Field>
            <Field label="22 kW charger time (hrs)">
              <input type="number" min={0} value={form.chargerSizeAc22kwHours} onChange={(e) => set("chargerSizeAc22kwHours", e.target.value)} className={inputClass} />
            </Field>
            <Field label="DC charging output (kW)">
              <input type="number" min={0} step="0.1" value={form.dcChargingOutput} onChange={(e) => set("dcChargingOutput", e.target.value)} className={inputClass} />
            </Field>
            <Field label="DC fast charging time">
              <input type="text" value={form.dcFastChargingTime} onChange={(e) => set("dcFastChargingTime", e.target.value)} placeholder="e.g. 10-80% in 30 min" className={inputClass} />
            </Field>
          </Section>

          <Section title="Warranty">
            <Field label="Battery warranty (km)">
              <input type="number" min={0} value={form.batteryWarrantyKm} onChange={(e) => set("batteryWarrantyKm", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Battery warranty (years)">
              <input type="number" min={0} value={form.batteryWarrantyYears} onChange={(e) => set("batteryWarrantyYears", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Motor warranty (km)">
              <input type="number" min={0} value={form.motorWarrantyKm} onChange={(e) => set("motorWarrantyKm", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Motor warranty (years)">
              <input type="number" min={0} value={form.motorWarrantyYears} onChange={(e) => set("motorWarrantyYears", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Standard warranty (km)">
              <input type="text" value={form.standardWarrantyKm} onChange={(e) => set("standardWarrantyKm", e.target.value)} placeholder="e.g. Unlimited" className={inputClass} />
            </Field>
            <Field label="Standard warranty (years)">
              <input type="number" min={0} value={form.standardWarrantyYears} onChange={(e) => set("standardWarrantyYears", e.target.value)} className={inputClass} />
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
              Set as default Electric powertrain for this variant
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