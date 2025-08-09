// src/views/01-Finance/RevenueAssurance.js
import React, { useState, useMemo, useEffect } from 'react';
import { useFirestoreQuery } from '../../hooks/useFirestoreQuery';
// The new unified query for all approved entries is used here
import { getStockInsQuery, getApprovedEntriesQuery } from '../../api/firestoreService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { logAppEvent } from '../../services/loggingService';

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';

export default function RevenueAssurance() {
    // Refactored to use useFirestoreQuery for all data sources
    const { docs: batches, loading: batchesLoading, error: batchesError } = useFirestoreQuery(getStockInsQuery());
    const { docs: allTransactions, loading: transactionsLoading, error: transactionsError } = useFirestoreQuery(getApprovedEntriesQuery());

    useEffect(() => {
        if (batchesError) logAppEvent('ERROR', 'RevenueAssurance: Failed to fetch stock batches.', { error: batchesError });
        if (transactionsError) logAppEvent('ERROR', 'RevenueAssurance: Failed to fetch transactions.', { error: transactionsError });
    }, [batchesError, transactionsError]);

    const salesData = useMemo(() => {
        // Filter for sales records from the unified data source
        return allTransactions.filter(entry => entry.type === 'sale');
    }, [allTransactions]);
    
    const getBatchPerformance = (batch) => {
        const expectedRevenue = (batch.quantityKg || 0) * (batch.targetSalePricePerKg || 0);
        
        // Find all sales linked to this batch, assuming the batchId is present
        const actualSales = salesData.filter(sale => sale.batchId === batch.id);
        const actualRevenue = actualSales.reduce((sum, sale) => sum + (sale.revenue || 0), 0);
        
        const deviation = expectedRevenue > 0 ? ((actualRevenue - expectedRevenue) / expectedRevenue) * 100 : 0;
        const progress = (batch.quantityKg - (batch.remainingKg || 0)) / (batch.quantityKg || 1) * 100;

        return { expectedRevenue, actualRevenue, deviation, progress };
    };

    const loading = batchesLoading || transactionsLoading;

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
                            ) : batches.length === 0 ? (
                                <tr><td colSpan="6" className="text-center p-8 text-gray-500">No stock purchase batches found.</td></tr>
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