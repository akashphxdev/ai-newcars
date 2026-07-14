// src/pages/Locations/AllDistricts.tsx
import { useEffect, useState } from "react";
import {
  useGetDistrictsQuery,
  useDeleteDistrictMutation,
  type DistrictRecord,
} from "./district.api";
import { useGetStateOptionsQuery } from "../States/state.api";
import { useGetCountryOptionsQuery } from "../Countries/country.api";
import { extractApiError } from "../../../lib/apiClient";
import DistrictModal from "./DistrictModal";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, SearchInput, FilterSelect } from "../../../components/common/SearchFilterBar";
import ConfirmDialog from "../../../components/common/ConfirmDialog";

const ACCENT = "#D4300F";
// Rows-per-page choices shown in the dropdown — same set as AllAdminLogs.tsx.
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function AllDistricts() {
  const [page, setPage] = useState(1);
  // Rows-per-page, user-controlled via a dropdown next to the filters.
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  // Debounced copy of `search` — this is what actually goes into the
  // query args, so we don't refetch on every keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterCountryId, setFilterCountryId] = useState<number | "">("");
  const [filterStateId, setFilterStateId] = useState<number | "">("");

  const { data: countries = [] } = useGetCountryOptionsQuery();

  // Filter-section states — scoped to filterCountryId.
  const { data: filterStates = [] } = useGetStateOptionsQuery({ countryId: filterCountryId || undefined });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data: districtsData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetDistrictsQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
    stateId: filterStateId || undefined,
  });

  const districts = districtsData?.data ?? [];
  const pagination = districtsData?.pagination;
  const loading = isLoading || isFetching;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";

  // Modal state — null district = "Add" mode, a record = "Edit" mode.
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDistrict, setEditingDistrict] = useState<DistrictRecord | null>(null);

  const openAddModal = () => {
    setEditingDistrict(null);
    setModalOpen(true);
  };

  const openEditModal = (district: DistrictRecord) => {
    setEditingDistrict(district);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingDistrict(null);
  };

  const [deleteDistrict] = useDeleteDistrictMutation();

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DistrictRecord | null>(null);
  const [actionError, setActionError] = useState("");

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setActionError("");
    setDeletingId(pendingDelete.id);
    try {
      await deleteDistrict(pendingDelete.id).unwrap();
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

  const columns: DataTableColumn<DistrictRecord>[] = [
    { header: "Name", render: (d) => <span className="font-semibold text-[#1c1a17]">{d.name}</span> },
    { header: "State", render: (d) => <span className="text-[#7a7670]">{d.state?.name ?? "—"}</span> },
    { header: "Country", render: (d) => <span className="text-[#7a7670]">{d.state?.country?.name ?? "—"}</span> },
    {
      header: "",
      align: "right",
      render: (d) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openEditModal(d)}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => setPendingDelete(d)}
            disabled={deletingId === d.id}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deletingId === d.id ? "..." : "Delete"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-[1100px]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[18px] font-black text-[#1c1a17]">Districts</h1>
          <p className="text-[12px] text-[#a39e96] mt-0.5">Manage districts, each linked to a state.</p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="cursor-pointer text-[12px] font-bold text-white px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          + Add district
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
                {pagination.total} district{pagination.total === 1 ? "" : "s"} total
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
          placeholder="Search by name..."
        />
        <FilterSelect
          value={filterCountryId}
          onChange={(v) => {
            setFilterCountryId(v ? Number(v) : "");
            setFilterStateId(""); // country changed — clear the (now stale) state filter
            setPage(1);
          }}
          options={countries.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="All countries"
        />
        <FilterSelect
          value={filterStateId}
          onChange={(v) => {
            setFilterStateId(v ? Number(v) : "");
            setPage(1);
          }}
          options={filterStates.map((s) => ({ value: s.id, label: s.name }))}
          placeholder="All states"
          disabled={!filterCountryId}
        />
      </SearchFilterBar>

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={districts}
          rowKey={(d) => d.id}
          loading={loading}
          error={error}
          loadingMessage="Loading districts..."
          emptyMessage="No districts found."
        />
        <Pagination
          pagination={pagination ?? null}
          onPageChange={setPage}
          variant="compact"
          itemLabel="districts"
          currentCount={districts.length}
        />
      </div>

      {modalOpen && (
        <DistrictModal
          key={editingDistrict ? `edit-${editingDistrict.id}` : "add"}
          open={modalOpen}
          onClose={closeModal}
          district={editingDistrict}
        />
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete district?"
        itemName={pendingDelete?.name}
        loading={deletingId === pendingDelete?.id}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}