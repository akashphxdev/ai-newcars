// src/pages/newCars/VariantFeatures/VariantFeatureReadOnly.tsx
import { useGetFeatureCatalogQuery, useGetVariantFeaturesQuery } from "./variantFeature.api";

// Read-only summary shown when a Variant Features row is expanded —
// actual editing happens through the "Edit" button's modal instead, so
// this never renders checkboxes/inputs.
export default function VariantFeatureReadOnly({ variantId }: { variantId: number }) {
  const { data: catalog = [], isLoading: catalogLoading } = useGetFeatureCatalogQuery();
  const {
    data: assignment = [],
    isLoading: assignmentLoading,
    isFetching: assignmentFetching,
  } = useGetVariantFeaturesQuery(variantId);

  if (catalogLoading || assignmentLoading || assignmentFetching) {
    return <p className="text-[12.5px] text-[#a39e96] py-2">Loading features...</p>;
  }

  const assignedValues = new Map(assignment.map((a) => [a.featureId, a.value]));

  const groups = catalog
    .map((group) => ({ ...group, features: group.features.filter((f) => assignedValues.has(f.id)) }))
    .filter((group) => group.features.length > 0);

  if (groups.length === 0) {
    return <p className="text-[12.5px] text-[#a39e96] py-2">No features assigned.</p>;
  }

  return (
    <div className="space-y-3.5">
      {groups.map((group) => (
        <div key={group.categoryId ?? "uncategorized"}>
          <p className="text-[10px] font-black uppercase tracking-wider text-[#1c1a17] border-b border-[#f0ece6] pb-1.5 mb-2">
            {group.categoryName}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {group.features.map((f) => {
              const value = assignedValues.get(f.id);
              return (
                <span
                  key={f.id}
                  className="text-[11.5px] font-semibold px-2.5 py-1 rounded-lg bg-[#f7f5f1] text-[#1c1a17]"
                >
                  {f.name}
                  {value && <span className="text-[#D4300F]"> · {value}</span>}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
