import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, SearchInput } from "../../../components/common/SearchFilterBar";
import { extractApiError } from "../../../lib/apiClient";
import {
  type CodexVariantPriceChange,
  type PriceChangeStatus,
  useApproveCodexVariantPriceChangeMutation,
  useGetCodexVariantPriceChangesQuery,
  useRejectCodexVariantPriceChangeMutation,
} from "./variantPriceChanges.api";

const ACCENT = "#D4300F";
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatPrice(value: string | number | null | undefined, currency = "INR") {
  if (value === null || value === undefined || value === "") return "-";
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return String(value);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(numericValue);
}

function StatusPill({ status }: { status: PriceChangeStatus }) {
  const isPending = status === "pending";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${
        isPending ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"
      }`}
    >
      {isPending ? "Pending" : "Rejected"}
    </span>
  );
}

function getPriceChangeTitle(row: CodexVariantPriceChange) {
  return `${row.brandName} ${row.modelName} ${row.variantName}`;
}

function DetailGrid({ data }: { data: CodexVariantPriceChange }) {
  const entries = [
    ["Run", data.runId ? `#${data.runId}` : "-"],
    ["Variant ID", data.variantId],
    ["Price Context", data.priceContext || "-"],
    ["City ID", data.cityId ?? "-"],
    ["Confidence", data.confidenceScore ?? "-"],
    ["Source Name", data.sourceName || "-"],
    ["Source URL", data.sourceUrl || "-"],
    ["Detected", formatDate(data.detectedAt)],
    ["Notes", data.notes || "-"],
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {entries.map(([label, value]) => (
        <div key={label} className="border border-[#eee9e1] bg-white rounded-lg px-3 py-2 min-w-0">
          <p className="text-[10px] font-bold uppercase text-[#a39e96] break-words">{label}</p>
          <p className="text-[12px] font-semibold text-[#1c1a17] mt-1 break-words">{String(value)}</p>
        </div>
      ))}
    </div>
  );
}

