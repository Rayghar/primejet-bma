// src/views/Finance/CloseWorkspace.js
import React, { useEffect, useMemo, useState } from 'react';
import { getPlants } from '../../api/operationsService';
import {
  createOrGetDailySummary,
  getDailyEntries,
  finalizeDailySummary,
  approveSummary,
  rejectSummary,
} from '../../api/dataEntryService';
import { glPostApproved, glRetryFailed, glTrialBalance, glPostingExceptions } from '../../api/glService';

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';

import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ClipboardCheck,
  Send,
  Hammer,
  BookOpen,
  ShieldAlert,
  XCircle,
} from 'lucide-react';

const safeNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const hasVal = (v) => v !== undefined && v !== null && String(v).trim() !== '';
const fmtDate = (d) => {
  const x = d ? new Date(d) : null;
  if (!x || Number.isNaN(x.getTime())) return '—';
  return x.toISOString().slice(0, 10);
};

const StatusPill = ({ label, value, tone = 'neutral' }) => {
  const cls =
    tone === 'good'
      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
      : tone === 'warn'
      ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
      : tone === 'bad'
      ? 'bg-red-500/10 border-red-500/20 text-red-300'
      : 'bg-white/5 border-white/10 text-gray-300';

  return (
    <div className={`px-3 py-2 rounded-xl border ${cls} text-xs flex items-center justify-between gap-3`}>
      <span className="font-semibold">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
};

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
      active ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'
    }`}
  >
    {children}
  </button>
);

export default function CloseWorkspace() {
  const [tab, setTab] = useState('summary');

  // Required selectors
  const [businessDate, setBusinessDate] = useState('');
  const [branchId, setBranchId] = useState('');

  // Master data
  const [branches, setBranches] = useState([]);

  // DailySummary + linked entries
  const [summary, setSummary] = useState(null);
  const [entries, setEntries] = useState({ sales: [], expenses: [] });

  // UI states
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // GL/Audit states (same business date range)
  const [tb, setTb] = useState(null);
  const [exceptions, setExceptions] = useState(null);

  const branchLabel = useMemo(() => {
    if (!branchId) return '—';
    const b = branches.find((x) => String(x.id) === String(branchId));
    return b?.name || branchId;
  }, [branchId, branches]);

  const approvalStatus = useMemo(() => {
    const st = String(summary?.status || '').toLowerCase();
    if (!st) return 'UNSET';
    return st.toUpperCase();
  }, [summary]);

  const postingStatus = useMemo(() => {
    const st = String(summary?.posting?.status || '').toUpperCase();
    return st || 'UNPOSTED';
  }, [summary]);

  const closeStatus = useMemo(() => {
    // If you later add a close field, map it here. For now: derived.
    if (postingStatus === 'POSTED' && approvalStatus === 'APPROVED') return 'CLOSABLE';
    if (approvalStatus === 'APPROVED') return 'AWAITING_POST';
    if (approvalStatus === 'PENDING_APPROVAL') return 'AWAITING_APPROVAL';
    return 'OPEN';
  }, [postingStatus, approvalStatus]);

  const salesLines = useMemo(() => (Array.isArray(entries?.sales) ? entries.sales : []), [entries]);
  const expenseLines = useMemo(() => (Array.isArray(entries?.expenses) ? entries.expenses : []), [entries]);

  const salesTotal = useMemo(() => safeNum(summary?.sales?.totalRevenue), [summary]);
  const salesKg = useMemo(() => safeNum(summary?.sales?.totalKgSold), [summary]);

  const warnNoSalesLines = useMemo(() => {
    // RULE: If sales.totalRevenue > 0 but no sales lines → warning
    return salesTotal > 0 && salesLines.length === 0;
  }, [salesTotal, salesLines.length]);

  const canSubmit = useMemo(() => hasVal(businessDate) && hasVal(branchId), [businessDate, branchId]);

  const loadBranches = async () => {
    try {
      const plants = await getPlants();
      const normalized = Array.isArray(plants)
        ? plants
            .map((p) => ({ id: p?.id || p?._id, name: p?.name || 'Unnamed Branch' }))
            .filter((x) => x.id)
        : [];
      setBranches(normalized);
    } catch (e) {
      console.error(e);
      setBranches([]);
    }
  };

  const loadOrCreateSummary = async () => {
    setErrorMsg('');
    setInfoMsg('');

    if (!canSubmit) {
      setSummary(null);
      setEntries({ sales: [], expenses: [] });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        date: businessDate,
        branchId,
      };

      const s = await createOrGetDailySummary(payload);
      setSummary(s || null);

      // load entries if possible
      const sid = s?._id || s?.id;
      if (sid) {
        const e = await getDailyEntries(sid);
        // expected backend shape may vary; normalize
        setEntries({
          sales: Array.isArray(e?.sales) ? e.sales : [],
          expenses: Array.isArray(e?.expenses) ? e.expenses : [],
        });
      } else {
        setEntries({ sales: [], expenses: [] });
      }
    } catch (e) {
      console.error(e);
      setErrorMsg(e?.message || 'Failed to load daily summary.');
      setSummary(null);
      setEntries({ sales: [], expenses: [] });
    } finally {
      setLoading(false);
    }
  };

  const refreshAudit = async () => {
    setErrorMsg('');
    setInfoMsg('');
    if (!canSubmit) return;

    try {
      const startDate = businessDate;
      const endDate = businessDate;

      const [tbRes, exRes] = await Promise.allSettled([
        glTrialBalance({ startDate, endDate, branchIdOrZoneId: branchId }),
        glPostingExceptions({ startDate, endDate, branchIdOrZoneId: branchId }),
      ]);

      setTb(tbRes.status === 'fulfilled' ? tbRes.value : null);
      setExceptions(exRes.status === 'fulfilled' ? exRes.value : null);
    } catch (e) {
      // silent
    }
  };

  useEffect(() => {
    loadBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadOrCreateSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessDate, branchId]);

  useEffect(() => {
    // refresh audit whenever summary changes
    refreshAudit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary?._id, businessDate, branchId]);

  const doSubmitForApproval = async () => {
    setErrorMsg('');
    setInfoMsg('');
    if (!canSubmit) {
      setErrorMsg('Business Date and Branch are required.');
      return;
    }
    if (!summary?._id) {
      setErrorMsg('Daily summary not loaded.');
      return;
    }

    setBusyAction('submit');
    try {
      const r = await finalizeDailySummary(summary._id);
      setSummary(r || summary);
      setInfoMsg('Submitted for approval.');
    } catch (e) {
      setErrorMsg(e?.message || 'Failed to submit for approval.');
    } finally {
      setBusyAction('');
    }
  };

  const doApprove = async () => {
    setErrorMsg('');
    setInfoMsg('');
    if (!summary?._id) return;

    setBusyAction('approve');
    try {
      const r = await approveSummary(summary._id);
      setSummary(r || summary);
      setInfoMsg('Approved.');
    } catch (e) {
      setErrorMsg(e?.message || 'Failed to approve.');
    } finally {
      setBusyAction('');
    }
  };

  const doReject = async () => {
    setErrorMsg('');
    setInfoMsg('');
    if (!summary?._id) return;

    setBusyAction('reject');
    try {
      const r = await rejectSummary(summary._id);
      setSummary(r || summary);
      setInfoMsg('Rejected.');
    } catch (e) {
      setErrorMsg(e?.message || 'Failed to reject.');
    } finally {
      setBusyAction('');
    }
  };

  const doPostToGL = async () => {
    setErrorMsg('');
    setInfoMsg('');
    if (!canSubmit) {
      setErrorMsg('Business Date and Branch are required.');
      return;
    }

    setBusyAction('post');
    try {
      const r = await glPostApproved({ businessDate, branchIdOrZoneId: branchId });
      setInfoMsg(`Posted to GL. (posted: ${JSON.stringify(r?.posted || {})})`);
      await loadOrCreateSummary();
      await refreshAudit();
    } catch (e) {
      setErrorMsg(e?.message || 'Failed to post to GL.');
    } finally {
      setBusyAction('');
    }
  };

  const doRetryFailed = async () => {
    setErrorMsg('');
    setInfoMsg('');
    if (!canSubmit) {
      setErrorMsg('Business Date and Branch are required.');
      return;
    }

    setBusyAction('retry');
    try {
      const r = await glRetryFailed({ startDate: businessDate, endDate: businessDate, branchIdOrZoneId: branchId });
      setInfoMsg(`Retry complete. (failed: ${JSON.stringify(r?.failed || {})})`);
      await refreshAudit();
      await loadOrCreateSummary();
    } catch (e) {
      setErrorMsg(e?.message || 'Failed to retry failed postings.');
    } finally {
      setBusyAction('');
    }
  };

  // Posting preview (exact journal lines approximation)
  // NOTE: backend is source of truth. This preview matches your policy matrix assumptions.
  const postingPreview = useMemo(() => {
    const lines = [];

    // POS aggregated from DailySummary totals (this is what your migrated data supports)
    // Dr Cash/Bank, Cr Revenue POS
    // Cash split if present
    const cash = safeNum(summary?.sales?.cashAmount);
    const transfer = safeNum(summary?.sales?.transferAmount);
    const pos = safeNum(summary?.sales?.posAmount);
    const total = safeNum(summary?.sales?.totalRevenue);

    if (total > 0) {
      const drLines = [];
      const credited = [];

      // If split exists, use it. If not, treat all as cash.
      const splitSum = cash + transfer + pos;
      if (splitSum > 0) {
        if (cash > 0) drLines.push({ acct: '1000', label: 'Cash on Hand', dr: cash, cr: 0 });
        if (transfer > 0) drLines.push({ acct: '1010', label: 'Bank - Transfers', dr: transfer, cr: 0 });
        if (pos > 0) drLines.push({ acct: '1020', label: 'Bank - POS Settlements', dr: pos, cr: 0 });
      } else {
        drLines.push({ acct: '1000', label: 'Cash on Hand', dr: total, cr: 0 });
      }

      credited.push({ acct: '4000', label: 'Sales Revenue - POS (LPG)', dr: 0, cr: total });

      lines.push({
        title: 'POS Daily Summary (aggregated)',
        note: 'Based on DailySummary.sales totals (migration-safe)',
        lines: [...drLines, ...credited],
      });

      // COGS is computed in backend using WAC × kg (if available). We show a preview placeholder.
      if (salesKg > 0) {
        lines.push({
          title: 'COGS (POS)',
          note: 'Backend will compute WAC × kgSold and post: Dr 5000 / Cr 1200',
          lines: [
            { acct: '5000', label: 'COGS - LPG', dr: 'WAC×KG', cr: 0 },
            { acct: '1200', label: 'Inventory - LPG', dr: 0, cr: 'WAC×KG' },
          ],
        });
      }
    }

    return lines;
  }, [summary, salesKg]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageTitle
          title="Operations Close Workspace"
          subtitle="Capture → Approve → Post to GL → Audit (GL-first daily close)"
        />
        <div className="flex gap-2">
          <Button variant="secondary" icon={RefreshCw} onClick={loadOrCreateSummary}>
            Refresh
          </Button>
          <Button variant="secondary" icon={ShieldAlert} onClick={refreshAudit}>
            Refresh Audit
          </Button>
        </div>
      </div>

      {/* Sticky status bar */}
      <Card className="bg-white/5 border border-white/10 p-4 rounded-xl sticky top-3 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
          <div className="lg:col-span-3">
            <label className="text-xs text-gray-400 block mb-1">Business Date (required)</label>
            <input
              type="date"
              className="w-full px-3 py-2 rounded-lg bg-black/30 text-white border border-white/10"
              value={businessDate}
              onChange={(e) => setBusinessDate(e.target.value)}
            />
          </div>

          <div className="lg:col-span-4">
            <label className="text-xs text-gray-400 block mb-1">Branch (required)</label>
            <select
              className="w-full px-3 py-2 rounded-lg bg-black/30 text-white border border-white/10"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
            >
              <option value="">Select branch…</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <div className="text-[10px] text-gray-500 mt-1">Branch maps to branchId / serviceZoneId (tolerant match)</div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-1 md:grid-cols-3 gap-2">
            <StatusPill label="Approval" value={approvalStatus} tone={approvalStatus === 'APPROVED' ? 'good' : 'warn'} />
            <StatusPill label="Posting" value={postingStatus} tone={postingStatus === 'POSTED' ? 'good' : postingStatus === 'FAILED' ? 'bad' : 'warn'} />
            <StatusPill label="Close" value={closeStatus} tone={closeStatus === 'CLOSABLE' ? 'good' : closeStatus === 'AWAITING_POST' ? 'warn' : 'neutral'} />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button icon={Send} onClick={doSubmitForApproval} disabled={!canSubmit || busyAction}>
            Submit for approval
          </Button>
          <Button icon={ClipboardCheck} variant="secondary" onClick={doApprove} disabled={!summary?._id || busyAction}>
            Approve
          </Button>
          <Button icon={XCircle} variant="secondary" onClick={doReject} disabled={!summary?._id || busyAction}>
            Reject
          </Button>
          <Button icon={BookOpen} onClick={doPostToGL} disabled={!canSubmit || busyAction}>
            Post to GL
          </Button>
          <Button icon={Hammer} variant="secondary" onClick={doRetryFailed} disabled={!canSubmit || busyAction}>
            Retry failed
          </Button>
          <div className="ml-auto text-xs text-gray-400 flex items-center">
            <span className="text-gray-500">Scope:</span>&nbsp;<span className="text-white">{branchLabel}</span>&nbsp;•&nbsp;
            <span className="text-gray-500">Date:</span>&nbsp;<span className="text-white">{businessDate || '—'}</span>
          </div>
        </div>

        {/* Enforcement warnings */}
        <div className="mt-3 space-y-2">
          {!canSubmit ? (
            <div className="text-xs bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-xl">
              Business Date and Branch are required before submission or posting.
            </div>
          ) : null}

          {warnNoSalesLines ? (
            <div className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-300 p-3 rounded-xl flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5" />
              <div>
                <div className="font-semibold">Sales totals exist, but no sales lines were captured.</div>
                <div className="text-[11px] text-amber-200/80 mt-1">
                  This is allowed for migrated history (DailySummary totals only), but for new operations you should capture sales lines.
                </div>
              </div>
            </div>
          ) : null}

          {errorMsg ? (
            <div className="text-xs bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-xl">{errorMsg}</div>
          ) : null}

          {infoMsg ? (
            <div className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-3 rounded-xl">
              {infoMsg}
            </div>
          ) : null}
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <TabButton active={tab === 'summary'} onClick={() => setTab('summary')}>
          Summary
        </TabButton>
        <TabButton active={tab === 'sales'} onClick={() => setTab('sales')}>
          Sales Lines
        </TabButton>
        <TabButton active={tab === 'expenses'} onClick={() => setTab('expenses')}>
          Expense Lines
        </TabButton>
        <TabButton active={tab === 'recon'} onClick={() => setTab('recon')}>
          Reconciliation
        </TabButton>
        <TabButton active={tab === 'preview'} onClick={() => setTab('preview')}>
          Posting Preview
        </TabButton>
        <TabButton active={tab === 'audit'} onClick={() => setTab('audit')}>
          GL Result / Audit
        </TabButton>
      </div>

      {/* Tab content */}
      {loading ? (
        <div className="p-10 text-center text-blue-400 animate-pulse">Loading workspace…</div>
      ) : (
        <>
          {tab === 'summary' && (
            <Card className="bg-white/5 border border-white/10 p-5 rounded-xl">
              <div className="text-sm font-bold text-white">Daily Summary (control doc)</div>
              <div className="text-xs text-gray-400 mt-1">
                This is your operational closeout document. GL is the system of record after posting.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                <div className="p-4 rounded-xl bg-black/20 border border-white/10">
                  <div className="text-[11px] text-gray-400">Sales Total</div>
                  <div className="text-xl font-bold text-white mt-1">₦{salesTotal.toLocaleString()}</div>
                  <div className="text-[10px] text-gray-500 mt-1">DailySummary.sales.totalRevenue</div>
                </div>
                <div className="p-4 rounded-xl bg-black/20 border border-white/10">
                  <div className="text-[11px] text-gray-400">Kg Sold</div>
                  <div className="text-xl font-bold text-white mt-1">{salesKg.toLocaleString()} kg</div>
                  <div className="text-[10px] text-gray-500 mt-1">DailySummary.sales.totalKgSold</div>
                </div>
                <div className="p-4 rounded-xl bg-black/20 border border-white/10">
                  <div className="text-[11px] text-gray-400">Business Date</div>
                  <div className="text-xl font-bold text-white mt-1">{fmtDate(summary?.date || businessDate)}</div>
                  <div className="text-[10px] text-gray-500 mt-1">DailySummary.date (NOT createdAt)</div>
                </div>
              </div>
            </Card>
          )}

          {tab === 'sales' && (
            <Card className="bg-white/5 border border-white/10 p-5 rounded-xl">
              <div className="text-sm font-bold text-white">Sales Lines</div>
              <div className="text-xs text-gray-400 mt-1">
                Migrated history may not have line items (totals only). For new days, capture sales lines here.
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-gray-400 border-b border-white/10">
                    <tr>
                      <th className="text-left py-2">Item</th>
                      <th className="text-right py-2">Qty</th>
                      <th className="text-right py-2">Unit</th>
                      <th className="text-right py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {salesLines.length === 0 ? (
                      <tr>
                        <td className="py-4 text-gray-500" colSpan={4}>
                          No sales lines found.
                        </td>
                      </tr>
                    ) : (
                      salesLines.map((s, idx) => (
                        <tr key={idx}>
                          <td className="py-2 text-white">{s?.productName || s?.item || 'Sale'}</td>
                          <td className="py-2 text-right text-gray-200">{safeNum(s?.quantity).toLocaleString()}</td>
                          <td className="py-2 text-right text-gray-400">{s?.unit || 'kg'}</td>
                          <td className="py-2 text-right text-gray-200">₦{safeNum(s?.amount).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {warnNoSalesLines ? (
                <div className="mt-4 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                  Warning: totals exist but no sales lines. For migrated data this is expected.
                </div>
              ) : null}
            </Card>
          )}

          {tab === 'expenses' && (
            <Card className="bg-white/5 border border-white/10 p-5 rounded-xl">
              <div className="text-sm font-bold text-white">Expense Lines</div>
              <div className="text-xs text-gray-400 mt-1">
                Expenses should be GL-native: business date + category mapping + payment disposition.
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-gray-400 border-b border-white/10">
                    <tr>
                      <th className="text-left py-2">Description</th>
                      <th className="text-left py-2">Category</th>
                      <th className="text-left py-2">Disposition</th>
                      <th className="text-right py-2">Amount</th>
                      <th className="text-left py-2">Posting</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {expenseLines.length === 0 ? (
                      <tr>
                        <td className="py-4 text-gray-500" colSpan={5}>
                          No expense lines found.
                        </td>
                      </tr>
                    ) : (
                      expenseLines.map((e, idx) => (
                        <tr key={idx}>
                          <td className="py-2 text-white">{e?.description || 'Expense'}</td>
                          <td className="py-2 text-gray-300">{e?.category || e?.type || '—'}</td>
                          <td className="py-2 text-gray-300">{e?.paymentDisposition || e?.paymentMethod || '—'}</td>
                          <td className="py-2 text-right text-gray-200">₦{safeNum(e?.amount).toLocaleString()}</td>
                          <td className="py-2 text-gray-400">{e?.posting?.status || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {tab === 'recon' && (
            <Card className="bg-white/5 border border-white/10 p-5 rounded-xl">
              <div className="text-sm font-bold text-white">Reconciliation</div>
              <div className="text-xs text-gray-400 mt-1">
                Shows what the business captured vs what finance will post.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                <div className="p-4 rounded-xl bg-black/20 border border-white/10">
                  <div className="text-[11px] text-gray-400">POS Split</div>
                  <div className="text-[12px] text-gray-200 mt-2 space-y-1">
                    <div className="flex justify-between">
                      <span>Cash</span>
                      <span className="font-mono">₦{safeNum(summary?.sales?.cashAmount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transfer</span>
                      <span className="font-mono">₦{safeNum(summary?.sales?.transferAmount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>POS</span>
                      <span className="font-mono">₦{safeNum(summary?.sales?.posAmount).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/20 border border-white/10">
                  <div className="text-[11px] text-gray-400">Sales Totals</div>
                  <div className="text-[12px] text-gray-200 mt-2 space-y-1">
                    <div className="flex justify-between">
                      <span>Total Revenue</span>
                      <span className="font-mono">₦{salesTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Kg</span>
                      <span className="font-mono">{salesKg.toLocaleString()} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price/kg</span>
                      <span className="font-mono">₦{safeNum(summary?.pricePerKg).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/20 border border-white/10">
                  <div className="text-[11px] text-gray-400">Reconciliation Delta</div>
                  <div className="text-2xl font-bold text-white mt-2">
                    {safeNum(summary?.reconciliation?.discrepancy).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">DailySummary.reconciliation.discrepancy</div>
                </div>
              </div>
            </Card>
          )}

          {tab === 'preview' && (
            <Card className="bg-white/5 border border-white/10 p-5 rounded-xl">
              <div className="text-sm font-bold text-white">Posting Preview</div>
              <div className="text-xs text-gray-400 mt-1">
                Preview of the journal lines that will be created (backend is source of truth).
              </div>

              <div className="mt-4 space-y-4">
                {postingPreview.length === 0 ? (
                  <div className="text-gray-500 text-sm">Nothing to post yet.</div>
                ) : (
                  postingPreview.map((block, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-black/20 border border-white/10">
                      <div className="text-white font-semibold">{block.title}</div>
                      {block.note ? <div className="text-[11px] text-gray-400 mt-1">{block.note}</div> : null}

                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="text-xs text-gray-400 border-b border-white/10">
                            <tr>
                              <th className="text-left py-2">Account</th>
                              <th className="text-left py-2">Name</th>
                              <th className="text-right py-2">Debit</th>
                              <th className="text-right py-2">Credit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {block.lines.map((l, i) => (
                              <tr key={i}>
                                <td className="py-2 text-gray-200 font-mono">{l.acct}</td>
                                <td className="py-2 text-gray-300">{l.label}</td>
                                <td className="py-2 text-right text-gray-200">{String(l.dr)}</td>
                                <td className="py-2 text-right text-gray-200">{String(l.cr)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}

          {tab === 'audit' && (
            <Card className="bg-white/5 border border-white/10 p-5 rounded-xl">
              <div className="text-sm font-bold text-white">GL Result / Audit</div>
              <div className="text-xs text-gray-400 mt-1">
                Trial balance + posting exceptions for this business date (best for “is GL balanced?” checks).
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                <div className="p-4 rounded-xl bg-black/20 border border-white/10">
                  <div className="text-white font-semibold flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-300" />
                    Trial Balance (Day)
                  </div>

                  {!tb ? (
                    <div className="text-gray-500 text-sm mt-2">No trial balance data.</div>
                  ) : (
                    <>
                      <div className="mt-2 text-[11px] text-gray-400">
                        Balanced:{' '}
                        <span className={tb?.totals?.balanced ? 'text-emerald-300' : 'text-red-300'}>
                          {tb?.totals?.balanced ? 'YES' : 'NO'}
                        </span>
                      </div>
                      <div className="mt-2 text-[12px] text-gray-200 space-y-1">
                        <div className="flex justify-between">
                          <span>Total Debit</span>
                          <span className="font-mono">{safeNum(tb?.totals?.debit).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Credit</span>
                          <span className="font-mono">{safeNum(tb?.totals?.credit).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Diff</span>
                          <span className="font-mono">{safeNum(tb?.totals?.diff).toLocaleString()}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-black/20 border border-white/10">
                  <div className="text-white font-semibold flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-300" />
                    Posting Exceptions (Day)
                  </div>

                  {!exceptions ? (
                    <div className="text-gray-500 text-sm mt-2">No exceptions data.</div>
                  ) : (
                    <>
                      <div className="mt-2 text-[11px] text-gray-400">
                        Failed total:{' '}
                        <span className="text-amber-300">{safeNum(exceptions?.totals?.failed).toLocaleString()}</span>
                      </div>

                      <div className="mt-3 space-y-2">
                        {exceptions?.reasons
                          ? Object.entries(exceptions.reasons).slice(0, 6).map(([code, v]) => (
                              <div key={code} className="text-xs p-3 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-gray-200">{code}</span>
                                  <span className="font-mono text-gray-300">{safeNum(v?.count).toLocaleString()}</span>
                                </div>
                                {Array.isArray(v?.examples) && v.examples.length ? (
                                  <div className="text-[10px] text-gray-500 mt-2">
                                    Example: {v.examples[0]?.sourceType} {v.examples[0]?.sourceId}
                                  </div>
                                ) : null}
                              </div>
                            ))
                          : <div className="text-gray-500 text-sm mt-2">No failures found.</div>}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}