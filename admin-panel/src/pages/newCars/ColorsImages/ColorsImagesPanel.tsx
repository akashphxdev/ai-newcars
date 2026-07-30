// src/pages/newCars/ColorsImages/ColorsImagesPanel.tsx
import { useState } from "react";
import ColorsTab from "./ColorsTab";
import ImagesTab from "./ImagesTab";

const ACCENT = "#D4300F";

type TabKey = "colors" | "images";

// Shared by the listing's expand-to-view row and the "Add to new model"
// modal — same Colors/Images tab-switcher, just scoped to whichever
// modelId the caller passes in. All actual CRUD lives in ColorsTab/
// ImagesTab, untouched.
export default function ColorsImagesPanel({
  modelId,
  initialTab = "colors",
}: {
  modelId: number;
  initialTab?: TabKey;
}) {
  const [tab, setTab] = useState<TabKey>(initialTab);

  return (
    <div className="space-y-4">
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

      {tab === "colors" ? <ColorsTab modelId={modelId} /> : <ImagesTab modelId={modelId} />}
    </div>
  );
}
