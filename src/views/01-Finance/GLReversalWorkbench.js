import React, { useEffect, useState } from 'react';
import { RotateCcw, RefreshCw, ShieldAlert, Lock, Unlock, CalendarDays } from 'lucide-react';
import { getBranchOptions } from '../../api/userService';
import {
  glListJournals,
  glRequestReversal,
  glListReversalRequests,
  glApproveReversalRequest,
  glRejectReversalRequest,
  glListPeriods,
  glLockPeriod,
  glReopenPeriod,
  glGenerateFiscalPeriods,
} from '../../api/glService';

const today = () => new Date().toISOString().slice(0, 10);
const dateStr = (d) => d.toISOString().slice(0, 10);
const monthStart = () => dateStr(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
const lastMonthStart = () => dateStr(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1));
const lastMonthEnd = () => dateStr(new Date(new Date().getFullYear(), new Date().getMonth(), 0));
const quarterStart = () => { const n = new Date(); return dateStr(new Date(n.getFullYear(), Math.floor(n.getMonth() / 3) * 3, 1)); };
const yearStart = () => dateStr(new Date(new Date().getFullYear(), 0, 1));
const money = (v) => `₦${Number(v || 0).toLocaleString()}`;
const fmt = (d) => (d ? String(d).slice(0, 10) : '—');

function Panel({ title, icon: Icon, children }) {
  return <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4"><h2 className="font-bold text-white mb-3 flex items-center gap-2">{Icon ? <Icon size={18}/> : null}{title}</h2>{children}</div>;
}

function Badge({ children, tone }) {
  const cls = tone === 'bad' ? 'bg-red-500/10 border-red-500/20 text-red-200' : tone === 'warn' ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' : tone === 'good' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200' : 'bg-slate-700/60 border-white/10 text-slate-200';
  return <span className={`px-2 py-1 rounded-full border text-xs font-semibold ${cls}`}>{children}</span>;
}

