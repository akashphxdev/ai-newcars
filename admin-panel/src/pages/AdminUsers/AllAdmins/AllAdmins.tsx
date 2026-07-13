// src/pages/AdminUsers/AllAdmins.tsx

import { useEffect, useState } from "react";
import {
  useGetAdminsQuery,
  useLockAdminMutation,
  useUnlockAdminMutation,
  useUpdateAdminStatusMutation,
  type AdminRecord,
} from "./admin.api";
import { useGetRolesQuery } from "../../AdminUsers/Roles/role.api";
import { extractApiError } from "../../../lib/apiClient";
import { formatIpv4 } from "../../../lib/ipUtils";
import CreateAdminModal from "./CreateAdminModal";
import EditAdminModal from "./EditAdminModal";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";

const ACCENT = "#D4300F";

// Rows-per-page choices shown in the dropdown.
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const STATUS_OPTIONS: Array<{ value: "active" | "inactive" | "suspended"; label: string }> = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];

function StatusBadge({ status, isLocked }: { status: string; isLocked: boolean }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: "#f0fdf4", text: "#15803d", label: "Active" },
    inactive: { bg: "#f7f5f1", text: "#7a7670", label: "Inactive" },
    suspended: { bg: "#fff7ed", text: "#c2410c", label: "Suspended" },
  };
  const s = isLocked ? { bg: "#fef2f0", text: "#D4300F", label: "Locked" } : map[status] ?? map.inactive;
  return (
    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.text }}>
      {s.label}
    </span>
  );
}

