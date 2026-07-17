// src/pages/Ads/Advertisers/AllAdvertisers.tsx
import { useEffect, useState } from "react";
import {
  useGetAdvertisersQuery,
  useUpdateAdvertiserStatusMutation,
  useDeleteAdvertiserMutation,
  type AdvertiserRecord,
} from "./advertiser.api";
import { extractApiError } from "../../../lib/apiClient";
import AdvertiserModal from "./AdvertiserModal";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, SearchInput } from "../../../components/common/SearchFilterBar";
import ConfirmDialog from "../../../components/common/ConfirmDialog";

const ACCENT = "#D4300F";
// Rows-per-page choices shown in the dropdown — same set as AllCountries.tsx.
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// No year — keeps the Created/Updated columns narrow enough to avoid
// horizontal scroll, same fix as AllStoryItems.tsx's formatDateTime.
function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Small pill-style toggle switch — same pattern as AllPlacements.tsx's
// StatusToggle.
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

export default function AllAdvertisers() {
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
    data: advertisersData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetAdvertisersQuery({ page, limit, search: debouncedSearch || undefined });

  const advertisers = advertisersData?.data ?? [];
  const pagination = advertisersData?.pagination;
  const loading = isLoading || isFetching;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";

  // Modal state — null advertiser = "Add" mode, a record = "Edit" mode.
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAdvertiser, setEditingAdvertiser] = useState<AdvertiserRecord | null>(null);

  const openAddModal = () => {
    setEditingAdvertiser(null);
    setModalOpen(true);
  };

  const openEditModal = (advertiser: AdvertiserRecord) => {
    setEditingAdvertiser(advertiser);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingAdvertiser(null);
  };

  const [updateAdvertiserStatus] = useUpdateAdvertiserStatusMutation();
  const [deleteAdvertiser] = useDeleteAdvertiserMutation();

  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdvertiserRecord | null>(null);
  const [actionError, setActionError] = useState("");

  const handleToggleStatus = async (advertiser: AdvertiserRecord) => {
    setActionError("");
    setTogglingId(advertiser.id);
    try {
      await updateAdvertiserStatus({ id: advertiser.id, isActive: !advertiser.isActive }).unwrap();
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
      await deleteAdvertiser(pendingDelete.id).unwrap();
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

  const columns: DataTableColumn<AdvertiserRecord>[] = [
    {
      header: "Name",
      render: (a) => (
        <span className="font-semibold text-[#1c1a17] block max-w-[110px] truncate" title={a.name}>
          {a.name}
        </span>
      ),
    },
    {
      // Contact person + mobile stacked into one column (instead of two
      // separate ones) — frees up a whole column's worth of padding,
      // same space-saving idea as the Created/Updated stacked cells.
      header: "Contact",
      render: (a) => (
        <div className="max-w-[100px]">
          <p className="text-[#7a7670] truncate" title={a.contactName ?? undefined}>
            {a.contactName ?? "—"}
          </p>
          <p className="text-[10px] text-[#a39e96] mt-0.5 whitespace-nowrap">{a.contactMobile ?? "—"}</p>
        </div>
      ),
    },
    {
      header: "Email",
      render: (a) => (
        <span className="text-[#7a7670] block max-w-[130px] truncate" title={a.contactEmail ?? undefined}>
          {a.contactEmail ?? "—"}
        </span>
      ),
    },
    {
      header: "Campaigns",
      render: (a) => (
        <span className="inline-flex items-center justify-center text-[11px] font-bold bg-[#f7f5f1] text-[#4a4640] rounded-full px-2.5 py-0.5">
          {a.campaignCount}
        </span>
      ),
    },
    {
      header: "Status",
      render: (a) => (
        <div className="flex items-center gap-2">
          <StatusToggle
            checked={a.isActive}
            disabled={togglingId === a.id}
            onChange={() => handleToggleStatus(a)}
          />
          <span className={`text-[10px] font-bold ${a.isActive ? "text-green-600" : "text-[#a39e96]"}`}>
            {a.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      ),
    },
    {
      header: "Created",
      render: (a) => (
        <div className="whitespace-nowrap max-w-[95px]">
          <p className="text-[#1c1a17] font-semibold truncate" title={a.createdByAdmin?.name ?? undefined}>
            {a.createdByAdmin?.name ?? "—"}
          </p>
          <p className="text-[10px] text-[#a39e96] mt-0.5">{fmtDate(a.createdAt)}</p>
        </div>
      ),
    },
    {
      header: "Updated",
      render: (a) => (
        <div className="whitespace-nowrap max-w-[95px]">
          <p className="text-[#1c1a17] font-semibold truncate" title={a.updatedByAdmin?.name ?? undefined}>
            {a.updatedByAdmin?.name ?? "—"}
          </p>
          <p className="text-[10px] text-[#a39e96] mt-0.5">{fmtDate(a.updatedAt)}</p>
        </div>
      ),
    },
    {
      header: "",
      align: "right",
      render: (a) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openEditModal(a)}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => setPendingDelete(a)}
            disabled={deletingId === a.id}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deletingId === a.id ? "..." : "Delete"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-[1300px]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[18px] font-black text-[#1c1a17]">Advertisers</h1>
          <p className="text-[12px] text-[#a39e96] mt-0.5">
            Manage advertiser / client contact records used when creating ad campaigns.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="cursor-pointer text-[12px] font-bold text-white px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          + Add advertiser
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
                {pagination.total} advertiser{pagination.total === 1 ? "" : "s"} total
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
          placeholder="Search by name, contact, mobile or email..."
          width="320px"
        />
      </SearchFilterBar>

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={advertisers}
          rowKey={(a) => a.id}
          loading={loading}
          error={error}
          loadingMessage="Loading advertisers..."
          emptyMessage="No advertisers found."
        />
        <Pagination
          pagination={pagination ?? null}
          onPageChange={setPage}
          variant="compact"
          itemLabel="advertisers"
          currentCount={advertisers.length}
        />
      </div>

      <AdvertiserModal open={modalOpen} onClose={closeModal} advertiser={editingAdvertiser} />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete advertiser?"
        itemName={pendingDelete?.name}
        loading={deletingId === pendingDelete?.id}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}