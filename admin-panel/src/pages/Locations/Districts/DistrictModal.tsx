// src/pages/Locations/DistrictModal.tsx

import { useEffect, useRef, useState } from "react";
import {
  useCreateDistrictMutation,
  useUpdateDistrictMutation,
  type DistrictRecord,
} from "./district.api";
import { useGetStateOptionsQuery } from "../States/state.api";
import { useGetCountryOptionsQuery } from "../Countries/country.api";
import { extractApiError } from "../../../lib/apiClient";

const ACCENT = "#D4300F";

interface FieldErrors {
  countryId?: string;
  stateId?: string;
  name?: string;
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
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
        style={{
          borderColor: error ? "#f0997b" : "#e2ddd5",
          boxShadow: error ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
        }}
      />
      {error && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{error}</p>}
    </div>
  );
}

export default function DistrictModal({
  open,
  onClose,
  district,
}: {
  open: boolean;
  onClose: () => void;
  // Present -> edit mode. Absent/null -> create mode.
  district?: DistrictRecord | null;
}) {
  const isEditMode = !!district;

  const { data: countries = [] } = useGetCountryOptionsQuery();

  const [countryId, setCountryId] = useState<number | "">(
    district?.state?.country?.id ?? ""
  );
  const [stateId, setStateId] = useState<number | "">(district ? district.stateId : "");
  const [name, setName] = useState(district ? district.name : "");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  // State dropdown scoped to the chosen country.
  const { data: states = [] } = useGetStateOptionsQuery({ countryId: countryId || undefined });

  const [createDistrict, { isLoading: creating }] = useCreateDistrictMutation();
  const [updateDistrict, { isLoading: updating }] = useUpdateDistrictMutation();
  const saving = creating || updating;

  const resetForm = () => {
    setCountryId("");
    setStateId("");
    setName("");
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
    if (!stateId) next.stateId = "Please select a state.";
    if (name.trim().length < 2) next.name = "Name must be at least 2 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    const payload = { stateId: Number(stateId), name: name.trim() };

    try {
      if (isEditMode && district) {
        await updateDistrict({ id: district.id, input: payload }).unwrap();
      } else {
        await createDistrict(payload).unwrap();
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
              {isEditMode ? "Edit district" : "Add district"}
            </h2>
            <p className="text-[#a39e96] text-xs mt-1">
              {isEditMode
                ? `Update details for ${district?.name}`
                : "Add a new district linked to a state"}
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
            <Field label="Country" required>
              <select
                value={countryId}
                onChange={(e) => {
                  setCountryId(e.target.value ? Number(e.target.value) : "");
                  setStateId(""); // country changed — force re-pick of state
                }}
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

            <Field label="State" required>
              <select
                value={stateId}
                onChange={(e) => setStateId(e.target.value ? Number(e.target.value) : "")}
                disabled={!countryId}
                className="cursor-pointer w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white disabled:opacity-60"
                style={{
                  borderColor: errors.stateId ? "#f0997b" : "#e2ddd5",
                  boxShadow: errors.stateId ? "0 0 0 2px rgba(216,90,48,0.1)" : "none",
                }}
              >
                <option value="">{countryId ? "Select state" : "Pick a country first"}</option>
                {states.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.stateId && (
                <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.stateId}</p>
              )}
            </Field>
          </div>

          <Field label="Name" required>
            <TextField value={name} onChange={setName} placeholder="e.g. Pune" error={errors.name} inputRef={nameRef} />
          </Field>

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
                "Create district"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}