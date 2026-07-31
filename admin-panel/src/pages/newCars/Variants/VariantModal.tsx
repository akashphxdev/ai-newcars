// src/pages/newCars/Variants/VariantModal.tsx
import { useRef, useState } from "react";
import {
  useCreateVariantMutation,
  useUpdateVariantMutation,
  type VariantRecord,
} from "./variant.api";
import { useGetCarModelOptionsQuery } from "../carModels/carModel.api";
import { useGetBrandOptionsQuery } from "../Brands/brand.api";
import { useGetAttributeOptionsGroupedQuery } from "../AttributeOptions/attributeOption.api";
import { extractApiError } from "../../../lib/apiClient";

const ACCENT = "#D4300F";

// The core fields (brand/model/name/price/seats/transmission) are
// required on both Add and Edit, per explicit product requirement.
// Dimension/chassis fields are optional, filled in progressively.
interface FieldErrors {
  brandId?: string;
  modelId?: string;
  variantName?: string;
  price?: string;
  seatingCapacity?: string;
  transmissionId?: string;
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

function numOrNull(value: string): number | null {
  return value === "" ? null : Number(value);
}

function strOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

const inputClass =
  "w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white";

export default function VariantModal({
  open,
  onClose,
  variant,
}: {
  open: boolean;
  onClose: () => void;
  // Present -> edit mode. Absent/null -> create mode.
  variant?: VariantRecord | null;
}) {
  const isEditMode = !!variant;

  const { data: brands = [] } = useGetBrandOptionsQuery();

  // Transmission is now a dynamic lookup (category "transmission" in
  // attribute_options) instead of a hardcoded enum.
  const { data: attributeOptionsGrouped } = useGetAttributeOptionsGroupedQuery();
  const transmissions = attributeOptionsGrouped?.transmission ?? [];

  const [brandId, setBrandId] = useState<number | "">(variant?.model.brand.id ?? "");
  // Scoped server-side to the chosen brand — options-endpoint, no row cap.
  const { data: modelsForBrand = [] } = useGetCarModelOptionsQuery(
    brandId ? { brandId: Number(brandId) } : undefined,
    { skip: !brandId },
  );

  const [modelId, setModelId] = useState<number | "">(variant?.modelId ?? "");
  const [variantName, setVariantName] = useState(variant ? variant.variantName : "");
  const [price, setPrice] = useState(variant ? variant.price : "");
  const [seatingCapacity, setSeatingCapacity] = useState(
    variant ? String(variant.seatingCapacity) : "",
  );
  const [transmissionId, setTransmissionId] = useState<number | "">(
    variant?.transmissionId ?? "",
  );
  // No default — isTopSeller must be an explicit, deliberate choice on
  // every save (same "all fields mandatory" rule as everything else here).
  const [isTopSeller, setIsTopSeller] = useState<boolean>(variant?.isTopSeller ?? false);

  // Chassis/dimension fields — all optional, filled in progressively.
  const [length, setLength] = useState(variant?.length != null ? String(variant.length) : "");
  const [width, setWidth] = useState(variant?.width != null ? String(variant.width) : "");
  const [height, setHeight] = useState(variant?.height != null ? String(variant.height) : "");
  const [wheelBase, setWheelBase] = useState(variant?.wheelBase != null ? String(variant.wheelBase) : "");
  const [groundClearance, setGroundClearance] = useState(
    variant?.groundClearance != null ? String(variant.groundClearance) : "",
  );
  const [bootSpace, setBootSpace] = useState(variant?.bootSpace != null ? String(variant.bootSpace) : "");
  const [frontSuspension, setFrontSuspension] = useState(variant?.frontSuspension ?? "");
  const [rearSuspension, setRearSuspension] = useState(variant?.rearSuspension ?? "");
  const [steeringType, setSteeringType] = useState(variant?.steeringType ?? "");
  const [frontBrakeType, setFrontBrakeType] = useState(variant?.frontBrakeType ?? "");
  const [rearBrakeType, setRearBrakeType] = useState(variant?.rearBrakeType ?? "");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const [createVariant, { isLoading: creating }] = useCreateVariantMutation();
  const [updateVariant, { isLoading: updating }] = useUpdateVariantMutation();
  const saving = creating || updating;

  const resetForm = () => {
    setBrandId("");
    setModelId("");
    setVariantName("");
    setPrice("");
    setSeatingCapacity("");
    setTransmissionId("");
    setIsTopSeller(false);
    setLength("");
    setWidth("");
    setHeight("");
    setWheelBase("");
    setGroundClearance("");
    setBootSpace("");
    setFrontSuspension("");
    setRearSuspension("");
    setSteeringType("");
    setFrontBrakeType("");
    setRearBrakeType("");
    setErrors({});
    setServerError("");
  };

  if (!open) return null;

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!brandId) next.brandId = "Brand is required.";
    if (!modelId) next.modelId = "Car model is required.";
    if (variantName.trim().length < 2) next.variantName = "Variant name must be at least 2 characters.";
    if (price === "" || Number(price) <= 0) next.price = "Price is required and must be greater than 0.";
    if (
      seatingCapacity === "" ||
      !Number.isInteger(Number(seatingCapacity)) ||
      Number(seatingCapacity) < 2 ||
      Number(seatingCapacity) > 15
    ) {
      next.seatingCapacity = "Seating capacity is required (2–15).";
    }
    if (!transmissionId) next.transmissionId = "Transmission is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    // validate() above already guarantees modelId/transmissionId are set —
    // the Number(...) casts here just satisfy TypeScript.
    const payload = {
      modelId: Number(modelId),
      variantName: variantName.trim(),
      price: Number(price),
      seatingCapacity: Number(seatingCapacity),
      transmissionId: Number(transmissionId),
      isTopSeller,
      length: numOrNull(length),
      width: numOrNull(width),
      height: numOrNull(height),
      wheelBase: numOrNull(wheelBase),
      groundClearance: numOrNull(groundClearance),
      bootSpace: numOrNull(bootSpace),
      frontSuspension: strOrNull(frontSuspension),
      rearSuspension: strOrNull(rearSuspension),
      steeringType: strOrNull(steeringType),
      frontBrakeType: strOrNull(frontBrakeType),
      rearBrakeType: strOrNull(rearBrakeType),
    };

