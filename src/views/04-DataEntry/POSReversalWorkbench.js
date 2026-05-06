// src/views/04-DataEntry/POSReversalWorkbench.js
import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, RotateCcw } from 'lucide-react';
import HelpPanel from '../../components/shared/HelpPanel';
import { HelpLabel } from '../../components/shared/HelpTooltip';
import { getDailyEntries, requestSaleReversal, requestExpenseReversal, getPosReversals } from '../../api/dataEntryService';

const input = 'w-full rounded-xl bg-slate-900/70 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-sky-400';
const button = 'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed';
const card = 'rounded-2xl border border-white/10 bg-white/[0.04] p-4';
const money = (v) => `₦${Number(v || 0).toLocaleString()}`;

export default function POSReversalWorkbench() {
  const [summaryId, setSummaryId] = useState('');
  const [entries, setEntries] = useState({ sales: [], expenses: [] });
  const [reversals, setReversals] = useState([]);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const guide = useMemo(() => [
    { key: 'purpose', label: 'When to reverse', help: 'Use reversal when a sale or expense was captured incorrectly. Do not delete finance-impacting records.' },
    { key: 'prepost', label: 'Before GL posting', help: 'If the daily close is not yet posted, reversal voids the line, recalculates daily totals, and restores stock for sale reversals.' },
    { key: 'posted', label: 'After GL posting', help: 'If already posted, the workbench flags PENDING_GL_REVERSAL so Finance can reverse GL before correction.' },
    { key: 'maker', label: 'Maker-checker note', help: 'Maker-checker enforcement is intentionally excluded in this wave, per instruction.' },
  ], []);

  const load = async () => {
    setMessage(''); setBusy(true);
    try {
      const [r, list] = await Promise.all([summaryId ? getDailyEntries(summaryId) : Promise.resolve({ sales: [], expenses: [] }), getPosReversals({ limit: 100 })]);
      setEntries({ sales: r.sales || [], expenses: r.expenses || [] });
      setReversals(list.items || []);
    } catch (e) { setMessage(e.message || 'Failed to load reversal data.'); }
    finally { setBusy(false); }
  };
  useEffect(() => { getPosReversals({ limit: 100 }).then((r) => setReversals(r.items || [])).catch(() => {}); }, []);

  const reverse = async (type, id) => {
    if (!summaryId) return setMessage('Enter Daily Summary ID first.');
    if (!reason.trim()) return setMessage('Enter a reversal reason.');
    setBusy(true); setMessage('');
    try {
      const res = type === 'SALE' ? await requestSaleReversal(summaryId, id, { reason }) : await requestExpenseReversal(summaryId, id, { reason });
      setMessage(res?.reversal?.resultMessage || 'Reversal request captured.');
      setReason('');
      await load();
    } catch (e) { setMessage(e.message || 'Reversal failed.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-6 text-slate-100">
      <div><h1 className="text-2xl font-bold">POS Reversal Workbench</h1><p className="text-sm text-slate-400">Reverse sales and expenses safely without deleting audit history.</p></div>
      <HelpPanel title="POS Reversal Operations Guide" items={guide} defaultOpen />
      {message ? <div className="rounded-xl border border-sky-400/30 bg-sky-500/10 p-3 text-sm text-sky-100">{message}</div> : null}
      <div className={`${card} grid grid-cols-1 md:grid-cols-3 gap-3`}>
        <label className="space-y-1 md:col-span-2"><HelpLabel text="Use the daily summary Mongo ID or public dailySummaryId from the Close Workbench/control pack.">Daily Summary ID</HelpLabel><input className={input} value={summaryId} onChange={(e) => setSummaryId(e.target.value)} /></label>
        <div className="flex items-end"><button className={`${button} bg-sky-600 hover:bg-sky-500 w-full justify-center`} disabled={busy} onClick={load}><RefreshCw size={16}/> Load entries</button></div>
        <label className="space-y-1 md:col-span-3"><HelpLabel text="Reason is mandatory and becomes part of the audit trail.">Reversal reason</HelpLabel><input className={input} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Wrong amount, duplicate entry, failed customer payment, etc." /></label>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className={card}><h3 className="font-semibold mb-3">Sales</h3><div className="space-y-2">{entries.sales.map((s) => <div key={s._id || s.id} className="rounded-xl bg-slate-900/50 border border-white/10 p-3 flex items-center justify-between gap-3"><div><div className="font-semibold">{s.receiptNumber || s._id}</div><div className="text-xs text-slate-400">{s.kgSold || s.quantity}kg • {s.paymentMethod} • {money(s.totalRevenue || s.amount)} • {s.status}</div></div><button disabled={busy || s.voiding?.isVoided || ['voided','reversed'].includes(s.status)} className={`${button} bg-rose-600 hover:bg-rose-500`} onClick={() => reverse('SALE', s._id)}><RotateCcw size={14}/> Reverse</button></div>)}</div></div>
        <div className={card}><h3 className="font-semibold mb-3">Expenses</h3><div className="space-y-2">{entries.expenses.map((e) => <div key={e._id || e.id} className="rounded-xl bg-slate-900/50 border border-white/10 p-3 flex items-center justify-between gap-3"><div><div className="font-semibold">{e.description}</div><div className="text-xs text-slate-400">{e.category} • {e.paymentDisposition} • {money(e.amount)} • {e.status}</div></div><button disabled={busy || e.voiding?.isVoided || ['voided','reversed'].includes(e.status)} className={`${button} bg-rose-600 hover:bg-rose-500`} onClick={() => reverse('EXPENSE', e._id)}><RotateCcw size={14}/> Reverse</button></div>)}</div></div>
      </div>

      <div className={card}><h3 className="font-semibold mb-3">Recent Reversal Requests</h3><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-slate-400"><tr><th className="text-left p-2">Date</th><th className="text-left p-2">Type</th><th className="text-left p-2">Status</th><th className="text-right p-2">Amount</th><th className="text-left p-2">Reason</th></tr></thead><tbody>{reversals.map((r) => <tr key={r._id || r.reversalId} className="border-t border-white/5"><td className="p-2">{String(r.createdAt || '').slice(0,10)}</td><td className="p-2">{r.sourceType}</td><td className="p-2">{r.status}</td><td className="p-2 text-right">{money(r.amount)}</td><td className="p-2">{r.reason}</td></tr>)}</tbody></table></div></div>
    </div>
  );
}
