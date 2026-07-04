// src/pages/Roles/RoleModal.tsx

import { useEffect, useRef, useState } from "react";
import {
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useGetRolesQuery,
  type RoleRecord,
} from "./role.api";
import { useGetPermissionsQuery } from "../Permission/permission.api";
import { extractApiError } from "../../../lib/apiClient";

const ACCENT = "#D4300F";

interface FieldErrors {
  roleName?: string;
}

export default function RoleModal({
  open,
  onClose,
  role,
}: {
  open: boolean;
  onClose: () => void;
  // Present -> edit mode. Absent/null -> create mode.
  role?: RoleRecord | null;
}) {
  const isEditMode = !!role;

  const { data: rolesData } = useGetRolesQuery();
  const topLevelRoles = (rolesData?.all ?? []).filter((r) => r.parentRoleId === null);

  const { data: permsData } = useGetPermissionsQuery();
  const permissionsByModule = permsData?.grouped ?? {};
  const moduleNames = Object.keys(permissionsByModule).sort();

  // Initialized directly from props (lazy initializer) — the parent only
  // renders this component while `open` is true and remounts it
  // (key={editingRole?.id ?? "add"}) whenever the target record changes,
  // so a fresh mount is all that's needed to reset/pre-fill the form.
  const [roleName, setRoleName] = useState(role ? role.roleName : "");
  const [parentRoleId, setParentRoleId] = useState<number | "">(role ? role.parentRoleId ?? "" : "");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<number>>(
    new Set(role?.permissionIds ?? [])
  );

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const [createRole, { isLoading: creating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: updating }] = useUpdateRoleMutation();
  const saving = creating || updating;

  const resetForm = () => {
    setRoleName("");
    setParentRoleId("");
    setSelectedPermissionIds(new Set());
    setErrors({});
    setServerError("");
  };

  // Autofocus the name field on mount.
  useEffect(() => {
    const focusTimer = setTimeout(() => nameRef.current?.focus(), 50);
    return () => clearTimeout(focusTimer);
  }, []);

  if (!open) return null;

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const togglePermission = (id: number) => {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (roleName.trim().length < 2) next.roleName = "Role name must be at least 2 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    try {
      if (isEditMode && role) {
        // Edit mode — only name + permissions update (backend's
        // updateRoleSchema doesn't accept parentRoleId).
        await updateRole({
          id: role.id,
          input: {
            roleName: roleName.trim(),
            permissionIds: Array.from(selectedPermissionIds),
          },
        }).unwrap();
      } else {
        await createRole({
          roleName: roleName.trim(),
          parentRoleId: parentRoleId || undefined,
          permissionIds: Array.from(selectedPermissionIds),
        }).unwrap();
      }
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
      <div className="w-full max-w-[560px] bg-white border border-[#e8e4dc] rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h2 className="text-[#1c1a17] text-lg font-black">{isEditMode ? "Edit role" : "Add role"}</h2>
            <p className="text-[#a39e96] text-xs mt-1">
              {isEditMode ? `Update details for ${role?.roleName}` : "Create a role and assign permissions"}
            </p>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1.5">
                Role name
              </label>
              <input
                ref={nameRef}
                type="text"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="e.g. SEO Editor"
                className="w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
                style={{
                  borderColor: errors.roleName ? "#f0997b" : "#e2ddd5",
                  boxShadow: errors.roleName ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
                }}
              />
              {errors.roleName && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.roleName}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1.5">
                Parent role{" "}
                <span className="text-[#c0bab0] font-medium normal-case">
                  {isEditMode ? "(cannot be changed)" : "(optional)"}
                </span>
              </label>
              <select
                value={parentRoleId}
                onChange={(e) => setParentRoleId(e.target.value ? Number(e.target.value) : "")}
                disabled={isEditMode}
                className="cursor-pointer w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border border-[#e2ddd5] rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white disabled:opacity-60"
              >
                <option value="">None — top-level role</option>
                {topLevelRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.roleName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-2">
              Permissions
            </label>
            {moduleNames.length === 0 ? (
              <p className="text-[12px] text-[#a39e96]">
                No permissions exist yet — create some on the Permissions page first.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-[240px] overflow-y-auto pr-1">
                {moduleNames.map((mod) => (
                  <div key={mod} className="border border-[#e8e4dc] rounded-lg px-3 py-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#7a7670] mb-1.5">{mod}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                      {permissionsByModule[mod].map((p) => (
                        <label key={p.id} className="flex items-center gap-1.5 cursor-pointer text-[12px] text-[#4a4640]">
                          <input
                            type="checkbox"
                            checked={selectedPermissionIds.has(p.id)}
                            onChange={() => togglePermission(p.id)}
                            className="cursor-pointer accent-[#D4300F]"
                          />
                          {p.action}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
              disabled={saving}
              className="cursor-pointer flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: ACCENT }}
            >
              {saving ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Saving...
                </>
              ) : isEditMode ? (
                "Save changes"
              ) : (
                "Create role"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}