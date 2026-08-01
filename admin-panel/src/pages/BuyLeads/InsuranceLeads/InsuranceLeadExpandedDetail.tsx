// src/pages/BuyLeads/InsuranceLeads/InsuranceLeadExpandedDetail.tsx
//
// Mounted only while its row is expanded — same convention as
// BuyLeads/NewCarLeads/NewCarLeadExpandedDetail.tsx.
import { useState } from "react";
import { useGetInsuranceLeadByIdQuery, useAddInsuranceLeadActivityMutation, type InsuranceLeadRecord } from "./insuranceLead.api";
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

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <p className="text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1">{label}</p>
    <div className="text-[12.5px] text-[#1c1a17]">{value}</div>
  </div>
);

export default function InsuranceLeadExpandedDetail({ lead }: { lead: InsuranceLeadRecord }) {
  const { data: detail, isLoading, error: queryError } = useGetInsuranceLeadByIdQuery(lead.id);
  const error = queryError ? "Couldn't load lead detail." : "";

  const [note, setNote] = useState("");
  const [addActivity, { isLoading: posting }] = useAddInsuranceLeadActivityMutation();
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

  if (isLoading) {
    return <p className="text-[12px] text-[#a39e96] py-2">Loading detail...</p>;
  }
  if (error || !detail) {
    return <p className="text-[12px] text-[#D4300F] py-2">{error}</p>;
  }

  return (
    <div className="space-y-4 text-[12px]">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
        <Field label="Lead Channel" value={detail.leadChannel ?? "—"} />
        <Field label="Device" value={detail.deviceType ?? "—"} />
        <Field label="IP Address" value={detail.ipAddress ?? "—"} />
        <Field label="UTM Source" value={detail.utmSource ?? "—"} />
        <Field label="UTM Medium" value={detail.utmMedium ?? "—"} />
        <Field label="UTM Campaign" value={detail.utmCampaign ?? "—"} />
        <Field label="Landing Page" value={detail.landingPage ?? "—"} />
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1.5">
          Activity ({detail.activity.length})
        </p>

        {actionError && <p className="text-[11px] font-medium text-[#D4300F] mb-2">{actionError}</p>}

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
