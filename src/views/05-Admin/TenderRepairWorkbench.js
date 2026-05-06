import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle, Database, PlayCircle, RefreshCw, ShieldCheck, Trash2, Wrench } from 'lucide-react';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Notification from '../../components/shared/Notification';
import { startTenderRepairJob, getTenderRepairJob, listTenderRepairJobs } from '../../api/migrationService';
import { glBootstrap, startGlRebuildJob, getGlRebuildJob, listGlRebuildJobs, startGlResetJob, getGlResetJob, listGlResetJobs, verifyGlReset } from '../../api/glService';

const fmtNaira = (v) => `₦${Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const todayIso = () => new Date().toISOString().slice(0, 10);

const StatusBadge = ({ status }) => {
  const map = {
    QUEUED: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
    RUNNING: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    COMPLETED: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    COMPLETED_WITH_WARNINGS: 'bg-amber-500/10 text-amber-200 border-amber-500/20',
    FAILED: 'bg-red-500/10 text-red-300 border-red-500/20',
  };
  return <span className={`px-3 py-1 rounded-full border text-xs font-semibold ${map[status] || map.QUEUED}`}>{status || 'IDLE'}</span>;
};

const Stat = ({ label, value, note }) => (
  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
    <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
    <div className="mt-1 text-2xl font-bold text-white">{value}</div>
    {note && <div className="mt-1 text-xs text-slate-400">{note}</div>}
  </div>
);

const TenderRepairWorkbench = () => {
  const [form, setForm] = useState({ startDate: '2025-06-01', endDate: todayIso(), branchCode: '', settlementMode: 'SAME_DAY', historicalStockFundingMode: 'BANK', historicalCogsMode: 'STOCK_PURCHASE_FULL_COST', forceExpensePaymentAccount: 'BANK' });
  const [currentJob, setCurrentJob] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [glLoading, setGlLoading] = useState(false);
  const [bootstrapLoading, setBootstrapLoading] = useState(false);
  const [bootstrapResult, setBootstrapResult] = useState(null);
  const [glJob, setGlJob] = useState(null);
  const [glJobs, setGlJobs] = useState([]);
  const [glPolling, setGlPolling] = useState(false);
  const [glResult, setGlResult] = useState(null);
  const [glResetLoading, setGlResetLoading] = useState(false);
  const [glResetJob, setGlResetJob] = useState(null);
  const [glResetJobs, setGlResetJobs] = useState([]);
  const [glResetPolling, setGlResetPolling] = useState(false);
  const [glResetResult, setGlResetResult] = useState(null);
  const [glResetVerification, setGlResetVerification] = useState(null);
  const [glVerifyLoading, setGlVerifyLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: 'success', message: '' });
  const pollRef = useRef(null);
  const glPollRef = useRef(null);
  const glResetPollRef = useRef(null);

  const progress = currentJob?.progress || { total: 0, processedRows: 0, percent: 0 };
  const glProgress = glJob?.progress || { total: 0, processedRows: 0, percent: 0, stage: 'IDLE' };
  const glResetProgress = glResetJob?.progress || { total: 0, processedRows: 0, percent: 0, stage: 'IDLE' };
  const result = currentJob?.result || null;
  const isRunning = ['QUEUED', 'RUNNING'].includes(currentJob?.status);
  const glIsRunning = ['QUEUED', 'RUNNING'].includes(glJob?.status);
  const glResetIsRunning = ['QUEUED', 'RUNNING'].includes(glResetJob?.status);

  const hasDryRunCompleted = useMemo(() => jobs.some((job) => job?.dryRun && job?.status === 'COMPLETED' && job?.startDate === form.startDate && job?.endDate === form.endDate), [jobs, form.startDate, form.endDate]);

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const loadJobs = async () => {
    try {
      const data = await listTenderRepairJobs();
      setJobs(data.jobs || []);
    } catch (_) {
      // Keep this silent because a failed history refresh must not block the repair screen.
    }
  };

  const loadGlJobs = async () => {
    try {
      const data = await listGlRebuildJobs();
      setGlJobs(data.jobs || []);
    } catch (_) {
      // Keep silent; GL job history should not block the page.
    }
  };

  const loadGlResetJobs = async () => {
    try {
      const data = await listGlResetJobs();
      setGlResetJobs(data.jobs || []);
    } catch (_) {
      // Keep silent; GL reset job history should not block the page.
    }
  };

  useEffect(() => { loadJobs(); loadGlJobs(); loadGlResetJobs(); }, []);

  useEffect(() => {
    if (!currentJob?.jobId || !isRunning) return undefined;
    setPolling(true);
    pollRef.current = setInterval(async () => {
      try {
        const data = await getTenderRepairJob(currentJob.jobId);
        setCurrentJob(data.job);
        if (!['QUEUED', 'RUNNING'].includes(data.job?.status)) {
          clearInterval(pollRef.current);
          setPolling(false);
          await loadJobs();
        }
      } catch (error) {
        clearInterval(pollRef.current);
        setPolling(false);
        setNotification({ show: true, type: 'error', message: error.response?.data?.message || error.message || 'Could not refresh job status.' });
      }
    }, 1500);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      setPolling(false);
    };
  }, [currentJob?.jobId, isRunning]);

  useEffect(() => {
    if (!glJob?.jobId || !glIsRunning) return undefined;
    setGlPolling(true);
    glPollRef.current = setInterval(async () => {
      try {
        const data = await getGlRebuildJob(glJob.jobId);
        setGlJob(data.job);
        if (data.job?.result) setGlResult(data.job.result);
        if (!['QUEUED', 'RUNNING'].includes(data.job?.status)) {
          clearInterval(glPollRef.current);
          setGlPolling(false);
          await loadGlJobs();
        }
      } catch (error) {
        clearInterval(glPollRef.current);
        setGlPolling(false);
        setNotification({ show: true, type: 'error', message: error.response?.data?.message || error.message || 'Could not refresh GL rebuild job status.' });
      }
    }, 1500);
    return () => {
      if (glPollRef.current) clearInterval(glPollRef.current);
      setGlPolling(false);
    };
  }, [glJob?.jobId, glIsRunning]);


  useEffect(() => {
    if (!glResetJob?.jobId || !glResetIsRunning) return undefined;
    setGlResetPolling(true);
    glResetPollRef.current = setInterval(async () => {
      try {
        const data = await getGlResetJob(glResetJob.jobId);
        setGlResetJob(data.job);
        if (data.job?.result) setGlResetResult(data.job.result);
        if (!['QUEUED', 'RUNNING'].includes(data.job?.status)) {
          clearInterval(glResetPollRef.current);
          setGlResetPolling(false);
          await loadGlResetJobs();
        }
      } catch (error) {
        clearInterval(glResetPollRef.current);
        setGlResetPolling(false);
        setNotification({ show: true, type: 'error', message: error.response?.data?.message || error.message || 'Could not refresh GL reset job status.' });
      }
    }, 1500);
    return () => {
      if (glResetPollRef.current) clearInterval(glResetPollRef.current);
      setGlResetPolling(false);
    };
  }, [glResetJob?.jobId, glResetIsRunning]);

  const startJob = async (dryRun) => {
    if (!form.startDate || !form.endDate) {
      setNotification({ show: true, type: 'error', message: 'Please select both start date and end date.' });
      return;
    }
    if (!dryRun) {
      const proceed = window.confirm('This ACTUAL repair will update migrated DailySummary tender splits and mark affected summaries as UNPOSTED. Make sure you have backed up the database and reviewed a dry run. Continue?');
      if (!proceed) return;
    }
    setLoading(true);
    setGlResult(null);
    try {
      const data = await startTenderRepairJob({ ...form, dryRun, chunkSize: 25 });
      setCurrentJob(data.job);
      setNotification({ show: true, type: 'success', message: dryRun ? 'Tender repair dry run started.' : 'Tender repair actual run started.' });
    } catch (error) {
      setNotification({ show: true, type: 'error', message: error.response?.data?.message || error.message || 'Could not start tender repair job.' });
    } finally {
      setLoading(false);
    }
  };


  const runGlBootstrap = async () => {
    setBootstrapLoading(true);
    setBootstrapResult(null);
    try {
      const data = await glBootstrap();
      setBootstrapResult(data);
      setNotification({ show: true, type: 'success', message: 'GL Bootstrap completed. Required COA accounts were created or refreshed.' });
    } catch (error) {
      setNotification({ show: true, type: 'error', message: error.response?.data?.message || error.message || 'GL bootstrap failed.' });
    } finally {
      setBootstrapLoading(false);
    }
  };


  const runGlReset = async (dryRun) => {
    if (!form.startDate || !form.endDate) {
      setNotification({ show: true, type: 'error', message: 'Please select both start date and end date before resetting GL.' });
      return;
    }
    if (!dryRun) {
      const typed = window.prompt('This ACTUAL GL RESET will delete GL entries in the selected range and reset source documents to UNPOSTED. Type RESET to continue.');
      if (typed !== 'RESET') return;
    }
    setGlResetLoading(true);
    setGlResetResult(null);
    try {
      const data = await startGlResetJob({ startDate: form.startDate, endDate: form.endDate, branchIdOrZoneId: form.branchCode || undefined, dryRun, includeOrders: false });
      setGlResetJob(data.job);
      setNotification({ show: true, type: 'success', message: dryRun ? 'GL reset dry run started. Progress will update here.' : 'GL reset actual run started. Progress will update here.' });
    } catch (error) {
      setNotification({ show: true, type: 'error', message: error.response?.data?.message || error.message || 'GL reset failed to start.' });
    } finally {
      setGlResetLoading(false);
    }
  };

  const verifyResetNow = async () => {
    if (!form.startDate || !form.endDate) {
      setNotification({ show: true, type: 'error', message: 'Please select both start date and end date before verification.' });
      return;
    }
    setGlVerifyLoading(true);
    try {
      const data = await verifyGlReset({ startDate: form.startDate, endDate: form.endDate, branchIdOrZoneId: form.branchCode || undefined, includeOrders: false });
      setGlResetVerification(data.verification || null);
      setNotification({ show: true, type: data.ok ? 'success' : 'error', message: data.ok ? 'GL reset verification passed: no GL entries or stale posting flags remain in this range.' : 'GL reset verification found remaining GL entries or stale source posting flags.' });
    } catch (error) {
      setNotification({ show: true, type: 'error', message: error.response?.data?.message || error.message || 'Could not verify GL reset status.' });
    } finally {
      setGlVerifyLoading(false);
    }
  };

  const runGl = async (dryRun) => {
    if (!form.startDate || !form.endDate) {
      setNotification({ show: true, type: 'error', message: 'Please select both start date and end date before rebuilding GL.' });
      return;
    }
    if (!dryRun) {
      const proceed = window.confirm('This will rebuild GL entries for the selected period. It may replace existing GL entries for that range. Make sure the tender repair actual run has completed and accounting periods are open. Continue?');
      if (!proceed) return;
    }
    setGlLoading(true);
    setGlResult(null);
    try {
      const data = await startGlRebuildJob({ startDate: form.startDate, endDate: form.endDate, branchIdOrZoneId: form.branchCode || undefined, dryRun, settlementMode: form.settlementMode, historicalStockFundingMode: form.historicalStockFundingMode, historicalCogsMode: form.historicalCogsMode, forceExpensePaymentAccount: form.forceExpensePaymentAccount, accountingPolicy: form.settlementMode === 'SAME_DAY' ? 'OPTION_C_BANK_CENTRIC_C1_HISTORICAL' : 'OPTION_C_BANK_CENTRIC_C2_ACTUAL_SETTLEMENT', includeOrders: false });
      setGlJob(data.job);
      setNotification({ show: true, type: 'success', message: dryRun ? 'GL rebuild dry run started. Progress will update here.' : 'GL rebuild actual run started. Progress will update here.' });
    } catch (error) {
      setNotification({ show: true, type: 'error', message: error.response?.data?.message || error.message || 'GL rebuild failed to start.' });
    } finally {
      setGlLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Notification notification={notification} setNotification={setNotification} />
      <PageTitle title="Tender Split Repair" subtitle="Temporary finance maintenance module for migrated historical DailySummary tender correction and GL rebuild validation." />

      <Card>
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-100">
          <AlertTriangle className="mt-1 shrink-0" size={22} />
          <div className="text-sm leading-6">
            <p className="font-bold text-amber-200">Use this in order: backup database → GL bootstrap → tender dry run → actual repair → GL reset dry run → GL reset actual → verify reset → GL rebuild dry run → GL rebuild actual.</p>
            <p className="mt-1 text-amber-100/90">The tender repair uses the original migration staging rows. It sets Cash, POS and Transfer from the source file only. It does not create fake transfer values from Expected Revenue - Cash - POS.</p>
            <p className="mt-1 text-amber-100/90"><b>Complete TB policy is enabled:</b> opening stock credits Opening Balance Equity, historical stock purchases credit Bank, historical COGS comes from Opening Stock + Stock Purchases, daily-sales COGS is suppressed, and stock variances post to 5100 against 1030. <b>Option C is enabled:</b> historical migrated stock purchases credit the Bank Operating Account. C1 settles historical Cash/POS into Bank on the same day. Switch to C2/Actual Settlement for production going forward so Cash/POS stay as clearing balances until bank reconciliation confirms settlement.</p><p className="mt-1 text-amber-100/90"><b>Order policy:</b> customer/app delivery orders are excluded from GL reset, rebuild, readiness and retry by default. DailySummary, Stock-In, Expenses and Stock Variance remain the finance posting sources.</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-emerald-100">Step 0: GL Bootstrap / COA Refresh</div>
              <div className="text-xs text-emerald-100/80 mt-1">Run this once after deployment and before reset/rebuild. It is idempotent and repairs 1030, 3200 and 5100 account names if they previously showed as Unknown.</div>
            </div>
            <Button variant="secondary" icon={Database} onClick={runGlBootstrap} disabled={bootstrapLoading || loading || isRunning || glIsRunning || glResetIsRunning}>
              {bootstrapLoading ? 'Bootstrapping...' : 'Run GL Bootstrap'}
            </Button>
          </div>
          {bootstrapResult && <div className="mt-3 text-xs text-emerald-100/90">Bootstrap OK. Seeded/updated: <b>{bootstrapResult.seeded ?? bootstrapResult.count ?? '—'}</b>; active COA rows: <b>{bootstrapResult.insertedOrExisting ?? '—'}</b>.</div>}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <label className="text-sm text-slate-300">
            Start Date
            <input type="date" value={form.startDate} onChange={(e) => updateForm('startDate', e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white" />
          </label>
          <label className="text-sm text-slate-300">
            End Date
            <input type="date" value={form.endDate} onChange={(e) => updateForm('endDate', e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white" />
          </label>
          <label className="text-sm text-slate-300">
            Branch Code / Branch ID optional
            <input value={form.branchCode} onChange={(e) => updateForm('branchCode', e.target.value)} placeholder="Leave blank for all branches" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white" />
          </label>
          <div className="flex items-end">
            <Button variant="secondary" icon={RefreshCw} onClick={() => { loadJobs(); loadGlJobs(); loadGlResetJobs(); }} disabled={loading || isRunning || glIsRunning || glResetIsRunning} className="w-full">Refresh history</Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <label className="text-sm text-slate-300">
            Cash/POS Settlement Policy
            <select value={form.settlementMode} onChange={(e) => updateForm('settlementMode', e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white">
              <option value="SAME_DAY">C1 Historical: settle Cash/POS to Bank same day</option>
              <option value="ACTUAL">C2 Production: keep Cash/POS clearing until actual settlement</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">Use C1 for migrated history; switch to C2 for new production days.</p>
          </label>
          <label className="text-sm text-slate-300">
            Historical Stock Funding
            <select value={form.historicalStockFundingMode} onChange={(e) => updateForm('historicalStockFundingMode', e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white">
              <option value="BANK">Bank Operating Account</option>
              <option value="OPENING_EQUITY">Opening Equity override</option>
              <option value="ACCOUNTS_PAYABLE">Accounts Payable override</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">For your confirmed migration, use Bank.</p>
          </label>
          <label className="text-sm text-slate-300">
            Historical COGS Source
            <select value={form.historicalCogsMode} onChange={(e) => updateForm('historicalCogsMode', e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white">
              <option value="STOCK_PURCHASE_FULL_COST">Opening Stock + Stock Purchases</option>
              <option value="DAILY_SALES_WAC">Daily Sales WAC / operational mode</option>
              <option value="NONE">No COGS posting</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">For the historical TB rebuild, use Opening Stock + Stock Purchases.</p>
          </label>
          <label className="text-sm text-slate-300">
            Historical Expense Settlement
            <select value={form.forceExpensePaymentAccount} onChange={(e) => updateForm('forceExpensePaymentAccount', e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white">
              <option value="BANK">Force historical expenses to Bank</option>
              <option value="">Use expense source payment method</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">Use Bank if migrated expenses were paid from the bank cycle.</p>
          </label>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><Wrench size={20} /> Step 1: Tender Repair</h2>
              <p className="text-sm text-slate-400 mt-1">Dry run previews corrections. Actual run updates DailySummary and marks affected rows UNPOSTED.</p>
            </div>
            <StatusBadge status={currentJob?.status} />
          </div>

          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <Button icon={ShieldCheck} onClick={() => startJob(true)} disabled={loading || isRunning}>Run Dry Run</Button>
            <Button variant="danger" icon={PlayCircle} onClick={() => startJob(false)} disabled={loading || isRunning}>Run Actual Repair</Button>
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>{polling ? 'Refreshing status...' : 'Progress'}</span>
              <span>{progress.processedRows || 0} / {progress.total || 0} rows · {progress.percent || 0}%</span>
            </div>
            <div className="h-3 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress.percent || 0}%` }} />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Matched" value={result?.matchedRows ?? 0} />
            <Stat label="Changed" value={result?.changed ?? 0} />
            <Stat label="Unchanged" value={result?.unchanged ?? 0} />
            <Stat label="Skipped" value={result?.skipped ?? 0} />
          </div>

          {currentJob?.error && <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{currentJob.error}</div>}
          {result?.note && <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-sm text-blue-100">{result.note}</div>}
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><Trash2 size={20} /> Step 2: GL Reset / Clear GL</h2>
              <p className="text-sm text-slate-400 mt-1">Run after tender repair. Dry run counts records first. Actual reset deletes selected-range GL entries and marks source records UNPOSTED.</p>
            </div>
            <StatusBadge status={glResetJob?.status} />
          </div>

          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <Button variant="secondary" icon={ShieldCheck} onClick={() => runGlReset(true)} disabled={glResetLoading || isRunning || glIsRunning || glResetIsRunning}>Run GL Reset Dry Run</Button>
            <Button variant="danger" icon={Trash2} onClick={() => runGlReset(false)} disabled={glResetLoading || isRunning || glIsRunning || glResetIsRunning}>Run GL Reset Actual</Button>
            <Button variant="secondary" icon={RefreshCw} onClick={verifyResetNow} disabled={glVerifyLoading || isRunning || glIsRunning || glResetIsRunning}>{glVerifyLoading ? 'Verifying...' : 'Verify Reset'}</Button>
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>{glResetPolling ? 'Refreshing GL reset status...' : (glResetProgress.message || 'GL reset progress')}</span>
              <span>{glResetProgress.processedRows || 0} / {glResetProgress.total || 0} records · {glResetProgress.percent || 0}%</span>
            </div>
            <div className="h-3 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-red-500 transition-all" style={{ width: `${glResetProgress.percent || 0}%` }} />
            </div>
            <div className="mt-2 text-xs text-slate-400">Stage: {glResetProgress.stage || 'IDLE'}{glResetProgress.sourceType ? ` · ${glResetProgress.sourceType}` : ''}</div>
          </div>

          {(glResetResult || glResetJob?.found) && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
              <Stat label="Dry Run" value={(glResetResult?.dryRun ?? glResetJob?.dryRun) ? 'YES' : 'NO'} />
              <Stat label="GL Entries" value={(glResetResult?.found || glResetJob?.found)?.glEntries ?? 0} />
              <Stat label="Daily Summaries" value={(glResetResult?.found || glResetJob?.found)?.dailies ?? 0} />
              <Stat label="Stock Ins" value={(glResetResult?.found || glResetJob?.found)?.stockIns ?? 0} />
              <Stat label="Expenses" value={(glResetResult?.found || glResetJob?.found)?.expenses ?? 0} />
              <Stat label="Orders excluded" value={(glResetResult?.found || glResetJob?.found)?.ordersExcludedByPolicy ? 'Yes' : ((glResetResult?.found || glResetJob?.found)?.orders ?? 0)} />
            </div>
          )}

          {glResetResult?.deleted && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Stat label="Deleted GL" value={glResetResult.deleted.glEntries ?? 0} />
              <Stat label="Deleted Batches" value={glResetResult.deleted.postingBatches ?? 0} />
            </div>
          )}
          {(glResetResult?.verification || glResetVerification) && (() => {
            const v = glResetVerification || glResetResult?.verification || {};
            const stale = v.stalePostingSources || {};
            return <div className={`mt-4 rounded-xl border p-3 text-sm ${v.ok ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100' : 'border-amber-500/20 bg-amber-500/10 text-amber-100'}`}>
              <div className="font-bold">Reset verification: {v.ok ? 'PASSED' : 'ACTION REQUIRED'}</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <span>Remaining GL entries: <b>{v.remainingGlEntries ?? 0}</b></span>
                <span>Posting batches: <b>{v.remainingPostingBatches ?? 0}</b></span>
                <span>Posted DailySummaries: <b>{stale.dailies ?? 0}</b></span>
                <span>Posted StockIn: <b>{stale.stockIns ?? 0}</b></span>
                <span>Posted Expenses: <b>{stale.expenses ?? 0}</b></span>
                <span>Posted SaleTx: <b>{stale.saleTransactions ?? 0}</b></span>
              </div>
              {!v.ok && <p className="mt-2 text-xs">Do not rebuild yet. Run GL Reset Actual again for the same range. If entries remain, check locked periods or branch filter selection.</p>}
              {Array.isArray(v.sampleGlEntries) && v.sampleGlEntries.length > 0 && <div className="mt-2 text-xs">Sample remaining journal: {v.sampleGlEntries[0].date ? String(v.sampleGlEntries[0].date).slice(0,10) : '—'} · {v.sampleGlEntries[0].sourceType} · {fmtNaira(v.sampleGlEntries[0].debit)}</div>}
            </div>;
          })()}
          {glResetJob?.error && <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{glResetJob.error}</div>}
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><Database size={20} /> Step 3: GL Rebuild</h2>
              <p className="text-sm text-slate-400 mt-1">Run after GL reset actual. This regenerates a clean GL using the selected Option C policy.</p>
            </div>
            <div className="flex items-center gap-2">
              {glResult?.ok && <CheckCircle className="text-emerald-300" size={22} />}
              <StatusBadge status={glJob?.status} />
            </div>
          </div>

          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <Button variant="secondary" icon={ShieldCheck} onClick={() => runGl(true)} disabled={glLoading || isRunning || glIsRunning || glResetIsRunning}>Run GL Dry Run</Button>
            <Button variant="danger" icon={PlayCircle} onClick={() => runGl(false)} disabled={glLoading || isRunning || glIsRunning || glResetIsRunning}>Run GL Rebuild</Button>
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>{glPolling ? 'Refreshing GL rebuild status...' : (glProgress.message || 'GL progress')}</span>
              <span>{glProgress.processedRows || 0} / {glProgress.total || 0} records · {glProgress.percent || 0}%</span>
            </div>
            <div className="h-3 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${glProgress.percent || 0}%` }} />
            </div>
            <div className="mt-2 text-xs text-slate-400">Stage: {glProgress.stage || 'IDLE'}{glProgress.sourceType ? ` · ${glProgress.sourceType}` : ''}</div>
          </div>

          {!hasDryRunCompleted && <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-100">Tip: run and review a tender repair dry run for this exact date range before doing the actual repair.</div>}

          {(glResult || glJob?.found) && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
              <Stat label="Dry Run" value={(glResult?.dryRun ?? glJob?.dryRun) ? 'YES' : 'NO'} />
              <Stat label="Daily Summaries" value={(glResult?.found || glJob?.found)?.dailies ?? 0} />
              <Stat label="Stock Ins" value={(glResult?.found || glJob?.found)?.stockIns ?? 0} />
              <Stat label="Expenses" value={(glResult?.found || glJob?.found)?.expenses ?? 0} />
              <Stat label="Stock Variances" value={(glResult?.found || glJob?.found)?.stockVariances ?? 0} />
              <Stat label="Batch ID" value={glResult?.batchId || '—'} />
              <Stat label="Settlement" value={glJob?.settlementMode || glResult?.settlementMode || form.settlementMode} />
              <Stat label="Stock Funding" value={glJob?.historicalStockFundingMode || glResult?.historicalStockFundingMode || form.historicalStockFundingMode} />
              <Stat label="COGS Source" value={glJob?.historicalCogsMode || glResult?.historicalCogsMode || form.historicalCogsMode} />
              <Stat label="Orders" value={(glJob?.includeOrders || glResult?.includeOrders) ? 'Included' : 'Excluded'} />
            </div>
          )}

          {glJob?.stats && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              <Stat label="Posted" value={Object.values(glJob.stats.posted || {}).reduce((a, b) => a + Number(b || 0), 0)} />
              <Stat label="Skipped" value={Object.values(glJob.stats.skipped || {}).reduce((a, b) => a + Number(b || 0), 0)} />
              <Stat label="Failed" value={Object.values(glJob.stats.failed || {}).reduce((a, b) => a + Number(b || 0), 0)} />
            </div>
          )}
          {glJob?.error && <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{glJob.error}</div>}
        </Card>
      </div>

      {result?.examples?.length > 0 && (
        <Card>
          <h2 className="text-xl font-bold text-white mb-4">Before / After Examples</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-400 border-b border-white/10">
                <tr>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Branch</th>
                  <th className="text-right p-2">Before Transfer</th>
                  <th className="text-right p-2">After Transfer</th>
                  <th className="text-right p-2">Before Cash</th>
                  <th className="text-right p-2">After Cash</th>
                  <th className="text-right p-2">Before POS</th>
                  <th className="text-right p-2">After POS</th>
                  <th className="text-right p-2">Over / Short</th>
                </tr>
              </thead>
              <tbody>
                {result.examples.map((ex) => (
                  <tr key={ex.dailySummaryId} className="border-b border-white/5 text-slate-200">
                    <td className="p-2">{ex.businessDate || '—'}</td>
                    <td className="p-2">{ex.branchCode || '—'}</td>
                    <td className="p-2 text-right">{fmtNaira(ex.before?.transferAmount)}</td>
                    <td className="p-2 text-right">{fmtNaira(ex.after?.transferAmount)}</td>
                    <td className="p-2 text-right">{fmtNaira(ex.before?.cashAmount)}</td>
                    <td className="p-2 text-right">{fmtNaira(ex.after?.cashAmount)}</td>
                    <td className="p-2 text-right">{fmtNaira(ex.before?.posAmount)}</td>
                    <td className="p-2 text-right">{fmtNaira(ex.after?.posAmount)}</td>
                    <td className="p-2 text-right">{fmtNaira(ex.shortageOverpayment)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card>
        <h2 className="text-xl font-bold text-white mb-4">Recent Tender Repair Jobs</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-400 border-b border-white/10">
              <tr>
                <th className="text-left p-2">Created</th>
                <th className="text-left p-2">Mode</th>
                <th className="text-left p-2">Range</th>
                <th className="text-left p-2">Status</th>
                <th className="text-right p-2">Matched</th>
                <th className="text-right p-2">Changed</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 && <tr><td className="p-4 text-slate-400" colSpan="6">No job history yet.</td></tr>}
              {jobs.map((job) => (
                <tr key={job.jobId} className="border-b border-white/5 text-slate-200">
                  <td className="p-2">{job.createdAt ? new Date(job.createdAt).toLocaleString() : '—'}</td>
                  <td className="p-2">{job.dryRun ? 'Dry Run' : 'Actual'}</td>
                  <td className="p-2">{job.startDate} → {job.endDate}</td>
                  <td className="p-2"><StatusBadge status={job.status} /></td>
                  <td className="p-2 text-right">{job.result?.matchedRows ?? job.progress?.total ?? 0}</td>
                  <td className="p-2 text-right">{job.result?.changed ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-bold text-white mb-4">Recent GL Reset Jobs</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-400 border-b border-white/10">
              <tr>
                <th className="text-left p-2">Created</th>
                <th className="text-left p-2">Mode</th>
                <th className="text-left p-2">Range</th>
                <th className="text-left p-2">Status</th>
                <th className="text-right p-2">Progress</th>
                <th className="text-right p-2">GL Entries</th>
              </tr>
            </thead>
            <tbody>
              {glResetJobs.length === 0 && <tr><td className="p-4 text-slate-400" colSpan="6">No GL reset job history yet.</td></tr>}
              {glResetJobs.map((job) => (
                <tr key={job.jobId} className="border-b border-white/5 text-slate-200">
                  <td className="p-2">{job.createdAt ? new Date(job.createdAt).toLocaleString() : '—'}</td>
                  <td className="p-2">{job.dryRun ? 'Dry Run' : 'Actual'}</td>
                  <td className="p-2">{job.startDate} → {job.endDate}</td>
                  <td className="p-2"><StatusBadge status={job.status} /></td>
                  <td className="p-2 text-right">{job.progress?.percent ?? 0}%</td>
                  <td className="p-2 text-right">{job.found?.glEntries ?? job.result?.found?.glEntries ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-bold text-white mb-4">Recent GL Rebuild Jobs</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-400 border-b border-white/10">
              <tr>
                <th className="text-left p-2">Created</th>
                <th className="text-left p-2">Mode</th>
                <th className="text-left p-2">Range</th>
                <th className="text-left p-2">Status</th>
                <th className="text-right p-2">Progress</th>
                <th className="text-right p-2">Found</th>
              </tr>
            </thead>
            <tbody>
              {glJobs.length === 0 && <tr><td className="p-4 text-slate-400" colSpan="6">No GL rebuild job history yet.</td></tr>}
              {glJobs.map((job) => (
                <tr key={job.jobId} className="border-b border-white/5 text-slate-200">
                  <td className="p-2">{job.createdAt ? new Date(job.createdAt).toLocaleString() : '—'}</td>
                  <td className="p-2">{job.dryRun ? 'Dry Run' : 'Actual'}</td>
                  <td className="p-2">{job.startDate} → {job.endDate}</td>
                  <td className="p-2"><StatusBadge status={job.status} /></td>
                  <td className="p-2 text-right">{job.progress?.percent ?? 0}%</td>
                  <td className="p-2 text-right">{Object.values(job.found || {}).reduce((a, b) => a + Number(b || 0), 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default TenderRepairWorkbench;
