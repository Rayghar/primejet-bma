// src/views/01-Finance/PlantProfitability.js
import React, { useEffect, useState, useCallback } from 'react';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import HelpPanel from '../../components/shared/HelpPanel';
import HelpTooltip from '../../components/shared/HelpTooltip';
import { PLANT_OPS_HELP, GL_HELP } from '../../utils/helpCatalog';
import { RefreshCw, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { getBranchProfitabilityReport } from '../../api/inventoryService';

const today = () => new Date().toISOString().slice(0, 10);
const migrationStart = () => '2025-06-01';
const monthStart = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
const yearStart = () => new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
const safeNum = (v, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d; };

export default function PlantProfitability() {
  const [period, setPeriod] = useState('allMigrated');
  const [startDate, setStartDate] = useState(migrationStart());
  const [endDate, setEndDate] = useState(today());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (period === 'monthly') { setStartDate(monthStart()); setEndDate(today()); }
    if (period === 'yearly') { setStartDate(yearStart()); setEndDate(today()); }
    if (period === 'allMigrated') { setStartDate(migrationStart()); setEndDate(today()); }
  }, [period]);

  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await getBranchProfitabilityReport({ startDate, endDate });
      setRows(Array.isArray(data?.rows) ? data.rows : []);
    } catch (e) {
      setError(e.message || 'Failed to load branch profitability.');
      setRows([]);
    } finally { setLoading(false); }
  }, [startDate, endDate]);

  useEffect(() => { refresh(); }, [refresh]);

  const totals = rows.reduce((a, r) => ({
    revenue: a.revenue + safeNum(r.revenue),
    cogs: a.cogs + safeNum(r.cogs),
    grossProfit: a.grossProfit + safeNum(r.grossProfit),
    opex: a.opex + safeNum(r.opex),
    netProfit: a.netProfit + safeNum(r.netProfit),
    kgSold: a.kgSold + safeNum(r.kgSold),
    stockVariance: a.stockVariance + safeNum(r.stockVariance),
  }), { revenue: 0, cogs: 0, grossProfit: 0, opex: 0, netProfit: 0, kgSold: 0, stockVariance: 0 });

  const margin = totals.revenue > 0 ? (totals.grossProfit / totals.revenue) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageTitle title="Branch Profitability" subtitle="Revenue, COGS, gross profit, operating expenses and net profit by plant/branch" />
        <Button icon={RefreshCw} variant="secondary" onClick={refresh}>{loading ? 'Loading...' : 'Refresh'}</Button>
      </div>

      <HelpPanel
        title="Branch profitability guide"
        items={[
          { key: 'branchProfitability', label: 'Branch Profitability', help: PLANT_OPS_HELP.branchProfitability },
          { key: 'wac', label: 'WAC/kg', help: PLANT_OPS_HELP.wac },
          { key: 'cogsActivation', label: 'COGS', help: PLANT_OPS_HELP.cogsActivation },
          { key: 'financeConfidence', label: 'Finance Confidence', help: GL_HELP.financeConfidence },
        ]}
      />

      <Card className="bg-white/5 border border-white/10 p-4 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="text-xs text-gray-400">Period</label>
            <select className="glass-input w-full p-2" value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="monthly">This Month</option>
              <option value="yearly">This Year</option>
              <option value="allMigrated">All Migrated Data</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          <div><label className="text-xs text-gray-400">Start Date</label><input className="glass-input w-full p-2" type="date" value={startDate} disabled={period !== 'custom'} onChange={(e) => setStartDate(e.target.value)} /></div>
          <div><label className="text-xs text-gray-400">End Date</label><input className="glass-input w-full p-2" type="date" value={endDate} disabled={period !== 'custom'} onChange={(e) => setEndDate(e.target.value)} /></div>
          <div className="md:col-span-2 text-xs text-amber-200 flex items-end gap-1"><AlertTriangle size={14}/> Uses business dates. “This Year” is Jan 1 to today; use Custom Range for June 2025 to date validation. COGS depends on stock-in/opening stock quality.</div>
        </div>
      </Card>

      {error && <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-200 text-sm">{error}. Confirm the backend has the branch-code/ObjectId profitability fix and that the selected date range includes migrated business dates.</div>}

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="p-4 bg-white/5 border border-white/10"><div className="text-xs text-gray-400">Revenue</div><div className="text-xl font-bold text-white">{formatCurrency(totals.revenue)}</div></Card>
        <Card className="p-4 bg-white/5 border border-white/10"><div className="text-xs text-gray-400 flex items-center gap-1">COGS <HelpTooltip text={PLANT_OPS_HELP.cogsActivation} /></div><div className="text-xl font-bold text-red-300">{formatCurrency(totals.cogs)}</div></Card>
        <Card className="p-4 bg-white/5 border border-white/10"><div className="text-xs text-gray-400 flex items-center gap-1">Gross Profit <HelpTooltip text={PLANT_OPS_HELP.branchProfitability} /></div><div className="text-xl font-bold text-emerald-300">{formatCurrency(totals.grossProfit)}</div></Card>
        <Card className="p-4 bg-white/5 border border-white/10"><div className="text-xs text-gray-400">Net Profit</div><div className={(totals.netProfit >= 0 ? 'text-xl font-bold text-emerald-300' : 'text-xl font-bold text-red-300')}>{formatCurrency(totals.netProfit)}</div></Card>
        <Card className="p-4 bg-white/5 border border-white/10"><div className="text-xs text-gray-400">Gross Margin</div><div className="text-xl font-bold text-white">{margin.toFixed(1)}%</div></Card>
        <Card className="p-4 bg-white/5 border border-white/10"><div className="text-xs text-gray-400 flex items-center gap-1">Stock Variance <HelpTooltip text={PLANT_OPS_HELP.stockReconciliation} /></div><div className={(totals.stockVariance >= 0 ? 'text-xl font-bold text-emerald-300' : 'text-xl font-bold text-red-300')}>{formatCurrency(totals.stockVariance)}</div></Card>
      </div>

      <Card className="bg-white/5 border border-white/10 p-4 rounded-xl">
        <h3 className="font-bold text-white flex items-center gap-2"><TrendingUp size={18}/> Branch Profitability Table</h3>
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 text-gray-400"><tr><th className="text-left py-2">Branch</th><th className="text-right">KG Sold</th><th className="text-right">POS Rev.</th><th className="text-right">Delivery Rev.</th><th className="text-right">Revenue</th><th className="text-right">WAC/kg</th><th className="text-right">COGS</th><th className="text-right">Stock Var.</th><th className="text-right">Gross Profit</th><th className="text-right">OPEX</th><th className="text-right">Net Profit</th><th className="text-right">GM%</th><th className="text-left">COGS Source</th></tr></thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((r) => <tr key={r.branchId}><td className="py-2 text-white">{r.branchName}</td><td className="text-right">{safeNum(r.kgSold).toLocaleString()}</td><td className="text-right">{formatCurrency(r.posRevenue)}</td><td className="text-right">{formatCurrency(r.deliveryRevenue)}</td><td className="text-right">{formatCurrency(r.revenue)}</td><td className="text-right">{formatCurrency(r.wacCostPerKg)}</td><td className="text-right text-red-300">{formatCurrency(r.cogs)}</td><td className={safeNum(r.stockVariance) >= 0 ? 'text-right text-emerald-300' : 'text-right text-red-300'}>{formatCurrency(r.stockVariance)}</td><td className="text-right text-emerald-300">{formatCurrency(r.grossProfit)}</td><td className="text-right text-red-300">{formatCurrency(r.opex)}</td><td className={safeNum(r.netProfit) >= 0 ? 'text-right text-emerald-300' : 'text-right text-red-300'}>{formatCurrency(r.netProfit)}</td><td className="text-right">{safeNum(r.grossMarginPct).toFixed(1)}%</td><td className="text-left text-xs text-gray-400">{r.cogsSource || '—'}</td></tr>)}
              {rows.length === 0 && <tr><td colSpan="13" className="text-center text-gray-500 py-10">No branch profitability data for the selected period.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
