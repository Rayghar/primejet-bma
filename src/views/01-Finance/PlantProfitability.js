// src/views/02-Operations/PlantProfitability.js
import React, { useMemo, useState } from 'react';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import { RefreshCw, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export default function PlantProfitability() {
  const [sim, setSim] = useState({
    sellingPrice: 1100,
    costPrice: 850,
    monthlyVolume: 5000,
    fixedOverheads: 450000,
    marketingSpend: 50000,
  });

  const safeNum = (v, d = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  };

  const updateNum = (key, value) => {
    setSim((prev) => ({
      ...prev,
      [key]: safeNum(value, 0),
    }));
  };

  const metrics = useMemo(() => {
    const sellingPrice = safeNum(sim.sellingPrice);
    const costPrice = safeNum(sim.costPrice);
    const monthlyVolume = safeNum(sim.monthlyVolume);
    const fixedOverheads = safeNum(sim.fixedOverheads);
    const marketingSpend = safeNum(sim.marketingSpend);

    const revenue = sellingPrice * monthlyVolume;
    const cogs = costPrice * monthlyVolume;
    const grossProfit = revenue - cogs;
    const totalExpenses = fixedOverheads + marketingSpend;
    const netProfit = grossProfit - totalExpenses;

    const grossMarginPerKg = sellingPrice - costPrice;
    const marginPercent = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const netMarginPercent = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    // Guard against divide-by-zero / negative margin scenario
    const breakEvenKg = grossMarginPerKg > 0 ? totalExpenses / grossMarginPerKg : Infinity;

    return {
      sellingPrice,
      costPrice,
      monthlyVolume,
      fixedOverheads,
      marketingSpend,
      revenue,
      cogs,
      grossProfit,
      totalExpenses,
      netProfit,
      grossMarginPerKg,
      marginPercent,
      netMarginPercent,
      breakEvenKg,
    };
  }, [sim]);

  const volumeCap = 20000;
  const breakEvenMarkerPct =
    Number.isFinite(metrics.breakEvenKg) && metrics.breakEvenKg > 0
      ? Math.min((metrics.breakEvenKg / volumeCap) * 100, 100)
      : 100;

  const currentVolumePct = Math.max(0, Math.min((metrics.monthlyVolume / volumeCap) * 100, 100));

  const isHealthyUnitEconomics = metrics.grossMarginPerKg > 0;
  const isAboveBreakEven = isHealthyUnitEconomics && metrics.monthlyVolume > metrics.breakEvenKg;

  const resetDefaults = () => {
    setSim({
      sellingPrice: 1100,
      costPrice: 850,
      monthlyVolume: 5000,
      fixedOverheads: 450000,
      marketingSpend: 50000,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageTitle title="Profitability Simulator" subtitle="Sensitivity Analysis & Stress Testing" />
        <button
          onClick={resetDefaults}
          className="glass-button px-3 py-2 text-xs font-semibold flex items-center"
          title="Reset values"
        >
          <RefreshCw size={14} className="mr-2" />
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <Card className="glass-card border-l-4 border-blue-500 h-fit">
          <h3 className="font-bold text-white mb-6 flex items-center">
            <RefreshCw size={20} className="mr-2 text-blue-400" /> Input Variables
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-xs mb-1">Avg Selling Price (₦/kg)</label>
              <input
                type="number"
                min="0"
                className="glass-input w-full p-2"
                value={sim.sellingPrice}
                onChange={(e) => updateNum('sellingPrice', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-gray-400 text-xs mb-1">Cost Price (₦/kg)</label>
              <input
                type="number"
                min="0"
                className="glass-input w-full p-2"
                value={sim.costPrice}
                onChange={(e) => updateNum('costPrice', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-gray-400 text-xs mb-1">Monthly Volume (kg)</label>
              <input
                type="range"
                min="1000"
                max={volumeCap}
                step="100"
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                value={sim.monthlyVolume}
                onChange={(e) => updateNum('monthlyVolume', e.target.value)}
              />
              <div className="text-right text-white font-mono">{metrics.monthlyVolume.toLocaleString()} kg</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-gray-400 text-xs mb-1">Fixed Costs</label>
                <input
                  type="number"
                  min="0"
                  className="glass-input w-full p-2"
                  value={sim.fixedOverheads}
                  onChange={(e) => updateNum('fixedOverheads', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs mb-1">Marketing</label>
                <input
                  type="number"
                  min="0"
                  className="glass-input w-full p-2"
                  value={sim.marketingSpend}
                  onChange={(e) => updateNum('marketingSpend', e.target.value)}
                />
              </div>
            </div>

            {/* Quick diagnostics */}
            <div
              className={`mt-2 p-3 rounded-xl border ${
                isHealthyUnitEconomics ? 'border-emerald-500/20 bg-emerald-500/10' : 'border-red-500/20 bg-red-500/10'
              }`}
            >
              <div className="text-xs text-gray-300">Unit Margin (₦/kg)</div>
              <div className={`font-bold ${isHealthyUnitEconomics ? 'text-emerald-300' : 'text-red-300'}`}>
                {formatCurrency(metrics.grossMarginPerKg)}
              </div>
              {!isHealthyUnitEconomics && (
                <p className="text-[10px] text-red-200 mt-1">
                  Selling price must exceed cost price to achieve break-even.
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Report Card */}
        <Card className="lg:col-span-2 glass-card">
          <h3 className="font-bold text-white mb-6">Financial Projection</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div
              className={`p-4 rounded-xl border ${
                metrics.netProfit > 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
              }`}
            >
              <p className={metrics.netProfit > 0 ? 'text-green-400 text-sm' : 'text-red-400 text-sm'}>Net Profit (Monthly)</p>
              <p className="text-2xl md:text-3xl font-bold text-white mt-1">{formatCurrency(metrics.netProfit)}</p>
              <p className="text-[10px] text-gray-400 mt-1">{metrics.netMarginPercent.toFixed(1)}% net margin</p>
            </div>

            <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <p className="text-blue-400 text-sm">Gross Margin</p>
              <p className="text-2xl md:text-3xl font-bold text-white mt-1">{metrics.marginPercent.toFixed(1)}%</p>
              <p className="text-[10px] text-gray-400 mt-1">{formatCurrency(metrics.grossProfit)} gross profit</p>
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-gray-300 text-sm">Break-even Status</p>
              <p className={`text-lg font-bold mt-1 ${isAboveBreakEven ? 'text-emerald-300' : 'text-amber-300'}`}>
                {isHealthyUnitEconomics ? (isAboveBreakEven ? 'Above BEP' : 'Below BEP') : 'No BEP'}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                {Number.isFinite(metrics.breakEvenKg)
                  ? `${Math.ceil(metrics.breakEvenKg).toLocaleString()} kg required`
                  : 'Negative/zero unit margin'}
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-400">Total Revenue</span>
              <span className="text-white">{formatCurrency(metrics.revenue)}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-400">COGS</span>
              <span className="text-red-300">-{formatCurrency(metrics.cogs)}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-400">Gross Profit</span>
              <span className={`${metrics.grossProfit >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                {formatCurrency(metrics.grossProfit)}
              </span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-400">Operating Expenses</span>
              <span className="text-red-300">-{formatCurrency(metrics.totalExpenses)}</span>
            </div>
          </div>

          <div className="mt-8">
            <h4 className="font-bold text-white text-sm mb-2 flex items-center">
              <TrendingUp size={16} className="mr-2 text-yellow-500" /> Break-Even Analysis
            </h4>

            <div className="w-full bg-gray-700 h-6 rounded-full overflow-hidden relative">
              {/* Breakeven Marker */}
              {Number.isFinite(metrics.breakEvenKg) && (
                <div
                  className="absolute top-0 bottom-0 bg-yellow-500 w-1 z-10 shadow-[0_0_10px_rgba(234,179,8,0.8)]"
                  style={{ left: `${breakEvenMarkerPct}%` }}
                />
              )}

              {/* Current Volume */}
              <div
                className={`h-full transition-all duration-500 ${
                  isHealthyUnitEconomics ? (isAboveBreakEven ? 'bg-green-500' : 'bg-red-500') : 'bg-red-600'
                }`}
                style={{ width: `${currentVolumePct}%` }}
              />
            </div>

            <div className="flex justify-between text-xs mt-2 text-gray-400">
              <span>0 kg</span>
              <span className="text-yellow-500 font-bold">
                {Number.isFinite(metrics.breakEvenKg)
                  ? `BEP: ${Math.ceil(metrics.breakEvenKg).toLocaleString()} kg`
                  : 'BEP: N/A'}
              </span>
              <span>{volumeCap.toLocaleString()} kg Cap</span>
            </div>

            <p className="text-xs text-center mt-2 text-gray-500">
              {!isHealthyUnitEconomics ? (
                <span className="inline-flex items-center gap-1 text-red-300">
                  <AlertTriangle size={14} />
                  Break-even is not possible until selling price exceeds cost price.
                </span>
              ) : isAboveBreakEven ? (
                `You are selling ${Math.ceil(metrics.monthlyVolume - metrics.breakEvenKg).toLocaleString()} kg ABOVE break-even point.`
              ) : (
                `You need to sell ${Math.ceil(metrics.breakEvenKg - metrics.monthlyVolume).toLocaleString()} kg more to break even.`
              )}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
