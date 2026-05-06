// src/views/02-Operations/PlantReliabilityCommandCenter.js
import React, { useEffect, useMemo, useState } from 'react';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import HelpPanel from '../../components/shared/HelpPanel';
import { getPlantReliabilityOverview, getPlantReliabilityDetail, createPlantSafetyCheck } from '../../api/operationsService';
import { RefreshCw, Factory, AlertTriangle, Package, Wrench, ShieldCheck, TrendingUp } from 'lucide-react';

const arr = (v) => (Array.isArray(v) ? v : []);
const num = (v) => Number(v || 0);
const fmt = (v) => num(v).toLocaleString();
const money = (v) => `₦${fmt(v)}`;
const date = (v) => (v ? new Date(v).toLocaleDateString() : '—');

const Metric = ({ icon: Icon, label, value, hint }) => (
  <Card className="p-4"><div className="flex gap-3 items-center"><div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-300"><Icon size={20}/></div><div><p className="text-xs uppercase text-slate-400">{label}</p><p className="text-2xl font-bold text-white">{value}</p>{hint && <p className="text-xs text-slate-500">{hint}</p>}</div></div></Card>
);

const Risk = ({ level }) => {
  const tone = level === 'HIGH' ? 'bg-red-500/20 text-red-300' : level === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300';
  return <span className={`px-2 py-1 rounded-full text-xs font-bold ${tone}`}>{level}</span>;
};

