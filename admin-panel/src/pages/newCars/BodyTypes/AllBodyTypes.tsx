// src/pages/newCars/BodyTypes/AllBodyTypes.tsx
import { useEffect, useState } from "react";
import {
  useGetBodyTypesQuery,
  useDeleteBodyTypeMutation,
  type BodyTypeRecord,
} from "./bodyType.api";
import { extractApiError, getUploadUrl } from "../../../lib/apiClient";
import BodyTypeModal from "./BodyTypeModal";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, SearchInput } from "../../../components/common/SearchFilterBar";

const ACCENT = "#D4300F";
// Rows-per-page choices shown in the dropdown — same set as AllAdminLogs.tsx.
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function AllBodyTypes() {
  const [page, setPage] = useState(1);
  // Rows-per-page, user-controlled via a dropdown next to the filters.
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  // Debounced copy of `search` — this is what actually goes into the
  // query args, so we don't refetch on every keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data: bodyTypesData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetBodyTypesQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
  });

  const bodyTypes = bodyTypesData?.data ?? [];
  const pagination = bodyTypesData?.pagination;
  const loading = isLoading || isFetching;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";

  // Modal state — null body type = "Add" mode, a record = "Edit" mode.
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBodyType, setEditingBodyType] = useState<BodyTypeRecord | null>(null);

  const openAddModal = () => {
    setEditingBodyType(null);
    setModalOpen(true);
  };

  const openEditModal = (bodyType: BodyTypeRecord) => {
    setEditingBodyType(bodyType);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingBodyType(null);
  };

  const [deleteBodyType] = useDeleteBodyTypeMutation();

  const [deletingId, setDeletingId] = useState<number | null>(null);
  // Row pending delete confirmation — set on "Delete" click, cleared on
  // cancel/confirm. Drives the shared ConfirmDialog popup.
  const [pendingDelete, setPendingDelete] = useState<BodyTypeRecord | null>(null);
  const [actionError, setActionError] = useState("");

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setActionError("");
    setDeletingId(pendingDelete.id);
    try {
      await deleteBodyType(pendingDelete.id).unwrap();
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

  const columns: DataTableColumn<BodyTypeRecord>[] = [
    {
      header: "Icon",
      render: (bt) => (
        <div className="w-10 h-10 rounded-lg border border-[#e8e4dc] bg-[#f7f5f1] overflow-hidden flex items-center justify-center">
          {bt.iconUrl ? (
            <img src={getUploadUrl(bt.iconUrl) ?? undefined} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[8px] text-[#a39e96]">—</span>
          )}
        </div>
      ),
    },
    {
      header: "Name",
      render: (bt) => (
        <>
          <p className="font-semibold text-[#1c1a17]">{bt.name}</p>
          <p className="text-[#a39e96]">{bt.slug}</p>
        </>
      ),
    },
    {
      header: "Description",
      render: (bt) => <span className="text-[#7a7670]">{bt.description || "—"}</span>,
    },
    {
      header: "",
      align: "right",
      render: (bt) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openEditModal(bt)}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => setPendingDelete(bt)}
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
          <h1 className="text-[18px] font-black text-[#1c1a17]">Body Types</h1>
          <p className="text-[12px] text-[#a39e96] mt-0.5">
            Manage body types (SUV, Sedan, ...) used by car models. Slug is auto-generated from the name if left
            blank.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="cursor-pointer text-[12px] font-bold text-white px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          + Add body type
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
                {pagination.total} body type{pagination.total === 1 ? "" : "s"} total
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
          placeholder="Search by name or slug..."
        />
      </SearchFilterBar>

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={bodyTypes}
          rowKey={(bt) => bt.id}
          loading={loading}
          error={error}
          loadingMessage="Loading body types..."
          emptyMessage="No body types found."
        />
        <Pagination
          pagination={pagination ?? null}
          onPageChange={setPage}
          variant="compact"
          itemLabel="body types"
          currentCount={bodyTypes.length}
        />
      </div>

      {modalOpen && (
        <BodyTypeModal
          key={editingBodyType ? `edit-${editingBodyType.id}` : "add"}
          open={modalOpen}
          onClose={closeModal}
          bodyType={editingBodyType}
        />
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete body type?"
        itemName={pendingDelete?.name}
        loading={deletingId === pendingDelete?.id}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}