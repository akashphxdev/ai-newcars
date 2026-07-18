// src/pages/Ai/Articles/AllAiArticles.tsx
import { useEffect, useState } from "react";
import {
  useGetAiArticlesQuery,
  useApproveAiArticleMutation,
  useRejectAiArticleMutation,
  usePublishAiArticleMutation,
  useDeleteAiArticleMutation,
  type AiArticleRecord,
} from "./aiArticle.api";
import { extractApiError, getUploadUrl } from "../../../lib/apiClient";
import {
  AI_ARTICLE_STATUS,
  AI_ARTICLE_STATUS_OPTIONS,
  getAiArticleStatusLabel,
  getAiProviderLabel,
} from "../../../lib/aiLookups";
import AiArticleEditModal from "./AiArticleEditModal";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, SearchInput } from "../../../components/common/SearchFilterBar";
import ConfirmDialog from "../../../components/common/ConfirmDialog";

const ACCENT = "#D4300F";
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const STATUS_STYLES: Record<number, { bg: string; text: string }> = {
  [AI_ARTICLE_STATUS.PENDING]: { bg: "#f7f5f1", text: "#7a7670" },
  [AI_ARTICLE_STATUS.APPROVED]: { bg: "#eef6ff", text: "#1d72c4" },
  [AI_ARTICLE_STATUS.REJECTED]: { bg: "#fef2f0", text: ACCENT },
  [AI_ARTICLE_STATUS.PUBLISHED]: { bg: "#f0fdf4", text: "#15803d" },
};

function StatusBadge({ status }: { status: number }) {
  const s = STATUS_STYLES[status] ?? { bg: "#f7f5f1", text: "#7a7670" };
  return (
    <span
      className="inline-block text-[10.5px] font-bold px-2.5 py-1 rounded-full"
      style={{ background: s.bg, color: s.text }}
    >
      {getAiArticleStatusLabel(status)}
    </span>
  );
}

