// src/pages/Articles/ArticleComments/AllArticleComments.tsx
import { useState } from "react";
import {
  useGetArticleCommentsQuery,
  useUpdateArticleCommentStatusMutation,
  useDeleteArticleCommentMutation,
  type ArticleCommentRecord,
  type CommentStatus,
} from "./articleComment.api";
import { extractApiError } from "../../../lib/apiClient";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, SearchInput, FilterSelect } from "../../../components/common/SearchFilterBar";

const PAGE_SIZE = 20;

const STATUS_STYLES: Record<CommentStatus, string> = {
  visible: "bg-green-50 text-green-600",
  hidden: "bg-[#f7f5f1] text-[#a39e96]",
  flagged: "bg-red-50 text-red-500",
};

export default function AllArticleComments() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<CommentStatus | "">("");

  const {
    data: commentsData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetArticleCommentsQuery({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    status: filterStatus || undefined,
  });

  const comments = commentsData?.data ?? [];
  const pagination = commentsData?.pagination;
  const loading = isLoading || isFetching;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";

  const [updateStatus, { isLoading: statusUpdating }] = useUpdateArticleCommentStatusMutation();
  const [deleteComment] = useDeleteArticleCommentMutation();

  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ArticleCommentRecord | null>(null);
  const [actionError, setActionError] = useState("");

  const handleStatusChange = async (comment: ArticleCommentRecord, status: CommentStatus) => {
    setActionError("");
    setStatusUpdatingId(comment.id);
    try {
      await updateStatus({ id: comment.id, status }).unwrap();
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
      await deleteComment(pendingDelete.id).unwrap();
      setPendingDelete(null);
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setDeletingId(null);
    }
  };

  const columns: DataTableColumn<ArticleCommentRecord>[] = [
    {
      header: "Comment",
      render: (c) => (
        <div className="max-w-[360px]">
          <p className="text-[#1c1a17] line-clamp-2">{c.body}</p>
          <p className="text-[#a39e96] mt-0.5">
            by {c.user.name} on <span className="font-semibold">{c.article.title}</span>
            {c.parentCommentId ? " · reply" : ""}
            {c.replyCount > 0 ? ` · ${c.replyCount} repl${c.replyCount === 1 ? "y" : "ies"}` : ""}
          </p>
        </div>
      ),
    },
    {
      header: "Posted",
      render: (c) => <span className="text-[#7a7670]">{new Date(c.createdAt).toLocaleString()}</span>,
    },
    {
      header: "Status",
      render: (c) => (
        <select
          value={c.status}
          disabled={statusUpdating && statusUpdatingId === c.id}
          onChange={(e) => handleStatusChange(c, e.target.value as CommentStatus)}
          className={`cursor-pointer text-[10px] font-bold px-2 py-1 rounded-full uppercase border-none outline-none ${STATUS_STYLES[c.status]}`}
        >
          <option value="visible">Visible</option>
          <option value="hidden">Hidden</option>
          <option value="flagged">Flagged</option>
        </select>
      ),
    },
    {
      header: "",
      align: "right",
      render: (c) => (
        <button
          onClick={() => setPendingDelete(c)}
          className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
        >
          Delete
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-[1200px]">
      <div>
        <h1 className="text-[18px] font-black text-[#1c1a17]">Article Comments</h1>
        <p className="text-[12px] text-[#a39e96] mt-0.5">
          Moderate comments left on articles — hide, flag, or remove them.
        </p>
      </div>

      {actionError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
          <p className="text-red-500 text-xs font-medium">{actionError}</p>
        </div>
      )}

      <SearchFilterBar
        right={
          pagination && (
            <p className="text-[11px] text-[#a39e96] whitespace-nowrap">
              {pagination.total} comment{pagination.total === 1 ? "" : "s"} total
            </p>
          )
        }
      >
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search comment text..."
        />
        <FilterSelect
          value={filterStatus}
          onChange={(v) => {
            setFilterStatus((v as CommentStatus) || "");
            setPage(1);
          }}
          placeholder="All statuses"
          options={[
            { value: "visible", label: "Visible" },
            { value: "hidden", label: "Hidden" },
            { value: "flagged", label: "Flagged" },
          ]}
        />
      </SearchFilterBar>

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={comments}
          rowKey={(c) => c.id}
          loading={loading}
          error={error}
          loadingMessage="Loading comments..."
          emptyMessage="No comments found."
        />
        <Pagination pagination={pagination ?? null} onPageChange={setPage} variant="simple" />
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete comment?"
        message={
          pendingDelete && pendingDelete.replyCount > 0
            ? `This comment has ${pendingDelete.replyCount} repl${pendingDelete.replyCount === 1 ? "y" : "ies"} — deleting it will delete the whole thread.`
            : undefined
        }
        loading={deletingId === pendingDelete?.id}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}