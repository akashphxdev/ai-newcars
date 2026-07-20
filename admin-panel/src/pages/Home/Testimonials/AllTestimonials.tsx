// src/pages/Home/Testimonials/AllTestimonials.tsx
import { useEffect, useState } from "react";
import {
  useGetTestimonialsQuery,
  useUpdateTestimonialStatusMutation,
  useUpdateTestimonialActiveMutation,
  useDeleteTestimonialMutation,
  type TestimonialRecord,
  type TestimonialStatus,
} from "./testimonial.api";
import { extractApiError, getUploadUrl } from "../../../lib/apiClient";
import TestimonialModal from "./TestimonialModal";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import PromptDialog from "../../../components/common/PromptDialog";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, SearchInput, FilterSelect } from "../../../components/common/SearchFilterBar";

const ACCENT = "#D4300F";
// Rows-per-page choices shown in the dropdown — same set as AllOffers.tsx.
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const STATUS_OPTIONS: { value: TestimonialStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_STYLES: Record<TestimonialStatus, string> = {
  pending: "bg-[#f7f5f1] text-[#a39e96]",
  approved: "bg-green-50 text-green-600",
  rejected: "bg-red-50 text-red-500",
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SpecItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-wider text-[#a39e96]">{label}</p>
      <p className="text-[#1c1a17] font-medium mt-0.5 break-words">{value}</p>
    </div>
  );
}

// Row detail shown only when a row is expanded — keeps the main table
// compact (no horizontal scroll) while still surfacing every field.
// Same pattern as AllBanners.tsx's ExpandedBannerDetail.
function ExpandedTestimonialDetail({ t }: { t: TestimonialRecord }) {
  return (
    <div className="space-y-4">
      <SpecItem label="Full quote" value={t.quote} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
        <SpecItem label="Display order" value={t.displayOrder} />
        <SpecItem label="Linked user account" value={t.user ? t.user.name : "— (entered manually)"} />
        {t.status === "rejected" && <SpecItem label="Rejected reason" value={t.rejectedReason ?? "—"} />}
        {t.reviewedByAdmin && (
          <SpecItem label="Reviewed by" value={`${t.reviewedByAdmin.name} · ${formatDateTime(t.reviewedAt)}`} />
        )}
        <SpecItem
          label="Created by"
          value={t.createdByAdmin ? `${t.createdByAdmin.name} · ${formatDateTime(t.createdAt)}` : formatDateTime(t.createdAt)}
        />
      </div>
    </div>
  );
}

// Small pill-style toggle switch — same pattern as AllOffers.tsx's StatusToggle.
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
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
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

export default function AllTestimonials() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<TestimonialStatus | "">("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data: testimonialsData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetTestimonialsQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
    status: filterStatus || undefined,
  });

  const testimonials = testimonialsData?.data ?? [];
  const pagination = testimonialsData?.pagination;
  const loading = isLoading || isFetching;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<TestimonialRecord | null>(null);

  const openAddModal = () => {
    setEditingTestimonial(null);
    setModalOpen(true);
  };

  const openEditModal = (testimonial: TestimonialRecord) => {
    setEditingTestimonial(testimonial);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingTestimonial(null);
  };

  const [updateStatus] = useUpdateTestimonialStatusMutation();
  const [updateActive] = useUpdateTestimonialActiveMutation();
  const [deleteTestimonial] = useDeleteTestimonialMutation();

  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TestimonialRecord | null>(null);
  const [pendingReject, setPendingReject] = useState<TestimonialRecord | null>(null);
  const [actionError, setActionError] = useState("");

  const handleApprove = async (testimonial: TestimonialRecord) => {
    setActionError("");
    setStatusUpdatingId(testimonial.id);
    try {
      await updateStatus({ id: testimonial.id, status: "approved" }).unwrap();
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
      await updateStatus({ id: pendingReject.id, status: "rejected", rejectedReason: reason }).unwrap();
      setPendingReject(null);
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleToggleActive = async (testimonial: TestimonialRecord) => {
    setActionError("");
    setTogglingId(testimonial.id);
    try {
      await updateActive({ id: testimonial.id, isActive: !testimonial.isActive }).unwrap();
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
      await deleteTestimonial(pendingDelete.id).unwrap();
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

  const columns: DataTableColumn<TestimonialRecord>[] = [
    {
      header: "Photo",
      render: (t) =>
        getUploadUrl(t.photoUrl) ? (
          <img
            src={getUploadUrl(t.photoUrl)!}
            alt=""
            className="w-9 h-9 rounded-full object-cover border border-[#e8e4dc]"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-[#f7f5f1] border border-[#e8e4dc]" />
        ),
    },
    {
      header: "Customer",
      render: (t) => (
        <>
          <p className="font-semibold text-[#1c1a17]">{t.customerName}</p>
          <p className="text-[#a39e96]">{t.customerCity ?? "—"}</p>
        </>
      ),
    },
    {
      header: "Quote",
      render: (t) => <p className="max-w-[220px] truncate text-[#7a7670]">{t.quote}</p>,
    },
    { header: "Rating", render: (t) => <span className="text-[#7a7670]">{t.rating ?? "—"}</span> },
    { header: "Order", render: (t) => <span className="text-[#7a7670]">{t.displayOrder}</span> },
    {
      header: "Status",
      render: (t) => (
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${STATUS_STYLES[t.status]}`}>
          {t.status}
        </span>
      ),
    },
    {
      header: "Visible",
      render: (t) => (
        <StatusToggle
          checked={t.isActive}
          disabled={togglingId === t.id || t.status !== "approved"}
          onChange={() => handleToggleActive(t)}
        />
      ),
    },
    {
      header: "",
      align: "right",
      render: (t) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {t.status === "pending" && (
            <>
              <button
                onClick={() => handleApprove(t)}
                disabled={statusUpdatingId === t.id}
                className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-green-100 text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => setPendingReject(t)}
                disabled={statusUpdatingId === t.id}
                className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                Reject
              </button>
            </>
          )}
          <button
            onClick={() => openEditModal(t)}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => setPendingDelete(t)}
            disabled={deletingId === t.id}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deletingId === t.id ? "..." : "Delete"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-[1200px]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[18px] font-black text-[#1c1a17]">Testimonials</h1>
          <p className="text-[12px] text-[#a39e96] mt-0.5">
            Review, approve, and manage customer testimonials shown on the homepage.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="cursor-pointer text-[12px] font-bold text-white px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          + Add testimonial
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
                {pagination.total} testimonial{pagination.total === 1 ? "" : "s"} total
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
          placeholder="Search by customer name or quote..."
        />
        <FilterSelect
          value={filterStatus}
          onChange={(v) => {
            setFilterStatus((v as TestimonialStatus) || "");
            setPage(1);
          }}
          options={STATUS_OPTIONS}
          placeholder="All statuses"
        />
      </SearchFilterBar>

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={testimonials}
          rowKey={(t) => t.id}
          loading={loading}
          error={error}
          loadingMessage="Loading testimonials..."
          emptyMessage="No testimonials found."
          expandable
          renderExpanded={(t) => <ExpandedTestimonialDetail t={t} />}
        />
        <Pagination
          pagination={pagination ?? null}
          onPageChange={setPage}
          variant="compact"
          itemLabel="testimonials"
          currentCount={testimonials.length}
        />
      </div>

      {modalOpen && (
        <TestimonialModal
          key={editingTestimonial ? `edit-${editingTestimonial.id}` : "add"}
          open={modalOpen}
          onClose={closeModal}
          testimonial={editingTestimonial}
        />
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete testimonial?"
        itemName={pendingDelete?.customerName ?? undefined}
        loading={deletingId === pendingDelete?.id}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      <PromptDialog
        open={!!pendingReject}
        title={`Reject testimonial from "${pendingReject?.customerName ?? ""}"?`}
        label="Reason for rejecting"
        placeholder="e.g. Content doesn't meet our guidelines"
        confirmLabel="Reject"
        loading={statusUpdatingId === pendingReject?.id}
        onCancel={() => setPendingReject(null)}
        onConfirm={handleConfirmReject}
      />
    </div>
  );
}
