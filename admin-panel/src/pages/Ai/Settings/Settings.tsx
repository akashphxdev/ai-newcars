// pages/Ai/Settings/Settings.tsx

import { useState } from "react";
import {
  useGetAiSettingsQuery,
  useUpsertAiSettingsMutation,
  useTestAiConnectionMutation,
  type AiSettingRecord,
} from "./aiSetting.api";
import {
  useGetAutomationRulesQuery,
  useUpsertAutomationRuleMutation,
  type AiAutomationRuleRecord,
} from "./automationRule.api";
import { extractApiError } from "../../../lib/apiClient";
import { AI_FEATURE_OPTIONS } from "../../../lib/aiLookups";

const ACCENT = "#D4300F";

// ─── Provider metadata (icon/description/default model) ───────────────────
// Purely presentational — the numeric codes themselves live in
// lib/aiLookups.ts's AI_PROVIDER_OPTIONS (mirrors the backend's
// AI_PROVIDER_CODES), this just adds UI-only detail per code.
const PROVIDER_META: Record<
  number,
  { name: string; desc: string; fields: "local" | "apiKey"; defaultModel: string; icon: React.ReactNode }
> = {
  1: {
    name: "Ollama (Local)",
    desc: "Free, runs on your machine. Good for testing.",
    fields: "local",
    defaultModel: "llama3",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M8 9h.01M16 9h.01" strokeLinecap="round" />
        <path d="M8 15c1.2 1 2.8 1 4 0" strokeLinecap="round" />
      </svg>
    ),
  },
  2: {
    name: "OpenAI",
    desc: "GPT-4o and other OpenAI models via API key.",
    fields: "apiKey",
    defaultModel: "gpt-4o",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v18M3 12h18" strokeLinecap="round" />
      </svg>
    ),
  },
  3: {
    name: "Anthropic (Claude)",
    desc: "Claude Sonnet / Opus models via API key.",
    fields: "apiKey",
    defaultModel: "claude-sonnet-5",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3z" strokeLinejoin="round" />
      </svg>
    ),
  },
  4: {
    name: "Google Gemini",
    desc: "Gemini 2.x models via API key.",
    fields: "apiKey",
    defaultModel: "gemini-2.0-flash",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" strokeLinecap="round" />
      </svg>
    ),
  },
};

// hasImages: only content-producing features (Article/Story) get the
// image-folder + rotation fields — same UI restriction as before.
const FEATURE_META: Record<number, { desc: string; hasImages: boolean }> = {
  1: { desc: "Auto-writes articles, picks a cover image, saves as draft.", hasImages: true },
  2: { desc: "Auto-creates story items from a media folder with AI captions.", hasImages: true },
  3: { desc: "Auto-fills meta title, description & keywords on existing pages.", hasImages: false },
  4: { desc: "Auto-builds FAQs from car variant specs.", hasImages: false },
};

const FREQUENCY_OPTIONS = [
  { label: "Every 1 minute", minutes: 1 },
  { label: "Every 5 minutes", minutes: 5 },
  { label: "Every 15 minutes", minutes: 15 },
  { label: "Every 30 minutes", minutes: 30 },
  { label: "Every 1 hour", minutes: 60 },
  { label: "Every 3 hours", minutes: 180 },
  { label: "Every 6 hours", minutes: 360 },
  { label: "Every 12 hours", minutes: 720 },
  { label: "Daily", minutes: 1440 },
  { label: "Weekly", minutes: 10080 },
];

interface AutomationConfig {
  enabled: boolean;
  frequencyMinutes: number;
  countPerRun: number;
  imageFolder: string;
  autoPickImages: boolean;
  autoDelete: boolean;
  keepLatest: number;
}

const DEFAULT_RULE: AutomationConfig = {
  enabled: false,
  frequencyMinutes: 180,
  countPerRun: 1,
  imageFolder: "",
  autoPickImages: false,
  autoDelete: false,
  keepLatest: 10,
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="cursor-pointer relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0"
      style={{ background: checked ? ACCENT : "#e2ddd4" }}
    >
      <span
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
        style={{ left: checked ? "18px" : "2px" }}
      />
    </button>
  );
}

