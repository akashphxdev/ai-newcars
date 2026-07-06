// src/pages/newCars/Faqs/AllFaqs.tsx
import { useState } from "react";
import {
  useGetFaqsQuery,
  useDeleteFaqMutation,
  type FaqRecord,
} from "./faq.api";
import { useGetCarModelsQuery } from "../carModels/carModel.api";
import { extractApiError } from "../../../lib/apiClient";
import FaqModal from "./FaqModal";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, SearchInput, FilterSelect } from "../../../components/common/SearchFilterBar";

const ACCENT = "#D4300F";
const PAGE_SIZE = 20;

const STATUS_OPTIONS: { value: "true" | "false"; label: string }[] = [
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

function truncate(text: string, max = 80): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export default function AllFaqs() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterModelId, setFilterModelId] = useState<number | "">("");
  const [filterStatus, setFilterStatus] = useState<"true" | "false" | "">("");

  // NOTE: same 100-row cap used elsewhere — fine while the car-models
  // table stays under 100 rows.
  const { data: carModelsData } = useGetCarModelsQuery({ limit: 100, sortBy: "name", sortOrder: "asc" });
  const carModels = carModelsData?.data ?? [];

  const {
    data: faqsData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetFaqsQuery({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
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

  const [deleteFaq] = useDeleteFaqMutation();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  const handleDelete = async (id: number) => {
    setActionError("");
    setDeletingId(id);
    try {
      await deleteFaq(id).unwrap();
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setDeletingId(null);
    }
  };

  const columns: DataTableColumn<FaqRecord>[] = [
    {
      header: "Question",
      render: (f) => (
        <>
          <p className="font-semibold text-[#1c1a17]">{truncate(f.question)}</p>
          {!f.isActive && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#f7f5f1] text-[#a39e96]">
              Inactive
            </span>
          )}
        </>
      ),
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
            onClick={() => handleDelete(f.id)}
            disabled={deletingId === f.id}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deletingId === f.id ? "..." : "Delete"}
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
          pagination && (
            <p className="text-[11px] text-[#a39e96] whitespace-nowrap">
              {pagination.total} FAQ{pagination.total === 1 ? "" : "s"} total
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
        <Pagination pagination={pagination ?? null} onPageChange={setPage} variant="simple" />
      </div>

      {modalOpen && (
        <FaqModal
          key={editingFaq ? `edit-${editingFaq.id}` : "add"}
          open={modalOpen}
          onClose={closeModal}
          faq={editingFaq}
        />
      )}
    </div>
  );
}