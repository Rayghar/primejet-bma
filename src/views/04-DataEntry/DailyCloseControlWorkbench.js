import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardCheck, Eye, RefreshCw, ShieldCheck } from 'lucide-react';
import {
  getDailyCloseActionList,
  getDailyCloseControlPack,
  approveSummary,
  rejectSummary,
  reopenSummary,
} from '../../api/dataEntryService';
import { glPostApproved } from '../../api/glService';
import HelpPanel from '../../components/shared/HelpPanel';
import { HelpLabel } from '../../components/shared/HelpTooltip';
import { POS_CLOSE_CONTROL_HELP } from '../../utils/helpCatalog';

const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
const money = (v) => `₦${Number(v || 0).toLocaleString()}`;
const fmt = (d) => (d ? String(d).slice(0, 10) : '—');

const badgeClass = (tone) => {
  if (tone === 'CRITICAL' || tone === 'bad') return 'bg-red-500/10 border-red-500/20 text-red-200';
  if (tone === 'HIGH' || tone === 'warn') return 'bg-amber-500/10 border-amber-500/20 text-amber-200';
  if (tone === 'good') return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200';
  return 'bg-slate-700/50 border-white/10 text-slate-200';
};

function Pill({ children, tone }) {
  return <span className={`px-2 py-1 rounded-full border text-xs font-semibold ${badgeClass(tone)}`}>{children}</span>;
}

function Panel({ title, children, icon: Icon }) {
  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4">
      <h2 className="font-bold text-white mb-3 flex items-center gap-2">{Icon ? <Icon size={18} /> : null}{title}</h2>
      {children}
    </div>
  );
}

