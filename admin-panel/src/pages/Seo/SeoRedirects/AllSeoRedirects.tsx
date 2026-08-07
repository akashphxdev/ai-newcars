// src/pages/Seo/SeoRedirects/AllSeoRedirects.tsx
import { useEffect, useState } from "react";
import {
  useGetSeoRedirectsQuery,
  useUpdateSeoRedirectStatusMutation,
  useDeleteSeoRedirectMutation,
  type SeoRedirectRecord,
} from "./seoRedirect.api";
import { extractApiError } from "../../../lib/apiClient";
import SeoRedirectModal from "./SeoRedirectModal";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, SearchInput } from "../../../components/common/SearchFilterBar";
import ConfirmDialog from "../../../components/common/ConfirmDialog";

const ACCENT = "#D4300F";
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

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

// Small pill-style toggle switch — same pattern as AllPlacements.tsx's
// StatusToggle.
function StatusToggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
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

export default function AllSeoRedirects() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetSeoRedirectsQuery({ page, limit, search: debouncedSearch || undefined });

  const redirects = data?.data ?? [];
  const pagination = data?.pagination ?? null;
  const loading = isLoading || isFetching;
  const error = queryError ? extractApiError(queryError) : "";

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRedirect, setEditingRedirect] = useState<SeoRedirectRecord | null>(null);

  const openAddModal = () => {
    setEditingRedirect(null);
    setModalOpen(true);
  };

  const openEditModal = (redirect: SeoRedirectRecord) => {
    setEditingRedirect(redirect);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingRedirect(null);
  };

  const [updateStatus] = useUpdateSeoRedirectStatusMutation();
  const [deleteSeoRedirect] = useDeleteSeoRedirectMutation();

  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SeoRedirectRecord | null>(null);
  const [actionError, setActionError] = useState("");

  const handleToggleStatus = async (redirect: SeoRedirectRecord) => {
    setActionError("");
    setTogglingId(redirect.id);
    try {
      await updateStatus({ id: redirect.id, isActive: !redirect.isActive }).unwrap();
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
      await deleteSeoRedirect(pendingDelete.id).unwrap();
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

  const columns: DataTableColumn<SeoRedirectRecord>[] = [
    { header: "Old path", render: (r) => <span className="font-mono text-[11.5px] font-semibold text-[#1c1a17]">{r.oldPath}</span> },
    {
      header: "New path",
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <span className="text-[#a39e96]">→</span>
          <span className="font-mono text-[11.5px] text-[#4a4640]">{r.newPath}</span>
        </div>
      ),
    },
    {
      header: "Type",
      render: (r) => (
        <span
          className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
            r.redirectType === 301 ? "bg-[#eef2ff] text-[#4338ca]" : "bg-[#fef3c7] text-[#92400e]"
          }`}
        >
          {r.redirectType}
        </span>
      ),
    },
    {
      header: "Status",
      render: (r) => (
        <div className="flex items-center gap-2">
          <StatusToggle checked={r.isActive} disabled={togglingId === r.id} onChange={() => handleToggleStatus(r)} />
          <span className={`text-[10px] font-bold ${r.isActive ? "text-green-600" : "text-[#a39e96]"}`}>
            {r.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      ),
    },
    {
      header: "Updated",
      render: (r) => (
        <div className="whitespace-nowrap">
          <p className="text-[#1c1a17] font-semibold">{r.updatedByAdmin?.name ?? "—"}</p>
          <p className="text-[10px] text-[#a39e96] mt-0.5">{fmtDate(r.updatedAt)}</p>
        </div>
      ),
    },
    {
      header: "",
      align: "right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openEditModal(r)}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => setPendingDelete(r)}
            disabled={deletingId === r.id}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deletingId === r.id ? "..." : "Delete"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-[1300px]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[18px] font-black text-[#1c1a17]">SEO Redirects</h1>
          <p className="text-[12px] text-[#a39e96] mt-0.5">
            Send visitors (and search engines) from an old URL to its new location.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="cursor-pointer text-[12px] font-bold text-white px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          + Add redirect
        </button>
      </div>

      {(error || actionError) && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
          <p className="text-red-500 text-xs font-medium">{actionError || error}</p>
        </div>
      )}

      <SearchFilterBar
        right={
          <div className="flex items-center gap-3">
            {pagination && (
              <p className="text-[11px] text-[#a39e96] whitespace-nowrap">
                {pagination.total} redirect{pagination.total === 1 ? "" : "s"} total
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
          placeholder="Search by path..."
          width="280px"
        />
      </SearchFilterBar>

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={redirects}
          rowKey={(r) => r.id}
          loading={loading}
          error={error}
          loadingMessage="Loading redirects..."
          emptyMessage="No redirects yet."
        />
        <Pagination pagination={pagination} onPageChange={setPage} variant="compact" itemLabel="redirects" currentCount={redirects.length} />
      </div>

      <SeoRedirectModal open={modalOpen} onClose={closeModal} redirect={editingRedirect} />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this redirect?"
        itemName={pendingDelete?.oldPath ?? null}
        loading={deletingId === pendingDelete?.id}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
