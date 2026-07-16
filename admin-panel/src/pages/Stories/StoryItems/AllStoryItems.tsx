// frontend/src/pages/Stories/StoryItems/AllStoryItems.tsx
import { useEffect, useState } from "react";
import {
  useGetStoryItemsQuery,
  useUpdateStoryItemStatusMutation,
  useDeleteStoryItemMutation,
  type StoryItemRecord,
  type StoryItemStatus,
} from "./storyItem.api";
import { useGetStoryGroupsQuery } from "../StoryGroups/storyGroup.api";
import { extractApiError, getUploadUrl } from "../../../lib/apiClient";
import StoryItemModal from "./StoryItemModal";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, SearchInput, FilterSelect } from "../../../components/common/SearchFilterBar";
import MediaThumbnail from "../../../components/common/MediaThumbnail";

const ACCENT = "#D4300F";
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const STATUS_OPTIONS: StoryItemStatus[] = ["draft", "published", "scheduled"];

const STATUS_STYLES: Record<StoryItemStatus, { bg: string; text: string }> = {
  draft: { bg: "#f7f5f1", text: "#a39e96" },
  published: { bg: "#e9f7ef", text: "#1e8a4c" },
  scheduled: { bg: "#fff4e5", text: "#b8720a" },
};

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function StatusSelect({
  value,
  onChange,
  disabled,
}: {
  value: StoryItemStatus;
  onChange: (next: StoryItemStatus) => void;
  disabled?: boolean;
}) {
  const style = STATUS_STYLES[value];
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as StoryItemStatus)}
      className="cursor-pointer text-[10px] font-bold uppercase px-2 py-1 rounded-lg border-0 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ background: style.bg, color: style.text }}
    >
      {STATUS_OPTIONS.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}

function ScheduleDialog({
  item,
  startAt,
  endAt,
  errors,
  saving,
  onStartAtChange,
  onEndAtChange,
  onCancel,
  onConfirm,
}: {
  item: StoryItemRecord;
  startAt: string;
  endAt: string;
  errors: { startAt?: string; endAt?: string };
  saving: boolean;
  onStartAtChange: (value: string) => void;
  onEndAtChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-[420px] bg-white border border-[#e8e4dc] rounded-2xl shadow-xl p-6 space-y-4">
        <div>
          <h2 className="text-[#1c1a17] text-lg font-black">Schedule this item</h2>
          <p className="text-[#a39e96] text-xs mt-1">
            {item.group.title} — set when this slide should go live and (optionally) when it should stop showing.
          </p>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1.5">
            Start
          </label>
          <input
            type="datetime-local"
            value={startAt}
            onChange={(e) => onStartAtChange(e.target.value)}
            className="w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
            style={{ borderColor: errors.startAt ? "#f0997b" : "#e2ddd5" }}
          />
          {errors.startAt && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.startAt}</p>}
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1.5">
            End <span className="normal-case font-medium text-[#c0bab0]">(optional)</span>
          </label>
          <input
            type="datetime-local"
            value={endAt}
            onChange={(e) => onEndAtChange(e.target.value)}
            className="w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
            style={{ borderColor: errors.endAt ? "#f0997b" : "#e2ddd5" }}
          />
          {errors.endAt && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.endAt}</p>}
        </div>

        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer flex-1 py-2.5 rounded-xl text-sm font-bold text-[#4a4640] border border-[#e2ddd5] hover:bg-[#f7f5f1] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={onConfirm}
            className="cursor-pointer flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            style={{ background: ACCENT }}
          >
            {saving ? "Saving..." : "Confirm schedule"}
          </button>
        </div>
      </div>
    </div>
  );
}

// No year — same compact format as ScheduleCell's date, keeps the
// Created/Updated columns narrow enough to avoid horizontal scroll.
function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Start on top, end below — stacked instead of "start → end" on one
// line so the column stays narrow enough to avoid horizontal scroll.
function ScheduleCell({ item }: { item: StoryItemRecord }) {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  if (!item.startAt && !item.endAt) {
    return <span className="text-[#a39e96]">—</span>;
  }

  return (
    <div className="whitespace-nowrap">
      <p className="text-[#7a7670]">{item.startAt ? fmt(item.startAt) : "No start"}</p>
      <p className="text-[10px] text-[#a39e96] mt-0.5">{item.endAt ? `→ ${fmt(item.endAt)}` : "No end"}</p>
    </div>
  );
}


