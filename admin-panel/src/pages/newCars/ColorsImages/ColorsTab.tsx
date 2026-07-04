// src/pages/newCars/ColorsImages/ColorsTab.tsx
import { useState } from "react";
import { useGetColorsQuery, useDeleteColorMutation, type CarColorRecord } from "./color.api";
import { extractApiError, getUploadUrl } from "../../../lib/apiClient";
import ColorModal from "./ColorModal";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, SearchInput } from "../../../components/common/SearchFilterBar";

const ACCENT = "#D4300F";
const PAGE_SIZE = 20;

export default function ColorsTab({ modelId }: { modelId: number }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const {
    data: colorsData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetColorsQuery({ page, limit: PAGE_SIZE, modelId, search: search || undefined });

  const colors = colorsData?.data ?? [];
  const pagination = colorsData?.pagination;
  const loading = isLoading || isFetching;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";

  const [modalOpen, setModalOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<CarColorRecord | null>(null);

  const openAddModal = () => {
    setEditingColor(null);
    setModalOpen(true);
  };
  const openEditModal = (color: CarColorRecord) => {
    setEditingColor(color);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditingColor(null);
  };

  const [deleteColor] = useDeleteColorMutation();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  const handleDelete = async (id: number) => {
    setActionError("");
    setDeletingId(id);
    try {
      await deleteColor(id).unwrap();
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setDeletingId(null);
    }
  };

  const columns: DataTableColumn<CarColorRecord>[] = [
    {
      header: "Swatch",
      render: (c) =>
        getUploadUrl(c.imageUrl) ? (
          <img
            src={getUploadUrl(c.imageUrl)!}
            alt=""
            className="w-7 h-7 rounded-lg object-cover border border-[#e8e4dc]"
          />
        ) : (
          <div
            className="w-7 h-7 rounded-lg border border-[#e8e4dc]"
            style={{ background: c.colorHex ?? "#f7f5f1" }}
          />
        ),
    },
    { header: "Color name", render: (c) => <span className="font-semibold text-[#1c1a17]">{c.colorName}</span> },
    { header: "Hex", render: (c) => <span className="text-[#7a7670] font-mono">{c.colorHex ?? "—"}</span> },
    {
      header: "Dual tone",
      render: (c) => (
        <span className={`text-[10px] font-bold ${c.isDualTone ? "text-green-600" : "text-[#a39e96]"}`}>
          {c.isDualTone ? "Yes" : "No"}
        </span>
      ),
    },
    {
      header: "Additional cost",
      render: (c) => <span className="text-[#7a7670]">{c.additionalCost ? `₹${c.additionalCost}` : "—"}</span>,
    },
    {
      header: "",
      align: "right",
      render: (c) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openEditModal(c)}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(c.id)}
            disabled={deletingId === c.id}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deletingId === c.id ? "..." : "Delete"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          type="button"
          onClick={openAddModal}
          className="cursor-pointer text-[12px] font-bold text-white px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          + Add color
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
              {pagination.total} color{pagination.total === 1 ? "" : "s"} total
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
          placeholder="Search by color name..."
        />
      </SearchFilterBar>

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={colors}
          rowKey={(c) => c.id}
          loading={loading}
          error={error}
          loadingMessage="Loading colors..."
          emptyMessage="No colors found for this model."
        />
        <Pagination pagination={pagination ?? null} onPageChange={setPage} variant="simple" />
      </div>

      {modalOpen && (
        <ColorModal
          key={editingColor ? `edit-${editingColor.id}` : "add"}
          open={modalOpen}
          onClose={closeModal}
          modelId={modelId}
          color={editingColor}
        />
      )}
    </div>
  );
}