// src/pages/LandingPages/LandingPageModal.tsx
//
// Paste a finished HTML document, name it, attach the images it
// references. The markup is stored and served verbatim — the page is
// already designed, and rewriting it here would be a surprise.

import { useEffect, useState } from "react";
import { useGetLandingPageQuery } from "./landingPage.api";
import { extractApiError } from "../../lib/apiClient";

const ACCENT = "#D4300F";
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export default function LandingPageModal({
  slug,
  onClose,
  onSave,
}: {
  // Null when creating; the slug is then fixed once saved, because it is
  // the public URL.
  slug: string | null;
  onClose: () => void;
  onSave: (slug: string, html: string, files: File[]) => Promise<void>;
}) {
  const { data: existing, isLoading } = useGetLandingPageQuery(slug ?? "", { skip: !slug });

  const [name, setName] = useState(slug ?? "");
  const [html, setHtml] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existing) setHtml(existing.html);
  }, [existing]);

  // The filenames the pasted document asks for, so it is obvious which
  // images still need uploading rather than discovering it on the live page.
  const referenced = Array.from(
    new Set([...html.matchAll(/(?:src|href)=["']([^"':/][^"']*\.(?:jpg|jpeg|png|webp|avif|gif|svg))["']/gi)].map((m) => m[1])),
  );
  const attached = new Set(files.map((f) => f.name));

  const slugValid = SLUG_PATTERN.test(name);

  async function handleSubmit() {
    setError(null);
    if (!slugValid) return setError("Use lowercase letters, numbers and single hyphens — e.g. mahindra-scorpio");
    if (!html.trim()) return setError("Paste the page's HTML");

    setSaving(true);
    try {
      await onSave(name, html, files);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="mt-8 w-full max-w-3xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="font-bold text-gray-900">{slug ? `Edit ${slug}` : "New landing page"}</h2>
          <button type="button" onClick={onClose} className="cursor-pointer text-gray-400 hover:text-gray-700">✕</button>
        </div>

        <div className="space-y-4 p-5">
          {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}

          <div>
            <label className="mb-1 block text-xs font-bold text-gray-700">Page name (URL)</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">timesauto.net/drive/</span>
              <input
                value={name}
                disabled={!!slug}
                onChange={(e) => setName(e.target.value.toLowerCase())}
                placeholder="mahindra-scorpio"
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
              />
              <span className="text-sm text-gray-500">/</span>
            </div>
            {name && !slugValid && (
              <p className="mt-1 text-xs text-red-600">Lowercase letters, numbers and single hyphens only.</p>
            )}
            {slug && <p className="mt-1 text-xs text-gray-500">The URL cannot change — delete and recreate to rename.</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-gray-700">Page HTML</label>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder={isLoading ? "Loading…" : "<!DOCTYPE html> …"}
              rows={14}
              spellCheck={false}
              className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs"
            />
            <p className="mt-1 text-xs text-gray-500">
              Served exactly as pasted. Reference images by filename only (e.g. <code>scorpio-hero.jpg</code>) and upload them below.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-gray-700">Images</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              className="block w-full text-sm"
            />
            {referenced.length > 0 && (
              <ul className="mt-2 space-y-1">
                {referenced.map((file) => (
                  <li key={file} className="flex items-center gap-2 text-xs">
                    <span className={attached.has(file) ? "text-green-600" : "text-amber-600"}>
                      {attached.has(file) ? "✓" : "•"}
                    </span>
                    <code>{file}</code>
                    <span className="text-gray-500">
                      {attached.has(file) ? "attached" : "referenced by the page — upload it, or it must already exist"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t px-5 py-3">
          <button type="button" onClick={onClose} className="cursor-pointer rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="cursor-pointer rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: ACCENT }}
          >
            {saving ? "Saving…" : "Save page"}
          </button>
        </div>
      </div>
    </div>
  );
}
