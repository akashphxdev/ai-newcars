// src/pages/newCars/ColorsImages/AllColorsImages.tsx
import { useState } from "react";
import { useGetCarModelOptionsQuery } from "../carModels/carModel.api";
import ColorsTab from "./ColorsTab";
import ImagesTab from "./ImagesTab";

const ACCENT = "#D4300F";

type TabKey = "colors" | "images";

export default function AllColorsImages() {
  const { data: models = [], isLoading: modelsLoading } = useGetCarModelOptionsQuery();

  const [modelId, setModelId] = useState<number | "">("");
  const [tab, setTab] = useState<TabKey>("colors");

  const selectedModel = models.find((m) => m.id === modelId) ?? null;

  return (
    <div className="space-y-5 max-w-[1100px]">
      <div>
        <h1 className="text-[18px] font-black text-[#1c1a17]">Colors & Images</h1>
        <p className="text-[12px] text-[#a39e96] mt-0.5">
          Select a car model to manage its available colors and gallery images.
        </p>
      </div>

      <div className="bg-white border border-[#e8e4dc] rounded-xl p-4">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a39e96] mb-1.5">
          Car model
        </label>
        <select
          value={modelId}
          disabled={modelsLoading}
          onChange={(e) => setModelId(e.target.value ? Number(e.target.value) : "")}
          className="cursor-pointer w-full max-w-[360px] text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border border-[#e2ddd5] rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white disabled:opacity-50"
        >
          <option value="">{modelsLoading ? "Loading models..." : "Select a car model..."}</option>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.brand.name} — {m.name}
            </option>
          ))}
        </select>
      </div>

      {!selectedModel ? (
        <div className="bg-white border border-[#e8e4dc] rounded-xl px-4 py-12 text-center">
          <p className="text-[12px] text-[#a39e96]">Pick a car model above to manage its colors and images.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1.5 border-b border-[#e8e4dc]">
            {(
              [
                { key: "colors", label: "Colors" },
                { key: "images", label: "Images" },
              ] as { key: TabKey; label: string }[]
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="cursor-pointer relative px-4 py-2.5 text-[12.5px] font-bold transition-colors"
                style={{ color: tab === t.key ? ACCENT : "#a39e96" }}
              >
                {t.label}
                {tab === t.key && (
                  <span className="absolute left-0 right-0 -bottom-px h-[2px] rounded-full" style={{ background: ACCENT }} />
                )}
              </button>
            ))}
          </div>

          {tab === "colors" ? <ColorsTab modelId={selectedModel.id} /> : <ImagesTab modelId={selectedModel.id} />}
        </>
      )}
    </div>
  );
}