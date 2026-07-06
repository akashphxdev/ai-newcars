// src/pages/newCars/carModels/AllCarModels.tsx
import { useState } from "react";
import {
  useGetCarModelsQuery,
  useUpdateCarModelLaunchStatusMutation,
  useDeleteCarModelMutation,
  type CarModelRecord,
  type LaunchStatus,
} from "./carModel.api";
import { useGetBrandsQuery } from "../Brands/brand.api";
import { extractApiError, getUploadUrl } from "../../../lib/apiClient";
import CarModelModal from "./CarModelModal";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, SearchInput, FilterSelect } from "../../../components/common/SearchFilterBar";

const ACCENT = "#D4300F";
const PAGE_SIZE = 20;

const LAUNCH_STATUS_OPTIONS: { value: LaunchStatus; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "upcoming", label: "Upcoming" },
  { value: "discontinued", label: "Discontinued" },
];

function LaunchStatusBadge({ status }: { status: LaunchStatus }) {
  const styles: Record<LaunchStatus, string> = {
    available: "text-green-600 bg-green-50",
    upcoming: "text-amber-600 bg-amber-50",
    discontinued: "text-[#a39e96] bg-[#f7f5f1]",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${styles[status]}`}>
      {LAUNCH_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status}
    </span>
  );
}

function formatPrice(value: string | null): string {
  if (!value) return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  return `₹${(num / 100000).toFixed(2)}L`;
}

export default function AllCarModels() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterBrandId, setFilterBrandId] = useState<number | "">("");
  const [filterLaunchStatus, setFilterLaunchStatus] = useState<LaunchStatus | "">("");

  // NOTE: same 100-row cap as Brand's country dropdown — fine while the
  // brands table stays under 100 rows.
  const { data: brandsData } = useGetBrandsQuery({ limit: 100, sortBy: "name", sortOrder: "asc" });
  const brands = brandsData?.data ?? [];

  const {
    data: carModelsData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetCarModelsQuery({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    brandId: filterBrandId || undefined,
    launchStatus: filterLaunchStatus || undefined,
  });

  const carModels = carModelsData?.data ?? [];
  const pagination = carModelsData?.pagination;
  const loading = isLoading || isFetching;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";

  // Modal state — null car model = "Add" mode, a record = "Edit" mode.
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCarModel, setEditingCarModel] = useState<CarModelRecord | null>(null);

  const openAddModal = () => {
    setEditingCarModel(null);
    setModalOpen(true);
  };

  const openEditModal = (carModel: CarModelRecord) => {
    setEditingCarModel(carModel);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCarModel(null);
  };

  const [updateLaunchStatus] = useUpdateCarModelLaunchStatusMutation();
  const [deleteCarModel] = useDeleteCarModelMutation();

  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  // Row pending delete confirmation — set on "Delete" click, cleared on
  // cancel/confirm. Drives the shared ConfirmDialog popup.
  const [pendingDelete, setPendingDelete] = useState<CarModelRecord | null>(null);
  const [actionError, setActionError] = useState("");

  const handleLaunchStatusChange = async (carModel: CarModelRecord, launchStatus: LaunchStatus) => {
    if (launchStatus === carModel.launchStatus) return;
    setActionError("");
    setTogglingId(carModel.id);
    try {
      await updateLaunchStatus({ id: carModel.id, launchStatus }).unwrap();
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
      await deleteCarModel(pendingDelete.id).unwrap();
      setPendingDelete(null);
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setDeletingId(null);
    }
  };

  const columns: DataTableColumn<CarModelRecord>[] = [
    {
      header: "Cover",
      render: (cm) => (
        <div className="w-12 h-9 rounded-lg border border-[#e8e4dc] bg-[#f7f5f1] overflow-hidden flex items-center justify-center">
          {cm.coverImageUrl ? (
            <img src={getUploadUrl(cm.coverImageUrl) ?? undefined} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[8px] text-[#a39e96]">—</span>
          )}
        </div>
      ),
    },
    {
      header: "Name",
      render: (cm) => (
        <>
          <p className="font-semibold text-[#1c1a17]">{cm.name}</p>
          <p className="text-[#a39e96]">{cm.slug}</p>
        </>
      ),
    },
    { header: "Brand", render: (cm) => <span className="text-[#7a7670]">{cm.brand.name}</span> },
    { header: "Body type", render: (cm) => <span className="text-[#7a7670] capitalize">{cm.bodyType ?? "—"}</span> },
    {
      header: "Price range",
      render: (cm) => (
        <span className="text-[#7a7670] whitespace-nowrap">
          {formatPrice(cm.priceMin)} – {formatPrice(cm.priceMax)}
        </span>
      ),
    },
    {
      header: "Launch status",
      render: (cm) => (
        <div className="flex items-center gap-2">
          <LaunchStatusBadge status={cm.launchStatus} />
          <select
            value={cm.launchStatus}
            disabled={togglingId === cm.id}
            onChange={(e) => handleLaunchStatusChange(cm, e.target.value as LaunchStatus)}
            className="cursor-pointer text-[10px] font-semibold text-[#4a4640] bg-white border border-[#e2ddd5] rounded-lg px-1.5 py-1 outline-none disabled:opacity-50"
          >
            {LAUNCH_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ),
    },
    {
      header: "",
      align: "right",
      render: (cm) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openEditModal(cm)}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => setPendingDelete(cm)}
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
          <h1 className="text-[18px] font-black text-[#1c1a17]">Car Models</h1>
          <p className="text-[12px] text-[#a39e96] mt-0.5">
            Manage car models under each brand. Slug is auto-generated from the name if left blank.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="cursor-pointer text-[12px] font-bold text-white px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          + Add car model
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
              {pagination.total} car model{pagination.total === 1 ? "" : "s"} total
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
          placeholder="Search by name or slug..."
        />
        <FilterSelect
          value={filterBrandId}
          onChange={(v) => {
            setFilterBrandId(v ? Number(v) : "");
            setPage(1);
          }}
          options={brands.map((b) => ({ value: b.id, label: b.name }))}
          placeholder="All brands"
        />
        <FilterSelect
          value={filterLaunchStatus}
          onChange={(v) => {
            setFilterLaunchStatus((v as LaunchStatus) || "");
            setPage(1);
          }}
          options={LAUNCH_STATUS_OPTIONS}
          placeholder="All statuses"
        />
      </SearchFilterBar>

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={carModels}
          rowKey={(cm) => cm.id}
          loading={loading}
          error={error}
          loadingMessage="Loading car models..."
          emptyMessage="No car models found."
        />
        <Pagination pagination={pagination ?? null} onPageChange={setPage} variant="simple" />
      </div>

      {modalOpen && (
        <CarModelModal
          key={editingCarModel ? `edit-${editingCarModel.id}` : "add"}
          open={modalOpen}
          onClose={closeModal}
          carModel={editingCarModel}
        />
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete car model?"
        itemName={pendingDelete?.name}
        loading={deletingId === pendingDelete?.id}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}