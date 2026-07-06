// src/pages/newCars/Features/AllFeatures.tsx
import { useState } from "react";
import { useGetFeaturesQuery, useDeleteFeatureMutation, type FeatureRecord } from "./feature.api";
import { useGetVariantsQuery } from "../Variants/variant.api";
import { extractApiError } from "../../../lib/apiClient";
import FeatureModal from "./FeatureModal";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, FilterSelect } from "../../../components/common/SearchFilterBar";

const ACCENT = "#D4300F";
const PAGE_SIZE = 20;

function countEnabled(f: FeatureRecord): number {
  const flags: boolean[] = [
    f.absWithEbd, f.esc, f.hillAssist, f.rearParkingCamera, f.frontParkingSensors,
    f.tpms, f.isofixMounts, f.sunroof, f.keylessEntry, f.pushButtonStart,
    f.cruiseControl, f.climateControl, f.rearAcVents, f.autoDimmingMirror, f.powerWindows,
    f.adjustableSeats, f.ventilatedSeats, f.rearArmrest, f.ledHeadlamps, f.ledDrls,
    f.alloyWheels, f.roofRails, f.fogLamps, f.androidAuto, f.appleCarplay,
    f.connectedCarTech, f.wirelessCharging,
  ];
  return flags.filter(Boolean).length;
}

export default function AllFeatures() {
  const [page, setPage] = useState(1);
  const [filterVariantId, setFilterVariantId] = useState<number | "">("");

  // NOTE: same 100-row cap used elsewhere (Brand dropdown, PowertrainIce
  // filter) — fine while the variants table stays under 100 rows.
  const { data: variantsData } = useGetVariantsQuery({ limit: 100, sortBy: "variantName", sortOrder: "asc" });
  const variants = variantsData?.data ?? [];

  const {
    data: featureData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetFeaturesQuery({
    page,
    limit: PAGE_SIZE,
    variantId: filterVariantId || undefined,
  });

  const features = featureData?.data ?? [];
  const pagination = featureData?.pagination;
  const loading = isLoading || isFetching;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";

  const [modalOpen, setModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<FeatureRecord | null>(null);

  const openAddModal = () => {
    setEditingFeature(null);
    setModalOpen(true);
  };

  const openEditModal = (f: FeatureRecord) => {
    setEditingFeature(f);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingFeature(null);
  };

  const [deleteFeature] = useDeleteFeatureMutation();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  const handleDelete = async (id: number) => {
    setActionError("");
    setBusyId(id);
    try {
      await deleteFeature(id).unwrap();
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setBusyId(null);
    }
  };

  const columns: DataTableColumn<FeatureRecord>[] = [
    {
      header: "Variant",
      render: (f) => (
        <p className="font-semibold text-[#1c1a17]">
          {f.variant.model.brand.name} — {f.variant.model.name} — {f.variant.variantName}
        </p>
      ),
    },
    {
      header: "NCAP rating",
      render: (f) => (
        <span className="text-[#7a7670]">{f.ncapRating != null ? `${f.ncapRating} ★` : "—"}</span>
      ),
    },
    {
      header: "Airbags",
      render: (f) => <span className="text-[#7a7670]">{f.airbagsCount ?? "—"}</span>,
    },
    {
      header: "Touchscreen",
      render: (f) => (
        <span className="text-[#7a7670]">{f.touchscreenSizeInch != null ? `${f.touchscreenSizeInch}"` : "—"}</span>
      ),
    },
    {
      header: "Features on",
      render: (f) => (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-[#4a4640] bg-[#f7f5f1]">
          {countEnabled(f)} enabled
        </span>
      ),
    },
    {
      header: "",
      align: "right",
      render: (f) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openEditModal(f)}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(f.id)}
            disabled={busyId === f.id}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {busyId === f.id ? "..." : "Delete"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-[1200px]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[18px] font-black text-[#1c1a17]">Features</h1>
          <p className="text-[12px] text-[#a39e96] mt-0.5">
            Manage safety, comfort & tech feature sheets per variant.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="cursor-pointer text-[12px] font-bold text-white px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          + Add feature sheet
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
              {pagination.total} feature sheet{pagination.total === 1 ? "" : "s"} total
            </p>
          )
        }
      >
        <FilterSelect
          value={filterVariantId}
          onChange={(v) => {
            setFilterVariantId(v ? Number(v) : "");
            setPage(1);
          }}
          options={variants.map((v) => ({
            value: v.id,
            label: `${v.model.brand.name} — ${v.model.name} — ${v.variantName}`,
          }))}
          placeholder="All variants"
        />
      </SearchFilterBar>

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={features}
          rowKey={(f) => f.id}
          loading={loading}
          error={error}
          loadingMessage="Loading feature sheets..."
          emptyMessage="No feature sheets found."
        />
        <Pagination pagination={pagination ?? null} onPageChange={setPage} variant="simple" />
      </div>

      {modalOpen && (
        <FeatureModal
          key={editingFeature ? `edit-${editingFeature.id}` : "add"}
          open={modalOpen}
          onClose={closeModal}
          feature={editingFeature}
        />
      )}
    </div>
  );
}