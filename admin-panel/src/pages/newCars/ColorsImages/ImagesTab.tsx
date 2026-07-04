// src/pages/newCars/ColorsImages/ImagesTab.tsx
import { useState } from "react";
import {
  useGetImagesQuery,
  useDeleteImageMutation,
  useSetPrimaryImageMutation,
  type CarImageRecord,
} from "./image.api";
import { extractApiError, getUploadUrl } from "../../../lib/apiClient";
import ImageModal from "./ImageModal";
import Pagination from "../../../components/common/Pagination";

const ACCENT = "#D4300F";
const PAGE_SIZE = 24;

export default function ImagesTab({ modelId }: { modelId: number }) {
  const [page, setPage] = useState(1);

  const {
    data: imagesData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetImagesQuery({ page, limit: PAGE_SIZE, modelId });

  const images = imagesData?.data ?? [];
  const pagination = imagesData?.pagination;
  const loading = isLoading || isFetching;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";

  const [modalOpen, setModalOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<CarImageRecord | null>(null);

  const openAddModal = () => {
    setEditingImage(null);
    setModalOpen(true);
  };
  const openEditModal = (image: CarImageRecord) => {
    setEditingImage(image);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditingImage(null);
  };

  const [deleteImage] = useDeleteImageMutation();
  const [setPrimaryImage] = useSetPrimaryImageMutation();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  const handleDelete = async (id: number) => {
    setActionError("");
    setDeletingId(id);
    try {
      await deleteImage(id).unwrap();
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetPrimary = async (image: CarImageRecord) => {
    setActionError("");
    setTogglingId(image.id);
    try {
      await setPrimaryImage({ id: image.id, isPrimary: !image.isPrimary }).unwrap();
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {pagination && (
          <p className="text-[11px] text-[#a39e96] whitespace-nowrap">
            {pagination.total} image{pagination.total === 1 ? "" : "s"} total
          </p>
        )}
        <button
          type="button"
          onClick={openAddModal}
          className="cursor-pointer text-[12px] font-bold text-white px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90 ml-auto"
          style={{ background: ACCENT }}
        >
          + Add image
        </button>
      </div>

      {actionError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
          <p className="text-red-500 text-xs font-medium">{actionError}</p>
        </div>
      )}

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        {loading && <p className="px-4 py-10 text-center text-[#a39e96] text-[12px]">Loading images...</p>}
        {!loading && error && (
          <p className="px-4 py-10 text-center text-[#D4300F] text-[12px] font-medium">{error}</p>
        )}
        {!loading && !error && images.length === 0 && (
          <p className="px-4 py-10 text-center text-[#a39e96] text-[12px]">No images found for this model.</p>
        )}

        {!loading && !error && images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-4">
            {images.map((img) => (
              <div key={img.id} className="rounded-xl border border-[#e8e4dc] overflow-hidden bg-[#f7f5f1]">
                <div className="relative aspect-[4/3]">
                  <img src={getUploadUrl(img.imageUrl) ?? undefined} alt="" className="w-full h-full object-cover" />
                  {img.isPrimary && (
                    <span
                      className="absolute top-1.5 left-1.5 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full"
                      style={{ background: ACCENT }}
                    >
                      Cover
                    </span>
                  )}
                </div>
                <div className="p-2 space-y-1.5">
                  <p className="text-[10px] text-[#7a7670] truncate">
                    {img.angle ?? "No angle"}
                    {img.variant ? ` · ${img.variant.variantName}` : ""}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSetPrimary(img)}
                      disabled={togglingId === img.id}
                      className="cursor-pointer flex-1 text-[9.5px] font-bold px-1.5 py-1 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-white transition-colors disabled:opacity-50"
                    >
                      {img.isPrimary ? "Unset cover" : "Set cover"}
                    </button>
                    <button
                      onClick={() => openEditModal(img)}
                      className="cursor-pointer text-[9.5px] font-bold px-1.5 py-1 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-white transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(img.id)}
                      disabled={deletingId === img.id}
                      className="cursor-pointer text-[9.5px] font-bold px-1.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {deletingId === img.id ? "..." : "Del"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Pagination pagination={pagination ?? null} onPageChange={setPage} variant="simple" />
      </div>

      {modalOpen && (
        <ImageModal
          key={editingImage ? `edit-${editingImage.id}` : "add"}
          open={modalOpen}
          onClose={closeModal}
          modelId={modelId}
          image={editingImage}
        />
      )}
    </div>
  );
}