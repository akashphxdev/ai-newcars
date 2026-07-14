// src/pages/Locations/AllStates.tsx

import { useEffect, useState } from "react";
import {
  useGetStatesQuery,
  useDeleteStateMutation,
  type StateRecord,
} from "./state.api";
import { useGetCountryOptionsQuery } from "../Countries/country.api";
import { extractApiError } from "../../../lib/apiClient";
import StateModal from "./StateModal";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, SearchInput, FilterSelect } from "../../../components/common/SearchFilterBar";
import ConfirmDialog from "../../../components/common/ConfirmDialog";

const ACCENT = "#D4300F";
// Rows-per-page choices shown in the dropdown — same set as AllAdminLogs.tsx.
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function AllStates() {
  const [page, setPage] = useState(1);
  // Rows-per-page, user-controlled via a dropdown next to the filters.
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  // Debounced copy of `search` — this is what actually goes into the
  // query args, so we don't refetch on every keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterCountryId, setFilterCountryId] = useState<number | "">("");
  const { data: countries = [] } = useGetCountryOptionsQuery();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data: statesData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetStatesQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
    countryId: filterCountryId || undefined,
  });

  const states = statesData?.data ?? [];
  const pagination = statesData?.pagination;
  const loading = isLoading || isFetching;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";

  // Modal state — null state = "Add" mode, a record = "Edit" mode.
  const [modalOpen, setModalOpen] = useState(false);
  const [editingState, setEditingState] = useState<StateRecord | null>(null);

  const openAddModal = () => {
    setEditingState(null);
    setModalOpen(true);
  };

  const openEditModal = (state: StateRecord) => {
    setEditingState(state);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingState(null);
  };

  const [deleteState] = useDeleteStateMutation();

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<StateRecord | null>(null);
  const [actionError, setActionError] = useState("");

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setActionError("");
    setDeletingId(pendingDelete.id);
    try {
      await deleteState(pendingDelete.id).unwrap();
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

  const columns: DataTableColumn<StateRecord>[] = [
    { header: "Name", render: (s) => <span className="font-semibold text-[#1c1a17]">{s.name}</span> },
    { header: "Code", render: (s) => <span className="text-[#7a7670]">{s.code ?? <span className="text-[#c0bab0]">—</span>}</span> },
    { header: "Country", render: (s) => <span className="text-[#7a7670]">{s.country?.name ?? "—"}</span> },
    {
      header: "",
      align: "right",
      render: (s) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openEditModal(s)}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => setPendingDelete(s)}
            disabled={deletingId === s.id}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deletingId === s.id ? "..." : "Delete"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-[1100px]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[18px] font-black text-[#1c1a17]">States</h1>
          <p className="text-[12px] text-[#a39e96] mt-0.5">Manage states, each linked to a country.</p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="cursor-pointer text-[12px] font-bold text-white px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          + Add state
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
                {pagination.total} state{pagination.total === 1 ? "" : "s"} total
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
            setPage(1);
          }}
          options={countries.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="All countries"
        />
      </SearchFilterBar>

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={states}
          rowKey={(s) => s.id}
          loading={loading}
          error={error}
          loadingMessage="Loading states..."
          emptyMessage="No states found."
        />
        <Pagination
          pagination={pagination ?? null}
          onPageChange={setPage}
          variant="compact"
          itemLabel="states"
          currentCount={states.length}
        />
      </div>

      {modalOpen && (
        <StateModal
          key={editingState ? `edit-${editingState.id}` : "add"}
          open={modalOpen}
          onClose={closeModal}
          state={editingState}
        />
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete state?"
        itemName={pendingDelete?.name}
        loading={deletingId === pendingDelete?.id}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}