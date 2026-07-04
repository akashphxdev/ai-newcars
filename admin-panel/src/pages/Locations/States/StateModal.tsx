// src/pages/Locations/StateModal.tsx

import { useEffect, useRef, useState } from "react";
import {
  useCreateStateMutation,
  useUpdateStateMutation,
  type StateRecord,
} from "./state.api";
import { useGetCountriesQuery } from "../Countries/country.api";
import { extractApiError } from "../../../lib/apiClient";

const ACCENT = "#D4300F";

interface FieldErrors {
  countryId?: string;
  name?: string;
  code?: string;
}

function RequiredMark() {
  return <span className="text-[#D4300F]">*</span>;
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1.5">
        {label} {required && <RequiredMark />}
      </label>
      {children}
    </div>
  );
}

function TextField({
  value,
  onChange,
  placeholder,
  error,
  inputRef,
  uppercase,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  uppercase?: boolean;
  maxLength?: number;
}) {
  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(uppercase ? e.target.value.toUpperCase() : e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white ${
          uppercase ? "uppercase" : ""
        }`}
        style={{
          borderColor: error ? "#f0997b" : "#e2ddd5",
          boxShadow: error ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
        }}
      />
      {error && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{error}</p>}
    </div>
  );
}

export default function StateModal({
  open,
  onClose,
  state,
}: {
  open: boolean;
  onClose: () => void;
  // Present -> edit mode. Absent/null -> create mode.
  state?: StateRecord | null;
}) {
  const isEditMode = !!state;

  // NOTE: backend caps `limit` at 100 (see country.validation.ts). Same
  // caveat as the filter dropdown on AllStates.tsx.
  const { data: countriesData } = useGetCountriesQuery({ limit: 100, sortBy: "name", sortOrder: "asc" });
  const countries = countriesData?.data ?? [];

  const [countryId, setCountryId] = useState<number | "">(state ? state.countryId : "");
  const [name, setName] = useState(state ? state.name : "");
  const [code, setCode] = useState(state ? state.code ?? "" : "");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const [createState, { isLoading: creating }] = useCreateStateMutation();
  const [updateState, { isLoading: updating }] = useUpdateStateMutation();
  const saving = creating || updating;

  const resetForm = () => {
    setCountryId("");
    setName("");
    setCode("");
    setErrors({});
    setServerError("");
  };

  // Autofocus the name field on mount. This is a genuine "sync with an
  // external system" (the DOM) — not a setState call — so it belongs in
  // an effect.
  useEffect(() => {
    const focusTimer = setTimeout(() => nameRef.current?.focus(), 50);
    return () => clearTimeout(focusTimer);
  }, []);

  if (!open) return null;

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!countryId) next.countryId = "Please select a country.";
    if (name.trim().length < 2) next.name = "Name must be at least 2 characters.";
    if (!code.trim()) next.code = "Code is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    const payload = {
      countryId: Number(countryId),
      name: name.trim(),
      code: code.trim(),
    };

    try {
      if (isEditMode && state) {
        await updateState({ id: state.id, input: payload }).unwrap();
      } else {
        await createState(payload).unwrap();
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
      <div className="w-full max-w-[480px] bg-white border border-[#e8e4dc] rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h2 className="text-[#1c1a17] text-lg font-black">
              {isEditMode ? "Edit state" : "Add state"}
            </h2>
            <p className="text-[#a39e96] text-xs mt-1">
              {isEditMode
                ? `Update details for ${state?.name}`
                : "Add a new state linked to a country"}
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
          <Field label="Country" required>
            <select
              value={countryId}
              onChange={(e) => setCountryId(e.target.value ? Number(e.target.value) : "")}
              className="cursor-pointer w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
              style={{
                borderColor: errors.countryId ? "#f0997b" : "#e2ddd5",
                boxShadow: errors.countryId ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
              }}
            >
              <option value="">Select country</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.countryId && (
              <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.countryId}</p>
            )}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" required>
              <TextField value={name} onChange={setName} placeholder="e.g. Maharashtra" error={errors.name} inputRef={nameRef} />
            </Field>
            <Field label="Code" required>
              <TextField
                value={code}
                onChange={setCode}
                placeholder="e.g. MH"
                error={errors.code}
                uppercase
                maxLength={10}
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
                "Create state"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}