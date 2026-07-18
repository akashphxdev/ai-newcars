// src/pages/Ai/Stories/AllAiStoryItems.tsx
import { useEffect, useState } from "react";
import {
  useGetAiStoryItemsQuery,
  useApproveAiStoryItemMutation,
  useRejectAiStoryItemMutation,
  usePublishAiStoryItemMutation,
  useDeleteAiStoryItemMutation,
  type AiStoryItemRecord,
} from "./aiStoryItem.api";
import { extractApiError, getUploadUrl } from "../../../lib/apiClient";
import {
  AI_STORY_ITEM_STATUS,
  AI_STORY_ITEM_STATUS_OPTIONS,
  getAiStoryItemStatusLabel,
  getAiProviderLabel,
} from "../../../lib/aiLookups";
import AiStoryItemEditModal from "./AiStoryItemEditModal";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, SearchInput } from "../../../components/common/SearchFilterBar";
import ConfirmDialog from "../../../components/common/ConfirmDialog";

const ACCENT = "#D4300F";
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const STATUS_STYLES: Record<number, { bg: string; text: string }> = {
  [AI_STORY_ITEM_STATUS.PENDING]: { bg: "#f7f5f1", text: "#7a7670" },
  [AI_STORY_ITEM_STATUS.APPROVED]: { bg: "#eef6ff", text: "#1d72c4" },
  [AI_STORY_ITEM_STATUS.REJECTED]: { bg: "#fef2f0", text: ACCENT },
  [AI_STORY_ITEM_STATUS.PUBLISHED]: { bg: "#f0fdf4", text: "#15803d" },
};

function StatusBadge({ status }: { status: number }) {
  const s = STATUS_STYLES[status] ?? { bg: "#f7f5f1", text: "#7a7670" };
  return (
    <span
      className="inline-block text-[10.5px] font-bold px-2.5 py-1 rounded-full"
      style={{ background: s.bg, color: s.text }}
    >
      {getAiStoryItemStatusLabel(status)}
    </span>
  );
}

