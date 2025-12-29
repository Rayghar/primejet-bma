import React, { useState } from 'react';
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
        marketingSpend: 50000
    });

    const revenue = sim.sellingPrice * sim.monthlyVolume;
    const cogs = sim.costPrice * sim.monthlyVolume;
    const grossProfit = revenue - cogs;
    const totalExpenses = sim.fixedOverheads + sim.marketingSpend;
    const netProfit = grossProfit - totalExpenses;
    const marginPercent = (grossProfit / revenue) * 100;
    const breakEvenKg = totalExpenses / (sim.sellingPrice - sim.costPrice);

    return (
        <div className="space-y-6">
            <PageTitle title="Profitability Simulator" subtitle="Sensitivity Analysis & Stress Testing" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Controls */}
                <div className="glass-card border-l-4 border-blue-500 h-fit">
                    <h3 className="font-bold text-white mb-6 flex items-center">
                        <RefreshCw size={20} className="mr-2 text-blue-400"/> Input Variables
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-gray-400 text-xs mb-1">Avg Selling Price (₦/kg)</label>
                            <input type="number" className="glass-input w-full p-2" value={sim.sellingPrice} onChange={e => setSim({...sim, sellingPrice: Number(e.target.value)})}/>
                        </div>
                        <div>
                            <label className="block text-gray-400 text-xs mb-1">Cost Price (₦/kg)</label>
                            <input type="number" className="glass-input w-full p-2" value={sim.costPrice} onChange={e => setSim({...sim, costPrice: Number(e.target.value)})}/>
                        </div>
                        <div>
                            <label className="block text-gray-400 text-xs mb-1">Monthly Volume (kg)</label>
                            <input type="range" min="1000" max="20000" step="100" className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" value={sim.monthlyVolume} onChange={e => setSim({...sim, monthlyVolume: Number(e.target.value)})}/>
                            <div className="text-right text-white font-mono">{sim.monthlyVolume.toLocaleString()} kg</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-gray-400 text-xs mb-1">Fixed Costs</label>
                                <input type="number" className="glass-input w-full p-2" value={sim.fixedOverheads} onChange={e => setSim({...sim, fixedOverheads: Number(e.target.value)})}/>
                            </div>
                            <div>
                                <label className="block text-gray-400 text-xs mb-1">Marketing</label>
                                <input type="number" className="glass-input w-full p-2" value={sim.marketingSpend} onChange={e => setSim({...sim, marketingSpend: Number(e.target.value)})}/>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Report Card */}
                <div className="lg:col-span-2 glass-card">
                    <h3 className="font-bold text-white mb-6">Financial Projection</h3>
                    
                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className={`p-4 rounded-xl border ${netProfit > 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                            <p className={netProfit > 0 ? "text-green-400 text-sm" : "text-red-400 text-sm"}>Net Profit (Monthly)</p>
                            <p className="text-3xl font-bold text-white mt-1">{formatCurrency(netProfit)}</p>
                        </div>
                        <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                            <p className="text-blue-400 text-sm">Gross Margin</p>
                            <p className="text-3xl font-bold text-white mt-1">{marginPercent.toFixed(1)}%</p>
                        </div>
                    </div>

                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-gray-400">Total Revenue</span><span className="text-white">{formatCurrency(revenue)}</span></div>
                        <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-gray-400">COGS</span><span className="text-red-300">-{formatCurrency(cogs)}</span></div>
                        <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-gray-400">Operating Expenses</span><span className="text-red-300">-{formatCurrency(totalExpenses)}</span></div>
                    </div>

                    <div className="mt-8">
                        <h4 className="font-bold text-white text-sm mb-2 flex items-center"><TrendingUp size={16} className="mr-2 text-yellow-500"/> Break-Even Analysis</h4>
                        <div className="w-full bg-gray-700 h-6 rounded-full overflow-hidden relative">
                            {/* Breakeven Marker */}
                            <div className="absolute top-0 bottom-0 bg-yellow-500 w-1 z-10 shadow-[0_0_10px_rgba(234,179,8,0.8)]" style={{ left: `${Math.min((breakEvenKg/20000)*100, 100)}%` }}></div>
                            {/* Current Volume */}
                            <div className={`h-full transition-all duration-500 ${sim.monthlyVolume > breakEvenKg ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${(sim.monthlyVolume/20000)*100}%` }}></div>
                        </div>
                        <div className="flex justify-between text-xs mt-2 text-gray-400">
                            <span>0 kg</span>
                            <span className="text-yellow-500 font-bold">BEP: {Math.ceil(breakEvenKg).toLocaleString()} kg</span>
                            <span>20k kg Cap</span>
                        </div>
                        <p className="text-xs text-center mt-2 text-gray-500">
                            {sim.monthlyVolume > breakEvenKg 
                                ? `You are selling ${Math.ceil(sim.monthlyVolume - breakEvenKg)}kg ABOVE break-even point.`
                                : `You need to sell ${Math.ceil(breakEvenKg - sim.monthlyVolume)}kg more to break even.`}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}