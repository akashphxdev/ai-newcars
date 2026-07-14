// src/pages/newCars/Videos/AllVideos.tsx
import { useEffect, useState } from "react";
import {
  useGetVideosQuery,
  useUpdateVideoStatusMutation,
  useDeleteVideoMutation,
  type VideoRecord,
} from "./video.api";
import { useGetCarModelOptionsQuery } from "../carModels/carModel.api";
import { VIDEO_TYPE_OPTIONS, getVideoTypeLabel } from "../../../lib/lookups";
import { extractApiError, getUploadUrl } from "../../../lib/apiClient";
import VideoModal from "./VideoModal";
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

// Small pill-style toggle switch — same pattern as AllBrands.tsx's / AllFaqs.tsx's StatusToggle.
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

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AllVideos() {
  const [page, setPage] = useState(1);
  // Rows-per-page, user-controlled via a dropdown next to the filters.
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  // Debounced copy of `search` — this is what actually goes into the
  // query args, so we don't refetch on every keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterModelId, setFilterModelId] = useState<number | "">("");
  const [filterVideoType, setFilterVideoType] = useState<number | "">("");
  const [filterStatus, setFilterStatus] = useState<"true" | "false" | "">("");

  const { data: carModels = [] } = useGetCarModelOptionsQuery();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data: videosData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetVideosQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
    modelId: filterModelId || undefined,
    videoType: filterVideoType || undefined,
    isActive: filterStatus === "" ? undefined : filterStatus === "true",
  });

  const videos = videosData?.data ?? [];
  const pagination = videosData?.pagination;
  const loading = isLoading || isFetching;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";

  // Modal state — null video = "Add" mode, a record = "Edit" mode.
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoRecord | null>(null);

  const openAddModal = () => {
    setEditingVideo(null);
    setModalOpen(true);
  };

  const openEditModal = (video: VideoRecord) => {
    setEditingVideo(video);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingVideo(null);
  };

  const [updateVideoStatus] = useUpdateVideoStatusMutation();
  const [deleteVideo] = useDeleteVideoMutation();

  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<VideoRecord | null>(null);
  const [actionError, setActionError] = useState("");

  const handleToggleStatus = async (video: VideoRecord) => {
    setActionError("");
    setTogglingId(video.id);
    try {
      await updateVideoStatus({ id: video.id, isActive: !video.isActive }).unwrap();
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
      await deleteVideo(pendingDelete.id).unwrap();
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

  const columns: DataTableColumn<VideoRecord>[] = [
    {
      header: "Video",
      render: (v) => (
        <div className="flex items-center gap-2.5">
          {getUploadUrl(v.thumbnailUrl) ? (
            <img
              src={getUploadUrl(v.thumbnailUrl)!}
              alt=""
              className="w-14 h-9 rounded-md object-cover bg-[#f7f5f1]"
            />
          ) : (
            <div className="w-14 h-9 rounded-md bg-[#f7f5f1]" />
          )}
          <div>
            <p className="font-semibold text-[#1c1a17]">{v.title}</p>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#f7f5f1] text-[#4a4640] uppercase">
              {getVideoTypeLabel(v.videoType)}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Model",
      render: (v) => (
        <span className="text-[#7a7670]">
          {v.model.brand.name} — {v.model.name}
        </span>
      ),
    },
    { header: "Duration", render: (v) => <span className="text-[#7a7670]">{formatDuration(v.durationSeconds)}</span> },
    { header: "Views", render: (v) => <span className="text-[#7a7670]">{v.viewCount.toLocaleString("en-IN")}</span> },
    { header: "Published", render: (v) => <span className="text-[#7a7670] whitespace-nowrap text-xs">{formatDate(v.publishedAt)}</span> },
    {
      header: "Status",
      render: (v) => (
        <div className="flex items-center gap-2">
          <StatusToggle
            checked={v.isActive}
            disabled={togglingId === v.id}
            onChange={() => handleToggleStatus(v)}
          />
          <span className={`text-[10px] font-bold ${v.isActive ? "text-green-600" : "text-[#a39e96]"}`}>
            {v.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      ),
    },
    {
      header: "",
      align: "right",
      render: (v) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openEditModal(v)}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => setPendingDelete(v)}
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
          <h1 className="text-[18px] font-black text-[#1c1a17]">Videos</h1>
          <p className="text-[12px] text-[#a39e96] mt-0.5">
            Manage videos under each car model. All fields are required when adding or editing.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="cursor-pointer text-[12px] font-bold text-white px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          + Add video
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
                {pagination.total} video{pagination.total === 1 ? "" : "s"} total
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
          value={filterVideoType}
          onChange={(v) => {
            setFilterVideoType(v ? Number(v) : "");
            setPage(1);
          }}
          options={VIDEO_TYPE_OPTIONS}
          placeholder="All types"
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
          rows={videos}
          rowKey={(v) => v.id}
          loading={loading}
          error={error}
          loadingMessage="Loading videos..."
          emptyMessage="No videos found."
        />
        <Pagination
          pagination={pagination ?? null}
          onPageChange={setPage}
          variant="compact"
          itemLabel="videos"
          currentCount={videos.length}
        />
      </div>

      {modalOpen && (
        <VideoModal
          key={editingVideo ? `edit-${editingVideo.id}` : "add"}
          open={modalOpen}
          onClose={closeModal}
          video={editingVideo}
        />
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete video?"
        itemName={pendingDelete?.title}
        loading={deletingId === pendingDelete?.id}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}