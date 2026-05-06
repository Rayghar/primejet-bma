import React, { useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw, Search, ShieldCheck, AlertTriangle, WalletCards, GitBranch } from 'lucide-react';
import HelpPanel from '../../components/shared/HelpPanel';
import HelpTooltip from '../../components/shared/HelpTooltip';
import { GL_HELP, FINANCE_REPORT_HELP } from '../../utils/helpCatalog';
import {
  getCashMovementReport,
  getExpenseAnalysisReport,
  getBranchProfitLossReport,
  getWalletLiabilityReport,
  getFailedPaymentReviewQueue,
  getSourceTraceReport,
  financialExportUrl,
} from '../../api/financialService';
import {
  glListReversalRequests,
  glApproveReversalRequest,
  glRejectReversalRequest,
  glGenerateFiscalPeriods,
  glListPeriods,
  glExportJournalsUrl,
  glListPostingBatches,
  glPostingBatchExportUrl,
  glFinanceConfidence,
} from '../../api/glService';

const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
const money = (v) => `₦${Number(v || 0).toLocaleString()}`;
const pct = (v) => `${Number(v || 0).toFixed(1)}%`;

function NoData({ state, fallback }) {
  const title = state?.title || fallback || 'No data for the selected filter';
  const message = state?.message || 'Try a different date/branch filter or confirm the source records have been posted.';
  return <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300"><p className="font-semibold text-white">{title}</p><p className="mt-1 text-slate-400">{message}</p>{state?.recommendedAction && <p className="mt-2 text-blue-300">Next action: {state.recommendedAction}</p>}</div>;
}

