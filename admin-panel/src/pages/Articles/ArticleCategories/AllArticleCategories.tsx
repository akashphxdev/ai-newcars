// src/pages/Articles/ArticleCategories/AllArticleCategories.tsx
import { useEffect, useState } from "react";
import {
  useGetArticleCategoriesQuery,
  useUpdateArticleCategoryStatusMutation,
  useDeleteArticleCategoryMutation,
  type ArticleCategoryRecord,
} from "./articleCategory.api";
import { extractApiError } from "../../../lib/apiClient";
import ArticleCategoryModal from "./ArticleCategoryModal";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, SearchInput } from "../../../components/common/SearchFilterBar";

const ACCENT = "#D4300F";
// Rows-per-page choices shown in the dropdown — same set as AllAdminLogs.tsx.
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Small pill-style toggle switch — same pattern as AllBrands.tsx's
// StatusToggle / AllCountries.tsx's StatusToggle / AllCities.tsx's
// FlagToggle.
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

// "12 Jul 2026, 4:30 pm" — compact enough for a table cell.
function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AllArticleCategories() {
  const [page, setPage] = useState(1);
  // Rows-per-page, user-controlled via a dropdown next to the filters.
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
    data: categoriesData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetArticleCategoriesQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
  });

  const categories = categoriesData?.data ?? [];
  const pagination = categoriesData?.pagination;
  const loading = isLoading || isFetching;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";

  // Modal state — null category = "Add" mode, a record = "Edit" mode.
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ArticleCategoryRecord | null>(null);

  const openAddModal = () => {
    setEditingCategory(null);
    setModalOpen(true);
  };

  const openEditModal = (category: ArticleCategoryRecord) => {
    setEditingCategory(category);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCategory(null);
  };

  const [updateArticleCategoryStatus] = useUpdateArticleCategoryStatusMutation();
  const [deleteArticleCategory] = useDeleteArticleCategoryMutation();

  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  // Row pending delete confirmation — set on "Delete" click, cleared on
  // cancel/confirm. Drives the shared ConfirmDialog popup (which itself
  // makes the admin wait a few seconds before the Confirm button
  // enables — no accidental deletes).
  const [pendingDelete, setPendingDelete] = useState<ArticleCategoryRecord | null>(null);
  // Backend blocks this delete with a friendly message when articles
  // are still filed under the category (see articleCategory.service.ts's
  // deleteArticleCategory) — this surfaces that message right here.
  const [actionError, setActionError] = useState("");

  const handleToggleStatus = async (category: ArticleCategoryRecord) => {
    setActionError("");
    setTogglingId(category.id);
    try {
      await updateArticleCategoryStatus({ id: category.id, isActive: !category.isActive }).unwrap();
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
      await deleteArticleCategory(pendingDelete.id).unwrap();
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

  const columns: DataTableColumn<ArticleCategoryRecord>[] = [
    {
      header: "Name",
      render: (c) => (
        <>
          <p className="font-semibold text-[#1c1a17]">{c.name}</p>
          <p className="text-[#a39e96]">{c.slug}</p>
        </>
      ),
    },
    {
      header: "Articles",
      render: (c) => <span className="text-[#7a7670]">{c.articleCount}</span>,
    },
    {
      header: "Status",
      render: (c) => (
        <div className="flex items-center gap-2">
          <StatusToggle
            checked={c.isActive}
            disabled={togglingId === c.id}
            onChange={() => handleToggleStatus(c)}
          />
          <span className={`text-[10px] font-bold ${c.isActive ? "text-green-600" : "text-[#a39e96]"}`}>
            {c.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      ),
    },
    {
      header: "Created",
      render: (c) => (
        <>
          <p className="text-[#4a4640] font-medium">{c.createdByAdmin?.name ?? "—"}</p>
          <p className="text-[#a39e96]">{formatDateTime(c.createdAt)}</p>
        </>
      ),
    },
    {
      header: "Updated",
      render: (c) => (
        <>
          <p className="text-[#4a4640] font-medium">{c.updatedByAdmin?.name ?? "—"}</p>
          <p className="text-[#a39e96]">{formatDateTime(c.updatedAt)}</p>
        </>
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
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-[1200px]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[18px] font-black text-[#1c1a17]">Article Categories</h1>
          <p className="text-[12px] text-[#a39e96] mt-0.5">
            Manage categories used to organize articles. Slug is auto-generated from the name if left blank.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="cursor-pointer text-[12px] font-bold text-white px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          + Add category
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
                {pagination.total} categor{pagination.total === 1 ? "y" : "ies"} total
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
          placeholder="Search by name or slug..."
        />
      </SearchFilterBar>

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={categories}
          rowKey={(c) => c.id}
          loading={loading}
          error={error}
          loadingMessage="Loading article categories..."
          emptyMessage="No article categories found."
        />
        <Pagination
          pagination={pagination ?? null}
          onPageChange={setPage}
          variant="compact"
          itemLabel="categories"
          currentCount={categories.length}
        />
      </div>

      {modalOpen && (
        <ArticleCategoryModal
          key={editingCategory ? `edit-${editingCategory.id}` : "add"}
          open={modalOpen}
          onClose={closeModal}
          category={editingCategory}
        />
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete category?"
        itemName={pendingDelete?.name}
        message={
          pendingDelete && pendingDelete.articleCount > 0
            ? `${pendingDelete.articleCount} article(s) are linked to this category — deletion will be blocked until they're reassigned.`
            : undefined
        }
        loading={deletingId === pendingDelete?.id}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}