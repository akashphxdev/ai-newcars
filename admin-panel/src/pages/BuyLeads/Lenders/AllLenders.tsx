// src/pages/BuyLeads/Lenders/AllLenders.tsx
import { useEffect, useState } from "react";
import { useGetLendersQuery, useUpdateLenderStatusMutation, useDeleteLenderMutation, type LenderRecord } from "./lender.api";
import { extractApiError, getUploadUrl } from "../../../lib/apiClient";
import LenderModal from "./LenderModal";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, SearchInput, FilterSelect } from "../../../components/common/SearchFilterBar";

const ACCENT = "#D4300F";
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const STATUS_OPTIONS = [
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

function fmtPercent(value: string | null): string {
  return value ? `${Number(value).toFixed(2)}%` : "—";
}

function fmtAmount(value: string | null): string {
  return value ? `₹${Number(value).toLocaleString("en-IN")}` : "—";
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// Small pill-style toggle switch — same pattern as AllBrands.tsx's StatusToggle.
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

export default function AllLenders() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isActive, setIsActive] = useState<"" | "true" | "false">("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data: lendersData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetLendersQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
    isActive: isActive === "" ? undefined : isActive === "true",
  });

  const lenders = lendersData?.data ?? [];
  const pagination = lendersData?.pagination;
  const loading = isLoading || isFetching;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";

  const [modalOpen, setModalOpen] = useState(false);
  const [editingLender, setEditingLender] = useState<LenderRecord | null>(null);

  const openAddModal = () => {
    setEditingLender(null);
    setModalOpen(true);
  };

  const openEditModal = (lender: LenderRecord) => {
    setEditingLender(lender);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingLender(null);
  };

  const [updateLenderStatus] = useUpdateLenderStatusMutation();
  const [deleteLender] = useDeleteLenderMutation();

  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<LenderRecord | null>(null);
  const [actionError, setActionError] = useState("");

  const handleToggleStatus = async (lender: LenderRecord) => {
    setActionError("");
    setTogglingId(lender.id);
    try {
      await updateLenderStatus({ id: lender.id, isActive: !lender.isActive }).unwrap();
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
      await deleteLender(pendingDelete.id).unwrap();
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

  const columns: DataTableColumn<LenderRecord>[] = [
    {
      header: "Logo",
      render: (l) =>
        getUploadUrl(l.logoUrl) ? (
          <img src={getUploadUrl(l.logoUrl)!} alt="" className="w-7 h-7 rounded-lg object-cover border border-[#e8e4dc]" />
        ) : (
          <div className="w-7 h-7 rounded-lg bg-[#f7f5f1] border border-[#e8e4dc]" />
        ),
    },
    { header: "Name", render: (l) => <span className="font-semibold text-[#1c1a17]">{l.name}</span> },
    {
      header: "Interest Rate",
      render: (l) => (
        <span className="text-[#4a4640]">
          {l.minInterestRate || l.maxInterestRate ? `${fmtPercent(l.minInterestRate)} - ${fmtPercent(l.maxInterestRate)}` : "—"}
        </span>
      ),
    },
    { header: "Max Loan", render: (l) => <span className="text-[#7a7670]">{fmtAmount(l.maxLoanAmount)}</span> },
    { header: "Max Tenure", render: (l) => <span className="text-[#7a7670]">{l.maxTenureYears ? `${l.maxTenureYears} yrs` : "—"}</span> },
    {
      header: "Status",
      render: (l) => (
        <div className="flex items-center gap-2">
          <StatusToggle checked={l.isActive} disabled={togglingId === l.id} onChange={() => handleToggleStatus(l)} />
          <span className={`text-[10px] font-bold ${l.isActive ? "text-green-600" : "text-[#a39e96]"}`}>
            {l.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      ),
    },
    {
      header: "Created By",
      render: (l) => (
        <div>
          <p className="text-[#4a4640]">{l.createdByAdmin?.name ?? "—"}</p>
          <p className="text-[10.5px] text-[#a39e96]">{fmtDate(l.createdAt)}</p>
        </div>
      ),
    },
    {
      header: "Last Updated By",
      render: (l) => (
        <div>
          <p className="text-[#4a4640]">{l.updatedByAdmin?.name ?? "—"}</p>
          <p className="text-[10.5px] text-[#a39e96]">{fmtDate(l.updatedAt)}</p>
        </div>
      ),
    },
    {
      header: "",
      align: "right",
      render: (l) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openEditModal(l)}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => setPendingDelete(l)}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[18px] font-black text-[#1c1a17]">Lenders</h1>
          <p className="text-[12px] text-[#a39e96] mt-0.5">
            Banks/NBFCs shown as "Preferred Lender" options on the Loan Lead form.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="cursor-pointer text-[12px] font-bold text-white px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          + Add lender
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
                {pagination.total} lender{pagination.total === 1 ? "" : "s"} total
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
          placeholder="Search by name..."
        />
        <FilterSelect
          value={isActive}
          onChange={(v) => {
            setIsActive((v as "" | "true" | "false") || "");
            setPage(1);
          }}
          options={STATUS_OPTIONS}
          placeholder="All statuses"
        />
      </SearchFilterBar>

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable columns={columns} rows={lenders} rowKey={(l) => l.id} loading={loading} error={error} loadingMessage="Loading lenders..." emptyMessage="No lenders found." />
        <Pagination pagination={pagination ?? null} onPageChange={setPage} variant="compact" itemLabel="lenders" currentCount={lenders.length} />
      </div>

      {modalOpen && (
        <LenderModal key={editingLender ? `edit-${editingLender.id}` : "add"} open={modalOpen} onClose={closeModal} lender={editingLender} />
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete lender?"
        itemName={pendingDelete?.name}
        loading={deletingId === pendingDelete?.id}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
