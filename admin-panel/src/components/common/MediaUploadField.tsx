// src/components/common/MediaUploadField.tsx
//
// Preview box + upload button + hidden file input for a single
// image/video field. Shared by story items' media and story groups'
// cover (both let the admin pick image OR video for the same field) —
// any future image/video upload field should reuse this instead of
// duplicating the preview+button markup inline.

import { useRef } from "react";

export default function MediaUploadField({
  label,
  accept,
  hint,
  previewUrl,
  isVideo,
  onSelect,
  uploading,
  hasValue,
  error,
}: {
  label: string;
  accept: string;
  hint: string;
  previewUrl: string | null;
  isVideo: boolean;
  onSelect: (file: File) => void;
  uploading: boolean;
  hasValue: boolean;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Video needs room for native play/seek/volume controls, so it gets
  // a wider stacked-above layout instead of image's small inline
  // thumbnail — controls are unusable at thumbnail size.
  return (
    <div className={isVideo ? "space-y-2 pb-1" : "flex items-center gap-3 pb-1"}>
      <div
        className={
          isVideo
            ? "w-full max-w-xs aspect-video rounded-xl border bg-black overflow-hidden flex items-center justify-center"
            : "w-20 h-14 rounded-xl border bg-[#f7f5f1] overflow-hidden flex items-center justify-center shrink-0"
        }
        style={{ borderColor: error ? "#f0997b" : "#e2ddd5" }}
      >
        {previewUrl ? (
          isVideo ? (
            <video src={previewUrl} className="w-full h-full" controls playsInline />
          ) : (
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
          )
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c0bab0" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-5-5L5 21" />
          </svg>
        )}
      </div>
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="cursor-pointer text-[11px] font-bold px-3 py-1.5 rounded-lg border border-[#e2ddd5] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors disabled:opacity-50"
        >
          {uploading ? "Uploading..." : hasValue ? `Change ${label}` : `Upload ${label}`}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onSelect(file);
            if (inputRef.current) inputRef.current.value = "";
          }}
          className="hidden"
        />
        <p className="text-[10px] text-[#a39e96] mt-1">{hint}</p>
        {error && <p className="text-[11px] font-medium text-[#D4300F] mt-1">{error}</p>}
      </div>
    </div>
  );
}
