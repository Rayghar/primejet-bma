// src/views/Finance/TransactionHistory.js
import React, { useEffect, useMemo, useState } from 'react';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import { getTransactionHistory } from '../../api/dataEntryService';
import { RefreshCw } from 'lucide-react';

const safeNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const fmt = (d) => {
  const x = d ? new Date(d) : null;
  if (!x || Number.isNaN(x.getTime())) return '—';
  return x.toISOString().slice(0, 10);
};

const Tab = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm font-semibold ${
      active ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'
    }`}
  >
    {children}
  </button>
);

export default function TransactionHistory() {
  const [mode, setMode] = useState('source'); // 'source' | 'gl'
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      if (mode === 'gl') {
        // Stub until backend adds: GET /api/v2/gl/journals?startDate&endDate
        setRows([]);
        setErr('GL Journals view needs backend endpoint: GET /api/v2/gl/journals (not enabled yet).');
        return;
      }

      const filters = {};
      if (startDate && endDate) {
        filters.startDate = startDate;
        filters.endDate = endDate;
      }

      const r = await getTransactionHistory(filters);
      setRows(Array.isArray(r) ? r : []);
    } catch (e) {
      setErr(e?.message || 'Failed to load history.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const shaped = useMemo(() => rows, [rows]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageTitle title="Transaction Trace" subtitle="Source Docs ↔ GL Journals (traceability)" />
        <Button variant="secondary" icon={RefreshCw} onClick={load}>
          Refresh
        </Button>
      </div>

      <Card className="bg-white/5 border border-white/10 p-4 rounded-xl">
        <div className="flex flex-wrap gap-2 items-center">
          <Tab active={mode === 'source'} onClick={() => setMode('source')}>
            Source Docs
          </Tab>
          <Tab active={mode === 'gl'} onClick={() => setMode('gl')}>
            GL Journals
          </Tab>

          <div className="ml-auto flex gap-2 items-end">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Start</label>
              <input
                type="date"
                className="px-3 py-2 rounded-lg bg-black/30 text-white border border-white/10"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">End</label>
              <input
                type="date"
                className="px-3 py-2 rounded-lg bg-black/30 text-white border border-white/10"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button onClick={load}>Apply</Button>
          </div>
        </div>

        {err ? <div className="mt-3 text-xs text-red-300">{err}</div> : null}
      </Card>

      <Card className="bg-white/5 border border-white/10 p-0 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-blue-400 animate-pulse">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-400 border-b border-white/10 bg-black/20">
                <tr>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Description</th>
                  <th className="text-right py-3 px-4">Amount</th>
                  <th className="text-left py-3 px-4">Posting</th>
                  <th className="text-left py-3 px-4">GL Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {shaped.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 px-4 text-gray-500">
                      No records.
                    </td>
                  </tr>
                ) : (
                  shaped.map((t) => (
                    <tr key={t._id}>
                      <td className="py-3 px-4 text-gray-200">{fmt(t?.date || t?.createdAt)}</td>
                      <td className="py-3 px-4 text-gray-300">{t?.type || t?.sourceType || '—'}</td>
                      <td className="py-3 px-4 text-gray-200">{t?.description || t?.narration || '—'}</td>
                      <td className="py-3 px-4 text-right text-gray-200">₦{safeNum(t?.amount).toLocaleString()}</td>
                      <td className="py-3 px-4 text-gray-300">{t?.posting?.status || '—'}</td>
                      <td className="py-3 px-4 text-gray-400 font-mono">
                        {t?.posting?.glEntryId || (Array.isArray(t?.posting?.glEntryIds) ? t.posting.glEntryIds[0] : '—')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}