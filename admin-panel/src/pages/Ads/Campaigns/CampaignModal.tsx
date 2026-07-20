// src/pages/Ads/Campaigns/CampaignModal.tsx
import { useEffect, useRef, useState } from "react";
import {
  useCreateAdCampaignMutation,
  useUpdateAdCampaignMutation,
  type AdCampaignRecord,
  type CampaignStatus,
} from "./adCampaign.api";
import { useGetAdPlacementsQuery } from "../Placements/placement.api";
import { useGetAdvertisersQuery } from "../Advertisers/advertiser.api";
import { extractApiError, getUploadUrl } from "../../../lib/apiClient";

const ACCENT = "#D4300F";
const STATUS_OPTIONS: CampaignStatus[] = ["active", "paused", "expired"];

interface FieldErrors {
  placementId?: string;
  name?: string;
  creativeImage?: string;
  targetUrl?: string;
  priority?: string;
  endDate?: string;
}

function RequiredMark() {
  return <span className="text-[#D4300F]">*</span>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1.5">
        {label} {required && <RequiredMark />}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white";
const selectClass = `cursor-pointer ${inputClass}`;

function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CampaignModal({
  open,
  onClose,
  campaign,
}: {
  open: boolean;
  onClose: () => void;
  // Present -> edit mode. Absent/null -> create mode.
  campaign?: AdCampaignRecord | null;
}) {
  const isEditMode = !!campaign;

  const { data: placementsData } = useGetAdPlacementsQuery({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const placements = placementsData?.data ?? [];
  const { data: advertisersData } = useGetAdvertisersQuery({ page: 1, limit: 100 });
  const advertisers = advertisersData?.data ?? [];

  const [placementId, setPlacementId] = useState<number | "">(campaign?.placementId ?? "");
  const [advertiserId, setAdvertiserId] = useState<number | "">(campaign?.advertiserId ?? "");
  const [name, setName] = useState(campaign?.name ?? "");
  const [targetUrl, setTargetUrl] = useState(campaign?.targetUrl ?? "");
  const [priority, setPriority] = useState(campaign ? String(campaign.priority) : "0");
  const [startDate, setStartDate] = useState(toLocalInputValue(campaign?.startDate));
  const [endDate, setEndDate] = useState(toLocalInputValue(campaign?.endDate));
  const [status, setStatus] = useState<CampaignStatus>(campaign?.status ?? "active");
  const [creativeImage, setCreativeImage] = useState<File | null>(null);
  const [creativePreview, setCreativePreview] = useState<string | null>(
    getUploadUrl(campaign?.creativeImageUrl ?? null),
  );

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const [createAdCampaign, { isLoading: creating }] = useCreateAdCampaignMutation();
  const [updateAdCampaign, { isLoading: updating }] = useUpdateAdCampaignMutation();
  const saving = creating || updating;

  useEffect(() => {
    const focusTimer = setTimeout(() => nameRef.current?.focus(), 50);
    return () => clearTimeout(focusTimer);
  }, []);

  if (!open) return null;

  const handleCreativeChange = (file: File | null) => {
    setCreativeImage(file);
    if (file) setCreativePreview(URL.createObjectURL(file));
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};

    if (!placementId) next.placementId = "Placement is required.";
    if (name.trim().length < 3) next.name = "Name must be at least 3 characters.";

    if (!creativeImage && !campaign?.creativeImageUrl) {
      next.creativeImage = "Creative image is required.";
    }
    if (!targetUrl.trim()) next.targetUrl = "Target URL is required.";

    if (!priority.trim() || !/^\d+$/.test(priority.trim())) {
      next.priority = "Priority must be a whole number, 0 or greater.";
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      next.endDate = "End must be on or after start.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    const commonInput = {
      placementId: Number(placementId),
      advertiserId: advertiserId === "" ? undefined : Number(advertiserId),
      name: name.trim(),
      targetUrl: targetUrl.trim(),
      priority: Number(priority),
      startDate: startDate ? new Date(startDate).toISOString() : null,
      endDate: endDate ? new Date(endDate).toISOString() : null,
      status,
    };

    try {
      if (isEditMode && campaign) {
        await updateAdCampaign({
          id: campaign.id,
          input: { ...commonInput, creativeImage: creativeImage ?? undefined },
        }).unwrap();
      } else {
        await createAdCampaign({ ...commonInput, creativeImage: creativeImage as File }).unwrap();
      }
      onClose();
    } catch (err) {
      setServerError(extractApiError(err));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[640px] bg-white border border-[#e8e4dc] rounded-2xl shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h2 className="text-[#1c1a17] text-lg font-black">
              {isEditMode ? "Edit campaign" : "Add campaign"}
            </h2>
            <p className="text-[#a39e96] text-xs mt-1">
              {isEditMode ? `Update details for ${campaign?.name}` : "Book a new ad campaign against a placement"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
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
            <Field label="Placement" required>
              <select
                value={placementId}
                onChange={(e) => setPlacementId(e.target.value ? Number(e.target.value) : "")}
                className={selectClass}
                style={{ borderColor: errors.placementId ? "#f0997b" : "#e2ddd5" }}
              >
                <option value="">Select placement</option>
                {placements.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {errors.placementId && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.placementId}</p>}
            </Field>

            <Field label="Advertiser">
              <select
                value={advertiserId}
                onChange={(e) => setAdvertiserId(e.target.value ? Number(e.target.value) : "")}
                className={selectClass}
                style={{ borderColor: "#e2ddd5" }}
              >
                <option value="">None</option>
                {advertisers.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Name" required>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Diwali Sale — Homepage Banner"
              className={inputClass}
              style={{ borderColor: errors.name ? "#f0997b" : "#e2ddd5" }}
              maxLength={150}
            />
            {errors.name && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.name}</p>}
          </Field>

          <Field label="Creative image" required>
            <div className="flex items-center gap-3">
              {creativePreview && (
                <img src={creativePreview} alt="" className="w-14 h-14 rounded-lg object-cover border border-[#e8e4dc]" />
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(e) => handleCreativeChange(e.target.files?.[0] ?? null)}
                className="text-xs"
              />
            </div>
            {errors.creativeImage && (
              <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.creativeImage}</p>
            )}
          </Field>

          <Field label="Target URL" required>
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://timesauto.in/cars/creta"
              className={inputClass}
              style={{ borderColor: errors.targetUrl ? "#f0997b" : "#e2ddd5" }}
              maxLength={255}
            />
            {errors.targetUrl && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.targetUrl}</p>}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority" required>
              <input
                type="number"
                min={0}
                step="1"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className={inputClass}
                style={{ borderColor: errors.priority ? "#f0997b" : "#e2ddd5" }}
              />
              <p className="text-[10px] text-[#a39e96] mt-1">
                Higher number shows first when a placement has multiple active campaigns.
              </p>
              {errors.priority && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.priority}</p>}
            </Field>

            <Field label="Status" required>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CampaignStatus)}
                className={selectClass}
                style={{ borderColor: "#e2ddd5" }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s} className="capitalize">
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Start">
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
                style={{ borderColor: "#e2ddd5" }}
              />
            </Field>
            <Field label="End">
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputClass}
                style={{ borderColor: errors.endDate ? "#f0997b" : "#e2ddd5" }}
              />
              {errors.endDate && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{errors.endDate}</p>}
            </Field>
          </div>

          {serverError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
              <p className="text-red-500 text-xs font-medium">{serverError}</p>
            </div>
          )}

          <div className="flex items-center gap-2.5 pt-1 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
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
                "Create campaign"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
