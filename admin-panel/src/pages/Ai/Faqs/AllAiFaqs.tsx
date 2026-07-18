// src/pages/Ai/Faqs/AllAiFaqs.tsx
import { useEffect, useState } from "react";
import {
  useGetAiFaqsQuery,
  useApproveAiFaqMutation,
  useRejectAiFaqMutation,
  usePublishAiFaqMutation,
  useDeleteAiFaqMutation,
  type AiFaqRecord,
} from "./aiFaq.api";
import { extractApiError } from "../../../lib/apiClient";
import { AI_FAQ_STATUS, AI_FAQ_STATUS_OPTIONS, getAiFaqStatusLabel, getAiProviderLabel } from "../../../lib/aiLookups";
import AiFaqEditModal from "./AiFaqEditModal";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, SearchInput } from "../../../components/common/SearchFilterBar";
import ConfirmDialog from "../../../components/common/ConfirmDialog";

const ACCENT = "#D4300F";
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const STATUS_STYLES: Record<number, { bg: string; text: string }> = {
  [AI_FAQ_STATUS.PENDING]: { bg: "#f7f5f1", text: "#7a7670" },
  [AI_FAQ_STATUS.APPROVED]: { bg: "#eef6ff", text: "#1d72c4" },
  [AI_FAQ_STATUS.REJECTED]: { bg: "#fef2f0", text: ACCENT },
  [AI_FAQ_STATUS.PUBLISHED]: { bg: "#f0fdf4", text: "#15803d" },
};

