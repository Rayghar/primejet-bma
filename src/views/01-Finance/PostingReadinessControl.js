// File: src/views/01-Finance/PostingReadinessControl.js
import React, { useEffect, useMemo, useState } from 'react';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import HelpPanel from '../../components/shared/HelpPanel';
import HelpTooltip, { HelpLabel } from '../../components/shared/HelpTooltip';
import { GL_HELP, POSTING_HELP } from '../../utils/helpCatalog';
import { getPlants } from '../../api/operationsService';
import {
  glBootstrap,
  glRebuild,
  glListApprovedUnposted,
  glPostApproved,
  glReadiness,
  glRetryFailed,
  glRunSafeSetup,
  glLockPeriod,
  glReopenPeriod,
} from '../../api/glService';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  FileText,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  Shield,
  XCircle,
} from 'lucide-react';

const todayIso = () => new Date().toISOString().slice(0, 10);
const monthStartIso = () => {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
};

const safeNum = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};


const openDatePicker = (event) => {
  try {
    if (event?.currentTarget?.showPicker) event.currentTarget.showPicker();
  } catch (_) {}
};

const statusStyle = (status) => {
  const s = String(status || '').toUpperCase();
  if (s === 'READY' || s === 'PASSED') return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20';
  if (s === 'WARNING') return 'text-amber-300 bg-amber-500/10 border-amber-500/20';
  if (s === 'BLOCKED' || s === 'FAILED') return 'text-red-300 bg-red-500/10 border-red-500/20';
  return 'text-gray-300 bg-white/5 border-white/10';
};

const StatusIcon = ({ status, size = 18 }) => {
  const s = String(status || '').toUpperCase();
  if (s === 'READY' || s === 'PASSED') return <CheckCircle2 size={size} />;
  if (s === 'WARNING') return <AlertTriangle size={size} />;
  if (s === 'BLOCKED' || s === 'FAILED') return <XCircle size={size} />;
  return <Activity size={size} />;
};

