// src/pages/LandingPages/LandingPageModal.tsx
//
// A landing page is a folder at timesauto.net/drive/<slug>/, so this is
// really a folder editor: upload the whole thing as the designer built
// it, subdirectories and all. Pasting the markup stays available for a
// single-file page, but it is the smaller of the two paths now.

import { useEffect, useMemo, useState } from "react";
import {
  useGetLandingPageQuery,
  useGetLandingFilesQuery,
  useDeleteLandingFileMutation,
} from "./landingPage.api";
import { extractApiError } from "../../lib/apiClient";

const ACCENT = "#D4300F";
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Mirrors the server's list. Kept here only to explain a rejection before
// the upload rather than after it — the server decides. PHP is absent
// deliberately: it is the one server-side language landing pages can run.
const BLOCKED = /\.(phtml|php5|phar|inc|env|sh|bash|py|rb|pl|cgi|htaccess|htpasswd)$/i;

function relativePathOf(file: File): string {
  const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
  if (rel) return rel.split("/").slice(1).join("/") || file.name;
  return file.name;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
  const { data: onDisk } = useGetLandingFilesQuery(slug ?? "", { skip: !slug });
  const [deleteFile] = useDeleteLandingFileMutation();

  const [name, setName] = useState(slug ?? "");
  const [html, setHtml] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existing) setHtml(existing.html);
  }, [existing]);

  const picked = useMemo(
    () => files.map((file) => ({ file, path: relativePathOf(file) })),
    [files],
  );
  const rejected = picked.filter((f) => BLOCKED.test(f.path));

  // What the page asks for by relative path, so a missing stylesheet is
  // visible here rather than on the live page.
  const referenced = useMemo(
    () =>
      Array.from(
        new Set(
          [
            ...html.matchAll(
              /(?:src|href)=["']([^"':#][^"']*\.(?:jpg|jpeg|png|webp|avif|gif|svg|ico|css|js|mp4|webm|woff2?))["']/gi,
            ),
          ].map((m) => m[1].replace(/^\.?\//, "")),
        ),
      ),
    [html],
  );

  const present = new Set([...picked.map((f) => f.path), ...(onDisk ?? []).map((f) => f.name)]);
  const uploadingIndex = picked.some((f) => f.path === "index.html");
  const slugValid = SLUG_PATTERN.test(name);

  async function handleSubmit() {
    setError(null);
    if (!slugValid) return setError("Use lowercase letters, numbers and single hyphens — e.g. mahindra-scorpio");
    if (rejected.length > 0) {
      return setError(
        `${rejected[0].path} cannot run here. PHP is the only server-side language landing pages support — anything else would be served as source and expose what is inside it.`,
      );
    }
    // The folder can supply its own index.html, so pasted markup is only
    // required when nothing else provides one.
    if (!html.trim() && !uploadingIndex && !existing?.hasIndex) {
      return setError("Paste the page's HTML, or include an index.html in the upload");
    }

    setSaving(true);
    try {
      await onSave(name, html, files);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(fileName: string) {
    if (!slug) return;
    if (!confirm(`Delete ${fileName} from this page?`)) return;
    try {
      await deleteFile({ slug, name: fileName }).unwrap();
    } catch (err) {
      setError(extractApiError(err));
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
            <label className="mb-1 block text-xs font-bold text-gray-700">Page files</label>
            <div className="flex flex-wrap gap-4">
              <label className="cursor-pointer text-sm">
                <span className="mb-1 block text-xs text-gray-600">Whole folder</span>
                <input
                  type="file"
                  multiple
                  // Not in the React types; the folder picker is the whole
                  // point of this control.
                  {...{ webkitdirectory: "", directory: "" }}
                  onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                  className="block w-full text-sm"
                />
              </label>
              <label className="cursor-pointer text-sm">
                <span className="mb-1 block text-xs text-gray-600">Individual files</span>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                  className="block w-full text-sm"
                />
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Subfolders are kept, so <code>css/site.css</code> stays at <code>css/site.css</code>. PHP runs, so a
              form can post to its own <code>submit.php</code>; <code>config.php</code> and anything under{" "}
              <code>storage/</code> are never readable from the web.
            </p>

            {picked.length > 0 && (
              <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-md border border-gray-200 p-2">
                {picked.map(({ file, path }) => (
                  <li key={path} className="flex items-center gap-2 text-xs">
                    <span className={BLOCKED.test(path) ? "text-red-600" : "text-green-600"}>
                      {BLOCKED.test(path) ? "✕" : "↑"}
                    </span>
                    <code className="flex-1 truncate">{path}</code>
                    <span className="text-gray-500">{formatSize(file.size)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {slug && (onDisk?.length ?? 0) > 0 && (
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-700">Already in this folder</label>
              <ul className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-gray-200 p-2">
                {onDisk!.map((file) => (
                  <li key={file.name} className="flex items-center gap-2 text-xs">
                    <code className="flex-1 truncate">{file.name}</code>
                    <span className="text-gray-500">{formatSize(file.sizeBytes)}</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(file.name)}
                      className="cursor-pointer text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-bold text-gray-700">
              Page HTML {(uploadingIndex || existing?.hasIndex) && <span className="font-normal text-gray-500">(optional)</span>}
            </label>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder={isLoading ? "Loading…" : uploadingIndex ? "Taken from the uploaded index.html" : "<!DOCTYPE html> …"}
              rows={12}
              spellCheck={false}
              className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs"
            />
            <p className="mt-1 text-xs text-gray-500">
              Served exactly as pasted. Leave empty when the upload already contains an <code>index.html</code>.
            </p>

            {referenced.length > 0 && (
              <ul className="mt-2 space-y-1">
                {referenced.map((file) => (
                  <li key={file} className="flex items-center gap-2 text-xs">
                    <span className={present.has(file) ? "text-green-600" : "text-amber-600"}>
                      {present.has(file) ? "✓" : "•"}
                    </span>
                    <code>{file}</code>
                    <span className="text-gray-500">
                      {present.has(file) ? "present" : "referenced by the page but missing"}
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
