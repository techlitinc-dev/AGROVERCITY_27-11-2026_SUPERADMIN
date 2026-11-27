import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  error?: string | null;
  empty?: string;
  sortKey?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  minWidth?: number;
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  rowKey,
  loading,
  error,
  empty = 'No records found.',
  sortKey,
  sortOrder,
  onSort,
  onRowClick,
  minWidth = 720,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
            {columns.map((c) => (
              <th key={c.key} className="py-2 pr-4 font-semibold">
                {c.sortable && onSort ? (
                  <button
                    type="button"
                    onClick={() => onSort(c.key)}
                    className={`inline-flex items-center gap-1 uppercase tracking-wide transition hover:text-emerald-700 ${
                      sortKey === c.key ? 'text-emerald-700' : ''
                    }`}
                  >
                    {c.label}
                    <span className="text-[9px]">
                      {sortKey === c.key ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                  </button>
                ) : (
                  c.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            [...Array(5)].map((_, i) => (
              <tr key={i} className="border-b border-slate-100">
                {columns.map((c) => (
                  <td key={c.key} className="py-3 pr-4">
                    <div className="h-4 w-full max-w-32 rounded shimmer-bg" />
                  </td>
                ))}
              </tr>
            ))
          ) : error ? (
            <tr>
              <td colSpan={columns.length} className="py-6 text-center text-xs text-red-600" role="alert">
                {error}
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-8 text-center text-xs text-slate-400">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-slate-100 last:border-0 ${onRowClick ? 'cursor-pointer transition-colors hover:bg-emerald-50/40' : ''}`}
              >
                {columns.map((c) => (
                  <td key={c.key} className="py-2.5 pr-4 text-slate-700">
                    {c.render ? c.render(row) : String(row[c.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
