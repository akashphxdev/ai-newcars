// src/pages/Locations/AllCountries.tsx

import { useState } from "react";
import {
  useGetCountriesQuery,
  useUpdateCountryStatusMutation,
  useDeleteCountryMutation,
  type CountryRecord,
} from "./country.api";
import { extractApiError } from "../../../lib/apiClient";
import CountryModal from "./CountryModal";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, SearchInput } from "../../../components/common/SearchFilterBar";
import ConfirmDialog from "../../../components/common/ConfirmDialog";

const ACCENT = "#D4300F";
const PAGE_SIZE = 20;

// Small pill-style toggle switch — self-contained so it can be reused
// on other listing pages (City, etc.) later if needed.
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

export default function AllCountries() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const {
    data: countriesData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetCountriesQuery({ page, limit: PAGE_SIZE, search: search || undefined });

  const countries = countriesData?.data ?? [];
  const pagination = countriesData?.pagination;
  const loading = isLoading || isFetching;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";

  // Modal state — null country = "Add" mode, a record = "Edit" mode.
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<CountryRecord | null>(null);

  const openAddModal = () => {
    setEditingCountry(null);
    setModalOpen(true);
  };

  const openEditModal = (country: CountryRecord) => {
    setEditingCountry(country);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCountry(null);
  };

  const [updateCountryStatus] = useUpdateCountryStatusMutation();
  const [deleteCountry] = useDeleteCountryMutation();

  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CountryRecord | null>(null);
  const [actionError, setActionError] = useState("");

  const handleToggleStatus = async (country: CountryRecord) => {
    setActionError("");
    setTogglingId(country.id);
    try {
      await updateCountryStatus({ id: country.id, isActive: !country.isActive }).unwrap();
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
      await deleteCountry(pendingDelete.id).unwrap();
      setPendingDelete(null);
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setDeletingId(null);
    }
  };

  const columns: DataTableColumn<CountryRecord>[] = [
    { header: "Name", render: (c) => <span className="font-semibold text-[#1c1a17]">{c.name}</span> },
    { header: "Code", render: (c) => <span className="text-[#7a7670]">{c.code}</span> },
    {
      header: "Currency",
      render: (c) => {
        const symbolAndCode = `${c.currencySymbol ?? ""} ${c.currencyCode ?? ""}`.trim();
        return (
          <span className="text-[#7a7670]">
            {c.currency ? (
              <>
                <span className="text-[#1c1a17] font-medium">{c.currency}</span>
                {symbolAndCode && <span className="text-[#a39e96]"> ({symbolAndCode})</span>}
              </>
            ) : (
              symbolAndCode || "—"
            )}
          </span>
        );
      },
    },
    { header: "Exchange rate", render: (c) => <span className="text-[#7a7670]">{c.exchangeRate ?? "—"}</span> },
    {
      header: "Units",
      render: (c) => (
        <span className="text-[#7a7670]">{[c.distanceUnit, c.fuelUnit].filter(Boolean).join(" / ") || "—"}</span>
      ),
    },
    {
      header: "Status",
      render: (c) => (
        <div className="flex items-center gap-2">
          <StatusToggle
            checked={c.isActive}
            disabled={togglingId === c.id}
            onChange={() => handleToggleStatus(c)}
          />
          <span className={`text-[10px] font-bold ${c.isActive ? "text-green-600" : "text-[#a39e96]"}`}>
            {c.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      ),
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
            onClick={() => setPendingDelete(c)}
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
    <div className="space-y-5 max-w-[1100px]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[18px] font-black text-[#1c1a17]">Countries</h1>
          <p className="text-[12px] text-[#a39e96] mt-0.5">
            Manage countries, their currency, and units used across states, districts, and cities.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="cursor-pointer text-[12px] font-bold text-white px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          + Add country
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
            <p className="text-[11px] text-[#a39e96]">
              {pagination.total} countr{pagination.total === 1 ? "y" : "ies"} total
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
          placeholder="Search by name or code..."
          width="280px"
        />
      </SearchFilterBar>

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={countries}
          rowKey={(c) => c.id}
          loading={loading}
          error={error}
          loadingMessage="Loading countries..."
          emptyMessage="No countries found."
        />
        <Pagination pagination={pagination ?? null} onPageChange={setPage} variant="simple" />
      </div>

      <CountryModal open={modalOpen} onClose={closeModal} country={editingCountry} />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete country?"
        itemName={pendingDelete?.name}
        loading={deletingId === pendingDelete?.id}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}