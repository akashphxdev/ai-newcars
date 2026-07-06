// src/pages/newCars/Videos/AllVideos.tsx
import { useState } from "react";
import {
  useGetVideosQuery,
  useDeleteVideoMutation,
  VIDEO_TYPES,
  type VideoRecord,
  type VideoTypeValue,
} from "./video.api";
import { useGetCarModelsQuery } from "../carModels/carModel.api";
import { extractApiError } from "../../../lib/apiClient";
import VideoModal from "./VideoModal";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, SearchInput, FilterSelect } from "../../../components/common/SearchFilterBar";

const ACCENT = "#D4300F";
const PAGE_SIZE = 20;

const VIDEO_TYPE_OPTIONS: { value: VideoTypeValue; label: string }[] = VIDEO_TYPES.map((t) => ({
  value: t,
  label: t.charAt(0).toUpperCase() + t.slice(1),
}));

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AllVideos() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterModelId, setFilterModelId] = useState<number | "">("");
  const [filterVideoType, setFilterVideoType] = useState<VideoTypeValue | "">("");

  // NOTE: same 100-row cap used elsewhere — fine while the car-models
  // table stays under 100 rows.
  const { data: carModelsData } = useGetCarModelsQuery({ limit: 100, sortBy: "name", sortOrder: "asc" });
  const carModels = carModelsData?.data ?? [];

  const {
    data: videosData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetVideosQuery({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    modelId: filterModelId || undefined,
    videoType: filterVideoType || undefined,
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

  const [deleteVideo] = useDeleteVideoMutation();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  const handleDelete = async (id: number) => {
    setActionError("");
    setDeletingId(id);
    try {
      await deleteVideo(id).unwrap();
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setDeletingId(null);
    }
  };

  const columns: DataTableColumn<VideoRecord>[] = [
    {
      header: "Video",
      render: (v) => (
        <div className="flex items-center gap-2.5">
          {v.thumbnailUrl ? (
            <img src={v.thumbnailUrl} alt="" className="w-14 h-9 rounded-md object-cover bg-[#f7f5f1]" />
          ) : (
            <div className="w-14 h-9 rounded-md bg-[#f7f5f1]" />
          )}
          <div>
            <p className="font-semibold text-[#1c1a17]">{v.title}</p>
            {v.videoType && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#f7f5f1] text-[#4a4640] uppercase">
                {v.videoType}
              </span>
            )}
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
            onClick={() => handleDelete(v.id)}
            disabled={deletingId === v.id}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deletingId === v.id ? "..." : "Delete"}
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
            Manage videos under each car model. Title, URL and model are required.
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
          pagination && (
            <p className="text-[11px] text-[#a39e96] whitespace-nowrap">
              {pagination.total} video{pagination.total === 1 ? "" : "s"} total
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
            setFilterVideoType((v as VideoTypeValue) || "");
            setPage(1);
          }}
          options={VIDEO_TYPE_OPTIONS}
          placeholder="All types"
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
        <Pagination pagination={pagination ?? null} onPageChange={setPage} variant="simple" />
      </div>

      {modalOpen && (
        <VideoModal
          key={editingVideo ? `edit-${editingVideo.id}` : "add"}
          open={modalOpen}
          onClose={closeModal}
          video={editingVideo}
        />
      )}
    </div>
  );
}