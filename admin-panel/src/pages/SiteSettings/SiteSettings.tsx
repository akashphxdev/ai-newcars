// src/pages/Settings/Site/SiteSettings.tsx

import { useEffect, useState } from "react";
import {
  useGetSiteSettingsQuery,
  useUpsertSiteSettingsMutation,
  type SiteSettingRecord,
  type UpsertSiteSettingInput,
} from "./siteSetting.api";
import { extractApiError } from "./../../lib/apiClient";

const ACCENT = "#D4300F";
const CONFIRM_SECONDS = 30;
const MIN_LINES = 3;

const PHONE_REGEX = /^\+?[1-9]\d{6,14}$/;
const isValidPhone = (v: string) => !v || PHONE_REGEX.test(v.replace(/[\s\-().]/g, ""));
const lineCount = (v: string) => v.split("\n").map((l) => l.trim()).filter(Boolean).length;

// The form always holds plain strings for controlled inputs (never
// null) — null only appears in the outgoing payload to mean "clear
// this field", built from "" in handleSave.
type SiteSettingFormState = {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  supportEmail: string;
  contactEmail: string;
  contactNumber: string;
  whatsappNumber: string;
  address: string;
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  youtubeUrl: string;
  linkedinUrl: string;
};

const EMPTY_FORM: SiteSettingFormState = {
  maintenanceMode: false,
  maintenanceMessage: "",
  supportEmail: "",
  contactEmail: "",
  contactNumber: "",
  whatsappNumber: "",
  address: "",
  facebookUrl: "",
  instagramUrl: "",
  twitterUrl: "",
  youtubeUrl: "",
  linkedinUrl: "",
};

const inputClass =
  "w-full text-[12.5px] border border-[#e8e4dc] rounded-lg px-3 py-2 outline-none focus:border-[#D4300F] disabled:opacity-50";
const inputErrorClass = inputClass.replace("border-[#e8e4dc]", "border-red-300").replace("focus:border-[#D4300F]", "focus:border-red-400");
const labelClass = "text-[11px] font-semibold text-[#7a7670] block mb-1.5";
const btnPrimary = "text-[13px] font-bold text-white px-4 py-2 rounded-lg disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed";
const btnSecondary = "text-[13px] font-semibold text-[#4a4640] px-4 py-2 rounded-lg border border-[#e8e4dc] cursor-pointer";

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative w-9 h-5 rounded-full transition-colors shrink-0 cursor-pointer"
      style={{ background: checked ? ACCENT : "#e2ddd4" }}
    >
      <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: checked ? "18px" : "2px" }} />
    </button>
  );
}

