// src/views/01-Finance/FinancialStatements.js
import React, { useState, useMemo, useEffect } from 'react';
import { getUnifiedFinancialData, getAssetsQuery, getLoansQuery, getPlantsQuery } from '../../api/firestoreService';
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
    const [unifiedData, setUnifiedData] = useState([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [selectedBranch, setSelectedBranch] = useState('all');

    const { docs: assets, loading: assetsLoading } = useFirestoreQuery(getAssetsQuery());
    const { docs: loans, loading: loansLoading } = useFirestoreQuery(getLoansQuery());
    const { docs: plants, loading: plantsLoading } = useFirestoreQuery(getPlantsQuery());

    useEffect(() => {
        const fetchData = async () => {
            logAppEvent('DEBUG', 'FinancialStatements: Starting data fetch.', { component: 'FinancialStatements' });
            setDataLoading(true);
            try {
                const data = await getUnifiedFinancialData();
                setUnifiedData(data);
                logAppEvent('DEBUG', `FinancialStatements: Data fetch complete. Found ${data.length} unified records.`, { recordCount: data.length });
            } catch (error) {
                logAppEvent('ERROR', 'FinancialStatements: Failed to fetch unified data.', { error: error.message, stack: error.stack });
            } finally {
                setDataLoading(false);
            }
        };
        fetchData();
    }, []);

    const financialData = useMemo(() => {
        const filteredData = selectedBranch === 'all' ? unifiedData : unifiedData.filter(entry => entry.branchId === selectedBranch);
        logAppEvent('DEBUG', `FinancialStatements: Filtered data for branch '${selectedBranch}'. ${filteredData.length} records remain.`, { selectedBranch, recordCount: filteredData.length });
            
        if (filteredData.length === 0 || assetsLoading || loansLoading) {
            if (!assetsLoading && !loansLoading) {
                 logAppEvent('WARN', 'FinancialStatements: Financial calculation skipped due to zero records or loading assets/loans.', { component: 'FinancialStatements' });
            }
            return null;
        }
        
        logAppEvent('DEBUG', 'FinancialStatements: Starting financial calculations.', { component: 'FinancialStatements' });
        const monthlyTotals = {};
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const COGS_MARGIN = 0.773;

        filteredData.forEach(entry => {
            if (!entry.date || typeof entry.date.toDate !== 'function') return;
            const date = entry.date.toDate();
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            if (!monthlyTotals[monthKey]) {
                monthlyTotals[monthKey] = { label: `${monthNames[date.getMonth()]} '${String(date.getFullYear()).slice(2)}`, year: date.getFullYear(), month: date.getMonth(), revenue: 0, opCosts: 0 };
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
        
        logAppEvent('DEBUG', 'FinancialStatements: Financial data successfully calculated.', { result: 'OK' });
        return { incomeData, incomeTotals, balanceSheet, cashFlow };

    }, [unifiedData, assets, loans, selectedBranch, assetsLoading, loansLoading]);

    const loading = dataLoading || assetsLoading || loansLoading || plantsLoading;

    if (loading) {
        return <PageTitle title="Financial Statements" subtitle="Loading and unifying financial data..." />;
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
