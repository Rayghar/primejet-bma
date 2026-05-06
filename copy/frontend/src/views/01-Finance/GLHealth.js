// File: src/views/03-Finance/GLHealth.js
import React, { useEffect, useMemo, useState } from 'react';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import HelpPanel from '../../components/shared/HelpPanel';
import HelpTooltip from '../../components/shared/HelpTooltip';
import { GL_HELP, POSTING_HELP } from '../../utils/helpCatalog';
import { getPlants } from '../../api/operationsService';
import { glApproveSourceDiscrepancy, glPostingExceptions, glRetryFailed } from '../../api/glService';
import { RefreshCw, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';


const safeNum = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const openDatePicker = (event) => {
  try {
    if (event?.currentTarget?.showPicker) event.currentTarget.showPicker();
  } catch (_) {}
};

export default function GLHealth() {
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState('');
  const [startDate, setStartDate] = useState('2025-06-01');
  const [endDate, setEndDate] = useState('2025-06-30');

  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const fetchBranches = async () => {
    try {
      const plants = await getPlants();
      const normalized = Array.isArray(plants)
        ? plants
            .map((p) => ({ id: p?.id || p?._id, name: p?.name || 'Unnamed Branch' }))
            .filter((x) => x.id)
        : [];
      setBranches(normalized);
    } catch {
      setBranches([]);
    }
  };

  const fetchHealth = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError('');
    try {
      const res = await glPostingExceptions({
        startDate,
        endDate,
        branchIdOrZoneId: branchId || undefined,
      });
      setHealth(res || null);
    } catch (e) {
      console.error(e);
      setHealth(null);
      setError(e?.response?.data?.message || e?.message || 'Failed to load GL health.');
    } finally {
      setLoading(false);
    }
  };


  const retryFailedForPeriod = async () => {
    if (!startDate || !endDate) return;
    const confirmed = window.confirm(
      `Retry failed GL postings from ${startDate} to ${endDate}?\n\n` +
      'Use this after correcting source data/setup or after applying an automated posting tolerance fix.'
    );
    if (!confirmed) return;
    setActionLoading(true);
    setActionMessage('');
    setError('');
    try {
      await glRetryFailed({ startDate, endDate, branchIdOrZoneId: branchId || undefined });
      setActionMessage('Retry submitted. Refreshing GL Health now.');
      await fetchHealth();
    } catch (e) {
      setError(e?.message || 'Failed to retry failed postings.');
    } finally {
      setActionLoading(false);
    }
  };


  const approveDiscrepancyAndRetry = async (item) => {
    const defaultReason = `Approved historical tender variance for ${item?.businessDate || 'selected date'}; warehouse difference in Cash Over/Short.`;
    const reason = window.prompt(
      'Enter approval reason. The difference will be posted to Cash Over/Short when you retry/rebuild GL.',
      defaultReason
    );
    if (!reason || !String(reason).trim()) return;
    setActionLoading(true);
    setActionMessage('');
    setError('');
    try {
      await glApproveSourceDiscrepancy({
        sourceType: item.sourceType,
        sourceId: item.sourceId,
        reason,
      });
      setActionMessage('Discrepancy approved. Click Retry Failed to post it to Cash Over/Short, or use Rebuild GL for the selected period.');
      await fetchHealth();
    } catch (e) {
      setError(e?.message || 'Failed to approve discrepancy.');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, startDate, endDate]);

  const reasons = useMemo(() => {
    const r = health?.exceptions?.reasons || health?.reasons || {};
    const keys = Object.keys(r);
    keys.sort((a, b) => (r[b]?.count || 0) - (r[a]?.count || 0));
    return keys.map((k) => ({ code: k, count: r[k]?.count || 0, examples: r[k]?.examples || [] }));
  }, [health]);

  const failedTotal = useMemo(() => health?.failedPostingCount || health?.exceptions?.totals?.failed || health?.totals?.failed || 0, [health]);

  const failedItems = useMemo(() => health?.items || health?.exceptions?.items || [], [health]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageTitle title="GL Health" subtitle="Posting exceptions and migration readiness" />
        <div className="flex gap-2">
          <Button variant="secondary" icon={RefreshCw} onClick={fetchHealth}>
            Refresh
          </Button>
          <Button icon={RotateCcw} onClick={retryFailedForPeriod} disabled={actionLoading || failedTotal <= 0}>
            {actionLoading ? 'Retrying...' : 'Retry Failed'}
          </Button>
        </div>
      </div>

      <HelpPanel
        title="GL Health guide"
        items={[
          { key: 'failedPostings', label: 'Failed Postings', help: POSTING_HELP.failedPostings },
          { key: 'retryFailed', label: 'Retry Failed', help: GL_HELP.retryFailed },
          { key: 'postingBatch', label: 'Posting Batch', help: GL_HELP.postingBatch },
        ]}
      />

      <Card className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-xs text-gray-400">Branch</label>
            <select
              className="w-full mt-1 px-3 py-2 rounded-lg bg-black/30 text-white border border-white/10"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400">Start</label>
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
            <label className="text-xs text-gray-400">End</label>
            <input
              type="date"
              onClick={openDatePicker}
              onFocus={openDatePicker}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-black/30 text-white border border-white/10"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="text-xs text-gray-400 md:text-right">
            {failedTotal > 0 ? (
              <span className="inline-flex items-center gap-1 text-amber-300">
                <AlertTriangle size={14} /> {failedTotal} failed postings
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-300">
                <CheckCircle2 size={14} /> No posting failures
              </span>
            )}
          </div>
        </div>
      </Card>

      {actionMessage ? <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">{actionMessage}</div> : null}

      {loading ? (
        <div className="p-10 text-center text-blue-400 animate-pulse">Loading GL health...</div>
      ) : error ? (
        <div className="p-10 text-center text-gray-400">{error}</div>
      ) : !health ? (
        <div className="p-10 text-center text-gray-500">No data.</div>
      ) : (
        <>
          <Card className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-sm font-semibold text-white mb-2 flex items-center gap-1">Failures by Reason <HelpTooltip text={POSTING_HELP.failedPostings} /></div>

            {reasons.length === 0 ? (
              <div className="text-xs text-gray-500">No failures in this period.</div>
            ) : (
              <div className="space-y-3">
                {reasons.map((r) => (
                  <div key={r.code} className="p-3 rounded-xl bg-black/20 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-200 font-semibold">{r.code}</div>
                      <div className="text-xs text-amber-300">{r.count}</div>
                    </div>

                    {r.examples.length ? (
                      <div className="mt-2 text-[11px] text-gray-400">
                        Examples:
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          {r.examples.slice(0, 5).map((ex, idx) => (
                            <li key={idx}>
                              <span className="text-gray-200">{ex.sourceType}</span> • {ex.sourceId} • {ex.businessDate}{' '}
                              {ex.message ? <span className="text-gray-500">— {ex.message}</span> : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-sm font-semibold text-white mb-2 flex items-center gap-1">Failed Source Posting Details <HelpTooltip text="Detailed failed source records. Failed records are not reversed because they were not posted; correct source/setup then retry. Posted journals are reversed in the GL Reversals screen." /></div>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="min-w-full text-xs">
                <thead className="bg-white/5 text-gray-300">
                  <tr>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Source</th>
                    <th className="px-3 py-2 text-left">Reason</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2 text-right">KG</th>
                    <th className="px-3 py-2 text-left">Message</th>
                    <th className="px-3 py-2 text-left">Recommended Action</th>
                    <th className="px-3 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {failedItems.length ? failedItems.map((item) => (
                    <tr key={`${item.sourceType}-${item.sourceId}`} className="text-gray-200 align-top">
                      <td className="px-3 py-2 whitespace-nowrap">{item.businessDate || '-'}</td>
                      <td className="px-3 py-2"><div className="font-semibold">{item.sourceType}</div><div className="text-[10px] text-gray-500 break-all">{item.sourceId}</div></td>
                      <td className="px-3 py-2 text-amber-300">{item.reasonCode}</td>
                      <td className="px-3 py-2 text-right">₦{safeNum(item.amount, 0).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">{safeNum(item.kg, 0).toLocaleString()}</td>
                      <td className="px-3 py-2 text-gray-400 max-w-md">{item.message || '-'}</td>
                      <td className="px-3 py-2 text-blue-200 max-w-md">{item.recommendation || 'Correct the source/setup issue, then Retry Failed.'}</td>
                      <td className="px-3 py-2">
                        {item.sourceType === 'DAILY_SUMMARY' && item.reasonCode === 'DAILY_TENDER_MISMATCH' ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => approveDiscrepancyAndRetry(item)}
                            disabled={actionLoading}
                          >
                            Approve Variance
                          </Button>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="8" className="px-3 py-6 text-center text-gray-500">No failed source posting details found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-sm font-semibold text-white">What to do next</div>
            <ul className="mt-2 list-disc pl-5 text-xs text-gray-300 space-y-1">
              <li>For failed records, fix the source record or setup issue shown above. Failed records are not reversed because no GL journal was created.</li>
              <li>For DAILY_TENDER_MISMATCH above tolerance, either correct the source values or click Approve Variance to warehouse the difference in Cash Over/Short, then click Retry Failed.</li>
              <li>For posted-but-wrong journals, go to Finance & ERP → GL Reversals and request/approve a reversal instead of deleting records.</li>
              <li>Confirm Trial Balance is balanced, then proceed to Financial Statements and period lock.</li>
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}