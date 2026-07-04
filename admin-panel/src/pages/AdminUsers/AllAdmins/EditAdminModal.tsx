// src/pages/AdminUsers/EditAdminModal.tsx

import { useState, useEffect } from "react";
import { useUpdateAdminMutation, type AdminRecord } from "./admin.api";
import { useGetRolesQuery } from "../Roles/role.api";
import { extractApiError } from "../../../lib/apiClient";

const ACCENT = "#D4300F";

interface FieldErrors {
  name?: string;
  email?: string;
  mobile?: string;
  roleId?: string;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function TextField({
  value,
  onChange,
  placeholder,
  type = "text",
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  error?: string;
}) {
  return (
    <div>
      <div
        className="flex items-center gap-2 rounded-xl border bg-[#f7f5f1] px-3 py-2.5 transition-all focus-within:bg-white"
        style={{
          borderColor: error ? "#f0997b" : "#e2ddd5",
          boxShadow: error ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
        }}
      >
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm font-medium text-[#1c1a17] outline-none placeholder:text-[#c0bab0]"
        />
      </div>
      {error && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{error}</p>}
    </div>
  );
}

function toDateInputValue(value: string | null) {
  if (!value) return "";
  return new Date(value).toISOString().split("T")[0];
}

export default function EditAdminModal({
  open,
  admin,
  onClose,
  onUpdate,
}: {
  open: boolean;
  admin: AdminRecord | null;
  onClose: () => void;
  onUpdate: (admin: AdminRecord) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");

  const [parentRoleId, setParentRoleId] = useState<number | "">("");
  const [subRoleId, setSubRoleId] = useState<number | "">("");
  const {
    data: rolesData,
    isLoading: rolesLoadingQuery,
    isFetching: rolesFetchingQuery,
    error: rolesQueryError,
  } = useGetRolesQuery(undefined, { skip: !open || !admin });
  const parentRoles = rolesData?.parentRoles ?? [];
  const childRolesByParent = rolesData?.childRolesByParent ?? {};
  const rolesLoading = rolesLoadingQuery || rolesFetchingQuery;
  const rolesError = rolesQueryError
    ? (rolesQueryError as { message?: string }).message ?? "Failed to load roles."
    : "";

  const [status, setStatus] = useState<"active" | "inactive" | "suspended">("active");
  const [accessStartDate, setAccessStartDate] = useState("");
  const [accessEndDate, setAccessEndDate] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");

  const [updateAdmin, { isLoading: loading }] = useUpdateAdminMutation();


  useEffect(() => {
    if (!open || !admin) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      setName(admin.name);
      setEmail(admin.email);
      setMobile(admin.mobile);
      setStatus(admin.status);
      setAccessStartDate(toDateInputValue(admin.accessStartDate));
      setAccessEndDate(toDateInputValue(admin.accessEndDate));
      setErrors({});
      setServerError("");
    });
    return () => {
      cancelled = true;
    };
  }, [open, admin]);

  useEffect(() => {
    if (!open || !admin || !rolesData) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      const currentRole = rolesData.all.find((r) => r.id === admin.roleId);
      if (currentRole) {
        if (currentRole.parentRoleId) {
          setParentRoleId(currentRole.parentRoleId);
          setSubRoleId(currentRole.id);
        } else {
          setParentRoleId(currentRole.id);
          setSubRoleId("");
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, admin, rolesData]);

  if (!open || !admin) return null;

  const childRoles = parentRoleId ? childRolesByParent[String(parentRoleId)] ?? [] : [];
  const hasSubRoles = childRoles.length > 0;
  const effectiveRoleId = hasSubRoles ? subRoleId : parentRoleId;

  const handleParentRoleChange = (value: string) => {
    const id = value ? Number(value) : "";
    setParentRoleId(id);
    setSubRoleId("");
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (name.trim().length < 2) next.name = "Name must be at least 2 characters.";
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter a valid email address.";
    if (!/^[0-9]{10,15}$/.test(mobile)) next.mobile = "Mobile must be 10-15 digits.";
    if (!parentRoleId) {
      next.roleId = "Select a role.";
    } else if (hasSubRoles && !subRoleId) {
      next.roleId = "This role has sub-roles — select one.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate() || !effectiveRoleId) return;

    try {
      const updated = await updateAdmin({
        id: admin.id,
        input: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          mobile: mobile.trim(),
          roleId: effectiveRoleId,
          status,
          accessStartDate: accessStartDate || undefined,
          accessEndDate: accessEndDate || undefined,
        },
      }).unwrap();
      onUpdate(updated);
      onClose();
    } catch (err) {
      setServerError(extractApiError(err));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[460px] bg-white border border-[#e8e4dc] rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h2 className="text-[#1c1a17] text-lg font-black">Edit admin</h2>
            <p className="text-[#a39e96] text-xs mt-1">Update {admin.name}'s account details</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer text-[#c0bab0] hover:text-[#1c1a17] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-5 space-y-4" noValidate>
          <Field label="Full name">
            <TextField value={name} onChange={setName} placeholder="Mahender Singh" error={errors.name} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <TextField value={email} onChange={setEmail} placeholder="admin@timesauto.in" type="email" error={errors.email} />
            </Field>
            <Field label="Mobile">
              <TextField value={mobile} onChange={setMobile} placeholder="9876543210" error={errors.mobile} />
            </Field>
          </div>

          <Field label="Role">
            <select
              value={parentRoleId}
              onChange={(e) => handleParentRoleChange(e.target.value)}
              disabled={rolesLoading}
              className="cursor-pointer w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white disabled:opacity-60"
              style={{ borderColor: errors.roleId ? "#f0997b" : "#e2ddd5" }}
            >
              <option value="" disabled>
                {rolesLoading ? "Loading roles..." : "Select role"}
              </option>
              {parentRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.roleName}
                </option>
              ))}
            </select>
            {rolesError && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{rolesError}</p>}
          </Field>

          {hasSubRoles && (
            <Field label="Sub-role">
              <select
                value={subRoleId}
                onChange={(e) => setSubRoleId(e.target.value ? Number(e.target.value) : "")}
                className="cursor-pointer w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
                style={{ borderColor: errors.roleId ? "#f0997b" : "#e2ddd5" }}
              >
                <option value="" disabled>
                  Select sub-role
                </option>
                {childRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.roleName}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {errors.roleId && <p className="text-[11px] font-medium text-[#D4300F] -mt-2">{errors.roleId}</p>}

          <Field label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="cursor-pointer w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border border-[#e2ddd5] rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Access start date">
              <input
                type="date"
                value={accessStartDate}
                onChange={(e) => setAccessStartDate(e.target.value)}
                className="w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border border-[#e2ddd5] rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
              />
            </Field>
            <Field label="Access end date">
              <input
                type="date"
                value={accessEndDate}
                onChange={(e) => setAccessEndDate(e.target.value)}
                className="w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border border-[#e2ddd5] rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
              />
            </Field>
          </div>

          {serverError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
              <p className="text-red-500 text-xs font-medium">{serverError}</p>
            </div>
          )}

          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer flex-1 py-2.5 rounded-xl text-sm font-bold text-[#4a4640] border border-[#e2ddd5] hover:bg-[#f7f5f1] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: ACCENT }}
            >
              {loading ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}