// src/pages/Seo/SeoMeta/DynamicSeoMetaPanel.tsx
//
// Brand / Model / Variant / Body Type / News Category SEO manager —
// rendered inside AllSeoMetas.tsx when the admin picks one of those chips
// from the same page-picker strip that lists the static pages. These are
// open-ended, searchable entities rather than a short fixed list, so this
// panel is a standard filter + table + modal CRUD screen (same shape as
// AllPlacements.tsx) instead of a single form.
import { useEffect, useMemo, useState } from "react";
import {
  useGetSeoMetasQuery,
  useUpdateSeoMetaStatusMutation,
  useDeleteSeoMetaMutation,
  type SeoMetaRecord,
} from "./seoMeta.api";
import { useGetBrandOptionsQuery } from "../../newCars/Brands/brand.api";
import { useGetCarModelOptionsQuery } from "../../newCars/carModels/carModel.api";
import { useGetVariantOptionsQuery } from "../../newCars/Variants/variant.api";
import { useGetBodyTypeOptionsQuery } from "../../newCars/BodyTypes/bodyType.api";
import { useGetArticleCategoriesQuery } from "../../Articles/ArticleCategories/articleCategory.api";
import { extractApiError } from "../../../lib/apiClient";
import DynamicSeoMetaModal from "./DynamicSeoMetaModal";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, SearchInput } from "../../../components/common/SearchFilterBar";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { SEO_PAGE_TYPE } from "../../../lib/lookups";

const ACCENT = "#D4300F";
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusToggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className="cursor-pointer relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ background: checked ? ACCENT : "#e2ddd5" }}
    >
      <span
        className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? "translateX(18px)" : "translateX(3px)" }}
      />
    </button>
  );
}

