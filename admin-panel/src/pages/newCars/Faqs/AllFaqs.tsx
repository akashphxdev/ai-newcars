// src/pages/newCars/Faqs/AllFaqs.tsx
import { useEffect, useState } from "react";
import {
  useGetFaqsQuery,
  useUpdateFaqStatusMutation,
  useDeleteFaqMutation,
  type FaqRecord,
} from "./faq.api";
import { useGetCarModelOptionsQuery } from "../carModels/carModel.api";
import { extractApiError } from "../../../lib/apiClient";
import FaqModal from "./FaqModal";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, SearchInput, FilterSelect } from "../../../components/common/SearchFilterBar";

const ACCENT = "#D4300F";
// Rows-per-page choices shown in the dropdown — same set as AllAdminLogs.tsx.
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const STATUS_OPTIONS: { value: "true" | "false"; label: string }[] = [
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

// Small pill-style toggle switch — same pattern as AllBrands.tsx's
// StatusToggle / AllCountries.tsx's StatusToggle.
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

function truncate(text: string, max = 80): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export default function AllFaqs() {
  const [page, setPage] = useState(1);
  // Rows-per-page, user-controlled via a dropdown next to the filters.
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  // Debounced copy of `search` — this is what actually goes into the
  // query args, so we don't refetch on every keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterModelId, setFilterModelId] = useState<number | "">("");
  const [filterStatus, setFilterStatus] = useState<"true" | "false" | "">("");

  const { data: carModels = [] } = useGetCarModelOptionsQuery();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data: faqsData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetFaqsQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
    modelId: filterModelId || undefined,
    isActive: filterStatus === "" ? undefined : filterStatus === "true",
  });

  const faqs = faqsData?.data ?? [];
  const pagination = faqsData?.pagination;
  const loading = isLoading || isFetching;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";

  // Modal state — null faq = "Add" mode, a record = "Edit" mode.
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqRecord | null>(null);

  const openAddModal = () => {
    setEditingFaq(null);
    setModalOpen(true);
  };

  const openEditModal = (faq: FaqRecord) => {
    setEditingFaq(faq);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingFaq(null);
  };

  const [updateFaqStatus] = useUpdateFaqStatusMutation();
  const [deleteFaq] = useDeleteFaqMutation();

  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<FaqRecord | null>(null);
  const [actionError, setActionError] = useState("");

  const handleToggleStatus = async (faq: FaqRecord) => {
    setActionError("");
    setTogglingId(faq.id);
    try {
      await updateFaqStatus({ id: faq.id, isActive: !faq.isActive }).unwrap();
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
      await deleteFaq(pendingDelete.id).unwrap();
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

  const columns: DataTableColumn<FaqRecord>[] = [
    {
      header: "Question",
      render: (f) => <p className="font-semibold text-[#1c1a17]">{truncate(f.question)}</p>,
    },
    {
      header: "Answer",
      render: (f) => <span className="text-[#7a7670]">{truncate(f.answer, 60)}</span>,
    },
    {
      header: "Model",
      render: (f) => (
        <span className="text-[#7a7670]">
          {f.model.brand.name} — {f.model.name}
        </span>
      ),
    },
    { header: "Order", render: (f) => <span className="text-[#7a7670]">{f.displayOrder}</span> },
    {
      header: "Status",
      render: (f) => (
        <div className="flex items-center gap-2">
          <StatusToggle
            checked={f.isActive}
            disabled={togglingId === f.id}
            onChange={() => handleToggleStatus(f)}
          />
          <span className={`text-[10px] font-bold ${f.isActive ? "text-green-600" : "text-[#a39e96]"}`}>
            {f.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      ),
    },
    {
      header: "",
      align: "right",
      render: (f) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openEditModal(f)}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => setPendingDelete(f)}
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
          <h1 className="text-[18px] font-black text-[#1c1a17]">FAQs</h1>
          <p className="text-[12px] text-[#a39e96] mt-0.5">
            Manage FAQs under each car model. All fields are required when adding or editing.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="cursor-pointer text-[12px] font-bold text-white px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          + Add FAQ
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
                {pagination.total} FAQ{pagination.total === 1 ? "" : "s"} total
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
          placeholder="Search by question..."
        />
        <FilterSelect
          value={filterModelId}
          onChange={(v) => {
            setFilterModelId(v ? Number(v) : "");
            setPage(1);
          }}
          options={carModels.map((m) => ({ value: m.id, label: `${m.brand.name} — ${m.name}` }))}
          placeholder="All models"
        />
        <FilterSelect
          value={filterStatus}
          onChange={(v) => {
            setFilterStatus((v as "true" | "false") || "");
            setPage(1);
          }}
          options={STATUS_OPTIONS}
          placeholder="All statuses"
        />
      </SearchFilterBar>

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={faqs}
          rowKey={(f) => f.id}
          loading={loading}
          error={error}
          loadingMessage="Loading FAQs..."
          emptyMessage="No FAQs found."
        />
        <Pagination
          pagination={pagination ?? null}
          onPageChange={setPage}
          variant="compact"
          itemLabel="FAQs"
          currentCount={faqs.length}
        />
      </div>

      {modalOpen && (
        <FaqModal
          key={editingFaq ? `edit-${editingFaq.id}` : "add"}
          open={modalOpen}
          onClose={closeModal}
          faq={editingFaq}
        />
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete FAQ?"
        itemName={pendingDelete?.question}
        loading={deletingId === pendingDelete?.id}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}