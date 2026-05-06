// src/views/03-Intelligence/BusinessIntelligenceCommandCenter.js
import React, { useEffect, useState } from 'react';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import HelpPanel from '../../components/shared/HelpPanel';
import { getExecutiveIntelligence, getActionRecommendations, getModuleIntelligence } from '../../api/businessIntelligenceService';
import { RefreshCw, TrendingUp, AlertTriangle, Activity, DollarSign, Package, Users, CheckCircle } from 'lucide-react';

const num = (v) => Number(v || 0);
const fmt = (v) => num(v).toLocaleString();
const money = (v) => `₦${fmt(v)}`;
const pct = (v) => `${num(v).toFixed(1)}%`;

const CardMetric = ({ icon: Icon, label, value, hint }) => (
  <Card className="p-4">
    <div className="flex items-center gap-3">
      <div className="p-3 bg-purple-500/10 text-purple-300 rounded-xl"><Icon size={20} /></div>
      <div><div className="text-xs uppercase text-slate-400 tracking-wider">{label}</div><div className="text-2xl font-bold text-white">{value}</div>{hint && <div className="text-xs text-slate-500">{hint}</div>}</div>
    </div>
  </Card>
);

const Priority = ({ value }) => {
  const tone = value === 'CRITICAL' ? 'bg-red-600/30 text-red-200' : value === 'HIGH' ? 'bg-red-500/20 text-red-300' : value === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300';
  return <span className={`px-2 py-1 rounded-full text-xs font-bold ${tone}`}>{value}</span>;
};

export default function BusinessIntelligenceCommandCenter() {
  const [loading, setLoading] = useState(false);
  const [executive, setExecutive] = useState({ scorecards: {}, dataConfidence: {} });
  const [actions, setActions] = useState([]);
  const [modules, setModules] = useState({ sales: {}, finance: {}, operations: {}, branches: [], plants: [] });
  const [period, setPeriod] = useState('monthly');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const params = { period };
      const [e, a, m] = await Promise.all([getExecutiveIntelligence(params), getActionRecommendations(params), getModuleIntelligence(params)]);
      setExecutive(e || {}); setActions(a?.actions || []); setModules(m || {});
    } catch (err) {
      setError(err.message || 'Failed to load intelligence dashboard');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [period]);
  const s = executive.scorecards || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-3">
        <PageTitle title="Business Intelligence Command Center" subtitle="Decision intelligence across growth, customers, finance, operations and plant reliability." />
        <div className="flex gap-2">
          <select className="glass-input" value={period} onChange={(e) => setPeriod(e.target.value)}><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select>
          <Button icon={RefreshCw} onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</Button>
        </div>
      </div>
      {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{error}</div>}
      <HelpPanel title="How to use Intelligence" items={[
        { label: 'Separate actuals from projections', text: 'This dashboard uses actual orders, POS, stock, GL and support data. Projections stay in Loan Projection Studio.' },
        { label: 'Act on recommendations', text: 'The action panel highlights overdue closeouts, failed postings, low stock, open complaints and growth opportunities.' },
        { label: 'Watch data confidence', text: 'A medium or low confidence flag means management reports need review before decisions are made.' },
        { label: 'Use weekly rhythm', text: 'Review this page in weekly management meetings and assign owners for each recommended action.' },
      ]} />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <CardMetric icon={DollarSign} label="Revenue" value={money(s.revenue)} hint={`${pct(s.revenueGrowthPct)} vs prior period`} />
        <CardMetric icon={Package} label="KG sold" value={fmt(s.kgSold)} hint={`${pct(s.kgGrowthPct)} kg growth`} />
        <CardMetric icon={TrendingUp} label="Margin / KG" value={money(s.grossMarginPerKg)} hint="Revenue less POS expenses per kg" />
        <CardMetric icon={Activity} label="Risk score" value={`${fmt(s.riskScore)}/100`} hint={`Data confidence: ${executive.dataConfidence?.level || 'UNKNOWN'}`} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <h3 className="text-lg font-bold text-white mb-4">Recommended Actions This Week</h3>
          <div className="space-y-3">
            {actions.map((a, idx) => (
              <div key={`${a.category}-${idx}`} className="p-4 rounded-xl bg-white/5 border border-white/5 flex gap-3">
                <Priority value={a.priority} />
                <div><div className="font-bold text-white">{a.title}</div><div className="text-sm text-slate-400 mt-1">{a.action}</div><div className="text-xs text-slate-500 mt-1">{a.category}</div></div>
              </div>
            ))}
            {!actions.length && <div className="p-6 text-center text-slate-500"><CheckCircle className="mx-auto mb-2" />No critical recommendations found.</div>}
          </div>
        </Card>
        <Card>
          <h3 className="text-lg font-bold text-white mb-4">Module Snapshot</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Sales revenue</span><span className="text-white font-bold">{money(modules.sales?.revenue)}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Average price/kg</span><span className="text-white font-bold">{money(modules.sales?.averagePricePerKg)}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Estimated gross profit</span><span className="text-white font-bold">{money(modules.finance?.estimatedGrossProfit)}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Current stock kg</span><span className="text-white font-bold">{fmt(modules.operations?.currentStockKg)}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Open tickets</span><span className="text-white font-bold">{fmt(modules.operations?.openTickets)}</span></div>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-bold text-white mb-4">Branch / Plant Intelligence</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(modules.branches || []).slice(0, 8).map((b) => (
            <div key={b.branchId} className="p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="font-bold text-white truncate">Branch {b.branchId}</div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-sm"><div><span className="text-slate-500">Revenue</span><div className="text-white">{money(b.revenue)}</div></div><div><span className="text-slate-500">KG</span><div className="text-white">{fmt(b.kg)}</div></div><div><span className="text-slate-500">Gross Profit</span><div className="text-white">{money(b.grossProfit)}</div></div></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
