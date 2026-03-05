// File: src/components/finance/JournalViewerModal.js
import React from 'react';
import Button from '../shared/Button';
import Badge from '../shared/Badge';
import { formatCurrency } from '../../utils/formatters';

const safeNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export default function JournalViewerModal({ open, onClose, entry }) {
  if (!open) return null;

  const lines = Array.isArray(entry?.lines) ? entry.lines : [];
  const debit = lines.reduce((s, l) => s + safeNum(l.debit), 0);
  const credit = lines.reduce((s, l) => s + safeNum(l.credit), 0);
  const ok = Math.abs(debit - credit) <= 0.5;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-[#0b1224] border border-white/10 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-start justify-between gap-3">
          <div>
            <div className="text-white font-bold">Journal Entry</div>
            <div className="text-xs text-slate-400 mt-1">
              {entry?.sourceType ? `${entry.sourceType}` : '—'} • {entry?.sourceId ? `${entry.sourceId}` : '—'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Date: {entry?.date ? new Date(entry.date).toISOString().slice(0, 10) : '—'} • Branch:{' '}
              {entry?.branchKey || entry?.branchId || '—'} • Status: {entry?.status || '—'}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge tone={ok ? 'good' : 'bad'}>{ok ? 'BALANCED' : 'UNBALANCED'}</Badge>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-slate-400">Total Debit</div>
              <div className="text-white font-bold mt-1">{formatCurrency(debit)}</div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-slate-400">Total Credit</div>
              <div className="text-white font-bold mt-1">{formatCurrency(credit)}</div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-slate-400">Narration</div>
              <div className="text-slate-200 mt-1 text-[12px]">{entry?.narration || '—'}</div>
            </div>
          </div>

          <div className="mt-4 overflow-auto rounded-2xl border border-white/10">
            <table className="min-w-full text-sm">
              <thead className="bg-black/30 text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/10">
                <tr>
                  <th className="text-left px-4 py-3">Account</th>
                  <th className="text-left px-4 py-3">Narration</th>
                  <th className="text-right px-4 py-3">Debit</th>
                  <th className="text-right px-4 py-3">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {lines.map((l, idx) => (
                  <tr key={idx} className="text-slate-200">
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-slate-300">{l.accountCode || '—'}</div>
                      {l.accountName ? <div className="text-[11px] text-slate-500">{l.accountName}</div> : null}
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-[12px]">{l.narration || '—'}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(safeNum(l.debit))}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(safeNum(l.credit))}</td>
                  </tr>
                ))}

                {!lines.length ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      No lines found
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}