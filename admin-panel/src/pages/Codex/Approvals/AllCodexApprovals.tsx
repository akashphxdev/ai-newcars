import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";
import { SearchFilterBar, SearchInput } from "../../../components/common/SearchFilterBar";
import { extractApiError, getUploadUrl } from "../../../lib/apiClient";
import {
  CODEX_ENTITIES,
  type CodexEntity,
  type CodexProposalRecord,
  type CodexProposalStatus,
  useApproveCodexProposalMutation,
  useGetCodexProposalsQuery,
  useRejectCodexProposalMutation,
} from "./codexApprovals.api";

const ACCENT = "#D4300F";
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

interface AllCodexApprovalsProps {
  entity: CodexEntity;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getProposalTitle(row: CodexProposalRecord) {
  return row.name ?? row.title ?? row.variantName ?? row.question ?? row.colorName ?? row.imageUrl ?? `#${row.id}`;
}

function getProposalSubtitle(row: CodexProposalRecord) {
  const parts = [row.slug, row.status, row.value].filter(Boolean);
  return parts.length ? parts.join(" | ") : `Created ${formatDate(row.createdAt)}`;
}

function StatusPill({ status }: { status: CodexProposalStatus }) {
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

function DetailGrid({ data }: { data: CodexProposalRecord }) {
  const entries = Object.entries(data).filter(([, value]) => value !== null && value !== undefined && value !== "");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {entries.map(([key, value]) => (
        <div key={key} className="border border-[#eee9e1] bg-white rounded-lg px-3 py-2 min-w-0">
          <p className="text-[10px] font-bold uppercase text-[#a39e96] break-words">{key}</p>
          <p className="text-[12px] font-semibold text-[#1c1a17] mt-1 break-words">
            {typeof value === "object" ? JSON.stringify(value) : String(value)}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function AllCodexApprovals({ entity }: AllCodexApprovalsProps) {
  const [status, setStatus] = useState<CodexProposalStatus>("pending");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pendingApprove, setPendingApprove] = useState<CodexProposalRecord | null>(null);
  const [pendingReject, setPendingReject] = useState<CodexProposalRecord | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
    setSearch("");
    setDebouncedSearch("");
  }, [entity]);

  useEffect(() => {
    setPage(1);
  }, [status]);

  const entityLabel = useMemo(
    () => CODEX_ENTITIES.find((item) => item.value === entity)?.label ?? "Proposals",
    [entity],
  );

  const { data, isLoading, isFetching, error } = useGetCodexProposalsQuery({
    entity,
    page,
    limit,
    status,
    search: debouncedSearch || undefined,
  });

  const [approveProposal, { isLoading: approving }] = useApproveCodexProposalMutation();
  const [rejectProposal, { isLoading: rejecting }] = useRejectCodexProposalMutation();

  const rows = data?.data ?? [];
  const pagination = data?.pagination;
  const loading = isLoading || isFetching;
  const queryError = error ? (error as { message?: string }).message ?? "Something went wrong." : "";

  const columns = useMemo<DataTableColumn<CodexProposalRecord>[]>(
    () => [
      {
        header: "Proposal",
        render: (row) => (
          <div className="min-w-[220px]">
            <p className="font-bold text-[#1c1a17] break-words">{getProposalTitle(row)}</p>
            <p className="text-[11px] text-[#a39e96] mt-0.5 break-words">{getProposalSubtitle(row)}</p>
          </div>
        ),
      },
      {
        header: "Run",
        render: (row) => <span className="text-[#7a7670]">{row.runId ? `#${row.runId}` : "-"}</span>,
      },
      {
        header: "Status",
        render: (row) => <StatusPill status={row.proposalStatus} />,
      },
      {
        header: "Created",
        render: (row) => <span className="text-[#7a7670] whitespace-nowrap">{formatDate(row.createdAt)}</span>,
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
      await approveProposal({ entity, id: pendingApprove.id }).unwrap();
      setPendingApprove(null);
    } catch (err) {
      setActionError(extractApiError(err));
    }
  };

  const handleReject = async () => {
    if (!pendingReject) return;
    setActionError("");
    try {
      await rejectProposal({ entity, id: pendingReject.id }).unwrap();
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
          <h1 className="text-[18px] font-black text-[#1c1a17]">Codex {entityLabel}</h1>
          <p className="text-[12px] text-[#a39e96] mt-0.5">
            Review generated staging data before it moves to live tables.
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
                {pagination.total} proposal{pagination.total === 1 ? "" : "s"} total
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
          placeholder="Search proposal..."
          width="260px"
        />
      </SearchFilterBar>

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          loading={loading}
          error={queryError}
          loadingMessage="Loading Codex proposals..."
          emptyMessage="No Codex proposals found."
          expandable
          renderExpanded={(row) => (
            <div className="space-y-3">
              {row.imageUrl && getUploadUrl(row.imageUrl) && (
                <img
                  src={getUploadUrl(row.imageUrl)!}
                  alt=""
                  className="h-28 w-44 object-cover rounded-lg border border-[#e8e4dc]"
                />
              )}
              <DetailGrid data={row} />
            </div>
          )}
        />
        <Pagination
          pagination={pagination ?? null}
          onPageChange={setPage}
          variant="compact"
          itemLabel="proposals"
          currentCount={rows.length}
        />
      </div>

      <ConfirmDialog
        open={!!pendingApprove}
        title="Approve proposal?"
        itemName={pendingApprove ? getProposalTitle(pendingApprove) : undefined}
        loading={approving}
        onCancel={() => setPendingApprove(null)}
        onConfirm={handleApprove}
      />
      <ConfirmDialog
        open={!!pendingReject}
        title="Reject proposal?"
        itemName={pendingReject ? getProposalTitle(pendingReject) : undefined}
        loading={rejecting}
        onCancel={() => setPendingReject(null)}
        onConfirm={handleReject}
      />
    </div>
  );
}
