// src/pages/Users/AllUsers/AllUsers.tsx

import { useEffect, useState } from "react";
import {
  useGetUsersQuery,
  useLockUserMutation,
  useUnlockUserMutation,
  useUpdateUserStatusMutation,
  useDeleteUserMutation,
  type UserRecord,
} from "./user.api";
import { extractApiError } from "../../../lib/apiClient";
import { formatIpv4 } from "../../../lib/ipUtils";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";
import Pagination from "../../../components/common/Pagination";

const ACCENT = "#D4300F";

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

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

export default function AllUsers() {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [lockedFilter, setLockedFilter] = useState<string>("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetUsersQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
    status: status || undefined,
    isLocked: lockedFilter ? lockedFilter === "locked" : undefined,
  });

  const users = data?.data ?? [];
  const pagination = data?.pagination ?? null;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";

  const [lockUser] = useLockUserMutation();
  const [unlockUser] = useUnlockUserMutation();
  const [updateUserStatus] = useUpdateUserStatusMutation();
  const [deleteUser] = useDeleteUserMutation();

  const handleToggleLock = async (user: UserRecord) => {
    setActionError("");
    setBusyId(user.id);
    try {
      if (user.isLocked) {
        await unlockUser(user.id).unwrap();
      } else {
        await lockUser({ id: user.id, reason: "Locked from admin panel" }).unwrap();
      }
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleStatusChange = async (user: UserRecord, nextStatus: "active" | "inactive" | "suspended") => {
    if (nextStatus === user.status) return;
    setActionError("");
    setBusyId(user.id);
    try {
      await updateUserStatus({ id: user.id, status: nextStatus }).unwrap();
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleDeactivate = async (user: UserRecord) => {
    setActionError("");
    setBusyId(user.id);
    try {
      await deleteUser(user.id).unwrap();
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
    newToday: data?.newToday ?? 0,
    active: users.filter((u) => u.status === "active" && !u.isLocked).length,
    inactive: users.filter((u) => u.status === "inactive").length,
    locked: users.filter((u) => u.isLocked).length,
  };

  const loading = isLoading || isFetching;

  const renderExpandedUser = (u: UserRecord) => (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-2">Account</p>
        <div className="grid grid-cols-4 gap-x-6 gap-y-3">
          <div>
            <p className="text-[10px] font-semibold text-[#a39e96] mb-1">User ID</p>
            <p className="text-[12.5px] font-mono text-[#1c1a17]">#{u.id}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#a39e96] mb-1">Email</p>
            <p className="text-[12.5px] text-[#1c1a17]">{u.email || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#a39e96] mb-1">Mobile</p>
            <p className="text-[12.5px] font-mono text-[#1c1a17]">{u.mobile || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#a39e96] mb-1">City</p>
            <p className="text-[12.5px] text-[#1c1a17]">{u.city?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#a39e96] mb-1">Email verified</p>
            <p className="text-[12.5px] text-[#1c1a17]">{u.isVerified ? "Yes" : "No"}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#a39e96] mb-1">Account created</p>
            <p className="text-[12.5px] text-[#1c1a17]">{formatDateTime(u.createdAt)}</p>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-[#f0ece6]">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-2">Login &amp; security</p>
        <div className="grid grid-cols-4 gap-x-6 gap-y-3">
          <div>
            <p className="text-[10px] font-semibold text-[#a39e96] mb-1">Last login</p>
            <p className="text-[12.5px] text-[#1c1a17]">{formatDateTime(u.lastLoginAt)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#a39e96] mb-1">Last login IP</p>
            <p className="text-[12.5px] font-mono text-[#1c1a17]">{formatIpv4(u.lastLoginIp)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#a39e96] mb-1">Failed OTP attempts</p>
            <p className={`text-[12.5px] font-semibold ${u.failedLoginAttempts > 0 ? "text-[#D4300F]" : "text-[#1c1a17]"}`}>
              {u.failedLoginAttempts}
            </p>
          </div>
        </div>
      </div>

      {(u.isLocked || u.lockedAt) && (
        <div className="pt-3 border-t border-[#f0ece6]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-2">Lock details</p>
          <div className="grid grid-cols-4 gap-x-6 gap-y-3">
            <div>
              <p className="text-[10px] font-semibold text-[#a39e96] mb-1">Locked at</p>
              <p className="text-[12.5px] text-[#1c1a17]">{formatDateTime(u.lockedAt)}</p>
            </div>
            <div className="col-span-3">
              <p className="text-[10px] font-semibold text-[#a39e96] mb-1">Lock reason</p>
              <p className="text-[12.5px] text-[#D4300F] font-medium">{u.lockedReason || "No reason provided"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const columns: DataTableColumn<UserRecord>[] = [
    { header: "ID", className: "font-mono", render: (u) => <span className="text-[#a39e96]">#{u.id}</span> },
    {
      header: "Name",
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0"
            style={{ background: ACCENT }}
          >
            {initials(u.name)}
          </div>
          <div>
            <p className="font-semibold text-[#1c1a17]">{u.name}</p>
            <p className="text-[10px] text-[#a39e96]">{u.email || u.mobile}</p>
          </div>
        </div>
      ),
    },
    { header: "Mobile", className: "font-mono", render: (u) => <span className="text-[#4a4640]">{u.mobile}</span> },
    {
      header: "Status",
      render: (u) => (
        <div className="flex items-center gap-1.5">
          <StatusBadge status={u.status} isLocked={u.isLocked} />
          <select
            value={u.status}
            disabled={u.isLocked || busyId === u.id}
            onChange={(e) => handleStatusChange(u, e.target.value as "active" | "inactive" | "suspended")}
            title={u.isLocked ? "Unlock this account to change its status" : "Change status"}
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
    { header: "Last login", render: (u) => <span className="text-[#7a7670]">{formatRelative(u.lastLoginAt)}</span> },
    { header: "Last IP", className: "font-mono", render: (u) => <span className="text-[#a39e96]">{formatIpv4(u.lastLoginIp)}</span> },
    { header: "Created", render: (u) => <span className="text-[#a39e96]">{formatDateTime(u.createdAt)}</span> },
    {
      header: "Actions",
      render: (u) => (
        <div className="flex items-center gap-1.5">
          <button
            disabled={busyId === u.id}
            onClick={() => handleToggleLock(u)}
            className={
              u.isLocked
                ? "cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                : "cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
            }
          >
            {busyId === u.id ? "..." : u.isLocked ? "Unlock" : "Lock"}
          </button>
          <button
            disabled={busyId === u.id || u.status === "inactive"}
            onClick={() => handleDeactivate(u)}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors disabled:opacity-40"
          >
            Deactivate
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-[1280px]">
      <div>
        <h1 className="text-[18px] font-black text-[#1c1a17]">Users</h1>
        <p className="text-[12px] text-[#a39e96] mt-0.5">Website visitors who have signed up via OTP</p>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Total users", value: stats.total },
          { label: "New today", value: stats.newToday },
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
            placeholder="Search by name, email, mobile..."
            className="flex-1 bg-transparent text-[12px] text-[#1c1a17] outline-none placeholder:text-[#c0bab0]"
          />
        </div>
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
        <select
          value={lockedFilter}
          onChange={(e) => {
            setPage(1);
            setLockedFilter(e.target.value);
          }}
          className="cursor-pointer text-[12px] text-[#4a4640] bg-[#f7f5f1] border border-[#e8e4dc] rounded-lg px-3 py-2 outline-none"
        >
          <option value="">Locked &amp; unlocked</option>
          <option value="locked">Locked only</option>
          <option value="unlocked">Unlocked only</option>
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
          rows={users}
          rowKey={(u) => u.id}
          loading={loading}
          error={error}
          loadingMessage="Loading users..."
          emptyMessage="No users match these filters."
          expandable
          renderExpanded={renderExpandedUser}
        />
        <Pagination
          pagination={pagination}
          onPageChange={setPage}
          variant="numbered"
          itemLabel="users"
          currentCount={users.length}
        />
      </div>
    </div>
  );
}
