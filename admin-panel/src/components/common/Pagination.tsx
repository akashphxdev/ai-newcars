// src/components/common/Pagination.tsx

const ACCENT = "#D4300F";

interface PaginationInfo {
  page: number;
  totalPages: number;
  total: number;
}

interface PaginationProps {
  pagination: PaginationInfo | null | undefined;
  onPageChange: (page: number) => void;
  variant?: "simple" | "compact" | "numbered";
  itemLabel?: string;
  currentCount?: number;
}

export default function Pagination({
  pagination,
  onPageChange,
  variant = "simple",
  itemLabel,
  currentCount,
}: PaginationProps) {
  if (!pagination) return null;
  const { page, totalPages, total } = pagination;

  const label =
    itemLabel && currentCount !== undefined ? (
      <p className="text-[11px] text-[#a39e96]">
        Showing {currentCount} of {total} {itemLabel}
      </p>
    ) : null;

  if (variant === "numbered") {
    if (totalPages <= 1) {
      return label ? (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#f0ece6]">{label}</div>
      ) : null;
    }
    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-[#f0ece6]">
        {label}
        <div className="flex items-center gap-1 ml-auto">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className="cursor-pointer w-7 h-7 rounded-lg text-[11px] font-bold flex items-center justify-center transition-colors"
              style={p === page ? { background: ACCENT, color: "white" } : { background: "#f7f5f1", color: "#7a7670" }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (totalPages <= 1) return null;

  if (variant === "compact") {
    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-[#f0ece6]">
        {label}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="cursor-pointer text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#f7f5f1] text-[#7a7670] disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-[11px] text-[#7a7670] px-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="cursor-pointer text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#f7f5f1] text-[#7a7670] disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  // variant === "simple"
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[#f0ece6]">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="cursor-pointer text-[11px] font-bold px-3 py-1.5 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors disabled:opacity-40"
      >
        Previous
      </button>
      <p className="text-[11px] text-[#a39e96]">
        Page {page} of {totalPages}
      </p>
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="cursor-pointer text-[11px] font-bold px-3 py-1.5 rounded-lg border border-[#e8e4dc] text-[#4a4640] hover:bg-[#f7f5f1] transition-colors disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}