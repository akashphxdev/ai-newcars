// src/pages/newCars/Features/FeatureModal.tsx
import { useState } from "react";
import { useCreateFeatureMutation, useUpdateFeatureMutation, type FeatureRecord } from "./feature.api";
import { useGetVariantsQuery } from "../Variants/variant.api";
import { extractApiError } from "../../../lib/apiClient";

const ACCENT = "#D4300F";

interface FieldErrors {
  variantId?: string;
}

// All spec fields are stored as plain strings/booleans in local state
// (mirrors input value directly) and converted to number | null on
// submit — this is a "form data bag", not the raw payload shape. Only
// variantId is validated as truly required; everything else is
// optional spec data filled in progressively — same convention as
// PowertrainIceModal.
interface FormState {
  variantId: number | "";
  airbagsCount: string;
  absWithEbd: boolean;
  esc: boolean;
  hillAssist: boolean;
  rearParkingCamera: boolean;
  frontParkingSensors: boolean;
  tpms: boolean;
  isofixMounts: boolean;
  ncapRating: string;
  sunroof: boolean;
  keylessEntry: boolean;
  pushButtonStart: boolean;
  cruiseControl: boolean;
  climateControl: boolean;
  rearAcVents: boolean;
  autoDimmingMirror: boolean;
  powerWindows: boolean;
  upholsteryType: string;
  adjustableSeats: boolean;
  ventilatedSeats: boolean;
  rearArmrest: boolean;
  ledHeadlamps: boolean;
  ledDrls: boolean;
  alloyWheels: boolean;
  roofRails: boolean;
  fogLamps: boolean;
  touchscreenSizeInch: string;
  androidAuto: boolean;
  appleCarplay: boolean;
  connectedCarTech: boolean;
  numberOfSpeakers: string;
  wirelessCharging: boolean;
  extraFeatures: string;
}

