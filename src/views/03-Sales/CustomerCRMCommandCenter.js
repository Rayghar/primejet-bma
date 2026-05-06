// src/views/03-Sales/CustomerCRMCommandCenter.js
import React, { useEffect, useMemo, useState } from 'react';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import HelpPanel from '../../components/shared/HelpPanel';
import {
  getCrmDashboard,
  getCrmSegments,
  getCrmFollowUps,
  getCrmCampaignTargets,
} from '../../api/customerService';
import { RefreshCw, Users, PhoneCall, AlertTriangle, Target, Download, Star } from 'lucide-react';

const arr = (v) => (Array.isArray(v) ? v : []);
const num = (v) => Number(v || 0);
const fmt = (v) => num(v).toLocaleString();
const money = (v) => `₦${fmt(v)}`;
const date = (v) => (v ? new Date(v).toLocaleDateString() : '—');

const MetricCard = ({ icon: Icon, label, value, hint }) => (
  <Card className="p-4">
    <div className="flex items-center gap-3">
      <div className="p-3 rounded-xl bg-blue-500/10 text-blue-300"><Icon size={20} /></div>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
      </div>
    </div>
  </Card>
);

const StatusPill = ({ value }) => {
  const tone = value === 'HIGH' || value === 'DORMANT_HIGH_VALUE' ? 'bg-red-500/20 text-red-300' : value === 'MEDIUM' || value === 'CHURN_RISK' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300';
  return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${tone}`}>{value || '—'}</span>;
};

export default function CustomerCRMCommandCenter() {
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState({ metrics: {}, topCustomersByKg: [], attentionQueue: [] });
  const [segments, setSegments] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [campaignTargets, setCampaignTargets] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [d, s, f, c] = await Promise.all([
        getCrmDashboard(),
        getCrmSegments(),
        getCrmFollowUps(),
        getCrmCampaignTargets(),
      ]);
      setDashboard(d || {});
      setSegments(arr(s?.rows));
      setFollowUps(arr(f?.rows));
      setCampaignTargets(arr(c?.rows));
    } catch (e) {
      setError(e.message || 'Failed to load CRM dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const m = dashboard?.metrics || {};
  const csv = useMemo(() => {
    const rows = [['Name', 'Phone', 'Segment', 'Total Kg', 'Total Revenue', 'Last Order']];
    campaignTargets.forEach((c) => rows.push([c.name, c.phone, c.segment, c.totalKg, c.totalRevenue, c.lastOrderAt]));
    return rows.map((r) => r.map((x) => `"${String(x ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  }, [campaignTargets]);

  const downloadTargets = () => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer-campaign-targets-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <PageTitle title="Customer CRM Command Center" subtitle="Retention, refill follow-up, customer value, loyalty and complaint recovery." />
        <div className="flex gap-2">
          <Button variant="secondary" icon={Download} onClick={downloadTargets}>Export Targets</Button>
          <Button icon={RefreshCw} onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</Button>
        </div>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{error}</div>}

      <HelpPanel
        title="CRM operating guide"
        items={[
          { label: 'Daily follow-up', text: 'Use the follow-up queue every morning to call due-for-refill, churn-risk and dormant high-value customers.' },
          { label: 'Complaint recovery', text: 'Prioritize customers with open complaints before pushing new sales offers.' },
          { label: 'Campaign targeting', text: 'Use campaign targets for WhatsApp/SMS/call lists, but exclude blocked or inactive customers.' },
          { label: 'RFM score', text: 'RFM combines recency, frequency and monetary contribution. Higher score means higher commercial value.' },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard icon={Users} label="Total customers" value={fmt(m.totalCustomers)} hint={`${fmt(m.newCustomersThisMonth)} new this month`} />
        <MetricCard icon={Star} label="Active customers" value={fmt(m.activeCustomers)} hint={`${fmt(m.repeatPurchaseRate)}% repeat purchase`} />
        <MetricCard icon={AlertTriangle} label="Churn risk / dormant" value={`${fmt(m.churnRiskCustomers)} / ${fmt(m.dormantCustomers)}`} hint={`${fmt(m.dueForRefill)} due for refill`} />
        <MetricCard icon={Target} label="Customer revenue" value={money(m.totalCustomerRevenue)} hint={`${fmt(m.totalCustomerKg)} kg sold`} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Follow-up Queue</h3>
            <span className="text-xs text-slate-400">{followUps.length} recommended actions</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-400 border-b border-white/10">
                <tr><th className="text-left py-2">Customer</th><th>Segment</th><th>Last Order</th><th>Value</th><th>Action</th></tr>
              </thead>
              <tbody>
                {followUps.slice(0, 12).map((c) => (
                  <tr key={c.customerId} className="border-b border-white/5 text-slate-300">
                    <td className="py-3"><div className="font-semibold text-white">{c.name}</div><div className="text-xs text-slate-500">{c.phone}</div></td>
                    <td className="text-center"><StatusPill value={c.segment} /></td>
                    <td className="text-center">{date(c.lastOrderAt)}</td>
                    <td className="text-right">{money(c.totalRevenue)}</td>
                    <td className="text-slate-300">{c.recommendedAction}</td>
                  </tr>
                ))}
                {!followUps.length && <tr><td colSpan="5" className="py-8 text-center text-slate-500">No follow-up items yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-bold text-white mb-4">Segments</h3>
          <div className="space-y-3">
            {segments.map((s) => (
              <div key={s.segment} className="p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex justify-between"><StatusPill value={s.segment} /><span className="font-bold text-white">{fmt(s.count)}</span></div>
                <div className="mt-2 text-xs text-slate-400">Revenue {money(s.revenue)} · {fmt(s.kg)} kg</div>
              </div>
            ))}
            {!segments.length && <p className="text-sm text-slate-500">Segments will appear when customer orders are available.</p>}
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-bold text-white mb-4">Top Customers by KG</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {arr(dashboard.topCustomersByKg).slice(0, 8).map((c) => (
            <div key={c.customerId} className="p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="font-bold text-white truncate">{c.name}</div>
              <div className="text-xs text-slate-500">{c.phone || 'No phone'}</div>
              <div className="mt-3 flex justify-between text-sm"><span className="text-slate-400">KG</span><span className="text-white font-bold">{fmt(c.totalKg)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400">Revenue</span><span className="text-white font-bold">{money(c.totalRevenue)}</span></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
