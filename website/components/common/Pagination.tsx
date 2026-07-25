import type { Pagination as PaginationInfo } from "@/lib/apiClient";

const ORANGE = "#f2650f";
const BORDER = "#e5e7eb";
const MUTED = "#6b7280";

// Plain server-rendered <a> links (?page=N) — no client JS needed, works
// with the page's own server-side data fetch on navigation. Reusable for
// any future "view all X" listing page, not just cars.
export default function Pagination({
  pagination,
  basePath,
  queryParams,
}: {
  pagination: PaginationInfo;
  basePath: string;
  /** Extra query params (filters, etc.) to keep on every page link. */
  queryParams?: Record<string, string>;
}) {
  const { page, totalPages } = pagination;

  if (totalPages <= 1) return null;

  const pageHref = (p: number) => {
    const params = new URLSearchParams(queryParams);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
      <a
        href={pageHref(page - 1)}
        aria-disabled={page <= 1}
        className="rounded-xl px-4 py-2 text-[13px] font-bold transition-colors hover:bg-orange-50"
        style={{
          border: `1px solid ${BORDER}`,
          color: page <= 1 ? MUTED : ORANGE,
          pointerEvents: page <= 1 ? "none" : "auto",
          opacity: page <= 1 ? 0.5 : 1,
        }}
      >
        Previous
      </a>

      <span className="text-[13px] font-semibold" style={{ color: MUTED }}>
        Page {page} of {totalPages}
      </span>

      <a
        href={pageHref(page + 1)}
        aria-disabled={page >= totalPages}
        className="rounded-xl px-4 py-2 text-[13px] font-bold transition-colors hover:bg-orange-50"
        style={{
          border: `1px solid ${BORDER}`,
          color: page >= totalPages ? MUTED : ORANGE,
          pointerEvents: page >= totalPages ? "none" : "auto",
          opacity: page >= totalPages ? 0.5 : 1,
        }}
      >
        Next
      </a>
    </nav>
  );
}
