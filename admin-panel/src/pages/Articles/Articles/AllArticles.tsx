// src/pages/Articles/Articles/AllArticles.tsx
import { useState } from "react";
import {
  useGetArticlesQuery,
  useDeleteArticleMutation,
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
const PAGE_SIZE = 20;

const STATUS_STYLES: Record<ArticleStatus, string> = {
  draft: "bg-[#f7f5f1] text-[#a39e96]",
  scheduled: "bg-amber-50 text-amber-600",
  published: "bg-green-50 text-green-600",
};

export default function AllArticles() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState<number | "">("");
  const [filterStatus, setFilterStatus] = useState<ArticleStatus | "">("");

  const { data: categoriesData } = useGetArticleCategoriesQuery({ page: 1, limit: 100 });
  const categories = categoriesData?.data ?? [];

  const {
    data: articlesData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetArticlesQuery({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
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
      render: (a) => (
        <div className="space-y-0.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${STATUS_STYLES[a.status]}`}>
            {a.status}
          </span>
          {a.status === "scheduled" && a.scheduledAt && (
            <p className="text-[10px] text-[#a39e96]">{new Date(a.scheduledAt).toLocaleString()}</p>
          )}
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
          pagination && (
            <p className="text-[11px] text-[#a39e96] whitespace-nowrap">
              {pagination.total} article{pagination.total === 1 ? "" : "s"} total
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
        <Pagination pagination={pagination ?? null} onPageChange={setPage} variant="simple" />
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