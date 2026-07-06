// src/components/common/ConfirmDialog.tsx
import { useEffect, useState } from "react";

const ACCENT = "#D4300F";
const WAIT_SECONDS = 3;

interface ConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  itemName?: string | null;
  message?: string;
  loading?: boolean;
  waitSeconds?: number;
}

export default function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title = "Delete this item?",
  itemName,
  message,
  loading = false,
  waitSeconds = WAIT_SECONDS,
}: ConfirmDialogProps) {
  const [secondsLeft, setSecondsLeft] = useState(waitSeconds);

  const [resetForOpen, setResetForOpen] = useState(open);

  if (open !== resetForOpen) {
    setResetForOpen(open);
    if (open) setSecondsLeft(waitSeconds);
  }

  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [open]);

  if (!open) return null;

  const canConfirm = secondsLeft === 0 && !loading;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <div className="w-full max-w-[420px] bg-white border border-[#e8e4dc] rounded-2xl shadow-xl p-6">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4300F" strokeWidth="2">
              <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            </svg>
          </div>
          <div>
            <h2 className="text-[#1c1a17] text-base font-black">{title}</h2>
            <p className="text-[#7a7670] text-[12.5px] mt-1.5 leading-relaxed">
              {message ?? (
                <>
                  {itemName ? (
                    <>
                      <span className="font-semibold text-[#1c1a17]">{itemName}</span> will be
                      permanently deleted. This action cannot be undone.
                    </>
                  ) : (
                    "This action cannot be undone."
                  )}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 pt-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="cursor-pointer flex-1 py-2.5 rounded-xl text-sm font-bold text-[#4a4640] border border-[#e2ddd5] hover:bg-[#f7f5f1] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm}
            className="cursor-pointer flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ background: ACCENT }}
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Deleting...
              </>
            ) : secondsLeft > 0 ? (
              `Delete (${secondsLeft})`
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}