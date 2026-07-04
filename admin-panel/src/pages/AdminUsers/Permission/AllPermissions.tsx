// src/pages/Permissions/AllPermissions.tsx

import { useState } from "react";
import { useGetPermissionsQuery, useDeletePermissionMutation } from "./permission.api";
import { extractApiError } from "../../../lib/apiClient";
import PermissionModal from "./PermissionModal";

const ACCENT = "#D4300F";

export default function AllPermissions() {
  const {
    data: permsData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetPermissionsQuery();

  const grouped = permsData?.grouped ?? {};
  const loading = isLoading || isFetching;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";

  const [modalOpen, setModalOpen] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  const [deletePermission] = useDeletePermissionMutation();

  const handleDelete = async (id: number) => {
    setActionError("");
    setDeletingId(id);
    try {
      await deletePermission(id).unwrap();
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setDeletingId(null);
    }
  };

  const moduleNames = Object.keys(grouped).sort();

  return (
    <div className="space-y-5 max-w-[900px]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[18px] font-black text-[#1c1a17]">Permissions</h1>
          <p className="text-[12px] text-[#a39e96] mt-0.5">
            Define module + action permissions. Roles are built by assigning these to a role.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="cursor-pointer text-[12px] font-bold text-white px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          + Add permission
        </button>
      </div>

      {actionError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
          <p className="text-red-500 text-xs font-medium">{actionError}</p>
        </div>
      )}

      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        {loading && <p className="px-4 py-10 text-center text-[#a39e96] text-[12px]">Loading permissions...</p>}
        {!loading && error && (
          <p className="px-4 py-10 text-center text-[#D4300F] text-[12px] font-medium">{error}</p>
        )}
        {!loading && !error && moduleNames.length === 0 && (
          <p className="px-4 py-10 text-center text-[#a39e96] text-[12px]">
            No permissions yet. Click "+ Add permission" to get started.
          </p>
        )}

        {!loading &&
          !error &&
          moduleNames.map((mod, idx) => (
            <div key={mod} className={idx > 0 ? "border-t border-[#f0ece6]" : ""}>
              <div className="px-4 py-2.5 bg-[#f7f5f1]">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#7a7670]">{mod}</p>
              </div>
              <div className="px-4 py-3 flex flex-wrap gap-2">
                {grouped[mod].map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-[#eef6ff] text-[#1d72c4] px-2.5 py-1 rounded-full"
                  >
                    {p.action}
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={deletingId === p.id}
                      aria-label={`Delete ${p.permissionKey}`}
                      className="cursor-pointer text-[#1d72c4]/60 hover:text-[#D4300F] transition-colors disabled:opacity-50"
                    >
                      {deletingId === p.id ? "…" : "×"}
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
      </div>

      <PermissionModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}