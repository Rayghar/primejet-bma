import React, { useState, useEffect } from 'react';
import { getFinancialStatements } from '../../api/financialService';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import { Printer, FileText, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export default function FinancialStatements() {
    const [activeTab, setActiveTab] = useState('income');
    const [period, setPeriod] = useState('monthly');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getFinancialStatements(period)
            .then(res => setData(res))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [period]);

    const handlePrint = () => window.print();

    if (loading) return <div className="p-8 text-center text-blue-400 animate-pulse">Loading Financial Data...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <PageTitle title="Financial Statements" subtitle="Automated Reporting & Analysis" />
                <div className="flex gap-2">
                    <select 
                        value={period} 
                        onChange={(e) => setPeriod(e.target.value)}
                        className="glass-input p-2 text-sm bg-black/20"
                    >
                        <option value="monthly">This Month</option>
                        <option value="quarterly">This Quarter</option>
                        <option value="yearly">This Year</option>
                    </select>
                    <Button variant="secondary" icon={Printer} onClick={handlePrint}>Print</Button>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex space-x-1 bg-white/5 p-1 rounded-xl w-fit">
                {['income', 'balance', 'cashflow'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                            activeTab === tab 
                            ? 'bg-blue-600 text-white shadow-lg' 
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        {tab.replace('income', 'Income Statement').replace('balance', 'Balance Sheet').replace('cashflow', 'Cash Flow')}
                    </button>
                ))}
            </div>

            <Card className="min-h-[500px]">
                {activeTab === 'income' && data?.income && (
                    <div className="space-y-1 animate-in fade-in">
                        <h3 className="font-bold text-white text-lg mb-6 border-b border-white/10 pb-2">Profit & Loss Statement</h3>
                        
                        <div className="flex justify-between py-3 border-b border-white/5 text-green-400 font-medium">
                            <span>Total Revenue</span>
                            <span>{formatCurrency(data.income.revenue)}</span>
                        </div>
                        
                        <div className="flex justify-between py-3 border-b border-white/5 text-red-300 pl-4">
                            <span>Cost of Goods Sold (COGS)</span>
                            <span>-{formatCurrency(data.income.cogs)}</span>
                        </div>
                        
                        <div className="flex justify-between py-3 border-b border-white/5 text-blue-300 font-bold bg-white/5 px-2 rounded">
                            <span>Gross Profit</span>
                            <span>{formatCurrency(data.income.grossProfit)}</span>
                        </div>

                        <div className="py-4">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Operating Expenses</p>
                            <div className="flex justify-between py-2 text-sm text-gray-300 pl-4">
                                <span>Total Opex</span>
                                <span>-{formatCurrency(data.income.expenses)}</span>
                            </div>
                        </div>

                        <div className="flex justify-between py-4 border-t border-white/20 text-white text-xl font-bold mt-4">
                            <span>Net Income</span>
                            <span className={data.income.netIncome >= 0 ? 'text-green-400' : 'text-red-500'}>
                                {formatCurrency(data.income.netIncome)}
                            </span>
                        </div>
                    </div>
                )}

                {activeTab === 'balance' && data?.balance && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in">
                        <div>
                            <h3 className="font-bold text-blue-400 mb-4 flex items-center"><TrendingUp size={18} className="mr-2"/> Assets</h3>
                            <div className="space-y-3">
                                {data.balance.assets.map((item, i) => (
                                    <div key={i} className="flex justify-between text-sm p-3 bg-white/5 rounded-lg">
                                        <span className="text-gray-300">{item.name}</span>
                                        <span className="font-mono">{formatCurrency(item.value)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between font-bold text-white pt-2 border-t border-white/10">
                                    <span>Total Assets</span>
                                    <span>{formatCurrency(data.balance.assets.reduce((a,b)=>a+b.value,0))}</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-red-400 mb-4 flex items-center"><Activity size={18} className="mr-2"/> Liabilities</h3>
                            <div className="space-y-3">
                                {data.balance.liabilities.map((item, i) => (
                                    <div key={i} className="flex justify-between text-sm p-3 bg-white/5 rounded-lg">
                                        <span className="text-gray-300">{item.name}</span>
                                        <span className="font-mono">{formatCurrency(item.value)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between font-bold text-white pt-2 border-t border-white/10">
                                    <span>Total Liabilities</span>
                                    <span>{formatCurrency(data.balance.liabilities.reduce((a,b)=>a+b.value,0))}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'cashflow' && (
                    <div className="text-center py-20 text-gray-500">
                        <FileText size={48} className="mx-auto mb-4 opacity-20" />
                        <p>Cash Flow Statement module is synchronizing with bank feeds...</p>
                    </div>
                )}
            </Card>
        </div>
    );
}