function StatusBadge({ status }: { status: number }) {
  const s = STATUS_STYLES[status] ?? { bg: "#f7f5f1", text: "#7a7670" };
  return (
    <span
      className="inline-block text-[10.5px] font-bold px-2.5 py-1 rounded-full"
      style={{ background: s.bg, color: s.text }}
    >
      {getAiFaqStatusLabel(status)}
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

export default function AllAiFaqs() {
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
    data: aiFaqsData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetAiFaqsQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
  });

  const aiFaqs = aiFaqsData?.data ?? [];
  const pagination = aiFaqsData?.pagination;
  const loading = isLoading || isFetching;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";

  const [editingFaq, setEditingFaq] = useState<AiFaqRecord | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AiFaqRecord | null>(null);

  const [approveAiFaq] = useApproveAiFaqMutation();
  const [rejectAiFaq] = useRejectAiFaqMutation();
  const [publishAiFaq] = usePublishAiFaqMutation();
  const [deleteAiFaq] = useDeleteAiFaqMutation();

  const [actingId, setActingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  const handleApprove = async (faq: AiFaqRecord) => {
    setActionError("");
    setActingId(faq.id);
    try {
      await approveAiFaq(faq.id).unwrap();
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (faq: AiFaqRecord) => {
    setActionError("");
    setActingId(faq.id);
    try {
      await rejectAiFaq(faq.id).unwrap();
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setActingId(null);
    }
  };

  const handlePublish = async (faq: AiFaqRecord) => {
    setActionError("");
    setActingId(faq.id);
    try {
      await publishAiFaq(faq.id).unwrap();
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
      await deleteAiFaq(pendingDelete.id).unwrap();
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

  const columns: DataTableColumn<AiFaqRecord>[] = [
    {
      header: "Model",
      render: (f) => (
        <span className="font-semibold text-[#1c1a17] block max-w-[110px] truncate" title={`${f.model.brand.name} ${f.model.name}`}>
          {f.model.brand.name} {f.model.name}
        </span>
      ),
    },
    {
      header: "Question",
      render: (f) => (
        <span className="text-[#4a4640] block max-w-[240px] truncate" title={f.question}>
          {f.question}
        </span>
      ),
    },
    {
      header: "Provider",
      render: (f) => (
        <div className="max-w-[110px]">
          <p className="text-[#4a4640] truncate">{getAiProviderLabel(f.aiProvider)}</p>
          <p className="text-[10px] text-[#a39e96] mt-0.5 truncate" title={f.aiModel}>{f.aiModel}</p>
        </div>
      ),
    },
    {
      header: "Status",
      render: (f) => <StatusBadge status={f.status} />,
    },
    {
      header: "Reviewed",
      render: (f) => (
        <div className="whitespace-nowrap max-w-[100px]">
          <p className="text-[#1c1a17] font-semibold truncate" title={f.reviewedByAdmin?.name ?? undefined}>
            {f.reviewedByAdmin?.name ?? "—"}
          </p>
          <p className="text-[10px] text-[#a39e96] mt-0.5">{fmtDate(f.reviewedAt)}</p>
        </div>
      ),
    },
    {
      header: "",
      align: "right",
      render: (f) => {
        const busy = actingId === f.id;
        return (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            {(f.status === AI_FAQ_STATUS.PENDING || f.status === AI_FAQ_STATUS.APPROVED) && (
              <button
                onClick={() => setEditingFaq(f)}
                disabled={busy}
                className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors disabled:opacity-50"
              >
                Edit
              </button>
            )}
            {f.status === AI_FAQ_STATUS.PENDING && (
              <button
                onClick={() => handleApprove(f)}
                disabled={busy}
                className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-emerald-100 text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
              >
                {busy ? "..." : "Approve"}
              </button>
            )}
            {(f.status === AI_FAQ_STATUS.PENDING || f.status === AI_FAQ_STATUS.APPROVED) && (
              <button
                onClick={() => handleReject(f)}
                disabled={busy}
                className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {busy ? "..." : "Reject"}
              </button>
            )}
            {f.status === AI_FAQ_STATUS.APPROVED && (
              <button
                onClick={() => handlePublish(f)}
                disabled={busy}
                className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: ACCENT }}
              >
                {busy ? "..." : "Publish"}
              </button>
            )}
            {f.status === AI_FAQ_STATUS.REJECTED && (
              <button
                onClick={() => setPendingDelete(f)}
                disabled={busy}
                className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                Delete
              </button>
            )}
            {f.status === AI_FAQ_STATUS.PUBLISHED && (
              <span className="text-[10px] text-[#a39e96]">Locked — FAQ #{f.publishedFaqId}</span>
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
          <h1 className="text-[18px] font-black text-[#1c1a17]">AI FAQ Review</h1>
          <p className="text-[12px] text-[#a39e96] mt-0.5">
            Review, edit, approve or reject AI-generated FAQs. Publishing sends one live into the real FAQ list.
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
                {pagination.total} FAQ{pagination.total === 1 ? "" : "s"} total
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
              {AI_FAQ_STATUS_OPTIONS.map((o) => (
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
          placeholder="Search by question..."
          width="320px"
        />
      </SearchFilterBar>

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={aiFaqs}
          rowKey={(f) => f.id}
          loading={loading}
          error={error}
          loadingMessage="Loading AI FAQs..."
          emptyMessage="No AI-generated FAQs found."
          expandable
          renderExpanded={(f) => (
            <div className="space-y-2 text-[12px]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1">Question</p>
                <p className="text-[#1c1a17]">{f.question}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1">Answer</p>
                <p className="text-[#4a4640] whitespace-pre-wrap">{f.answer}</p>
              </div>
              <p className="text-[10px] text-[#a39e96] pt-1">
                Generated {fmtDate(f.createdAt)}
                {f.publishedFaqId ? ` · Published as real FAQ #${f.publishedFaqId}` : ""}
              </p>
            </div>
          )}
        />
        <Pagination
          pagination={pagination ?? null}
          onPageChange={setPage}
          variant="compact"
          itemLabel="AI FAQs"
          currentCount={aiFaqs.length}
        />
      </div>

      <AiFaqEditModal open={!!editingFaq} onClose={() => setEditingFaq(null)} faq={editingFaq} />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete rejected AI FAQ?"
        itemName={pendingDelete?.question}
        loading={actingId === pendingDelete?.id}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}