export default function DailyCloseControlWorkbench({ setActiveView }) {
  const [filters, setFilters] = useState({ startDate: monthStart(), endDate: today(), branchIdOrZoneId: '' });
  const [actionList, setActionList] = useState(null);
  const [selectedId, setSelectedId] = useState('');
  const [controlPack, setControlPack] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const items = useMemo(() => Array.isArray(actionList?.items) ? actionList.items : [], [actionList]);
  const selected = controlPack?.summary || null;
  const controls = controlPack?.controls || null;

  const loadActions = async () => {
    setLoading(true); setError(''); setMessage('');
    try {
      const data = await getDailyCloseActionList(filters);
      setActionList(data);
      if (!selectedId && data?.items?.[0]?.summaryId) {
        setSelectedId(data.items[0].summaryId);
      }
    } catch (e) { setError(e.message || 'Failed to load daily close action list.'); }
    finally { setLoading(false); }
  };

  const loadControlPack = async (id = selectedId) => {
    if (!id) { setControlPack(null); return; }
    setBusy('load-pack'); setError(''); setMessage('');
    try { setControlPack(await getDailyCloseControlPack(id)); }
    catch (e) { setError(e.message || 'Failed to load daily close control pack.'); }
    finally { setBusy(''); }
  };

  useEffect(() => { loadActions(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { if (selectedId) loadControlPack(selectedId); /* eslint-disable-next-line */ }, [selectedId]);

  const refreshAll = async () => { await loadActions(); if (selectedId) await loadControlPack(selectedId); };

  const doApprove = async () => {
    if (!selected?._id) return;
    const comment = window.prompt('Approval comment (optional).') || '';
    setBusy('approve'); setError(''); setMessage('');
    try { await approveSummary(selected._id, { comment }); setMessage('Daily close approved.'); await refreshAll(); }
    catch (e) { setError(e.message || 'Approval failed.'); }
    finally { setBusy(''); }
  };

  const doReject = async () => {
    if (!selected?._id) return;
    const reason = window.prompt('Rejection reason is required.');
    if (!reason) return;
    setBusy('reject'); setError(''); setMessage('');
    try { await rejectSummary(selected._id, { reason }); setMessage('Daily close rejected for correction.'); await refreshAll(); }
    catch (e) { setError(e.message || 'Rejection failed.'); }
    finally { setBusy(''); }
  };

  const doReopen = async () => {
    if (!selected?._id) return;
    const reason = window.prompt('Reopen reason is required.');
    if (!reason) return;
    setBusy('reopen'); setError(''); setMessage('');
    try { await reopenSummary(selected._id, { reason }); setMessage('Daily close reopened for correction.'); await refreshAll(); }
    catch (e) { setError(e.message || 'Reopen failed.'); }
    finally { setBusy(''); }
  };

  const doPost = async () => {
    if (!selected?._id) return;
    const branchId = selected?.branchId?._id || selected?.branchId || '';
    const businessDate = fmt(selected?.date);
    setBusy('post'); setError(''); setMessage('');
    try { await glPostApproved({ businessDate, branchIdOrZoneId: branchId }); setMessage('Approved daily close posted to GL.'); await refreshAll(); }
    catch (e) { setError(e.message || 'GL posting failed.'); }
    finally { setBusy(''); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Daily Close Control Workbench</h1>
          <p className="text-sm text-slate-400">Single control point for open days, pending approvals, rejected corrections, approved-unposted days and failed postings.</p>
        </div>
        <button onClick={refreshAll} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2"><RefreshCw size={16}/>Refresh</button>
      </div>

      <HelpPanel
        title="Close Control Workbench Guide"
        defaultOpen
        items={[
          { key: 'workbench', label: 'Purpose', help: POS_CLOSE_CONTROL_HELP.workbench },
          { key: 'actionList', label: 'Action List', help: POS_CLOSE_CONTROL_HELP.actionList },
          { key: 'approval', label: 'Approval Control', help: POS_CLOSE_CONTROL_HELP.approval },
          { key: 'exceptions', label: 'Failed Posting Root Causes', help: POS_CLOSE_CONTROL_HELP.exceptions },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-900/60 border border-white/10 rounded-2xl p-4">
        <label className="text-sm text-slate-300"><HelpLabel text="Start of business date range for close actions.">Start Date</HelpLabel><input className="mt-1 w-full bg-slate-950 border border-white/10 rounded-xl p-2" type="date" value={filters.startDate} onChange={(e)=>setFilters({...filters,startDate:e.target.value})}/></label>
        <label className="text-sm text-slate-300"><HelpLabel text="End of business date range for close actions.">End Date</HelpLabel><input className="mt-1 w-full bg-slate-950 border border-white/10 rounded-xl p-2" type="date" value={filters.endDate} onChange={(e)=>setFilters({...filters,endDate:e.target.value})}/></label>
        <label className="text-sm text-slate-300"><HelpLabel text="Branch/plant controls the stock, cash, approval and posting scope.">Branch / Plant ID</HelpLabel><input className="mt-1 w-full bg-slate-950 border border-white/10 rounded-xl p-2" value={filters.branchIdOrZoneId} onChange={(e)=>setFilters({...filters,branchIdOrZoneId:e.target.value})}/></label>
        <div className="flex items-end"><button onClick={loadActions} className="w-full px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white">Apply Filters</button></div>
      </div>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-200">{error}</div>}
      {message && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-200">{message}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Action List" icon={AlertTriangle}>
          <div className="grid grid-cols-3 gap-2 mb-3 text-center text-xs">
            <div className="bg-red-500/10 rounded-xl p-2"><p className="text-red-200 font-bold text-lg">{actionList?.summary?.critical || 0}</p><p className="text-slate-400">Critical</p></div>
            <div className="bg-amber-500/10 rounded-xl p-2"><p className="text-amber-200 font-bold text-lg">{actionList?.summary?.high || 0}</p><p className="text-slate-400">High</p></div>
            <div className="bg-slate-800 rounded-xl p-2"><p className="text-white font-bold text-lg">{actionList?.summary?.medium || 0}</p><p className="text-slate-400">Medium</p></div>
          </div>
          <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
            {loading ? <p className="text-blue-300 animate-pulse">Loading action list…</p> : null}
            {!loading && items.length === 0 ? <p className="text-slate-400">No unresolved close items found.</p> : null}
            {items.map((x) => (
              <button key={x.summaryId} onClick={()=>setSelectedId(x.summaryId)} className={`w-full text-left rounded-xl border p-3 transition ${selectedId === x.summaryId ? 'border-blue-400 bg-blue-500/10' : 'border-white/10 bg-slate-950/50 hover:bg-slate-800/70'}`}>
                <div className="flex justify-between gap-2"><span className="text-white font-semibold">{fmt(x.businessDate)}</span><Pill tone={x.severity}>{x.severity}</Pill></div>
                <p className="text-sm text-slate-300 mt-1">{x.issue}</p>
                <p className="text-xs text-slate-500 mt-1">{x.branch || '—'} · {money(x.amount)}</p>
                <p className="text-xs text-blue-200 mt-2">{x.recommendedAction}</p>
              </button>
            ))}
          </div>
        </Panel>

        <div className="lg:col-span-2 space-y-4">
          <Panel title="Selected Close Control Pack" icon={ClipboardCheck}>
            {!selected ? <p className="text-slate-400">Select an unresolved item to inspect its control pack.</p> : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                  <div className="bg-slate-950 rounded-xl p-3"><p className="text-slate-400">Date</p><p className="text-white font-bold">{fmt(selected.date)}</p></div>
                  <div className="bg-slate-950 rounded-xl p-3"><p className="text-slate-400">Status</p><p className="text-white font-bold uppercase">{selected.status}</p></div>
                  <div className="bg-slate-950 rounded-xl p-3"><p className="text-slate-400">Posting</p><p className="text-white font-bold">{controls?.lifecycle?.postingStatus || 'UNPOSTED'}</p></div>
                  <div className="bg-slate-950 rounded-xl p-3"><p className="text-slate-400">Sales</p><p className="text-white font-bold">{money(selected.sales?.totalRevenue)}</p></div>
                  <div className="bg-slate-950 rounded-xl p-3"><p className="text-slate-400">Expenses</p><p className="text-white font-bold">{money(selected.expenses?.total)}</p></div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button disabled={!controls?.allowedActions?.canApprove || busy} onClick={doApprove} className="px-3 py-2 rounded-xl bg-emerald-600 disabled:bg-slate-700 text-white text-sm">Approve</button>
                  <button disabled={!controls?.allowedActions?.canReject || busy} onClick={doReject} className="px-3 py-2 rounded-xl bg-red-600 disabled:bg-slate-700 text-white text-sm">Reject</button>
                  <button disabled={!controls?.allowedActions?.canReopen || busy} onClick={doReopen} className="px-3 py-2 rounded-xl bg-amber-600 disabled:bg-slate-700 text-white text-sm">Reopen for Correction</button>
                  <button disabled={!controls?.allowedActions?.canPostGL || busy} onClick={doPost} className="px-3 py-2 rounded-xl bg-blue-600 disabled:bg-slate-700 text-white text-sm">Post to GL</button>
                  <button onClick={()=>setActiveView?.('CloseWorkspace')} className="px-3 py-2 rounded-xl bg-slate-700 text-white text-sm">Open Close Workspace</button>
                </div>
              </div>
            )}
          </Panel>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Finalization Checklist" icon={ShieldCheck}>
              {!controls ? <p className="text-slate-400">No checklist loaded.</p> : <div className="space-y-2">{(controls.checklist || []).map((x) => <div key={x.key} className="flex items-start gap-3 border border-white/10 rounded-xl p-3 bg-slate-950/50"><span className={x.passed ? 'text-emerald-300' : 'text-red-300'}>{x.passed ? <CheckCircle2 size={18}/> : <AlertTriangle size={18}/>}</span><div><p className="text-sm text-white font-semibold">{x.label}</p><p className="text-xs text-slate-400">{x.message}</p></div></div>)}</div>}
            </Panel>
            <Panel title="Audit Trail" icon={Eye}>
              <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
                {(controlPack?.audit?.items || []).length === 0 ? <p className="text-slate-400">No audit entries yet.</p> : null}
                {(controlPack?.audit?.items || []).map((x) => <div key={x._id} className="border border-white/10 rounded-xl p-3 bg-slate-950/50"><div className="flex justify-between gap-2"><p className="text-sm text-white font-bold">{x.action}</p><p className="text-xs text-slate-500">{fmt(x.createdAt)}</p></div><p className="text-xs text-slate-400">{x.statusBefore || '—'} → {x.statusAfter || '—'} · {x.performedBy || 'system'}</p>{x.reason ? <p className="text-xs text-amber-200 mt-1">Reason: {x.reason}</p> : null}</div>)}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
