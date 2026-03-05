// File: src/components/shared/Table.js
import React from 'react';

export default function Table({
  columns = [], // [{ key, title, className?, render?: (row)=>node }]
  rows = [],
  keyField = 'id',
  className = '',
  rowClassName,
  onRowClick,
}) {
  return (
    <div className={['rounded-2xl border border-white/10 bg-white/5 overflow-hidden', className].join(' ')}>
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-black/20 border-b border-white/10">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={[
                    'text-left px-4 py-3 text-[11px] uppercase tracking-wider text-slate-400 font-semibold whitespace-nowrap',
                    c.className || '',
                  ].join(' ')}
                >
                  {c.title}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5">
            {rows.map((row, idx) => {
              const key = row?.[keyField] ?? `${idx}`;
              const clickable = typeof onRowClick === 'function';
              const rc = typeof rowClassName === 'function' ? rowClassName(row) : rowClassName;

              return (
                <tr
                  key={key}
                  onClick={clickable ? () => onRowClick(row) : undefined}
                  className={[
                    clickable ? 'cursor-pointer hover:bg-white/5' : '',
                    rc || '',
                  ].join(' ')}
                >
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3 text-slate-200 whitespace-nowrap">
                      {c.render ? c.render(row) : row?.[c.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              );
            })}

            {!rows.length ? (
              <tr>
                <td colSpan={columns.length || 1} className="px-4 py-8 text-center text-slate-500">
                  No rows
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}