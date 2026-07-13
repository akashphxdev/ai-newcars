// src/pages/newCars/PowertrainIce/AllPowertrainIce.tsx
import { useState } from "react";
import {
  useGetPowertrainIceListQuery,
  useGetPowertrainIceByIdQuery,
  useDeletePowertrainIceMutation,
  useRestorePowertrainIceMutation,
  type PowertrainIceListItem,
  type FuelType,
} from "./powertrainIce.api";
import { useGetVariantsQuery } from "../Variants/variant.api";
import { useGetCarModelsQuery } from "../carModels/carModel.api";
import { useGetBrandsQuery } from "../Brands/brand.api";
import { extractApiError } from "../../../lib/apiClient";
import { FUEL_TYPE_OPTIONS, getFuelTypeLabel } from "../../../lib/lookups";
import PowertrainIceModal from "./PowertrainIceModal";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, FilterSelect } from "../../../components/common/SearchFilterBar";

const ACCENT = "#D4300F";
const PAGE_SIZE = 20;

function formatDecimal(value: string | null, suffix = ""): string {
  if (value == null) return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  return `${num}${suffix}`;
}

function formatInt(value: number | null, suffix = ""): string {
  return value != null ? `${value}${suffix}` : "—";
}

function formatDate(value: string | Date | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function SpecItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-wider text-[#a39e96]">{label}</p>
      <p className="text-[12px] font-semibold text-[#1c1a17] mt-0.5">{value}</p>
    </div>
  );
}

function ExpandedIceDetail({ id }: { id: number }) {
  const { data: p, isFetching, error } = useGetPowertrainIceByIdQuery(id);

  if (isFetching && !p) {
    return <p className="text-[12px] text-[#a39e96] font-medium">Loading full spec sheet...</p>;
  }
  if (error || !p) {
    return <p className="text-[12px] text-[#D4300F] font-medium">Couldn't load full spec sheet.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-3">
      <SpecItem label="Fuel sub-category" value={p.fuelTypeSubCategory ?? "—"} />
      <SpecItem label="Fuel tank" value={formatDecimal(p.fuelTankCapacity, " L")} />
      <SpecItem label="CNG tank" value={formatDecimal(p.cngTankCapacity, " kg")} />
      <SpecItem label="Kerb weight" value={formatInt(p.kerbWeight, " kg")} />
      <SpecItem label="Cubic capacity" value={formatInt(p.cubicCapacity, " cc")} />
      <SpecItem label="Cylinders" value={formatInt(p.cylinders)} />
      <SpecItem label="Cylinder capacity" value={formatDecimal(p.cylinderCapacity, " cc")} />
      <SpecItem label="Transmission sub-type" value={p.transmissionSubType ?? "—"} />
      <SpecItem label="Transmission speed" value={formatInt(p.transmissionSpeed)} />
      <SpecItem label="Number of gears" value={formatInt(p.numGears)} />
      <SpecItem label="Is 4x4" value={p.isFourByFour ? "Yes" : "No"} />
      <SpecItem label="Drivetrain" value={p.drivetrain?.name ?? "—"} />
      <SpecItem label="Power-to-weight" value={formatDecimal(p.powerWeight)} />
      <SpecItem label="Power min RPM" value={formatInt(p.powerMinRpm)} />
      <SpecItem label="Power max RPM" value={formatInt(p.powerMaxRpm)} />
      <SpecItem label="Torque-to-weight" value={formatDecimal(p.torqueWeight)} />
      <SpecItem label="Torque min RPM" value={formatInt(p.torqueMinRpm)} />
      <SpecItem label="Torque max RPM" value={formatInt(p.torqueMaxRpm)} />
      <SpecItem label="Claimed FE" value={formatDecimal(p.claimedFe, " kmpl")} />
      <SpecItem label="Real world mileage" value={formatDecimal(p.realWorldMileage, " kmpl")} />
      <SpecItem label="City mileage" value={formatDecimal(p.cityMileage, " kmpl")} />
      <SpecItem label="Highway mileage" value={formatDecimal(p.highwayMileage, " kmpl")} />
      <SpecItem label="Top speed" value={formatInt(p.topSpeedKmph, " km/h")} />
      <SpecItem label="0-100 time" value={formatDecimal(p.topSpeedTimeSec, " sec")} />
      <SpecItem
        label="Real-world test"
        value={p.realWorldUrl ? <a href={p.realWorldUrl} target="_blank" rel="noreferrer" className="text-[#D4300F] hover:underline">Link</a> : "—"}
      />
      <SpecItem
        label="City test"
        value={p.cityUrl ? <a href={p.cityUrl} target="_blank" rel="noreferrer" className="text-[#D4300F] hover:underline">Link</a> : "—"}
      />
      <SpecItem
        label="Highway test"
        value={p.highwayUrl ? <a href={p.highwayUrl} target="_blank" rel="noreferrer" className="text-[#D4300F] hover:underline">Link</a> : "—"}
      />
      <SpecItem label="Created" value={formatDate(p.createdAt)} />
    </div>
  );
}