export default function DynamicSeoMetaPanel({ pageType }: { pageType: number }) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => setPage(1), [pageType]);

  const {
    data: seoMetasData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetSeoMetasQuery({ page, limit, search: debouncedSearch || undefined, pageType });

  const seoMetas = seoMetasData?.data ?? [];
  const pagination = seoMetasData?.pagination;
  const loading = isLoading || isFetching;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";

  // Resolve entityId -> a readable label, same composition
  // EntityPicker.tsx uses for its search results — only fetch whichever
  // options list this pageType actually needs.
  const needsBrand = pageType === SEO_PAGE_TYPE.BRAND || pageType === SEO_PAGE_TYPE.MODEL || pageType === SEO_PAGE_TYPE.DETAIL;
  const needsModel = pageType === SEO_PAGE_TYPE.MODEL || pageType === SEO_PAGE_TYPE.DETAIL;
  const { data: brands = [] } = useGetBrandOptionsQuery(undefined, { skip: !needsBrand });
  const { data: models = [] } = useGetCarModelOptionsQuery(undefined, { skip: !needsModel });
  const { data: variants = [] } = useGetVariantOptionsQuery(undefined, { skip: pageType !== SEO_PAGE_TYPE.DETAIL });
  const { data: bodyTypes = [] } = useGetBodyTypeOptionsQuery(undefined, { skip: pageType !== SEO_PAGE_TYPE.BODY_TYPE });
  const { data: categoriesData } = useGetArticleCategoriesQuery(
    { page: 1, limit: 100 },
    { skip: pageType !== SEO_PAGE_TYPE.NEWS_CATEGORY },
  );

  const brandNameById = useMemo(() => new Map(brands.map((b) => [b.id, b.name])), [brands]);
  const modelById = useMemo(() => new Map(models.map((m) => [m.id, m])), [models]);
  const variantById = useMemo(() => new Map(variants.map((v) => [v.id, v])), [variants]);
  const bodyTypeNameById = useMemo(() => new Map(bodyTypes.map((bt) => [bt.id, bt.name])), [bodyTypes]);
  const categoryNameById = useMemo(
    () => new Map((categoriesData?.data ?? []).map((c) => [c.id, c.name])),
    [categoriesData],
  );

  const entityLabel = (record: SeoMetaRecord): string => {
    if (record.entityId == null) return "Default template";
    if (record.pageType === SEO_PAGE_TYPE.BRAND) {
      return brandNameById.get(record.entityId) ?? `Brand #${record.entityId}`;
    }
    if (record.pageType === SEO_PAGE_TYPE.MODEL) {
      const model = modelById.get(record.entityId);
      if (!model) return `Model #${record.entityId}`;
      return `${brandNameById.get(model.brandId) ?? "—"} — ${model.name}`;
    }
    if (record.pageType === SEO_PAGE_TYPE.DETAIL) {
      const variant = variantById.get(record.entityId);
      if (!variant) return `Variant #${record.entityId}`;
      const model = modelById.get(variant.modelId);
      const brandName = model ? brandNameById.get(model.brandId) : undefined;
      return `${brandName ?? "—"} — ${model?.name ?? "—"} — ${variant.variantName}`;
    }
    if (record.pageType === SEO_PAGE_TYPE.BODY_TYPE) {
      return bodyTypeNameById.get(record.entityId) ?? `Body type #${record.entityId}`;
    }
    if (record.pageType === SEO_PAGE_TYPE.NEWS_CATEGORY) {
      return categoryNameById.get(record.entityId) ?? `Category #${record.entityId}`;
    }
    return `#${record.entityId}`;
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSeoMeta, setEditingSeoMeta] = useState<SeoMetaRecord | null>(null);

  const openAddModal = () => {
    setEditingSeoMeta(null);
    setModalOpen(true);
  };

  const openEditModal = (seoMeta: SeoMetaRecord) => {
    setEditingSeoMeta(seoMeta);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingSeoMeta(null);
  };

  const [updateSeoMetaStatus] = useUpdateSeoMetaStatusMutation();
  const [deleteSeoMeta] = useDeleteSeoMetaMutation();

  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SeoMetaRecord | null>(null);
  const [actionError, setActionError] = useState("");

  const handleToggleStatus = async (seoMeta: SeoMetaRecord) => {
    setActionError("");
    setTogglingId(seoMeta.id);
    try {
      await updateSeoMetaStatus({ id: seoMeta.id, status: !seoMeta.status }).unwrap();
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setTogglingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setActionError("");
    setDeletingId(pendingDelete.id);
    try {
      await deleteSeoMeta(pendingDelete.id).unwrap();
      setPendingDelete(null);
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setDeletingId(null);
    }
  };

  const handleLimitChange = (value: number) => {
    setLimit(value);
    setPage(1);
  };

  const columns: DataTableColumn<SeoMetaRecord>[] = [
    { header: "Entity", render: (m) => <span className="font-semibold text-[#1c1a17]">{entityLabel(m)}</span> },
    { header: "Meta title", render: (m) => <span className="text-[#7a7670] line-clamp-1 max-w-[260px] inline-block">{m.metaTitle ?? "—"}</span> },
    {
      header: "Status",
      render: (m) => (
        <div className="flex items-center gap-2">
          <StatusToggle checked={m.status} disabled={togglingId === m.id} onChange={() => handleToggleStatus(m)} />
          <span className={`text-[10px] font-bold ${m.status ? "text-green-600" : "text-[#a39e96]"}`}>
            {m.status ? "Active" : "Inactive"}
          </span>
        </div>
      ),
    },
    {
      header: "Updated",
      render: (m) => (
        <div className="whitespace-nowrap">
          <p className="text-[#1c1a17] font-semibold">{m.updatedByAdmin?.name ?? "—"}</p>
          <p className="text-[10px] text-[#a39e96] mt-0.5">{fmtDate(m.updatedAt)}</p>
        </div>
      ),
    },
    {
      header: "",
      align: "right",
      render: (m) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openEditModal(m)}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => setPendingDelete(m)}
            disabled={deletingId === m.id}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deletingId === m.id ? "..." : "Delete"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={openAddModal}
          className="cursor-pointer text-[12px] font-bold text-white px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          + Add SEO entry
        </button>
      </div>

      {actionError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
          <p className="text-red-500 text-xs font-medium">{actionError}</p>
        </div>
      )}

      <SearchFilterBar
        right={
          <div className="flex items-center gap-3">
            {pagination && (
              <p className="text-[11px] text-[#a39e96] whitespace-nowrap">
                {pagination.total} entr{pagination.total === 1 ? "y" : "ies"} total
              </p>
            )}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[#a39e96] whitespace-nowrap">Rows per page</span>
              <select
                value={limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="cursor-pointer text-[12px] text-[#4a4640] bg-[#f7f5f1] border border-[#e8e4dc] rounded-lg px-3 py-2 outline-none"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        }
      >
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search by meta title..."
          width="280px"
        />
      </SearchFilterBar>

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={seoMetas}
          rowKey={(m) => m.id}
          loading={loading}
          error={error}
          loadingMessage="Loading SEO entries..."
          emptyMessage="No SEO entries found for this page type yet."
        />
        <Pagination
          pagination={pagination ?? null}
          onPageChange={setPage}
          variant="compact"
          itemLabel="entries"
          currentCount={seoMetas.length}
        />
      </div>

      <DynamicSeoMetaModal open={modalOpen} onClose={closeModal} seoMeta={editingSeoMeta} defaultPageType={pageType} />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete SEO entry?"
        itemName={pendingDelete ? entityLabel(pendingDelete) : undefined}
        loading={deletingId === pendingDelete?.id}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
