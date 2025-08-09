// src/views/03-Sales/SalesAnalytics.js
import React, { useMemo } from 'react';
import { useFirestoreQuery } from '../../hooks/useFirestoreQuery';
import { getMonthlyReportsQuery } from '../../api/firestoreService';
import { logAppEvent } from '../../services/loggingService';

import PageTitle from '../../components/shared/PageTitle';
import StatCard from '../../components/shared/StatCard';
import BarChart from '../../components/charts/BarChart';
import { formatCurrency } from '../../utils/formatters';
import { TrendingUp, ShoppingCart } from 'lucide-react';

export default function SalesAnalytics() {
    // New query to fetch pre-aggregated monthly data
    const { docs: monthlyReports, loading } = useFirestoreQuery(getMonthlyReportsQuery());

    const analyticsData = useMemo(() => {
        if (loading) {
            return { monthlyRevenue: [], totalRevenue: 0, totalKgSold: 0 };
        }
        if (!monthlyReports || monthlyReports.length === 0) {
            logAppEvent('WARN', 'SalesAnalytics: Calculation skipped, no sales data available.', { component: 'SalesAnalytics' });
            return { monthlyRevenue: [], totalRevenue: 0, totalKgSold: 0 };
        }

        const monthlyRevenue = monthlyReports.map(report => ({
            label: `${report.year}-${report.month}`, // Or use a more descriptive label
            value: report.totalRevenue,
        })).sort((a, b) => a.label.localeCompare(b.label)); // Sort by month-year

        const totalRevenue = monthlyReports.reduce((sum, report) => sum + report.totalRevenue, 0);
        const totalKgSold = monthlyReports.reduce((sum, report) => sum + report.totalKgSold, 0);

        return { monthlyRevenue, totalRevenue, totalKgSold };
    }, [monthlyReports, loading]);

    return (
        <>
            <PageTitle title="Sales Analytics" subtitle="Visualize sales performance across all channels." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <StatCard title="Total Revenue (All Time)" value={loading ? '...' : formatCurrency(analyticsData.totalRevenue)} icon={TrendingUp} color="blue" />
                <StatCard title="Total LPG Sold (All Time)" value={loading ? '...' : `${analyticsData.totalKgSold.toLocaleString()} kg`} icon={ShoppingCart} color="green" />
            </div>
            <BarChart data={analyticsData.monthlyRevenue} title="Monthly Revenue (₦)" />
        </>
    );
}