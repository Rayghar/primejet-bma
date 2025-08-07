// src/views/03-Sales/SalesAnalytics.js
import React, { useMemo } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { db, appId } from '../../api/firebase';
import { useFirestoreQuery } from '../../hooks/useFirestoreQuery';

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import BarChart from '../../components/charts/BarChart';
import { formatCurrency } from '../../utils/formatters';

export default function SalesAnalytics() {
    // 1. Create a query for approved sales logs
    const salesQuery = query(
        collection(db, `artifacts/${appId}/sales_logs`),
        where("status", "==", "approved")
    );

    // 2. Use the hook to get live data
    const { docs: salesLogs, loading } = useFirestoreQuery(salesQuery);

    // 3. Process the data for the chart using useMemo for efficiency
    const monthlyRevenueData = useMemo(() => {
        if (!salesLogs || salesLogs.length === 0) return [];

        const monthlyTotals = {};
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        salesLogs.forEach(log => {
            const date = log.date.toDate();
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            
            if (!monthlyTotals[monthKey]) {
                monthlyTotals[monthKey] = {
                    label: `${monthNames[date.getMonth()]} '${String(date.getFullYear()).slice(2)}`,
                    value: 0,
                    year: date.getFullYear(),
                    month: date.getMonth(),
                };
            }
            monthlyTotals[monthKey].value += log.revenue;
        });

        // Sort by year then month and return
        return Object.values(monthlyTotals).sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
        });
    }, [salesLogs]); // Recalculate only when salesLogs change

    const totalRevenue = useMemo(() => 
        salesLogs.reduce((sum, log) => sum + log.revenue, 0),
        [salesLogs]
    );

    const totalKgSold = useMemo(() => 
        salesLogs.reduce((sum, log) => sum + log.kgSold, 0),
        [salesLogs]
    );

    return (
        <>
            <PageTitle title="Sales Analytics" subtitle="Visualize sales performance across all channels." />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                    <h3 className="text-gray-500 text-sm font-medium">Total Revenue (All Time)</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{loading ? '...' : formatCurrency(totalRevenue)}</p>
                </Card>
                <Card>
                    <h3 className="text-gray-500 text-sm font-medium">Total LPG Sold (All Time)</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{loading ? '...' : `${totalKgSold.toLocaleString()} kg`}</p>
                </Card>
            </div>

            {loading ? (
                <p>Loading chart data...</p>
            ) : (
                <BarChart data={monthlyRevenueData} title="Monthly Revenue (₦)" />
            )}
        </>
    );
}
