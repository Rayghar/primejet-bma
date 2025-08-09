// src/views/01-Finance/FinancialStatements.js
import React, { useState, useMemo } from 'react';
import { getMonthlyReportsQuery, getAssetsQuery, getLoansQuery, getPlantsQuery } from '../../api/firestoreService';
import { useFirestoreQuery } from '../../hooks/useFirestoreQuery';
import { formatCurrency } from '../../utils/formatters';
import { logAppEvent } from '../../services/loggingService';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';

const IncomeStatementTable = ({ data, totals }) => { /* ... No changes ... */ };
const BalanceSheetDisplay = ({ data }) => { /* ... No changes ... */ };
const CashFlowStatementDisplay = ({ data }) => { /* ... No changes ... */ };

export default function FinancialStatements() {
    const [activeTab, setActiveTab] = useState('income');
    const [selectedBranch, setSelectedBranch] = useState('all');

    // Refactored to use pre-aggregated monthly data
    const { docs: monthlyReports, loading: reportsLoading } = useFirestoreQuery(getMonthlyReportsQuery());
    const { docs: assets, loading: assetsLoading } = useFirestoreQuery(getAssetsQuery());
    const { docs: loans, loading: loansLoading } = useFirestoreQuery(getLoansQuery());
    const { docs: plants, loading: plantsLoading } = useFirestoreQuery(getPlantsQuery());
    
    const loading = reportsLoading || assetsLoading || loansLoading || plantsLoading;
    
    const financialData = useMemo(() => {
        if (loading || !monthlyReports) {
            return null;
        }

        const COGS_MARGIN = 0.773;

        const incomeData = monthlyReports.map(month => {
            const cogs = month.totalRevenue * COGS_MARGIN;
            const grossProfit = month.totalRevenue - cogs;
            const netProfit = grossProfit - month.totalExpenses;
            return {
                label: `${month.year}-${month.month}`, // Simplified label
                year: month.year,
                month: month.month,
                revenue: month.totalRevenue,
                opCosts: month.totalExpenses,
                cogs,
                grossProfit,
                netProfit
            };
        }).sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);

        const incomeTotals = incomeData.reduce((acc, month) => {
            acc.revenue += month.revenue; acc.cogs += month.cogs; acc.grossProfit += month.grossProfit;
            acc.opCosts += month.opCosts; acc.netProfit += month.netProfit;
            return acc;
        }, { revenue: 0, cogs: 0, grossProfit: 0, opCosts: 0, netProfit: 0 });

        const grossFixedAssets = assets.reduce((sum, asset) => sum + asset.cost, 0);
        const totalDepreciation = grossFixedAssets * 0.10;
        const netFixedAssets = grossFixedAssets - totalDepreciation;
        const totalLoans = loans.reduce((sum, loan) => sum + loan.principal, 0);
        const shareCapital = 20000000;
        const retainedEarnings = incomeTotals.netProfit;
        const totalEquity = shareCapital + retainedEarnings;
        
        const cashFromFinancing = totalLoans + shareCapital;
        const cashForInvesting = grossFixedAssets;
        const cashFromOps = incomeTotals.netProfit + totalDepreciation;
        const netCashFlow = cashFromOps - cashForInvesting + cashFromFinancing;
        
        const balanceSheet = {
            assets: { current: { cash: netCashFlow, inventory: 8500000, total: netCashFlow + 8500000 }, fixed: { gross: grossFixedAssets, depreciation: totalDepreciation, net: netFixedAssets }, total: netCashFlow + 8500000 + netFixedAssets },
            liabilities: { loans: totalLoans, total: totalLoans },
            equity: { shareCapital, retainedEarnings, total: totalEquity },
            totalLiabilitiesAndEquity: totalLoans + totalEquity,
        };
        
        const cashFlow = { operating: cashFromOps, investing: cashForInvesting, financing: cashFromFinancing, netCashFlow: netCashFlow };
        
        return { incomeData, incomeTotals, balanceSheet, cashFlow };

    }, [monthlyReports, assets, loans, selectedBranch, assetsLoading, loansLoading]);


    if (loading) {
        return <PageTitle title="Financial Statements" subtitle="Loading financial data..." />;
    }

    return (
        <>
            <div className="flex justify-between items-center mb-4">
                <PageTitle title="Financial Statements" subtitle="Live financial health of your business." />
                <div>
                    <label className="text-sm font-medium mr-2">Branch:</label>
                    <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className="p-2 border rounded-md bg-white">
                        <option value="all">All Branches</option>
                        {plants.map(plant => <option key={plant.id} value={plant.id}>{plant.name}</option>)}
                    </select>
                </div>
            </div>
            
            {!financialData ? (
                <Card><p className="text-center p-8 text-gray-500">Could not calculate financial data. Please ensure you have sales, asset, and loan records in the system.</p></Card>
            ) : (
                <Card>
                    <div className="border-b border-gray-200"><nav className="-mb-px flex space-x-8"><button onClick={() => setActiveTab('income')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'income' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Income Statement</button><button onClick={() => setActiveTab('balance')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'balance' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Balance Sheet</button><button onClick={() => setActiveTab('cashflow')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'cashflow' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Cash Flow</button></nav></div>
                    {activeTab === 'income' && <IncomeStatementTable data={financialData.incomeData} totals={financialData.incomeTotals} />}
                    {activeTab === 'balance' && <BalanceSheetDisplay data={financialData.balanceSheet} />}
                    {activeTab === 'cashflow' && <CashFlowStatementDisplay data={financialData.cashFlow} />}
                </Card>
            )}
        </>
    );
}