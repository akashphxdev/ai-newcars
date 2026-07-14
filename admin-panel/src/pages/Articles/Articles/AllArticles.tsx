// src/pages/Articles/Articles/AllArticles.tsx
import { useEffect, useState } from "react";
import {
  useGetArticlesQuery,
  useDeleteArticleMutation,
  useUpdateArticleStatusMutation,
  type ArticleRecord,
  type ArticleStatus,
} from "./article.api";
import { useGetArticleCategoriesQuery } from "../ArticleCategories/articleCategory.api";
import { extractApiError, getUploadUrl } from "../../../lib/apiClient";
import ArticleModal from "./ArticleModal";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, SearchInput, FilterSelect } from "../../../components/common/SearchFilterBar";

const ACCENT = "#D4300F";
// Rows-per-page choices shown in the dropdown — same set as AllAdminLogs.tsx.
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const STATUS_STYLES: Record<ArticleStatus, string> = {
  draft: "bg-[#f7f5f1] text-[#a39e96]",
  scheduled: "bg-amber-50 text-amber-600",
  published: "bg-green-50 text-green-600",
};

// Local-datetime <-> ISO helper for the inline schedule picker, same
// convention as ArticleModal's toLocalInputValue.
function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Row-level status control. Draft/Published apply immediately; picking
// "Scheduled" opens an inline date/time prompt first since the backend
// requires a future scheduledAt whenever status is "scheduled".
function StatusCell({ article }: { article: ArticleRecord }) {
  const [updateStatus, { isLoading }] = useUpdateArticleStatusMutation();
  const [pickingSchedule, setPickingSchedule] = useState(false);
  const [scheduleValue, setScheduleValue] = useState("");
  const [error, setError] = useState("");

  const applyStatus = async (status: ArticleStatus, scheduledAtIso?: string | null) => {
    setError("");
    try {
      await updateStatus({ id: article.id, status, scheduledAt: scheduledAtIso ?? null }).unwrap();
      setPickingSchedule(false);
      setScheduleValue("");
    } catch (err) {
      setError(extractApiError(err));
    }
  };

  const handleChange = (value: ArticleStatus) => {
    if (value === "scheduled") {
      setPickingSchedule(true);
      setScheduleValue(toLocalInputValue(article.scheduledAt) || toLocalInputValue(new Date().toISOString()));
      return;
    }
    applyStatus(value);
  };

  return (
    <div className="space-y-1 min-w-[150px]">
      <select
        value={article.status}
        onChange={(e) => handleChange(e.target.value as ArticleStatus)}
        disabled={isLoading}
        className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase border-0 cursor-pointer outline-none ${STATUS_STYLES[article.status]}`}
      >
        <option value="draft">Draft</option>
        <option value="scheduled">Scheduled</option>
        <option value="published">Published</option>
      </select>

      {!pickingSchedule && article.status === "scheduled" && article.scheduledAt && (
        <p className="text-[10px] text-[#a39e96]">{new Date(article.scheduledAt).toLocaleString()}</p>
      )}

      {pickingSchedule && (
        <div className="flex items-center gap-1 bg-[#f7f5f1] border border-[#e2ddd5] rounded-lg p-1.5">
          <input
            type="datetime-local"
            value={scheduleValue}
            onChange={(e) => setScheduleValue(e.target.value)}
            className="text-[10px] bg-white border border-[#e2ddd5] rounded px-1.5 py-1 outline-none w-[130px]"
          />
          <button
            type="button"
            disabled={isLoading || !scheduleValue}
            onClick={() => applyStatus("scheduled", new Date(scheduleValue).toISOString())}
            className="cursor-pointer text-[10px] font-bold px-2 py-1 rounded bg-[#D4300F] text-white disabled:opacity-50"
          >
            Set
          </button>
          <button
            type="button"
            onClick={() => {
              setPickingSchedule(false);
              setScheduleValue("");
            }}
            className="cursor-pointer text-[10px] font-bold px-1.5 text-[#a39e96]"
          >
            ✕
          </button>
        </div>
      )}

      {error && <p className="text-[9px] font-medium text-[#D4300F] max-w-[150px]">{error}</p>}
    </div>
  );
}

export default function AllArticles() {
  const [page, setPage] = useState(1);
  // Rows-per-page, user-controlled via a dropdown next to the filters.
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  // Debounced copy of `search` — this is what actually goes into the
  // query args, so we don't refetch on every keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState<number | "">("");
  const [filterStatus, setFilterStatus] = useState<ArticleStatus | "">("");

  const { data: categoriesData } = useGetArticleCategoriesQuery({ page: 1, limit: 100 });
  const categories = categoriesData?.data ?? [];

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data: articlesData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetArticlesQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
    categoryId: filterCategoryId || undefined,
    status: filterStatus || undefined,
  });

  const articles = articlesData?.data ?? [];
  const pagination = articlesData?.pagination;
  const loading = isLoading || isFetching;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";

  const [modalOpen, setModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<ArticleRecord | null>(null);

  const openAddModal = () => {
    setEditingArticle(null);
    setModalOpen(true);
  };

  const openEditModal = (article: ArticleRecord) => {
    setEditingArticle(article);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingArticle(null);
  };

  const [deleteArticle] = useDeleteArticleMutation();

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ArticleRecord | null>(null);
  const [actionError, setActionError] = useState("");

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setActionError("");
    setDeletingId(pendingDelete.id);
    try {
      await deleteArticle(pendingDelete.id).unwrap();
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

  const columns: DataTableColumn<ArticleRecord>[] = [
    {
      header: "Cover",
      render: (a) => (
        <div className="w-12 h-12 rounded-lg border border-[#e8e4dc] bg-[#f7f5f1] overflow-hidden flex items-center justify-center">
          {a.coverImageUrl ? (
            <img src={getUploadUrl(a.coverImageUrl) ?? undefined} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[8px] text-[#a39e96]">—</span>
          )}
        </div>
      ),
    },
    {
      header: "Title",
      render: (a) => (
        <>
          <p className="font-semibold text-[#1c1a17] max-w-[280px] truncate">{a.title}</p>
          <p className="text-[#a39e96]">{a.category.name} · by {a.author.name}</p>
        </>
      ),
    },
    {
      header: "Tags",
      render: (a) => (
        <div className="flex flex-wrap gap-1 max-w-[180px]">
          {[...a.brands, ...a.models].slice(0, 3).map((t) => (
            <span key={t.id} className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[#f7f5f1] text-[#7a7670]">
              {t.name}
            </span>
          ))}
          {a.brands.length + a.models.length > 3 && (
            <span className="text-[9px] text-[#a39e96]">+{a.brands.length + a.models.length - 3}</span>
          )}
          {a.brands.length + a.models.length === 0 && <span className="text-[#a39e96]">—</span>}
        </div>
      ),
    },
    {
      header: "Status",
      render: (a) => <StatusCell article={a} />,
    },
    {
      header: "Activity",
      render: (a) => (
        <div className="space-y-1 text-[10px] leading-snug">
          <p className="text-[#7a7670]">
            <span className="font-semibold text-[#4a4640]">Created</span>{" "}
            {a.createdByAdmin?.name ?? "—"}
            <br />
            <span className="text-[#a39e96]">{new Date(a.createdAt).toLocaleString()}</span>
          </p>
          <p className="text-[#7a7670]">
            <span className="font-semibold text-[#4a4640]">Updated</span>{" "}
            {a.updatedByAdmin?.name ?? "—"}
            <br />
            <span className="text-[#a39e96]">{new Date(a.updatedAt).toLocaleString()}</span>
          </p>
        </div>
      ),
    },
    {
      header: "Views",
      render: (a) => <span className="text-[#7a7670]">{a.viewCount}</span>,
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
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-[1300px]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[18px] font-black text-[#1c1a17]">Articles</h1>
          <p className="text-[12px] text-[#a39e96] mt-0.5">Write, schedule, and publish articles.</p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="cursor-pointer text-[12px] font-bold text-white px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          + Add article
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
                {pagination.total} article{pagination.total === 1 ? "" : "s"} total
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
          placeholder="Search by title or slug..."
        />
        <FilterSelect
          value={filterCategoryId}
          onChange={(v) => {
            setFilterCategoryId(v ? Number(v) : "");
            setPage(1);
          }}
          placeholder="All categories"
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
        />
        <FilterSelect
          value={filterStatus}
          onChange={(v) => {
            setFilterStatus((v as ArticleStatus) || "");
            setPage(1);
          }}
          placeholder="All statuses"
          options={[
            { value: "draft", label: "Draft" },
            { value: "scheduled", label: "Scheduled" },
            { value: "published", label: "Published" },
          ]}
        />
      </SearchFilterBar>

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={articles}
          rowKey={(a) => a.id}
          loading={loading}
          error={error}
          loadingMessage="Loading articles..."
          emptyMessage="No articles found."
        />
        <Pagination
          pagination={pagination ?? null}
          onPageChange={setPage}
          variant="compact"
          itemLabel="articles"
          currentCount={articles.length}
        />
      </div>

      {modalOpen && (
        <ArticleModal
          key={editingArticle ? `edit-${editingArticle.id}` : "add"}
          open={modalOpen}
          onClose={closeModal}
          article={editingArticle}
        />
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete article?"
        itemName={pendingDelete?.title}
        loading={deletingId === pendingDelete?.id}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}