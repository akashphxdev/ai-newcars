// src/pages/Permission/PermissionModal.tsx

import { useEffect, useRef, useState } from "react";
import { useCreatePermissionMutation } from "./permission.api";
import { extractApiError } from "../../../lib/apiClient";

const ACCENT = "#D4300F";
const ACTIONS = ["view", "create", "update", "delete"] as const;

interface FieldErrors {
  module?: string;
}

export default function PermissionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [module, setModule] = useState("");
  const [action, setAction] = useState<(typeof ACTIONS)[number]>("view");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const moduleRef = useRef<HTMLInputElement>(null);

  const [createPermission, { isLoading: creating }] = useCreatePermissionMutation();

  const resetForm = () => {
    setModule("");
    setAction("view");
    setErrors({});
    setServerError("");
  };

  // Autofocus the module field on mount.
  useEffect(() => {
    const focusTimer = setTimeout(() => moduleRef.current?.focus(), 50);
    return () => clearTimeout(focusTimer);
  }, []);

  if (!open) return null;

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    const trimmed = module.trim();
    if (trimmed.length < 2) {
      next.module = "Module must be at least 2 characters (e.g. leads, admins).";
    } else if (!/^[a-z_]+$/.test(trimmed.toLowerCase())) {
      next.module = "Module must be lowercase letters/underscores only.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    try {
      await createPermission({ module: module.trim().toLowerCase(), action }).unwrap();
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
      <div className="w-full max-w-[440px] bg-white border border-[#e8e4dc] rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h2 className="text-[#1c1a17] text-lg font-black">Add permission</h2>
            <p className="text-[#a39e96] text-xs mt-1">Define a module + action pair.</p>
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
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1.5">
              Module
            </label>
            <input
              ref={moduleRef}
              type="text"
              value={module}
              onChange={(e) => setModule(e.target.value)}
              placeholder="e.g. leads, admins, stories"
              className="w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
              style={{
                borderColor: errors.module ? "#f0997b" : "#e2ddd5",
                boxShadow: errors.module ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
              }}
            />
            {errors.module && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.module}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1.5">
              Action
            </label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value as typeof action)}
              className="cursor-pointer w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border border-[#e2ddd5] rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
            >
              {ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
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
              disabled={creating}
              className="cursor-pointer flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: ACCENT }}
            >
              {creating ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Adding...
                </>
              ) : (
                "Add permission"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}