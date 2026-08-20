// src/pages/SellLeads/ScrapLeads/AllScrapLeads.tsx
import { useEffect, useState } from "react";
import {
  useGetScrapLeadsQuery,
  useUpdateScrapLeadStatusMutation,
  SCRAP_LEAD_STATUSES,
  SCRAP_LEAD_STATUS_LABELS,
  VEHICLE_CONDITIONS,
  VEHICLE_CONDITION_LABELS,
  type ScrapLeadRecord,
  type ScrapLeadStatus,
  type ScrapVehicleCondition,
} from "./scrapLead.api";
import { useGetCityOptionsQuery } from "../../Locations/Cities/city.api";
import { extractApiError } from "../../../lib/apiClient";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, SearchInput, FilterSelect } from "../../../components/common/SearchFilterBar";
import ScrapLeadExpandedDetail from "./ScrapLeadExpandedDetail";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const STATUS_STYLES: Record<ScrapLeadStatus, { bg: string; text: string }> = {
  new: { bg: "#eef2ff", text: "#4338ca" },
  contacted: { bg: "#fff4e5", text: "#b8720a" },
  quoted: { bg: "#fff4e5", text: "#b8720a" },
  pickup_scheduled: { bg: "#e0f2fe", text: "#0369a1" },
  scrapped: { bg: "#e9f7ef", text: "#1e8a4c" },
  converted: { bg: "#e9f7ef", text: "#1e8a4c" },
  junk: { bg: "#f7f5f1", text: "#a39e96" },
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtPrice(value: string | null): string {
  if (!value) return "—";
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

// The catalogue ids win when we recognise the car; otherwise whatever the
// owner typed. A scrappable car is usually old enough not to be listed.
function carLabel(r: ScrapLeadRecord): string {
  const brand = r.brand?.name ?? r.brandName;
  const model = r.model?.name ?? r.modelName;
  const label = [brand, model].filter(Boolean).join(" ").trim();
  return label || "—";
}

function StatusSelect({
  value,
  onChange,
  disabled,
}: {
  value: ScrapLeadStatus;
  onChange: (next: ScrapLeadStatus) => void;
  disabled?: boolean;
}) {
  const style = STATUS_STYLES[value];
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as ScrapLeadStatus)}
      className="cursor-pointer text-[10px] font-bold uppercase px-2 py-1 rounded-lg border-0 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ background: style.bg, color: style.text }}
    >
      {SCRAP_LEAD_STATUSES.map((s) => (
        <option key={s} value={s}>
          {SCRAP_LEAD_STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}

export default function AllScrapLeads() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [cityId, setCityId] = useState<number | "">("");
  const [condition, setCondition] = useState<ScrapVehicleCondition | "">("");
  const [status, setStatus] = useState<ScrapLeadStatus | "">("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: cities = [] } = useGetCityOptionsQuery();

  const {
    data,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetScrapLeadsQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
    cityId: cityId || undefined,
    vehicleCondition: condition || undefined,
    status: status || undefined,
  });

  const leads = data?.data ?? [];
  const pagination = data?.pagination ?? null;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";
  const loading = isLoading || isFetching;

  const [updateStatus] = useUpdateScrapLeadStatusMutation();
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  const handleStatusChange = async (lead: ScrapLeadRecord, next: ScrapLeadStatus) => {
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

  const columns: DataTableColumn<ScrapLeadRecord>[] = [
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
      header: "Vehicle",
      render: (r) => (
        <div>
          <p className="text-[#4a4640]">{carLabel(r)}</p>
          <p className="text-[11px] text-[#7a7670]">{r.registrationYear ?? "—"}</p>
        </div>
      ),
    },
    { header: "Reg. No.", render: (r) => <span className="text-[#7a7670]">{r.registrationNumber ?? "—"}</span> },
    { header: "City", render: (r) => <span className="text-[#7a7670]">{r.city?.name ?? "—"}</span> },
    {
      header: "Condition",
      render: (r) => (
        <span className="text-[11px] font-semibold text-[#4a4640]">
          {r.vehicleCondition ? VEHICLE_CONDITION_LABELS[r.vehicleCondition] : "—"}
        </span>
      ),
    },
    { header: "Quote", render: (r) => <span className="text-[#4a4640] whitespace-nowrap">{fmtPrice(r.quotedPrice)}</span> },
    {
      header: "Status",
      render: (r) => <StatusSelect value={r.status} disabled={togglingId === r.id} onChange={(next) => handleStatusChange(r, next)} />,
    },
    { header: "Date", render: (r) => <span className="text-[#7a7670] whitespace-nowrap">{fmtDate(r.createdAt)}</span> },
  ];

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div>
        <h1 className="text-[18px] font-black text-[#1c1a17]">Scrap Car Leads</h1>
        <p className="text-[12px] text-[#a39e96] mt-0.5">
          End-of-life vehicle scrapping requests. Click a row for full detail.
        </p>
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
          value={cityId}
          onChange={(v) => {
            setCityId(v ? Number(v) : "");
            setPage(1);
          }}
          options={cities.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="All cities"
        />
        <FilterSelect
          value={condition}
          onChange={(v) => {
            setCondition((v as ScrapVehicleCondition) || "");
            setPage(1);
          }}
          options={VEHICLE_CONDITIONS.map((c) => ({ value: c, label: VEHICLE_CONDITION_LABELS[c] }))}
          placeholder="All conditions"
        />
        <FilterSelect
          value={status}
          onChange={(v) => {
            setStatus((v as ScrapLeadStatus) || "");
            setPage(1);
          }}
          options={SCRAP_LEAD_STATUSES.map((s) => ({ value: s, label: SCRAP_LEAD_STATUS_LABELS[s] }))}
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
          renderExpanded={(r) => <ScrapLeadExpandedDetail lead={r} />}
        />
        <Pagination pagination={pagination} onPageChange={setPage} variant="compact" itemLabel="leads" currentCount={leads.length} />
      </div>
    </div>
  );
}
