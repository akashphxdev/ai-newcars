// src/pages/newCars/Offers/AllOffers.tsx
import { useState } from "react";
import {
  useGetOffersQuery,
  useUpdateOfferStatusMutation,
  useDeleteOfferMutation,
  type OfferRecord,
} from "./offer.api";
import { useGetCarModelsQuery } from "../carModels/carModel.api";
import { getOfferTypeLabel } from "../../../lib/lookups";
import { extractApiError, getUploadUrl } from "../../../lib/apiClient";
import OfferModal from "./OfferModal";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, SearchInput, FilterSelect } from "../../../components/common/SearchFilterBar";

const ACCENT = "#D4300F";
const PAGE_SIZE = 20;

const STATUS_OPTIONS: { value: "true" | "false"; label: string }[] = [
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

function formatAmount(value: string | null): string {
  if (!value) return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  return `₹${num.toLocaleString("en-IN")}`;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// Small pill-style toggle switch — same pattern as AllBrands.tsx's
// StatusToggle / AllCountries.tsx's StatusToggle.
function StatusToggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className="cursor-pointer relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ background: checked ? ACCENT : "#e2ddd5" }}
    >
      <span
        className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? "translateX(18px)" : "translateX(3px)" }}
      />
    </button>
  );
}

export default function AllOffers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterModelId, setFilterModelId] = useState<number | "">("");
  const [filterStatus, setFilterStatus] = useState<"true" | "false" | "">("");

  // NOTE: same 100-row cap used elsewhere — fine while the car-models
  // table stays under 100 rows.
  const { data: carModelsData } = useGetCarModelsQuery({ limit: 100, sortBy: "name", sortOrder: "asc" });
  const carModels = carModelsData?.data ?? [];

  const {
    data: offersData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetOffersQuery({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    modelId: filterModelId || undefined,
    isActive: filterStatus === "" ? undefined : filterStatus === "true",
  });

  const offers = offersData?.data ?? [];
  const pagination = offersData?.pagination;
  const loading = isLoading || isFetching;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";

  // Modal state — null offer = "Add" mode, a record = "Edit" mode.
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<OfferRecord | null>(null);

  const openAddModal = () => {
    setEditingOffer(null);
    setModalOpen(true);
  };

  const openEditModal = (offer: OfferRecord) => {
    setEditingOffer(offer);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingOffer(null);
  };

  const [updateOfferStatus] = useUpdateOfferStatusMutation();
  const [deleteOffer] = useDeleteOfferMutation();

  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  // Delete goes through the shared ConfirmDialog popup instead of
  // firing immediately on click — pendingDelete holds the row awaiting
  // confirmation, cleared on cancel/confirm.
  const [pendingDelete, setPendingDelete] = useState<OfferRecord | null>(null);
  const [actionError, setActionError] = useState("");

  const handleToggleStatus = async (offer: OfferRecord) => {
    setActionError("");
    setTogglingId(offer.id);
    try {
      await updateOfferStatus({ id: offer.id, isActive: !offer.isActive }).unwrap();
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
      await deleteOffer(pendingDelete.id).unwrap();
      setPendingDelete(null);
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setDeletingId(null);
    }
  };

  const columns: DataTableColumn<OfferRecord>[] = [
    {
      header: "Image",
      render: (o) =>
        getUploadUrl(o.imageUrl) ? (
          <img
            src={getUploadUrl(o.imageUrl)!}
            alt=""
            className="w-9 h-9 rounded-lg object-cover border border-[#e8e4dc]"
          />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-[#f7f5f1] border border-[#e8e4dc]" />
        ),
    },
    {
      header: "Offer",
      render: (o) => (
        <>
          <p className="font-semibold text-[#1c1a17]">{o.description || "—"}</p>
          {o.offerType != null && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#f7f5f1] text-[#4a4640] uppercase">
              {getOfferTypeLabel(o.offerType)}
            </span>
          )}
        </>
      ),
    },
    {
      header: "Model / Variant",
      render: (o) => (
        <span className="text-[#7a7670]">
          {o.model.brand.name} — {o.model.name}
          {o.variant ? ` (${o.variant.variantName})` : ""}
        </span>
      ),
    },
    { header: "City", render: (o) => <span className="text-[#7a7670]">{o.city?.name ?? "All cities"}</span> },
    { header: "Amount", render: (o) => <span className="text-[#7a7670] whitespace-nowrap">{formatAmount(o.offerAmount)}</span> },
    {
      header: "Validity",
      render: (o) => (
        <span className="text-[#7a7670] whitespace-nowrap text-xs">
          {formatDate(o.validFrom)} – {formatDate(o.validUntil)}
        </span>
      ),
    },
    {
      header: "Status",
      render: (o) => (
        <div className="flex items-center gap-2">
          <StatusToggle
            checked={o.isActive}
            disabled={togglingId === o.id}
            onChange={() => handleToggleStatus(o)}
          />
          <span className={`text-[10px] font-bold ${o.isActive ? "text-green-600" : "text-[#a39e96]"}`}>
            {o.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      ),
    },
    {
      header: "",
      align: "right",
      render: (o) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openEditModal(o)}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => setPendingDelete(o)}
            disabled={deletingId === o.id}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deletingId === o.id ? "..." : "Delete"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-[1200px]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[18px] font-black text-[#1c1a17]">Offers</h1>
          <p className="text-[12px] text-[#a39e96] mt-0.5">
            Manage offers under each car model. Variant and city are optional.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="cursor-pointer text-[12px] font-bold text-white px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          + Add offer
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
              {pagination.total} offer{pagination.total === 1 ? "" : "s"} total
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
          placeholder="Search by description..."
        />
        <FilterSelect
          value={filterModelId}
          onChange={(v) => {
            setFilterModelId(v ? Number(v) : "");
            setPage(1);
          }}
          options={carModels.map((m) => ({ value: m.id, label: `${m.brand.name} — ${m.name}` }))}
          placeholder="All models"
        />
        <FilterSelect
          value={filterStatus}
          onChange={(v) => {
            setFilterStatus((v as "true" | "false") || "");
            setPage(1);
          }}
          options={STATUS_OPTIONS}
          placeholder="All statuses"
        />
      </SearchFilterBar>

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={offers}
          rowKey={(o) => o.id}
          loading={loading}
          error={error}
          loadingMessage="Loading offers..."
          emptyMessage="No offers found."
        />
        <Pagination pagination={pagination ?? null} onPageChange={setPage} variant="simple" />
      </div>

      {modalOpen && (
        <OfferModal
          key={editingOffer ? `edit-${editingOffer.id}` : "add"}
          open={modalOpen}
          onClose={closeModal}
          offer={editingOffer}
        />
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete offer?"
        itemName={pendingDelete?.description ?? undefined}
        loading={deletingId === pendingDelete?.id}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}