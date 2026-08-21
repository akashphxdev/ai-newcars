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
  useDeleteRejectedCodexProposalMutation,
  useGetCodexProposalByIdQuery,
  useGetCodexProposalsQuery,
  useRejectCodexProposalMutation,
  useUpdateCodexProposalMutation,
} from "./codexApprovals.api";

const ACCENT = "#D4300F";
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const SYSTEM_FIELDS = new Set(["id", "runId", "proposalStatus", "reviewedBy", "reviewedAt", "createdAt", "updatedAt"]);

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

function isPresent(value: unknown) {
  return value !== null && value !== undefined && value !== "";
}

function getApprovalDependencyWarning(entity: CodexEntity, row: CodexProposalRecord) {
  if ((entity === "powertrains-ice" || entity === "powertrains-electric") && !isPresent(row.variantId)) {
    return "Approve the linked variant first.";
  }

  if (entity === "variant-features") {
    const missing: string[] = [];
    if (!isPresent(row.variantId)) missing.push("variant");
    if (!isPresent(row.featureId)) missing.push("feature");
    if (missing.length) return `Approve the linked ${missing.join(" and ")} first.`;
  }

  return "";
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

function FullProposalDetail({ entity, row }: { entity: CodexEntity; row: CodexProposalRecord }) {
  const { data, isLoading, error } = useGetCodexProposalByIdQuery({ entity, id: row.id });
  const fullRow = data ?? row;

  if (isLoading) {
    return <p className="text-[12px] font-semibold text-[#a39e96]">Loading full row...</p>;
  }

  if (error) {
    return <p className="text-[12px] font-semibold text-red-500">Full row could not be loaded.</p>;
  }

  return (
    <div className="space-y-3">
      {fullRow.imageUrl && getUploadUrl(String(fullRow.imageUrl)) && (
        <img
          src={getUploadUrl(String(fullRow.imageUrl))!}
          alt=""
          className="h-28 w-44 object-cover rounded-lg border border-[#e8e4dc]"
        />
      )}
      <DetailGrid data={fullRow} />
    </div>
  );
}

function stringifyEditValue(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function parseEditValue(originalValue: unknown, rawValue: string) {
  const trimmed = rawValue.trim();
  if (trimmed === "") return null;
  if (typeof originalValue === "number") {
    const numericValue = Number(trimmed);
    if (!Number.isFinite(numericValue)) throw new Error("number");
    return numericValue;
  }
  if (typeof originalValue === "boolean") {
    if (trimmed.toLowerCase() === "true") return true;
    if (trimmed.toLowerCase() === "false") return false;
    throw new Error("boolean");
  }
  if (typeof originalValue === "object" && originalValue !== null) {
    return JSON.parse(trimmed);
  }
  if (originalValue === null || originalValue === undefined) {
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
    if (trimmed.toLowerCase() === "true") return true;
    if (trimmed.toLowerCase() === "false") return false;
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      return JSON.parse(trimmed);
    }
  }
  return rawValue;
}

function EditProposalDialog({
  entity,
  proposal,
  onClose,
}: {
  entity: CodexEntity;
  proposal: CodexProposalRecord | null;
  onClose: () => void;
}) {
  const open = !!proposal;
  const { data, isLoading } = useGetCodexProposalByIdQuery(
    { entity, id: proposal?.id ?? 0 },
    { skip: !proposal },
  );
  const [updateProposal, { isLoading: saving }] = useUpdateCodexProposalMutation();
  const [values, setValues] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!data) return;
    const nextValues: Record<string, string> = {};
    Object.entries(data).forEach(([key, value]) => {
      if (!SYSTEM_FIELDS.has(key)) nextValues[key] = stringifyEditValue(value);
    });
    setValues(nextValues);
    setFormError("");
  }, [data]);

  if (!open) return null;

  const fields = data ? Object.entries(data).filter(([key]) => !SYSTEM_FIELDS.has(key)) : [];

  const handleSave = async () => {
    if (!proposal || !data) return;
    setFormError("");
    try {
      const payload: Record<string, unknown> = {};
      for (const [key, originalValue] of fields) {
        payload[key] = parseEditValue(originalValue, values[key] ?? "");
      }
      await updateProposal({ entity, id: proposal.id, data: payload }).unwrap();
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? `Invalid value. Expected ${err.message}.` : extractApiError(err));
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-[820px] max-h-[88vh] overflow-hidden bg-white border border-[#e8e4dc] rounded-2xl shadow-xl">
        <div className="px-5 py-4 border-b border-[#f0ece6] flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[#1c1a17] text-base font-black">Edit proposal</h2>
            <p className="text-[#7a7670] text-[12px] mt-1">{proposal ? getProposalTitle(proposal) : ""}</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="cursor-pointer text-[#7a7670] font-bold">
            Close
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[62vh]">
          {isLoading && <p className="text-[12px] font-semibold text-[#a39e96]">Loading full row...</p>}
          {formError && (
            <div className="mb-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <p className="text-red-500 text-xs font-medium">{formError}</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fields.map(([key, originalValue]) => (
              <label key={key} className="block">
                <span className="text-[10px] font-bold uppercase text-[#a39e96]">{key}</span>
                <textarea
                  value={values[key] ?? ""}
                  onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}
                  rows={typeof originalValue === "object" || String(values[key] ?? "").length > 80 ? 4 : 2}
                  className="mt-1 w-full resize-y rounded-lg border border-[#e8e4dc] bg-[#fdfcf9] px-3 py-2 text-[12px] font-semibold text-[#1c1a17] outline-none focus:border-[#D4300F]"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-[#f0ece6] flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="cursor-pointer px-4 py-2 rounded-lg border border-[#e2ddd5] text-sm font-bold text-[#4a4640]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || isLoading}
            className="cursor-pointer px-4 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50"
            style={{ background: ACCENT }}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
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
  const [pendingDelete, setPendingDelete] = useState<CodexProposalRecord | null>(null);
  const [editingProposal, setEditingProposal] = useState<CodexProposalRecord | null>(null);
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
  const [deleteProposal, { isLoading: deleting }] = useDeleteRejectedCodexProposalMutation();

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
        render: (row) => {
          const dependencyWarning = getApprovalDependencyWarning(entity, row);

          return (
            <div className="flex flex-col items-end gap-1.5">
              {dependencyWarning && (
                <span className="max-w-[180px] text-right text-[10px] font-semibold text-amber-700">
                  {dependencyWarning}
                </span>
              )}
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setEditingProposal(row);
                  }}
                  className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-[#f7f5f1]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (!dependencyWarning) setPendingApprove(row);
                  }}
                  disabled={!!dependencyWarning}
                  title={dependencyWarning || "Approve proposal"}
                  className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
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
                {row.proposalStatus === "rejected" && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setPendingDelete(row);
                    }}
                    className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          );
        },
      },
    ],
    [entity],
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

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setActionError("");
    try {
      await deleteProposal({ entity, id: pendingDelete.id }).unwrap();
      setPendingDelete(null);
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
          renderExpanded={(row) => <FullProposalDetail entity={entity} row={row} />}
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
        message="This staging row will move into the live table using the existing approval workflow."
        confirmLabel="Approve"
        loadingLabel="Approving..."
        onCancel={() => setPendingApprove(null)}
        onConfirm={handleApprove}
      />
      <ConfirmDialog
        open={!!pendingReject}
        title="Reject proposal?"
        itemName={pendingReject ? getProposalTitle(pendingReject) : undefined}
        loading={rejecting}
        message="This staging row will be marked as rejected and will not move into the live table."
        confirmLabel="Reject"
        loadingLabel="Rejecting..."
        onCancel={() => setPendingReject(null)}
        onConfirm={handleReject}
      />
      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete rejected proposal?"
        itemName={pendingDelete ? getProposalTitle(pendingDelete) : undefined}
        loading={deleting}
        message="This rejected staging row will be permanently deleted. Live tables will not be touched."
        confirmLabel="Delete"
        loadingLabel="Deleting..."
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />
      <EditProposalDialog entity={entity} proposal={editingProposal} onClose={() => setEditingProposal(null)} />
    </div>
  );
}
