// src/pages/Ads/Placements/AllPlacements.tsx
import { useEffect, useState } from "react";
import {
  useGetAdPlacementsQuery,
  useUpdateAdPlacementStatusMutation,
  useDeleteAdPlacementMutation,
  type AdPlacementRecord,
} from "./placement.api";
import { extractApiError } from "../../../lib/apiClient";
import PlacementModal from "./PlacementModal";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, SearchInput } from "../../../components/common/SearchFilterBar";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { getPageTypeLabel, getAdTypeLabel } from "../../../lib/lookups";

const ACCENT = "#D4300F";
// Rows-per-page choices shown in the dropdown — same set as AllCountries.tsx.
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

// Small pill-style toggle switch — same pattern as AllCountries.tsx's
// StatusToggle / AllArticleCategories.tsx's StatusToggle.
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

export default function AllPlacements() {
  const [page, setPage] = useState(1);
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
    data: placementsData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetAdPlacementsQuery({ page, limit, search: debouncedSearch || undefined });

  const placements = placementsData?.data ?? [];
  const pagination = placementsData?.pagination;
  const loading = isLoading || isFetching;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";

  // Modal state — null placement = "Add" mode, a record = "Edit" mode.
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlacement, setEditingPlacement] = useState<AdPlacementRecord | null>(null);

  const openAddModal = () => {
    setEditingPlacement(null);
    setModalOpen(true);
  };

  const openEditModal = (placement: AdPlacementRecord) => {
    setEditingPlacement(placement);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingPlacement(null);
  };

  const [updateAdPlacementStatus] = useUpdateAdPlacementStatusMutation();
  const [deleteAdPlacement] = useDeleteAdPlacementMutation();

  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdPlacementRecord | null>(null);
  const [actionError, setActionError] = useState("");

  const handleToggleStatus = async (placement: AdPlacementRecord) => {
    setActionError("");
    setTogglingId(placement.id);
    try {
      await updateAdPlacementStatus({ id: placement.id, isActive: !placement.isActive }).unwrap();
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
      await deleteAdPlacement(pendingDelete.id).unwrap();
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

  const columns: DataTableColumn<AdPlacementRecord>[] = [
    { header: "Name", render: (p) => <span className="font-semibold text-[#1c1a17]">{p.name}</span> },
    { header: "Slug", render: (p) => <span className="text-[#7a7670] font-mono text-[11px]">{p.slug}</span> },
    { header: "Page type", render: (p) => <span className="text-[#7a7670]">{getPageTypeLabel(p.pageType)}</span> },
    { header: "Ad type", render: (p) => <span className="text-[#7a7670]">{getAdTypeLabel(p.adType)}</span> },
    { header: "Dimensions", render: (p) => <span className="text-[#7a7670]">{p.dimensions ?? "—"}</span> },
    {
      header: "Campaigns",
      render: (p) => (
        <span className="inline-flex items-center justify-center text-[11px] font-bold bg-[#f7f5f1] text-[#4a4640] rounded-full px-2.5 py-0.5">
          {p.campaignCount}
        </span>
      ),
    },
    {
      header: "Status",
      render: (p) => (
        <div className="flex items-center gap-2">
          <StatusToggle
            checked={p.isActive}
            disabled={togglingId === p.id}
            onChange={() => handleToggleStatus(p)}
          />
          <span className={`text-[10px] font-bold ${p.isActive ? "text-green-600" : "text-[#a39e96]"}`}>
            {p.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      ),
    },
    {
      header: "Created",
      render: (p) => (
        <div className="whitespace-nowrap">
          <p className="text-[#1c1a17] font-semibold">{p.createdByAdmin?.name ?? "—"}</p>
          <p className="text-[10px] text-[#a39e96] mt-0.5">{fmtDate(p.createdAt)}</p>
        </div>
      ),
    },
    {
      header: "Updated",
      render: (p) => (
        <div className="whitespace-nowrap">
          <p className="text-[#1c1a17] font-semibold">{p.updatedByAdmin?.name ?? "—"}</p>
          <p className="text-[10px] text-[#a39e96] mt-0.5">{fmtDate(p.updatedAt)}</p>
        </div>
      ),
    },
    {
      header: "",
      align: "right",
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openEditModal(p)}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => setPendingDelete(p)}
            disabled={deletingId === p.id}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deletingId === p.id ? "..." : "Delete"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[18px] font-black text-[#1c1a17]">Ad Placements</h1>
          <p className="text-[12px] text-[#a39e96] mt-0.5">
            Manage the ad slots on your site — each slug is a permanent address the frontend looks up by.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="cursor-pointer text-[12px] font-bold text-white px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          + Add placement
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
                {pagination.total} placement{pagination.total === 1 ? "" : "s"} total
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
          width="280px"
        />
      </SearchFilterBar>

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={placements}
          rowKey={(p) => p.id}
          loading={loading}
          error={error}
          loadingMessage="Loading placements..."
          emptyMessage="No ad placements found."
        />
        <Pagination
          pagination={pagination ?? null}
          onPageChange={setPage}
          variant="compact"
          itemLabel="placements"
          currentCount={placements.length}
        />
      </div>

      <PlacementModal open={modalOpen} onClose={closeModal} placement={editingPlacement} />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete placement?"
        itemName={pendingDelete?.name}
        loading={deletingId === pendingDelete?.id}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}