const ControlCard = ({ control }) => {
  const status = String(control?.status || '').toUpperCase();
  return (
    <div className={`rounded-xl border p-4 ${statusStyle(status)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <StatusIcon status={status} size={16} />
            {control?.label || 'Control'}
          </div>
          <div className="mt-1 text-xs opacity-90 leading-relaxed">{control?.message || 'No status message.'}</div>
        </div>
        <span className="shrink-0 rounded-full border border-current/20 px-2 py-1 text-[10px] font-bold uppercase">
          {status || 'UNKNOWN'}
        </span>
      </div>

      {control?.remediation ? (
        <div className="mt-3 rounded-lg bg-black/20 p-3 text-[11px] text-gray-200/90">
          <span className="font-semibold">Next step:</span> {control.remediation}
        </div>
      ) : null}
    </div>
  );
};

const CountTile = ({ label, value, hint, help }) => (
  <Card className="bg-white/5 border border-white/10 rounded-xl p-4">
    <div className="text-xs text-gray-400 flex items-center gap-1">{label}<HelpTooltip text={help} /></div>
    <div className="mt-1 text-2xl font-bold text-white">{safeNum(value, 0).toLocaleString()}</div>
    {hint ? <div className="mt-1 text-[11px] text-gray-500">{hint}</div> : null}
  </Card>
);

const postingHelpItems = [
  { key: 'postingReadiness', label: 'Posting Readiness', help: GL_HELP.postingReadiness },
  { key: 'postApproved', label: 'Post Approved Records', help: GL_HELP.postApproved },
  { key: 'rebuild', label: 'Rebuild GL for Selected Period', help: GL_HELP.rebuild || 'Rebuilds GL entries from approved operational records for the selected date range. Use this for historical migration month by month.' },
  { key: 'retryFailed', label: 'Retry Failed', help: GL_HELP.retryFailed },
  { key: 'postingBatch', label: 'Posting Batch', help: GL_HELP.postingBatch },
  { key: 'periodLock', label: 'Accounting Period Lock', help: GL_HELP.periodLock },
  { key: 'financeConfidence', label: 'Finance Confidence', help: GL_HELP.financeConfidence },
];

export default function PostingReadinessControl({ setActiveView }) {
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState('');
  const [startDate, setStartDate] = useState(monthStartIso());
  const [endDate, setEndDate] = useState(todayIso());
  const [businessDate, setBusinessDate] = useState(todayIso());
  const [periodReason, setPeriodReason] = useState('');

  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [unposted, setUnposted] = useState(null);
  const [unpostedLoading, setUnpostedLoading] = useState(false);
  const [unpostedStatus, setUnpostedStatus] = useState('ALL');
  const [unpostedPage, setUnpostedPage] = useState(1);
  const [unpostedPageSize, setUnpostedPageSize] = useState(25);

  const status = String(readiness?.status || 'UNKNOWN').toUpperCase();
  const blocked = status === 'BLOCKED';

  const mandatoryControls = useMemo(() => readiness?.mandatoryControls || [], [readiness]);
  const recommendedControls = useMemo(() => readiness?.recommendedControls || [], [readiness]);

  const loadBranches = async () => {
    try {
      const plants = await getPlants();
      const normalized = Array.isArray(plants)
        ? plants
            .map((p) => ({ id: p?._id || p?.id, name: p?.name || 'Unnamed Branch' }))
            .filter((x) => x.id)
        : [];
      setBranches(normalized);
    } catch (e) {
      setBranches([]);
    }
  };

  const loadReadiness = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await glReadiness({
        startDate,
        endDate,
        branchIdOrZoneId: branchId || undefined,
        includeOrders: false,
      });
      setReadiness(res || null);
    } catch (e) {
      setReadiness(null);
      setError(e?.message || 'Failed to load posting readiness.');
    } finally {
      setLoading(false);
    }
  };


  const loadUnposted = async (pageOverride = unpostedPage) => {
    if (!startDate || !endDate) return;
    setUnpostedLoading(true);
    try {
      const res = await glListApprovedUnposted({
        startDate,
        endDate,
        branchIdOrZoneId: branchId || undefined,
        status: unpostedStatus,
        page: pageOverride,
        limit: unpostedPageSize,
        includeOrders: false,
      });
      setUnposted(res || null);
      setUnpostedPage(pageOverride);
    } catch (e) {
      setError(e?.message || 'Failed to load approved but unposted entries.');
    } finally {
      setUnpostedLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    loadReadiness();
    loadUnposted(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, startDate, endDate, unpostedStatus, unpostedPageSize]);

  const runAction = async (key, fn, successMessage) => {
    setActionLoading(key);
    setActionMessage('');
    setError('');
    try {
      const res = await fn();
      setActionMessage(successMessage || res?.message || 'Action completed successfully.');
      if (res?.readiness) setReadiness(res.readiness);
      else await loadReadiness();
      await loadUnposted(1);
    } catch (e) {
      setError(e?.message || 'Action failed.');
    } finally {
      setActionLoading('');
    }
  };

  const runSafeSetup = () =>
    runAction(
      'safeSetup',
      () => glRunSafeSetup({ startDate, endDate, branchIdOrZoneId: branchId || undefined }),
      'Safe setup completed. GL bootstrap has been executed and readiness has been refreshed.'
    );

  const runBootstrap = () =>
    runAction('bootstrap', () => glBootstrap(), 'GL bootstrap completed. Required Chart of Accounts records have been created or refreshed.');

  const postApproved = () =>
    runAction(
      'postApproved',
      () => glPostApproved({ businessDate, branchIdOrZoneId: branchId || undefined }),
      `Approved records for ${businessDate} have been submitted to GL posting.`
    );

  const rebuildSelectedPeriod = () => {
    if (!startDate || !endDate) {
      setError('Select Start Date and End Date before rebuilding GL.');
      return;
    }
    const branchLabel = branches.find((b) => b.id === branchId)?.name || 'All Branches';
    const confirmed = window.confirm(
      `Rebuild GL for ${branchLabel} from ${startDate} to ${endDate}?\n\n` +
      'Use this for historical migration month-by-month after imported records have been reviewed.'
    );
    if (!confirmed) return;
    runAction(
      'rebuild',
      () => glRebuild({ startDate, endDate, branchIdOrZoneId: branchId || undefined }),
      `GL rebuild submitted for ${branchLabel} from ${startDate} to ${endDate}. Refresh checks and review Trial Balance / GL Health.`
    );
  };

  const retryFailed = () =>
    runAction(
      'retryFailed',
      () => glRetryFailed({ startDate, endDate, branchIdOrZoneId: branchId || undefined }),
      'Failed GL postings have been retried for the selected period.'
    );

  const selectedPeriodKey = (startDate || businessDate || todayIso()).slice(0, 7);

  const lockCurrentPeriod = () =>
    runAction(
      'lockPeriod',
      () => glLockPeriod({ periodKey: selectedPeriodKey, reason: periodReason || 'Month-end finance lock' }),
      'Accounting period locked. Posting into this month is now blocked.'
    );

  const reopenCurrentPeriod = () =>
    runAction(
      'reopenPeriod',
      () => glReopenPeriod({ periodKey: selectedPeriodKey, reason: periodReason || 'Finance-approved reopen' }),
      'Accounting period reopened. Posting can resume for this month.'
    );

  const navigate = (view) => {
    if (typeof setActiveView === 'function') setActiveView(view);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <PageTitle
          title="Posting Readiness Control Center"
          subtitle="Run pre-posting checks and setup actions before sales, expenses and financial statements are posted."
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={RefreshCw} onClick={loadReadiness} disabled={loading || Boolean(actionLoading)}>
            Refresh Checks
          </Button>
          <Button icon={Shield} onClick={runSafeSetup} disabled={loading || Boolean(actionLoading)}>
            {actionLoading === 'safeSetup' ? 'Running...' : 'Run Safe Setup'}
          </Button>
        </div>
      </div>

      <HelpPanel
        title="GL & Posting field guide"
        items={postingHelpItems}
        defaultOpen={false}
      />

      <Card className={`rounded-2xl border p-5 ${statusStyle(status)}`}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-black/20 p-3">
                <StatusIcon status={status} size={28} />
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest opacity-80">Posting readiness <HelpTooltip text={GL_HELP.postingReadiness} /></div>
                <div className="text-3xl font-bold text-white">{status}</div>
              </div>
            </div>
            <div className="mt-3 text-sm opacity-90">
              {status === 'READY'
                ? 'The mandatory controls have passed. The system is ready for daily posting and GL actions.'
                : status === 'WARNING'
                  ? 'Mandatory controls passed, but some recommended controls require attention.'
                  : status === 'BLOCKED'
                    ? 'Mandatory setup is incomplete. Resolve blocked controls before GL posting.'
                    : 'Run readiness checks to confirm posting status.'}
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-widest opacity-70">Score</div>
            <div className="text-4xl font-bold text-white">{safeNum(readiness?.readinessScore, 0)}%</div>
          </div>

          <div className="text-sm">
            <div className="flex justify-between border-b border-white/10 py-1">
              <span>Mandatory</span>
              <span className="font-bold">{safeNum(readiness?.mandatoryPassed, 0)} / {safeNum(readiness?.mandatoryTotal, 0)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Recommended</span>
              <span className="font-bold">{safeNum(readiness?.recommendedPassed, 0)} / {safeNum(readiness?.recommendedTotal, 0)}</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-xs text-gray-400"><HelpLabel text={GL_HELP.postingReadiness}>Branch / Plant</HelpLabel></label>
            <select
              className="w-full mt-1 px-3 py-2 rounded-lg bg-black/30 text-white border border-white/10"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400">Start Date</label>
            <input
              type="date"
              onClick={openDatePicker}
              onFocus={openDatePicker}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-black/30 text-white border border-white/10"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-gray-400">End Date</label>
            <input
              type="date"
              onClick={openDatePicker}
              onFocus={openDatePicker}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-black/30 text-white border border-white/10"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-gray-400">Posting Business Date</label>
            <input
              type="date"
              onClick={openDatePicker}
              onFocus={openDatePicker}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-black/30 text-white border border-white/10"
              value={businessDate}
              onChange={(e) => setBusinessDate(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {error ? <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div> : null}
      {actionMessage ? <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">{actionMessage}</div> : null}

      {loading ? (
        <div className="p-10 text-center text-blue-400 animate-pulse">Loading posting readiness...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <CountTile label="COA Accounts Found" value={readiness?.counts?.coaAccountsFound} hint="Required and recommended accounts" help={GL_HELP.chartOfAccounts} />
            <CountTile label="Approved Unposted" value={readiness?.counts?.approvedUnposted} hint="Eligible records not yet posted" help={POSTING_HELP.approvedUnposted} />
            <CountTile label="Failed Postings" value={readiness?.counts?.failedPostings} hint="Source documents needing retry/fix" help={POSTING_HELP.failedPostings} />
            <CountTile label="Posted Journals" value={readiness?.counts?.postedJournalCount} hint="GL entries for selected scope" help={POSTING_HELP.postedJournals} />
          </div>

          <Card className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="text-lg font-bold text-white flex items-center gap-1">Controlled Actions <HelpTooltip text={GL_HELP.postApproved} /></div>
                <div className="text-xs text-gray-400 mt-1">
                  These actions run the backend setup/posting endpoints. Posting is disabled when mandatory readiness is blocked.
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" icon={Database} onClick={runBootstrap} disabled={Boolean(actionLoading)}>
                  {actionLoading === 'bootstrap' ? 'Bootstrapping...' : 'Run GL Bootstrap'}
                </Button>
                <Button icon={PlayCircle} onClick={postApproved} disabled={blocked || Boolean(actionLoading) || !businessDate}>
                  {actionLoading === 'postApproved' ? 'Posting...' : 'Post Approved Records'}
                </Button>
                <Button variant="secondary" icon={RefreshCw} onClick={rebuildSelectedPeriod} disabled={blocked || Boolean(actionLoading) || !startDate || !endDate}>
                  {actionLoading === 'rebuild' ? 'Rebuilding...' : 'Rebuild GL for Selected Period'}
                </Button>
                <Button variant="secondary" icon={RotateCcw} onClick={retryFailed} disabled={Boolean(actionLoading) || !startDate || !endDate}>
                  {actionLoading === 'retryFailed' ? 'Retrying...' : 'Retry Failed'}
                </Button>
              </div>
            </div>

            {blocked ? (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-100">
                GL posting is disabled because mandatory controls are blocked. Run Safe Setup or resolve the failed mandatory controls below.
              </div>
            ) : null}
          </Card>

          <Card className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="text-lg font-bold text-white flex items-center gap-1">Accounting Period Lock <HelpTooltip text={GL_HELP.periodLock} /></div>
                <div className="text-xs text-gray-400 mt-1">Selected period: <span className="font-mono text-gray-200">{selectedPeriodKey}</span>. Locking blocks posting, rebuilds, retries and reversals for that month.</div>
              </div>
              <div className="flex flex-wrap gap-2 items-end">
                <input className="px-3 py-2 rounded-lg bg-black/30 text-white border border-white/10 text-sm" placeholder="Reason required for audit" value={periodReason} onChange={(e) => setPeriodReason(e.target.value)} />
                <Button variant="secondary" onClick={lockCurrentPeriod} disabled={Boolean(actionLoading)}>Lock Period</Button>
                <Button variant="secondary" onClick={reopenCurrentPeriod} disabled={Boolean(actionLoading)}>Reopen Period</Button>
              </div>
            </div>
          </Card>


          <Card className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
              <div>
                <div className="text-lg font-bold text-white flex items-center gap-1">Approved but Unposted Entries <HelpTooltip text="Daily summaries, stock-in and expenses waiting for GL posting. Customer orders are intentionally excluded from GL readiness/rebuild unless explicitly enabled by a future finance policy." /></div>
                <div className="text-xs text-gray-400 mt-1">These are finance-postable operational records for the selected period. Customer/app delivery orders are excluded from GL posting readiness by default to avoid double-counting daily close revenue.</div>
              </div>
              <div className="flex items-center gap-2">
                <select value={unpostedStatus} onChange={(e) => { setUnpostedStatus(e.target.value); setUnpostedPage(1); }} className="rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm text-white">
                  <option value="ALL">All not posted</option>
                  <option value="UNPOSTED">UNPOSTED</option>
                  <option value="QUEUED">QUEUED</option>
                  <option value="FAILED">FAILED</option>
                </select>
                <Button variant="secondary" icon={RefreshCw} onClick={() => loadUnposted(unpostedPage)} disabled={unpostedLoading}>{unpostedLoading ? 'Loading...' : 'Refresh List'}</Button>
              </div>
            </div>

            {unposted?.glOrderScope ? (
              <div className="mb-3 rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-xs text-blue-100">
                <span className="font-bold">Order posting policy:</span> {unposted.glOrderScope.policy}
              </div>
            ) : (
              <div className="mb-3 rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-xs text-blue-100">
                <span className="font-bold">Order posting policy:</span> Customer/app delivery orders are excluded from GL readiness by default.
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="min-w-full text-xs">
                <thead className="bg-white/5 text-gray-300">
                  <tr>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-left">Description</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2 text-right">KG</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Error / Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {(unposted?.items || []).length ? (unposted.items || []).map((row) => (
                    <tr key={`${row.sourceType}-${row.sourceId}`} className="text-gray-200">
                      <td className="px-3 py-2 whitespace-nowrap">{row.date || '-'}</td>
                      <td className="px-3 py-2 font-semibold">{row.sourceType}</td>
                      <td className="px-3 py-2">{row.description || row.sourceRef || row.sourceId}</td>
                      <td className="px-3 py-2 text-right">₦{safeNum(row.amount, 0).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">{safeNum(row.kg, 0).toLocaleString()}</td>
                      <td className="px-3 py-2"><span className={`rounded-full px-2 py-1 border ${String(row.postingStatus).toUpperCase() === 'FAILED' ? 'border-red-400/30 text-red-300 bg-red-500/10' : 'border-amber-400/30 text-amber-200 bg-amber-500/10'}`}>{row.postingStatus || 'UNPOSTED'}</span></td>
                      <td className="px-3 py-2 text-gray-400 max-w-md">{row.errorMessage || row.recommendation || 'Ready for posting.'}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="7" className="px-3 py-6 text-center text-gray-500">No approved/unposted entries found for this filter.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs text-gray-400">
              <div>Total: {(unposted?.total || 0).toLocaleString()} • Failed: {(unposted?.counts?.failed || 0).toLocaleString()} • Orders: excluded by policy</div>
              <div className="flex items-center gap-2">
                <span>Rows</span>
                <select value={unpostedPageSize} onChange={(e) => { setUnpostedPageSize(Number(e.target.value)); setUnpostedPage(1); }} className="rounded bg-black/30 border border-white/10 px-2 py-1 text-white">
                  {[10, 25, 50, 100].map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
                <Button variant="secondary" onClick={() => loadUnposted(Math.max(1, unpostedPage - 1))} disabled={unpostedPage <= 1 || unpostedLoading}>Prev</Button>
                <span>Page {unpostedPage}</span>
                <Button variant="secondary" onClick={() => loadUnposted(unpostedPage + 1)} disabled={unpostedLoading || (unpostedPage * unpostedPageSize >= (unposted?.total || 0))}>Next</Button>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white font-bold mb-4">
                <Shield size={18} /> Mandatory Controls
              </div>
              <div className="space-y-3">
                {mandatoryControls.length ? mandatoryControls.map((c) => <ControlCard key={c.key} control={c} />) : <div className="text-sm text-gray-400">No mandatory controls returned.</div>}
              </div>
            </Card>

            <Card className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white font-bold mb-4">
                <AlertTriangle size={18} /> Recommended Controls
              </div>
              <div className="space-y-3">
                {recommendedControls.length ? recommendedControls.map((c) => <ControlCard key={c.key} control={c} />) : <div className="text-sm text-gray-400">No recommended controls returned.</div>}
              </div>
            </Card>
          </div>

          {readiness?.blockedReasons?.length ? (
            <Card className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <div className="text-sm font-bold text-red-200 flex items-center gap-2"><XCircle size={16} /> Blocked Reasons</div>
              <ul className="mt-2 list-disc pl-5 text-xs text-red-100/90 space-y-1">
                {readiness.blockedReasons.map((w, idx) => <li key={idx}>{w}</li>)}
              </ul>
            </Card>
          ) : null}

          {readiness?.warnings?.length ? (
            <Card className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <div className="text-sm font-bold text-amber-200 flex items-center gap-2"><AlertTriangle size={16} /> Warnings</div>
              <ul className="mt-2 list-disc pl-5 text-xs text-amber-100/90 space-y-1">
                {readiness.warnings.map((w, idx) => <li key={idx}>{w}</li>)}
              </ul>
            </Card>
          ) : null}

          <Card className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-white font-bold mb-3">
              <FileText size={18} /> Navigation
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Button variant="secondary" icon={ArrowRight} onClick={() => navigate('CloseWorkspace')}>Close Workspace</Button>
              <Button variant="secondary" icon={ArrowRight} onClick={() => navigate('TrialBalance')}>Trial Balance</Button>
              <Button variant="secondary" icon={ArrowRight} onClick={() => navigate('GLHealth')}>GL Health</Button>
              <Button variant="secondary" icon={ArrowRight} onClick={() => navigate('FinancialStatements')}>Financial Statements</Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
