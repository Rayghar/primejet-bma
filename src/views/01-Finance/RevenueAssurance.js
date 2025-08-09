// src/views/01-Finance/RevenueAssurance.js
import React, { useState, useEffect } from 'react';
import { useFirestoreQuery } from '../../hooks/useFirestoreQuery';
import { getStockInsQuery } from '../../api/firestoreService';
import { getUnifiedFinancialData } from '../../api/firestoreService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { logAppEvent } from '../../services/loggingService';

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';

export default function RevenueAssurance() {
    const { docs: batches, loading: batchesLoading, error } = useFirestoreQuery(getStockInsQuery());
    const [unifiedData, setUnifiedData] = useState([]);
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        if (error) logAppEvent('ERROR', 'RevenueAssurance: Failed to fetch stock batches.', { error });
        
        const fetchData = async () => {
            setDataLoading(true);
            try {
                const data = await getUnifiedFinancialData();
                setUnifiedData(data.filter(d => d.type === 'sale'));
                logAppEvent('DEBUG', `RevenueAssurance: Data fetch complete. Found ${data.length} sales records.`, { recordCount: data.length });
            } catch (err) {
                logAppEvent('ERROR', 'RevenueAssurance: Failed to fetch unified sales data.', { error: err.message });
            } finally {
                setDataLoading(false);
            }
        };
        fetchData();
    }, [error]);

    const getBatchPerformance = (batch) => {
        const expectedRevenue = batch.quantityKg * batch.targetSalePricePerKg;
        
        // Find all sales linked to this batch
        const actualSales = unifiedData.filter(sale => sale.batchId === batch.id);
        const actualRevenue = actualSales.reduce((sum, sale) => sum + sale.revenue, 0);
        
        const deviation = expectedRevenue > 0 ? ((actualRevenue - expectedRevenue) / expectedRevenue) * 100 : 0;
        const progress = (batch.quantityKg - batch.remainingKg) / batch.quantityKg * 100;

        return { expectedRevenue, actualRevenue, deviation, progress };
    };

    const loading = batchesLoading || dataLoading;

    return (
        <>
            <PageTitle title="Revenue Assurance" subtitle="Track the profitability of each stock purchase batch." />
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b bg-gray-50">
                                <th className="p-4 text-sm font-semibold">Purchase Date</th>
                                <th className="p-4 text-sm font-semibold">Quantity (kg)</th>
                                <th className="p-4 text-sm font-semibold text-right">Expected Revenue</th>
                                <th className="p-4 text-sm font-semibold text-right">Actual Revenue</th>
                                <th className="p-4 text-sm font-semibold text-center">Deviation</th>
                                <th className="p-4 text-sm font-semibold">Progress</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="text-center p-8">Loading batch data...</td></tr>
                            ) : batches.map(batch => {
                                const performance = getBatchPerformance(batch);
                                return (
                                    <tr key={batch.id} className="border-b hover:bg-gray-50">
                                        <td className="p-4">{formatDate(batch.purchaseDate)}</td>
                                        <td className="p-4 font-medium">{batch.quantityKg.toLocaleString()} kg</td>
                                        <td className="p-4 text-right">{formatCurrency(performance.expectedRevenue)}</td>
                                        <td className="p-4 text-right font-bold">{formatCurrency(performance.actualRevenue)}</td>
                                        <td className={`p-4 text-center font-bold ${performance.deviation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {performance.deviation.toFixed(1)}%
                                        </td>
                                        <td className="p-4">
                                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${performance.progress}%` }}></div>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </>
    );
}