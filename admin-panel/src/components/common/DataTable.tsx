// src/components/common/DataTable.tsx
import type { ReactNode } from "react";

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
}

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  error = "",
  emptyMessage = "No records found.",
  loadingMessage = "Loading...",
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="bg-[#f7f5f1] border-b border-[#f0ece6]">
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
              <td colSpan={columns.length} className="px-4 py-10 text-center text-[#a39e96] text-[12px]">
                {loadingMessage}
              </td>
            </tr>
          )}

          {!loading && error && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-[#D4300F] text-[12px] font-medium">
                {error}
              </td>
            </tr>
          )}

          {!loading && !error && rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-[#a39e96] text-[12px]">
                {emptyMessage}
              </td>
            </tr>
          )}

          {!loading &&
            !error &&
            rows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-[#f7f5f1] hover:bg-[#fef9f8] transition-colors">
                {columns.map((col, i) => (
                  <td
                    key={i}
                    className={`px-4 py-3 ${col.align === "right" ? "text-right" : ""} ${col.className ?? ""}`}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}