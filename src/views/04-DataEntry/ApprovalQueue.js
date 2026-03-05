// src/views/Finance/ApprovalQueue.js
import React, { useEffect, useMemo, useState } from 'react';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import { getPendingApprovals, approveSummary, rejectSummary } from '../../api/dataEntryService';
import { glPostApproved, glRetryFailed, glPostingExceptions } from '../../api/glService';
import { RefreshCw, CheckCircle2, XCircle, BookOpen, AlertTriangle, Hammer } from 'lucide-react';

const safeNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const fmt = (d) => {
  const x = d ? new Date(d) : null;
  if (!x || Number.isNaN(x.getTime())) return '—';
  return x.toISOString().slice(0, 10);
};

const Badge = ({ text, tone = 'neutral' }) => {
  const cls =
    tone === 'good'
      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
      : tone === 'warn'
      ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
      : tone === 'bad'
      ? 'bg-red-500/10 border-red-500/20 text-red-300'
      : 'bg-white/5 border-white/10 text-gray-300';

  return <span className={`text-[10px] px-2 py-1 rounded-lg border ${cls}`}>{text}</span>;
};

export default function ApprovalQueue() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');

  // optional filters (simple)
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const load = async () => {
    setLoading(true);
    setErr('');
    setInfo('');
    try {
      const r = await getPendingApprovals();
      setRows(Array.isArray(r) ? r : []);
    } catch (e) {
      setErr(e?.message || 'Failed to load approvals.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doApprove = async (id) => {
    setErr('');
    setInfo('');
    try {
      await approveSummary(id);
      setInfo('Approved.');
      await load();
    } catch (e) {
      setErr(e?.message || 'Approve failed');
    }
  };

  const doReject = async (id) => {
    setErr('');
    setInfo('');
    try {
      await rejectSummary(id);
      setInfo('Rejected.');
      await load();
    } catch (e) {
      setErr(e?.message || 'Reject failed');
    }
  };

  const doPostDay = async (date, branchId) => {
    setErr('');
    setInfo('');
    try {
      const r = await glPostApproved({ businessDate: date, branchIdOrZoneId: branchId });
      setInfo(`Posted to GL: ${JSON.stringify(r?.posted || {})}`);
      await load();
    } catch (e) {
      setErr(e?.message || 'Posting failed');
    }
  };

  const doRetryRange = async () => {
    setErr('');
    setInfo('');
    if (!startDate || !endDate) {
      setErr('Select startDate and endDate to retry failed.');
      return;
    }
    try {
      const r = await glRetryFailed({ startDate, endDate });
      setInfo(`Retry done: ${JSON.stringify(r?.failed || {})}`);
    } catch (e) {
      setErr(e?.message || 'Retry failed');
    }
  };

  const doLoadExceptions = async () => {
    setErr('');
    setInfo('');
    if (!startDate || !endDate) {
      setErr('Select startDate and endDate to load exceptions.');
      return;
    }
    try {
      const ex = await glPostingExceptions({ startDate, endDate });
      const failed = safeNum(ex?.totals?.failed);
      setInfo(`Exceptions loaded. Failed: ${failed}`);
    } catch (e) {
      setErr(e?.message || 'Failed to load exceptions');
    }
  };

  const tableRows = useMemo(() => rows, [rows]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageTitle title="Accounting Control Tower" subtitle="Approvals → Posting → Exceptions (GL-first)" />
        <Button variant="secondary" icon={RefreshCw} onClick={load}>
          Refresh
        </Button>
      </div>

      {(err || info) && (
        <Card className="bg-white/5 border border-white/10 p-4 rounded-xl">
          {err ? <div className="text-xs text-red-300">{err}</div> : null}
          {info ? <div className="text-xs text-emerald-300">{info}</div> : null}
        </Card>
      )}

      <Card className="bg-white/5 border border-white/10 p-4 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Start</label>
            <input
              type="date"
              className="w-full px-3 py-2 rounded-lg bg-black/30 text-white border border-white/10"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">End</label>
            <input
              type="date"
              className="w-full px-3 py-2 rounded-lg bg-black/30 text-white border border-white/10"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button icon={Hammer} variant="secondary" onClick={doRetryRange}>
              Retry failed (range)
            </Button>
            <Button icon={AlertTriangle} variant="secondary" onClick={doLoadExceptions}>
              Load exceptions
            </Button>
          </div>
        </div>
      </Card>

      <Card className="bg-white/5 border border-white/10 p-0 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-blue-400 animate-pulse">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-400 border-b border-white/10 bg-black/20">
                <tr>
                  <th className="text-left py-3 px-4">Business Date</th>
                  <th className="text-left py-3 px-4">Branch</th>
                  <th className="text-right py-3 px-4">Revenue</th>
                  <th className="text-left py-3 px-4">Approval</th>
                  <th className="text-left py-3 px-4">Posting</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tableRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 px-4 text-gray-500">
                      No items in queue.
                    </td>
                  </tr>
                ) : (
                  tableRows.map((s) => {
                    const approval = String(s?.status || '').toLowerCase();
                    const post = String(s?.posting?.status || 'UNPOSTED').toUpperCase();
                    const rev = safeNum(s?.sales?.totalRevenue);

                    return (
                      <tr key={s._id}>
                        <td className="py-3 px-4 text-gray-200">{fmt(s?.date)}</td>
                        <td className="py-3 px-4 text-gray-300">{String(s?.branchId || '—')}</td>
                        <td className="py-3 px-4 text-right text-gray-200">₦{rev.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <Badge
                            text={approval.toUpperCase() || '—'}
                            tone={approval === 'approved' ? 'good' : approval.includes('reject') ? 'bad' : 'warn'}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            text={post}
                            tone={post === 'POSTED' ? 'good' : post === 'FAILED' ? 'bad' : 'warn'}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2 justify-end">
                            <Button icon={CheckCircle2} onClick={() => doApprove(s._id)}>
                              Approve
                            </Button>
                            <Button icon={XCircle} variant="secondary" onClick={() => doReject(s._id)}>
                              Reject
                            </Button>
                            <Button
                              icon={BookOpen}
                              variant="secondary"
                              onClick={() => doPostDay(fmt(s?.date), String(s?.branchId || ''))}
                            >
                              Post day
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}