import React, { useState, useEffect } from 'react';
import { getFinancialStatements } from '../../api/financialService';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import { Printer, TrendingUp, Activity, DollarSign } from 'lucide-react';
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

    if (loading) return <div className="p-8 text-center text-blue-400 animate-pulse">Generating Reports...</div>;
    if (!data) return <div className="p-8 text-center text-gray-500">No financial data available.</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <PageTitle title="Financial Statements" subtitle="Automated GAAP Reporting" />
                <div className="flex gap-2">
                    <select className="glass-input p-2 text-sm bg-black/20" value={period} onChange={e => setPeriod(e.target.value)}>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                    </select>
                    <Button variant="secondary" icon={Printer} onClick={handlePrint}>Print</Button>
                </div>
            </div>

            <div className="flex space-x-2 bg-white/5 p-1 rounded-xl w-fit mb-4">
                {['income', 'balance', 'cashFlow'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                        {tab.replace('income', 'Income Statement').replace('balance', 'Balance Sheet').replace('cashFlow', 'Cash Flow')}
                    </button>
                ))}
            </div>

            <Card>
                {activeTab === 'income' && data.income && (
                    <div className="space-y-2 animate-in fade-in">
                        <h3 className="font-bold text-white border-b border-white/10 pb-2 mb-4">Profit & Loss</h3>
                        <Row label="Total Revenue" value={data.income.revenue} isHeader color="text-green-400" />
                        <Row label="Cost of Goods Sold (COGS)" value={-data.income.cogs} color="text-red-300" />
                        <Row label="Gross Profit" value={data.income.grossProfit} isBold />
                        <div className="py-2"></div>
                        <Row label="Operating Expenses" value={-data.income.expenses} color="text-red-300" />
                        <div className="border-t border-white/10 my-2"></div>
                        <Row label="Net Income" value={data.income.netIncome} isBold size="text-xl" color={data.income.netIncome >= 0 ? 'text-green-400' : 'text-red-500'} />
                    </div>
                )}

                {activeTab === 'balance' && data.balance && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in">
                        <div>
                            <h3 className="font-bold text-blue-400 mb-4">Assets</h3>
                            {data.balance.assets.map((item, i) => <Row key={i} label={item.name} value={item.value} />)}
                            <div className="border-t border-white/10 my-2"></div>
                            <Row label="Total Assets" value={data.balance.assets.reduce((a,b)=>a+b.value,0)} isBold />
                        </div>
                        <div>
                            <h3 className="font-bold text-red-400 mb-4">Liabilities</h3>
                            {data.balance.liabilities.map((item, i) => <Row key={i} label={item.name} value={item.value} />)}
                            <div className="border-t border-white/10 my-2"></div>
                            <Row label="Total Liabilities" value={data.balance.liabilities.reduce((a,b)=>a+b.value,0)} isBold />
                        </div>
                    </div>
                )}

                {activeTab === 'cashFlow' && data.cashFlow && (
                    <div className="space-y-2 animate-in fade-in">
                        <h3 className="font-bold text-white border-b border-white/10 pb-2 mb-4">Cash Flow Statement</h3>
                        <Row label="Operating Activities" value={data.cashFlow.operating} />
                        <Row label="Investing Activities" value={data.cashFlow.investing} />
                        <Row label="Financing Activities" value={data.cashFlow.financing} />
                        <div className="border-t border-white/10 my-2"></div>
                        <Row label="Net Change in Cash" value={data.cashFlow.operating + data.cashFlow.investing + data.cashFlow.financing} isBold color="text-blue-400" />
                    </div>
                )}
            </Card>
        </div>
    );
}

const Row = ({ label, value, isHeader, isBold, size, color }) => (
    <div className={`flex justify-between items-center py-2 ${isHeader ? 'border-b border-white/5' : ''}`}>
        <span className={`text-gray-300 ${isBold ? 'font-bold' : ''}`}>{label}</span>
        <span className={`font-mono ${isBold ? 'font-bold' : ''} ${size || 'text-sm'} ${color || 'text-white'}`}>
            {formatCurrency(value)}
        </span>
    </div>
);