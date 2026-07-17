// src/pages/Ads/Campaigns/AllCampaigns.tsx
import { useEffect, useState } from "react";
import {
  useGetAdCampaignsQuery,
  useUpdateAdCampaignStatusMutation,
  useDeleteAdCampaignMutation,
  type AdCampaignRecord,
  type CampaignStatus,
} from "./adCampaign.api";
import { useGetAdPlacementsQuery } from "../Placements/placement.api";
import { extractApiError, getUploadUrl } from "../../../lib/apiClient";
import CampaignModal from "./CampaignModal";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, SearchInput, FilterSelect } from "../../../components/common/SearchFilterBar";
import ConfirmDialog from "../../../components/common/ConfirmDialog";

const ACCENT = "#D4300F";
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const STATUS_OPTIONS: CampaignStatus[] = ["active", "paused", "expired"];

const STATUS_STYLES: Record<CampaignStatus, { bg: string; text: string }> = {
  active: { bg: "#e9f7ef", text: "#1e8a4c" },
  paused: { bg: "#fff4e5", text: "#b8720a" },
  expired: { bg: "#f7f5f1", text: "#a39e96" },
};

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

function StatusSelect({
  value,
  onChange,
  disabled,
}: {
  value: CampaignStatus;
  onChange: (next: CampaignStatus) => void;
  disabled?: boolean;
}) {
  const style = STATUS_STYLES[value];
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as CampaignStatus)}
      className="cursor-pointer text-[10px] font-bold uppercase px-2 py-1 rounded-lg border-0 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ background: style.bg, color: style.text }}
    >
      {STATUS_OPTIONS.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}

function CreativeThumb({ campaign }: { campaign: AdCampaignRecord }) {
  return (
    <img
      src={getUploadUrl(campaign.creativeImageUrl) ?? undefined}
      alt=""
      className="w-9 h-9 rounded-lg object-cover border border-[#e8e4dc]"
    />
  );
}

export default function AllCampaigns() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterPlacementId, setFilterPlacementId] = useState<number | "">("");
  const [filterStatus, setFilterStatus] = useState<CampaignStatus | "">("");

  const { data: placementsData } = useGetAdPlacementsQuery({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const placements = placementsData?.data ?? [];

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data: campaignsData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetAdCampaignsQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
    placementId: filterPlacementId || undefined,
    status: filterStatus || undefined,
    sortBy: "priority",
    sortOrder: "desc",
  });

  const campaigns = campaignsData?.data ?? [];
  const pagination = campaignsData?.pagination;
  const loading = isLoading || isFetching;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<AdCampaignRecord | null>(null);

  const openAddModal = () => {
    setEditingCampaign(null);
    setModalOpen(true);
  };

  const openEditModal = (campaign: AdCampaignRecord) => {
    setEditingCampaign(campaign);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCampaign(null);
  };

  const [updateAdCampaignStatus] = useUpdateAdCampaignStatusMutation();
  const [deleteAdCampaign] = useDeleteAdCampaignMutation();

  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdCampaignRecord | null>(null);
  const [actionError, setActionError] = useState("");

  const handleStatusChange = async (campaign: AdCampaignRecord, next: CampaignStatus) => {
    setActionError("");
    setTogglingId(campaign.id);
    try {
      await updateAdCampaignStatus({ id: campaign.id, status: next }).unwrap();
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
      await deleteAdCampaign(pendingDelete.id).unwrap();
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

  const columns: DataTableColumn<AdCampaignRecord>[] = [
    { header: "Creative", render: (c) => <CreativeThumb campaign={c} /> },
    {
      header: "Name",
      render: (c) => (
        <span className="font-semibold text-[#1c1a17] block max-w-[160px] truncate" title={c.name}>
          {c.name}
        </span>
      ),
    },
    {
      header: "Placement",
      render: (c) => (
        <span className="text-[#7a7670] block max-w-[130px] truncate" title={c.placement.name}>
          {c.placement.name}
        </span>
      ),
    },
    { header: "Advertiser", render: (c) => <span className="text-[#7a7670]">{c.advertiser?.name ?? "—"}</span> },
    { header: "Priority", render: (c) => <span className="text-[#7a7670]">{c.priority}</span> },
    {
      header: "Status",
      render: (c) => (
        <StatusSelect
          value={c.status}
          disabled={togglingId === c.id}
          onChange={(next) => handleStatusChange(c, next)}
        />
      ),
    },
    {
      header: "Schedule",
      render: (c) => (
        <div className="whitespace-nowrap">
          <p className="text-[#7a7670]">{c.startDate ? fmtDate(c.startDate) : "No start"}</p>
          <p className="text-[10px] text-[#a39e96] mt-0.5">{c.endDate ? `→ ${fmtDate(c.endDate)}` : "No end"}</p>
        </div>
      ),
    },
    {
      header: "Created",
      render: (c) => (
        <div className="whitespace-nowrap">
          <p className="text-[#1c1a17] font-semibold">{c.createdByAdmin?.name ?? "—"}</p>
          <p className="text-[10px] text-[#a39e96] mt-0.5">{fmtDate(c.createdAt)}</p>
        </div>
      ),
    },
    {
      header: "",
      align: "right",
      render: (c) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openEditModal(c)}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => setPendingDelete(c)}
            disabled={deletingId === c.id}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deletingId === c.id ? "..." : "Delete"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[18px] font-black text-[#1c1a17]">Ad Campaigns</h1>
          <p className="text-[12px] text-[#a39e96] mt-0.5">
            Manage ad campaigns booked against your placements.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="cursor-pointer text-[12px] font-bold text-white px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          + Add campaign
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
                {pagination.total} campaign{pagination.total === 1 ? "" : "s"} total
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
          value={filterPlacementId}
          onChange={(v) => {
            setFilterPlacementId(v ? Number(v) : "");
            setPage(1);
          }}
          options={placements.map((p) => ({ value: p.id, label: p.name }))}
          placeholder="All placements"
        />
        <FilterSelect
          value={filterStatus}
          onChange={(v) => {
            setFilterStatus((v as CampaignStatus) || "");
            setPage(1);
          }}
          options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
          placeholder="All statuses"
        />
      </SearchFilterBar>

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={campaigns}
          rowKey={(c) => c.id}
          loading={loading}
          error={error}
          loadingMessage="Loading campaigns..."
          emptyMessage="No ad campaigns found."
        />
        <Pagination
          pagination={pagination ?? null}
          onPageChange={setPage}
          variant="compact"
          itemLabel="campaigns"
          currentCount={campaigns.length}
        />
      </div>

      <CampaignModal
        key={editingCampaign ? `edit-${editingCampaign.id}` : "add"}
        open={modalOpen}
        onClose={closeModal}
        campaign={editingCampaign}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete campaign?"
        itemName={pendingDelete?.name}
        message={
          pendingDelete
            ? "Campaigns that already have impressions/clicks logged can't be deleted."
            : undefined
        }
        loading={deletingId === pendingDelete?.id}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