export default function AllStoryItems() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterGroupId, setFilterGroupId] = useState<number | "">("");

  const { data: groupsData } = useGetStoryGroupsQuery({ page: 1, limit: 100, sortBy: "title", sortOrder: "asc" });
  const groups = groupsData?.data ?? [];

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data: itemsData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetStoryItemsQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
    groupId: filterGroupId || undefined,
    sortBy: "displayOrder",
    sortOrder: "asc",
  });

  const items = itemsData?.data ?? [];
  const pagination = itemsData?.pagination;
  const loading = isLoading || isFetching;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StoryItemRecord | null>(null);

  const openAddModal = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const openEditModal = (item: StoryItemRecord) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
  };

  const [updateStoryItemStatus] = useUpdateStoryItemStatusMutation();
  const [deleteStoryItem] = useDeleteStoryItemMutation();

  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<StoryItemRecord | null>(null);
  const [actionError, setActionError] = useState("");

  const [scheduleTarget, setScheduleTarget] = useState<StoryItemRecord | null>(null);
  const [scheduleStartAt, setScheduleStartAt] = useState("");
  const [scheduleEndAt, setScheduleEndAt] = useState("");
  const [scheduleErrors, setScheduleErrors] = useState<{ startAt?: string; endAt?: string }>({});
  const [scheduleSaving, setScheduleSaving] = useState(false);

  const handleStatusChange = async (item: StoryItemRecord, next: StoryItemStatus) => {
    if (next === "scheduled") {
      setScheduleTarget(item);
      setScheduleStartAt(toDatetimeLocal(item.startAt));
      setScheduleEndAt(toDatetimeLocal(item.endAt));
      setScheduleErrors({});
      return;
    }

    setActionError("");
    setTogglingId(item.id);
    try {
      await updateStoryItemStatus({ id: item.id, status: next }).unwrap();
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setTogglingId(null);
    }
  };

  const handleScheduleCancel = () => {
    setScheduleTarget(null);
    setScheduleStartAt("");
    setScheduleEndAt("");
    setScheduleErrors({});
  };

  const handleScheduleConfirm = async () => {
    if (!scheduleTarget) return;

    const nextErrors: { startAt?: string; endAt?: string } = {};
    if (!scheduleStartAt) {
      nextErrors.startAt = "Start date/time is required.";
    }
    if (scheduleStartAt && scheduleEndAt && new Date(scheduleStartAt) > new Date(scheduleEndAt)) {
      nextErrors.endAt = "End must be on or after start.";
    }
    setScheduleErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setActionError("");
    setScheduleSaving(true);
    try {
      await updateStoryItemStatus({
        id: scheduleTarget.id,
        status: "scheduled",
        startAt: fromDatetimeLocal(scheduleStartAt),
        endAt: fromDatetimeLocal(scheduleEndAt),
      }).unwrap();
      handleScheduleCancel();
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setScheduleSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setActionError("");
    setDeletingId(pendingDelete.id);
    try {
      await deleteStoryItem(pendingDelete.id).unwrap();
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

  // Row click expands to show just description/link — everything else
  // (including created/updated) stays in the main row. Same click-to-expand
  // pattern as AllAdmins.tsx's renderExpandedAdmin.
  const renderExpandedItem = (i: StoryItemRecord) => (
    <div className="grid grid-cols-4 gap-x-6 gap-y-3">
      <div className="col-span-2">
        <p className="text-[10px] font-semibold text-[#a39e96] mb-1">Description</p>
        <p className="text-[12.5px] text-[#1c1a17]">{i.description || "—"}</p>
      </div>
      <div className="col-span-2">
        <p className="text-[10px] font-semibold text-[#a39e96] mb-1">Link</p>
        {i.link ? (
          <a
            href={i.link}
            target="_blank"
            rel="noreferrer"
            className="text-[12.5px] text-[#D4300F] hover:underline break-all"
          >
            {i.link}
          </a>
        ) : (
          <p className="text-[12.5px] text-[#1c1a17]">—</p>
        )}
      </div>
    </div>
  );

  const columns: DataTableColumn<StoryItemRecord>[] = [
    {
      header: "Media",
      render: (i) => <MediaThumbnail url={getUploadUrl(i.mediaUrl) ?? undefined} mediaType={i.mediaType} />,
    },
    {
      header: "Group",
      render: (i) => (
        <span className="font-semibold text-[#1c1a17] block max-w-[110px] truncate" title={i.group.title}>
          {i.group.title}
        </span>
      ),
    },
    { header: "Order", render: (i) => <span className="text-[#7a7670]">{i.displayOrder}</span> },
    {
      header: "Views",
      render: (i) => <span className="text-[#7a7670]">{i.viewCount.toLocaleString("en-IN")}</span>,
    },
    {
      header: "Status",
      render: (i) => (
        <StatusSelect
          value={i.status}
          disabled={togglingId === i.id}
          onChange={(next) => handleStatusChange(i, next)}
        />
      ),
    },
    {
      header: "Schedule",
      render: (i) => <ScheduleCell item={i} />,
    },
    {
      header: "Created",
      render: (i) => (
        <div className="whitespace-nowrap max-w-[110px]">
          <p className="text-[#1c1a17] font-semibold truncate" title={i.createdByAdmin?.name ?? undefined}>
            {i.createdByAdmin?.name ?? "—"}
          </p>
          <p className="text-[10px] text-[#a39e96] mt-0.5">{formatDateTime(i.createdAt)}</p>
        </div>
      ),
    },
    {
      header: "Updated",
      render: (i) => (
        <div className="whitespace-nowrap max-w-[110px]">
          <p className="text-[#1c1a17] font-semibold truncate" title={i.updatedByAdmin?.name ?? undefined}>
            {i.updatedByAdmin?.name ?? "—"}
          </p>
          <p className="text-[10px] text-[#a39e96] mt-0.5">{formatDateTime(i.updatedAt)}</p>
        </div>
      ),
    },
    {
      header: "",
      align: "right",
      render: (i) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openEditModal(i)}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => setPendingDelete(i)}
            disabled={deletingId === i.id}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deletingId === i.id ? "..." : "Delete"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-[1200px]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[18px] font-black text-[#1c1a17]">Story Items</h1>
          <p className="text-[12px] text-[#a39e96] mt-0.5">
            Manage the individual slides shown inside each story group.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="cursor-pointer text-[12px] font-bold text-white px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          + Add story item
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
                {pagination.total} item{pagination.total === 1 ? "" : "s"} total
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
          placeholder="Search by description..."
        />
        <FilterSelect
          value={filterGroupId}
          onChange={(v) => {
            setFilterGroupId(v ? Number(v) : "");
            setPage(1);
          }}
          options={groups.map((g) => ({ value: g.id, label: g.title }))}
          placeholder="All groups"
        />
      </SearchFilterBar>

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={items}
          rowKey={(i) => i.id}
          loading={loading}
          error={error}
          loadingMessage="Loading story items..."
          emptyMessage="No story items found."
          expandable
          renderExpanded={renderExpandedItem}
        />
        <Pagination
          pagination={pagination ?? null}
          onPageChange={setPage}
          variant="compact"
          itemLabel="story items"
          currentCount={items.length}
        />
      </div>

      {modalOpen && (
        <StoryItemModal
          key={editingItem ? `edit-${editingItem.id}` : "add"}
          open={modalOpen}
          onClose={closeModal}
          item={editingItem}
        />
      )}

      {scheduleTarget && (
        <ScheduleDialog
          item={scheduleTarget}
          startAt={scheduleStartAt}
          endAt={scheduleEndAt}
          errors={scheduleErrors}
          saving={scheduleSaving}
          onStartAtChange={setScheduleStartAt}
          onEndAtChange={setScheduleEndAt}
          onCancel={handleScheduleCancel}
          onConfirm={handleScheduleConfirm}
        />
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete story item?"
        itemName={pendingDelete ? pendingDelete.description ?? `item #${pendingDelete.id}` : null}
        loading={deletingId === pendingDelete?.id}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}