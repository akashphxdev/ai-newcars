// src/pages/Reviews/AllReviews/AllReviews.tsx
import { useEffect, useState } from "react";
import {
  useGetReviewsQuery,
  useUpdateReviewStatusMutation,
  useDeleteReviewMutation,
  type ReviewRecord,
} from "./review.api";
import { useGetCarModelOptionsQuery } from "../../newCars/carModels/carModel.api";
import { extractApiError } from "../../../lib/apiClient";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import PromptDialog from "../../../components/common/PromptDialog";
import ReviewExpandedDetail from "./ReviewExpandedDetail";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const STATUS_OPTIONS: { value: ReviewRecord["status"]; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_STYLES: Record<ReviewRecord["status"], string> = {
  pending: "bg-[#f7f5f1] text-[#a39e96]",
  approved: "bg-green-50 text-green-600",
  rejected: "bg-red-50 text-red-500",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AllReviews() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [modelId, setModelId] = useState<number | "">("");
  const [status, setStatus] = useState<ReviewRecord["status"] | "">("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: carModels = [] } = useGetCarModelOptionsQuery();

  const {
    data,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetReviewsQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
    modelId: modelId || undefined,
    status: status || undefined,
    isVerifiedOwner: verifiedOnly || undefined,
  });

  const reviews = data?.data ?? [];
  const pagination = data?.pagination ?? null;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";
  const loading = isLoading || isFetching;

  const [updateStatus] = useUpdateReviewStatusMutation();
  const [deleteReview] = useDeleteReviewMutation();
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingReject, setPendingReject] = useState<ReviewRecord | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ReviewRecord | null>(null);
  const [actionError, setActionError] = useState("");

  const handleApprove = async (review: ReviewRecord) => {
    setActionError("");
    setStatusUpdatingId(review.id);
    try {
      await updateStatus({ id: review.id, input: { status: "approved" } }).unwrap();
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleConfirmReject = async (reason: string) => {
    if (!pendingReject) return;
    setActionError("");
    setStatusUpdatingId(pendingReject.id);
    try {
      await updateStatus({ id: pendingReject.id, input: { status: "rejected", rejectedReason: reason } }).unwrap();
      setPendingReject(null);
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setActionError("");
    setDeletingId(pendingDelete.id);
    try {
      await deleteReview(pendingDelete.id).unwrap();
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

  const hasFilters = search || modelId || status || verifiedOnly;
  const clearFilters = () => {
    setSearch("");
    setModelId("");
    setStatus("");
    setVerifiedOnly(false);
    setPage(1);
  };

  const columns: DataTableColumn<ReviewRecord>[] = [
    { header: "User", render: (r) => <span className="font-semibold text-[#1c1a17]">{r.user.name}</span> },
    {
      header: "Model",
      render: (r) => (
        <span className="text-[#4a4640]">
          {r.model.brand.name} {r.model.name}
        </span>
      ),
    },
    {
      header: "Rating",
      render: (r) => <span className="font-bold text-[#1c1a17]">{r.rating ? `${r.rating} ★` : "—"}</span>,
    },
    {
      header: "Review",
      render: (r) => (
        <span className="text-[#4a4640] block max-w-[260px] truncate" title={r.body ?? undefined}>
          {r.title ?? r.body ?? "—"}
        </span>
      ),
    },
    {
      header: "Verified",
      render: (r) =>
        r.isVerifiedOwner ? (
          <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-600">Verified</span>
        ) : (
          <span className="text-[#c0bab0]">—</span>
        ),
    },
    {
      header: "Status",
      render: (r) => (
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${STATUS_STYLES[r.status]}`}>
          {r.status}
        </span>
      ),
    },
    { header: "Helpful", render: (r) => <span className="text-[#7a7670]">{r.helpfulCount}</span> },
    { header: "Replies", render: (r) => <span className="text-[#7a7670]">{r.replyCount}</span> },
    { header: "Date", render: (r) => <span className="text-[#7a7670] whitespace-nowrap">{formatDate(r.createdAt)}</span> },
    {
      header: "",
      align: "right",
      render: (r) => {
        const busy = statusUpdatingId === r.id || deletingId === r.id;
        return (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            {r.status !== "approved" && (
              <button
                onClick={() => handleApprove(r)}
                disabled={busy}
                className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-green-100 text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
              >
                {statusUpdatingId === r.id ? "..." : "Approve"}
              </button>
            )}
            {r.status !== "rejected" && (
              <button
                onClick={() => setPendingReject(r)}
                disabled={busy}
                className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                Reject
              </button>
            )}
            <button
              onClick={() => setPendingDelete(r)}
              disabled={busy}
              className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#e8e4dc] text-[#7a7670] hover:bg-[#f7f5f1] transition-colors disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div>
        <h1 className="text-[18px] font-black text-[#1c1a17]">Reviews</h1>
        <p className="text-[12px] text-[#a39e96] mt-0.5">
          Owner reviews submitted from car model pages — approve, reject, or reply. Click a row for full detail.
        </p>
      </div>

      {actionError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
          <p className="text-red-500 text-xs font-medium">{actionError}</p>
        </div>
      )}

      <div className="bg-white border border-[#e8e4dc] rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-xs bg-[#f7f5f1] border border-[#e8e4dc] rounded-lg px-3 py-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c0bab0" strokeWidth="1.8">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search title/body..."
            className="flex-1 bg-transparent text-[12px] text-[#1c1a17] outline-none placeholder:text-[#c0bab0]"
          />
        </div>

        <select
          value={modelId}
          onChange={(e) => {
            setPage(1);
            setModelId(e.target.value ? Number(e.target.value) : "");
          }}
          className="cursor-pointer text-[12px] text-[#4a4640] bg-[#f7f5f1] border border-[#e8e4dc] rounded-lg px-3 py-2 outline-none"
        >
          <option value="">All models</option>
          {carModels.map((m) => (
            <option key={m.id} value={m.id}>
              {m.brand.name} {m.name}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value as ReviewRecord["status"] | "");
          }}
          className="cursor-pointer text-[12px] text-[#4a4640] bg-[#f7f5f1] border border-[#e8e4dc] rounded-lg px-3 py-2 outline-none"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-1.5 cursor-pointer text-[12px] font-semibold text-[#4a4640] whitespace-nowrap">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => {
              setPage(1);
              setVerifiedOnly(e.target.checked);
            }}
            className="cursor-pointer accent-[#D4300F]"
          />
          Verified owners only
        </label>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="cursor-pointer text-[11px] font-semibold text-[#a39e96] hover:text-[#D4300F] transition-colors"
          >
            Clear filters
          </button>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {pagination && (
            <p className="text-[11px] text-[#a39e96] whitespace-nowrap">
              {pagination.total} review{pagination.total === 1 ? "" : "s"} total
            </p>
          )}
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

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={reviews}
          rowKey={(r) => r.id}
          loading={loading}
          error={error}
          loadingMessage="Loading reviews..."
          emptyMessage="No reviews match these filters."
          expandable
          renderExpanded={(r) => <ReviewExpandedDetail review={r} />}
        />
        <Pagination
          pagination={pagination}
          onPageChange={setPage}
          variant="compact"
          itemLabel="reviews"
          currentCount={reviews.length}
        />
      </div>

      <PromptDialog
        open={!!pendingReject}
        title={`Reject review from "${pendingReject?.user.name ?? ""}"?`}
        label="Reason for rejecting"
        placeholder="e.g. Content doesn't meet our guidelines"
        confirmLabel="Reject"
        loading={statusUpdatingId === pendingReject?.id}
        onCancel={() => setPendingReject(null)}
        onConfirm={handleConfirmReject}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this review?"
        itemName={pendingDelete?.title ?? pendingDelete?.user.name ?? null}
        loading={deletingId === pendingDelete?.id}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