export default function PlantReliabilityCommandCenter() {
  const [overview, setOverview] = useState({ metrics: {}, rows: [] });
  const [selectedPlantId, setSelectedPlantId] = useState('');
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true); setMessage('');
    try {
      const data = await getPlantReliabilityOverview();
      setOverview(data || { metrics: {}, rows: [] });
      const first = data?.rows?.[0]?.plantId;
      if (!selectedPlantId && first) setSelectedPlantId(first);
    } catch (e) {
      setMessage(e.message || 'Failed to load plant reliability');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const run = async () => {
      if (!selectedPlantId) return;
      try { setDetail(await getPlantReliabilityDetail(selectedPlantId)); } catch (e) { setMessage(e.message || 'Failed to load plant detail'); }
    };
    run();
  }, [selectedPlantId]);

  const selected = useMemo(() => detail || arr(overview.rows).find((p) => p.plantId === selectedPlantId) || null, [detail, overview.rows, selectedPlantId]);

  const logSafety = async () => {
    if (!selectedPlantId) return;
    try {
      await createPlantSafetyCheck(selectedPlantId, { status: 'PASS', findings: 'Routine safety check logged from command center.' });
      setMessage('Safety check logged successfully.');
      setDetail(await getPlantReliabilityDetail(selectedPlantId));
    } catch (e) {
      setMessage(e.message || 'Failed to log safety check');
    }
  };

  const m = overview.metrics || {};

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <PageTitle title="Plant Reliability Command Center" subtitle="Plant uptime, LPG stock health, maintenance, safety, utilization and profitability." />
        <div className="flex gap-2"><Button variant="secondary" icon={ShieldCheck} onClick={logSafety} disabled={!selectedPlantId}>Log Safety Pass</Button><Button icon={RefreshCw} onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</Button></div>
      </div>
      {message && <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm">{message}</div>}
      <HelpPanel title="Plant operations guide" items={[
        { label: 'Stock cover', text: 'Days of cover estimates how long current LPG stock will last at the recent sales rate. Investigate any plant below 3 days.' },
        { label: 'Maintenance', text: 'Maintenance overdue and open maintenance jobs affect plant reliability and should be reviewed before operations are disrupted.' },
        { label: 'Safety checks', text: 'Log routine safety checks and corrective actions to support operational discipline and lender/audit evidence.' },
        { label: 'Profitability', text: 'Plant profitability combines revenue, stock/COGS and OPEX so operations can see true plant contribution, not just sales.' },
      ]} />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Metric icon={Factory} label="Plants" value={fmt(m.totalPlants)} hint={`${fmt(m.operationalPlants)} operational`} />
        <Metric icon={AlertTriangle} label="Plants at risk" value={fmt(m.plantsAtRisk)} hint={`${fmt(m.lowStockPlants)} low stock`} />
        <Metric icon={Package} label="Total stock" value={`${fmt(m.totalStockKg)} kg`} hint="Across active plants" />
        <Metric icon={TrendingUp} label="30d gross profit" value={money(m.grossProfit30d)} hint={money(m.revenue30d) + ' revenue'} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card>
          <h3 className="text-lg font-bold text-white mb-4">Plant List</h3>
          <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
            {arr(overview.rows).map((p) => (
              <button key={p.plantId} onClick={() => setSelectedPlantId(p.plantId)} className={`w-full text-left p-3 rounded-xl border ${selectedPlantId === p.plantId ? 'bg-blue-500/20 border-blue-500/40' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                <div className="flex justify-between items-center"><span className="font-bold text-white">{p.name}</span><Risk level={p.riskLevel} /></div>
                <div className="text-xs text-slate-400 mt-1">Stock {fmt(p.stock?.currentKg)}kg · Cover {p.daysOfCover ?? '—'} days · {p.status}</div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <div className="flex justify-between items-start mb-4"><div><h3 className="text-xl font-bold text-white">{selected?.name || 'Select a plant'}</h3><p className="text-sm text-slate-400">Status: {selected?.status || '—'} · Uptime {selected?.uptimePct || 0}%</p></div>{selected && <Risk level={selected.riskLevel} />}</div>
          {selected ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="p-3 bg-white/5 rounded-xl"><span className="text-slate-500">Current stock</span><div className="font-bold text-white">{fmt(selected.stock?.currentKg)} kg</div></div>
                <div className="p-3 bg-white/5 rounded-xl"><span className="text-slate-500">Days cover</span><div className="font-bold text-white">{selected.daysOfCover ?? '—'}</div></div>
                <div className="p-3 bg-white/5 rounded-xl"><span className="text-slate-500">Utilization</span><div className="font-bold text-white">{num(selected.utilizationPct).toFixed(1)}%</div></div>
                <div className="p-3 bg-white/5 rounded-xl"><span className="text-slate-500">Open maint.</span><div className="font-bold text-white">{fmt(selected.openMaintenance)}</div></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <h4 className="font-bold text-white mb-3 flex items-center gap-2"><Wrench size={16}/> Maintenance</h4>
                  <div className="text-sm text-slate-400">Last: {date(selected.lastMaintenanceDate)} · Next: {date(selected.nextMaintenanceDate)}</div>
                  <div className="mt-3 space-y-2">{arr(selected.recentMaintenance).slice(0,3).map((x) => <div key={x.id} className="text-xs text-slate-300 border-t border-white/5 pt-2">{x.type} · {x.status} · {money(x.cost)}<br/><span className="text-slate-500">{x.description}</span></div>)}</div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <h4 className="font-bold text-white mb-3">Plant Profitability</h4>
                  <div className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-slate-400">Revenue 30d</span><span className="text-white">{money(selected.profitability?.revenue30d)}</span></div><div className="flex justify-between"><span className="text-slate-400">OPEX 30d</span><span className="text-white">{money(selected.profitability?.opex30d)}</span></div><div className="flex justify-between"><span className="text-slate-400">Gross profit</span><span className="text-white font-bold">{money(selected.profitability?.grossProfit30d)}</span></div></div>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <h4 className="font-bold text-white mb-3">Risk Alerts</h4>
                <div className="flex flex-wrap gap-2">{arr(selected.riskAlerts).length ? arr(selected.riskAlerts).map((r) => <span key={r} className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-bold">{r}</span>) : <span className="text-sm text-slate-500">No active risk alerts.</span>}</div>
              </div>
            </div>
          ) : <div className="text-center text-slate-500 py-12">No plant selected.</div>}
        </Card>
      </div>
    </div>
  );
}
