// src/pages/Locations/CountryModal.tsx
import { useEffect, useRef, useState } from "react";
import {
  useCreateCountryMutation,
  useUpdateCountryMutation,
  type CountryRecord,
  type DistanceUnit,
  type FuelUnit,
} from "./country.api";
import { extractApiError } from "../../../lib/apiClient";

const ACCENT = "#D4300F";

interface FieldErrors {
  name?: string;
  code?: string;
  currency?: string;
  currencySymbol?: string;
  currencyCode?: string;
  exchangeRate?: string;
  distanceUnit?: string;
  fuelUnit?: string;
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

export default function CountryModal({
  open,
  onClose,
  country,
}: {
  open: boolean;
  onClose: () => void;
  // Present -> edit mode. Absent/null -> create mode.
  country?: CountryRecord | null;
}) {
  const isEditMode = !!country;

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [currency, setCurrency] = useState("");
  const [currencySymbol, setCurrencySymbol] = useState("");
  const [currencyCode, setCurrencyCode] = useState("");
  const [exchangeRate, setExchangeRate] = useState("");
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit | "">("");
  const [fuelUnit, setFuelUnit] = useState<FuelUnit | "">("");
  const [isActive, setIsActive] = useState(true);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const [createCountry, { isLoading: creating }] = useCreateCountryMutation();
  const [updateCountry, { isLoading: updating }] = useUpdateCountryMutation();
  const saving = creating || updating;

  const resetForm = () => {
    setName("");
    setCode("");
    setCurrency("");
    setCurrencySymbol("");
    setCurrencyCode("");
    setExchangeRate("");
    setDistanceUnit("");
    setFuelUnit("");
    setIsActive(true);
    setErrors({});
    setServerError("");
  };

  // Pre-fill the form when opening in edit mode, or reset it for a
  // fresh "Add country" — and focus the name field either way.
  useEffect(() => {
    if (!open) return;

    if (country) {
      setName(country.name);
      setCode(country.code);
      setCurrency(country.currency ?? "");
      setCurrencySymbol(country.currencySymbol ?? "");
      setCurrencyCode(country.currencyCode ?? "");
      setExchangeRate(country.exchangeRate ?? "");
      setDistanceUnit(country.distanceUnit ?? "");
      setFuelUnit(country.fuelUnit ?? "");
      setIsActive(country.isActive);
    } else {
      resetForm();
    }
    setErrors({});
    setServerError("");

    const focusTimer = setTimeout(() => nameRef.current?.focus(), 50);
    return () => clearTimeout(focusTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, country]);

  if (!open) return null;

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};

    if (name.trim().length < 2) next.name = "Name must be at least 2 characters.";
    if (code.trim().length < 2) next.code = "Code must be at least 2 characters (e.g. IN, US).";

    // Everything below is only mandatory when ADDING a new country.
    // Editing stays a partial update — an admin fixing the name
    // shouldn't be forced to re-enter already-saved currency/unit data.
    if (!isEditMode) {
      if (!currency.trim()) next.currency = "Currency name is required.";
      if (!currencySymbol.trim()) next.currencySymbol = "Currency symbol is required.";
      if (!currencyCode.trim()) {
        next.currencyCode = "Currency code is required.";
      } else if (!/^[A-Z]{3}$/.test(currencyCode.trim())) {
        next.currencyCode = "Currency code must be 3 letters (e.g. INR, USD).";
      }
      if (!exchangeRate.trim()) {
        next.exchangeRate = "Exchange rate is required.";
      } else if (isNaN(Number(exchangeRate)) || Number(exchangeRate) <= 0) {
        next.exchangeRate = "Exchange rate must be a positive number.";
      }
      if (!distanceUnit) next.distanceUnit = "Please select a distance unit.";
      if (!fuelUnit) next.fuelUnit = "Please select a fuel unit.";
    } else {
      // Edit mode — same lighter checks the old form had.
      if (currencyCode.trim() && !/^[A-Z]{3}$/.test(currencyCode.trim())) {
        next.currencyCode = "Currency code must be 3 letters (e.g. INR, USD).";
      }
      if (exchangeRate.trim() && (isNaN(Number(exchangeRate)) || Number(exchangeRate) <= 0)) {
        next.exchangeRate = "Exchange rate must be a positive number.";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    const payload = {
      name: name.trim(),
      code: code.trim(),
      currency: currency.trim() || undefined,
      currencySymbol: currencySymbol.trim() || undefined,
      currencyCode: currencyCode.trim() || undefined,
      exchangeRate: exchangeRate.trim() ? Number(exchangeRate) : undefined,
      distanceUnit: distanceUnit || undefined,
      fuelUnit: fuelUnit || undefined,
      isActive,
    };

    try {
      if (isEditMode && country) {
        await updateCountry({ id: country.id, input: payload }).unwrap();
      } else {
        await createCountry(payload).unwrap();
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
              {isEditMode ? "Edit country" : "Add country"}
            </h2>
            <p className="text-[#a39e96] text-xs mt-1">
              {isEditMode
                ? `Update details for ${country?.name}`
                : "Add a new country and its currency/unit settings"}
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
            <Field label="Name" required>
              <TextField value={name} onChange={setName} placeholder="e.g. India" error={errors.name} inputRef={nameRef} />
            </Field>
            <Field label="Code" required>
              <TextField
                value={code}
                onChange={setCode}
                placeholder="e.g. IN"
                error={errors.code}
                uppercase
                maxLength={5}
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Currency" required={!isEditMode}>
              <TextField
                value={currency}
                onChange={setCurrency}
                placeholder="Indian Rupee"
                error={errors.currency}
              />
            </Field>
            <Field label="Symbol" required={!isEditMode}>
              <TextField
                value={currencySymbol}
                onChange={setCurrencySymbol}
                placeholder="₹"
                error={errors.currencySymbol}
                maxLength={10}
              />
            </Field>
            <Field label="Currency code" required={!isEditMode}>
              <TextField
                value={currencyCode}
                onChange={setCurrencyCode}
                placeholder="INR"
                error={errors.currencyCode}
                uppercase
                maxLength={3}
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Exchange rate" required={!isEditMode}>
              <input
                type="number"
                step="any"
                min="0"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                placeholder="e.g. 83.25"
                className="w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
                style={{ borderColor: errors.exchangeRate ? "#f0997b" : "#e2ddd5" }}
              />
              {errors.exchangeRate && (
                <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.exchangeRate}</p>
              )}
            </Field>

            <Field label="Distance unit" required={!isEditMode}>
              <select
                value={distanceUnit}
                onChange={(e) => setDistanceUnit(e.target.value as DistanceUnit | "")}
                className="cursor-pointer w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
                style={{ borderColor: errors.distanceUnit ? "#f0997b" : "#e2ddd5" }}
              >
                <option value="">Select</option>
                <option value="KM">KM</option>
                <option value="Miles">Miles</option>
              </select>
              {errors.distanceUnit && (
                <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.distanceUnit}</p>
              )}
            </Field>

            <Field label="Fuel unit" required={!isEditMode}>
              <select
                value={fuelUnit}
                onChange={(e) => setFuelUnit(e.target.value as FuelUnit | "")}
                className="cursor-pointer w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white"
                style={{ borderColor: errors.fuelUnit ? "#f0997b" : "#e2ddd5" }}
              >
                <option value="">Select</option>
                <option value="Liter">Liter</option>
                <option value="Gallon">Gallon</option>
              </select>
              {errors.fuelUnit && (
                <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.fuelUnit}</p>
              )}
            </Field>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer text-[12px] font-semibold text-[#4a4640] pt-1">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="cursor-pointer accent-[#D4300F]"
            />
            Active
          </label>

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
                "Create country"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}