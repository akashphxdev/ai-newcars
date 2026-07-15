// frontend/src/pages/Stories/StoryGroups/AllStoryGroups.tsx
import { useEffect, useState } from "react";
import {
  useGetStoryGroupsQuery,
  useUpdateStoryGroupStatusMutation,
  useDeleteStoryGroupMutation,
  type StoryGroupRecord,
} from "./storyGroup.api";
import { extractApiError, getUploadUrl } from "../../../lib/apiClient";
import StoryGroupModal from "./StoryGroupModal";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, SearchInput } from "../../../components/common/SearchFilterBar";

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

function CoverThumb({ group }: { group: StoryGroupRecord }) {
  if (group.coverMediaType === "image") {
    return (
      <img
        src={getUploadUrl(group.coverMediaUrl) ?? undefined}
        alt=""
        className="w-9 h-9 rounded-lg object-cover border border-[#e8e4dc]"
      />
    );
  }
  return (
    <div className="w-9 h-9 rounded-lg bg-[#f7f5f1] border border-[#e8e4dc] flex items-center justify-center">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a39e96" strokeWidth="2">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    </div>
  );
}

export default function AllStoryGroups() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data: groupsData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetStoryGroupsQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
    sortBy: "displayOrder",
    sortOrder: "asc",
  });

  const groups = groupsData?.data ?? [];
  const pagination = groupsData?.pagination;
  const loading = isLoading || isFetching;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<StoryGroupRecord | null>(null);

  const openAddModal = () => {
    setEditingGroup(null);
    setModalOpen(true);
  };

  const openEditModal = (group: StoryGroupRecord) => {
    setEditingGroup(group);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingGroup(null);
  };

  const [updateStoryGroupStatus] = useUpdateStoryGroupStatusMutation();
  const [deleteStoryGroup] = useDeleteStoryGroupMutation();

  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<StoryGroupRecord | null>(null);
  const [actionError, setActionError] = useState("");

  const handleToggleStatus = async (group: StoryGroupRecord) => {
    setActionError("");
    setTogglingId(group.id);
    try {
      await updateStoryGroupStatus({ id: group.id, isActive: !group.isActive }).unwrap();
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
      await deleteStoryGroup(pendingDelete.id).unwrap();
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

  const columns: DataTableColumn<StoryGroupRecord>[] = [
    { header: "Cover", render: (g) => <CoverThumb group={g} /> },
    {
      header: "Title",
      render: (g) => (
        <>
          <p className="font-semibold text-[#1c1a17]">{g.title}</p>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#f7f5f1] text-[#4a4640] uppercase">
            {g.coverMediaType}
          </span>
        </>
      ),
    },
    { header: "Order", render: (g) => <span className="text-[#7a7670]">{g.displayOrder}</span> },
    {
      header: "Views",
      render: (g) => <span className="text-[#7a7670]">{g.viewCount.toLocaleString("en-IN")}</span>,
    },
    {
      header: "Status",
      render: (g) => (
        <div className="flex items-center gap-2">
          <StatusToggle
            checked={g.isActive}
            disabled={togglingId === g.id}
            onChange={() => handleToggleStatus(g)}
          />
          <span className={`text-[10px] font-bold ${g.isActive ? "text-green-600" : "text-[#a39e96]"}`}>
            {g.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      ),
    },
    {
      header: "Created by",
      render: (g) => <span className="text-[#7a7670]">{g.createdByAdmin?.name ?? "—"}</span>,
    },
    {
      header: "Created At",
      render: (g) => <span className="text-[#7a7670] whitespace-nowrap">{fmtDate(g.createdAt)}</span>,
    },
    {
      header: "Updated by",
      render: (g) => <span className="text-[#7a7670]">{g.updatedByAdmin?.name ?? "—"}</span>,
    },
    {
      header: "Updated At",
      render: (g) => <span className="text-[#7a7670] whitespace-nowrap">{fmtDate(g.updatedAt)}</span>,
    },
    {
      header: "",
      align: "right",
      render: (g) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openEditModal(g)}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => setPendingDelete(g)}
            disabled={deletingId === g.id}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deletingId === g.id ? "..." : "Delete"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-[1200px]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[18px] font-black text-[#1c1a17]">Story Groups</h1>
          <p className="text-[12px] text-[#a39e96] mt-0.5">
            Manage story groups (the circles/thumbnails shown to users). Each group holds one or more story
            items.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="cursor-pointer text-[12px] font-bold text-white px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          + Add story group
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
                {pagination.total} group{pagination.total === 1 ? "" : "s"} total
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
          placeholder="Search by title..."
        />
      </SearchFilterBar>

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={groups}
          rowKey={(g) => g.id}
          loading={loading}
          error={error}
          loadingMessage="Loading story groups..."
          emptyMessage="No story groups found."
        />
        <Pagination
          pagination={pagination ?? null}
          onPageChange={setPage}
          variant="compact"
          itemLabel="story groups"
          currentCount={groups.length}
        />
      </div>

      {modalOpen && (
        <StoryGroupModal
          key={editingGroup ? `edit-${editingGroup.id}` : "add"}
          open={modalOpen}
          onClose={closeModal}
          group={editingGroup}
        />
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete story group?"
        itemName={pendingDelete?.title}
        message={
          pendingDelete
            ? "This will also delete all story items inside this group and their media files."
            : undefined
        }
        loading={deletingId === pendingDelete?.id}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}