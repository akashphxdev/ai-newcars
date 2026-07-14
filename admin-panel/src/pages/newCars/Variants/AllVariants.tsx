// src/pages/newCars/Variants/AllVariants.tsx
import { useEffect, useState } from "react";
import {
  useGetVariantsQuery,
  useDeleteVariantMutation,
  type VariantRecord,
} from "./variant.api";
import { useGetCarModelOptionsQuery } from "../carModels/carModel.api";
import { useGetAttributeOptionsGroupedQuery } from "../AttributeOptions/attributeOption.api";
import { extractApiError } from "../../../lib/apiClient";
import VariantModal from "./VariantModal";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, SearchInput, FilterSelect } from "../../../components/common/SearchFilterBar";

const ACCENT = "#D4300F";
// Rows-per-page choices shown in the dropdown — same set as AllAdminLogs.tsx.
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function formatPrice(value: string): string {
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  return `₹${(num / 100000).toFixed(2)}L`;
}

export default function AllVariants() {
  const [page, setPage] = useState(1);
  // Rows-per-page, user-controlled via a dropdown next to the filters.
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  // Debounced copy of `search` — this is what actually goes into the
  // query args, so we don't refetch on every keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterModelId, setFilterModelId] = useState<number | "">("");
  const [filterTransmissionId, setFilterTransmissionId] = useState<number | "">("");

  const { data: carModels = [] } = useGetCarModelOptionsQuery();

  // Transmission filter options now come from the dynamic attribute
  // options lookup instead of a hardcoded enum.
  const { data: attributeOptionsGrouped } = useGetAttributeOptionsGroupedQuery();
  const transmissions = attributeOptionsGrouped?.transmission ?? [];

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data: variantsData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetVariantsQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
    modelId: filterModelId || undefined,
    transmissionId: filterTransmissionId || undefined,
  });

  const variants = variantsData?.data ?? [];
  const pagination = variantsData?.pagination;
  const loading = isLoading || isFetching;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";

  // Modal state — null variant = "Add" mode, a record = "Edit" mode.
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<VariantRecord | null>(null);

  const openAddModal = () => {
    setEditingVariant(null);
    setModalOpen(true);
  };

  const openEditModal = (variant: VariantRecord) => {
    setEditingVariant(variant);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingVariant(null);
  };

  const [deleteVariant] = useDeleteVariantMutation();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<VariantRecord | null>(null);
  const [actionError, setActionError] = useState("");

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setActionError("");
    setDeletingId(pendingDelete.id);
    try {
      await deleteVariant(pendingDelete.id).unwrap();
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

  const columns: DataTableColumn<VariantRecord>[] = [
    {
      header: "Variant",
      render: (v) => (
        <>
          <p className="font-semibold text-[#1c1a17]">{v.variantName}</p>
          {v.isTopSeller && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600">
              Top seller
            </span>
          )}
        </>
      ),
    },
    {
      header: "Model",
      render: (v) => (
        <span className="text-[#7a7670]">
          {v.model.brand.name} — {v.model.name}
        </span>
      ),
    },
    { header: "Price", render: (v) => <span className="text-[#7a7670] whitespace-nowrap">{formatPrice(v.price)}</span> },
    { header: "Seats", render: (v) => <span className="text-[#7a7670]">{v.seatingCapacity}</span> },
    {
      header: "Transmission",
      render: (v) => (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-[#4a4640] bg-[#f7f5f1] uppercase">
          {v.transmission?.name ?? "—"}
        </span>
      ),
    },
    {
      header: "",
      align: "right",
      render: (v) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openEditModal(v)}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => setPendingDelete(v)}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-[1200px]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[18px] font-black text-[#1c1a17]">Variants</h1>
          <p className="text-[12px] text-[#a39e96] mt-0.5">
            Manage variants under each car model. All fields are required when adding or editing.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="cursor-pointer text-[12px] font-bold text-white px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          + Add variant
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
                {pagination.total} variant{pagination.total === 1 ? "" : "s"} total
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
          placeholder="Search by variant name..."
        />
        <FilterSelect
          value={filterModelId}
          onChange={(v) => {
            setFilterModelId(v ? Number(v) : "");
            setPage(1);
          }}
          options={carModels.map((m) => ({ value: m.id, label: `${m.brand.name} — ${m.name}` }))}
          placeholder="All models"
        />
        <FilterSelect
          value={filterTransmissionId}
          onChange={(v) => {
            setFilterTransmissionId(v ? Number(v) : "");
            setPage(1);
          }}
          options={transmissions.map((t) => ({ value: t.id, label: t.name }))}
          placeholder="All transmissions"
        />
      </SearchFilterBar>

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={variants}
          rowKey={(v) => v.id}
          loading={loading}
          error={error}
          loadingMessage="Loading variants..."
          emptyMessage="No variants found."
        />
        <Pagination
          pagination={pagination ?? null}
          onPageChange={setPage}
          variant="compact"
          itemLabel="variants"
          currentCount={variants.length}
        />
      </div>

      {modalOpen && (
        <VariantModal
          key={editingVariant ? `edit-${editingVariant.id}` : "add"}
          open={modalOpen}
          onClose={closeModal}
          variant={editingVariant}
        />
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete variant?"
        itemName={pendingDelete?.variantName}
        loading={deletingId === pendingDelete?.id}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}