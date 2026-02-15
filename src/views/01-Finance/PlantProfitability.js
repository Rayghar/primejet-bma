import React, { useState } from 'react';
import PageTitle from '../../components/shared/PageTitle';
import { TrendingUp, DollarSign, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export default function PlantProfitability() {
    // Simulator State
    const [sim, setSim] = useState({
        sellingPrice: 1100,
        costPrice: 850,
        monthlyVolume: 5000,
        fixedOverheads: 450000
    });

    // Calculations
    const revenue = sim.sellingPrice * sim.monthlyVolume;
    const cogs = sim.costPrice * sim.monthlyVolume;
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - sim.fixedOverheads;
    const marginPercent = (grossProfit / revenue) * 100;
    const breakEvenKg = sim.fixedOverheads / (sim.sellingPrice - sim.costPrice);

    return (
        <div className="space-y-6">
            <PageTitle title="Profitability Engine" subtitle="Unit economics simulator & breakeven analysis" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Simulator Controls */}
                <div className="glass-card border-l-4 border-blue-500">
                    <h3 className="font-bold text-white mb-6 flex items-center">
                        <RefreshCw size={20} className="mr-2 text-blue-400"/> Interactive Simulator
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-gray-400 text-xs mb-1">Selling Price (₦/kg)</label>
                            <input type="number" className="glass-input w-full p-2" value={sim.sellingPrice} onChange={e => setSim({...sim, sellingPrice: Number(e.target.value)})}/>
                        </div>
                        <div>
                            <label className="block text-gray-400 text-xs mb-1">Cost Price (₦/kg)</label>
                            <input type="number" className="glass-input w-full p-2" value={sim.costPrice} onChange={e => setSim({...sim, costPrice: Number(e.target.value)})}/>
                        </div>
                        <div>
                            <label className="block text-gray-400 text-xs mb-1">Est. Monthly Volume (kg)</label>
                            <input type="range" min="1000" max="20000" step="100" className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" value={sim.monthlyVolume} onChange={e => setSim({...sim, monthlyVolume: Number(e.target.value)})}/>
                            <div className="text-right text-white font-mono">{sim.monthlyVolume.toLocaleString()} kg</div>
                        </div>
                        <div>
                            <label className="block text-gray-400 text-xs mb-1">Fixed Overheads (Rent/Salaries)</label>
                            <input type="number" className="glass-input w-full p-2" value={sim.fixedOverheads} onChange={e => setSim({...sim, fixedOverheads: Number(e.target.value)})}/>
                        </div>
                    </div>
                </div>

                {/* Results Panel */}
                <div className="lg:col-span-2 glass-card bg-gradient-to-br from-white/5 to-white/0">
                    <h3 className="font-bold text-white mb-6">Projected Outcomes</h3>
                    
                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                            <p className="text-green-400 text-sm">Net Profit (Monthly)</p>
                            <p className="text-3xl font-bold text-white mt-1">{formatCurrency(netProfit)}</p>
                        </div>
                        <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                            <p className="text-blue-400 text-sm">Gross Margin</p>
                            <p className="text-3xl font-bold text-white mt-1">{marginPercent.toFixed(1)}%</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between text-sm text-gray-400 border-b border-white/5 pb-2">
                            <span>Total Revenue</span>
                            <span className="text-white">{formatCurrency(revenue)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-400 border-b border-white/5 pb-2">
                            <span>Cost of Goods (COGS)</span>
                            <span className="text-red-300">-{formatCurrency(cogs)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-400 border-b border-white/5 pb-2">
                            <span>Fixed Overheads</span>
                            <span className="text-red-300">-{formatCurrency(sim.fixedOverheads)}</span>
                        </div>
                        
                        <div className="mt-6 pt-4">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Breakeven Analysis</p>
                            <div className="w-full bg-gray-700 h-4 rounded-full overflow-hidden relative">
                                {/* Breakeven Marker */}
                                <div className="absolute top-0 bottom-0 bg-yellow-500 w-1 z-10" style={{ left: `${Math.min((breakEvenKg/20000)*100, 100)}%` }}></div>
                                {/* Current Volume */}
                                <div className="bg-blue-600 h-full transition-all duration-500" style={{ width: `${(sim.monthlyVolume/20000)*100}%` }}></div>
                            </div>
                            <div className="flex justify-between text-xs mt-2 text-gray-400">
                                <span>0 kg</span>
                                <span className="text-yellow-500 font-bold">Breakeven: {Math.ceil(breakEvenKg).toLocaleString()} kg</span>
                                <span>20k kg</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}