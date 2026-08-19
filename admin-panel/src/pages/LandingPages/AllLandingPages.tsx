// src/pages/LandingPages/AllLandingPages.tsx
//
// Campaign landing pages. These are whole standalone HTML documents
// served at timesauto.net/drive/<slug>/ — no site header, no footer, no
// Next app in the way — so this screen manages files rather than fields:
// paste the document, upload the images it references, done.

import { useState } from "react";
import {
  useGetLandingPagesQuery,
  useSaveLandingPageMutation,
  useUploadLandingAssetsMutation,
  useDeleteLandingPageMutation,
  type LandingPageRecord,
} from "./landingPage.api";
import { extractApiError } from "../../lib/apiClient";
import DataTable, { type DataTableColumn } from "../../components/common/DataTable";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import LandingPageModal from "./LandingPageModal";

const ACCENT = "#D4300F";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function AllLandingPages() {
  const { data: pages, isLoading, error } = useGetLandingPagesQuery();
  const [saveLandingPage] = useSaveLandingPageMutation();
  const [uploadAssets] = useUploadLandingAssetsMutation();
  const [deleteLandingPage, { isLoading: deleting }] = useDeleteLandingPageMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LandingPageRecord | null>(null);
  const [confirming, setConfirming] = useState<LandingPageRecord | null>(null);
  const [banner, setBanner] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const columns: DataTableColumn<LandingPageRecord>[] = [
    {
      header: "Page",
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-900">{row.title ?? row.slug}</p>
          <a
            href={row.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:underline"
          >
            {row.url}
          </a>
        </div>
      ),
    },
    {
      header: "Status",
      render: (row) =>
        row.hasIndex ? (
          <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
            Live
          </span>
        ) : (
          // A folder with no index.html would 404 for visitors. Shown
          // rather than hidden, so it can be fixed.
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
            No index.html
          </span>
        ),
    },
    { header: "Assets", render: (row) => <span className="text-sm">{row.assetCount}</span> },
    { header: "Size", render: (row) => <span className="text-sm">{fmtSize(row.sizeBytes)}</span> },
    { header: "Updated", render: (row) => <span className="text-sm">{fmtDate(row.updatedAt)}</span> },
    {
      header: "",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => { setEditing(row); setModalOpen(true); }}
            className="cursor-pointer rounded-md border border-gray-300 px-3 py-1 text-xs font-semibold hover:bg-gray-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setConfirming(row)}
            className="cursor-pointer rounded-md border border-red-300 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  async function handleSave(slug: string, html: string, files: File[]) {
    // Assets first: an upload can carry the page's own index.html, and
    // writing empty markup afterwards would overwrite it.
    if (files.length > 0) await uploadAssets({ slug, files }).unwrap();
    if (html.trim()) await saveLandingPage({ slug, html }).unwrap();
    setBanner({ kind: "ok", text: `Saved. Live at /drive/${slug}/` });
    setModalOpen(false);
    setEditing(null);
  }

  async function handleDelete() {
    if (!confirming) return;
    try {
      await deleteLandingPage(confirming.slug).unwrap();
      setBanner({ kind: "ok", text: `Deleted ${confirming.slug}` });
    } catch (err) {
      setBanner({ kind: "err", text: extractApiError(err) });
    }
    setConfirming(null);
  }

  return (
    <div className="p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Landing Pages</h1>
          <p className="mt-1 text-sm text-gray-500">
            Standalone campaign pages served at <code>/drive/&lt;name&gt;/</code>, outside the main site.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="cursor-pointer rounded-md px-4 py-2 text-sm font-semibold text-white"
          style={{ background: ACCENT }}
        >
          New landing page
        </button>
      </div>

      {banner && (
        <div
          className={`mb-4 rounded-md px-3 py-2 text-sm ${
            banner.kind === "ok"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {banner.text}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={pages ?? []}
        rowKey={(row) => row.slug}
        loading={isLoading}
        error={error ? extractApiError(error) : undefined}
        emptyMessage="No landing pages yet."
      />

      {modalOpen && (
        <LandingPageModal
          slug={editing?.slug ?? null}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}

      <ConfirmDialog
        open={confirming !== null}
        onCancel={() => setConfirming(null)}
        onConfirm={handleDelete}
        title="Delete this landing page?"
        itemName={confirming?.slug}
        message="The page and every asset in its folder are removed from the server. Any live campaign pointing at this URL will start returning 404."
        loading={deleting}
      />
    </div>
  );
}