export default function FinanceControlReports() {
  const [filters, setFilters] = useState({ startDate: monthStart(), endDate: today(), branchIdOrZoneId: '' });
  const [cash, setCash] = useState(null);
  const [expenses, setExpenses] = useState(null);
  const [branchPL, setBranchPL] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [failedPayments, setFailedPayments] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [reversals, setReversals] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [batches, setBatches] = useState([]);
  const [traceQuery, setTraceQuery] = useState({ journalId: '', sourceType: '', sourceId: '' });
  const [trace, setTrace] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setError('');
    setLoading(true);
    try {
      const [c, e, bp, w, fp, fc, r, p, b] = await Promise.all([
        getCashMovementReport(filters),
        getExpenseAnalysisReport(filters),
        getBranchProfitLossReport(filters),
        getWalletLiabilityReport(filters),
        getFailedPaymentReviewQueue(filters),
        glFinanceConfidence(filters).catch(() => null),
        glListReversalRequests({ status: 'PENDING', limit: 50 }),
        glListPeriods({ startPeriod: String(filters.startDate).slice(0, 7), endPeriod: String(filters.endDate).slice(0, 7) }),
        glListPostingBatches({ ...filters, limit: 25 }),
      ]);
      setCash(c); setExpenses(e); setBranchPL(bp); setWallet(w); setFailedPayments(fp); setConfidence(fc);
      setReversals(r?.items || []); setPeriods(p?.items || []); setBatches(b?.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load finance controls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const approveRev = async (id) => { const comment = window.prompt('Approval comment for reversal?') || 'Approved'; await glApproveReversalRequest({ requestId: id, comment }); await load(); };
  const rejectRev = async (id) => { const comment = window.prompt('Rejection reason?'); if (!comment) return; await glRejectReversalRequest({ requestId: id, comment }); await load(); };
  const genPeriods = async () => { await glGenerateFiscalPeriods({ year: new Date(filters.startDate).getFullYear() }); await load(); };
  const runTrace = async () => {
    setTrace(null); setError('');
    try { setTrace(await getSourceTraceReport(traceQuery)); }
    catch (err) { setError(err.message || 'Source trace failed'); }
  };

  const confidenceClass = useMemo(() => {
    const level = String(confidence?.level || '').toUpperCase();
    if (level === 'HIGH') return 'text-green-300 bg-green-500/10 border-green-500/20';
    if (level === 'MEDIUM') return 'text-yellow-300 bg-yellow-500/10 border-yellow-500/20';
    return 'text-red-300 bg-red-500/10 border-red-500/20';
  }, [confidence]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Finance Control Reports</h1>
          <p className="text-sm text-slate-400">Cash movement, expense analysis, branch P&L, source trace, wallet liability, failed payments and reversal approvals.</p>
        </div>
        <button onClick={load} disabled={loading} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white flex items-center gap-2"><RefreshCw size={16}/>{loading ? 'Loading…' : 'Refresh'}</button>
      </div>

      <HelpPanel
        title="Finance reporting operations guide"
        items={[
          { key: 'cashMovement', label: 'Cash Movement', help: FINANCE_REPORT_HELP.cashMovement },
          { key: 'branchPL', label: 'Branch P&L', help: FINANCE_REPORT_HELP.branchPL },
          { key: 'sourceTrace', label: 'GL Source Trace', help: FINANCE_REPORT_HELP.sourceTrace },
          { key: 'walletLiability', label: 'Wallet Liability', help: FINANCE_REPORT_HELP.walletLiability },
          { key: 'failedPayments', label: 'Failed Payment Queue', help: FINANCE_REPORT_HELP.failedPayments },
          { key: 'financeConfidence', label: 'Finance Confidence', help: GL_HELP.financeConfidence },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-900/60 border border-white/10 rounded-2xl p-4">
        <label className="text-sm text-slate-300">Start<input className="mt-1 w-full bg-slate-950 border border-white/10 rounded-xl p-2" type="date" value={filters.startDate} onChange={(e)=>setFilters({...filters,startDate:e.target.value})}/></label>
        <label className="text-sm text-slate-300">End<input className="mt-1 w-full bg-slate-950 border border-white/10 rounded-xl p-2" type="date" value={filters.endDate} onChange={(e)=>setFilters({...filters,endDate:e.target.value})}/></label>
        <label className="text-sm text-slate-300">Branch / Plant ID<input className="mt-1 w-full bg-slate-950 border border-white/10 rounded-xl p-2" value={filters.branchIdOrZoneId} onChange={(e)=>setFilters({...filters,branchIdOrZoneId:e.target.value})}/></label>
        <div className="flex items-end"><button onClick={load} className="w-full px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white">Apply</button></div>
      </div>
      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-200">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`rounded-2xl border p-4 ${confidenceClass}`}><div className="flex items-center gap-2 text-sm"><ShieldCheck size={16}/>Finance Confidence <HelpTooltip text={GL_HELP.financeConfidence}/></div><p className="text-3xl font-bold mt-2">{confidence?.score ?? 0}%</p><p className="text-xs">{confidence?.level || 'LOW'}</p></div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"><p className="text-sm text-slate-400">Cash Net Movement</p><p className="text-2xl font-bold text-white">{money(cash?.totalNetMovement)}</p></div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"><p className="text-sm text-slate-400">Branch Net Profit</p><p className="text-2xl font-bold text-white">{money(branchPL?.totals?.netProfit)}</p></div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"><p className="text-sm text-slate-400">Failed Payment Exposure</p><p className="text-2xl font-bold text-white">{money(failedPayments?.totalExposure)}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-3"><h2 className="font-bold text-white flex items-center gap-1">Cash Movement <HelpTooltip text={FINANCE_REPORT_HELP.cashMovement} /></h2><a className="text-blue-300 flex gap-1" href={financialExportUrl({ ...filters, type:'cash-movement' })}><Download size={15}/>CSV</a></div>
          {cash?.noDataState ? <NoData state={cash.noDataState}/> : <><p className="text-3xl font-bold text-white mb-3">{money(cash?.totalNetMovement)}</p>{(cash?.accounts || []).map((a)=><div key={a.accountCode} className="flex justify-between text-sm border-t border-white/5 py-2"><span>{a.accountCode} — {a.accountName}</span><span>{money(a.netMovement)}</span></div>)}</>}
        </div>
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-3"><h2 className="font-bold text-white flex items-center gap-1">Expense Analysis <HelpTooltip text={FINANCE_REPORT_HELP.expenseAnalysis} /></h2><a className="text-blue-300 flex gap-1" href={financialExportUrl({ ...filters, type:'expense-analysis' })}><Download size={15}/>CSV</a></div>
          {expenses?.noDataState ? <NoData state={expenses.noDataState}/> : <><p className="text-3xl font-bold text-white mb-3">{money(expenses?.total)}</p>{(expenses?.rows || []).slice(0,8).map((r,i)=><div key={i} className="flex justify-between text-sm border-t border-white/5 py-2"><span>{r.category}</span><span>{money(r.amount)} <span className="text-slate-500">({r.count})</span></span></div>)}</>}
        </div>
      </div>

      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 overflow-x-auto">
        <div className="flex justify-between items-center mb-3"><h2 className="font-bold text-white flex items-center gap-1"><GitBranch size={16}/> Branch-level P&L <HelpTooltip text={FINANCE_REPORT_HELP.branchPL}/></h2><a className="text-blue-300 flex gap-1" href={financialExportUrl({ ...filters, type:'branch-pl' })}><Download size={15}/>CSV</a></div>
        {branchPL?.noDataState ? <NoData state={branchPL.noDataState}/> : <table className="w-full text-sm"><thead className="text-slate-400"><tr><th className="p-2 text-left">Branch</th><th className="p-2 text-right">Revenue</th><th className="p-2 text-right">COGS</th><th className="p-2 text-right">Gross Profit</th><th className="p-2 text-right">OPEX</th><th className="p-2 text-right">Net Profit</th><th className="p-2 text-right">Margin</th></tr></thead><tbody>{(branchPL?.rows || []).map((r)=><tr key={r.branchId || r.branchName} className="border-t border-white/5"><td className="p-2">{r.branchName}</td><td className="p-2 text-right">{money(r.revenue)}</td><td className="p-2 text-right">{money(r.cogs)}</td><td className="p-2 text-right">{money(r.grossProfit)}</td><td className="p-2 text-right">{money(r.opex)}</td><td className="p-2 text-right font-semibold">{money(r.netProfit)}</td><td className="p-2 text-right">{pct(r.netMargin)}</td></tr>)}</tbody></table>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 overflow-x-auto">
          <div className="flex justify-between items-center mb-3"><h2 className="font-bold text-white flex items-center gap-1"><WalletCards size={16}/> Wallet Liability Review <HelpTooltip text={FINANCE_REPORT_HELP.walletLiability}/></h2><a className="text-blue-300 flex gap-1" href={financialExportUrl({ ...filters, type:'wallet-liability' })}><Download size={15}/>CSV</a></div>
          <p className="text-3xl font-bold text-white mb-1">{money(wallet?.closingLiability)}</p><p className="text-xs text-slate-400 mb-3">Period movement: {money(wallet?.periodNetMovement)}</p>
          {wallet?.noDataState && <NoData state={wallet.noDataState}/>}<div className="space-y-2 max-h-60 overflow-y-auto">{(wallet?.rows || []).slice(0, 8).map((r)=><div key={r.id} className="flex justify-between border-t border-white/5 pt-2 text-xs"><span>{r.type} · {String(r.createdAt || '').slice(0,10)}</span><span>{money(r.amount)}</span></div>)}</div>
        </div>
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 overflow-x-auto">
          <div className="flex justify-between items-center mb-3"><h2 className="font-bold text-white flex items-center gap-1"><AlertTriangle size={16}/> Failed Payment Queue <HelpTooltip text={FINANCE_REPORT_HELP.failedPayments}/></h2><a className="text-blue-300 flex gap-1" href={financialExportUrl({ ...filters, type:'failed-payments' })}><Download size={15}/>CSV</a></div>
          {failedPayments?.noDataState ? <NoData state={failedPayments.noDataState}/> : <table className="w-full text-xs"><thead className="text-slate-400"><tr><th className="p-2 text-left">Order</th><th className="p-2 text-left">Customer</th><th className="p-2 text-left">Status</th><th className="p-2 text-right">Amount</th></tr></thead><tbody>{(failedPayments?.items || []).slice(0, 10).map((r)=><tr key={r.orderId} className="border-t border-white/5"><td className="p-2">{r.orderId}</td><td className="p-2">{r.customer}</td><td className="p-2">{r.paymentStatus || r.status}</td><td className="p-2 text-right">{money(r.amount)}</td></tr>)}</tbody></table>}
        </div>
      </div>

      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4">
        <h2 className="font-bold text-white flex items-center gap-1 mb-3"><Search size={16}/> GL-to-Source Trace <HelpTooltip text={FINANCE_REPORT_HELP.sourceTrace}/></h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input className="bg-slate-950 border border-white/10 rounded-xl p-2 text-sm" placeholder="Journal ID" value={traceQuery.journalId} onChange={(e)=>setTraceQuery({...traceQuery,journalId:e.target.value})}/>
          <input className="bg-slate-950 border border-white/10 rounded-xl p-2 text-sm" placeholder="Source Type e.g. DAILY_SUMMARY" value={traceQuery.sourceType} onChange={(e)=>setTraceQuery({...traceQuery,sourceType:e.target.value})}/>
          <input className="bg-slate-950 border border-white/10 rounded-xl p-2 text-sm" placeholder="Source ID" value={traceQuery.sourceId} onChange={(e)=>setTraceQuery({...traceQuery,sourceId:e.target.value})}/>
          <button onClick={runTrace} className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white">Trace</button>
        </div>
        {trace && <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs"><pre className="bg-slate-950 rounded-xl p-3 overflow-auto max-h-80">{JSON.stringify(trace.source || {}, null, 2)}</pre><pre className="bg-slate-950 rounded-xl p-3 overflow-auto max-h-80">{JSON.stringify(trace.journals || [], null, 2)}</pre></div>}
      </div>

      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 overflow-x-auto">
        <div className="flex justify-between items-center mb-3"><h2 className="font-bold text-white flex items-center gap-1">GL Reversal Approval Queue <HelpTooltip text={GL_HELP.reversalApproval} /></h2><a className="text-blue-300 flex gap-1" href={glExportJournalsUrl(filters)}><Download size={15}/>Export Journals</a></div>
        <table className="w-full text-sm"><thead className="text-slate-400"><tr><th className="p-2 text-left">Requested</th><th className="p-2 text-left">Journal</th><th className="p-2 text-left">Reason</th><th className="p-2">Actions</th></tr></thead><tbody>{reversals.map((r)=><tr key={r._id} className="border-t border-white/5"><td className="p-2">{String(r.requestedAt || r.createdAt).slice(0,10)}</td><td className="p-2">{r.journalId?._id || r.journalId}</td><td className="p-2">{r.reason}</td><td className="p-2 text-right"><button onClick={()=>approveRev(r._id)} className="text-green-300 mr-3">Approve</button><button onClick={()=>rejectRev(r._id)} className="text-red-300">Reject</button></td></tr>)}</tbody></table>
        {reversals.length === 0 && <p className="text-slate-400 p-4">No pending reversal requests.</p>}
      </div>

      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 overflow-x-auto">
        <div className="flex justify-between items-center mb-3"><h2 className="font-bold text-white flex items-center gap-1">Recent Posting Batches <HelpTooltip text={GL_HELP.postingBatch} /></h2></div>
        <table className="w-full text-sm"><thead className="text-slate-400"><tr><th className="p-2 text-left">Batch</th><th className="p-2 text-left">Action</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Branch</th><th className="p-2 text-right">Journals</th><th className="p-2 text-right">Export</th></tr></thead><tbody>{batches.map((b)=><tr key={b.batchId} className="border-t border-white/5"><td className="p-2 font-mono text-xs">{b.batchId}</td><td className="p-2">{b.action}</td><td className="p-2">{b.status}</td><td className="p-2">{b.branchKey || 'All'}</td><td className="p-2 text-right">{Array.isArray(b.journalIds) ? b.journalIds.length : 0}</td><td className="p-2 text-right"><a className="text-blue-300" href={glPostingBatchExportUrl({ batchId: b.batchId })}>CSV</a></td></tr>)}</tbody></table>
        {batches.length === 0 && <p className="text-slate-400 p-4">No posting batches found for the selected period.</p>}
      </div>

      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4">
        <div className="flex justify-between items-center mb-3"><h2 className="font-bold text-white flex items-center gap-1">Fiscal Period Calendar <HelpTooltip text={GL_HELP.periodLock} /></h2><button onClick={genPeriods} className="px-3 py-2 bg-slate-700 rounded-xl text-sm">Generate Year</button></div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">{periods.map((p)=><div key={p.periodKey} className="bg-slate-950 rounded-xl p-3"><p className="font-bold text-white">{p.periodKey}</p><p className={p.status==='LOCKED'?'text-red-300':'text-green-300'}>{p.status}</p></div>)}</div>
      </div>
    </div>
  );
}
