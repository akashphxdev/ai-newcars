// src/components/common/EntityPicker.tsx
//
// Picks the entity a dynamic SEO row applies to — Brand Listing searches
// Brand, Model Detail searches CarModel, Variant Detail searches
// CarVariant (labelled with their parent Brand/Model for context), Body
// Type Listing searches BodyType, News Category searches ArticleCategory.
// Built on top of SearchSelect (same widget ArticleModal.tsx uses for
// Related brands/models), not a new dropdown implementation. Used by
// DynamicSeoMetaModal.tsx.
//
// Doesn't handle SEO_PAGE_TYPE.STATIC — that SEO screen picks its page via
// a fixed slug dropdown instead, it has no use for this component.

import { useMemo, useState } from "react";
import SearchSelect from "./SearchSelect";
import { useGetBrandOptionsQuery } from "../../pages/newCars/Brands/brand.api";
import { useGetCarModelOptionsQuery } from "../../pages/newCars/carModels/carModel.api";
import { useGetVariantOptionsQuery } from "../../pages/newCars/Variants/variant.api";
import { useGetBodyTypeOptionsQuery } from "../../pages/newCars/BodyTypes/bodyType.api";
import { useGetArticleCategoriesQuery } from "../../pages/Articles/ArticleCategories/articleCategory.api";
import { SEO_PAGE_TYPE } from "../../lib/lookups";

export default function EntityPicker({
  pageType,
  entityId,
  onEntityIdChange,
  error,
}: {
  pageType: number | "";
  entityId: number | null;
  onEntityIdChange: (id: number | null) => void;
  error?: string;
}) {
  const [isDefault, setIsDefault] = useState(entityId == null);

  // Brands are needed both directly (Brand Listing search) and indirectly
  // (labelling Model/Variant results with their parent brand).
  const needsBrand = pageType === SEO_PAGE_TYPE.BRAND || pageType === SEO_PAGE_TYPE.MODEL || pageType === SEO_PAGE_TYPE.DETAIL;
  const needsModel = pageType === SEO_PAGE_TYPE.MODEL || pageType === SEO_PAGE_TYPE.DETAIL;
  const needsVariant = pageType === SEO_PAGE_TYPE.DETAIL;
  const needsCategory = pageType === SEO_PAGE_TYPE.NEWS_CATEGORY;
  const needsBodyType = pageType === SEO_PAGE_TYPE.BODY_TYPE;

  const { data: brands = [] } = useGetBrandOptionsQuery(undefined, { skip: !needsBrand });
  const { data: models = [] } = useGetCarModelOptionsQuery(undefined, { skip: !needsModel });
  const { data: variants = [] } = useGetVariantOptionsQuery(undefined, { skip: !needsVariant });
  const { data: bodyTypes = [] } = useGetBodyTypeOptionsQuery(undefined, { skip: !needsBodyType });
  // Categories are few (a handful of news sections) — one unpaginated
  // page covers all of them, same as the Options endpoints above.
  const { data: categoriesData } = useGetArticleCategoriesQuery({ page: 1, limit: 100 }, { skip: !needsCategory });
  const categories = categoriesData?.data ?? [];

  const brandNameById = useMemo(() => new Map(brands.map((b) => [b.id, b.name])), [brands]);
  const modelById = useMemo(() => new Map(models.map((m) => [m.id, m])), [models]);

  const options = useMemo(() => {
    if (pageType === SEO_PAGE_TYPE.BRAND) {
      return brands.map((b) => ({ id: b.id, label: b.name }));
    }
    if (pageType === SEO_PAGE_TYPE.MODEL) {
      return models.map((m) => ({ id: m.id, label: `${brandNameById.get(m.brandId) ?? "—"} — ${m.name}` }));
    }
    if (pageType === SEO_PAGE_TYPE.DETAIL) {
      return variants.map((v) => {
        const model = modelById.get(v.modelId);
        const brandName = model ? brandNameById.get(model.brandId) : undefined;
        return { id: v.id, label: `${brandName ?? "—"} — ${model?.name ?? "—"} — ${v.variantName}` };
      });
    }
    if (pageType === SEO_PAGE_TYPE.BODY_TYPE) {
      return bodyTypes.map((bt) => ({ id: bt.id, label: bt.name }));
    }
    if (pageType === SEO_PAGE_TYPE.NEWS_CATEGORY) {
      return categories.map((c) => ({ id: c.id, label: c.name }));
    }
    return [];
  }, [pageType, brands, models, variants, bodyTypes, categories, brandNameById, modelById]);

  const selectedLabel = entityId != null ? options.find((o) => o.id === entityId)?.label : undefined;

  if (pageType === "") {
    return <p className="text-[11px] text-[#a39e96] bg-[#f7f5f1] border border-[#e2ddd5] rounded-xl px-3 py-2.5">Select a page type first.</p>;
  }

  const entityTypeLabel =
    pageType === SEO_PAGE_TYPE.BRAND
      ? "brand"
      : pageType === SEO_PAGE_TYPE.MODEL
        ? "model"
        : pageType === SEO_PAGE_TYPE.DETAIL
          ? "variant"
          : pageType === SEO_PAGE_TYPE.BODY_TYPE
            ? "body type"
            : "category";

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-[#4a4640]">
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(e) => {
            setIsDefault(e.target.checked);
            if (e.target.checked) onEntityIdChange(null);
          }}
          className="cursor-pointer accent-[#D4300F]"
        />
        Use as default template for this page type
      </label>

      {!isDefault && (
        <>
          {selectedLabel ? (
            <div className="flex items-center justify-between gap-2 bg-[#fef2f0] border border-[#f5d5cc] rounded-xl px-3 py-2.5">
              <span className="text-[12.5px] font-semibold text-[#D4300F]">{selectedLabel}</span>
              <button
                type="button"
                onClick={() => onEntityIdChange(null)}
                className="cursor-pointer text-[#D4300F] hover:opacity-70"
                aria-label="Clear selection"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ) : (
            <SearchSelect
              options={options}
              onSelect={(id) => onEntityIdChange(id)}
              placeholder={`Search ${entityTypeLabel}s...`}
              emptyMessage={`No ${entityTypeLabel}s found.`}
            />
          )}
          {error && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{error}</p>}
        </>
      )}
    </div>
  );
}
