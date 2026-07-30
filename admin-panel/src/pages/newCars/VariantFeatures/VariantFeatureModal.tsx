// src/pages/newCars/VariantFeatures/VariantFeatureModal.tsx
import { useState } from "react";
import { useGetBrandOptionsQuery } from "../Brands/brand.api";
import { useGetCarModelOptionsQuery } from "../carModels/carModel.api";
import { useGetVariantOptionsQuery } from "../Variants/variant.api";
import VariantFeatureChecklist from "./VariantFeatureChecklist";
import { FilterSelect } from "../../../components/common/SearchFilterBar";

// Same modal handles both flows:
// - Add: `variant` omitted — brand/model/variant picker, then checklist.
// - Edit: `variant` provided (from a listing row's "Edit" button) — picker
//   is skipped entirely, checklist opens straight for that variant.
export default function VariantFeatureModal({
  open,
  onClose,
  variant,
}: {
  open: boolean;
  onClose: () => void;
  variant?: { id: number; label: string } | null;
}) {
  const isEditMode = !!variant;

  const [brandId, setBrandId] = useState<number | "">("");
  const [modelId, setModelId] = useState<number | "">("");
  const [pickedVariantId, setPickedVariantId] = useState<number | "">("");

  const { data: brands = [] } = useGetBrandOptionsQuery(undefined, { skip: isEditMode });
  const { data: models = [] } = useGetCarModelOptionsQuery(
    brandId ? { brandId: Number(brandId) } : undefined,
    { skip: isEditMode || !brandId },
  );
  const { data: variants = [] } = useGetVariantOptionsQuery(
    modelId ? { modelId: Number(modelId) } : undefined,
    { skip: isEditMode || !modelId },
  );

  const activeVariantId = isEditMode ? variant!.id : pickedVariantId;
  const activeVariantLabel = isEditMode
    ? variant!.label
    : variants.find((v) => v.id === pickedVariantId)?.variantName;

  if (!open) return null;

  const handleClose = () => {
    setBrandId("");
    setModelId("");
    setPickedVariantId("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="w-full max-w-[600px] bg-white border border-[#e8e4dc] rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-1">
          <div>
            <h2 className="text-[#1c1a17] text-lg font-black">
              {isEditMode ? "Edit variant features" : "Add feature to a variant"}
            </h2>
            <p className="text-[#a39e96] text-xs mt-1">
              {isEditMode
                ? "Tick or untick which features this variant has."
                : "Pick a brand, model and variant, then tick its features."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="cursor-pointer text-[#c0bab0] hover:text-[#1c1a17] transition-colors shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-6 pb-6 pt-4 space-y-4">
          {!isEditMode && (
            <div className="flex items-center gap-2 flex-wrap bg-[#f7f5f1] rounded-xl p-3">
              <FilterSelect
                value={brandId}
                onChange={(v) => {
                  const next = v ? Number(v) : "";
                  setBrandId(next);
                  setModelId("");
                  setPickedVariantId("");
                }}
                options={brands.map((b) => ({ value: b.id, label: b.name }))}
                placeholder="Select brand"
              />
              <FilterSelect
                value={modelId}
                onChange={(v) => {
                  setModelId(v ? Number(v) : "");
                  setPickedVariantId("");
                }}
                options={models.map((m) => ({ value: m.id, label: m.name }))}
                placeholder="Select model"
                disabled={!brandId}
              />
              <FilterSelect
                value={pickedVariantId}
                onChange={(v) => setPickedVariantId(v ? Number(v) : "")}
                options={variants.map((v) => ({ value: v.id, label: v.variantName }))}
                placeholder="Select variant"
                disabled={!modelId}
              />
            </div>
          )}

          {activeVariantId && activeVariantLabel && (
            <div className="flex items-center gap-2 text-[11.5px] font-semibold text-[#4a4640] px-1">
              <span
                className="inline-block size-1.5 rounded-full shrink-0"
                style={{ background: "#D4300F" }}
              />
              {activeVariantLabel}
            </div>
          )}

          {!isEditMode && !pickedVariantId && (
            <p className="text-[12.5px] text-[#a39e96] py-6 text-center">
              Select brand, model and variant to see its features.
            </p>
          )}

          {activeVariantId && <VariantFeatureChecklist variantId={activeVariantId} onSaved={handleClose} />}
        </div>
      </div>
    </div>
  );
}