// No year — same date-formatting fix as AllAiFaqs.tsx to keep the
// Reviewed column from forcing horizontal scroll.
function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AllAiArticles() {
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
    data: aiArticlesData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetAiArticlesQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
  });

  const aiArticles = aiArticlesData?.data ?? [];
  const pagination = aiArticlesData?.pagination;
  const loading = isLoading || isFetching;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";

  const [editingArticle, setEditingArticle] = useState<AiArticleRecord | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AiArticleRecord | null>(null);

  const [approveAiArticle] = useApproveAiArticleMutation();
  const [rejectAiArticle] = useRejectAiArticleMutation();
  const [publishAiArticle] = usePublishAiArticleMutation();
  const [deleteAiArticle] = useDeleteAiArticleMutation();

  const [actingId, setActingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  const handleApprove = async (article: AiArticleRecord) => {
    setActionError("");
    setActingId(article.id);
    try {
      await approveAiArticle(article.id).unwrap();
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (article: AiArticleRecord) => {
    setActionError("");
    setActingId(article.id);
    try {
      await rejectAiArticle(article.id).unwrap();
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setActingId(null);
    }
  };

  const handlePublish = async (article: AiArticleRecord) => {
    setActionError("");
    setActingId(article.id);
    try {
      await publishAiArticle(article.id).unwrap();
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
      await deleteAiArticle(pendingDelete.id).unwrap();
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

  const columns: DataTableColumn<AiArticleRecord>[] = [
    {
      header: "Brand / Category",
      render: (a) => (
        <div className="max-w-[130px]">
          <p className="font-semibold text-[#1c1a17] truncate" title={a.brand.name}>
            {a.brand.name}
          </p>
          <p className="text-[10px] text-[#a39e96] mt-0.5 truncate" title={a.category.name}>
            {a.category.name}
          </p>
        </div>
      ),
    },
    {
      header: "Title",
      render: (a) => (
        <span className="text-[#4a4640] block max-w-[240px] truncate" title={a.title}>
          {a.title}
        </span>
      ),
    },
    {
      header: "Provider",
      render: (a) => (
        <div className="max-w-[110px]">
          <p className="text-[#4a4640] truncate">{getAiProviderLabel(a.aiProvider)}</p>
          <p className="text-[10px] text-[#a39e96] mt-0.5 truncate" title={a.aiModel}>{a.aiModel}</p>
        </div>
      ),
    },
    {
      header: "Status",
      render: (a) => <StatusBadge status={a.status} />,
    },
    {
      header: "Reviewed",
      render: (a) => (
        <div className="whitespace-nowrap max-w-[100px]">
          <p className="text-[#1c1a17] font-semibold truncate" title={a.reviewedByAdmin?.name ?? undefined}>
            {a.reviewedByAdmin?.name ?? "—"}
          </p>
          <p className="text-[10px] text-[#a39e96] mt-0.5">{fmtDate(a.reviewedAt)}</p>
        </div>
      ),
    },
    {
      header: "",
      align: "right",
      render: (a) => {
        const busy = actingId === a.id;
        return (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            {(a.status === AI_ARTICLE_STATUS.PENDING || a.status === AI_ARTICLE_STATUS.APPROVED) && (
              <button
                onClick={() => setEditingArticle(a)}
                disabled={busy}
                className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors disabled:opacity-50"
              >
                Edit
              </button>
            )}
            {a.status === AI_ARTICLE_STATUS.PENDING && (
              <button
                onClick={() => handleApprove(a)}
                disabled={busy}
                className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-emerald-100 text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
              >
                {busy ? "..." : "Approve"}
              </button>
            )}
            {(a.status === AI_ARTICLE_STATUS.PENDING || a.status === AI_ARTICLE_STATUS.APPROVED) && (
              <button
                onClick={() => handleReject(a)}
                disabled={busy}
                className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {busy ? "..." : "Reject"}
              </button>
            )}
            {a.status === AI_ARTICLE_STATUS.APPROVED && (
              <button
                onClick={() => handlePublish(a)}
                disabled={busy}
                className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: ACCENT }}
              >
                {busy ? "..." : "Publish"}
              </button>
            )}
            {a.status === AI_ARTICLE_STATUS.REJECTED && (
              <button
                onClick={() => setPendingDelete(a)}
                disabled={busy}
                className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                Delete
              </button>
            )}
            {a.status === AI_ARTICLE_STATUS.PUBLISHED && (
              <span className="text-[10px] text-[#a39e96]">Locked — Article #{a.publishedArticleId}</span>
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
          <h1 className="text-[18px] font-black text-[#1c1a17]">AI Article Review</h1>
          <p className="text-[12px] text-[#a39e96] mt-0.5">
            Review, edit, approve or reject AI-generated articles. Publishing sends one live into the real Articles list.
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
                {pagination.total} article{pagination.total === 1 ? "" : "s"} total
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
              {AI_ARTICLE_STATUS_OPTIONS.map((o) => (
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
          placeholder="Search by title..."
          width="320px"
        />
      </SearchFilterBar>

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={aiArticles}
          rowKey={(a) => a.id}
          loading={loading}
          error={error}
          loadingMessage="Loading AI articles..."
          emptyMessage="No AI-generated articles found."
          expandable
          renderExpanded={(a) => (
            <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-5 text-[12px]">
              <div className="space-y-3">
                <div className="w-full aspect-[16/10] rounded-lg overflow-hidden border border-[#e8e4dc] bg-[#f7f5f1]">
                  <img
                    src={getUploadUrl(a.coverImageUrl) ?? undefined}
                    alt={a.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1">Taxonomy</p>
                  <p className="text-[#1c1a17] font-semibold">{a.brand.name}</p>
                  <p className="text-[#7a7670]">{a.category.name}</p>
                  {a.model && <p className="text-[#7a7670]">{a.model.name}</p>}
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1">Slug</p>
                  <p className="text-[#4a4640] break-all">{a.slug}</p>
                </div>
              </div>

              <div className="space-y-3 min-w-0">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1">Excerpt</p>
                  <p className="text-[#1c1a17]">{a.excerpt}</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1">Body</p>
                  <div
                    className="text-[#4a4640] max-h-[280px] overflow-y-auto border border-[#f0ece6] rounded-lg px-3 py-2.5 bg-[#faf8f5]
                      [&_h2]:text-[13px] [&_h2]:font-bold [&_h2]:text-[#1c1a17] [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h2:first-child]:mt-0
                      [&_p]:mb-2 [&_p:last-child]:mb-0
                      [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2
                      [&_li]:mb-1"
                    dangerouslySetInnerHTML={{ __html: a.body }}
                  />
                </div>

                <div className="bg-white border border-[#e8e4dc] rounded-lg p-3 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#a39e96]">SEO Meta</p>
                  <div>
                    <p className="text-[10px] text-[#a39e96] font-semibold">Meta Title</p>
                    <p className="text-[#1c1a17]">{a.metaTitle}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#a39e96] font-semibold">Meta Description</p>
                    <p className="text-[#1c1a17]">{a.metaDescription}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#a39e96] font-semibold">Meta Keywords</p>
                    <p className="text-[#1c1a17]">{a.metaKeywords}</p>
                  </div>
                </div>

                <p className="text-[10px] text-[#a39e96] pt-1">
                  Generated {fmtDate(a.createdAt)}
                  {a.publishedArticleId ? ` · Published as real Article #${a.publishedArticleId}` : ""}
                </p>
              </div>
            </div>
          )}
        />
        <Pagination
          pagination={pagination ?? null}
          onPageChange={setPage}
          variant="compact"
          itemLabel="AI articles"
          currentCount={aiArticles.length}
        />
      </div>

      <AiArticleEditModal open={!!editingArticle} onClose={() => setEditingArticle(null)} article={editingArticle} />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete rejected AI article?"
        itemName={pendingDelete?.title}
        loading={actingId === pendingDelete?.id}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
