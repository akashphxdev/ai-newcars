// src/pages/Brands/AllBrands.tsx

import { useState } from "react";
import {
  useGetBrandsQuery,
  useUpdateBrandStatusMutation,
  useDeleteBrandMutation,
  type BrandRecord,
} from "./brand.api";
import { useGetCountriesQuery } from "../../Locations/Countries/country.api";
import { extractApiError, getUploadUrl } from "../../../lib/apiClient";
import BrandModal from "./BrandModal";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, SearchInput, FilterSelect } from "../../../components/common/SearchFilterBar";

const ACCENT = "#D4300F";
const PAGE_SIZE = 20;

// Small pill-style toggle switch — same pattern as AllCountries.tsx's
// StatusToggle / AllCities.tsx's FlagToggle.
function StatusToggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
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

export default function AllBrands() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterCountryId, setFilterCountryId] = useState<number | "">("");

  // NOTE: same 100-row cap as elsewhere (Locations pages).
  const { data: countriesData } = useGetCountriesQuery({ limit: 100, sortBy: "name", sortOrder: "asc" });
  const countries = countriesData?.data ?? [];

  const {
    data: brandsData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetBrandsQuery({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    countryOriginId: filterCountryId || undefined,
  });

  const brands = brandsData?.data ?? [];
  const pagination = brandsData?.pagination;
  const loading = isLoading || isFetching;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";

  // Modal state — null brand = "Add" mode, a record = "Edit" mode.
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandRecord | null>(null);

  const openAddModal = () => {
    setEditingBrand(null);
    setModalOpen(true);
  };

  const openEditModal = (brand: BrandRecord) => {
    setEditingBrand(brand);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingBrand(null);
  };

  const [updateBrandStatus] = useUpdateBrandStatusMutation();
  const [deleteBrand] = useDeleteBrandMutation();

  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  const handleToggleStatus = async (brand: BrandRecord) => {
    setActionError("");
    setTogglingId(brand.id);
    try {
      await updateBrandStatus({ id: brand.id, isActive: !brand.isActive }).unwrap();
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    setActionError("");
    setDeletingId(id);
    try {
      await deleteBrand(id).unwrap();
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setDeletingId(null);
    }
  };

  const columns: DataTableColumn<BrandRecord>[] = [
    {
      header: "Logo",
      render: (b) =>
        getUploadUrl(b.logoUrl) ? (
          <img
            src={getUploadUrl(b.logoUrl)!}
            alt=""
            className="w-7 h-7 rounded-lg object-cover border border-[#e8e4dc]"
          />
        ) : (
          <div className="w-7 h-7 rounded-lg bg-[#f7f5f1] border border-[#e8e4dc]" />
        ),
    },
    { header: "Name", render: (b) => <span className="font-semibold text-[#1c1a17]">{b.name}</span> },
    { header: "Slug", render: (b) => <span className="text-[#7a7670]">{b.slug}</span> },
    { header: "Country of origin", render: (b) => <span className="text-[#7a7670]">{b.countryOrigin?.name ?? "—"}</span> },
    {
      header: "Status",
      render: (b) => (
        <div className="flex items-center gap-2">
          <StatusToggle
            checked={b.isActive}
            disabled={togglingId === b.id}
            onChange={() => handleToggleStatus(b)}
          />
          <span className={`text-[10px] font-bold ${b.isActive ? "text-green-600" : "text-[#a39e96]"}`}>
            {b.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      ),
    },
    {
      header: "",
      align: "right",
      render: (b) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openEditModal(b)}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(b.id)}
            disabled={deletingId === b.id}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deletingId === b.id ? "..." : "Delete"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-[1100px]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[18px] font-black text-[#1c1a17]">Brands</h1>
          <p className="text-[12px] text-[#a39e96] mt-0.5">
            Manage car brands. Slug is auto-generated from the name if left blank.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="cursor-pointer text-[12px] font-bold text-white px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          + Add brand
        </button>
      </div>

      {actionError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
          <p className="text-red-500 text-xs font-medium">{actionError}</p>
        </div>
      )}

      <SearchFilterBar
        right={
          pagination && (
            <p className="text-[11px] text-[#a39e96] whitespace-nowrap">
              {pagination.total} brand{pagination.total === 1 ? "" : "s"} total
            </p>
          )
        }
      >
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search by name or slug..."
        />
        <FilterSelect
          value={filterCountryId}
          onChange={(v) => {
            setFilterCountryId(v ? Number(v) : "");
            setPage(1);
          }}
          options={countries.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="All origins"
        />
      </SearchFilterBar>

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={brands}
          rowKey={(b) => b.id}
          loading={loading}
          error={error}
          loadingMessage="Loading brands..."
          emptyMessage="No brands found."
        />
        <Pagination pagination={pagination ?? null} onPageChange={setPage} variant="simple" />
      </div>

      {modalOpen && (
        <BrandModal
          key={editingBrand ? `edit-${editingBrand.id}` : "add"}
          open={modalOpen}
          onClose={closeModal}
          brand={editingBrand}
        />
      )}
    </div>
  );
}