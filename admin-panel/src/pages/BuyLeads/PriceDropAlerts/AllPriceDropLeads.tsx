// src/pages/BuyLeads/PriceDropAlerts/AllPriceDropLeads.tsx
import { useEffect, useState } from "react";
import {
  useGetPriceDropAlertLeadsQuery,
  useGetPriceDropAlertLeadStatsQuery,
  useUpdatePriceDropAlertLeadActiveMutation,
  type PriceDropAlertLeadRecord,
} from "./priceDropAlertLead.api";
import { useGetBrandOptionsQuery } from "../../newCars/Brands/brand.api";
import { useGetCarModelOptionsQuery } from "../../newCars/carModels/carModel.api";
import { extractApiError } from "../../../lib/apiClient";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, SearchInput, FilterSelect } from "../../../components/common/SearchFilterBar";
import PriceDropLeadExpandedDetail from "./PriceDropLeadExpandedDetail";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const ACTIVE_OPTIONS = [
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtPrice(value: string | null): string {
  if (!value) return "—";
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

// Same stat-card pattern as pages/Ai/Dashboard/Dashboard.tsx's topStats row.
function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-[#e8e4dc] rounded-xl p-4 flex flex-col gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#a39e96]">{label}</span>
      <p className="text-2xl font-black text-[#1c1a17] leading-none">{value}</p>
    </div>
  );
}

function PriceCell({ lead }: { lead: PriceDropAlertLeadRecord }) {
  const subscribed = lead.priceAtSubscription ? Number(lead.priceAtSubscription) : null;
  const current = lead.model?.priceMin ? Number(lead.model.priceMin) : null;
  const dropped = subscribed != null && current != null && current < subscribed;
  return (
    <div>
      <p className="text-[#4a4640]">{fmtPrice(lead.priceAtSubscription)} → {fmtPrice(lead.model?.priceMin ?? null)}</p>
      {dropped && <span className="text-[10px] font-bold text-green-600">Price dropped</span>}
    </div>
  );
}

function ActiveToggle({
  active,
  onChange,
  disabled,
}: {
  active: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!active)}
      disabled={disabled}
      className="cursor-pointer text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border-0 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      style={active ? { background: "#e9f7ef", color: "#1e8a4c" } : { background: "#f7f5f1", color: "#a39e96" }}
    >
      {active ? "Active" : "Inactive"}
    </button>
  );
}

export default function AllPriceDropLeads() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [brandId, setBrandId] = useState<number | "">("");
  const [modelId, setModelId] = useState<number | "">("");
  const [isActive, setIsActive] = useState<"" | "true" | "false">("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: stats } = useGetPriceDropAlertLeadStatsQuery();

  const { data: brands = [] } = useGetBrandOptionsQuery();
  const { data: models = [] } = useGetCarModelOptionsQuery(brandId ? { brandId } : undefined);

  const {
    data,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetPriceDropAlertLeadsQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
    brandId: brandId || undefined,
    modelId: modelId || undefined,
    isActive: isActive === "" ? undefined : isActive === "true",
  });

  const leads = data?.data ?? [];
  const pagination = data?.pagination ?? null;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";
  const loading = isLoading || isFetching;

  const [updateActive] = useUpdatePriceDropAlertLeadActiveMutation();
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  const handleToggleActive = async (lead: PriceDropAlertLeadRecord, next: boolean) => {
    setActionError("");
    setTogglingId(lead.id);
    try {
      await updateActive({ id: lead.id, input: { isActive: next } }).unwrap();
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

  const columns: DataTableColumn<PriceDropAlertLeadRecord>[] = [
    {
      header: "Lead",
      render: (r) => (
        <div>
          <p className="font-semibold text-[#1c1a17]">{r.mobile}</p>
          <p className="text-[11px] text-[#7a7670]">{r.email ?? "—"}</p>
        </div>
      ),
    },
    {
      header: "Car",
      render: (r) => <span className="text-[#4a4640]">{r.brand ? `${r.brand.name} ${r.model?.name ?? ""}`.trim() : "—"}</span>,
    },
    { header: "Subscribed → Current Price", render: (r) => <PriceCell lead={r} /> },
    { header: "Channel", render: (r) => <span className="text-[#7a7670] capitalize">{r.alertType ?? "—"}</span> },
    {
      header: "Via",
      render: (r) =>
        r.userId ? (
          <span className="rounded-full bg-[#eef2ff] px-2 py-0.5 text-[10px] font-bold text-[#4338ca]">Logged-in</span>
        ) : (
          <span className="rounded-full bg-[#f7f5f1] px-2 py-0.5 text-[10px] font-bold text-[#a39e96]">Guest</span>
        ),
    },
    {
      header: "Status",
      render: (r) => <ActiveToggle active={r.isActive} disabled={togglingId === r.id} onChange={(next) => handleToggleActive(r, next)} />,
    },
    { header: "Subscribed On", render: (r) => <span className="text-[#7a7670] whitespace-nowrap">{fmtDate(r.createdAt)}</span> },
  ];

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div>
        <h1 className="text-[18px] font-black text-[#1c1a17]">Price Drop Alerts</h1>
        <p className="text-[12px] text-[#a39e96] mt-0.5">
          Visitors subscribed to be notified when a car's price drops. Click a row for full detail.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Today" value={stats?.today ?? 0} />
        <StatCard label="This Month" value={stats?.thisMonth ?? 0} />
        <StatCard label="Active Alerts" value={stats?.active ?? 0} />
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
                {pagination.total} alert{pagination.total === 1 ? "" : "s"} total
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
          placeholder="Search mobile/email..."
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
          value={isActive}
          onChange={(v) => {
            setIsActive((v as "" | "true" | "false") || "");
            setPage(1);
          }}
          options={ACTIVE_OPTIONS}
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
          loadingMessage="Loading alerts..."
          emptyMessage="No alerts match these filters."
          expandable
          renderExpanded={(r) => <PriceDropLeadExpandedDetail lead={r} />}
        />
        <Pagination pagination={pagination} onPageChange={setPage} variant="compact" itemLabel="alerts" currentCount={leads.length} />
      </div>
    </div>
  );
}