export default function AllCodexVariantPriceChanges() {
  const [status, setStatus] = useState<PriceChangeStatus>("pending");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pendingApprove, setPendingApprove] = useState<CodexVariantPriceChange | null>(null);
  const [pendingReject, setPendingReject] = useState<CodexVariantPriceChange | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [status]);

  const { data, isLoading, isFetching, error } = useGetCodexVariantPriceChangesQuery({
    page,
    limit,
    status,
    search: debouncedSearch || undefined,
  });
  const [approvePriceChange, { isLoading: approving }] = useApproveCodexVariantPriceChangeMutation();
  const [rejectPriceChange, { isLoading: rejecting }] = useRejectCodexVariantPriceChangeMutation();

  const rows = data?.data ?? [];
  const pagination = data?.pagination;
  const loading = isLoading || isFetching;
  const queryError = error ? (error as { message?: string }).message ?? "Something went wrong." : "";

  const columns = useMemo<DataTableColumn<CodexVariantPriceChange>[]>(
    () => [
      {
        header: "Variant",
        render: (row) => (
          <div className="min-w-[220px]">
            <p className="font-bold text-[#1c1a17] break-words">
              {row.brandName} {row.modelName}
            </p>
            <p className="text-[11px] text-[#a39e96] mt-0.5 break-words">{row.variantName}</p>
          </div>
        ),
      },
      {
        header: "Old Price",
        render: (row) => <span className="font-semibold text-[#7a7670]">{formatPrice(row.oldPrice, row.currency)}</span>,
      },
      {
        header: "New Price",
        render: (row) => <span className="font-bold text-[#1c1a17]">{formatPrice(row.newPrice, row.currency)}</span>,
      },
      {
        header: "Diff",
        render: (row) => <span className="text-[#7a7670]">{formatPrice(row.priceDifference, row.currency)}</span>,
      },
      {
        header: "Source",
        render: (row) =>
          row.sourceUrl ? (
            <a
              href={row.sourceUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="text-[#D4300F] font-semibold hover:underline break-all"
            >
              {row.sourceName || "Open source"}
            </a>
          ) : (
            <span className="text-[#a39e96]">-</span>
          ),
      },
      {
        header: "Status",
        render: (row) => <StatusPill status={row.proposalStatus} />,
      },
      {
        header: "Detected",
        render: (row) => <span className="text-[#7a7670] whitespace-nowrap">{formatDate(row.detectedAt)}</span>,
      },
      {
        header: "",
        align: "right",
        render: (row) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setPendingApprove(row);
              }}
              className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg text-white hover:opacity-90"
              style={{ background: ACCENT }}
            >
              Approve
            </button>
            {row.proposalStatus !== "rejected" && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setPendingReject(row);
                }}
                className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50"
              >
                Reject
              </button>
            )}
          </div>
        ),
      },
    ],
    [],
  );

  const handleApprove = async () => {
    if (!pendingApprove) return;
    setActionError("");
    try {
      await approvePriceChange(pendingApprove.id).unwrap();
      setPendingApprove(null);
    } catch (err) {
      setActionError(extractApiError(err));
    }
  };

  const handleReject = async () => {
    if (!pendingReject) return;
    setActionError("");
    try {
      await rejectPriceChange(pendingReject.id).unwrap();
      setPendingReject(null);
    } catch (err) {
      setActionError(extractApiError(err));
    }
  };

  const handleLimitChange = (value: number) => {
    setLimit(value);
    setPage(1);
  };

  return (
    <div className="space-y-5 max-w-[1180px]">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[18px] font-black text-[#1c1a17]">Codex Variant Price Changes</h1>
          <p className="text-[12px] text-[#a39e96] mt-0.5">
            Review detected old and new variant prices before updating live variant prices.
          </p>
        </div>
        <div className="flex rounded-xl border border-[#e8e4dc] overflow-hidden bg-white">
          {(["pending", "rejected"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStatus(item)}
              className="cursor-pointer px-4 py-2 text-[12px] font-bold transition-colors"
              style={status === item ? { background: ACCENT, color: "white" } : { color: "#7a7670" }}
            >
              {item === "pending" ? "Pending" : "Rejected"}
            </button>
          ))}
        </div>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
          <p className="text-red-500 text-xs font-medium">{actionError}</p>
        </div>
      )}

      <SearchFilterBar
        right={
          <div className="flex items-center gap-3">
            {pagination && (
              <p className="text-[11px] text-[#a39e96] whitespace-nowrap">
                {pagination.total} change{pagination.total === 1 ? "" : "s"} total
              </p>
            )}
            <select
              value={limit}
              onChange={(event) => handleLimitChange(Number(event.target.value))}
              className="cursor-pointer text-[12px] text-[#4a4640] bg-[#f7f5f1] border border-[#e8e4dc] rounded-lg px-3 py-2 outline-none"
            >
              {PAGE_SIZE_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        }
      >
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search variant or source..."
          width="280px"
        />
      </SearchFilterBar>

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          loading={loading}
          error={queryError}
          loadingMessage="Loading price changes..."
          emptyMessage="No price changes found."
          expandable
          renderExpanded={(row) => <DetailGrid data={row} />}
        />
        <Pagination
          pagination={pagination ?? null}
          onPageChange={setPage}
          variant="compact"
          itemLabel="price changes"
          currentCount={rows.length}
        />
      </div>

      <ConfirmDialog
        open={!!pendingApprove}
        title="Approve price update?"
        itemName={pendingApprove ? getPriceChangeTitle(pendingApprove) : undefined}
        message={
          pendingApprove
            ? `Live price will change from ${formatPrice(pendingApprove.oldPrice, pendingApprove.currency)} to ${formatPrice(
                pendingApprove.newPrice,
                pendingApprove.currency,
              )}.`
            : undefined
        }
        loading={approving}
        confirmLabel="Approve"
        loadingLabel="Approving..."
        onCancel={() => setPendingApprove(null)}
        onConfirm={handleApprove}
      />
      <ConfirmDialog
        open={!!pendingReject}
        title="Reject price update?"
        itemName={pendingReject ? getPriceChangeTitle(pendingReject) : undefined}
        message="This price change will stay marked as rejected and will not update the live variant price."
        loading={rejecting}
        confirmLabel="Reject"
        loadingLabel="Rejecting..."
        onCancel={() => setPendingReject(null)}
        onConfirm={handleReject}
      />
    </div>
  );
}
