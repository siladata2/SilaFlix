import React from 'react';

interface DataTableProps<T> {
  columns: string[];
  rows: T[];
  emptyMessage?: string;
  renderRow: (item: T, index: number) => React.ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  emptyMessage = 'No records found.',
  renderRow,
}: DataTableProps<T>) {
  if (!rows || rows.length === 0) {
    return (
      <div className="bg-bg-card border border-line rounded-xl p-8 text-center text-sm text-ink-dim">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="border border-line rounded-xl overflow-hidden bg-bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-bg-raised text-[12px] uppercase tracking-wider text-ink-dim border-b border-line">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="px-4 py-3 font-semibold">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">{rows.map(renderRow)}</tbody>
        </table>
      </div>
    </div>
  );
}
