// src/pages/newCars/VariantFeatures/AllVariantFeatures.tsx
import { useEffect, useState } from "react";
import { useGetVariantsWithFeaturesQuery, type VariantWithFeaturesRecord } from "./variantFeature.api";
import VariantFeatureReadOnly from "./VariantFeatureReadOnly";
import VariantFeatureModal from "./VariantFeatureModal";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, SearchInput } from "../../../components/common/SearchFilterBar";

const ACCENT = "#D4300F";
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function variantLabel(v: VariantWithFeaturesRecord): string {
  return `${v.model.brand.name} — ${v.model.name} — ${v.variantName}`;
}

export default function AllVariantFeatures() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data: variantData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetVariantsWithFeaturesQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
  });

  const variants = variantData?.data ?? [];
  const pagination = variantData?.pagination;
  const loading = isLoading || isFetching;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";

  // null = closed; { id: 0 } sentinel-free — modalVariant itself doubles
  // as the "is add-modal open" flag: present but with variant undefined
  // means Add mode, present with a variant means Edit mode.
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<{ id: number; label: string } | null>(null);

  const openAddModal = () => {
    setEditingVariant(null);
    setModalOpen(true);
  };

  const openEditModal = (v: VariantWithFeaturesRecord) => {
    setEditingVariant({ id: v.id, label: variantLabel(v) });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingVariant(null);
  };

  const handleLimitChange = (value: number) => {
    setLimit(value);
    setPage(1);
  };

  const columns: DataTableColumn<VariantWithFeaturesRecord>[] = [
    {
      header: "Variant",
      render: (v) => <p className="font-semibold text-[#1c1a17]">{variantLabel(v)}</p>,
    },
    {
      header: "Price",
      render: (v) => <span className="text-[#7a7670]">₹{Number(v.price).toLocaleString("en-IN")}</span>,
    },
    {
      header: "Features",
      render: (v) => (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-[#4a4640] bg-[#f7f5f1]">
          {v.featureCount} assigned
        </span>
      ),
    },
    {
      header: "",
      align: "right",
      render: (v) => (
        <div onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => openEditModal(v)}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors"
          >
            Edit
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-[1200px]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[18px] font-black text-[#1c1a17]">Variant Features</h1>
          <p className="text-[12px] text-[#a39e96] mt-0.5">
            Variants that already have features assigned. Expand a row to view them, or use Edit to change them.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="cursor-pointer text-[12px] font-bold text-white px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          + Add feature
        </button>
      </div>

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
          placeholder="Search by variant, model or brand..."
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
          emptyMessage="No variants have features assigned yet — use “+ Add feature” to get started."
          expandable
          renderExpanded={(v) => <VariantFeatureReadOnly variantId={v.id} />}
        />
        <Pagination
          pagination={pagination ?? null}
          onPageChange={setPage}
          variant="compact"
          itemLabel="variants"
          currentCount={variants.length}
        />
      </div>

      <VariantFeatureModal open={modalOpen} onClose={closeModal} variant={editingVariant} />
    </div>
  );
}
