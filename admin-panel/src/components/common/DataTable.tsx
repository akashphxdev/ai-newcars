// src/components/common/DataTable.tsx
import { Fragment, useState, type ReactNode } from "react";

export interface DataTableColumn<T> {
  header: string;
  align?: "left" | "right";
  className?: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  // Optional: click a row to expand it and show full record detail below
  // (e.g. every spec field, not just the columns shown in the table).
  // Omit both props and DataTable behaves exactly as before.
  expandable?: boolean;
  renderExpanded?: (row: T) => ReactNode;
}

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  error = "",
  emptyMessage = "No records found.",
  loadingMessage = "Loading...",
  expandable = false,
  renderExpanded,
}: DataTableProps<T>) {
  const [expandedKey, setExpandedKey] = useState<string | number | null>(null);
  const canExpand = expandable && !!renderExpanded;
  const colSpan = canExpand ? columns.length + 1 : columns.length;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="bg-[#f7f5f1] border-b border-[#f0ece6]">
            {canExpand && <th className="w-8 px-2 py-3" aria-hidden="true" />}
            {columns.map((col, i) => (
              <th
                key={i}
                className={`text-[10px] font-bold uppercase tracking-wider text-[#a39e96] px-4 py-3 whitespace-nowrap ${
                  col.align === "right" ? "text-right" : "text-left"
                } ${col.className ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={colSpan} className="px-4 py-10 text-center text-[#a39e96] text-[12px]">
                {loadingMessage}
              </td>
            </tr>
          )}

          {!loading && error && (
            <tr>
              <td colSpan={colSpan} className="px-4 py-10 text-center text-[#D4300F] text-[12px] font-medium">
                {error}
              </td>
            </tr>
          )}

          {!loading && !error && rows.length === 0 && (
            <tr>
              <td colSpan={colSpan} className="px-4 py-10 text-center text-[#a39e96] text-[12px]">
                {emptyMessage}
              </td>
            </tr>
          )}

          {!loading &&
            !error &&
            rows.map((row) => {
              const key = rowKey(row);
              const isExpanded = canExpand && expandedKey === key;
              return (
                <Fragment key={key}>
                  <tr
                    onClick={canExpand ? () => setExpandedKey(isExpanded ? null : key) : undefined}
                    className={`border-b border-[#f7f5f1] hover:bg-[#fef9f8] transition-colors ${
                      canExpand ? "cursor-pointer" : ""
                    }`}
                  >
                    {canExpand && (
                      <td className="px-2 py-3 text-center">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          className={`text-[#a39e96] transition-transform inline-block ${
                            isExpanded ? "rotate-90" : ""
                          }`}
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </td>
                    )}
                    {columns.map((col, i) => (
                      <td
                        key={i}
                        className={`px-4 py-3 ${col.align === "right" ? "text-right" : ""} ${col.className ?? ""}`}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                  {isExpanded && (
                    <tr className="bg-[#fafaf8] border-b border-[#f0ece6]">
                      <td colSpan={colSpan} className="px-6 py-4">
                        {renderExpanded!(row)}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}