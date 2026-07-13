// src/pages/newCars/PowertrainElectric/AllPowertrainElectric.tsx
import { useState } from "react";
import {
  useGetPowertrainElectricListQuery,
  useGetPowertrainElectricByIdQuery,
  useDeletePowertrainElectricMutation,
  useRestorePowertrainElectricMutation,
  type PowertrainElectricListItem,
} from "./powertrainElectric.api";
import { useGetVariantsQuery } from "../Variants/variant.api";
import { useGetCarModelsQuery } from "../carModels/carModel.api";
import { useGetBrandsQuery } from "../Brands/brand.api";
import { extractApiError } from "../../../lib/apiClient";
import { getTestCycleTypeLabel } from "../../../lib/lookups";
import PowertrainElectricModal from "./PowertrainElectricModal";
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

function ExpandedElectricDetail({ id }: { id: number }) {
  const { data: p, isFetching, error } = useGetPowertrainElectricByIdQuery(id);

  if (isFetching && !p) {
    return <p className="text-[12px] text-[#a39e96] font-medium">Loading full spec sheet...</p>;
  }
  if (error || !p) {
    return <p className="text-[12px] text-[#D4300F] font-medium">Couldn't load full spec sheet.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-3">
      <SpecItem label="Number of motors" value={formatInt(p.numMotors)} />
      <SpecItem label="Motor type" value={p.motorType ?? "—"} />
      <SpecItem label="Battery chemistry" value={p.batteryChemistry ?? "—"} />
      <SpecItem label="Thermal mgmt" value={p.thermalManagementSystem ?? "—"} />
      <SpecItem label="Bootspace" value={formatInt(p.powertrainBootspace, " L")} />
      <SpecItem label="Real world range" value={formatInt(p.realWorldRange, " km")} />
      <SpecItem label="Test cycle" value={getTestCycleTypeLabel(p.testCycleType)} />
      <SpecItem label="Top speed" value={formatInt(p.topSpeedKmph, " km/h")} />
      <SpecItem label="0-100 time" value={formatDecimal(p.topSpeedTimeSec, " sec")} />
      <SpecItem label="AC charging output" value={formatDecimal(p.acChargingOutput, " kW")} />
      <SpecItem label="AC charging time" value={formatDecimal(p.acChargingTime, " hrs")} />
      <SpecItem label="3 kW charger" value={formatInt(p.chargerSizeAc3kwHours, " hrs")} />
      <SpecItem label="7 kW charger" value={formatInt(p.chargerSizeAc7kwHours, " hrs")} />
      <SpecItem label="11 kW charger" value={formatInt(p.chargerSizeAc11kwHours, " hrs")} />
      <SpecItem label="22 kW charger" value={formatInt(p.chargerSizeAc22kwHours, " hrs")} />
      <SpecItem label="DC charging output" value={formatDecimal(p.dcChargingOutput, " kW")} />
      <SpecItem label="DC fast charging" value={p.dcFastChargingTime ?? "—"} />
      <SpecItem label="Battery warranty" value={p.batteryWarrantyKm != null ? `${p.batteryWarrantyKm} km` : "—"} />
      <SpecItem label="Battery warranty (yrs)" value={formatInt(p.batteryWarrantyYears)} />
      <SpecItem label="Motor warranty" value={p.motorWarrantyKm != null ? `${p.motorWarrantyKm} km` : "—"} />
      <SpecItem label="Motor warranty (yrs)" value={formatInt(p.motorWarrantyYears)} />
      <SpecItem label="Standard warranty" value={p.standardWarrantyKm ?? "—"} />
      <SpecItem label="Standard warranty (yrs)" value={formatInt(p.standardWarrantyYears)} />
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

export default function AllPowertrainElectric() {
  const [page, setPage] = useState(1);
  const [filterBrandId, setFilterBrandId] = useState<number | "">("");
  const [filterModelId, setFilterModelId] = useState<number | "">("");
  const [filterVariantId, setFilterVariantId] = useState<number | "">("");
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
  } = useGetPowertrainElectricListQuery({
    page,
    limit: PAGE_SIZE,
    variantId: filterVariantId || undefined,
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

  const openEditModal = (p: PowertrainElectricListItem) => {
    setEditingId(p.id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const [deletePowertrainElectric] = useDeletePowertrainElectricMutation();
  const [restorePowertrainElectric] = useRestorePowertrainElectricMutation();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PowertrainElectricListItem | null>(null);
  const [actionError, setActionError] = useState("");

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setActionError("");
    setBusyId(pendingDelete.id);
    try {
      await deletePowertrainElectric(pendingDelete.id).unwrap();
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
      await restorePowertrainElectric(id).unwrap();
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setBusyId(null);
    }
  };

  const columns: DataTableColumn<PowertrainElectricListItem>[] = [
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
    { header: "Battery", render: (p) => <span className="text-[#7a7670]">{formatDecimal(p.batteryCapacity, " kWh")}</span> },
    { header: "Range", render: (p) => <span className="text-[#7a7670]">{p.claimedRange != null ? `${p.claimedRange} km` : "—"}</span> },
    { header: "Power", render: (p) => <span className="text-[#7a7670]">{p.powerPs != null ? `${p.powerPs} PS` : "—"}</span> },
    { header: "Torque", render: (p) => <span className="text-[#7a7670]">{p.torqueNm != null ? `${p.torqueNm} Nm` : "—"}</span> },
    { header: "Drivetrain", render: (p) => <span className="text-[#7a7670]">{p.drivetrain?.name ?? "—"}</span> },
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
          <h1 className="text-[18px] font-black text-[#1c1a17]">Electric Powertrains</h1>
          <p className="text-[12px] text-[#a39e96] mt-0.5">
            Manage battery, motor, range and charging specs per variant.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="cursor-pointer text-[12px] font-bold text-white px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          + Add Electric powertrain
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
          loadingMessage="Loading Electric powertrains..."
          emptyMessage="No Electric powertrains found."
          expandable
          renderExpanded={(p) => <ExpandedElectricDetail id={p.id} />}
        />
        <Pagination pagination={pagination ?? null} onPageChange={setPage} variant="simple" />
      </div>

      {modalOpen && (
        <PowertrainElectricModal
          key={editingId ? `edit-${editingId}` : "add"}
          open={modalOpen}
          onClose={closeModal}
          editId={editingId}
        />
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete Electric powertrain?"
        itemName={pendingDelete?.variant.variantName}
        loading={busyId === pendingDelete?.id}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}