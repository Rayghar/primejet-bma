// src/views/03-Intelligence/BusinessAnalytics.js
import React, { useEffect, useMemo, useState } from 'react';
import { getBusinessMetrics } from '../../api/analyticsService';
import { getPlants } from '../../api/operationsService';
import PageTitle from '../../components/shared/PageTitle';
import BarChart from '../../components/charts/BarChart';
import {
  UserPlus,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

// -----------------------------
// Small helpers (UI-safe)
// -----------------------------
const fmtNumber = (n) => Number(n || 0).toLocaleString();
const fmtNaira = (n) => `₦${fmtNumber(n)}`;
const pct = (n) => `${Number(n || 0).toFixed(1)}%`;
const safeArr = (v) => (Array.isArray(v) ? v : []);

const MetricCard = ({ label, value, trend, isPositive, suffix = '' }) => (
  <div className="glass-card relative overflow-hidden">
    <p className="text-gray-400 text-xs uppercase tracking-wider">{label}</p>
    <div className="flex items-end justify-between mt-2">
      <h3 className="text-3xl font-bold text-white">
        {value}
        {suffix}
      </h3>

      {trend !== undefined && trend !== null && Number.isFinite(Number(trend)) && (
        <div
          className={`flex items-center text-xs font-bold ${
            isPositive ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {isPositive ? (
            <ArrowUpRight size={14} className="mr-1" />
          ) : (
            <ArrowDownRight size={14} className="mr-1" />
          )}
          {Math.abs(Number(trend)).toFixed(1)}%
        </div>
      )}
    </div>
  </div>
);

const MiniKpi = ({ label, value, tone = 'text-white' }) => (
  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
    <div className="flex justify-between text-sm text-gray-400 mb-2">
      <span>{label}</span>
      <span className={`font-bold ${tone}`}>{value}</span>
    </div>
  </div>
);

const ProgressKpi = ({ label, value, percent, tone = 'bg-purple-500' }) => (
  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
    <div className="flex justify-between text-sm text-gray-400 mb-2">
      <span>{label}</span>
      <span className="text-white font-bold">{value}</span>
    </div>
    <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
      <div className={`${tone} h-full`} style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
    </div>
  </div>
);

export default function BusinessAnalytics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [lastSyncAt, setLastSyncAt] = useState(null);

  // Optional multi-branch filter
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState('');

  const fetchBranches = async () => {
    try {
      const plants = await getPlants?.();
      const normalized = Array.isArray(plants)
        ? plants
            .map((p) => ({
              id: p?.id || p?._id,
              name: p?.name || 'Unnamed Branch',
            }))
            .filter((x) => x.id)
        : [];
      setBranches(normalized);
    } catch (e) {
      console.error('Failed to load branches:', e);
      setBranches([]);
    }
  };

  const fetchMetrics = async () => {
    setError('');
    setSyncing(true);
    try {
      // ✅ branchId passed through if backend supports it (analyticsService is branch-aware)
      const data = await getBusinessMetrics(branchId || undefined);
      setMetrics(data || null);
      setLastSyncAt(new Date());
    } catch (e) {
      console.error('Business metrics load error', e);
      setError(e?.response?.data?.message || e?.message || 'Failed to load business metrics.');
      setMetrics(null);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchMetrics();
    const t = setInterval(fetchMetrics, 60000); // ✅ refresh every 60s (less noisy than 30s)
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const derived = useMemo(() => {
    const m = metrics || {};

    const totalCustomers = Number(m.totalCustomers || 0);
    const newCustomers = Number(m.newCustomers || 0);
    const churnRate = Number(m.churnRate || 0);
    const avgOrderValue = Number(m.avgOrderValue || 0);
    const ltv = Number(m.ltv || 0);

    // optional fields if your backend provides them
    const repeatPurchaseRate = Number(m.repeatPurchaseRate ?? 0);
    const nps = Number(m.nps ?? 0);

    const acquisitionTrend = safeArr(m.acquisitionTrend).map((x) => ({
      label: x?.label || 'N/A',
      value: Number(x?.value || 0),
    }));

    // Simple “net growth” indicator
    const approxChurned = Math.round((churnRate / 100) * totalCustomers);
    const netDelta = newCustomers - approxChurned;

    return {
      totalCustomers,
      newCustomers,
      churnRate,
      avgOrderValue,
      ltv,
      acquisitionTrend,
      repeatPurchaseRate,
      nps,
      approxChurned,
      netDelta,
    };
  }, [metrics]);

  const retentionScore = useMemo(() => {
    // lightweight composite indicator (UI only)
    const repeatWeight = Math.min(100, Math.max(0, Number(derived.repeatPurchaseRate || 0)));
    // Normalize NPS (-100..100) to 0..100
    const npsNorm = Math.min(100, Math.max(0, ((Number(derived.nps || 0) + 100) / 2)));
    const churnPenalty = Math.min(100, Math.max(0, Number(derived.churnRate || 0)));
    const score = repeatWeight * 0.45 + npsNorm * 0.35 + (100 - churnPenalty) * 0.2;
    return score;
  }, [derived]);

  if (loading) {
    return <div className="p-8 text-center text-blue-400 animate-pulse">Computing Business Logic...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <PageTitle title="Business Intelligence" subtitle="Growth, Retention & Customer Value" />

        <div className="flex items-center gap-2">
          {lastSyncAt ? (
            <div className="hidden md:flex items-center px-3 py-2 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs font-mono">
              Last sync: {lastSyncAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          ) : null}

          <button
            onClick={fetchMetrics}
            className="glass-button px-4 py-2 flex items-center text-sm"
            disabled={syncing}
            title="Refresh"
          >
            <RefreshCw size={16} className={`mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1 min-w-[240px]">
            <label className="text-xs text-gray-400">Branch</label>
            <select
              className="px-3 py-2 rounded-lg bg-black/30 text-white border border-white/10"
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
            <p className="text-[10px] text-gray-500">branchId == serviceZoneId</p>
          </div>

          <div className="ml-auto text-xs text-gray-500">
            Auto-refresh: <span className="text-gray-300">60s</span>
          </div>
        </div>
      </div>

      {error ? (
        <div className="glass-card border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200 flex items-start">
          <AlertTriangle size={18} className="mr-2 mt-0.5 text-red-400" />
          <div>
            <p className="font-bold text-red-300">Business Metrics Unavailable</p>
            <p className="text-xs text-red-200/80 mt-1">{error}</p>
          </div>
        </div>
      ) : null}

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Active Customers" value={fmtNumber(derived.totalCustomers)} trend={metrics?.customerTrendPct} isPositive />
        <MetricCard
          label="Customer Churn"
          value={Number(derived.churnRate || 0).toFixed(1)}
          suffix="%"
          // ✅ lower churn = positive, so invert the sign if backend gives churnTrendPct
          trend={metrics?.churnTrendPct}
          isPositive={Number(metrics?.churnTrendPct || 0) <= 0}
        />
        <MetricCard label="Avg Order Value" value={fmtNaira(derived.avgOrderValue)} trend={metrics?.aovTrendPct} isPositive />
        <MetricCard label="Lifetime Value (LTV)" value={fmtNaira(derived.ltv)} trend={metrics?.ltvTrendPct} isPositive />
      </div>

      {/* CHART + RETENTION HEALTH */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card">
          <h3 className="font-bold text-white mb-6 flex items-center">
            <UserPlus className="mr-2 text-blue-500" /> Customer Acquisition Cohort
          </h3>
          <BarChart data={derived.acquisitionTrend} />
          {derived.acquisitionTrend.length === 0 && (
            <p className="text-xs text-gray-500 mt-3">No acquisition trend data available yet.</p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3">
            <MiniKpi
              label="New Customers"
              value={fmtNumber(derived.newCustomers)}
              tone={derived.newCustomers > 0 ? 'text-green-300' : 'text-gray-300'}
            />
            <MiniKpi
              label="Net Growth (Approx.)"
              value={derived.netDelta >= 0 ? `+${fmtNumber(derived.netDelta)}` : `-${fmtNumber(Math.abs(derived.netDelta))}`}
              tone={derived.netDelta >= 0 ? 'text-green-300' : 'text-red-300'}
            />
          </div>
        </div>

        <div className="glass-card">
          <h3 className="font-bold text-white mb-4 flex items-center">
            <Activity className="mr-2 text-purple-500" /> Retention Health
          </h3>

          <div className="space-y-4">
            <ProgressKpi
              label="Repeat Purchase Rate"
              value={metrics?.repeatPurchaseRate !== undefined ? pct(derived.repeatPurchaseRate) : '—'}
              percent={derived.repeatPurchaseRate || 0}
              tone="bg-purple-500"
            />
            <ProgressKpi
              label="Net Promoter Score (NPS)"
              value={metrics?.nps !== undefined ? `${Math.round(derived.nps)}` : '—'}
              // normalized for UI meter only
              percent={Math.min(100, Math.max(0, ((derived.nps || 0) + 100) / 2))}
              tone="bg-green-500"
            />

            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Approx. Customers Churned</span>
                <span className="text-white font-bold">{fmtNumber(derived.approxChurned)}</span>
              </div>
              <p className="text-[11px] text-gray-500">
                (Derived from churn % × active customers; your backend can replace this with exact churn counts.)
              </p>
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Retention Composite Score</span>
                <span className="text-white font-bold">{retentionScore.toFixed(0)}/100</span>
              </div>
              <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full ${retentionScore >= 70 ? 'bg-green-500' : retentionScore >= 45 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(100, Math.max(0, retentionScore))}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-2">
                UI score blends repeat rate, NPS and churn; use as a directional signal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
