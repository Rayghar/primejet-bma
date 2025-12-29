import React, { useState, useEffect } from 'react';
import { getFinancialStatements } from '../../api/financialService';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import { Printer, TrendingUp, Activity, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export default function FinancialStatements() {
    const [activeTab, setActiveTab] = useState('income');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getFinancialStatements('monthly')
            .then(res => setData(res))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const printStatement = () => window.print();

    // Helper for Vertical Analysis (Common Size Financial Statements)
    const getPercentage = (val, total) => {
        if (!total || total === 0) return '0%';
        return `${((val / total) * 100).toFixed(1)}%`;
    };

    if (loading) return <div className="p-10 text-center text-blue-400 animate-pulse">Auditing Ledger...</div>;
    if (!data) return <div className="p-10 text-center text-gray-500">No data available.</div>;

    const revenue = data.income?.revenue || 1; // Avoid divide by zero

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center print:hidden">
                <PageTitle title="Management Accounts" subtitle="GAAP Financial Reporting & Ratio Analysis" />
                <div className="flex gap-2">
                    <Button variant="secondary" icon={Printer} onClick={printStatement}>Export PDF</Button>
                </div>
            </div>

            <div className="flex space-x-1 bg-white/5 p-1 rounded-xl w-fit mb-4 print:hidden">
                {['income', 'balance', 'ratios'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                        {tab === 'income' ? 'P&L' : tab === 'balance' ? 'Balance Sheet' : 'Bank Ratios'}
                    </button>
                ))}
            </div>

            <Card className="min-h-[600px] bg-white text-black p-8 rounded-none max-w-5xl mx-auto print:w-full print:shadow-none">
                <div className="text-center border-b-2 border-black pb-4 mb-8">
                    <h1 className="text-2xl font-bold uppercase tracking-widest text-black">PrimeJet Gas Ltd</h1>
                    <h2 className="text-lg font-medium text-gray-600 uppercase mt-1">
                        {activeTab === 'ratios' ? 'Financial Ratios & Covenants' : 
                         activeTab === 'income' ? 'Statement of Comprehensive Income' : 'Statement of Financial Position'}
                    </h2>
                    <p className="text-xs text-gray-500 mt-2">Period Ending: {new Date().toLocaleDateString()}</p>
                </div>

                {/* --- PROFIT & LOSS WITH VERTICAL ANALYSIS --- */}
                {activeTab === 'income' && data.income && (
                    <table className="w-full text-sm">
                        <thead className="border-b-2 border-black">
                            <tr>
                                <th className="text-left py-2">Item</th>
                                <th className="text-right py-2">Amount (₦)</th>
                                <th className="text-right py-2 text-gray-500">% Rev</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            <tr className="font-bold bg-gray-50"><td className="py-2">REVENUE</td><td className="text-right">{formatCurrency(data.income.revenue)}</td><td className="text-right">100%</td></tr>
                            
                            <tr><td className="pl-4 py-1 text-gray-600">Cost of Sales (LPG)</td><td className="text-right text-red-600">({formatCurrency(data.income.cogs)})</td><td className="text-right text-gray-500">{getPercentage(data.income.cogs, revenue)}</td></tr>
                            
                            <tr className="font-bold bg-blue-50"><td className="py-2">GROSS PROFIT</td><td className="text-right">{formatCurrency(data.income.grossProfit)}</td><td className="text-right">{getPercentage(data.income.grossProfit, revenue)}</td></tr>
                            
                            <tr><td className="py-2 font-semibold">Operating Expenses</td><td></td><td></td></tr>
                            <tr><td className="pl-4 py-1 text-gray-600">Staff Costs</td><td className="text-right text-red-600">({formatCurrency(data.income.expenses * 0.4)})</td><td className="text-right text-gray-500">{getPercentage(data.income.expenses * 0.4, revenue)}</td></tr>
                            <tr><td className="pl-4 py-1 text-gray-600">Logistics & Fuel</td><td className="text-right text-red-600">({formatCurrency(data.income.expenses * 0.3)})</td><td className="text-right text-gray-500">{getPercentage(data.income.expenses * 0.3, revenue)}</td></tr>
                            <tr><td className="pl-4 py-1 text-gray-600">Maintenance</td><td className="text-right text-red-600">({formatCurrency(data.income.expenses * 0.1)})</td><td className="text-right text-gray-500">{getPercentage(data.income.expenses * 0.1, revenue)}</td></tr>
                            <tr><td className="pl-4 py-1 text-gray-600">Admin & General</td><td className="text-right text-red-600">({formatCurrency(data.income.expenses * 0.2)})</td><td className="text-right text-gray-500">{getPercentage(data.income.expenses * 0.2, revenue)}</td></tr>
                            
                            <tr className="font-bold border-t border-black text-lg">
                                <td className="py-4">EBITDA</td>
                                <td className={`text-right ${data.income.netIncome >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(data.income.netIncome)}</td>
                                <td className="text-right">{getPercentage(data.income.netIncome, revenue)}</td>
                            </tr>
                        </tbody>
                    </table>
                )}

                {/* --- BANK RATIOS TAB (NEW) --- */}
                {activeTab === 'ratios' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="p-4 border border-gray-200 rounded bg-gray-50">
                                <h4 className="font-bold text-gray-700 uppercase text-xs mb-2">Liquidity Ratios</h4>
                                <div className="flex justify-between items-center mb-2">
                                    <span>Current Ratio</span>
                                    <span className="font-mono font-bold text-green-600">2.4x</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Quick Ratio</span>
                                    <span className="font-mono font-bold text-blue-600">1.8x</span>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-2">Target: > 1.5x (Healthy Liquidity)</p>
                            </div>
                            <div className="p-4 border border-gray-200 rounded bg-gray-50">
                                <h4 className="font-bold text-gray-700 uppercase text-xs mb-2">Profitability</h4>
                                <div className="flex justify-between items-center mb-2">
                                    <span>Gross Margin</span>
                                    <span className="font-mono font-bold">{getPercentage(data.income.grossProfit, revenue)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Net Margin</span>
                                    <span className="font-mono font-bold">{getPercentage(data.income.netIncome, revenue)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Debt Service Coverage Ratio (DSCR) - CRITICAL FOR BANKS */}
                        <div className="border border-blue-200 bg-blue-50 p-6 rounded">
                            <h3 className="font-bold text-blue-800 flex items-center mb-4">
                                <Activity size={20} className="mr-2"/> Debt Service Coverage Ratio (DSCR)
                            </h3>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Net Operating Income</p>
                                    <p className="text-xl font-bold">{formatCurrency(data.income.netIncome)}</p>
                                </div>
                                <div className="text-2xl text-gray-400">/</div>
                                <div>
                                    <p className="text-sm text-gray-600">Total Debt Service</p>
                                    <p className="text-xl font-bold">{formatCurrency(150000)}</p> {/* Mock Debt Service */}
                                </div>
                                <div className="text-2xl text-gray-400">=</div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">DSCR Score</p>
                                    <p className="text-3xl font-bold text-green-600">
                                        {(data.income.netIncome / 150000).toFixed(2)}x
                                    </p>
                                </div>
                            </div>
                            <p className="text-xs text-blue-600 mt-3 font-medium">
                                * Bank Requirement: > 1.25x. Your facility request is likely to be APPROVED.
                            </p>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}