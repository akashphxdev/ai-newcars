// src/pages/newCars/VariantFeatures/VariantFeatureChecklist.tsx
import { useEffect, useState } from "react";
import {
  useGetFeatureCatalogQuery,
  useGetVariantFeaturesQuery,
  useSyncVariantFeaturesMutation,
} from "./variantFeature.api";
import { extractApiError } from "../../../lib/apiClient";

const ACCENT = "#D4300F";

// featureId -> { checked, value } — local editable copy of the
// checklist, seeded from the variant's current assignments as soon as
// they load.
type LocalState = Record<number, { checked: boolean; value: string }>;

// Shared by both the Variant Features listing's expand-to-edit row and
// the "Add Feature" modal's pick-then-assign flow — same catalog +
// current-assignment fetch, same save behavior either way.
export default function VariantFeatureChecklist({
  variantId,
  onSaved,
}: {
  variantId: number;
  // When provided (the "Add Feature" modal), called instead of showing
  // an inline success message — the caller closes itself. Omit it (the
  // listing's expand-row use) to show the message in place instead.
  onSaved?: () => void;
}) {
  const { data: catalog = [], isLoading: catalogLoading } = useGetFeatureCatalogQuery();
  const {
    data: assignment,
    isLoading: assignmentLoading,
    isFetching: assignmentFetching,
  } = useGetVariantFeaturesQuery(variantId);

  const [local, setLocal] = useState<LocalState>({});

  useEffect(() => {
    if (!assignment) return;
    const seeded: LocalState = {};
    for (const a of assignment) {
      seeded[a.featureId] = { checked: true, value: a.value ?? "" };
    }
    setLocal(seeded);
  }, [assignment]);

  const [syncVariantFeatures, { isLoading: saving }] = useSyncVariantFeaturesMutation();
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const toggleFeature = (featureId: number) => {
    setSaveSuccess(false);
    setLocal((prev) => ({
      ...prev,
      [featureId]: { checked: !prev[featureId]?.checked, value: prev[featureId]?.value ?? "" },
    }));
  };

  const setFeatureValue = (featureId: number, value: string) => {
    setSaveSuccess(false);
    setLocal((prev) => ({ ...prev, [featureId]: { checked: prev[featureId]?.checked ?? false, value } }));
  };

  const handleSave = async () => {
    setSaveError("");
    setSaveSuccess(false);
    try {
      await syncVariantFeatures({
        variantId,
        input: {
          features: Object.entries(local)
            .filter(([, v]) => v.checked)
            .map(([featureId, v]) => ({ featureId: Number(featureId), value: v.value.trim() || undefined })),
        },
      }).unwrap();
      if (onSaved) {
        onSaved();
      } else {
        setSaveSuccess(true);
      }
    } catch (err) {
      setSaveError(extractApiError(err));
    }
  };

  if (catalogLoading || assignmentLoading || assignmentFetching) {
    return <p className="text-[12.5px] text-[#a39e96] py-2">Loading features...</p>;
  }

  const checkedCount = Object.values(local).filter((v) => v.checked).length;

  return (
    <div className="space-y-4">
      {saveError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
          <p className="text-red-500 text-xs font-medium">{saveError}</p>
        </div>
      )}
      {saveSuccess && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-3.5 py-2.5">
          <p className="text-green-600 text-xs font-medium">Features saved successfully.</p>
        </div>
      )}

      {catalog.length === 0 && (
        <p className="text-[12.5px] text-[#a39e96]">No features exist yet — add some from the Features page first.</p>
      )}

      {catalog.map((group) => (
        <div key={group.categoryId ?? "uncategorized"}>
          <p className="text-[10px] font-black uppercase tracking-wider text-[#1c1a17] border-b border-[#f0ece6] pb-1.5 mb-3">
            {group.categoryName}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {group.features.map((f) => {
              const state = local[f.id];
              const checked = state?.checked ?? false;
              return (
                <label
                  key={f.id}
                  className="flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors"
                  style={{
                    borderColor: checked ? "#f0997b" : "#e8e4dc",
                    background: checked ? "rgba(212,48,15,0.05)" : "#fff",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleFeature(f.id)}
                    className="cursor-pointer size-4 accent-[#D4300F] shrink-0"
                  />
                  <span className="text-[12px] font-medium text-[#1c1a17] flex-1 min-w-0">{f.name}</span>
                  <input
                    type="text"
                    value={state?.value ?? ""}
                    onChange={(e) => setFeatureValue(f.id, e.target.value)}
                    disabled={!checked}
                    placeholder="value"
                    className="w-20 shrink-0 text-[11px] text-[#1c1a17] bg-[#f7f5f1] border border-[#e2ddd5] rounded-lg px-1.5 py-1 outline-none disabled:opacity-40"
                  />
                </label>
              );
            })}
          </div>
        </div>
      ))}

      {catalog.length > 0 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-[11.5px] text-[#a39e96]">{checkedCount} feature{checkedCount === 1 ? "" : "s"} selected</p>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="cursor-pointer text-[12px] font-bold text-white px-4 py-2 rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: ACCENT }}
          >
            {saving ? "Saving..." : "Save features"}
          </button>
        </div>
      )}
    </div>
  );
}
