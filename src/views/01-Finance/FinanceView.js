import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../../app';
import { Printer, FileText } from 'lucide-react';

const formatNaira = (value) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value);

const FinanceView = () => {
    const { state } = useContext(AppContext);
    const [viewMode, setViewMode] = useState('Summary');

    const financialData = useMemo(() => {
        const approvedSales = state.dataEntries.filter(e => e.type === 'Sales' && e.status === 'Approved');
        const approvedExpenses = state.dataEntries.filter(e => e.type === 'Expense' && e.status === 'Approved');

        const totalRevenue = approvedSales.reduce((sum, sale) => sum + sale.amount, 0);
        const totalOpex = approvedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        
        const totalKgSold = approvedSales.reduce((sum, sale) => {
            const kgMatch = sale.details.match(/(\d+(\.\d+)?)\s*kg/i);
            return sum + (kgMatch ? parseFloat(kgMatch[1]) : 0);
        }, 0);

        const cogs = totalKgSold * state.financials.depotPricePerKg;
        const grossProfit = totalRevenue - cogs;
        const netProfit = grossProfit - totalOpex; // Simplified: Before Interest & Tax

        return { totalRevenue, cogs, grossProfit, totalOpex, netProfit, approvedSales, approvedExpenses };
    }, [state.dataEntries, state.financials]);

    const handlePrint = () => { window.print(); };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center print:hidden">
                <h2 className="text-xl font-bold text-slate-900">Financial Statements</h2>
                <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => setViewMode('Summary')} className={`px-3 py-1 text-sm font-medium rounded-md ${viewMode === 'Summary' ? 'bg-white shadow-sm text-sky-600' : 'text-slate-600'}`}>Summary</button>
                    <button onClick={() => setViewMode('Detailed')} className={`px-3 py-1 text-sm font-medium rounded-md ${viewMode === 'Detailed' ? 'bg-white shadow-sm text-sky-600' : 'text-slate-600'}`}>Detailed</button>
                </div>
            </div>

            <div className="printable-area">
                <div className="hidden print:block mb-8 text-center">
                    <h1 className="text-2xl font-bold">PrimeJet Gas LLC</h1>
                    <p className="text-slate-600">Income Statement (Live Data)</p>
                    <p className="text-sm text-slate-400">Generated on: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm">
                    <div className="p-4 border-b flex justify-between items-center print:hidden">
                        <h3 className="font-semibold">Live Income Statement</h3>
                        <button onClick={handlePrint} className="flex items-center text-xs text-slate-500 hover:text-sky-600 font-medium"><Printer className="h-4 w-4 mr-1"/> Print for Official Use</button>
                    </div>
                    <div className="p-4 space-y-1 text-sm">
                        <div className="grid grid-cols-2 gap-4 py-1 font-medium"><p>Total Revenue</p><p className="text-right">{formatNaira(financialData.totalRevenue)}</p></div>
                        {viewMode === 'Detailed' && financialData.approvedSales.map(s => <div key={s.id} className="grid grid-cols-2 gap-4 py-1 pl-4 text-slate-600"><p>{s.details} ({s.plantId})</p><p className="text-right">{formatNaira(s.amount)}</p></div>)}
                        
                        <div className="grid grid-cols-2 gap-4 py-1 font-medium"><p>Cost of Goods Sold (COGS)</p><p className="text-right text-red-600">({formatNaira(financialData.cogs)})</p></div>
                        
                        <div className="grid grid-cols-2 gap-4 py-1 font-bold bg-slate-50 p-2 rounded-md"><p>Gross Profit</p><p className="text-right">{formatNaira(financialData.grossProfit)}</p></div>

                        <div className="grid grid-cols-2 gap-4 py-1 font-medium"><p>Operating Expenses</p><p className="text-right text-red-600">({formatNaira(financialData.totalOpex)})</p></div>
                        {viewMode === 'Detailed' && financialData.approvedExpenses.map(e => <div key={e.id} className="grid grid-cols-2 gap-4 py-1 pl-4 text-slate-600"><p>{e.details} ({e.plantId})</p><p className="text-right">{formatNaira(e.amount)}</p></div>)}

                        <div className="grid grid-cols-2 gap-4 py-2 font-bold bg-emerald-50 text-emerald-800 p-2 rounded-md text-base"><p>Net Profit (Before Interest & Tax)</p><p className="text-right">{formatNaira(financialData.netProfit)}</p></div>
                    </div>
                </div>
            </div>
             <div className="bg-white p-6 rounded-xl shadow-sm mt-6">
                <h3 className="text-lg font-semibold text-slate-900">Asset & Loan Management</h3>
                 <div className="mt-4 h-24 bg-slate-100 rounded-lg flex items-center justify-center">
                    <p className="text-slate-500">Full Asset Ledger & Loan Amortization (Integration Required)</p>
                </div>
            </div>
        </div>
    );
};

export default FinanceView;
