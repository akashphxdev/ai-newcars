// src/pages/newCars/PowertrainIce/AllPowertrainIce.tsx
import { useState } from "react";
import {
  useGetPowertrainIceListQuery,
  useDeletePowertrainIceMutation,
  useRestorePowertrainIceMutation,
  type PowertrainIceRecord,
  type FuelType,
} from "./powertrainIce.api";
import { useGetVariantsQuery } from "../Variants/variant.api";
import { useGetCarModelsQuery } from "../carModels/carModel.api";
import { useGetBrandsQuery } from "../Brands/brand.api";
import { extractApiError } from "../../../lib/apiClient";
import PowertrainIceModal from "./PowertrainIceModal";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, FilterSelect } from "../../../components/common/SearchFilterBar";

const ACCENT = "#D4300F";
const PAGE_SIZE = 20;

const FUEL_TYPE_OPTIONS: { value: FuelType; label: string }[] = [
  { value: "petrol", label: "Petrol" },
  { value: "diesel", label: "Diesel" },
  { value: "cng", label: "CNG" },
  { value: "lpg", label: "LPG" },
  { value: "hybrid", label: "Hybrid" },
];

function formatDecimal(value: string | null, suffix = ""): string {
  if (value == null) return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  return `${num}${suffix}`;
}