function Field({ label, error, children }: { label: string; error?: string | null; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
      {error && <p className="text-[11px] font-semibold text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function ModalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-[fadeIn_.15s_ease-out]">
        {children}
      </div>
    </div>
  );
}

function ModalActions({ onCancel, onConfirm, confirmLabel, confirmDisabled }: {
  onCancel: () => void; onConfirm: () => void; confirmLabel: string; confirmDisabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#faf8f5] border-t border-[#f0ece6]">
      <button type="button" onClick={onCancel} className={btnSecondary}>Cancel</button>
      <button type="button" onClick={onConfirm} disabled={confirmDisabled} className={btnPrimary} style={{ background: ACCENT }}>
        {confirmLabel}
      </button>
    </div>
  );
}

type MaintStep = "none" | "confirm" | "message";

export default function SiteSettings() {
  const { data, isLoading, error: queryError } = useGetSiteSettingsQuery();
  const [upsert, { isLoading: isSaving }] = useUpsertSiteSettingsMutation();

  const [form, setForm] = useState<SiteSettingFormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [step, setStep] = useState<MaintStep>("none");
  const [countdown, setCountdown] = useState(CONFIRM_SECONDS);
  const [draftMessage, setDraftMessage] = useState("");
  const [editingMessage, setEditingMessage] = useState(false); // editing an already-on message vs. first-time turn-on

  // Sync form state from the query result during render (not in a
  // useEffect) per React's "adjusting state when a prop changes"
  // pattern — avoids an extra commit + cascading re-render.
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [loadedFrom, setLoadedFrom] = useState<SiteSettingRecord | null>(null);
  if (data && data !== loadedFrom) {
    setLoadedFrom(data);
    setForm({
      maintenanceMode: data.maintenanceMode,
      maintenanceMessage: data.maintenanceMessage ?? "",
      supportEmail: data.supportEmail ?? "",
      contactEmail: data.contactEmail ?? "",
      contactNumber: data.contactNumber ?? "",
      whatsappNumber: data.whatsappNumber ?? "",
      address: data.address ?? "",
      facebookUrl: data.facebookUrl ?? "",
      instagramUrl: data.instagramUrl ?? "",
      twitterUrl: data.twitterUrl ?? "",
      youtubeUrl: data.youtubeUrl ?? "",
      linkedinUrl: data.linkedinUrl ?? "",
    });
  }

  const update = (patch: Partial<SiteSettingFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setSaved(false);
  };

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(t);
  }, [saved]);

  useEffect(() => {
    if (step !== "confirm" || countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [step, countdown]);

  function handleToggleMaintenance(next: boolean) {
    if (!next) {
      update({ maintenanceMode: false });
      return;
    }
    setCountdown(CONFIRM_SECONDS);
    setDraftMessage("");
    setEditingMessage(false);
    setStep("confirm");
  }

  function openEditMessage() {
    setDraftMessage(form.maintenanceMessage || "");
    setEditingMessage(true);
    setStep("message");
  }

  function handleConfirmMessage() {
    if (lineCount(draftMessage) < MIN_LINES) return;
    update({ maintenanceMode: true, maintenanceMessage: draftMessage.trim() });
    setStep("none");
  }

  const phoneErrors = {
    contactNumber: !isValidPhone(form.contactNumber || "") ? "Enter a valid phone number (e.g. +91 98765 43210)" : null,
    whatsappNumber: !isValidPhone(form.whatsappNumber || "") ? "Enter a valid phone number (e.g. +91 98765 43210)" : null,
  };
  const hasFieldErrors = Boolean(phoneErrors.contactNumber || phoneErrors.whatsappNumber);

  async function handleSave() {
    setError(null);
    setSaved(false);
    if (hasFieldErrors) {
      setError("Please fix the highlighted fields before saving.");
      return;
    }
    try {
      // Empty strings mean "clear this field" — send them as null so the
      // backend actually unsets the stored value instead of leaving it
      // untouched (and so its url()/email() validators, which reject "",
      // don't fire on fields that were never set).
      const payload = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, typeof v === "string" && v === "" ? null : v]),
      ) as UpsertSiteSettingInput;
      await upsert(payload).unwrap();
      setSaved(true);
    } catch (err) {
      setError(extractApiError(err));
    }
  }

  if (isLoading) return <div className="py-20 text-center text-[13px] text-[#a39e96]">Loading site settings…</div>;
  if (queryError) {
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
        <p className="text-red-500 text-xs font-medium">{extractApiError(queryError)}</p>
      </div>
    );
  }

  const draftLines = lineCount(draftMessage);

  return (
    <div className="space-y-5 pb-10">
      {saved && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3.5 py-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-[12.5px] font-semibold text-green-700">Settings saved successfully.</p>
        </div>
      )}

      <div>
        <h1 className="text-[18px] font-bold text-[#1c1a17]">Site Settings</h1>
        <p className="text-[12.5px] text-[#7a7670] mt-1">Maintenance mode, contact details, and social media links for the public website.</p>
      </div>

      {/* Maintenance */}
      <section className="bg-white border border-[#e8e4dc] rounded-xl p-5 space-y-4">
        <h2 className="text-[13px] font-bold text-[#1c1a17]">Maintenance</h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12.5px] font-semibold text-[#1c1a17]">Maintenance Mode</p>
            <p className="text-[11.5px] text-[#a39e96]">When on, visitors see the maintenance message instead of the site.</p>
          </div>
          <ToggleSwitch checked={!!form.maintenanceMode} onChange={handleToggleMaintenance} />
        </div>

        {/* Message only ever shows/edits while maintenance mode is ON */}
        {form.maintenanceMode && (
          <div className="bg-[#faf8f5] border border-[#f0ece6] rounded-lg p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px] font-semibold text-[#7a7670]">Current Maintenance Message</p>
              <button type="button" onClick={openEditMessage} className="text-[11.5px] font-bold cursor-pointer" style={{ color: ACCENT }}>
                Edit
              </button>
            </div>
            <p className="text-[12.5px] text-[#1c1a17] whitespace-pre-line">{form.maintenanceMessage}</p>
          </div>
        )}
      </section>

      {/* Contact */}
      <section className="bg-white border border-[#e8e4dc] rounded-xl p-5 space-y-4">
        <h2 className="text-[13px] font-bold text-[#1c1a17]">Contact</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Support Email">
            <input type="email" value={form.supportEmail} onChange={(e) => update({ supportEmail: e.target.value })} placeholder="support@example.com" className={inputClass} />
          </Field>
          <Field label="Contact Email">
            <input type="email" value={form.contactEmail} onChange={(e) => update({ contactEmail: e.target.value })} placeholder="contact@example.com" className={inputClass} />
          </Field>
          <Field label="Contact Number" error={phoneErrors.contactNumber}>
            <input type="tel" value={form.contactNumber} onChange={(e) => update({ contactNumber: e.target.value })} placeholder="+91 98765 43210" className={phoneErrors.contactNumber ? inputErrorClass : inputClass} />
          </Field>
          <Field label="WhatsApp Number" error={phoneErrors.whatsappNumber}>
            <input type="tel" value={form.whatsappNumber} onChange={(e) => update({ whatsappNumber: e.target.value })} placeholder="+91 98765 43210" className={phoneErrors.whatsappNumber ? inputErrorClass : inputClass} />
          </Field>
        </div>
        <Field label="Address">
          <textarea rows={2} value={form.address} onChange={(e) => update({ address: e.target.value })} className={inputClass} />
        </Field>
      </section>

      {/* Social */}
      <section className="bg-white border border-[#e8e4dc] rounded-xl p-5 space-y-4">
        <h2 className="text-[13px] font-bold text-[#1c1a17]">Social Media</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {([
            ["facebookUrl", "Facebook URL", "https://facebook.com/yourpage"],
            ["instagramUrl", "Instagram URL", "https://instagram.com/yourpage"],
            ["twitterUrl", "Twitter (X) URL", "https://x.com/yourpage"],
            ["youtubeUrl", "YouTube URL", "https://youtube.com/@yourchannel"],
            ["linkedinUrl", "LinkedIn URL", "https://linkedin.com/company/yourpage"],
          ] as const).map(([key, label, placeholder]) => (
            <Field key={key} label={label}>
              <input type="url" value={form[key]} onChange={(e) => update({ [key]: e.target.value })} placeholder={placeholder} className={inputClass} />
            </Field>
          ))}
        </div>
      </section>

      {error && <p className="text-[12.5px] font-semibold text-red-600">{error}</p>}

      <button type="button" onClick={handleSave} disabled={isSaving} className={btnPrimary} style={{ background: ACCENT }}>
        {isSaving ? "Saving…" : "Save Settings"}
      </button>

      {/* Step 1: big, dramatic warning + 30s countdown */}
      {step === "confirm" && (
        <ModalShell>
          <div className="bg-red-50 px-6 pt-6 pb-5 border-b border-red-100">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2">
                <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              </svg>
            </div>
            <h3 className="text-[17px] font-bold text-red-700">This will take the site offline</h3>
            <p className="text-[12.5px] text-red-900/80 mt-1.5 leading-relaxed">
              You're about to enable maintenance mode. This is a major, site-wide action:
            </p>
            <ul className="mt-2.5 space-y-1.5 text-[12.5px] text-red-900/80">
              <li className="flex gap-2"><span>•</span><span>Every visitor will be blocked from the public website, immediately.</span></li>
              <li className="flex gap-2"><span>•</span><span>No one can browse cars, submit leads, or read articles until you turn it off.</span></li>
              <li className="flex gap-2"><span>•</span><span>This affects real users on the live site — not a preview.</span></li>
            </ul>
          </div>
          <div className="px-6 py-4">
            <p className="text-[12px] text-[#7a7670]">
              To prevent accidental clicks, confirmation unlocks after a short wait.
            </p>
          </div>
          <ModalActions
            onCancel={() => setStep("none")}
            onConfirm={() => setStep("message")}
            confirmLabel={countdown > 0 ? `Confirm (${countdown}s)` : "Confirm"}
            confirmDisabled={countdown > 0}
          />
        </ModalShell>
      )}

      {/* Step 2: write/edit the message (min 3 lines), required to turn on */}
      {step === "message" && (
        <ModalShell>
          <div className="px-6 pt-6 pb-2">
            <h3 className="text-[15px] font-bold text-[#1c1a17]">
              {editingMessage ? "Edit maintenance message" : "Write the maintenance message"}
            </h3>
            <p className="text-[12.5px] text-[#7a7670] mt-1">
              This is what visitors will see instead of the site. Minimum {MIN_LINES} lines.
            </p>
          </div>
          <div className="px-6 py-3">
            <textarea
              rows={5}
              autoFocus
              value={draftMessage}
              onChange={(e) => setDraftMessage(e.target.value)}
              placeholder={"We'll be back soon.\nOur team is upgrading the site.\nThanks for your patience."}
              className={inputClass}
            />
            <p className={`text-[11px] font-semibold mt-1 ${draftLines >= MIN_LINES ? "text-green-600" : "text-[#a39e96]"}`}>
              {draftLines} / {MIN_LINES} lines minimum
            </p>
          </div>
          <ModalActions
            onCancel={() => setStep("none")}
            onConfirm={handleConfirmMessage}
            confirmLabel={editingMessage ? "Save Message" : "Turn On Maintenance Mode"}
            confirmDisabled={draftLines < MIN_LINES}
          />
        </ModalShell>
      )}
    </div>
  );
}