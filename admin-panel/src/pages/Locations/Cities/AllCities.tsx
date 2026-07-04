// src/pages/Locations/AllCities.tsx

import { useState } from "react";
import {
  useGetCitiesQuery,
  useDeleteCityMutation,
  useUpdateCityFlagsMutation,
  type CityRecord,
  type UpdateCityFlagsInput,
} from "./city.api";
import { useGetStatesQuery } from "../States/state.api";
import { useGetDistrictsQuery } from "../Districts/district.api";
import { useGetCountriesQuery } from "../Countries/country.api";
import { extractApiError, getUploadUrl } from "../../../lib/apiClient";
import CityModal from "./CityModal";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, SearchInput, FilterSelect } from "../../../components/common/SearchFilterBar";

const ACCENT = "#D4300F";
const PAGE_SIZE = 20;

function FlagToggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
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

export default function AllCities() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterCountryId, setFilterCountryId] = useState<number | "">("");
  const [filterStateId, setFilterStateId] = useState<number | "">("");
  const [filterDistrictId, setFilterDistrictId] = useState<number | "">("");

  // NOTE: same 100-row cap discussed in AllStates.tsx / AllDistricts.tsx.
  const { data: countriesData } = useGetCountriesQuery({ limit: 100, sortBy: "name", sortOrder: "asc" });
  const countries = countriesData?.data ?? [];

  const { data: filterStatesData } = useGetStatesQuery({
    limit: 100,
    countryId: filterCountryId || undefined,
    sortBy: "name",
    sortOrder: "asc",
  });
  const filterStates = filterStatesData?.data ?? [];

  const { data: filterDistrictsData } = useGetDistrictsQuery({
    limit: 100,
    stateId: filterStateId || undefined,
    sortBy: "name",
    sortOrder: "asc",
  });
  const filterDistricts = filterDistrictsData?.data ?? [];

  const {
    data: citiesData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetCitiesQuery({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    districtId: filterDistrictId || undefined,
    stateId: !filterDistrictId ? filterStateId || undefined : undefined,
  });

  const cities = citiesData?.data ?? [];
  const pagination = citiesData?.pagination;
  const loading = isLoading || isFetching;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";

  // Modal state — null city = "Add" mode, a record = "Edit" mode.
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<CityRecord | null>(null);

  const openAddModal = () => {
    setEditingCity(null);
    setModalOpen(true);
  };

  const openEditModal = (city: CityRecord) => {
    setEditingCity(city);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCity(null);
  };

  const [deleteCity] = useDeleteCityMutation();
  const [updateCityFlags] = useUpdateCityFlagsMutation();

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const handleDelete = async (id: number) => {
    setActionError("");
    setDeletingId(id);
    try {
      await deleteCity(id).unwrap();
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleFlag = async (city: CityRecord, key: keyof UpdateCityFlagsInput) => {
    setActionError("");
    const toggleKey = `${city.id}:${key}`;
    setTogglingKey(toggleKey);
    try {
      await updateCityFlags({ id: city.id, flags: { [key]: !city[key] } }).unwrap();
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setTogglingKey(null);
    }
  };

  const columns: DataTableColumn<CityRecord>[] = [
    {
      header: "Logo",
      render: (c) =>
        getUploadUrl(c.logoUrl) ? (
          <img
            src={getUploadUrl(c.logoUrl)!}
            alt=""
            className="w-7 h-7 rounded-lg object-cover border border-[#e8e4dc]"
          />
        ) : (
          <div className="w-7 h-7 rounded-lg bg-[#f7f5f1] border border-[#e8e4dc]" />
        ),
    },
    { header: "Name", render: (c) => <span className="font-semibold text-[#1c1a17]">{c.name}</span> },
    { header: "Slug", render: (c) => <span className="text-[#7a7670]">{c.slug}</span> },
    { header: "District", render: (c) => <span className="text-[#7a7670]">{c.district?.name ?? "—"}</span> },
    { header: "State", render: (c) => <span className="text-[#7a7670]">{c.district?.state?.name ?? "—"}</span> },
    {
      header: "Metro",
      render: (c) => (
        <FlagToggle
          checked={c.isMetro}
          disabled={togglingKey === `${c.id}:isMetro`}
          onChange={() => handleToggleFlag(c, "isMetro")}
        />
      ),
    },
    {
      header: "Top city",
      render: (c) => (
        <FlagToggle
          checked={c.isTopCity}
          disabled={togglingKey === `${c.id}:isTopCity`}
          onChange={() => handleToggleFlag(c, "isTopCity")}
        />
      ),
    },
    {
      header: "Sell car",
      render: (c) => (
        <FlagToggle
          checked={c.isSellCarEnabled}
          disabled={togglingKey === `${c.id}:isSellCarEnabled`}
          onChange={() => handleToggleFlag(c, "isSellCarEnabled")}
        />
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
    <div className="space-y-5 max-w-[1100px]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[18px] font-black text-[#1c1a17]">Cities</h1>
          <p className="text-[12px] text-[#a39e96] mt-0.5">
            Manage cities, each linked to a district. Slug is auto-generated from the name if left blank.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="cursor-pointer text-[12px] font-bold text-white px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          + Add city
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
              {pagination.total} cit{pagination.total === 1 ? "y" : "ies"} total
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
          value={filterCountryId}
          onChange={(v) => {
            setFilterCountryId(v ? Number(v) : "");
            setFilterStateId("");
            setFilterDistrictId("");
            setPage(1);
          }}
          options={countries.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="All countries"
        />
        <FilterSelect
          value={filterStateId}
          onChange={(v) => {
            setFilterStateId(v ? Number(v) : "");
            setFilterDistrictId("");
            setPage(1);
          }}
          options={filterStates.map((s) => ({ value: s.id, label: s.name }))}
          placeholder="All states"
          disabled={!filterCountryId}
        />
        <FilterSelect
          value={filterDistrictId}
          onChange={(v) => {
            setFilterDistrictId(v ? Number(v) : "");
            setPage(1);
          }}
          options={filterDistricts.map((d) => ({ value: d.id, label: d.name }))}
          placeholder="All districts"
          disabled={!filterStateId}
        />
      </SearchFilterBar>

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={cities}
          rowKey={(c) => c.id}
          loading={loading}
          error={error}
          loadingMessage="Loading cities..."
          emptyMessage="No cities found."
        />
        <Pagination pagination={pagination ?? null} onPageChange={setPage} variant="simple" />
      </div>

      {modalOpen && (
        <CityModal
          key={editingCity ? `edit-${editingCity.id}` : "add"}
          open={modalOpen}
          onClose={closeModal}
          city={editingCity}
        />
      )}
    </div>
  );
}