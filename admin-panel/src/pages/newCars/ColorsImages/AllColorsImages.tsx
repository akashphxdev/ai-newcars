// src/pages/newCars/ColorsImages/AllColorsImages.tsx
import { useEffect, useState } from "react";
import { useGetModelsWithColorsOrImagesQuery, type ModelWithColorsOrImagesRecord } from "./colorImage.api";
import ColorsImagesPanel from "./ColorsImagesPanel";
import ColorModal from "./ColorModal";
import ImageModal from "./ImageModal";
import AddToNewModelModal from "./AddToNewModelModal";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, SearchInput } from "../../../components/common/SearchFilterBar";

const ACCENT = "#D4300F";
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function AllColorsImages() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data: modelsData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetModelsWithColorsOrImagesQuery({ page, limit, search: debouncedSearch || undefined });

  const models = modelsData?.data ?? [];
  const pagination = modelsData?.pagination;
  const loading = isLoading || isFetching;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";

  const [addNewModelOpen, setAddNewModelOpen] = useState(false);
  const [addColorForModelId, setAddColorForModelId] = useState<number | null>(null);
  const [addImageForModelId, setAddImageForModelId] = useState<number | null>(null);

  const handleLimitChange = (value: number) => {
    setLimit(value);
    setPage(1);
  };

  const columns: DataTableColumn<ModelWithColorsOrImagesRecord>[] = [
    {
      header: "Model",
      render: (m) => (
        <p className="font-semibold text-[#1c1a17]">
          {m.brand.name} — {m.name}
        </p>
      ),
    },
    {
      header: "Colors",
      render: (m) => (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-[#4a4640] bg-[#f7f5f1]">
          {m.colorsCount}
        </span>
      ),
    },
    {
      header: "Images",
      render: (m) => (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-[#4a4640] bg-[#f7f5f1]">
          {m.imagesCount}
        </span>
      ),
    },
    {
      header: "",
      align: "right",
      render: (m) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setAddColorForModelId(m.id)}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors"
          >
            + Colour
          </button>
          <button
            onClick={() => setAddImageForModelId(m.id)}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors"
          >
            + Image
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-[1200px]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[18px] font-black text-[#1c1a17]">Colors & Images</h1>
          <p className="text-[12px] text-[#a39e96] mt-0.5">
            Models that already have colors or images. Expand a row to view, edit or delete them.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddNewModelOpen(true)}
          className="cursor-pointer text-[12px] font-bold text-white px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          + Add to new model
        </button>
      </div>

      <SearchFilterBar
        right={
          <div className="flex items-center gap-3">
            {pagination && (
              <p className="text-[11px] text-[#a39e96] whitespace-nowrap">
                {pagination.total} model{pagination.total === 1 ? "" : "s"} total
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
          placeholder="Search by model or brand..."
        />
      </SearchFilterBar>

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={models}
          rowKey={(m) => m.id}
          loading={loading}
          error={error}
          loadingMessage="Loading models..."
          emptyMessage="No models have colors or images yet — use “+ Add to new model” to get started."
          expandable
          renderExpanded={(m) => <ColorsImagesPanel modelId={m.id} />}
        />
        <Pagination
          pagination={pagination ?? null}
          onPageChange={setPage}
          variant="compact"
          itemLabel="models"
          currentCount={models.length}
        />
      </div>

      <AddToNewModelModal open={addNewModelOpen} onClose={() => setAddNewModelOpen(false)} />

      {addColorForModelId != null && (
        <ColorModal open onClose={() => setAddColorForModelId(null)} modelId={addColorForModelId} />
      )}

      {addImageForModelId != null && (
        <ImageModal open onClose={() => setAddImageForModelId(null)} modelId={addImageForModelId} />
      )}
    </div>
  );
}
