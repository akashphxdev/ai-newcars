// src/pages/newCars/ColorsImages/AddToNewModelModal.tsx
import { useState } from "react";
import { useGetBrandOptionsQuery } from "../Brands/brand.api";
import { useGetCarModelOptionsQuery } from "../carModels/carModel.api";
import ColorsImagesPanel from "./ColorsImagesPanel";
import { FilterSelect } from "../../../components/common/SearchFilterBar";

// For a model that has zero colors/images yet — it won't show up in the
// main listing until at least one exists, so this picks the model first
// (brand -> model, same cascade as Variant Features' add flow) and then
// opens the exact same Colors/Images tabs used everywhere else.
export default function AddToNewModelModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [brandId, setBrandId] = useState<number | "">("");
  const [modelId, setModelId] = useState<number | "">("");

  const { data: brands = [] } = useGetBrandOptionsQuery();
  const { data: models = [] } = useGetCarModelOptionsQuery(
    brandId ? { brandId: Number(brandId) } : undefined,
    { skip: !brandId },
  );

  if (!open) return null;

  const handleClose = () => {
    setBrandId("");
    setModelId("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="w-full max-w-[640px] bg-white border border-[#e8e4dc] rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-1">
          <div>
            <h2 className="text-[#1c1a17] text-lg font-black">Add colors / images to a model</h2>
            <p className="text-[#a39e96] text-xs mt-1">Pick a brand and model, then add its colors or images.</p>
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
          <div className="flex items-center gap-2 flex-wrap bg-[#f7f5f1] rounded-xl p-3">
            <FilterSelect
              value={brandId}
              onChange={(v) => {
                const next = v ? Number(v) : "";
                setBrandId(next);
                setModelId("");
              }}
              options={brands.map((b) => ({ value: b.id, label: b.name }))}
              placeholder="Select brand"
            />
            <FilterSelect
              value={modelId}
              onChange={(v) => setModelId(v ? Number(v) : "")}
              options={models.map((m) => ({ value: m.id, label: m.name }))}
              placeholder="Select model"
              disabled={!brandId}
            />
          </div>

          {!modelId && (
            <p className="text-[12.5px] text-[#a39e96] py-6 text-center">Select a brand and model to continue.</p>
          )}

          {modelId && <ColorsImagesPanel modelId={modelId} />}
        </div>
      </div>
    </div>
  );
}