function AutomationCard({
  featureKey,
  config,
  onChange,
}: {
  featureKey: number;
  config: AutomationConfig;
  onChange: (next: AutomationConfig) => void;
}) {
  const [open, setOpen] = useState(config.enabled);
  const meta = FEATURE_META[featureKey];
  const label = AI_FEATURE_OPTIONS.find((f) => f.value === featureKey)?.label ?? `Feature ${featureKey}`;

  const update = (patch: Partial<AutomationConfig>) => onChange({ ...config, ...patch });

  return (
    <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="cursor-pointer w-full flex items-center justify-between px-5 py-3.5"
      >
        <div className="text-left">
          <p className="text-[13px] font-bold text-[#1c1a17]">{label}</p>
          <p className="text-[11.5px] text-[#a39e96] mt-0.5">{meta.desc}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: config.enabled ? "#f0fdf4" : "#f7f5f1", color: config.enabled ? "#15803d" : "#a39e96" }}
          >
            {config.enabled ? "Automation ON" : "Automation OFF"}
          </span>
          <div onClick={(e) => e.stopPropagation()}>
            <Toggle checked={config.enabled} onChange={() => update({ enabled: !config.enabled })} />
          </div>
          <svg
            width="12" height="12" viewBox="0 0 12 8" fill="none"
            className="text-[#c0bab0] transition-transform duration-200"
            style={{ transform: open ? "rotate(180deg)" : "none" }}
          >
            <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-[#f0ece6] space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-[#7a7670] block mb-1.5">How Often</label>
              <select
                value={config.frequencyMinutes}
                onChange={(e) => update({ frequencyMinutes: Number(e.target.value) })}
                disabled={!config.enabled}
                className="w-full text-[12.5px] border border-[#e8e4dc] rounded-lg px-3 py-2 outline-none focus:border-[#D4300F] bg-white disabled:opacity-50"
              >
                {FREQUENCY_OPTIONS.map((f) => (
                  <option key={f.minutes} value={f.minutes}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#7a7670] block mb-1.5">
                How Many Per Run
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={config.countPerRun}
                onChange={(e) => update({ countPerRun: Number(e.target.value) })}
                disabled={!config.enabled}
                className="w-full text-[12.5px] border border-[#e8e4dc] rounded-lg px-3 py-2 outline-none focus:border-[#D4300F] disabled:opacity-50"
              />
            </div>
          </div>

          {meta.hasImages && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-[#7a7670]">Auto-Pick Images From Folder</label>
                <Toggle checked={config.autoPickImages} onChange={() => update({ autoPickImages: !config.autoPickImages })} />
              </div>
              <input
                value={config.imageFolder}
                onChange={(e) => update({ imageFolder: e.target.value })}
                disabled={!config.enabled || !config.autoPickImages}
                placeholder="/uploads/ai-source/..."
                className="w-full text-[12.5px] border border-[#e8e4dc] rounded-lg px-3 py-2 outline-none focus:border-[#D4300F] disabled:opacity-50"
              />
              <p className="text-[11px] text-[#a39e96] mt-1.5">
                AI will pick the next unused image from this folder, upload it, and attach it as the cover image automatically.
              </p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-[#7a7670]">Auto-Delete Oldest When Limit Reached</label>
              <Toggle checked={config.autoDelete} onChange={() => update({ autoDelete: !config.autoDelete })} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-[#4a4640]">Keep latest</span>
              <input
                type="number"
                min={1}
                max={200}
                value={config.keepLatest}
                onChange={(e) => update({ keepLatest: Number(e.target.value) })}
                disabled={!config.enabled || !config.autoDelete}
                className="w-20 text-[12.5px] border border-[#e8e4dc] rounded-lg px-3 py-1.5 outline-none focus:border-[#D4300F] disabled:opacity-50"
              />
              <span className="text-[12px] text-[#4a4640]">AI-generated items, delete the rest automatically.</span>
            </div>
            <p className="text-[11px] text-[#a39e96] mt-1.5">
              Example: if 2 new items are auto-uploaded and this pushes the count over the limit, the 2 oldest auto-generated items are removed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Outer wrapper — waits for both real queries before mounting the
// actual form, so the form's local state can read its starting values
// straight from props on mount (same pattern as PlacementModal /
// AiFaqEditModal use for their remount-on-open forms). ──────────────
export default function AISettings() {
  const { data: settingsData, isLoading: settingsLoading, error: settingsError } = useGetAiSettingsQuery();
  const { data: rulesData, isLoading: rulesLoading, error: rulesError } = useGetAutomationRulesQuery();

  const loading = settingsLoading || rulesLoading;
  const loadError = settingsError || rulesError;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[13px] text-[#a39e96]">
        Loading AI settings...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-[13px] text-red-500 font-medium">
        {extractApiError(loadError)}
      </div>
    );
  }

  return <AISettingsForm initialSettings={settingsData ?? null} initialRules={rulesData ?? []} />;
}

function AISettingsForm({
  initialSettings,
  initialRules,
}: {
  initialSettings: AiSettingRecord | null;
  initialRules: AiAutomationRuleRecord[];
}) {
  const [provider, setProvider] = useState<number>(initialSettings?.provider ?? 1);
  const [baseUrl, setBaseUrl] = useState(initialSettings?.baseUrl ?? "http://localhost:11434");
  // Never prefilled with the real/masked key — only what the admin types
  // now becomes the new key. Left blank on save = keep the existing one.
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(initialSettings?.model ?? PROVIDER_META[1].defaultModel);
  const [language, setLanguage] = useState(initialSettings?.language ?? "english");
  const [autoSaveMode, setAutoSaveMode] = useState<"draft" | "preview">(
    (initialSettings?.autoSaveMode as "draft" | "preview") ?? "draft",
  );
  const [hasApiKey, setHasApiKey] = useState(initialSettings?.hasApiKey ?? false);
  const [maskedApiKey, setMaskedApiKey] = useState(initialSettings?.maskedApiKey ?? null);

  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testMessage, setTestMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  const [automation, setAutomation] = useState<Record<number, AutomationConfig>>(() => {
    const map: Record<number, AutomationConfig> = {};
    for (const feature of AI_FEATURE_OPTIONS) {
      const existing = initialRules.find((r) => r.featureKey === feature.value);
      map[feature.value] = existing
        ? {
            enabled: existing.enabled,
            frequencyMinutes: existing.frequencyMinutes,
            countPerRun: existing.countPerRun,
            imageFolder: existing.imageFolder ?? "",
            autoPickImages: existing.autoPickImages,
            autoDelete: existing.autoDelete,
            keepLatest: existing.keepLatest ?? 10,
          }
        : DEFAULT_RULE;
    }
    return map;
  });

  const [upsertSettings, { isLoading: savingSettings }] = useUpsertAiSettingsMutation();
  const [testConnection] = useTestAiConnectionMutation();
  const [upsertRule] = useUpsertAutomationRuleMutation();

  const providerMeta = PROVIDER_META[provider];

  const handleProviderChange = (id: number) => {
    setProvider(id);
    setModel(PROVIDER_META[id].defaultModel);
    setApiKey("");
    setTestStatus("idle");
  };

  const handleTestConnection = async () => {
    setTestStatus("testing");
    setTestMessage("");
    try {
      const result = await testConnection({
        provider,
        baseUrl: providerMeta.fields === "local" ? baseUrl.trim() || undefined : undefined,
        apiKey: providerMeta.fields === "apiKey" ? apiKey.trim() || undefined : undefined,
        model: model.trim(),
      }).unwrap();
      setTestStatus(result.status);
      setTestMessage(result.message);
    } catch (err) {
      setTestStatus("error");
      setTestMessage(extractApiError(err));
    }
  };

  const handleSave = async () => {
    setSaveError("");
    try {
      const result = await upsertSettings({
        provider,
        baseUrl: providerMeta.fields === "local" ? baseUrl.trim() || undefined : undefined,
        apiKey: apiKey.trim() || undefined,
        model: model.trim(),
        language: language as "english" | "hindi" | "hinglish",
        autoSaveMode,
      }).unwrap();

      setHasApiKey(result.hasApiKey);
      setMaskedApiKey(result.maskedApiKey);
      setApiKey("");

      await Promise.all(
        AI_FEATURE_OPTIONS.map((feature) => {
          const cfg = automation[feature.value];
          return upsertRule({
            featureKey: feature.value,
            input: {
              enabled: cfg.enabled,
              frequencyMinutes: cfg.frequencyMinutes,
              countPerRun: cfg.countPerRun,
              imageFolder: cfg.imageFolder.trim() || null,
              autoPickImages: cfg.autoPickImages,
              autoDelete: cfg.autoDelete,
              keepLatest: cfg.autoDelete ? cfg.keepLatest : null,
            },
          }).unwrap();
        }),
      );

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setSaveError(extractApiError(err));
    }
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#1c1a17]">AI Settings</h1>
          <p className="text-[12.5px] text-[#7a7670] mt-0.5">
            Configure the AI provider and automation rules used by AI Content Studio.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={savingSettings}
          className="cursor-pointer text-[12.5px] font-semibold text-white px-4 py-2 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: ACCENT }}
        >
          {savingSettings ? "Saving..." : saved ? "Saved ✓" : "Save Changes"}
        </button>
      </div>

      {saveError && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-[12.5px] text-red-500 font-medium">
          {saveError}
        </div>
      )}

      {/* Provider selection */}
      <div className="bg-white border border-[#e8e4dc] rounded-xl p-5">
        <h2 className="text-[13px] font-bold text-[#1c1a17] mb-3">AI Provider</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(PROVIDER_META).map(([idStr, p]) => {
            const id = Number(idStr);
            const active = id === provider;
            return (
              <button
                key={id}
                onClick={() => handleProviderChange(id)}
                className={`cursor-pointer text-left border rounded-xl p-3.5 transition-all duration-150 ${
                  active ? "border-transparent" : "border-[#e8e4dc] hover:border-[#d1cdc7]"
                }`}
                style={active ? { background: "#fef2f0", boxShadow: `0 0 0 1.5px ${ACCENT}` } : {}}
              >
                <div className="flex items-center gap-2 mb-1.5" style={{ color: active ? ACCENT : "#a39e96" }}>
                  {p.icon}
                  {active && (
                    <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: ACCENT }}>
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[12.5px] font-semibold text-[#1c1a17]">{p.name}</p>
                <p className="text-[11px] text-[#a39e96] mt-0.5 leading-snug">{p.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Connection config */}
      <div className="bg-white border border-[#e8e4dc] rounded-xl p-5">
        <h2 className="text-[13px] font-bold text-[#1c1a17] mb-3">Connection</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providerMeta.fields === "local" ? (
            <div>
              <label className="text-[11px] font-semibold text-[#7a7670] block mb-1.5">Base URL</label>
              <input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full text-[12.5px] border border-[#e8e4dc] rounded-lg px-3 py-2 outline-none focus:border-[#D4300F]"
                placeholder="http://localhost:11434"
              />
            </div>
          ) : (
            <div>
              <label className="text-[11px] font-semibold text-[#7a7670] block mb-1.5">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full text-[12.5px] border border-[#e8e4dc] rounded-lg px-3 py-2 outline-none focus:border-[#D4300F]"
                placeholder={hasApiKey ? maskedApiKey ?? "Already saved — leave blank to keep it" : "sk-••••••••••••••••"}
              />
              {hasApiKey && (
                <p className="text-[10.5px] text-[#a39e96] mt-1.5">
                  A key is already saved ({maskedApiKey}). Leave blank to keep it, or type a new one to replace it.
                </p>
              )}
            </div>
          )}
          <div>
            <label className="text-[11px] font-semibold text-[#7a7670] block mb-1.5">Model Name</label>
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full text-[12.5px] border border-[#e8e4dc] rounded-lg px-3 py-2 outline-none focus:border-[#D4300F]"
              placeholder={providerMeta.defaultModel}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={handleTestConnection}
            disabled={testStatus === "testing"}
            className="cursor-pointer text-[12.5px] font-semibold px-4 py-2 rounded-lg border border-[#e8e4dc] text-[#1c1a17] hover:bg-[#f7f5f1] transition-colors disabled:opacity-60"
          >
            {testStatus === "testing" ? "Testing..." : "Test Connection"}
          </button>
          {testStatus === "success" && (
            <span className="text-[12px] font-semibold text-emerald-600">● {testMessage}</span>
          )}
          {testStatus === "error" && (
            <span className="text-[12px] font-semibold" style={{ color: ACCENT }}>
              ● {testMessage}
            </span>
          )}
        </div>
      </div>

      {/* Behavior */}
      <div className="bg-white border border-[#e8e4dc] rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="text-[11px] font-semibold text-[#7a7670] block mb-1.5">Default Output Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full text-[12.5px] border border-[#e8e4dc] rounded-lg px-3 py-2 outline-none focus:border-[#D4300F] bg-white"
          >
            <option value="english">English</option>
            <option value="hindi">Hindi</option>
            <option value="hinglish">Hinglish</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] font-semibold text-[#7a7670] block mb-1.5">After Generating</label>
          <select
            value={autoSaveMode}
            onChange={(e) => setAutoSaveMode(e.target.value as "draft" | "preview")}
            className="w-full text-[12.5px] border border-[#e8e4dc] rounded-lg px-3 py-2 outline-none focus:border-[#D4300F] bg-white"
          >
            <option value="draft">Save as Draft automatically</option>
            <option value="preview">Show preview before saving</option>
          </select>
        </div>
      </div>

      {/* Automation — schedule, image folder, auto-delete, per feature */}
      <div>
        <h2 className="text-[13px] font-bold text-[#1c1a17] mb-3">Automation Rules</h2>
        <div className="space-y-3">
          {AI_FEATURE_OPTIONS.map((feature) => (
            <AutomationCard
              key={feature.value}
              featureKey={feature.value}
              config={automation[feature.value]}
              onChange={(next) => setAutomation((prev) => ({ ...prev, [feature.value]: next }))}
            />
          ))}
        </div>
      </div>
    </div>
  );
}