// src/views/01-Finance/FinancialStatements.js (Refactored)

import React, { useState, useEffect } from 'react';
import { getFinancialStatements } from '../../api/inventoryService'; // Import the service function
import { getPlants } from '../../api/operationsService'; // Import to get plant list for dropdown
import { formatCurrency, formatDate } from '../../utils/formatters';

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';

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
    const [financialData, setFinancialData] = useState(null);
    const [dataLoading, setDataLoading] = useState(true);
    const [selectedBranch, setSelectedBranch] = useState('all');
    const [plants, setPlants] = useState([]);
    const [plantsLoading, setPlantsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setDataLoading(true);
            try {
                const data = await getFinancialStatements(selectedBranch);
                setFinancialData(data);
            } catch (error) {
                console.error('Failed to fetch financial data:', error);
            } finally {
                setDataLoading(false);
            }
        };
        fetchData();
    }, [selectedBranch]);

    useEffect(() => {
        const fetchPlants = async () => {
            setPlantsLoading(true);
            try {
                const plantList = await getPlants();
                setPlants(plantList);
            } catch (error) {
                console.error('Failed to fetch plants for dropdown:', error);
            } finally {
                setPlantsLoading(false);
            }
        };
        fetchPlants();
    }, []);

    if (dataLoading || plantsLoading) {
        return <PageTitle title="Financial Statements" subtitle="Loading and unifying financial data..." />;
    }

    if (!financialData) {
        return (
            <Card>
                <p className="text-center p-8 text-gray-500">
                    Could not calculate financial data. Please ensure you have sales, asset, and loan records in the system.
                </p>
            </Card>
        );
    }

    return (
        <>
            <div className="flex justify-between items-center mb-4">
                <PageTitle title="Financial Statements" subtitle="Live financial health of your business." />
                <div>
                    <label className="text-sm font-medium mr-2">Branch:</label>
                    <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="p-2 border rounded-md bg-white"
                    >
                        <option value="all">All Branches</option>
                        {plants.map(plant => (
                            <option key={plant.id} value={plant.id}>{plant.name}</option>
                        ))}
                    </select>
                </div>
            </div>
            <Card>
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('income')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'income' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Income Statement
                        </button>
                        <button
                            onClick={() => setActiveTab('balance')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'balance' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Balance Sheet
                        </button>
                        <button
                            onClick={() => setActiveTab('cashflow')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'cashflow' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Cash Flow
                        </button>
                    </nav>
                </div>

                {activeTab === 'income' && <IncomeStatementTable data={financialData.incomeData} totals={financialData.incomeTotals} />}
                {activeTab === 'balance' && <BalanceSheetDisplay data={financialData.balanceSheet} />}
                {activeTab === 'cashflow' && <CashFlowStatementDisplay data={financialData.cashFlow} />}
            </Card>
        </>
    );
}