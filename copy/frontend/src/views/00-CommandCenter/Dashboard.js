import React, { useEffect, useMemo, useState } from 'react';
import { getDailyClosePerformance, getGasPlantDashboard } from '../../api/analyticsService';
import { getOnlineDrivers } from '../../api/operationsService';
import PageTitle from '../../components/shared/PageTitle';
import BarChart from '../../components/charts/BarChart';
import {
    TrendingUp,
    TrendingDown,
    ShoppingCart,
    Truck,
    Users,
    Activity,
    ArrowUpRight,
    AlertCircle,
    Zap,
    ExternalLink,
    CheckCircle,
    Package,
    Landmark,
    WalletCards,
    Percent,
    Scale,
    BarChart3,
    Database,
} from 'lucide-react';

const money = (value) => `₦${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const kg = (value) => `${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 1 })} kg`;
const pct = (value) => `${Number(value || 0).toFixed(1)}%`;
const perKg = (value) => `₦${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}/kg`;

const PeriodButton = ({ active, label, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
            active ? 'bg-blue-500/20 border-blue-400 text-blue-100' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
        }`}
    >
        {label}
    </button>
);

const StatCard = ({ title, value, icon: Icon, color, subtext, trend, invertTrend = false }) => {
    const n = Number(trend || 0);
    const positive = invertTrend ? n <= 0 : n >= 0;
    const TrendIcon = positive ? TrendingUp : TrendingDown;
    return (
        <div className="glass-card relative overflow-hidden group hover:border-white/20 transition-all duration-300">
            <div className={`absolute -right-6 -top-6 p-8 rounded-full opacity-10 group-hover:opacity-20 transition-all ${color} blur-xl`} />
            <div className="relative z-10">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{title}</p>
                        <h3 className="text-2xl lg:text-3xl font-bold text-white mt-2">{value}</h3>
                    </div>
                    <div className={`p-3 rounded-xl bg-white/5 border border-white/10 ${color.replace('bg-', 'text-')}`}>
                        <Icon size={24} />
                    </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 text-xs">
                    <span className="text-gray-500">{subtext}</span>
                    {trend !== undefined && trend !== null ? (
                        <span className={`flex items-center font-bold ${positive ? 'text-green-400' : 'text-red-400'}`} title="Compared with previous equivalent period">
                            <TrendIcon size={14} className="mr-1" />
                            {pct(Math.abs(n))}
                        </span>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

const MiniMetric = ({ label, value, hint }) => (
    <div className="p-3 rounded-xl bg-white/5 border border-white/10" title={hint || label}>
        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{label}</p>
        <p className="text-sm font-bold text-white mt-1">{value}</p>
    </div>
);

const AlertLine = ({ tone = 'yellow', title, text }) => {
    const tones = {
        yellow: 'border-yellow-500 text-yellow-200',
        red: 'border-red-500 text-red-200',
        blue: 'border-blue-500 text-blue-200',
        green: 'border-green-500 text-green-200',
    };
    return (
        <div className={`text-xs text-gray-400 p-2 bg-white/5 rounded border-l-2 ${tones[tone] || tones.yellow}`}>
            <span className="text-white font-bold">{title}:</span> {text}
        </div>
    );
};

export default function Dashboard({ setActiveView }) {
    const [period, setPeriod] = useState('allTime');
    const [trendMode, setTrendMode] = useState('monthly');
    const [dashboard, setDashboard] = useState(null);
    const [onlineDrivers, setOnlineDrivers] = useState(0);
    const [closeControls, setCloseControls] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const results = await Promise.allSettled([
                getGasPlantDashboard({ period }),
                getOnlineDrivers(),
                getDailyClosePerformance({ period: period === 'allTime' ? 'yearly' : period }),
            ]);

            if (results[0].status === 'fulfilled') setDashboard(results[0].value || null);
            else setError(results[0].reason?.message || 'Gas plant dashboard data unavailable');

            const drivers = results[1].status === 'fulfilled' && Array.isArray(results[1].value) ? results[1].value : [];
            setOnlineDrivers(drivers.length);
            setCloseControls(results[2].status === 'fulfilled' ? results[2].value : null);
        } catch (err) {
            setError(err?.message || 'Dashboard sync failed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 45000);
        return () => clearInterval(interval);
    }, [period]);

    const current = dashboard?.current || {};
    const growth = dashboard?.growth || {};
    const monthlyTrend = Array.isArray(dashboard?.monthlyTrend) ? dashboard.monthlyTrend : [];
    const quarterlyTrend = Array.isArray(dashboard?.quarterlyTrend) ? dashboard.quarterlyTrend : [];
    const branchPerformance = Array.isArray(dashboard?.branchPerformance) ? dashboard.branchPerformance : [];
    const trendRows = trendMode === 'quarterly' ? quarterlyTrend : monthlyTrend;

    const revenueChart = useMemo(() => trendRows.map((r) => ({ label: r.label, value: r.totalRevenue || 0 })), [trendRows]);
    const kgChart = useMemo(() => trendRows.map((r) => ({ label: r.label, value: r.totalKgSold || 0 })), [trendRows]);
    const profitChart = useMemo(() => trendRows.map((r) => ({ label: r.label, value: r.netContribution || 0 })), [trendRows]);

    const alertState = closeControls?.alerts || {};
    const hasAlerts = alertState.hasUnfinalizedPriorDays || alertState.hasApprovedButUnposted || alertState.hasFailedPostings || (dashboard?.controls?.failedPostings?.total > 0);

    const QuickAction = ({ label, icon: Icon, view, color, subtitle }) => (
        <button
            onClick={() => setActiveView(view)}
            className="flex items-center p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group w-full text-left"
        >
            <div className={`p-2 rounded-lg mr-4 ${color} text-white`}>
                <Icon size={20} />
            </div>
            <div>
                <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">{label}</h4>
                <p className="text-[10px] text-gray-500">{subtitle || 'Jump to module'}</p>
            </div>
            <ExternalLink size={14} className="ml-auto text-gray-600 group-hover:text-white opacity-0 group-hover:opacity-100 transition-all" />
        </button>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
                <PageTitle title="Command Center" subtitle="Gas plant performance, sales, stock, margin and GL control intelligence" />
                <div className="flex flex-wrap items-center gap-2">
                    <PeriodButton active={period === 'monthly'} label="This Month" onClick={() => setPeriod('monthly')} />
                    <PeriodButton active={period === 'quarterly'} label="This Quarter" onClick={() => setPeriod('quarterly')} />
                    <PeriodButton active={period === 'yearly'} label="This Year" onClick={() => setPeriod('yearly')} />
                    <PeriodButton active={period === 'allTime'} label="All Migrated Data" onClick={() => setPeriod('allTime')} />
                    <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-mono">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                        </span>
                        <span>SYSTEM ONLINE</span>
                    </div>
                </div>
            </div>

            {error ? (
                <div className="glass-card border-l-4 border-red-500 text-sm text-red-200">
                    <span className="font-bold">Dashboard data issue:</span> {error}. Confirm the backend route <span className="font-mono">/api/v2/analytics/gas-plant-dashboard</span> is deployed and accessible.
                </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard title="Revenue" value={loading ? '...' : money(current.totalRevenue)} icon={TrendingUp} color="bg-green-500" subtext="Operational sales by business date" trend={growth.revenuePct} />
                <StatCard title="LPG Sold" value={loading ? '...' : kg(current.totalKgSold)} icon={ShoppingCart} color="bg-blue-500" subtext={`Avg ${perKg(current.avgSellingPricePerKg)}`} trend={growth.kgSoldPct} />
                <StatCard title="Gross Profit" value={loading ? '...' : money(current.grossProfit)} icon={Percent} color="bg-purple-500" subtext={`Margin ${pct(current.grossMarginPct)}`} trend={growth.grossProfitPct} />
                <StatCard title="Net Contribution" value={loading ? '...' : money(current.netContribution)} icon={Landmark} color="bg-orange-500" subtext="After COGS, expenses and stock loss" trend={growth.netContributionPct} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
                <MiniMetric label="Cash" value={money(current.cashAmount)} hint="Cash collected from daily closes" />
                <MiniMetric label="POS" value={money(current.posAmount)} hint="POS/card collections" />
                <MiniMetric label="Transfer" value={money(current.transferAmount)} hint="Bank/company-account collections" />
                <MiniMetric label="Expenses" value={money(current.totalExpenses)} hint="Approved operating expenses" />
                <MiniMetric label="COGS" value={money(current.cogs)} hint="Stock cost depleted by sales" />
                <MiniMetric label="Stock In" value={kg(current.stockInKg)} hint="Opening/purchased LPG stock in period" />
                <MiniMetric label="Stock Loss" value={kg(current.stockLossKg)} hint="Shortage/leakage/reconciliation variance" />
                <MiniMetric label="Drivers" value={onlineDrivers} hint="Online drivers from operations service" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 glass-card min-h-[410px]">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center">
                            <Activity size={20} className="mr-2 text-blue-400" /> {trendMode === 'quarterly' ? 'Quarterly' : 'Monthly'} Revenue Trend
                        </h3>
                        <div className="flex gap-2">
                            <PeriodButton active={trendMode === 'monthly'} label="Monthly" onClick={() => setTrendMode('monthly')} />
                            <PeriodButton active={trendMode === 'quarterly'} label="Quarterly" onClick={() => setTrendMode('quarterly')} />
                        </div>
                    </div>
                    <BarChart data={revenueChart} />
                    <p className="mt-4 text-xs text-gray-500">
                        This chart uses actual business dates from sales closes. It does not use upload/import dates.
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="glass-card">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
                            <Zap size={16} className="mr-2 text-yellow-400" /> Quick Actions
                        </h3>
                        <div className="space-y-3">
                            <QuickAction label="Data Migration" icon={Database} view="DataMigration" color="bg-indigo-600" subtitle="Upload and review historical CSVs" />
                            <QuickAction label="Post / Rebuild GL" icon={Landmark} view="PostingReadinessControl" color="bg-emerald-600" subtitle="Review unposted finance records" />
                            <QuickAction label="Plant Profitability" icon={BarChart3} view="PlantProfitability" color="bg-purple-600" subtitle="Branch P&L and margin analysis" />
                            <QuickAction label="Log Sale (POS)" icon={ShoppingCart} view="DailyLog" color="bg-green-600" subtitle="Capture today's cashier close" />
                        </div>
                    </div>

                    <div className={`glass-card border-t-4 ${hasAlerts ? 'border-red-500' : 'border-green-500'}`}>
                        <h3 className="text-white font-bold mb-3 flex items-center">
                            {hasAlerts ? <AlertCircle size={18} className="mr-2 text-red-500" /> : <CheckCircle size={18} className="mr-2 text-green-500" />}
                            Control Alerts
                        </h3>
                        <div className="space-y-2">
                            {dashboard?.controls?.unposted?.total > 0 ? (
                                <AlertLine tone="blue" title="Imported / Approved Not Posted" text={`${dashboard.controls.unposted.total} finance source record(s) are unposted. Review and post through GL controls.`} />
                            ) : null}
                            {dashboard?.controls?.failedPostings?.total > 0 ? (
                                <AlertLine tone="red" title="Failed Postings" text={`${dashboard.controls.failedPostings.total} posting failure(s) require finance review.`} />
                            ) : null}
                            {alertState.hasUnfinalizedPriorDays ? (
                                <AlertLine tone="yellow" title="Unfinalized Prior Days" text={`${closeControls.overdueOpenDays || 0} old daily close records require attention.`} />
                            ) : null}
                            {alertState.hasApprovedButUnposted ? (
                                <AlertLine tone="blue" title="Approved Not Posted" text={`${closeControls.approvedButUnposted || 0} approved daily summaries are not posted to GL.`} />
                            ) : null}
                            {!hasAlerts ? <AlertLine tone="green" title="Controls" text="No unposted, failed posting, or stale daily close alerts detected for the selected view." /> : null}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="glass-card">
                    <h3 className="text-lg font-bold text-white flex items-center mb-4">
                        <Scale size={20} className="mr-2 text-green-400" /> Volume and Net Contribution Trend
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <p className="text-xs text-gray-500 mb-2 font-bold uppercase tracking-wider">KG Sold</p>
                            <BarChart data={kgChart} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-2 font-bold uppercase tracking-wider">Net Contribution</p>
                            <BarChart data={profitChart} />
                        </div>
                    </div>
                </div>

                <div className="glass-card">
                    <h3 className="text-lg font-bold text-white flex items-center mb-4">
                        <WalletCards size={20} className="mr-2 text-yellow-400" /> Collections, Stock and GL Readiness
                    </h3>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <MiniMetric label="Cash Share" value={current.totalRevenue ? pct((current.cashAmount / current.totalRevenue) * 100) : '0.0%'} />
                        <MiniMetric label="POS Share" value={current.totalRevenue ? pct((current.posAmount / current.totalRevenue) * 100) : '0.0%'} />
                        <MiniMetric label="Transfer Share" value={current.totalRevenue ? pct((current.transferAmount / current.totalRevenue) * 100) : '0.0%'} />
                        <MiniMetric label="Posted Journals" value={dashboard?.controls?.glView?.journalCount || 0} />
                    </div>
                    <div className="space-y-2 text-xs text-gray-400">
                        <AlertLine tone="blue" title="Operational View" text="Revenue, KG sold, expenses, COGS and stock loss come from operational source tables, including migrated records." />
                        <AlertLine tone="green" title="Official GL View" text="Management accounts become official after finance posts approved records through the GL posting process." />
                        <AlertLine tone="yellow" title="Date Rule" text="Dashboard periods are based on transaction/business dates, not upload dates." />
                    </div>
                </div>
            </div>

            <div className="glass-card">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center">
                        <Package size={20} className="mr-2 text-blue-400" /> Branch / Plant Performance
                    </h3>
                    <button onClick={() => setActiveView('PlantProfitability')} className="text-xs text-blue-300 hover:text-blue-100 flex items-center">
                        Open Plant Profitability <ArrowUpRight size={14} className="ml-1" />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-[10px] uppercase tracking-wider text-gray-500 border-b border-white/10">
                                <th className="py-2 pr-4">Plant</th>
                                <th className="py-2 pr-4">Revenue</th>
                                <th className="py-2 pr-4">KG Sold</th>
                                <th className="py-2 pr-4">Gross Margin</th>
                                <th className="py-2 pr-4">Expenses</th>
                                <th className="py-2 pr-4">Stock Loss</th>
                                <th className="py-2 pr-4">Net Contribution</th>
                                <th className="py-2 pr-4">Stock Left</th>
                                <th className="py-2 pr-4">Days Left</th>
                            </tr>
                        </thead>
                        <tbody>
                            {branchPerformance.length === 0 ? (
                                <tr><td colSpan="9" className="py-8 text-center text-gray-500">No branch performance data for the selected period.</td></tr>
                            ) : branchPerformance.slice(0, 8).map((row) => (
                                <tr key={row.branchId} className="border-b border-white/5 text-gray-300">
                                    <td className="py-3 pr-4 text-white font-bold">{row.branchName || row.branchId}</td>
                                    <td className="py-3 pr-4">{money(row.totalRevenue)}</td>
                                    <td className="py-3 pr-4">{kg(row.totalKgSold)}</td>
                                    <td className="py-3 pr-4">{pct(row.grossMarginPct)}</td>
                                    <td className="py-3 pr-4">{money(row.totalExpenses)}</td>
                                    <td className="py-3 pr-4">{money(row.stockLossValue)}</td>
                                    <td className="py-3 pr-4 text-green-300 font-bold">{money(row.netContribution)}</td>
                                    <td className="py-3 pr-4">{kg(row.currentStockKg)}</td>
                                    <td className="py-3 pr-4">{Number(row.stockDaysRemaining || 0).toFixed(1)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
