// src/pages/BuyLeads/InsuranceLeads/AllInsuranceLeads.tsx
import { useEffect, useState } from "react";
import {
  useGetInsuranceLeadsQuery,
  useUpdateInsuranceLeadStatusMutation,
  INSURANCE_TYPES,
  INSURANCE_TYPE_LABELS,
  type InsuranceLeadRecord,
  type InsuranceLeadStatus,
  type InsuranceType,
} from "./insuranceLead.api";
import { useGetBrandOptionsQuery } from "../../newCars/Brands/brand.api";
import { useGetCarModelOptionsQuery } from "../../newCars/carModels/carModel.api";
import { useGetCityOptionsQuery } from "../../Locations/Cities/city.api";
import { extractApiError } from "../../../lib/apiClient";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, SearchInput, FilterSelect } from "../../../components/common/SearchFilterBar";
import InsuranceLeadExpandedDetail from "./InsuranceLeadExpandedDetail";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const STATUS_OPTIONS: InsuranceLeadStatus[] = ["new", "contacted", "qualified", "converted", "junk"];

const STATUS_STYLES: Record<InsuranceLeadStatus, { bg: string; text: string }> = {
  new: { bg: "#eef2ff", text: "#4338ca" },
  contacted: { bg: "#fff4e5", text: "#b8720a" },
  qualified: { bg: "#e9f7ef", text: "#1e8a4c" },
  converted: { bg: "#e9f7ef", text: "#1e8a4c" },
  junk: { bg: "#f7f5f1", text: "#a39e96" },
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function StatusSelect({
  value,
  onChange,
  disabled,
}: {
  value: InsuranceLeadStatus;
  onChange: (next: InsuranceLeadStatus) => void;
  disabled?: boolean;
}) {
  const style = STATUS_STYLES[value];
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as InsuranceLeadStatus)}
      className="cursor-pointer text-[10px] font-bold uppercase px-2 py-1 rounded-lg border-0 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ background: style.bg, color: style.text }}
    >
      {STATUS_OPTIONS.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}

export default function AllInsuranceLeads() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [brandId, setBrandId] = useState<number | "">("");
  const [modelId, setModelId] = useState<number | "">("");
  const [cityId, setCityId] = useState<number | "">("");
  const [insuranceType, setInsuranceType] = useState<InsuranceType | "">("");
  const [status, setStatus] = useState<InsuranceLeadStatus | "">("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: brands = [] } = useGetBrandOptionsQuery();
  const { data: models = [] } = useGetCarModelOptionsQuery(brandId ? { brandId } : undefined);
  const { data: cities = [] } = useGetCityOptionsQuery();

  const {
    data,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetInsuranceLeadsQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
    brandId: brandId || undefined,
    modelId: modelId || undefined,
    cityId: cityId || undefined,
    insuranceType: insuranceType || undefined,
    status: status || undefined,
  });

  const leads = data?.data ?? [];
  const pagination = data?.pagination ?? null;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";
  const loading = isLoading || isFetching;

  const [updateStatus] = useUpdateInsuranceLeadStatusMutation();
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  const handleStatusChange = async (lead: InsuranceLeadRecord, next: InsuranceLeadStatus) => {
    setActionError("");
    setTogglingId(lead.id);
    try {
      await updateStatus({ id: lead.id, input: { status: next } }).unwrap();
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setTogglingId(null);
    }
  };

  const handleLimitChange = (value: number) => {
    setLimit(value);
    setPage(1);
  };

  const columns: DataTableColumn<InsuranceLeadRecord>[] = [
    {
      header: "Lead",
      render: (r) => (
        <div>
          <p className="font-semibold text-[#1c1a17]">{r.name ?? "—"}</p>
          <p className="text-[11px] text-[#7a7670]">{r.mobile}</p>
        </div>
      ),
    },
    {
      header: "Car",
      render: (r) => <span className="text-[#4a4640]">{r.brand ? `${r.brand.name} ${r.model?.name ?? ""}`.trim() : "—"}</span>,
    },
    { header: "Reg. No.", render: (r) => <span className="text-[#7a7670]">{r.registrationNumber ?? "—"}</span> },
    { header: "City", render: (r) => <span className="text-[#7a7670]">{r.city?.name ?? "—"}</span> },
    {
      header: "Insurance For",
      render: (r) => (
        <span className="text-[11px] font-semibold text-[#4a4640]">
          {r.insuranceType ? INSURANCE_TYPE_LABELS[r.insuranceType] : "—"}
        </span>
      ),
    },
    {
      header: "Status",
      render: (r) => <StatusSelect value={r.status} disabled={togglingId === r.id} onChange={(next) => handleStatusChange(r, next)} />,
    },
    { header: "Date", render: (r) => <span className="text-[#7a7670] whitespace-nowrap">{fmtDate(r.createdAt)}</span> },
  ];

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div>
        <h1 className="text-[18px] font-black text-[#1c1a17]">Insurance Leads</h1>
        <p className="text-[12px] text-[#a39e96] mt-0.5">Car insurance quote requests. Click a row for full detail.</p>
      </div>

      {(error || actionError) && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
          <p className="text-red-500 text-xs font-medium">{actionError || error}</p>
        </div>
      )}

      <SearchFilterBar
        right={
          <div className="flex items-center gap-3">
            {pagination && (
              <p className="text-[11px] text-[#a39e96] whitespace-nowrap">
                {pagination.total} lead{pagination.total === 1 ? "" : "s"} total
              </p>
            )}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[#a39e96] whitespace-nowrap">Rows per page</span>
              <select
                value={limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="cursor-pointer text-[12px] text-[#4a4640] bg-[#f7f5f1] border border-[#e8e4dc] rounded-lg px-3 py-2 outline-none"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        }
      >
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search name/mobile/reg. no..."
        />
        <FilterSelect
          value={brandId}
          onChange={(v) => {
            setBrandId(v ? Number(v) : "");
            setModelId("");
            setPage(1);
          }}
          options={brands.map((b) => ({ value: b.id, label: b.name }))}
          placeholder="All brands"
        />
        <FilterSelect
          value={modelId}
          onChange={(v) => {
            setModelId(v ? Number(v) : "");
            setPage(1);
          }}
          options={models.map((m) => ({ value: m.id, label: m.name }))}
          placeholder="All models"
        />
        <FilterSelect
          value={cityId}
          onChange={(v) => {
            setCityId(v ? Number(v) : "");
            setPage(1);
          }}
          options={cities.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="All cities"
        />
        <FilterSelect
          value={insuranceType}
          onChange={(v) => {
            setInsuranceType((v as InsuranceType) || "");
            setPage(1);
          }}
          options={INSURANCE_TYPES.map((t) => ({ value: t, label: INSURANCE_TYPE_LABELS[t] }))}
          placeholder="All insurance types"
        />
        <FilterSelect
          value={status}
          onChange={(v) => {
            setStatus((v as InsuranceLeadStatus) || "");
            setPage(1);
          }}
          options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
          placeholder="All statuses"
        />
      </SearchFilterBar>

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={leads}
          rowKey={(r) => r.id}
          loading={loading}
          error={error}
          loadingMessage="Loading leads..."
          emptyMessage="No leads match these filters."
          expandable
          renderExpanded={(r) => <InsuranceLeadExpandedDetail lead={r} />}
        />
        <Pagination pagination={pagination} onPageChange={setPage} variant="compact" itemLabel="leads" currentCount={leads.length} />
      </div>
    </div>
  );
}
