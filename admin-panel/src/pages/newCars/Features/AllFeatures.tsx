// src/pages/newCars/Features/AllFeatures.tsx
import { useState } from "react";
import { useGetFeaturesQuery, useDeleteFeatureMutation, type FeatureRecord } from "./feature.api";
import { useGetVariantsQuery } from "../Variants/variant.api";
import { extractApiError } from "../../../lib/apiClient";
import FeatureModal from "./FeatureModal";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
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

function formatDate(value: string | null): string {
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

// Yes/No pill for boolean spec fields — greyed out when off so an
// expanded sheet full of "No"s doesn't visually compete with the ones
// that are actually turned on.
function BoolItem({ label, value }: { label: string; value: boolean }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-wider text-[#a39e96]">{label}</p>
      <p className={`text-[12px] font-semibold mt-0.5 ${value ? "text-[#1c1a17]" : "text-[#c0bab0]"}`}>
        {value ? "Yes" : "No"}
      </p>
    </div>
  );
}

function ExpandedFeatureDetail({ f }: { f: FeatureRecord }) {
  // The list endpoint already returns every field on the feature sheet
  // (same FEATURE_SELECT used for both list + getById on the backend),
  // so no extra fetch is needed here — just render what's already on `f`.
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-black uppercase tracking-wider text-[#1c1a17] border-b border-[#f0ece6] pb-1.5 mb-3">
          Safety
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-3">
          <SpecItem label="Airbags" value={f.airbagsCount ?? "—"} />
          <SpecItem label="NCAP rating" value={f.ncapRating != null ? `${f.ncapRating} ★` : "—"} />
          <BoolItem label="ABS with EBD" value={f.absWithEbd} />
          <BoolItem label="ESC" value={f.esc} />
          <BoolItem label="Hill assist" value={f.hillAssist} />
          <BoolItem label="Rear parking camera" value={f.rearParkingCamera} />
          <BoolItem label="Front parking sensors" value={f.frontParkingSensors} />
          <BoolItem label="TPMS" value={f.tpms} />
          <BoolItem label="ISOFIX mounts" value={f.isofixMounts} />
        </div>
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-wider text-[#1c1a17] border-b border-[#f0ece6] pb-1.5 mb-3">
          Comfort & convenience
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-3">
          <BoolItem label="Sunroof" value={f.sunroof} />
          <BoolItem label="Keyless entry" value={f.keylessEntry} />
          <BoolItem label="Push button start" value={f.pushButtonStart} />
          <BoolItem label="Cruise control" value={f.cruiseControl} />
          <BoolItem label="Climate control" value={f.climateControl} />
          <BoolItem label="Rear AC vents" value={f.rearAcVents} />
          <BoolItem label="Auto-dimming mirror" value={f.autoDimmingMirror} />
          <BoolItem label="Power windows" value={f.powerWindows} />
        </div>
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-wider text-[#1c1a17] border-b border-[#f0ece6] pb-1.5 mb-3">
          Seating
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-3">
          <SpecItem label="Upholstery type" value={f.upholsteryType ?? "—"} />
          <BoolItem label="Adjustable seats" value={f.adjustableSeats} />
          <BoolItem label="Ventilated seats" value={f.ventilatedSeats} />
          <BoolItem label="Rear armrest" value={f.rearArmrest} />
        </div>
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-wider text-[#1c1a17] border-b border-[#f0ece6] pb-1.5 mb-3">
          Exterior
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-3">
          <BoolItem label="LED headlamps" value={f.ledHeadlamps} />
          <BoolItem label="LED DRLs" value={f.ledDrls} />
          <BoolItem label="Alloy wheels" value={f.alloyWheels} />
          <BoolItem label="Roof rails" value={f.roofRails} />
          <BoolItem label="Fog lamps" value={f.fogLamps} />
        </div>
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-wider text-[#1c1a17] border-b border-[#f0ece6] pb-1.5 mb-3">
          Infotainment & tech
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-3">
          <SpecItem label="Touchscreen" value={f.touchscreenSizeInch != null ? `${f.touchscreenSizeInch}"` : "—"} />
          <SpecItem label="Speakers" value={f.numberOfSpeakers ?? "—"} />
          <BoolItem label="Android Auto" value={f.androidAuto} />
          <BoolItem label="Apple CarPlay" value={f.appleCarplay} />
          <BoolItem label="Connected car tech" value={f.connectedCarTech} />
          <BoolItem label="Wireless charging" value={f.wirelessCharging} />
        </div>
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-wider text-[#1c1a17] border-b border-[#f0ece6] pb-1.5 mb-3">
          Extra
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-3">
          <SpecItem label="Created" value={formatDate(f.createdAt)} />
          <div className="col-span-2 sm:col-span-3 lg:col-span-5">
            <SpecItem label="Extra features (free text)" value={f.extraFeatures ?? "—"} />
          </div>
        </div>
      </div>
    </div>
  );
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

  // Delete goes through the shared ConfirmDialog popup instead of firing
  // immediately on click — pendingDelete holds the row awaiting
  // confirmation, cleared on cancel/confirm.
  const [pendingDelete, setPendingDelete] = useState<FeatureRecord | null>(null);

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setActionError("");
    setBusyId(pendingDelete.id);
    try {
      await deleteFeature(pendingDelete.id).unwrap();
      setPendingDelete(null);
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
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => openEditModal(f)}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => setPendingDelete(f)}
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
          expandable
          renderExpanded={(f) => <ExpandedFeatureDetail f={f} />}
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

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete feature sheet?"
        itemName={pendingDelete?.variant.variantName}
        loading={busyId === pendingDelete?.id}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}