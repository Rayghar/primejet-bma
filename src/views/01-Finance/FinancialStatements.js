// src/views/01-Finance/FinancialStatements.js (UPDATED)

import React, { useState, useMemo } from 'react';
import { useFirestoreQuery } from '../../hooks/useFirestoreQuery';
import { getApprovedEntriesQuery, getAssetsQuery } from '../../api/firestoreService';
import { formatCurrency, formatDate } from '../../utils/formatters';

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import { DollarSign, TrendingUp, TrendingDown, Landmark, Banknote, FileText, BarChart } from 'lucide-react';

// --- Sub-component for Income Statement Table ---
const IncomeStatementTable = ({ data, totals }) => {
    const headers = ["Month", "Revenue", "COGS", "Gross Profit", "Op. Costs", "Net Profit"];
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b bg-gray-50">
                        {headers.map(header => <th key={header} className="p-4 text-sm font-semibold text-gray-600">{header}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {data.map(row => (
                        <tr key={row.label} className="border-b hover:bg-gray-50">
                            <td className="p-4 font-medium">{row.label}</td>
                            <td className="p-4">{formatCurrency(row.revenue)}</td>
                            <td className="p-4">{formatCurrency(row.cogs)}</td>
                            <td className="p-4 font-bold">{formatCurrency(row.grossProfit)}</td>
                            <td className="p-4 text-red-600">{formatCurrency(row.opCosts)}</td>
                            <td className={`p-4 font-bold ${row.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(row.netProfit)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="border-t-2 font-bold bg-gray-100">
                        <td className="p-4">Total</td>
                        <td className="p-4">{formatCurrency(totals.revenue)}</td>
                        <td className="p-4">{formatCurrency(totals.cogs)}</td>
                        <td className="p-4">{formatCurrency(totals.grossProfit)}</td>
                        <td className="p-4 text-red-600">{formatCurrency(totals.opCosts)}</td>
                        <td className={`p-4 ${totals.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(totals.netProfit)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};

// --- Sub-component for Balance Sheet ---
const BalanceSheetDisplay = ({ data }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4">
            {/* Assets Side */}
            <div>
                <h4 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Assets</h4>
                <div className="space-y-4">
                    <div>
                        <h5 className="font-bold">Current Assets</h5>
                        <div className="flex justify-between text-sm pl-4"><span>Cash</span> <span>{formatCurrency(data.assets.current.cash)}</span></div>
                        <div className="flex justify-between text-sm pl-4 border-b pb-2"><span>Inventory</span> <span>{formatCurrency(data.assets.current.inventory)}</span></div>
                        <div className="flex justify-between font-bold text-sm pl-4 pt-1"><span>Total Current Assets</span> <span>{formatCurrency(data.assets.current.total)}</span></div>
                    </div>
                    <div>
                        <h5 className="font-bold">Fixed Assets</h5>
                        <div className="flex justify-between text-sm pl-4"><span>Plants & Vans</span> <span>{formatCurrency(data.assets.fixed.gross)}</span></div>
                        <div className="flex justify-between text-sm pl-4 border-b pb-2"><span>Less: Depreciation</span> <span className="text-red-600">({formatCurrency(data.assets.fixed.depreciation)})</span></div>
                        <div className="flex justify-between font-bold text-sm pl-4 pt-1"><span>Total Fixed Assets</span> <span>{formatCurrency(data.assets.fixed.net)}</span></div>
                    </div>
                </div>
                <div className="flex justify-between font-extrabold text-lg pt-4 mt-4 border-t-2">
                    <span>Total Assets</span>
                    <span>{formatCurrency(data.assets.total)}</span>
                </div>
            </div>

            {/* Liabilities & Equity Side */}
            <div>
                <h4 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Liabilities & Equity</h4>
                <div className="space-y-4">
                    <div>
                        <h5 className="font-bold">Liabilities</h5>
                        <div className="flex justify-between text-sm pl-4"><span>Loan Principal</span> <span>{formatCurrency(data.liabilities.loans)}</span></div>
                        <div className="flex justify-between font-bold text-sm pl-4 pt-1 border-b pb-2"><span>Total Liabilities</span> <span>{formatCurrency(data.liabilities.total)}</span></div>
                    </div>
                    <div>
                        <h5 className="font-bold">Equity</h5>
                        <div className="flex justify-between text-sm pl-4"><span>Share Capital</span> <span>{formatCurrency(data.equity.shareCapital)}</span></div>
                        <div className="flex justify-between text-sm pl-4 border-b pb-2"><span>Retained Earnings</span> <span>{formatCurrency(data.equity.retainedEarnings)}</span></div>
                        <div className="flex justify-between font-bold text-sm pl-4 pt-1"><span>Total Equity</span> <span>{formatCurrency(data.equity.total)}</span></div>
                    </div>
                </div>
                <div className="flex justify-between font-extrabold text-lg pt-4 mt-4 border-t-2">
                    <span>Total Liabilities & Equity</span>
                    <span>{formatCurrency(data.totalLiabilitiesAndEquity)}</span>
                </div>
            </div>
        </div>
    );
};

// --- Sub-component for Cash Flow Statement ---
const CashFlowStatementDisplay = ({ data }) => {
    // This is a simplified view. A real one would be more complex.
    return (
        <div className="p-4 space-y-4">
            <div className="flex justify-between p-3 rounded-lg bg-green-50"><span>Cash from Operations:</span> <span className="font-bold text-green-600">{formatCurrency(data.operating)}</span></div>
            <div className="flex justify-between p-3 rounded-lg bg-red-50"><span>Cash for Investing:</span> <span className="font-bold text-red-600">({formatCurrency(data.investing)})</span></div>
            <div className="flex justify-between p-3 rounded-lg bg-blue-50"><span>Cash from Financing:</span> <span className="font-bold text-blue-600">{formatCurrency(data.financing)}</span></div>
            <div className="flex justify-between p-3 rounded-lg bg-gray-100 border-t-2 mt-4">
                <span className="font-bold text-lg">Net Cash Flow:</span>
                <span className="font-bold text-lg">{formatCurrency(data.netCashFlow)}</span>
            </div>
        </div>
    );
};


// --- Main View Component ---
export default function FinancialStatements() {
    const [activeTab, setActiveTab] = useState('income');

    const { docs: approvedEntries, loading: entriesLoading } = useFirestoreQuery(getApprovedEntriesQuery());
    const { docs: assets, loading: assetsLoading } = useFirestoreQuery(getAssetsQuery());

    // --- Financial Calculations ---
    const financialData = useMemo(() => {
        if (!approvedEntries || !assets) return null;

        // --- Income Statement Data ---
        const monthlyTotals = {};
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const COGS_MARGIN = 0.773;

        approvedEntries.forEach(entry => {
            const date = entry.date.toDate();
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            if (!monthlyTotals[monthKey]) {
                monthlyTotals[monthKey] = {
                    label: `${monthNames[date.getMonth()]} '${String(date.getFullYear()).slice(2)}`,
                    year: date.getFullYear(), month: date.getMonth(), revenue: 0, opCosts: 0,
                };
            }
            if (entry.type === 'sale') monthlyTotals[monthKey].revenue += entry.revenue;
            else if (entry.type === 'expense') monthlyTotals[monthKey].opCosts += entry.amount;
        });

        const incomeData = Object.values(monthlyTotals).map(month => {
            const cogs = month.revenue * COGS_MARGIN;
            const grossProfit = month.revenue - cogs;
            const netProfit = grossProfit - month.opCosts;
            return { ...month, cogs, grossProfit, netProfit };
        }).sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);

        const incomeTotals = incomeData.reduce((acc, month) => {
            acc.revenue += month.revenue; acc.cogs += month.cogs; acc.grossProfit += month.grossProfit;
            acc.opCosts += month.opCosts; acc.netProfit += month.netProfit;
            return acc;
        }, { revenue: 0, cogs: 0, grossProfit: 0, opCosts: 0, netProfit: 0 });

        // --- Balance Sheet Data ---
        const grossFixedAssets = assets.reduce((sum, asset) => sum + asset.cost, 0);
        const totalDepreciation = grossFixedAssets * 0.10; // Simplified 10% annual
        const netFixedAssets = grossFixedAssets - totalDepreciation;
        const totalLoans = 78000000 + 60000000;
        const shareCapital = 20000000;
        const retainedEarnings = incomeTotals.netProfit; // Simplified: assumes all profit is retained
        const totalEquity = shareCapital + retainedEarnings;
        
        // --- Cash Flow Data (Simplified) ---
        const cashFromFinancing = totalLoans + shareCapital;
        const cashForInvesting = grossFixedAssets;
        const cashFromOps = incomeTotals.netProfit + totalDepreciation; // Add back non-cash depreciation
        const netCashFlow = cashFromOps - cashForInvesting + cashFromFinancing;
        
        const balanceSheet = {
            assets: {
                current: { cash: netCashFlow, inventory: 8500000, total: netCashFlow + 8500000 }, // Using static inventory value from plan
                fixed: { gross: grossFixedAssets, depreciation: totalDepreciation, net: netFixedAssets },
                total: netCashFlow + 8500000 + netFixedAssets,
            },
            liabilities: { loans: totalLoans, total: totalLoans },
            equity: { shareCapital, retainedEarnings, total: totalEquity },
            totalLiabilitiesAndEquity: totalLoans + totalEquity,
        };
        
        const cashFlow = {
            operating: cashFromOps,
            investing: cashForInvesting,
            financing: cashFromFinancing,
            netCashFlow: netCashFlow
        };

        return { incomeData, incomeTotals, balanceSheet, cashFlow };

    }, [approvedEntries, assets]);

    const loading = entriesLoading || assetsLoading;
    if (loading) return <PageTitle title="Financial Statements" subtitle="Loading financial data..." />;
    if (!financialData) return <p>Could not calculate financial data.</p>

    return (
        <>
            <PageTitle title="Financial Statements" subtitle="Live financial health of your business." />

            <Card>
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button onClick={() => setActiveTab('income')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'income' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Income Statement</button>
                        <button onClick={() => setActiveTab('balance')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'balance' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Balance Sheet</button>
                        <button onClick={() => setActiveTab('cashflow')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'cashflow' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Cash Flow</button>
                    </nav>
                </div>

                {activeTab === 'income' && <IncomeStatementTable data={financialData.incomeData} totals={financialData.incomeTotals} />}
                {activeTab === 'balance' && <BalanceSheetDisplay data={financialData.balanceSheet} />}
                {activeTab === 'cashflow' && <CashFlowStatementDisplay data={financialData.cashFlow} />}
            </Card>
        </>
    );
}
