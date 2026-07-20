// src/pages/Ai/ImagePool/AllImagePool.tsx
import { useRef, useState } from "react";
import {
  useGetImagePoolQuery,
  useUploadImagePoolMutation,
  useDeleteImagePoolMutation,
  type AiImagePoolRecord,
} from "./imagePool.api";
import { extractApiError, getUploadUrl } from "../../../lib/apiClient";
import { AI_FEATURE_OPTIONS } from "../../../lib/aiLookups";
import Pagination from "../../../components/common/Pagination";
import ConfirmDialog from "../../../components/common/ConfirmDialog";

const ACCENT = "#D4300F";
const PAGE_SIZE = 24;

type UsedTab = "all" | "unused" | "used";

// After publish, img.imageUrl on the backend is updated to point at
// wherever the file now actually lives (moved out of ai-pool into
// articles/story-items — see aiArticle.service.ts/aiStoryItem.service.ts's
// publish flows), so this always resolves to the real, current URL —
// never a stale ai-pool path for a published image.
async function copyAndOpenUrl(url: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    // Clipboard permission can be denied — still open the URL so the
    // admin can copy it manually from the address bar.
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AllImagePool() {
  const [page, setPage] = useState(1);
  const [featureFilter, setFeatureFilter] = useState<number>(1);
  const [tab, setTab] = useState<UsedTab>("all");
  const [pendingDelete, setPendingDelete] = useState<AiImagePoolRecord | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyUrl = (img: AiImagePoolRecord) => {
    const url = getUploadUrl(img.imageUrl);
    if (!url) return;
    void copyAndOpenUrl(url);
    setCopiedId(img.id);
    setTimeout(() => setCopiedId((cur) => (cur === img.id ? null : cur)), 1500);
  };

  const {
    data: poolData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetImagePoolQuery({
    page,
    limit: PAGE_SIZE,
    featureKey: featureFilter,
    isUsed: tab === "all" ? undefined : tab === "used",
  });

  const images = poolData?.data ?? [];
  const pagination = poolData?.pagination;
  const loading = isLoading || isFetching;
  const error = queryError ? extractApiError(queryError) : "";

  const [uploadImages, { isLoading: uploading }] = useUploadImagePoolMutation();
  const [deleteImage, { isLoading: deleting }] = useDeleteImagePoolMutation();

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploadError("");
    try {
      await uploadImages({ featureKey: featureFilter, files: Array.from(fileList) }).unwrap();
      setPage(1);
    } catch (err) {
      setUploadError(extractApiError(err));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteImage(pendingDelete.id).unwrap();
      setPendingDelete(null);
    } catch (err) {
      setUploadError(extractApiError(err));
    }
  };

  return (
    <div className="space-y-5 max-w-[1300px]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[18px] font-black text-[#1c1a17]">AI Image Pool</h1>
          <p className="text-[12px] text-[#a39e96] mt-0.5">
            Images generators auto-pick from, oldest first. Upload one or many at once — delete any, used or not.
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            className="hidden"
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="cursor-pointer text-[12.5px] font-bold text-white px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
            style={{ background: ACCENT }}
          >
            {uploading ? (
              "Uploading..."
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                Upload Images
              </>
            )}
          </button>
        </div>
      </div>

      {(error || uploadError) && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
          <p className="text-red-500 text-xs font-medium">{uploadError || error}</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {(["all", "unused", "used"] as UsedTab[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setPage(1);
              }}
              className="cursor-pointer text-[12px] font-bold px-3.5 py-1.5 rounded-full border transition-colors capitalize"
              style={
                tab === t
                  ? { background: ACCENT, borderColor: ACCENT, color: "white" }
                  : { background: "white", borderColor: "#e8e4dc", color: "#4a4640" }
              }
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {pagination && (
            <p className="text-[11px] text-[#a39e96] whitespace-nowrap">
              {pagination.total} image{pagination.total === 1 ? "" : "s"}
            </p>
          )}
          <select
            value={featureFilter}
            onChange={(e) => {
              setFeatureFilter(Number(e.target.value));
              setPage(1);
            }}
            className="cursor-pointer text-[12px] text-[#4a4640] bg-[#f7f5f1] border border-[#e8e4dc] rounded-lg px-3 py-2 outline-none"
          >
            {AI_FEATURE_OPTIONS.filter((f) => f.value === 1 || f.value === 2).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[13px] text-[#a39e96]">Loading images...</div>
        ) : images.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-[#a39e96]">
            No images in the pool yet — upload some to get started.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 p-4">
            {images.map((img) => (
              <div
                key={img.id}
                className="group relative aspect-square rounded-lg overflow-hidden border border-[#e8e4dc] bg-[#f7f5f1]"
              >
                <img
                  src={getUploadUrl(img.imageUrl) ?? undefined}
                  alt={img.originalFilename ?? ""}
                  className="w-full h-full object-cover"
                />
                {img.isUsed && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyUrl(img);
                    }}
                    title="Copy the live image URL and open it in a new tab"
                    className="cursor-pointer absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#1c1a17]/80 text-white hover:bg-[#1c1a17] transition-colors"
                  >
                    {copiedId === img.id ? "Copied!" : `Used${img.usedForId ? ` #${img.usedForId}` : ""}`}
                  </button>
                )}
                <button
                  onClick={() => setPendingDelete(img)}
                  className="cursor-pointer absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/90 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-50"
                  aria-label="Delete image"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 py-1">
                  <p className="text-[9px] text-white/90 truncate">{fmtDate(img.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <Pagination
          pagination={pagination ?? null}
          onPageChange={setPage}
          variant="compact"
          itemLabel="images"
          currentCount={images.length}
        />
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this image?"
        itemName={pendingDelete?.originalFilename}
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}