// src/pages/Roles/AllRoles.tsx

import { useState } from "react";
import { useGetRolesQuery, useDeleteRoleMutation, type RoleRecord } from "./role.api";
import { extractApiError } from "../../../lib/apiClient";
import RoleModal from "./RoleModal";
import DataTable, { type DataTableColumn } from "../../../components/common/DataTable";

const ACCENT = "#D4300F";

export default function AllRoles() {
  const {
    data: rolesData,
    isLoading: rolesLoading,
    isFetching: rolesFetching,
    error: rolesQueryError,
  } = useGetRolesQuery();

  const roles = rolesData?.all ?? [];
  const loading = rolesLoading || rolesFetching;
  const error = rolesQueryError
    ? (rolesQueryError as { message?: string }).message ?? "Something went wrong."
    : "";

  // Modal state — null role = "Add" mode, a record = "Edit" mode.
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleRecord | null>(null);

  const openAddModal = () => {
    setEditingRole(null);
    setModalOpen(true);
  };

  const openEditModal = (role: RoleRecord) => {
    setEditingRole(role);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingRole(null);
  };

  const [deleteRole] = useDeleteRoleMutation();

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  const handleDelete = async (id: number) => {
    setActionError("");
    setDeletingId(id);
    try {
      await deleteRole(id).unwrap();
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setDeletingId(null);
    }
  };

  const columns: DataTableColumn<RoleRecord>[] = [
    { header: "Role", render: (r) => <span className="font-semibold text-[#1c1a17]">{r.roleName}</span> },
    {
      header: "Parent",
      render: (r) => (
        <span className="text-[#7a7670]">
          {r.parentRole ? r.parentRole.roleName : <span className="text-[#c0bab0]">—</span>}
        </span>
      ),
    },
    { header: "Permissions", render: (r) => <span className="text-[#7a7670]">{r.permissionIds?.length ?? 0} assigned</span> },
    {
      header: "Created",
      render: (r) => (
        <span className="text-[#a39e96]">
          {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
        </span>
      ),
    },
    {
      header: "",
      align: "right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openEditModal(r)}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(r.id)}
            disabled={deletingId === r.id}
            className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deletingId === r.id ? "..." : "Delete"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-[1000px]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[18px] font-black text-[#1c1a17]">Roles</h1>
          <p className="text-[12px] text-[#a39e96] mt-0.5">
            Create roles, optionally nest them under a parent role, and assign permissions.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="cursor-pointer text-[12px] font-bold text-white px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          + Add role
        </button>
      </div>

      {actionError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
          <p className="text-red-500 text-xs font-medium">{actionError}</p>
        </div>
      )}

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          rows={roles}
          rowKey={(r) => r.id}
          loading={loading}
          error={error}
          loadingMessage="Loading roles..."
          emptyMessage="No roles created yet."
        />
      </div>

      {modalOpen && (
        <RoleModal
          key={editingRole ? `edit-${editingRole.id}` : "add"}
          open={modalOpen}
          onClose={closeModal}
          role={editingRole}
        />
      )}
    </div>
  );
}