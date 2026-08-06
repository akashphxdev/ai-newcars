// src/pages/Ai/Logs/AllAiLogs.tsx
import { useEffect, useState } from "react";
import {
  useGetAiLogsQuery,
  AI_LOG_STATUS,
  AI_LOG_STATUS_OPTIONS,
  type AiLogRecord,
} from "./aiLog.api";
import { AI_FEATURE_OPTIONS, getAiFeatureLabel } from "../../../lib/aiLookups";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(ms: number | null) {
  if (ms == null) return "—";
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export default function AllAiLogs() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  // Debounced copy of `search` — this is what goes into the query args,
  // so typing doesn't refetch on every keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [featureKey, setFeatureKey] = useState("");
  const [status, setStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetAiLogsQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
    featureKey: featureKey ? Number(featureKey) : undefined,
    status: status ? Number(status) : undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  });

  const logs = data?.data ?? [];
  const pagination = data?.pagination ?? null;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";
  const loading = isLoading || isFetching;

  const handleLimitChange = (value: number) => {
    setLimit(value);
    setPage(1);
  };

  const columns: DataTableColumn<AiLogRecord>[] = [
    {
      header: "Feature",
      render: (log) => (
        <span className="font-semibold text-[#1c1a17]">{getAiFeatureLabel(log.featureKey)}</span>
      ),
    },
    { header: "Action", render: (log) => <span className="text-[#4a4640]">{log.action}</span> },
    {
      header: "Status",
      render: (log) =>
        log.status === AI_LOG_STATUS.SUCCESS ? (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100">
            Success
          </span>
        ) : (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-100">
            Failed
          </span>
        ),
    },
    {
      header: "Message",
      render: (log) => (
        <span
          className={`block max-w-[320px] truncate ${
            log.status === AI_LOG_STATUS.FAILED ? "text-[#D4300F]" : "text-[#4a4640]"
          }`}
          title={log.message}
        >
          {log.message}
        </span>
      ),
    },
    {
      header: "Duration",
      render: (log) => <span className="text-[#7a7670] whitespace-nowrap">{formatDuration(log.durationMs)}</span>,
    },
    {
      header: "Date & Time",
      render: (log) => <span className="text-[#7a7670] whitespace-nowrap">{formatDateTime(log.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-5 max-w-[1300px]">
      <div>
        <h1 className="text-[18px] font-black text-[#1c1a17]">AI Logs</h1>
        <p className="text-[12px] text-[#a39e96] mt-0.5">
          Every run of the AI generators — written by the jobs themselves, read-only here.
        </p>
      </div>

      <div className="bg-white border border-[#e8e4dc] rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-xs bg-[#f7f5f1] border border-[#e8e4dc] rounded-lg px-3 py-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c0bab0" strokeWidth="1.8">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search in message..."
            className="flex-1 bg-transparent text-[12px] text-[#1c1a17] outline-none placeholder:text-[#c0bab0]"
          />
        </div>

        <select
          value={featureKey}
          onChange={(e) => {
            setPage(1);
            setFeatureKey(e.target.value);
          }}
          className="cursor-pointer text-[12px] text-[#4a4640] bg-[#f7f5f1] border border-[#e8e4dc] rounded-lg px-3 py-2 outline-none"
        >
          <option value="">All features</option>
          {AI_FEATURE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="cursor-pointer text-[12px] text-[#4a4640] bg-[#f7f5f1] border border-[#e8e4dc] rounded-lg px-3 py-2 outline-none"
        >
          <option value="">All statuses</option>
          {AI_LOG_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={fromDate}
          onChange={(e) => {
            setPage(1);
            setFromDate(e.target.value);
          }}
          className="text-[12px] text-[#4a4640] bg-[#f7f5f1] border border-[#e8e4dc] rounded-lg px-3 py-2 outline-none"
        />
        <span className="text-[11px] text-[#c0bab0]">to</span>
        <input
          type="date"
          value={toDate}
          onChange={(e) => {
            setPage(1);
            setToDate(e.target.value);
          }}
          className="text-[12px] text-[#4a4640] bg-[#f7f5f1] border border-[#e8e4dc] rounded-lg px-3 py-2 outline-none"
        />

        {(search || featureKey || status || fromDate || toDate) && (
          <button
            onClick={() => {
              setSearch("");
              setFeatureKey("");
              setStatus("");
              setFromDate("");
              setToDate("");
              setPage(1);
            }}
            className="cursor-pointer text-[11px] font-semibold text-[#a39e96] hover:text-[#D4300F] transition-colors"
          >
            Clear filters
          </button>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {pagination && (
            <p className="text-[11px] text-[#a39e96] whitespace-nowrap">
              {pagination.total} log{pagination.total === 1 ? "" : "s"} total
            </p>
          )}
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

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={logs}
          rowKey={(log) => log.id}
          loading={loading}
          error={error}
          loadingMessage="Loading AI logs..."
          emptyMessage="No AI logs match these filters."
          expandable
          renderExpanded={(log) => (
            <div className="space-y-2 text-[12px]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1">Message</p>
                <p className="text-[#1c1a17] break-all">{log.message}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1">Meta</p>
                {/* Shape varies per feature, so it is shown raw rather
                    than mapped to named fields. */}
                <pre className="text-[11px] text-[#4a4640] font-mono whitespace-pre-wrap break-all">
                  {log.meta ? JSON.stringify(log.meta, null, 2) : "—"}
                </pre>
              </div>
            </div>
          )}
        />
        <Pagination
          pagination={pagination}
          onPageChange={setPage}
          variant="compact"
          itemLabel="logs"
          currentCount={logs.length}
        />
      </div>
    </div>
  );
}
