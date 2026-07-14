// src/components/common/Editor/SmartLinkModal.jsx
//
// Search-and-insert popup for linking straight to a Brand or Car Model
// from inside article content, instead of copy-pasting a URL by hand.
//
// The public website doesn't have brand/car-model detail pages yet (see
// linkUrlResolver.js), so `resolveBrandUrl` / `resolveCarModelUrl`
// currently return null — picking an item here inserts the name as
// highlighted (not yet linked) text, and the admin can wire up the real
// URL later via the toolbar's "Add link" button. Once those resolvers
// return a real path, this same flow starts inserting live links
// automatically — no change needed here.

import { useState } from "react";
import { useGetBrandOptionsQuery } from "../../../pages/newCars/Brands/brand.api";
import { useGetCarModelOptionsQuery } from "../../../pages/newCars/carModels/carModel.api";
import { resolveBrandUrl, resolveCarModelUrl } from "./linkUrlResolver";

const ACCENT = "#D4300F";

export default function SmartLinkModal({ open, onClose, onInsert }) {
  const [tab, setTab] = useState("brand"); // "brand" | "model"
  const [search, setSearch] = useState("");

  const { data: brands = [] } = useGetBrandOptionsQuery(undefined, { skip: !open });
  const { data: models = [] } = useGetCarModelOptionsQuery(undefined, { skip: !open });

  if (!open) return null;

  const items = tab === "brand" ? brands : models;
  const filtered = items.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));

  const handleClose = () => {
    setSearch("");
    setTab("brand");
    onClose();
  };

  const handlePick = (item) => {
    const isBrand = tab === "brand";
    const label = isBrand ? item.name : `${item.brand?.name ? `${item.brand.name} ` : ""}${item.name}`;
    const url = isBrand ? resolveBrandUrl(item) : resolveCarModelUrl(item);
    onInsert({ label, url });
    handleClose();
  };

  return (
    <div
      className="smart-link-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="smart-link-modal">
        <div className="smart-link-header">
          <h3>Insert a link</h3>
          <button type="button" onClick={handleClose} aria-label="Close" className="smart-link-close">
            ×
          </button>
        </div>

        <div className="smart-link-tabs">
          <button
            type="button"
            className={tab === "brand" ? "is-active" : ""}
            style={tab === "brand" ? { background: ACCENT } : undefined}
            onClick={() => setTab("brand")}
          >
            Brands
          </button>
          <button
            type="button"
            className={tab === "model" ? "is-active" : ""}
            style={tab === "model" ? { background: ACCENT } : undefined}
            onClick={() => setTab("model")}
          >
            Car models
          </button>
        </div>

        <input
          type="text"
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${tab === "brand" ? "brands" : "car models"}...`}
          className="smart-link-search"
        />

        <div className="smart-link-list">
          {filtered.length === 0 && <p className="smart-link-empty">No matches.</p>}
          {filtered.map((item) => (
            <button key={item.id} type="button" className="smart-link-item" onClick={() => handlePick(item)}>
              {tab === "model" && item.brand ? `${item.brand.name} ` : ""}
              {item.name}
            </button>
          ))}
        </div>

        <p className="smart-link-hint">
          Website pages for brands/models aren&apos;t live yet — this inserts the name; add the real URL later via
          &quot;Add link&quot; once the page exists.
        </p>
      </div>
    </div>
  );
}
