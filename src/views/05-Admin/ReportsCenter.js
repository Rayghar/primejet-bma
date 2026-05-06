import React, { useEffect, useMemo, useState } from 'react';
import httpClient from '../../api/httpClient';
import PageTitle from '../../components/shared/PageTitle';
import Button from '../../components/shared/Button';
import { Download, FileText, Filter, RefreshCw, ShieldCheck } from 'lucide-react';
import { getBranchOptions } from '../../api/userService';

const dateStr = (d) => d.toISOString().slice(0, 10);
const today = () => dateStr(new Date());
const monthStart = () => dateStr(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
const lastMonthStart = () => dateStr(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1));
const lastMonthEnd = () => dateStr(new Date(new Date().getFullYear(), new Date().getMonth(), 0));
const quarterStart = () => { const n = new Date(); return dateStr(new Date(n.getFullYear(), Math.floor(n.getMonth() / 3) * 3, 1)); };
const yearStart = () => dateStr(new Date(new Date().getFullYear(), 0, 1));

const REPORT_TYPES = [
  {
    id: 'management-accounts',
    name: 'Management Accounts Pack',
    description: 'P&L, balance sheet, cash flow, ratios and key source notes.',
    endpoint: '/financials/export',
    params: { type: 'management-accounts' },
    owner: 'Finance / Management',
  },
  {
    id: 'cash-movement',
    name: 'Cash Movement Report',
    description: 'Posted GL lines for cash, bank transfer and POS settlement accounts.',
    endpoint: '/financials/export',
    params: { type: 'cash-movement' },
    owner: 'Finance Ops',
  },
  {
    id: 'expense-analysis',
    name: 'Expense Analysis Report',
    description: 'Expenses by category, payment disposition and transaction details.',
    endpoint: '/financials/export',
    params: { type: 'expense-analysis' },
    owner: 'Finance Ops',
  },
  {
    id: 'branch-pl',
    name: 'Branch P&L Report',
    description: 'Branch-level revenue, COGS, OPEX and net profit from posted GL journals.',
    endpoint: '/financials/export',
    params: { type: 'branch-pl' },
    owner: 'Finance / Investors',
  },
  {
    id: 'wallet-liability',
    name: 'Wallet Liability Review',
    description: 'Wallet movement and closing liability review where wallet ledger exists.',
    endpoint: '/financials/export',
    params: { type: 'wallet-liability' },
    owner: 'Finance Ops',
  },
  {
    id: 'failed-payments',
    name: 'Failed Payment Queue',
    description: 'Failed, delayed or unresolved payment exposure for operational follow-up.',
    endpoint: '/financials/export',
    params: { type: 'failed-payments' },
    owner: 'Payment Ops',
  },
  {
    id: 'gl-journals',
    name: 'GL Journals Export',
    description: 'Detailed GL journal export for audit, source tracing and reversal review.',
    endpoint: '/gl/journals/export',
    params: {},
    owner: 'Finance / Audit',
  },
];

function applyPreset(preset, current) {
  if (preset === 'custom') return current;
  if (preset === 'thisMonth') return { ...current, startDate: monthStart(), endDate: today() };
  if (preset === 'lastMonth') return { ...current, startDate: lastMonthStart(), endDate: lastMonthEnd() };
  if (preset === 'thisQuarter') return { ...current, startDate: quarterStart(), endDate: today() };
  if (preset === 'thisYear') return { ...current, startDate: yearStart(), endDate: today() };
  return current;
}