function buildInitialState(f?: FeatureRecord | null): FormState {
  return {
    variantId: f?.variantId ?? "",
    airbagsCount: f?.airbagsCount != null ? String(f.airbagsCount) : "",
    absWithEbd: f?.absWithEbd ?? false,
    esc: f?.esc ?? false,
    hillAssist: f?.hillAssist ?? false,
    rearParkingCamera: f?.rearParkingCamera ?? false,
    frontParkingSensors: f?.frontParkingSensors ?? false,
    tpms: f?.tpms ?? false,
    isofixMounts: f?.isofixMounts ?? false,
    ncapRating: f?.ncapRating ?? "",
    sunroof: f?.sunroof ?? false,
    keylessEntry: f?.keylessEntry ?? false,
    pushButtonStart: f?.pushButtonStart ?? false,
    cruiseControl: f?.cruiseControl ?? false,
    climateControl: f?.climateControl ?? false,
    rearAcVents: f?.rearAcVents ?? false,
    autoDimmingMirror: f?.autoDimmingMirror ?? false,
    powerWindows: f?.powerWindows ?? false,
    upholsteryType: f?.upholsteryType ?? "",
    adjustableSeats: f?.adjustableSeats ?? false,
    ventilatedSeats: f?.ventilatedSeats ?? false,
    rearArmrest: f?.rearArmrest ?? false,
    ledHeadlamps: f?.ledHeadlamps ?? false,
    ledDrls: f?.ledDrls ?? false,
    alloyWheels: f?.alloyWheels ?? false,
    roofRails: f?.roofRails ?? false,
    fogLamps: f?.fogLamps ?? false,
    touchscreenSizeInch: f?.touchscreenSizeInch ?? "",
    androidAuto: f?.androidAuto ?? false,
    appleCarplay: f?.appleCarplay ?? false,
    connectedCarTech: f?.connectedCarTech ?? false,
    numberOfSpeakers: f?.numberOfSpeakers != null ? String(f.numberOfSpeakers) : "",
    wirelessCharging: f?.wirelessCharging ?? false,
    extraFeatures: f?.extraFeatures ?? "",
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

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded accent-[#D4300F] cursor-pointer"
      />
      <span className="text-sm font-medium text-[#4a4640]">{label}</span>
    </label>
  );
}

const inputClass =
  "w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border border-[#e2ddd5] rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white";
const selectClass = "cursor-pointer " + inputClass;

export default function FeatureModal({
  open,
  onClose,
  feature,
}: {
  open: boolean;
  onClose: () => void;
  // Present -> edit mode. Absent/null -> create mode.
  feature?: FeatureRecord | null;
}) {
  const isEditMode = !!feature;

  // NOTE: same 100-row cap used elsewhere (Brand dropdown, PowertrainIce
  // variant select) — fine while the variants table stays under 100 rows.
  const { data: variantsData } = useGetVariantsQuery({ limit: 100, sortBy: "variantName", sortOrder: "asc" });
  const variants = variantsData?.data ?? [];

  const [form, setForm] = useState<FormState>(buildInitialState(feature));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");

  const [createFeature, { isLoading: creating }] = useCreateFeatureMutation();
  const [updateFeature, { isLoading: updating }] = useUpdateFeatureMutation();
  const saving = creating || updating;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  if (!open) return null;

  const handleClose = () => {
    setForm(buildInitialState(null));
    setErrors({});
    setServerError("");
    onClose();
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!form.variantId) next.variantId = "Variant is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    const payload = {
      variantId: Number(form.variantId),
      airbagsCount: numOrNull(form.airbagsCount),
      absWithEbd: form.absWithEbd,
      esc: form.esc,
      hillAssist: form.hillAssist,
      rearParkingCamera: form.rearParkingCamera,
      frontParkingSensors: form.frontParkingSensors,
      tpms: form.tpms,
      isofixMounts: form.isofixMounts,
      ncapRating: numOrNull(form.ncapRating),
      sunroof: form.sunroof,
      keylessEntry: form.keylessEntry,
      pushButtonStart: form.pushButtonStart,
      cruiseControl: form.cruiseControl,
      climateControl: form.climateControl,
      rearAcVents: form.rearAcVents,
      autoDimmingMirror: form.autoDimmingMirror,
      powerWindows: form.powerWindows,
      upholsteryType: strOrNull(form.upholsteryType),
      adjustableSeats: form.adjustableSeats,
      ventilatedSeats: form.ventilatedSeats,
      rearArmrest: form.rearArmrest,
      ledHeadlamps: form.ledHeadlamps,
      ledDrls: form.ledDrls,
      alloyWheels: form.alloyWheels,
      roofRails: form.roofRails,
      fogLamps: form.fogLamps,
      touchscreenSizeInch: numOrNull(form.touchscreenSizeInch),
      androidAuto: form.androidAuto,
      appleCarplay: form.appleCarplay,
      connectedCarTech: form.connectedCarTech,
      numberOfSpeakers: numOrNull(form.numberOfSpeakers),
      wirelessCharging: form.wirelessCharging,
      extraFeatures: strOrNull(form.extraFeatures),
    };

    try {
      if (isEditMode && feature) {
        await updateFeature({ id: feature.id, input: payload }).unwrap();
      } else {
        await createFeature(payload).unwrap();
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
              {isEditMode ? "Edit feature sheet" : "Add feature sheet"}
            </h2>
            <p className="text-[#a39e96] text-xs mt-1">
              {isEditMode
                ? `Update feature details for "${feature?.variant.variantName}"`
                : "Variant is required — every feature toggle can be filled in later."}
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
            <Field label="Variant" error={errors.variantId}>
              <select
                value={form.variantId}
                onChange={(e) => set("variantId", e.target.value ? Number(e.target.value) : "")}
                className={selectClass}
              >
                <option value="">Select a variant</option>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.model.brand.name} — {v.model.name} — {v.variantName}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="NCAP rating (0-5)">
              <input
                type="number"
                min={0}
                max={5}
                step="0.5"
                value={form.ncapRating}
                onChange={(e) => set("ncapRating", e.target.value)}
                className={inputClass}
              />
            </Field>
          </Section>

          <Section title="Safety">
            <Field label="Airbags count">
              <input type="number" min={0} value={form.airbagsCount} onChange={(e) => set("airbagsCount", e.target.value)} className={inputClass} />
            </Field>
            <div />
            <Toggle label="ABS with EBD" checked={form.absWithEbd} onChange={(v) => set("absWithEbd", v)} />
            <Toggle label="ESC" checked={form.esc} onChange={(v) => set("esc", v)} />
            <Toggle label="Hill assist" checked={form.hillAssist} onChange={(v) => set("hillAssist", v)} />
            <Toggle label="Rear parking camera" checked={form.rearParkingCamera} onChange={(v) => set("rearParkingCamera", v)} />
            <Toggle label="Front parking sensors" checked={form.frontParkingSensors} onChange={(v) => set("frontParkingSensors", v)} />
            <Toggle label="TPMS" checked={form.tpms} onChange={(v) => set("tpms", v)} />
            <Toggle label="ISOFIX mounts" checked={form.isofixMounts} onChange={(v) => set("isofixMounts", v)} />
          </Section>

          <Section title="Comfort & convenience">
            <Toggle label="Sunroof" checked={form.sunroof} onChange={(v) => set("sunroof", v)} />
            <Toggle label="Keyless entry" checked={form.keylessEntry} onChange={(v) => set("keylessEntry", v)} />
            <Toggle label="Push button start" checked={form.pushButtonStart} onChange={(v) => set("pushButtonStart", v)} />
            <Toggle label="Cruise control" checked={form.cruiseControl} onChange={(v) => set("cruiseControl", v)} />
            <Toggle label="Climate control" checked={form.climateControl} onChange={(v) => set("climateControl", v)} />
            <Toggle label="Rear AC vents" checked={form.rearAcVents} onChange={(v) => set("rearAcVents", v)} />
            <Toggle label="Auto-dimming mirror" checked={form.autoDimmingMirror} onChange={(v) => set("autoDimmingMirror", v)} />
            <Toggle label="Power windows" checked={form.powerWindows} onChange={(v) => set("powerWindows", v)} />
          </Section>

          <Section title="Seating">
            <Field label="Upholstery type">
              <input type="text" value={form.upholsteryType} onChange={(e) => set("upholsteryType", e.target.value)} placeholder="e.g. Leatherette, Fabric" className={inputClass} />
            </Field>
            <div />
            <Toggle label="Adjustable seats" checked={form.adjustableSeats} onChange={(v) => set("adjustableSeats", v)} />
            <Toggle label="Ventilated seats" checked={form.ventilatedSeats} onChange={(v) => set("ventilatedSeats", v)} />
            <Toggle label="Rear armrest" checked={form.rearArmrest} onChange={(v) => set("rearArmrest", v)} />
          </Section>

          <Section title="Exterior">
            <Toggle label="LED headlamps" checked={form.ledHeadlamps} onChange={(v) => set("ledHeadlamps", v)} />
            <Toggle label="LED DRLs" checked={form.ledDrls} onChange={(v) => set("ledDrls", v)} />
            <Toggle label="Alloy wheels" checked={form.alloyWheels} onChange={(v) => set("alloyWheels", v)} />
            <Toggle label="Roof rails" checked={form.roofRails} onChange={(v) => set("roofRails", v)} />
            <Toggle label="Fog lamps" checked={form.fogLamps} onChange={(v) => set("fogLamps", v)} />
          </Section>

          <Section title="Infotainment & tech">
            <Field label="Touchscreen size (inch)">
              <input type="number" min={0} step="0.1" value={form.touchscreenSizeInch} onChange={(e) => set("touchscreenSizeInch", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Number of speakers">
              <input type="number" min={0} value={form.numberOfSpeakers} onChange={(e) => set("numberOfSpeakers", e.target.value)} className={inputClass} />
            </Field>
            <Toggle label="Android Auto" checked={form.androidAuto} onChange={(v) => set("androidAuto", v)} />
            <Toggle label="Apple CarPlay" checked={form.appleCarplay} onChange={(v) => set("appleCarplay", v)} />
            <Toggle label="Connected car tech" checked={form.connectedCarTech} onChange={(v) => set("connectedCarTech", v)} />
            <Toggle label="Wireless charging" checked={form.wirelessCharging} onChange={(v) => set("wirelessCharging", v)} />
          </Section>

          <Section title="Extra">
            <div className="col-span-2">
              <Field label="Extra features (free text)">
                <textarea
                  value={form.extraFeatures}
                  onChange={(e) => set("extraFeatures", e.target.value)}
                  rows={3}
                  placeholder="Any additional features not covered above..."
                  className={inputClass}
                />
              </Field>
            </div>
          </Section>

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
                "Create feature sheet"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}