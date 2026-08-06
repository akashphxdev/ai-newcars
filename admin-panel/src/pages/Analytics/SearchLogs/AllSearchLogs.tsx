// src/pages/Analytics/SearchLogs/AllSearchLogs.tsx
import { useEffect, useState } from "react";
import { useGetSearchLogsQuery, useDeleteSearchLogMutation, type SearchLogRecord } from "./searchLog.api";
import { extractApiError } from "../../../lib/apiClient";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import ConfirmDialog from "../../../components/common/ConfirmDialog";

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

export default function AllSearchLogs() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  // Debounced copy of `search` — this is what actually goes into the
  // query args, so we don't refetch on every keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [noResultsOnly, setNoResultsOnly] = useState(false);
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
  } = useGetSearchLogsQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
    noResultsOnly: noResultsOnly || undefined,
    dateFrom: fromDate || undefined,
    dateTo: toDate || undefined,
  });

  const logs = data?.data ?? [];
  const pagination = data?.pagination ?? null;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";
  const loading = isLoading || isFetching;

  const [deleteSearchLog] = useDeleteSearchLogMutation();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SearchLogRecord | null>(null);
  const [actionError, setActionError] = useState("");

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setActionError("");
    setDeletingId(pendingDelete.id);
    try {
      await deleteSearchLog(pendingDelete.id).unwrap();
      setPendingDelete(null);
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setDeletingId(null);
    }
  };

  const handleLimitChange = (value: number) => {
    setLimit(value);
    setPage(1);
  };

  const columns: DataTableColumn<SearchLogRecord>[] = [
    {
      header: "Search Query",
      render: (log) => <span className="font-semibold text-[#1c1a17]">{log.searchQuery ?? "—"}</span>,
    },
    {
      header: "Results",
      render: (log) => (
        <span className={log.resultsCount === 0 ? "font-bold text-[#D4300F]" : "text-[#4a4640]"}>
          {log.resultsCount ?? "—"}
        </span>
      ),
    },
    { header: "User", render: (log) => <span className="text-[#4a4640]">{log.user?.name ?? "Guest"}</span> },
    { header: "Device", render: (log) => <span className="text-[#7a7670]">{log.deviceType ?? "—"}</span> },
    {
      header: "Page URL",
      render: (log) => (
        <span className="text-[#7a7670] block max-w-[220px] truncate" title={log.pageUrl ?? undefined}>
          {log.pageUrl ?? "—"}
        </span>
      ),
    },
    { header: "IP", className: "font-mono", render: (log) => <span className="text-[#a39e96]">{log.ipAddress ?? "—"}</span> },
    {
      header: "User Agent",
      render: (log) => (
        <span className="text-[#a39e96] block max-w-[220px] truncate" title={log.userAgent ?? undefined}>
          {log.userAgent ?? "—"}
        </span>
      ),
    },
    {
      header: "Date & Time",
      render: (log) => <span className="text-[#7a7670] whitespace-nowrap">{formatDateTime(log.createdAt)}</span>,
    },
    {
      header: "",
      align: "right",
      render: (log) => (
        <button
          onClick={() => setPendingDelete(log)}
          disabled={deletingId === log.id}
          className="cursor-pointer text-[9.5px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {deletingId === log.id ? "..." : "Delete"}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-[1300px]">
      <div>
        <h1 className="text-[18px] font-black text-[#1c1a17]">Search Logs</h1>
        <p className="text-[12px] text-[#a39e96] mt-0.5">
          Every search made from the website's header — recorded automatically, guest or logged-in.
        </p>
      </div>

      {actionError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
          <p className="text-red-500 text-xs font-medium">{actionError}</p>
        </div>
      )}

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
            placeholder="Search by query text..."
            className="flex-1 bg-transparent text-[12px] text-[#1c1a17] outline-none placeholder:text-[#c0bab0]"
          />
        </div>

        <label className="flex items-center gap-1.5 cursor-pointer text-[12px] font-semibold text-[#4a4640] whitespace-nowrap">
          <input
            type="checkbox"
            checked={noResultsOnly}
            onChange={(e) => {
              setPage(1);
              setNoResultsOnly(e.target.checked);
            }}
            className="cursor-pointer accent-[#D4300F]"
          />
          No-results searches only
        </label>

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

        {(search || noResultsOnly || fromDate || toDate) && (
          <button
            onClick={() => {
              setSearch("");
              setNoResultsOnly(false);
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
              {pagination.total} search{pagination.total === 1 ? "" : "es"} total
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
          loadingMessage="Loading search logs..."
          emptyMessage="No searches match these filters."
          expandable
          renderExpanded={(log) => (
            <div className="space-y-2 text-[12px]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1">User Agent</p>
                <p className="text-[#1c1a17] break-all">{log.userAgent ?? "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1">Page URL</p>
                <p className="text-[#1c1a17] break-all">{log.pageUrl ?? "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1">Session ID</p>
                <p className="text-[#4a4640] font-mono">{log.sessionId ?? "—"}</p>
              </div>
            </div>
          )}
        />
        <Pagination
          pagination={pagination}
          onPageChange={setPage}
          variant="compact"
          itemLabel="searches"
          currentCount={logs.length}
        />
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this search log?"
        itemName={pendingDelete?.searchQuery ?? null}
        loading={deletingId === pendingDelete?.id}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
