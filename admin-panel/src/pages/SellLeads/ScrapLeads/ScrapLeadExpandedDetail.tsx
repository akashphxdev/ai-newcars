// src/pages/SellLeads/ScrapLeads/ScrapLeadExpandedDetail.tsx
//
// Mounted only while its row is expanded — same convention as
// BuyLeads/InsuranceLeads/InsuranceLeadExpandedDetail.tsx.
import { useState } from "react";
import {
  useGetScrapLeadByIdQuery,
  useAddScrapLeadActivityMutation,
  useUpdateScrapLeadQuoteMutation,
  VEHICLE_CONDITION_LABELS,
  type ScrapLeadRecord,
} from "./scrapLead.api";
import { extractApiError } from "../../../lib/apiClient";

const ACCENT = "#D4300F";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function yesNo(value: boolean | null) {
  return value == null ? "—" : value ? "Yes" : "No";
}

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <p className="text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1">{label}</p>
    <div className="text-[12.5px] text-[#1c1a17]">{value}</div>
  </div>
);

export default function ScrapLeadExpandedDetail({ lead }: { lead: ScrapLeadRecord }) {
  const { data: detail, isLoading, error: queryError } = useGetScrapLeadByIdQuery(lead.id);
  const error = queryError ? "Couldn't load lead detail." : "";

  const [note, setNote] = useState("");
  const [quote, setQuote] = useState("");
  const [addActivity, { isLoading: posting }] = useAddScrapLeadActivityMutation();
  const [updateQuote, { isLoading: quoting }] = useUpdateScrapLeadQuoteMutation();
  const [actionError, setActionError] = useState("");

  const handleAddNote = async () => {
    if (!note.trim()) return;
    setActionError("");
    try {
      await addActivity({ id: lead.id, notes: note.trim() }).unwrap();
      setNote("");
    } catch (err) {
      setActionError(extractApiError(err));
    }
  };

  // Recording a quote also moves the lead to "quoted", so this is the one
  // action that changes status without touching the status dropdown.
  const handleQuote = async () => {
    const value = Number(quote);
    if (!quote.trim() || Number.isNaN(value) || value < 0) {
      setActionError("Enter a valid quote amount.");
      return;
    }
    setActionError("");
    try {
      await updateQuote({ id: lead.id, input: { quotedPrice: value } }).unwrap();
      setQuote("");
    } catch (err) {
      setActionError(extractApiError(err));
    }
  };

  if (isLoading) {
    return <p className="text-[12px] text-[#a39e96] py-2">Loading detail...</p>;
  }
  if (error || !detail) {
    return <p className="text-[12px] text-[#D4300F] py-2">{error}</p>;
  }

  return (
    <div className="space-y-4 text-[12px]">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
        <Field label="Email" value={detail.email ?? "—"} />
        <Field label="Registration State" value={detail.registrationState?.name ?? "—"} />
        <Field label="Fuel Type" value={detail.fuelType ?? "—"} />
        <Field
          label="Condition"
          value={detail.vehicleCondition ? VEHICLE_CONDITION_LABELS[detail.vehicleCondition] : "—"}
        />
        <Field label="Has Original RC" value={yesNo(detail.hasOriginalRc)} />
        <Field label="Loan / Hypothecation" value={yesNo(detail.isHypothecated)} />
        <Field label="Pending Challan" value={yesNo(detail.hasPendingChallan)} />
        <Field label="Wants Certificate of Deposit" value={yesNo(detail.wantsCertificateOfDeposit)} />
        <Field
          label="Preferred Pick-up"
          value={detail.preferredPickupDate ? formatDate(detail.preferredPickupDate) : "—"}
        />
        <Field label="Lead Channel" value={detail.leadChannel ?? "—"} />
        <Field label="Device" value={detail.deviceType ?? "—"} />
        <Field label="IP Address" value={detail.ipAddress ?? "—"} />
        <Field label="UTM Source" value={detail.utmSource ?? "—"} />
        <Field label="UTM Medium" value={detail.utmMedium ?? "—"} />
        <Field label="UTM Campaign" value={detail.utmCampaign ?? "—"} />
        <Field label="Landing Page" value={detail.landingPage ?? "—"} />
      </div>

      {detail.notes && (
        <div className="rounded-lg bg-[#f7f5f1] px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1">Notes</p>
          <p className="text-[12px] text-[#4a4640] whitespace-pre-wrap">{detail.notes}</p>
        </div>
      )}

      {actionError && <p className="text-[11px] font-medium text-[#D4300F]">{actionError}</p>}

      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1.5">
          Quote {detail.quotedPrice && <span className="text-[#1e8a4c]">— ₹{Number(detail.quotedPrice).toLocaleString("en-IN")} recorded</span>}
        </p>
        <div className="flex items-start gap-2">
          <input
            value={quote}
            onChange={(e) => setQuote(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="Amount offered for the vehicle"
            inputMode="decimal"
            className="flex-1 text-[12px] text-[#1c1a17] bg-white border border-[#e2ddd5] rounded-lg px-3 py-2 outline-none focus:border-[#D4300F]"
          />
          <button
            onClick={handleQuote}
            disabled={quoting || !quote.trim()}
            className="cursor-pointer shrink-0 text-[11px] font-bold text-white px-3.5 py-2 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: ACCENT }}
          >
            {quoting ? "Saving..." : "Record Quote"}
          </button>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1.5">
          Activity ({detail.activity.length})
        </p>

        <div className="space-y-2 mb-3">
          {detail.activity.map((a) => (
            <div key={a.id} className="rounded-lg bg-[#f7f5f1] px-3 py-2.5">
              <p className="text-[11px] font-bold text-[#1c1a17]">
                {a.admin.name}
                <span className="ml-2 font-medium text-[#a39e96]">{formatDateTime(a.createdAt)}</span>
              </p>
              <p className="text-[12px] text-[#4a4640] mt-0.5 whitespace-pre-wrap">{a.notes ?? "—"}</p>
            </div>
          ))}
          {detail.activity.length === 0 && <p className="text-[11px] text-[#a39e96]">No activity yet.</p>}
        </div>

        <div className="flex items-start gap-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a follow-up note..."
            rows={2}
            maxLength={500}
            className="flex-1 text-[12px] text-[#1c1a17] bg-white border border-[#e2ddd5] rounded-lg px-3 py-2 outline-none focus:border-[#D4300F] resize-none"
          />
          <button
            onClick={handleAddNote}
            disabled={posting || !note.trim()}
            className="cursor-pointer shrink-0 text-[11px] font-bold text-white px-3.5 py-2 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: ACCENT }}
          >
            {posting ? "Saving..." : "Add Note"}
          </button>
        </div>
      </div>
    </div>
  );
}
