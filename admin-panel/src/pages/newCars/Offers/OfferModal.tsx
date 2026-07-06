// src/pages/newCars/Offers/OfferModal.tsx
import { useRef, useState } from "react";
import {
  useCreateOfferMutation,
  useUpdateOfferMutation,
  OFFER_TYPES,
  type OfferRecord,
  type OfferTypeValue,
} from "./offer.api";
import { useGetCarModelsQuery } from "../carModels/carModel.api";
import { useGetVariantsQuery } from "../Variants/variant.api";
import { useGetCitiesQuery } from "../../Locations/Cities/city.api";
import { extractApiError } from "../../../lib/apiClient";

const ACCENT = "#D4300F";

const OFFER_TYPE_LABELS: Record<OfferTypeValue, string> = {
  cash_discount: "Cash discount",
  exchange_bonus: "Exchange bonus",
  corporate_discount: "Corporate discount",
  loyalty_bonus: "Loyalty bonus",
  finance_offer: "Finance offer",
  other: "Other",
};

// modelId and isActive are the only truly required fields — variant,
// city, offerType, amount, description and dates are all optional,
// mirroring the schema's own nullable columns.
interface FieldErrors {
  modelId?: string;
  offerAmount?: string;
  validUntil?: string;
}

function Field({ label, children, optional }: { label: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1.5">
        {label} {optional && <span className="normal-case font-medium text-[#c0bab0]">(optional)</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white";
const selectClass =
  "cursor-pointer w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white";

// Prisma dates arrive as full ISO strings — <input type="date"> needs
// just the yyyy-mm-dd portion.
function toDateInputValue(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

export default function OfferModal({
  open,
  onClose,
  offer,
}: {
  open: boolean;
  onClose: () => void;
  // Present -> edit mode. Absent/null -> create mode.
  offer?: OfferRecord | null;
}) {
  const isEditMode = !!offer;

  // NOTE: same 100-row cap used elsewhere (Brand dropdown, Country
  // dropdown, Variant modal).
  const { data: carModelsData } = useGetCarModelsQuery({ limit: 100, sortBy: "name", sortOrder: "asc" });
  const carModels = carModelsData?.data ?? [];
  const { data: citiesData } = useGetCitiesQuery({ limit: 100, sortBy: "name", sortOrder: "asc" });
  const cities = citiesData?.data ?? [];

  const [modelId, setModelId] = useState<number | "">(offer?.modelId ?? "");
  // Variant list is scoped to the chosen model — skip the query until a
  // model is picked, and re-fetch whenever modelId changes.
  const { data: variantsData } = useGetVariantsQuery(
    modelId ? { modelId: Number(modelId), limit: 100, sortBy: "variantName", sortOrder: "asc" } : undefined,
    { skip: !modelId },
  );
  const variants = variantsData?.data ?? [];

  const [variantId, setVariantId] = useState<number | "">(offer?.variantId ?? "");
  const [cityId, setCityId] = useState<number | "">(offer?.cityId ?? "");
  const [offerType, setOfferType] = useState<OfferTypeValue | "">(
    (offer?.offerType as OfferTypeValue) ?? "",
  );
  const [offerAmount, setOfferAmount] = useState(offer?.offerAmount ?? "");
  const [description, setDescription] = useState(offer?.description ?? "");
  const [validFrom, setValidFrom] = useState(toDateInputValue(offer?.validFrom ?? null));
  const [validUntil, setValidUntil] = useState(toDateInputValue(offer?.validUntil ?? null));
  // No default — isActive must be an explicit, deliberate choice on
  // every save (same "all fields mandatory" rule used elsewhere).
  const [isActive, setIsActive] = useState<boolean>(offer?.isActive ?? true);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const descRef = useRef<HTMLTextAreaElement>(null);

  const [createOffer, { isLoading: creating }] = useCreateOfferMutation();
  const [updateOffer, { isLoading: updating }] = useUpdateOfferMutation();
  const saving = creating || updating;

  const resetForm = () => {
    setModelId("");
    setVariantId("");
    setCityId("");
    setOfferType("");
    setOfferAmount("");
    setDescription("");
    setValidFrom("");
    setValidUntil("");
    setIsActive(true);
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
    if (!modelId) next.modelId = "Car model is required.";
    if (offerAmount !== "" && Number(offerAmount) <= 0) {
      next.offerAmount = "Offer amount must be greater than 0.";
    }
    if (validFrom && validUntil && validFrom > validUntil) {
      next.validUntil = "Valid until must be on or after valid from.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    // validate() above already guarantees modelId is set — the cast here
    // just satisfies TypeScript.
    const payload = {
      modelId: Number(modelId),
      variantId: variantId ? Number(variantId) : null,
      cityId: cityId ? Number(cityId) : null,
      offerType: offerType || null,
      offerAmount: offerAmount === "" ? null : Number(offerAmount),
      description: description.trim() || null,
      validFrom: validFrom || null,
      validUntil: validUntil || null,
      isActive,
    };

    try {
      if (isEditMode && offer) {
        await updateOffer({ id: offer.id, input: payload }).unwrap();
      } else {
        await createOffer(payload).unwrap();
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
      <div className="w-full max-w-[600px] bg-white border border-[#e8e4dc] rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h2 className="text-[#1c1a17] text-lg font-black">
              {isEditMode ? "Edit offer" : "Add offer"}
            </h2>
            <p className="text-[#a39e96] text-xs mt-1">
              {isEditMode ? "Update this offer's details" : "Car model is required; the rest are optional."}
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
          <Field label="Car model">
            <select
              value={modelId}
              onChange={(e) => {
                setModelId(e.target.value ? Number(e.target.value) : "");
                // Changing the model invalidates any previously chosen
                // variant, since variants are scoped to a single model.
                setVariantId("");
              }}
              className={selectClass}
              style={{ borderColor: errors.modelId ? "#f0997b" : "#e2ddd5" }}
            >
              <option value="">Select a car model</option>
              {carModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.brand.name} — {m.name}
                </option>
              ))}
            </select>
            {errors.modelId && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.modelId}</p>}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Variant" optional>
              <select
                value={variantId}
                onChange={(e) => setVariantId(e.target.value ? Number(e.target.value) : "")}
                disabled={!modelId}
                className={`${selectClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{ borderColor: "#e2ddd5" }}
              >
                <option value="">All variants</option>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.variantName}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="City" optional>
              <select
                value={cityId}
                onChange={(e) => setCityId(e.target.value ? Number(e.target.value) : "")}
                className={selectClass}
                style={{ borderColor: "#e2ddd5" }}
              >
                <option value="">All cities</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Offer type" optional>
              <select
                value={offerType}
                onChange={(e) => setOfferType((e.target.value as OfferTypeValue) || "")}
                className={selectClass}
                style={{ borderColor: "#e2ddd5" }}
              >
                <option value="">Select type</option>
                {OFFER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {OFFER_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Offer amount (₹)" optional>
              <input
                type="number"
                min={0}
                step="500"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                placeholder="e.g. 25000"
                className={inputClass}
                style={{
                  borderColor: errors.offerAmount ? "#f0997b" : "#e2ddd5",
                  boxShadow: errors.offerAmount ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
                }}
              />
              {errors.offerAmount && (
                <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.offerAmount}</p>
              )}
            </Field>
          </div>

          <Field label="Description" optional>
            <textarea
              ref={descRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Flat cash discount on all variants"
              rows={3}
              maxLength={255}
              className={`${inputClass} resize-none`}
              style={{ borderColor: "#e2ddd5" }}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Valid from" optional>
              <input
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className={inputClass}
                style={{ borderColor: "#e2ddd5" }}
              />
            </Field>

            <Field label="Valid until" optional>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className={inputClass}
                style={{
                  borderColor: errors.validUntil ? "#f0997b" : "#e2ddd5",
                  boxShadow: errors.validUntil ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
                }}
              />
              {errors.validUntil && (
                <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.validUntil}</p>
              )}
            </Field>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded accent-[#D4300F] cursor-pointer"
            />
            <span className="text-sm font-medium text-[#4a4640]">Active</span>
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
                "Create offer"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}