export default function GLReversalWorkbench() {
  const [periodPreset, setPeriodPreset] = useState('thisMonth');
  const [filters, setFilters] = useState({ startDate: monthStart(), endDate: today(), branchIdOrZoneId: '' });
  const [branchOptions, setBranchOptions] = useState([]);
  const [journals, setJournals] = useState([]);
  const [requests, setRequests] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');


  const applyPreset = (preset) => {
    setPeriodPreset(preset);
    if (preset === 'custom') return;
    const next = { ...filters };
    if (preset === 'thisMonth') { next.startDate = monthStart(); next.endDate = today(); }
    if (preset === 'lastMonth') { next.startDate = lastMonthStart(); next.endDate = lastMonthEnd(); }
    if (preset === 'thisQuarter') { next.startDate = quarterStart(); next.endDate = today(); }
    if (preset === 'thisYear') { next.startDate = yearStart(); next.endDate = today(); }
    setFilters(next);
  };

  const loadBranchOptions = async () => {
    try {
      const rows = await getBranchOptions();
      setBranchOptions((Array.isArray(rows) ? rows : [])
        .map((b) => ({ id: b.id || b._id || b.branchId || b.value, name: b.name || b.branchName || b.label || b.code || 'Unnamed Branch' }))
        .filter((b) => b.id));
    } catch (e) {
      console.error('Failed to load GL reversal branch options:', e);
      setBranchOptions([]);
    }
  };

  const journalDebit = (j) => Number(j?.totals?.debit || j?.totalDebit || j?.debit || j?.debitAmount || 0);
  const journalCredit = (j) => Number(j?.totals?.credit || j?.totalCredit || j?.credit || j?.creditAmount || 0);

  const load = async () => {
    setLoading(true); setError(''); setMessage('');
    try {
      const [j, r, p] = await Promise.all([
        glListJournals({ ...filters, limit: 25 }),
        glListReversalRequests({ limit: 25 }),
        glListPeriods({}),
      ]);
      setJournals(Array.isArray(j?.items) ? j.items : Array.isArray(j) ? j : []);
      setRequests(Array.isArray(r?.items) ? r.items : Array.isArray(r) ? r : []);
      setPeriods(Array.isArray(p?.items) ? p.items : Array.isArray(p) ? p : []);
    } catch (e) { setError(e.message || 'Failed to load GL reversal workbench.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadBranchOptions(); load(); /* eslint-disable-next-line */ }, []);

  const requestReverse = async (journal) => {
    const reason = window.prompt('Reason for requesting reversal? This is required for audit.');
    if (!reason) return;
    setBusy(`request-${journal._id}`); setError(''); setMessage('');
    try { await glRequestReversal({ journalId: journal._id, reason }); setMessage('Reversal request submitted.'); await load(); }
    catch (e) { setError(e.message || 'Failed to request reversal.'); }
    finally { setBusy(''); }
  };

  const approveRequest = async (req) => {
    const comment = window.prompt('Approval comment (optional).') || '';
    setBusy(`approve-${req._id}`); setError(''); setMessage('');
    try { await glApproveReversalRequest({ requestId: req._id, comment, unpostSource: true }); setMessage('Reversal request approved and reversal posted.'); await load(); }
    catch (e) { setError(e.message || 'Failed to approve reversal.'); }
    finally { setBusy(''); }
  };

  const rejectRequest = async (req) => {
    const comment = window.prompt('Rejection reason is required.');
    if (!comment) return;
    setBusy(`reject-${req._id}`); setError(''); setMessage('');
    try { await glRejectReversalRequest({ requestId: req._id, comment }); setMessage('Reversal request rejected.'); await load(); }
    catch (e) { setError(e.message || 'Failed to reject reversal.'); }
    finally { setBusy(''); }
  };

  const generatePeriods = async () => {
    const year = window.prompt('Fiscal year to generate?', new Date().getFullYear());
    if (!year) return;
    setBusy('periods'); setError(''); setMessage('');
    try { await glGenerateFiscalPeriods({ year }); setMessage(`Fiscal periods generated for ${year}.`); await load(); }
    catch (e) { setError(e.message || 'Failed to generate fiscal periods.'); }
    finally { setBusy(''); }
  };

  const lockPeriod = async (periodKey) => {
    const reason = window.prompt(`Reason for locking ${periodKey}?`);
    if (!reason) return;
    setBusy(`lock-${periodKey}`); setError(''); setMessage('');
    try { await glLockPeriod({ periodKey, reason }); setMessage(`${periodKey} locked.`); await load(); }
    catch (e) { setError(e.message || 'Failed to lock period.'); }
    finally { setBusy(''); }
  };

  const reopenPeriod = async (periodKey) => {
    const reason = window.prompt(`Reason for reopening ${periodKey}?`);
    if (!reason) return;
    setBusy(`reopen-${periodKey}`); setError(''); setMessage('');
    try { await glReopenPeriod({ periodKey, reason }); setMessage(`${periodKey} reopened.`); await load(); }
    catch (e) { setError(e.message || 'Failed to reopen period.'); }
    finally { setBusy(''); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">GL Reversal & Period Lock Workbench</h1>
          <p className="text-sm text-slate-400">Controlled reversal request, approval and accounting period lock operations. Posted records should be corrected through reversal, not deletion.</p>
        </div>
        <button onClick={load} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2"><RefreshCw size={16}/>Refresh</button>
      </div>

      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-100">
        <b>Where to reverse GL entries:</b> use the <b>Recent GL Journals</b> table below. Select period/branch, click <b>Request reversal</b> on the posted journal, then approve the request in <b>Reversal Requests</b> using an authorized finance/admin user. Direct deletion of posted GL journals should not be used.
      </div>

      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <label className="text-sm text-slate-300">Period
            <select className="mt-1 w-full bg-slate-950 border border-white/10 rounded-xl p-2 text-white" value={periodPreset} onChange={(e)=>applyPreset(e.target.value)}>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="thisQuarter">This Quarter</option>
              <option value="thisYear">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </label>
          <label className="text-sm text-slate-300">Start Date<input className="mt-1 w-full bg-slate-950 border border-white/10 rounded-xl p-2 text-white" type="date" value={filters.startDate} onChange={(e)=>{ setPeriodPreset('custom'); setFilters({...filters,startDate:e.target.value}); }}/></label>
          <label className="text-sm text-slate-300">End Date<input className="mt-1 w-full bg-slate-950 border border-white/10 rounded-xl p-2 text-white" type="date" value={filters.endDate} onChange={(e)=>{ setPeriodPreset('custom'); setFilters({...filters,endDate:e.target.value}); }}/></label>
          <label className="text-sm text-slate-300">Branch / Plant
            <select className="mt-1 w-full bg-slate-950 border border-white/10 rounded-xl p-2 text-white" value={filters.branchIdOrZoneId} onChange={(e)=>setFilters({...filters,branchIdOrZoneId:e.target.value})}>
              <option value="">All Branches</option>
              {branchOptions.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
          <div className="flex items-end"><button onClick={load} className="w-full px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white">Apply Filters</button></div>
        </div>
        <p className="text-xs text-slate-500">Filters apply to Recent GL Journals. Reversal requests remain visible as an approval queue.</p>
      </div>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-200">{error}</div>}
      {message && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-200">{message}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Panel title="Recent GL Journals" icon={RotateCcw}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-400"><tr><th className="text-left p-2">Date</th><th className="text-left p-2">Source</th><th className="text-right p-2">Debit</th><th className="text-right p-2">Credit</th><th className="text-left p-2">Status</th><th className="text-right p-2">Action</th></tr></thead>
              <tbody>
                {journals.map((j) => <tr key={j._id} className="border-t border-white/5"><td className="p-2">{fmt(j.date || j.createdAt)}</td><td className="p-2 text-slate-300">{j.sourceType || j.narration || 'Journal'}</td><td className="p-2 text-right">{money(journalDebit(j))}</td><td className="p-2 text-right">{money(journalCredit(j))}</td><td className="p-2"><Badge tone={String(j.status).toUpperCase()==='POSTED'?'good':'neutral'}>{j.status || 'POSTED'}</Badge></td><td className="p-2 text-right"><button disabled={busy || String(j.status).toUpperCase()==='REVERSED'} onClick={()=>requestReverse(j)} className="px-3 py-1.5 rounded-lg bg-amber-600 disabled:bg-slate-700 text-white text-xs">Request reversal</button></td></tr>)}
                {!loading && journals.length === 0 ? <tr><td colSpan={6} className="p-4 text-slate-400">No journals found for selected filters.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Reversal Requests" icon={ShieldAlert}>
          <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
            {requests.length === 0 ? <p className="text-slate-400">No reversal requests found.</p> : null}
            {requests.map((r) => {
              const st = String(r.status || '').toUpperCase();
              return <div key={r._id} className="border border-white/10 rounded-xl p-3 bg-slate-950/50"><div className="flex justify-between gap-2"><p className="text-white font-semibold">{r.journalId?._id || r.journalId || r.glEntryId || r._id}</p><Badge tone={st==='APPROVED'?'good':st==='REJECTED'?'bad':'warn'}>{st || 'PENDING'}</Badge></div><p className="text-xs text-slate-400 mt-1">Reason: {r.reason || '—'}</p><p className="text-xs text-slate-500">Requested: {fmt(r.createdAt)} · By: {r.requestedBy || 'system'}</p>{st === 'PENDING' ? <div className="flex gap-2 mt-3"><button onClick={()=>approveRequest(r)} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs">Approve</button><button onClick={()=>rejectRequest(r)} className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs">Reject</button></div> : null}</div>;
            })}
          </div>
        </Panel>
      </div>

      <Panel title="Accounting Period Locks" icon={CalendarDays}>
        <div className="flex justify-between items-center mb-3 gap-3">
          <p className="text-sm text-slate-400">Lock periods after month-end sign-off to prevent accidental posting into closed accounting periods.</p>
          <button onClick={generatePeriods} className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm">Generate periods</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {periods.map((p) => {
            const locked = String(p.status || '').toUpperCase() === 'LOCKED';
            return <div key={p.periodKey || p._id} className="border border-white/10 rounded-xl p-3 bg-slate-950/50"><div className="flex justify-between"><p className="text-white font-bold">{p.periodKey}</p><Badge tone={locked ? 'bad' : 'good'}>{p.status || 'OPEN'}</Badge></div><p className="text-xs text-slate-500 mt-1">Locked: {p.lockedAt ? fmt(p.lockedAt) : '—'}</p><button disabled={busy} onClick={()=>locked ? reopenPeriod(p.periodKey) : lockPeriod(p.periodKey)} className={`mt-3 w-full px-3 py-2 rounded-xl text-white text-sm flex items-center justify-center gap-2 ${locked ? 'bg-amber-600' : 'bg-red-600'}`}>{locked ? <Unlock size={15}/> : <Lock size={15}/>} {locked ? 'Reopen' : 'Lock'}</button></div>;
          })}
          {!loading && periods.length === 0 ? <p className="text-slate-400">No accounting periods configured yet.</p> : null}
        </div>
      </Panel>
    </div>
  );
}
