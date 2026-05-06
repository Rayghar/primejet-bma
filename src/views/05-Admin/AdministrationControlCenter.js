// src/views/05-Admin/AdministrationControlCenter.js
import React, { useEffect, useState } from 'react';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import HelpPanel from '../../components/shared/HelpPanel';
import { getAdminControlCenter, getAdminDataQuality, getAdminSystemHealth, getAdminOperationsGuide } from '../../api/adminControlService';
import { RefreshCw, Shield, Users, AlertTriangle, Database, Activity, Settings, BookOpen } from 'lucide-react';

const arr = (v) => (Array.isArray(v) ? v : []);
const num = (v) => Number(v || 0);
const fmt = (v) => num(v).toLocaleString();

const Metric = ({ icon: Icon, label, value, hint }) => (
  <Card className="p-4"><div className="flex gap-3 items-center"><div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-300"><Icon size={20}/></div><div><div className="text-xs text-slate-400 uppercase tracking-wider">{label}</div><div className="text-2xl font-bold text-white">{value}</div>{hint && <div className="text-xs text-slate-500">{hint}</div>}</div></div></Card>
);

const Severity = ({ value }) => {
  const tone = value === 'HIGH' ? 'bg-red-500/20 text-red-300' : value === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300' : value === 'OK' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300';
  return <span className={`px-2 py-1 rounded-full text-xs font-bold ${tone}`}>{value}</span>;
};

export default function AdministrationControlCenter() {
  const [control, setControl] = useState({ metrics: {}, health: {} });
  const [quality, setQuality] = useState({ checks: [] });
  const [system, setSystem] = useState({});
  const [guide, setGuide] = useState({ modules: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [c, q, s, g] = await Promise.all([getAdminControlCenter(), getAdminDataQuality(), getAdminSystemHealth(), getAdminOperationsGuide()]);
      setControl(c || {}); setQuality(q || {}); setSystem(s || {}); setGuide(g || {});
    } catch (e) {
      setError(e.message || 'Failed to load administration control center');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const m = control.metrics || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-3"><PageTitle title="Administration Control Center" subtitle="Configuration governance, access control, data quality, system health and operations guidance." /><Button icon={RefreshCw} onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</Button></div>
      {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{error}</div>}
      <HelpPanel title="Administration operating guide" items={[
        { label: 'Configuration discipline', text: 'Resolve missing plant stock mappings, missing active prices and COA gaps before enabling operational posting.' },
        { label: 'Access governance', text: 'Review inactive users, users without branch assignment and role exposure on a weekly basis.' },
        { label: 'Data quality', text: 'Data quality blockers can directly affect POS, stock, pricing, GL posting and lender-ready management accounts.' },
        { label: 'System health', text: 'Failed postings and stale data should be treated as operational incidents, not just technical errors.' },
      ]} />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Metric icon={Users} label="Active users" value={fmt(m.activeUsers)} hint={`${fmt(m.usersWithoutBranch)} users without branch`} />
        <Metric icon={Database} label="Plants / products" value={`${fmt(m.plants)} / ${fmt(m.products)}`} hint={`${fmt(m.plantsWithoutStockMapping)} missing mappings`} />
        <Metric icon={Settings} label="Prices / mappings" value={`${fmt(m.activePrices)} / ${fmt(m.stockMappings)}`} hint={`${fmt(m.productsWithoutPrice)} products without price`} />
        <Metric icon={Activity} label="System health" value={system.status || control.health?.status || 'UNKNOWN'} hint={`${fmt(m.failedPostings)} failed postings`} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Shield size={18}/> Data Quality Dashboard</h3>
          <div className="mb-4"><span className="text-slate-400 text-sm">Quality score</span><span className="ml-3 text-2xl font-bold text-white">{fmt(quality.score)}/100</span></div>
          <div className="space-y-3">
            {arr(quality.checks).map((c) => (
              <div key={c.name} className="p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex justify-between items-center"><div className="font-semibold text-white">{c.name}</div><Severity value={c.severity} /></div>
                <div className="text-sm text-slate-400 mt-1">Count: {fmt(c.count)}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><AlertTriangle size={18}/> Control Blockers</h3>
          <div className="space-y-3">
            {arr(control.health?.blockers).map((b) => <div key={b} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm">{b}</div>)}
            {!arr(control.health?.blockers).length && <div className="p-6 text-center text-slate-500">No major control blockers detected.</div>}
          </div>
          <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/5">
            <div className="font-bold text-white mb-2">System Health</div>
            <div className="text-sm text-slate-400">API: {system.api?.status || 'UNKNOWN'} · Failed postings: {fmt(system.jobs?.failedPostings)} · Config records: {fmt(system.configuration?.configRecords)}</div>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><BookOpen size={18}/> Operations Guide Manager</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {arr(guide.modules).map((g) => (
            <div key={g.module} className="p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="font-bold text-white">{g.module}</div>
              <div className="text-sm text-slate-400 mt-1">{g.purpose}</div>
              <ul className="mt-3 space-y-1 text-xs text-slate-300 list-disc list-inside">
                {arr(g.keyActions).map((x) => <li key={x}>{x}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
