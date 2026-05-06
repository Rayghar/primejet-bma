// src/views/01-Finance/PriceOverrideWorkbench.js
import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, RefreshCw, XCircle } from 'lucide-react';
import HelpPanel from '../../components/shared/HelpPanel';
import { approvePriceOverride, listPriceOverrideRequests, rejectPriceOverride } from '../../api/inventoryService';

const card = 'rounded-2xl border border-white/10 bg-white/[0.04] p-4';
const button = 'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed';
const money = (v) => `₦${Number(v || 0).toLocaleString()}`;

export default function PriceOverrideWorkbench() {
  const [rows, setRows] = useState([]); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  const guide = useMemo(() => [
    { key: 'why', label: 'Why this exists', help: 'Cashiers cannot log a sale below/above the configured branch price unless a price override has been approved.' },
    { key: 'no-maker-checker', label: 'No maker-checker in this wave', help: 'Approval is available, but same-user maker-checker blocking is intentionally not enforced in this implementation.' },
    { key: 'expiry', label: 'Expiry', help: 'Overrides can expire and are marked USED once attached to a sale.' },
  ], []);
  const load = async () => { setBusy(true); try { const r = await listPriceOverrideRequests({ limit: 200 }); setRows(r.items || []); } catch (e) { setMessage(e.message || 'Failed to load override requests.'); } finally { setBusy(false); } };
  useEffect(() => { load(); }, []);
  const run = async (fn) => { setBusy(true); setMessage(''); try { await fn(); setMessage('Action completed.'); await load(); } catch (e) { setMessage(e.message || 'Action failed.'); } finally { setBusy(false); } };
  return <div className="space-y-6 text-slate-100"><div><h1 className="text-2xl font-bold">Price Override Workbench</h1><p className="text-sm text-slate-400">Approve or reject cashier price override requests.</p></div><HelpPanel title="Price Override Operations Guide" items={guide} defaultOpen />{message ? <div className="rounded-xl border border-sky-400/30 bg-sky-500/10 p-3 text-sm text-sky-100">{message}</div> : null}<div className={card}><div className="mb-3 flex justify-between"><h3 className="font-semibold">Override Requests</h3><button className={`${button} bg-slate-700`} onClick={load}><RefreshCw size={14}/> Refresh</button></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-slate-400"><tr><th className="text-left p-2">Date</th><th className="text-left p-2">Branch</th><th className="text-left p-2">Product</th><th className="text-right p-2">Configured</th><th className="text-right p-2">Requested</th><th className="text-left p-2">Status</th><th className="text-left p-2">Reason</th><th className="text-right p-2">Actions</th></tr></thead><tbody>{rows.map((r) => <tr key={r._id || r.overrideId} className="border-t border-white/5"><td className="p-2">{String(r.businessDate || r.createdAt || '').slice(0,10)}</td><td className="p-2">{r.branchId}</td><td className="p-2">{r.productSku || r.productId || 'LPG'}</td><td className="p-2 text-right">{money(r.configuredPricePerKg)}</td><td className="p-2 text-right">{money(r.requestedPricePerKg)}</td><td className="p-2">{r.status}</td><td className="p-2">{r.reason}</td><td className="p-2"><div className="flex justify-end gap-2"><button disabled={busy || r.status !== 'REQUESTED'} className={`${button} bg-emerald-600`} onClick={() => run(() => approvePriceOverride(r.overrideId, { comment: 'Approved from workbench' }))}><CheckCircle size={14}/> Approve</button><button disabled={busy || r.status !== 'REQUESTED'} className={`${button} bg-rose-600`} onClick={() => run(() => rejectPriceOverride(r.overrideId, { reason: 'Rejected from workbench' }))}><XCircle size={14}/> Reject</button></div></td></tr>)}</tbody></table></div></div></div>;
}
