// File: src/components/finance/GLPreviewPanel.js
import React, { useMemo } from 'react';
import Badge from '../shared/Badge';
import { formatCurrency } from '../../utils/formatters';

const safeNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export default function GLPreviewPanel({
  title = 'Posting Preview',
  lines = [], // [{ accountCode, accountName?, debit, credit, narration? }]
  summary,
  className = '',
}) {
  const totals = useMemo(() => {
    const debit = (lines || []).reduce((s, l) => s + safeNum(l.debit), 0);
    const credit = (lines || []).reduce((s, l) => s + safeNum(l.credit), 0);
    const diff = Math.abs(debit - credit);
    return { debit, credit, diff, ok: diff <= 0.5 };
  }, [lines]);

  return (
    <div className={['rounded-2xl border border-white/10 bg-white/5 p-4', className].join(' ')}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-white font-bold">{title}</div>
          {summary ? <div className="text-xs text-slate-400 mt-1">{summary}</div> : null}
        </div>
        <Badge tone={totals.ok ? 'good' : 'bad'}>{totals.ok ? 'BALANCED' : `DIFF ₦${totals.diff.toFixed(2)}`}</Badge>
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
        <div className="p-3 rounded-xl bg-black/20 border border-white/10">
          <div className="text-slate-400">Total Debit</div>
          <div className="text-white font-bold mt-1">{formatCurrency(totals.debit)}</div>
        </div>
        <div className="p-3 rounded-xl bg-black/20 border border-white/10">
          <div className="text-slate-400">Total Credit</div>
          <div className="text-white font-bold mt-1">{formatCurrency(totals.credit)}</div>
        </div>
        <div className="p-3 rounded-xl bg-black/20 border border-white/10">
          <div className="text-slate-400">Balance Check</div>
          <div className="text-white font-bold mt-1">{totals.ok ? 'OK' : 'CHECK'}</div>
        </div>
      </div>

      <div className="mt-4 overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/10">
            <tr>
              <th className="text-left py-2 pr-3">Account</th>
              <th className="text-left py-2 pr-3">Narration</th>
              <th className="text-right py-2 pr-3">Debit</th>
              <th className="text-right py-2">Credit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {(lines || []).map((l, idx) => (
              <tr key={idx} className="text-slate-200">
                <td className="py-2 pr-3 whitespace-nowrap">
                  <div className="font-mono text-xs text-slate-300">{l.accountCode || '—'}</div>
                  <div className="text-[11px] text-slate-400">{l.accountName || ''}</div>
                </td>
                <td className="py-2 pr-3 text-[12px] text-slate-300">
                  {l.narration || '—'}
                </td>
                <td className="py-2 pr-3 text-right font-mono">{formatCurrency(safeNum(l.debit))}</td>
                <td className="py-2 text-right font-mono">{formatCurrency(safeNum(l.credit))}</td>
              </tr>
            ))}

            {!lines?.length ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-500">
                  No preview lines
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}