export default function AllPowertrainIce() {
  const [page, setPage] = useState(1);
  const [filterBrandId, setFilterBrandId] = useState<number | "">("");
  const [filterModelId, setFilterModelId] = useState<number | "">("");
  const [filterVariantId, setFilterVariantId] = useState<number | "">("");
  const [filterFuelType, setFilterFuelType] = useState<FuelType | "">("");
  const [showArchived, setShowArchived] = useState(false);

  const { data: brandsData } = useGetBrandsQuery({ limit: 100, sortBy: "name", sortOrder: "asc" });
  const brands = brandsData?.data ?? [];

  const { data: carModelsData } = useGetCarModelsQuery({ limit: 100, sortBy: "name", sortOrder: "asc" });
  const carModels = carModelsData?.data ?? [];
  const modelsForBrand = filterBrandId ? carModels.filter((m) => m.brandId === filterBrandId) : carModels;

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
  const [editingId, setEditingId] = useState<number | null>(null);

  const openAddModal = () => {
    setEditingId(null);
    setModalOpen(true);
  };

  const openEditModal = (p: PowertrainIceListItem) => {
    setEditingId(p.id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const [deletePowertrainIce] = useDeletePowertrainIceMutation();
  const [restorePowertrainIce] = useRestorePowertrainIceMutation();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PowertrainIceListItem | null>(null);
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

  const columns: DataTableColumn<PowertrainIceListItem>[] = [
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
          {getFuelTypeLabel(p.fuelType)}
          {p.fuelTypeSubCategory ? ` · ${p.fuelTypeSubCategory}` : ""}
        </span>
      ),
    },
    { header: "Displacement", render: (p) => <span className="text-[#7a7670]">{formatDecimal(p.engineDisplacement, "L")}</span> },
    { header: "Power", render: (p) => <span className="text-[#7a7670]">{p.powerPs != null ? `${p.powerPs} PS` : "—"}</span> },
    { header: "Torque", render: (p) => <span className="text-[#7a7670]">{p.torqueNm != null ? `${p.torqueNm} Nm` : "—"}</span> },
    { header: "Transmission", render: (p) => <span className="text-[#7a7670]">{p.transmissionType?.name ?? "—"}</span> },
    {
      header: "",
      align: "right",
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
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
            setFilterFuelType(v ? (Number(v) as FuelType) : "");
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
          expandable
          renderExpanded={(p) => <ExpandedIceDetail id={p.id} />}
        />
        <Pagination pagination={pagination ?? null} onPageChange={setPage} variant="simple" />
      </div>

      {modalOpen && (
        <PowertrainIceModal
          key={editingId ? `edit-${editingId}` : "add"}
          open={modalOpen}
          onClose={closeModal}
          editId={editingId}
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