    try {
      if (isEditMode && variant) {
        await updateVariant({ id: variant.id, input: payload }).unwrap();
      } else {
        await createVariant(payload).unwrap();
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
              {isEditMode ? "Edit variant" : "Add variant"}
            </h2>
            <p className="text-[#a39e96] text-xs mt-1">
              {isEditMode
                ? `Update details for ${variant?.variantName}`
                : "Brand, model, name, price, seating and transmission are required — dimensions can be filled in later."}
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
          <Field label="Brand">
            <select
              value={brandId}
              onChange={(e) => {
                const next = e.target.value ? Number(e.target.value) : "";
                setBrandId(next);
                setModelId("");
              }}
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

          <Field label="Car model">
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value ? Number(e.target.value) : "")}
              disabled={!brandId}
              className="cursor-pointer w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderColor: errors.modelId ? "#f0997b" : "#e2ddd5" }}
            >
              <option value="">{brandId ? "Select a car model" : "Select a brand first"}</option>
              {modelsForBrand.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            {errors.modelId && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.modelId}</p>}
          </Field>

          <Field label="Variant name">
            <input
              ref={nameRef}
              type="text"
              value={variantName}
              onChange={(e) => setVariantName(e.target.value)}
              placeholder="e.g. SX(O) Turbo DCT"
              className={inputClass}
              style={{
                borderColor: errors.variantName ? "#f0997b" : "#e2ddd5",
                boxShadow: errors.variantName ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
              }}
            />
            {errors.variantName && (
              <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.variantName}</p>
            )}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (₹)">
              <input
                type="number"
                min={0}
                step="1000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 1299000"
                className={inputClass}
                style={{
                  borderColor: errors.price ? "#f0997b" : "#e2ddd5",
                  boxShadow: errors.price ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
                }}
              />
              {errors.price && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.price}</p>}
            </Field>

            <Field label="Seating capacity">
              <input
                type="number"
                min={2}
                max={15}
                step="1"
                value={seatingCapacity}
                onChange={(e) => setSeatingCapacity(e.target.value)}
                placeholder="e.g. 5"
                className={inputClass}
                style={{
                  borderColor: errors.seatingCapacity ? "#f0997b" : "#e2ddd5",
                  boxShadow: errors.seatingCapacity ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
                }}
              />
              {errors.seatingCapacity && (
                <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.seatingCapacity}</p>
              )}
            </Field>
          </div>

          <Field label="Transmission">
            <select
              value={transmissionId}
              onChange={(e) => setTransmissionId(e.target.value ? Number(e.target.value) : "")}
              className="cursor-pointer w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
              style={{ borderColor: errors.transmissionId ? "#f0997b" : "#e2ddd5" }}
            >
              <option value="">Select transmission</option>
              {transmissions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {errors.transmissionId && (
              <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.transmissionId}</p>
            )}
          </Field>

          <Section title="Dimensions & chassis">
            <Field label="Length (mm)">
              <input type="number" min={0} value={length} onChange={(e) => setLength(e.target.value)} className={inputClass} style={{ borderColor: "#e2ddd5" }} />
            </Field>
            <Field label="Width (mm)">
              <input type="number" min={0} value={width} onChange={(e) => setWidth(e.target.value)} className={inputClass} style={{ borderColor: "#e2ddd5" }} />
            </Field>
            <Field label="Height (mm)">
              <input type="number" min={0} value={height} onChange={(e) => setHeight(e.target.value)} className={inputClass} style={{ borderColor: "#e2ddd5" }} />
            </Field>
            <Field label="Wheelbase (mm)">
              <input type="number" min={0} value={wheelBase} onChange={(e) => setWheelBase(e.target.value)} className={inputClass} style={{ borderColor: "#e2ddd5" }} />
            </Field>
            <Field label="Ground clearance (mm)">
              <input type="number" min={0} value={groundClearance} onChange={(e) => setGroundClearance(e.target.value)} className={inputClass} style={{ borderColor: "#e2ddd5" }} />
            </Field>
            <Field label="Boot space (litres)">
              <input type="number" min={0} value={bootSpace} onChange={(e) => setBootSpace(e.target.value)} className={inputClass} style={{ borderColor: "#e2ddd5" }} />
            </Field>
            <Field label="Front suspension">
              <input type="text" value={frontSuspension} onChange={(e) => setFrontSuspension(e.target.value)} placeholder="e.g. MacPherson strut" className={inputClass} style={{ borderColor: "#e2ddd5" }} />
            </Field>
            <Field label="Rear suspension">
              <input type="text" value={rearSuspension} onChange={(e) => setRearSuspension(e.target.value)} placeholder="e.g. Torsion beam" className={inputClass} style={{ borderColor: "#e2ddd5" }} />
            </Field>
            <Field label="Steering type">
              <input type="text" value={steeringType} onChange={(e) => setSteeringType(e.target.value)} placeholder="e.g. Electric power steering" className={inputClass} style={{ borderColor: "#e2ddd5" }} />
            </Field>
            <Field label="Front brake type">
              <input type="text" value={frontBrakeType} onChange={(e) => setFrontBrakeType(e.target.value)} placeholder="e.g. Disc" className={inputClass} style={{ borderColor: "#e2ddd5" }} />
            </Field>
            <Field label="Rear brake type">
              <input type="text" value={rearBrakeType} onChange={(e) => setRearBrakeType(e.target.value)} placeholder="e.g. Drum" className={inputClass} style={{ borderColor: "#e2ddd5" }} />
            </Field>
          </Section>

          <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={isTopSeller}
              onChange={(e) => setIsTopSeller(e.target.checked)}
              className="w-4 h-4 rounded accent-[#D4300F] cursor-pointer"
            />
            <span className="text-sm font-medium text-[#4a4640]">Mark as top seller</span>
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
                "Create variant"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}