export default function AllPowertrainIce() {
  const [page, setPage] = useState(1);
  const [filterBrandId, setFilterBrandId] = useState<number | "">("");
  const [filterModelId, setFilterModelId] = useState<number | "">("");
  const [filterVariantId, setFilterVariantId] = useState<number | "">("");
  const [filterFuelType, setFilterFuelType] = useState<FuelType | "">("");
  // "Archived" tab — soft-deleted rows are hidden by default (see
  // includeDeleted in powertrainIce.api.ts / powertrainIce.validation.ts).
  const [showArchived, setShowArchived] = useState(false);

  const { data: brandsData } = useGetBrandsQuery({ limit: 100, sortBy: "name", sortOrder: "asc" });
  const brands = brandsData?.data ?? [];

  // NOTE: same 100-row cap used elsewhere — fine while the car-models
  // table stays under 100 rows.
  const { data: carModelsData } = useGetCarModelsQuery({ limit: 100, sortBy: "name", sortOrder: "asc" });
  const carModels = carModelsData?.data ?? [];
  const modelsForBrand = filterBrandId ? carModels.filter((m) => m.brandId === filterBrandId) : carModels;

  // NOTE: same 100-row cap used elsewhere — fine while the variants
  // table stays under 100 rows.
  const { data: variantsData } = useGetVariantsQuery({ limit: 100, sortBy: "variantName", sortOrder: "asc" });
  const variants = variantsData?.data ?? [];
  const variantsForModel = filterModelId
    ? variants.filter((v) => v.modelId === filterModelId)
    : filterBrandId
      ? variants.filter((v) => v.model.brand.id === filterBrandId)
      : variants;

  const {
    data: powertrainData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetPowertrainIceListQuery({
    page,
    limit: PAGE_SIZE,
    variantId: filterVariantId || undefined,
    fuelType: filterFuelType || undefined,
    includeDeleted: showArchived,
  });

  const powertrains = powertrainData?.data ?? [];
  const pagination = powertrainData?.pagination;
  const loading = isLoading || isFetching;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPowertrain, setEditingPowertrain] = useState<PowertrainIceRecord | null>(null);

  const openAddModal = () => {
    setEditingPowertrain(null);
    setModalOpen(true);
  };

  const openEditModal = (p: PowertrainIceRecord) => {
    setEditingPowertrain(p);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingPowertrain(null);
  };

  const [deletePowertrainIce] = useDeletePowertrainIceMutation();
  const [restorePowertrainIce] = useRestorePowertrainIceMutation();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PowertrainIceRecord | null>(null);
  const [actionError, setActionError] = useState("");

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setActionError("");
    setBusyId(pendingDelete.id);
    try {
      await deletePowertrainIce(pendingDelete.id).unwrap();
      setPendingDelete(null);
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleRestore = async (id: number) => {
    setActionError("");
    setBusyId(id);
    try {
      await restorePowertrainIce(id).unwrap();
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setBusyId(null);
    }
  };

  const columns: DataTableColumn<PowertrainIceRecord>[] = [
    {
      header: "Variant",
      render: (p) => (
        <>
          <p className="font-semibold text-[#1c1a17]">
            {p.variant.model.brand.name} — {p.variant.model.name} — {p.variant.variantName}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {p.isDefault && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600">
                Default
              </span>
            )}
            {p.isDeleted && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-500">
                Archived
              </span>
            )}
          </div>
        </>
      ),
    },
    {
      header: "Fuel",
      render: (p) => (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-[#4a4640] bg-[#f7f5f1] uppercase">
          {p.fuelType}
          {p.fuelTypeSubCategory ? ` · ${p.fuelTypeSubCategory}` : ""}
        </span>
      ),
    },
    { header: "Displacement", render: (p) => <span className="text-[#7a7670]">{formatDecimal(p.engineDisplacement, "L")}</span> },
    { header: "Power", render: (p) => <span className="text-[#7a7670]">{p.powerPs != null ? `${p.powerPs} PS` : "—"}</span> },
    { header: "Torque", render: (p) => <span className="text-[#7a7670]">{p.torqueNm != null ? `${p.torqueNm} Nm` : "—"}</span> },
    { header: "Transmission", render: (p) => <span className="text-[#7a7670] uppercase">{p.transmissionType ?? "—"}</span> },
    {
      header: "",
      align: "right",
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5">
          {p.isDeleted ? (
            <button
              onClick={() => handleRestore(p.id)}
              disabled={busyId === p.id}
              className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors disabled:opacity-50"
            >
              {busyId === p.id ? "..." : "Restore"}
            </button>
          ) : (
            <>
              <button
                onClick={() => openEditModal(p)}
                className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => setPendingDelete(p)}
                className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-[1200px]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[18px] font-black text-[#1c1a17]">ICE Powertrains</h1>
          <p className="text-[12px] text-[#a39e96] mt-0.5">
            Manage petrol/diesel/CNG/hybrid engine specs per variant.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="cursor-pointer text-[12px] font-bold text-white px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          + Add ICE powertrain
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
              {pagination.total} powertrain{pagination.total === 1 ? "" : "s"} total
            </p>
          )
        }
      >
        <FilterSelect
          value={filterBrandId}
          onChange={(v) => {
            const next = v ? Number(v) : "";
            setFilterBrandId(next);
            setFilterModelId("");
            setFilterVariantId("");
            setPage(1);
          }}
          options={brands.map((b) => ({ value: b.id, label: b.name }))}
          placeholder="All brands"
        />
        <FilterSelect
          value={filterModelId}
          onChange={(v) => {
            const next = v ? Number(v) : "";
            setFilterModelId(next);
            setFilterVariantId("");
            setPage(1);
          }}
          options={modelsForBrand.map((m) => ({ value: m.id, label: m.name }))}
          placeholder="All models"
        />
        <FilterSelect
          value={filterVariantId}
          onChange={(v) => {
            setFilterVariantId(v ? Number(v) : "");
            setPage(1);
          }}
          options={variantsForModel.map((v) => ({
            value: v.id,
            label: `${v.model.brand.name} — ${v.model.name} — ${v.variantName}`,
          }))}
          placeholder="All variants"
        />
        <FilterSelect
          value={filterFuelType}
          onChange={(v) => {
            setFilterFuelType((v as FuelType) || "");
            setPage(1);
          }}
          options={FUEL_TYPE_OPTIONS}
          placeholder="All fuel types"
        />
        <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-medium text-[#4a4640] px-1">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => {
              setShowArchived(e.target.checked);
              setPage(1);
            }}
            className="w-4 h-4 rounded accent-[#D4300F] cursor-pointer"
          />
          Show archived
        </label>
      </SearchFilterBar>

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={powertrains}
          rowKey={(p) => p.id}
          loading={loading}
          error={error}
          loadingMessage="Loading ICE powertrains..."
          emptyMessage="No ICE powertrains found."
        />
        <Pagination pagination={pagination ?? null} onPageChange={setPage} variant="simple" />
      </div>

      {modalOpen && (
        <PowertrainIceModal
          key={editingPowertrain ? `edit-${editingPowertrain.id}` : "add"}
          open={modalOpen}
          onClose={closeModal}
          powertrain={editingPowertrain}
        />
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete ICE powertrain?"
        itemName={pendingDelete?.variant.variantName}
        loading={busyId === pendingDelete?.id}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}