// No year — same date-formatting fix as AllAdvertisers.tsx/AllStoryItems.tsx
// to keep the Reviewed column from forcing horizontal scroll.
function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AllAiStoryItems() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<number | "">("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data: aiStoryItemsData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetAiStoryItemsQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
  });

  const aiStoryItems = aiStoryItemsData?.data ?? [];
  const pagination = aiStoryItemsData?.pagination;
  const loading = isLoading || isFetching;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";

  const [editingItem, setEditingItem] = useState<AiStoryItemRecord | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AiStoryItemRecord | null>(null);

  const [approveAiStoryItem] = useApproveAiStoryItemMutation();
  const [rejectAiStoryItem] = useRejectAiStoryItemMutation();
  const [publishAiStoryItem] = usePublishAiStoryItemMutation();
  const [deleteAiStoryItem] = useDeleteAiStoryItemMutation();

  const [actingId, setActingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  const handleApprove = async (item: AiStoryItemRecord) => {
    setActionError("");
    setActingId(item.id);
    try {
      await approveAiStoryItem(item.id).unwrap();
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (item: AiStoryItemRecord) => {
    setActionError("");
    setActingId(item.id);
    try {
      await rejectAiStoryItem(item.id).unwrap();
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setActingId(null);
    }
  };

  const handlePublish = async (item: AiStoryItemRecord) => {
    setActionError("");
    setActingId(item.id);
    try {
      await publishAiStoryItem(item.id).unwrap();
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setActingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setActionError("");
    setActingId(pendingDelete.id);
    try {
      await deleteAiStoryItem(pendingDelete.id).unwrap();
      setPendingDelete(null);
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setActingId(null);
    }
  };

  const handleLimitChange = (value: number) => {
    setLimit(value);
    setPage(1);
  };

  const columns: DataTableColumn<AiStoryItemRecord>[] = [
    {
      header: "Image",
      render: (i) => (
        <div className="w-11 h-11 rounded-lg overflow-hidden border border-[#e8e4dc] bg-[#f7f5f1] shrink-0">
          <img
            src={getUploadUrl(i.mediaUrl) ?? undefined}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      ),
    },
    {
      header: "Group",
      render: (i) => (
        <span className="font-semibold text-[#1c1a17] block max-w-[110px] truncate" title={i.group.title}>
          {i.group.title}
        </span>
      ),
    },
    {
      header: "Caption",
      render: (i) => (
        <span className="text-[#4a4640] block max-w-[240px] truncate" title={i.description}>
          {i.description}
        </span>
      ),
    },
    {
      header: "Provider",
      render: (i) => (
        <div className="max-w-[110px]">
          <p className="text-[#4a4640] truncate">{getAiProviderLabel(i.aiProvider)}</p>
          <p className="text-[10px] text-[#a39e96] mt-0.5 truncate" title={i.aiModel}>{i.aiModel}</p>
        </div>
      ),
    },
    {
      header: "Status",
      render: (i) => <StatusBadge status={i.status} />,
    },
    {
      header: "Reviewed",
      render: (i) => (
        <div className="whitespace-nowrap max-w-[100px]">
          <p className="text-[#1c1a17] font-semibold truncate" title={i.reviewedByAdmin?.name ?? undefined}>
            {i.reviewedByAdmin?.name ?? "—"}
          </p>
          <p className="text-[10px] text-[#a39e96] mt-0.5">{fmtDate(i.reviewedAt)}</p>
        </div>
      ),
    },
    {
      header: "",
      align: "right",
      render: (i) => {
        const busy = actingId === i.id;
        return (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            {(i.status === AI_STORY_ITEM_STATUS.PENDING || i.status === AI_STORY_ITEM_STATUS.APPROVED) && (
              <button
                onClick={() => setEditingItem(i)}
                disabled={busy}
                className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors disabled:opacity-50"
              >
                Edit
              </button>
            )}
            {i.status === AI_STORY_ITEM_STATUS.PENDING && (
              <button
                onClick={() => handleApprove(i)}
                disabled={busy}
                className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-emerald-100 text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
              >
                {busy ? "..." : "Approve"}
              </button>
            )}
            {(i.status === AI_STORY_ITEM_STATUS.PENDING || i.status === AI_STORY_ITEM_STATUS.APPROVED) && (
              <button
                onClick={() => handleReject(i)}
                disabled={busy}
                className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {busy ? "..." : "Reject"}
              </button>
            )}
            {i.status === AI_STORY_ITEM_STATUS.APPROVED && (
              <button
                onClick={() => handlePublish(i)}
                disabled={busy}
                className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: ACCENT }}
              >
                {busy ? "..." : "Publish"}
              </button>
            )}
            {i.status === AI_STORY_ITEM_STATUS.REJECTED && (
              <button
                onClick={() => setPendingDelete(i)}
                disabled={busy}
                className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                Delete
              </button>
            )}
            {i.status === AI_STORY_ITEM_STATUS.PUBLISHED && (
              <span className="text-[10px] text-[#a39e96]">Locked — Story item #{i.publishedStoryItemId}</span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-5 max-w-[1300px]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[18px] font-black text-[#1c1a17]">AI Story Review</h1>
          <p className="text-[12px] text-[#a39e96] mt-0.5">
            Review, edit, approve or reject AI-generated story captions. Publishing sends one live into the real story group.
          </p>
        </div>
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
                {pagination.total} item{pagination.total === 1 ? "" : "s"} total
              </p>
            )}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value ? Number(e.target.value) : "");
                setPage(1);
              }}
              className="cursor-pointer text-[12px] text-[#4a4640] bg-[#f7f5f1] border border-[#e8e4dc] rounded-lg px-3 py-2 outline-none"
            >
              <option value="">All statuses</option>
              {AI_STORY_ITEM_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[#a39e96] whitespace-nowrap">Rows per page</span>
              <select
                value={limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="cursor-pointer text-[12px] text-[#4a4640] bg-[#f7f5f1] border border-[#e8e4dc] rounded-lg px-3 py-2 outline-none"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
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
          placeholder="Search by caption..."
          width="320px"
        />
      </SearchFilterBar>

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={aiStoryItems}
          rowKey={(i) => i.id}
          loading={loading}
          error={error}
          loadingMessage="Loading AI story items..."
          emptyMessage="No AI-generated story items found."
          expandable
          renderExpanded={(i) => (
            <div className="space-y-3 text-[12px]">
              <div className="w-40 h-40 rounded-lg overflow-hidden border border-[#e8e4dc] bg-[#f7f5f1]">
                <img
                  src={getUploadUrl(i.mediaUrl) ?? undefined}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1">Caption</p>
                <p className="text-[#4a4640] whitespace-pre-wrap">{i.description}</p>
              </div>
              <p className="text-[10px] text-[#a39e96] pt-1">
                Generated {fmtDate(i.createdAt)}
                {i.publishedStoryItemId ? ` · Published as real story item #${i.publishedStoryItemId}` : ""}
              </p>
            </div>
          )}
        />
        <Pagination
          pagination={pagination ?? null}
          onPageChange={setPage}
          variant="compact"
          itemLabel="AI story items"
          currentCount={aiStoryItems.length}
        />
      </div>

      <AiStoryItemEditModal open={!!editingItem} onClose={() => setEditingItem(null)} item={editingItem} />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete rejected AI story item?"
        itemName={pendingDelete?.description}
        loading={actingId === pendingDelete?.id}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
