// src/pages/Ads/Clicks/AllClicks.tsx
import { useState } from "react";
import { useGetAdClicksQuery, useDeleteAdClickMutation, type AdClickRecord } from "./adClick.api";
import { useGetAdCampaignsQuery } from "../Campaigns/adCampaign.api";
import { extractApiError } from "../../../lib/apiClient";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, FilterSelect } from "../../../components/common/SearchFilterBar";
import ConfirmDialog from "../../../components/common/ConfirmDialog";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AllClicks() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filterCampaignId, setFilterCampaignId] = useState<number | "">("");

  const { data: campaignsData } = useGetAdCampaignsQuery({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const campaigns = campaignsData?.data ?? [];

  const {
    data: clicksData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetAdClicksQuery({ page, limit, campaignId: filterCampaignId || undefined });

  const clicks = clicksData?.data ?? [];
  const pagination = clicksData?.pagination;
  const loading = isLoading || isFetching;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";

  const [deleteAdClick] = useDeleteAdClickMutation();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdClickRecord | null>(null);
  const [actionError, setActionError] = useState("");

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setActionError("");
    setDeletingId(pendingDelete.id);
    try {
      await deleteAdClick(pendingDelete.id).unwrap();
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

  const columns: DataTableColumn<AdClickRecord>[] = [
    { header: "Campaign", render: (c) => <span className="font-semibold text-[#1c1a17]">{c.campaign.name}</span> },
    { header: "Placement", render: (c) => <span className="text-[#7a7670]">{c.placement?.name ?? "—"}</span> },
    {
      header: "Page URL",
      render: (c) => (
        <span className="text-[#7a7670] block max-w-[220px] truncate" title={c.pageUrl ?? undefined}>
          {c.pageUrl ?? "—"}
        </span>
      ),
    },
    { header: "Device", render: (c) => <span className="text-[#7a7670]">{c.deviceType ?? "—"}</span> },
    {
      header: "IP",
      className: "font-mono",
      render: (c) => <span className="text-[#a39e96]">{c.ipAddress ?? "—"}</span>,
    },
    {
      header: "Clicked at",
      render: (c) => <span className="text-[#7a7670] whitespace-nowrap">{fmtDate(c.clickedAt)}</span>,
    },
    {
      header: "",
      align: "right",
      render: (c) => (
        <button
          onClick={() => setPendingDelete(c)}
          disabled={deletingId === c.id}
          className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {deletingId === c.id ? "..." : "Delete"}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-[1300px]">
      <div>
        <h1 className="text-[18px] font-black text-[#1c1a17]">Ad Clicks</h1>
        <p className="text-[12px] text-[#a39e96] mt-0.5">
          Raw click events recorded whenever a visitor clicks an ad — recorded automatically by the live site.
        </p>
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
                {pagination.total} click{pagination.total === 1 ? "" : "s"} total
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
        <FilterSelect
          value={filterCampaignId}
          onChange={(v) => {
            setFilterCampaignId(v ? Number(v) : "");
            setPage(1);
          }}
          options={campaigns.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="All campaigns"
        />
      </SearchFilterBar>

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={clicks}
          rowKey={(c) => c.id}
          loading={loading}
          error={error}
          loadingMessage="Loading clicks..."
          emptyMessage="No clicks recorded yet."
        />
        <Pagination
          pagination={pagination ?? null}
          onPageChange={setPage}
          variant="compact"
          itemLabel="clicks"
          currentCount={clicks.length}
        />
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this click record?"
        loading={deletingId === pendingDelete?.id}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
