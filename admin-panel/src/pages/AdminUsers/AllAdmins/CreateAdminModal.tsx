// src/pages/AdminUsers/CreateAdminModal.tsx

import { useState, useRef, useEffect } from "react";
import { useCreateAdminMutation, type AdminRecord } from "./admin.api";
import { useGetRolesQuery } from "../../AdminUsers/Roles/role.api";
import { extractApiError } from "../../../lib/apiClient";

const ACCENT = "#D4300F";

interface FieldErrors {
  name?: string;
  email?: string;
  mobile?: string;
  password?: string;
  roleId?: string;
}

function toDateInputValue(d: Date) {
  return d.toISOString().split("T")[0];
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
  inputRef,
  rightSlot,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  error?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  rightSlot?: React.ReactNode;
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
          ref={inputRef}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm font-medium text-[#1c1a17] outline-none placeholder:text-[#c0bab0]"
        />
        {rightSlot}
      </div>
      {error && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{error}</p>}
    </div>
  );
}

function computeDefaultAccessWindow() {
  const today = new Date();
  const twoYearsLater = new Date(today);
  twoYearsLater.setFullYear(twoYearsLater.getFullYear() + 2);
  return {
    start: toDateInputValue(today),
    end: toDateInputValue(twoYearsLater),
  };
}

export default function CreateAdminModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (admin: AdminRecord) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [parentRoleId, setParentRoleId] = useState<number | "">("");
  const [subRoleId, setSubRoleId] = useState<number | "">("");
  const {
    data: rolesData,
    isLoading: rolesLoading,
    isFetching: rolesFetching,
    error: rolesQueryError,
  } = useGetRolesQuery(undefined, { skip: !open });
  const parentRoles = rolesData?.parentRoles ?? [];
  const childRolesByParent = rolesData?.childRolesByParent ?? {};
  const rolesLoadingCombined = rolesLoading || rolesFetching;
  const rolesError = rolesQueryError
    ? (rolesQueryError as { message?: string }).message ?? "Failed to load roles."
    : "";

  const [status, setStatus] = useState<"active" | "inactive" | "suspended">("active");
  const [accessStartDate, setAccessStartDate] = useState("");
  const [accessEndDate, setAccessEndDate] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const [createAdmin, { isLoading: loading }] = useCreateAdminMutation();
  useEffect(() => {
    if (!open) return;

    const focusTimer = setTimeout(() => nameRef.current?.focus(), 50);
    let cancelled = false;

    Promise.resolve().then(() => {
      if (cancelled) return;
      const { start, end } = computeDefaultAccessWindow();
      setAccessStartDate(start);
      setAccessEndDate(end);
    });

    return () => {
      cancelled = true;
      clearTimeout(focusTimer);
    };
  }, [open]);

  if (!open) return null;

  const childRoles = parentRoleId ? childRolesByParent[String(parentRoleId)] ?? [] : [];
  const hasSubRoles = childRoles.length > 0;
  const effectiveRoleId = hasSubRoles ? subRoleId : parentRoleId;

  const resetForm = () => {
    setName("");
    setEmail("");
    setMobile("");
    setPassword("");
    setShowPassword(false);
    setParentRoleId("");
    setSubRoleId("");
    setStatus("active");
    setAccessStartDate("");
    setAccessEndDate("");
    setErrors({});
    setServerError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

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
    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      next.password = "Min 8 chars, with uppercase, lowercase and a number.";
    }
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
      const created = await createAdmin({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        mobile: mobile.trim(),
        password,
        roleId: effectiveRoleId,
        status,
        accessStartDate: accessStartDate || undefined,
        accessEndDate: accessEndDate || undefined,
      }).unwrap();
      onCreate(created);
      resetForm();
      onClose();
    } catch (err) {
      setServerError(extractApiError(err));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="w-full max-w-[460px] bg-white border border-[#e8e4dc] rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h2 className="text-[#1c1a17] text-lg font-black">Add admin</h2>
            <p className="text-[#a39e96] text-xs mt-1">Create a new admin account and set their access</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
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
            <TextField value={name} onChange={setName} placeholder="Mahender Singh" error={errors.name} inputRef={nameRef} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <TextField value={email} onChange={setEmail} placeholder="admin@timesauto.in" type="email" error={errors.email} />
            </Field>
            <Field label="Mobile">
              <TextField value={mobile} onChange={setMobile} placeholder="9876543210" error={errors.mobile} />
            </Field>
          </div>

          <Field label="Password">
            <TextField
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              type={showPassword ? "text" : "password"}
              error={errors.password}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="Toggle password"
                  className="cursor-pointer text-[#c0bab0] hover:text-[#7a7670] transition-colors"
                >
                  {showPassword ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              }
            />
          </Field>

          <Field label="Role">
            <select
              value={parentRoleId}
              onChange={(e) => handleParentRoleChange(e.target.value)}
              disabled={rolesLoadingCombined}
              className="cursor-pointer w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white disabled:opacity-60"
              style={{ borderColor: errors.roleId ? "#f0997b" : "#e2ddd5" }}
            >
              <option value="" disabled>
                {rolesLoadingCombined ? "Loading roles..." : "Select role"}
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
              onClick={handleClose}
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
              {loading ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Creating...
                </>
              ) : (
                "Create admin"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}