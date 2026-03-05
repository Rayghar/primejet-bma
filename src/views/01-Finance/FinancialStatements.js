// File: src/views/03-Finance/FinancialStatements.js
import React, { useEffect, useMemo, useState } from 'react';
import { getFinancialStatements } from '../../api/financialService';
import { glTrialBalance, glPostingExceptions } from '../../api/glService';
import { getPlants } from '../../api/operationsService';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import { Printer, RefreshCw, Activity, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export default function FinancialStatements() {
  const [activeTab, setActiveTab] = useState('income');

  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState('');

  const [period, setPeriod] = useState('monthly');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [data, setData] = useState(null);
  const [trialBalance, setTrialBalance] = useState(null);
  const [exceptions, setExceptions] = useState(null);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [showDeliveryBreakdown, setShowDeliveryBreakdown] = useState(true);

  const safeNumber = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

  const canUseCustom = period === 'custom';
  const startDate = canUseCustom ? customStart : undefined;
  const endDate = canUseCustom ? customEnd : undefined;

  const fetchBranches = async () => {
    try {
      const plants = await getPlants();
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

  const fetchStatements = async () => {
    if (period === 'custom' && (!customStart || !customEnd)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await getFinancialStatements(period, startDate, endDate, branchId || undefined);
      setData(res || null);

      // GL-first support: show trial balance health for same period
      if (res?.period?.start && res?.period?.end) {
        const s = new Date(res.period.start).toISOString().slice(0, 10);
        const e = new Date(res.period.end).toISOString().slice(0, 10);

        const [tb, ex] = await Promise.allSettled([
          glTrialBalance({ startDate: s, endDate: e, branchIdOrZoneId: branchId || undefined }),
          glPostingExceptions({ startDate: s, endDate: e, branchIdOrZoneId: branchId || undefined }),
        ]);

        setTrialBalance(tb.status === 'fulfilled' ? tb.value : null);
        setExceptions(ex.status === 'fulfilled' ? ex.value : null);
      } else {
        setTrialBalance(null);
        setExceptions(null);
      }
    } catch (err) {
      console.error(err);
      setData(null);
      setTrialBalance(null);
      setExceptions(null);
      setErrorMsg(err?.response?.data?.message || 'Failed to load financial statements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchStatements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, customStart, customEnd, branchId]);

  const printStatement = () => window.print();

  const glEnabled = Boolean(data?.gl?.enabled);

  const tbBalanced = useMemo(() => Boolean(trialBalance?.totals?.balanced), [trialBalance]);
  const failedPostingCount = useMemo(() => safeNumber(exceptions?.totals?.failed, 0), [exceptions]);

  // ----- Core numbers -----
  const revenueTotal = useMemo(() => safeNumber(data?.income?.revenue?.total), [data]);
  const cogsTotal = useMemo(() => safeNumber(data?.income?.cogs?.total), [data]);
  const grossProfit = useMemo(() => safeNumber(data?.income?.grossProfit), [data]);
  const ebitda = useMemo(() => safeNumber(data?.income?.ebitda), [data]);
  const depreciation = useMemo(() => safeNumber(data?.income?.depreciation), [data]);
  const interest = useMemo(() => safeNumber(data?.income?.interest), [data]);
  const tax = useMemo(() => safeNumber(data?.income?.tax), [data]);
  const netIncome = useMemo(() => safeNumber(data?.income?.netIncome), [data]);

  const deliveryRecognized = useMemo(() => safeNumber(data?.income?.revenue?.delivery), [data]);
  const deliveryInvoiced = useMemo(() => safeNumber(data?.income?.revenue?.deliveryInvoiced), [data]);
  const deliveryUnpaidDelivered = useMemo(() => safeNumber(data?.income?.revenue?.deliveryUnpaidDelivered), [data]);

  const posRevenue = useMemo(() => safeNumber(data?.income?.revenue?.pos), [data]);
  const otherRevenue = useMemo(() => safeNumber(data?.income?.revenue?.other), [data]);

  const cogsMeta = useMemo(() => {
    const c = data?.income?.cogs || {};
    return {
      purchases: safeNumber(c.purchases),
      avgCostPerKg: safeNumber(c.avgCostPerKg),
      totalKgSold: safeNumber(c.totalKgSold),
    };
  }, [data]);

  const expenses = useMemo(() => {
    const e = data?.income?.expenses || {};
    return {
      salaries: safeNumber(e.salaries),
      logistics: safeNumber(e.logistics),
      utilities: safeNumber(e.utilities),
      maintenance: safeNumber(e.maintenance),
      marketing: safeNumber(e.marketing),
      admin: safeNumber(e.admin),
      total: safeNumber(e.total),
      source: e.source || null,
    };
  }, [data]);

  const ratios = useMemo(() => {
    const r = data?.ratios || {};
    return {
      grossMargin: safeNumber(r.grossMargin),
      netMargin: safeNumber(r.netMargin),
      dscr: safeNumber(r.dscr),
    };
  }, [data]);

  const cautions = useMemo(() => {
    const c = data?.balance?.cautions;
    return Array.isArray(c) ? c : [];
  }, [data]);

  const getPercentage = (val, total) => {
    const t = safeNumber(total);
    if (t <= 0) return '0.0%';
    return `${((safeNumber(val) / t) * 100).toFixed(1)}%`;
  };

  const periodLabel = useMemo(() => {
    if (period === 'custom') return `${customStart || '—'} → ${customEnd || '—'}`;
    if (period === 'monthly') return 'This Month';
    if (period === 'quarterly') return 'This Quarter';
    if (period === 'yearly') return 'This Year';
    return period;
  }, [period, customStart, customEnd]);

  const hasDeliveryBreakdown = useMemo(() => {
    return !!(
      data?.income?.revenue &&
      (Object.prototype.hasOwnProperty.call(data.income.revenue, 'deliveryInvoiced') ||
        Object.prototype.hasOwnProperty.call(data.income.revenue, 'deliveryUnpaidDelivered'))
    );
  }, [data]);

  const deliveryReconOk = useMemo(() => {
    if (!hasDeliveryBreakdown) return null;
    const lhs = safeNumber(deliveryInvoiced);
    const rhs = safeNumber(deliveryRecognized) + safeNumber(deliveryUnpaidDelivered);
    const diff = Math.abs(lhs - rhs);
    return diff <= 1;
  }, [hasDeliveryBreakdown, deliveryInvoiced, deliveryRecognized, deliveryUnpaidDelivered]);

  const revenueComponentsSum = useMemo(() => {
    return safeNumber(deliveryRecognized) + safeNumber(posRevenue) + safeNumber(otherRevenue);
  }, [deliveryRecognized, posRevenue, otherRevenue]);

  const revenueTotalOk = useMemo(() => {
    const diff = Math.abs(safeNumber(revenueTotal) - safeNumber(revenueComponentsSum));
    return diff <= 1;
  }, [revenueTotal, revenueComponentsSum]);

  const backendPeriodStart = useMemo(() => {
    const s = data?.period?.start;
    return s ? new Date(s) : null;
  }, [data]);

  const backendPeriodEnd = useMemo(() => {
    const e = data?.period?.end;
    return e ? new Date(e) : null;
  }, [data]);

  const backendPeriodLabel = useMemo(() => {
    if (!backendPeriodStart || !backendPeriodEnd) return null;
    const fmt = (d) => (Number.isNaN(d.getTime()) ? '—' : d.toISOString().slice(0, 10));
    return `${fmt(backendPeriodStart)} → ${fmt(backendPeriodEnd)}`;
  }, [backendPeriodStart, backendPeriodEnd]);

  if (loading) return <div className="p-10 text-center text-blue-400 animate-pulse">Auditing Ledger...</div>;

  if (!data)
    return (
      <div className="p-10 text-center text-gray-500">
        {errorMsg || 'No data available.'}
        {period === 'custom' && (!customStart || !customEnd) && (
          <div className="text-xs text-gray-400 mt-2">Select both custom start and end dates.</div>
        )}
        <div className="mt-4">
          <Button icon={RefreshCw} onClick={fetchStatements}>
            Retry
          </Button>
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <PageTitle title="Management Accounts" subtitle="GL-first Financial Reporting (Audit-grade when Trial Balance balances)" />
        <div className="flex gap-2">
          <Button variant="secondary" icon={RefreshCw} onClick={fetchStatements}>
            Refresh
          </Button>
          <Button variant="secondary" icon={Printer} onClick={printStatement}>
            Export PDF
          </Button>
        </div>
      </div>

      {/* GL Banner */}
      <Card className="bg-white/5 border border-white/10 rounded-xl p-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-white font-semibold">
            <ShieldCheck size={18} className="text-emerald-300" />
            Statements Source: <span className="text-emerald-300">{glEnabled ? 'GL (audit-grade)' : 'Legacy (operational aggregation)'}</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {trialBalance ? (
              tbBalanced ? (
                <span className="inline-flex items-center gap-1 text-emerald-300">
                  <CheckCircle2 size={14} /> Trial Balance Balanced
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-300">
                  <AlertTriangle size={14} /> Trial Balance NOT Balanced
                </span>
              )
            ) : (
              <span className="text-gray-500">Trial Balance: N/A</span>
            )}

            {exceptions ? (
              <span className={`inline-flex items-center gap-1 ${failedPostingCount > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>
                {failedPostingCount > 0 ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                Posting failures: {failedPostingCount}
              </span>
            ) : (
              <span className="text-gray-500">Posting failures: N/A</span>
            )}
          </div>
        </div>

        {!tbBalanced && trialBalance ? (
          <div className="mt-3 text-[11px] text-amber-200 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
            Your Trial Balance is not balanced for this period. In GL-first mode, that means statements may be unreliable until posting issues are fixed.
          </div>
        ) : null}
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end bg-white/5 p-4 rounded-xl print:hidden">
        <div className="flex flex-col gap-1">
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
          <p className="text-[10px] text-gray-500 mt-1">Maps to branchId / serviceZoneId</p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Period</label>
          <select
            className="px-3 py-2 rounded-lg bg-black/30 text-white border border-white/10"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {period === 'custom' && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Start</label>
              <input
                type="date"
                className="px-3 py-2 rounded-lg bg-black/30 text-white border border-white/10"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">End</label>
              <input
                type="date"
                className="px-3 py-2 rounded-lg bg-black/30 text-white border border-white/10"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="ml-auto text-xs text-gray-400 space-y-1">
          <div>
            Period (UI): <span className="text-white">{periodLabel}</span>
          </div>
          {backendPeriodLabel && (
            <div className="text-[10px] text-gray-500">
              Backend range: <span className="text-gray-300">{backendPeriodLabel}</span>
            </div>
          )}
        </div>
      </div>

      {/* Diagnostics */}
      <div className="print:hidden">
        <Card className="bg-white/5 p-4 rounded-xl border border-white/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                <Activity size={16} />
                Accuracy & Reconciliation Checks
              </div>
              <p className="text-xs text-gray-400 mt-1">
                These checks help explain dashboard/statement mismatches (recognized vs invoiced delivery revenue, and date fields).
              </p>
            </div>

            <div className="flex items-center gap-2">
              {hasDeliveryBreakdown && (
                <button
                  onClick={() => setShowDeliveryBreakdown((v) => !v)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-black/30 border border-white/10 text-gray-200 hover:text-white"
                >
                  {showDeliveryBreakdown ? 'Hide' : 'Show'} Delivery Breakdown
                </button>
              )}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-black/20 border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Revenue components sum</span>
                {revenueTotalOk ? (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
                    <CheckCircle2 size={14} /> OK
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-300">
                    <AlertTriangle size={14} /> Check
                  </span>
                )}
              </div>
              <div className="mt-1 text-sm text-white font-semibold">{formatCurrency(revenueComponentsSum)}</div>
              <div className="mt-1 text-[10px] text-gray-500">
                Should match Revenue Total: <span className="text-gray-300">{formatCurrency(revenueTotal)}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-black/20 border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Delivery recognition</span>
                {deliveryReconOk === null ? (
                  <span className="text-[10px] text-gray-500">N/A</span>
                ) : deliveryReconOk ? (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
                    <CheckCircle2 size={14} /> OK
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-300">
                    <AlertTriangle size={14} /> Check
                  </span>
                )}
              </div>
              <div className="mt-1 text-[11px] text-gray-300">
                Recognized (paid): <span className="text-white font-semibold">{formatCurrency(deliveryRecognized)}</span>
              </div>
              <div className="mt-1 text-[11px] text-gray-300">
                Invoiced (delivered): <span className="text-white font-semibold">{formatCurrency(deliveryInvoiced || 0)}</span>
              </div>
              <div className="mt-1 text-[11px] text-gray-300">
                Unpaid delivered: <span className="text-white font-semibold">{formatCurrency(deliveryUnpaidDelivered || 0)}</span>
              </div>
              <div className="mt-1 text-[10px] text-gray-500">
                Rule: invoiced = recognized + unpaid (Delivered but unpaid becomes receivable, not revenue).
              </div>
            </div>

            <div className="p-3 rounded-lg bg-black/20 border border-white/10">
              <div className="text-xs text-gray-400">COGS + Expense Source</div>
              <ul className="mt-2 space-y-1 text-[11px] text-gray-300 list-disc pl-4">
                <li>
                  COGS: {cogsMeta.totalKgSold.toLocaleString()} kg × ₦{cogsMeta.avgCostPerKg.toFixed(2)}
                </li>
                <li>Expenses source: <span className="text-gray-100">{expenses.source || 'N/A'}</span></li>
                <li>GL-first: Trial balance must balance.</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white/5 p-1 rounded-xl w-fit mb-4 print:hidden">
        {['income', 'balance', 'ratios'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'income' ? 'P&L' : tab === 'balance' ? 'Balance Sheet' : 'Bank Ratios'}
          </button>
        ))}
      </div>

      <Card className="min-h-[600px] bg-white text-black p-8 rounded-none max-w-5xl mx-auto print:w-full print:shadow-none">
        <div className="text-center border-b-2 border-black pb-4 mb-8">
          <h1 className="text-2xl font-bold uppercase tracking-widest text-black">PrimeJet Gas Ltd</h1>
          <h2 className="text-lg font-medium text-gray-600 uppercase mt-1">
            {activeTab === 'ratios'
              ? 'Financial Ratios & Covenants'
              : activeTab === 'income'
              ? 'Statement of Comprehensive Income'
              : 'Statement of Financial Position'}
          </h2>
          <p className="text-xs text-gray-500 mt-2">
            Period: {periodLabel} {branchId ? `| Branch: ${branchId}` : '| All Branches'}
          </p>
          {backendPeriodLabel && <p className="text-[10px] text-gray-400 mt-1">Backend range: {backendPeriodLabel}</p>}
        </div>

        {/* --- PROFIT & LOSS --- */}
        {activeTab === 'income' && (
          <>
            <table className="w-full text-sm">
              <thead className="border-b-2 border-black">
                <tr>
                  <th className="text-left py-2">Item</th>
                  <th className="text-right py-2">Amount (₦)</th>
                  <th className="text-right py-2 text-gray-500">% Rev</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="font-bold bg-gray-50">
                  <td className="py-2">REVENUE</td>
                  <td className="text-right">{formatCurrency(revenueTotal)}</td>
                  <td className="text-right">100%</td>
                </tr>

                <tr>
                  <td className="pl-4 py-1 text-gray-600">Cost of Sales (LPG)</td>
                  <td className="text-right text-red-600">({formatCurrency(cogsTotal)})</td>
                  <td className="text-right text-gray-500">{getPercentage(cogsTotal, revenueTotal)}</td>
                </tr>

                <tr className="font-bold bg-blue-50">
                  <td className="py-2">GROSS PROFIT</td>
                  <td className="text-right">{formatCurrency(grossProfit)}</td>
                  <td className="text-right">{getPercentage(grossProfit, revenueTotal)}</td>
                </tr>

                <tr>
                  <td className="py-2 font-semibold">Operating Expenses</td>
                  <td />
                  <td />
                </tr>

                {[
                  ['Staff Costs', expenses.salaries],
                  ['Logistics & Fuel', expenses.logistics],
                  ['Utilities', expenses.utilities],
                  ['Maintenance', expenses.maintenance],
                  ['Marketing', expenses.marketing],
                  ['Admin & General', expenses.admin],
                ].map(([label, val]) => (
                  <tr key={label}>
                    <td className="pl-4 py-1 text-gray-600">{label}</td>
                    <td className="text-right text-red-600">({formatCurrency(val)})</td>
                    <td className="text-right text-gray-500">{getPercentage(val, revenueTotal)}</td>
                  </tr>
                ))}

                <tr className="font-bold bg-gray-50">
                  <td className="py-2">TOTAL OPEX</td>
                  <td className="text-right text-red-700">({formatCurrency(expenses.total)})</td>
                  <td className="text-right text-gray-500">{getPercentage(expenses.total, revenueTotal)}</td>
                </tr>

                <tr className="font-bold border-t border-black text-lg">
                  <td className="py-4">EBITDA</td>
                  <td className={`text-right ${ebitda >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {formatCurrency(ebitda)}
                  </td>
                  <td className="text-right">{getPercentage(ebitda, revenueTotal)}</td>
                </tr>

                <tr>
                  <td className="pl-4 py-1 text-gray-600">Depreciation</td>
                  <td className="text-right text-red-600">({formatCurrency(depreciation)})</td>
                  <td className="text-right text-gray-500">{getPercentage(depreciation, revenueTotal)}</td>
                </tr>

                <tr>
                  <td className="pl-4 py-1 text-gray-600">Interest</td>
                  <td className="text-right text-red-600">({formatCurrency(interest)})</td>
                  <td className="text-right text-gray-500">{getPercentage(interest, revenueTotal)}</td>
                </tr>

                <tr>
                  <td className="pl-4 py-1 text-gray-600">Tax</td>
                  <td className="text-right text-red-600">({formatCurrency(tax)})</td>
                  <td className="text-right text-gray-500">{getPercentage(tax, revenueTotal)}</td>
                </tr>

                <tr className="font-bold border-t border-black text-lg">
                  <td className="py-4">NET INCOME</td>
                  <td className={`text-right ${netIncome >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {formatCurrency(netIncome)}
                  </td>
                  <td className="text-right">{getPercentage(netIncome, revenueTotal)}</td>
                </tr>
              </tbody>
            </table>
          </>
        )}

        {/* --- BALANCE SHEET --- */}
        {activeTab === 'balance' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-black mb-2">ASSETS</h3>
              <div className="border border-gray-200 rounded">
                {Array.isArray(data?.balance?.assets) &&
                  data.balance.assets.map((a, idx) => (
                    <div key={idx} className="flex justify-between p-3 border-b border-gray-100 last:border-b-0">
                      <span>{a.name}</span>
                      <span className="font-mono font-bold">{formatCurrency(safeNumber(a.value))}</span>
                    </div>
                  ))}
              </div>

              {cautions.length > 0 && (
                <div className="mt-3 border border-amber-200 bg-amber-50 p-4 rounded print:hidden">
                  <div className="font-semibold text-amber-900 flex items-center gap-2">
                    <AlertTriangle size={16} /> Notes / Cautions
                  </div>
                  <ul className="mt-2 list-disc pl-5 text-xs text-amber-900 space-y-1">
                    {cautions.map((c, idx) => (
                      <li key={idx}>{String(c)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <h3 className="font-bold text-black mb-2">LIABILITIES</h3>
              <div className="border border-gray-200 rounded">
                {Array.isArray(data?.balance?.liabilities) &&
                  data.balance.liabilities.map((l, idx) => (
                    <div key={idx} className="flex justify-between p-3 border-b border-gray-100 last:border-b-0">
                      <span>{l.name}</span>
                      <span className="font-mono font-bold">{formatCurrency(safeNumber(l.value))}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-black mb-2">EQUITY</h3>
              <div className="border border-gray-200 rounded">
                {Array.isArray(data?.balance?.equity) &&
                  data.balance.equity.map((e, idx) => (
                    <div key={idx} className="flex justify-between p-3 border-b border-gray-100 last:border-b-0">
                      <span>{e.name}</span>
                      <span className="font-mono font-bold">{formatCurrency(safeNumber(e.value))}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* --- RATIOS --- */}
        {activeTab === 'ratios' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <div className="p-4 border border-gray-200 rounded bg-gray-50">
                <h4 className="font-bold text-gray-700 uppercase text-xs mb-2">Profitability</h4>
                <div className="flex justify-between items-center mb-2">
                  <span>Gross Margin</span>
                  <span className="font-mono font-bold">{ratios.grossMargin.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Net Margin</span>
                  <span className="font-mono font-bold">{ratios.netMargin.toFixed(1)}%</span>
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded bg-gray-50">
                <h4 className="font-bold text-gray-700 uppercase text-xs mb-2">Coverage</h4>
                <div className="flex justify-between items-center mb-2">
                  <span>DSCR</span>
                  <span className={`font-mono font-bold ${ratios.dscr >= 1.25 ? 'text-green-600' : 'text-red-600'}`}>
                    {ratios.dscr.toFixed(2)}x
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 mt-2">Bank target: &gt; 1.25x</p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}