function RoleBadge({ roleName }: { roleName: string }) {
  const color = roleName === "Super Admin" ? ACCENT : "#1d72c4";
  const bg = roleName === "Super Admin" ? "#fef2f0" : "#eef6ff";
  return (
    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: bg, color }}>
      {roleName}
    </span>
  );
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatRelative(value: string | null) {
  if (!value) return "Never";
  const diffMs = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function AllAdmins() {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminRecord | null>(null);

  // Only used to populate the "All roles" filter dropdown.
  const { data: rolesData } = useGetRolesQuery();
  const roles = rolesData?.all ?? [];

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  // Debounced copy of `search` — this is what actually goes into the
  // query args, so we don't refetch on every keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleId, setRoleId] = useState<number | "">("");
  const [status, setStatus] = useState<string>("");

  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetAdminsQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
    roleId: roleId || undefined,
    status: status || undefined,
  });

  const admins = data?.data ?? [];
  const pagination = data?.pagination ?? null;
  // axiosBaseQuery (see store/baseApi.ts) already turns failures into
  // { status, message } — no need to re-parse an axios error here.
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";

  const [lockAdmin] = useLockAdminMutation();
  const [unlockAdmin] = useUnlockAdminMutation();
  const [updateAdminStatus] = useUpdateAdminStatusMutation();

  const handleToggleLock = async (admin: AdminRecord) => {
    setActionError("");
    setBusyId(admin.id);
    try {
      if (admin.isLocked) {
        await unlockAdmin(admin.id).unwrap();
      } else {
        await lockAdmin({ id: admin.id, reason: "Locked from admin panel" }).unwrap();
      }
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleStatusChange = async (admin: AdminRecord, nextStatus: "active" | "inactive" | "suspended") => {
    if (nextStatus === admin.status) return;
    setActionError("");
    setBusyId(admin.id);
    try {
      await updateAdminStatus({ id: admin.id, status: nextStatus }).unwrap();
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleLimitChange = (value: number) => {
    setLimit(value);
    setPage(1);
  };
  const stats = {
    total: pagination?.total ?? 0,
    active: admins.filter((a) => a.status === "active" && !a.isLocked).length,
    inactive: admins.filter((a) => a.status === "inactive").length,
    locked: admins.filter((a) => a.isLocked).length,
  };

  const loading = isLoading || isFetching;

  const renderExpandedAdmin = (a: AdminRecord) => (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-2">Account</p>
        <div className="grid grid-cols-4 gap-x-6 gap-y-3">
          <div>
            <p className="text-[10px] font-semibold text-[#a39e96] mb-1">Admin ID</p>
            <p className="text-[12.5px] font-mono text-[#1c1a17]">#{a.id}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#a39e96] mb-1">Mobile</p>
            <p className="text-[12.5px] font-mono text-[#1c1a17]">{a.mobile || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#a39e96] mb-1">Access start</p>
            <p className="text-[12.5px] text-[#1c1a17]">{a.accessStartDate ? formatDate(a.accessStartDate) : "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#a39e96] mb-1">Access end</p>
            <p className="text-[12.5px] text-[#1c1a17]">{a.accessEndDate ? formatDate(a.accessEndDate) : "No end date"}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#a39e96] mb-1">Role ID</p>
            <p className="text-[12.5px] font-mono text-[#1c1a17]">#{a.roleId}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#a39e96] mb-1">Created by (ID)</p>
            <p className="text-[12.5px] font-mono text-[#1c1a17]">{a.createdBy ? `#${a.createdBy}` : "—"}</p>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-[#f0ece6]">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-2">Login &amp; security</p>
        <div className="grid grid-cols-4 gap-x-6 gap-y-3">
          <div>
            <p className="text-[10px] font-semibold text-[#a39e96] mb-1">Last login</p>
            <p className="text-[12.5px] text-[#1c1a17]">{formatRelative(a.lastLoginAt)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#a39e96] mb-1">Last login IP</p>
            <p className="text-[12.5px] font-mono text-[#1c1a17]">{formatIpv4(a.lastLoginIp)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#a39e96] mb-1">Failed login attempts</p>
            <p className={`text-[12.5px] font-semibold ${a.failedLoginAttempts > 0 ? "text-[#D4300F]" : "text-[#1c1a17]"}`}>
              {a.failedLoginAttempts}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#a39e96] mb-1">Lock type</p>
            <p className="text-[12.5px] text-[#1c1a17]">{a.lockType || "—"}</p>
          </div>
        </div>
      </div>

      {(a.isLocked || a.lockedAt || a.unlockedAt) && (
        <div className="pt-3 border-t border-[#f0ece6]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-2">Lock history</p>
          <div className="grid grid-cols-4 gap-x-6 gap-y-3">
            <div>
              <p className="text-[10px] font-semibold text-[#a39e96] mb-1">Locked at</p>
              <p className="text-[12.5px] text-[#1c1a17]">{a.lockedAt ? formatDate(a.lockedAt) : "—"}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[#a39e96] mb-1">Locked by</p>
              <p className="text-[12.5px] text-[#1c1a17]">{a.lockedBy ? `Admin #${a.lockedBy}` : "—"}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[#a39e96] mb-1">Unlocked at</p>
              <p className="text-[12.5px] text-[#1c1a17]">{a.unlockedAt ? formatDate(a.unlockedAt) : "—"}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[#a39e96] mb-1">Unlocked by</p>
              <p className="text-[12.5px] text-[#1c1a17]">{a.unlockedBy ? `Admin #${a.unlockedBy}` : "—"}</p>
            </div>
            {a.isLocked && (
              <div className="col-span-4">
                <p className="text-[10px] font-semibold text-[#a39e96] mb-1">Lock reason</p>
                <p className="text-[12.5px] text-[#D4300F] font-medium">{a.lockedReason || "No reason provided"}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const columns: DataTableColumn<AdminRecord>[] = [
    { header: "ID", className: "font-mono", render: (a) => <span className="text-[#a39e96]">#{a.id}</span> },
    {
      header: "Name",
      render: (a) => (
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0"
            style={{ background: ACCENT }}
          >
            {initials(a.name)}
          </div>
          <div>
            <p className="font-semibold text-[#1c1a17]">{a.name}</p>
            <p className="text-[10px] text-[#a39e96]">{a.email}</p>
          </div>
        </div>
      ),
    },
    { header: "Role", render: (a) => <RoleBadge roleName={a.role?.roleName ?? "—"} /> },
    {
      header: "Status",
      render: (a) => (
        <div className="flex items-center gap-1.5">
          <StatusBadge status={a.status} isLocked={a.isLocked} />
          <select
            value={a.status}
            disabled={a.isLocked || busyId === a.id}
            onChange={(e) => handleStatusChange(a, e.target.value as "active" | "inactive" | "suspended")}
            title={a.isLocked ? "Unlock this account to change its status" : "Change status"}
            className="cursor-pointer text-[10px] font-semibold text-[#7a7670] bg-[#f7f5f1] border border-[#e8e4dc] rounded-md px-1.5 py-1 outline-none disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ),
    },
    { header: "Last login", render: (a) => <span className="text-[#7a7670]">{formatRelative(a.lastLoginAt)}</span> },
    { header: "Last IP", className: "font-mono", render: (a) => <span className="text-[#a39e96]">{formatIpv4(a.lastLoginIp)}</span> },
    { header: "Created", render: (a) => <span className="text-[#a39e96]">{formatDate(a.createdAt)}</span> },
    { header: "Created by", render: (a) => <span className="text-[#7a7670]">{a.createdByAdmin?.name ?? "—"}</span> },
    {
      header: "Actions",
      render: (a) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setEditingAdmin(a)}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors"
          >
            Edit
          </button>
          <button
            disabled={busyId === a.id}
            onClick={() => handleToggleLock(a)}
            className={
              a.isLocked
                ? "cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                : "cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
            }
          >
            {busyId === a.id ? "..." : a.isLocked ? "Unlock" : "Lock"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-[1280px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-black text-[#1c1a17]">Admin users</h1>
          <p className="text-[12px] text-[#a39e96] mt-0.5">Manage all admin accounts and their access</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="cursor-pointer flex items-center gap-2 text-[12px] font-semibold text-white px-4 py-2 rounded-lg transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add admin
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total admins", value: stats.total },
          { label: "Active", value: stats.active },
          { label: "Inactive", value: stats.inactive },
          { label: "Locked", value: stats.locked },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#e8e4dc] rounded-xl px-4 py-3 text-center">
            <p className="text-[20px] font-black text-[#1c1a17] leading-none">{s.value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#a39e96] mt-1">{s.label}</p>
          </div>
        ))}
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
            placeholder="Search by name, email..."
            className="flex-1 bg-transparent text-[12px] text-[#1c1a17] outline-none placeholder:text-[#c0bab0]"
          />
        </div>
        <select
          value={roleId}
          onChange={(e) => {
            setPage(1);
            setRoleId(e.target.value ? Number(e.target.value) : "");
          }}
          className="cursor-pointer text-[12px] text-[#4a4640] bg-[#f7f5f1] border border-[#e8e4dc] rounded-lg px-3 py-2 outline-none"
        >
          <option value="">All roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.roleName}
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
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>

        <div className="flex items-center gap-2 ml-auto">
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

      {actionError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
          <p className="text-red-500 text-xs font-medium">{actionError}</p>
        </div>
      )}

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={admins}
          rowKey={(a) => a.id}
          loading={loading}
          error={error}
          loadingMessage="Loading admins..."
          emptyMessage="No admins match these filters."
          expandable
          renderExpanded={renderExpandedAdmin}
        />
        <Pagination
          pagination={pagination}
          onPageChange={setPage}
          variant="numbered"
          itemLabel="admins"
          currentCount={admins.length}
        />
      </div>

      <CreateAdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={() => {
          setPage(1);
        }}
      />

      <EditAdminModal
        open={!!editingAdmin}
        admin={editingAdmin}
        onClose={() => setEditingAdmin(null)}
        onUpdate={() => setEditingAdmin(null)}
      />
    </div>
  );
}