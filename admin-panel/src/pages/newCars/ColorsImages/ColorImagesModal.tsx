// src/pages/newCars/ColorsImages/ColorImagesModal.tsx
//
// Opened by clicking the "+" button on a color row in ColorsTab. Replaces
// the old inline row-expand panel (ColorImagesPanel) — same content, just
// presented as a popup instead of expanding the table row. Reuses
// BulkImageUploader for the upload widget, which already accepts either a
// single file or many at once through the same picker.

import { useState } from "react";
import { useGetImagesQuery, useDeleteImageMutation } from "./image.api";
import { getUploadUrl, extractApiError } from "../../../lib/apiClient";
import BulkImageUploader from "../../../components/common/BulkImageUploader";
import ConfirmDialog from "../../../components/common/ConfirmDialog";

export default function ColorImagesModal({
  open,
  onClose,
  modelId,
  color,
}: {
  open: boolean;
  onClose: () => void;
  modelId: number;
  color: { id: number; colorName: string };
}) {
  const {
    data: imagesData,
    isFetching,
    error: queryError,
  } = useGetImagesQuery({ modelId, colorId: color.id, limit: 100, sortBy: "id", sortOrder: "asc" });

  const images = imagesData?.data ?? [];
  const error = queryError ? "Couldn't load images for this color." : "";

  const [deleteImage] = useDeleteImageMutation();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const handleConfirmDelete = async () => {
    if (pendingDeleteId == null) return;
    setActionError("");
    setDeletingId(pendingDeleteId);
    try {
      await deleteImage(pendingDeleteId).unwrap();
      setPendingDeleteId(null);
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setDeletingId(null);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[620px] bg-white border border-[#e8e4dc] rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h2 className="text-[#1c1a17] text-lg font-black">Images for "{color.colorName}"</h2>
            <p className="text-[#a39e96] text-xs mt-1">
              Upload one image or many at once — all of them get tagged to this color.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer text-[#c0bab0] hover:text-[#1c1a17] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-6 pb-6 pt-5 space-y-4">
          {actionError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
              <p className="text-red-500 text-xs font-medium">{actionError}</p>
            </div>
          )}

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#a39e96] mb-2">
              Existing images
            </p>

            {isFetching && images.length === 0 && (
              <p className="text-[12px] text-[#a39e96] font-medium">Loading images...</p>
            )}
            {!isFetching && error && <p className="text-[12px] text-[#D4300F] font-medium">{error}</p>}
            {!isFetching && !error && images.length === 0 && (
              <p className="text-[12px] text-[#a39e96] font-medium">No images added for this color yet.</p>
            )}

            {images.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="relative aspect-square rounded-lg overflow-hidden border border-[#e8e4dc] group"
                  >
                    <img src={getUploadUrl(img.imageUrl) ?? undefined} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(img.id)}
                      aria-label="Delete"
                      className="cursor-pointer absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-1 border-t border-[#f0ece6]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#a39e96] mb-2 mt-3">
              Add images to this color
            </p>
            {/* Same widget handles single or bulk — dropping/selecting one
                file still works, it just uploads a batch of one. */}
            <BulkImageUploader modelId={modelId} colorId={color.id} />
          </div>

          <div className="flex items-center justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer px-4 py-2.5 rounded-xl text-sm font-bold text-[#4a4640] border border-[#e2ddd5] hover:bg-[#f7f5f1] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={pendingDeleteId != null}
        title="Delete this image?"
        itemName={pendingDeleteId != null ? `image #${pendingDeleteId}` : null}
        loading={deletingId === pendingDeleteId}
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}