function buildFilename(reportId, startDate, endDate) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${reportId}_${startDate || 'start'}_${endDate || 'end'}_${stamp}.csv`;
}

export default function ReportsCenter({ setActiveView }) {
  const [selectedReportId, setSelectedReportId] = useState(REPORT_TYPES[0].id);
  const [periodPreset, setPeriodPreset] = useState('thisMonth');
  const [filters, setFilters] = useState({ startDate: monthStart(), endDate: today(), branchIdOrZoneId: '', sourceMode: 'auto' });
  const [branchOptions, setBranchOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selectedReport = useMemo(() => REPORT_TYPES.find((r) => r.id === selectedReportId) || REPORT_TYPES[0], [selectedReportId]);

  const loadBranches = async () => {
    try {
      const rows = await getBranchOptions();
      setBranchOptions((Array.isArray(rows) ? rows : [])
        .map((b) => ({ id: b.id || b._id || b.branchId || b.value, name: b.name || b.branchName || b.label || b.code || 'Unnamed Branch' }))
        .filter((b) => b.id));
    } catch (e) {
      console.error('Failed to load report branches:', e);
      setBranchOptions([]);
    }
  };

  useEffect(() => { loadBranches(); }, []);

  const handlePresetChange = (preset) => {
    setPeriodPreset(preset);
    setFilters((prev) => applyPreset(preset, prev));
  };

  const handleExport = async () => {
    if (!filters.startDate || !filters.endDate) {
      setError('Please select a start and end date.');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const params = {
        ...selectedReport.params,
        period: 'custom',
        startDate: filters.startDate,
        endDate: filters.endDate,
        sourceMode: filters.sourceMode,
      };
      if (filters.branchIdOrZoneId) {
        params.branchId = filters.branchIdOrZoneId;
        params.serviceZoneId = filters.branchIdOrZoneId;
      }
      const response = await httpClient.get(selectedReport.endpoint, { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', buildFilename(selectedReport.id, filters.startDate, filters.endDate));
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage(`${selectedReport.name} exported successfully.`);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || e?.message || 'Export failed. Confirm data exists and the endpoint is enabled.');
    } finally {
      setLoading(false);
    }
  };

  const openFormattedStatement = () => {
    if (setActiveView) setActiveView('FinancialStatements');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageTitle title="Reports Center" subtitle="Working exports for management, finance, audit and investor reporting" />
        <Button icon={RefreshCw} variant="secondary" onClick={loadBranches}>Refresh Branches</Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="glass-card h-fit">
          <h3 className="text-white font-bold mb-4 flex items-center"><Filter size={18} className="mr-2 text-blue-400"/> Report Configuration</h3>
          <div className="space-y-4">
            <label className="block text-gray-300 text-xs">Report Type
              <select className="glass-input w-full p-3 mt-1 bg-slate-900" value={selectedReportId} onChange={(e) => setSelectedReportId(e.target.value)}>
                {REPORT_TYPES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </label>

            <label className="block text-gray-300 text-xs">Period
              <select className="glass-input w-full p-3 mt-1 bg-slate-900" value={periodPreset} onChange={(e) => handlePresetChange(e.target.value)}>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="thisQuarter">This Quarter</option>
                <option value="thisYear">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="block text-gray-300 text-xs">Start Date
                <input type="date" className="glass-input w-full p-2 mt-1" value={filters.startDate} onChange={(e) => { setPeriodPreset('custom'); setFilters({ ...filters, startDate: e.target.value }); }} />
              </label>
              <label className="block text-gray-300 text-xs">End Date
                <input type="date" className="glass-input w-full p-2 mt-1" value={filters.endDate} onChange={(e) => { setPeriodPreset('custom'); setFilters({ ...filters, endDate: e.target.value }); }} />
              </label>
            </div>

            <label className="block text-gray-300 text-xs">Branch / Plant
              <select className="glass-input w-full p-3 mt-1 bg-slate-900" value={filters.branchIdOrZoneId} onChange={(e) => setFilters({ ...filters, branchIdOrZoneId: e.target.value })}>
                <option value="">All Branches</option>
                {branchOptions.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </label>

            <label className="block text-gray-300 text-xs">Statement Source Mode
              <select className="glass-input w-full p-3 mt-1 bg-slate-900" value={filters.sourceMode} onChange={(e) => setFilters({ ...filters, sourceMode: e.target.value })}>
                <option value="auto">Auto</option>
                <option value="gl">GL only</option>
                <option value="operational">Operational</option>
              </select>
            </label>

            {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
            {message && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{message}</div>}

            <div className="pt-4 border-t border-white/10 flex gap-2">
              <Button className="flex-1 bg-green-600 hover:bg-green-500" onClick={handleExport} disabled={loading}>
                <Download size={16} className="mr-2"/> {loading ? 'Exporting…' : 'Export CSV'}
              </Button>
              <Button className="flex-1" variant="secondary" onClick={openFormattedStatement} disabled={!setActiveView}>
                <FileText size={16} className="mr-2"/> Statement View
              </Button>
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 space-y-4">
          <div className="glass-card border border-blue-500/20">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-blue-500/10 rounded-2xl"><FileText size={28} className="text-blue-300" /></div>
              <div>
                <h2 className="text-xl font-bold text-white">{selectedReport.name}</h2>
                <p className="text-gray-400 mt-1">{selectedReport.description}</p>
                <p className="text-xs text-blue-200 mt-3">Owner: {selectedReport.owner}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REPORT_TYPES.map((r) => (
              <button key={r.id} onClick={() => setSelectedReportId(r.id)} className={`text-left rounded-2xl border p-4 transition-all ${selectedReportId === r.id ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 bg-slate-900/50 hover:bg-white/5'}`}>
                <div className="flex items-center gap-2 text-white font-semibold"><ShieldCheck size={16} className="text-emerald-300" />{r.name}</div>
                <p className="text-xs text-slate-400 mt-2">{r.description}</p>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
            PDF-style output is handled from <b>Financial Statements → Export PDF</b>, because that page renders the formatted management accounts. This Reports Center focuses on reliable CSV exports for audit and Excel analysis.
          </div>
        </div>
      </div>
    </div>
  );
}
