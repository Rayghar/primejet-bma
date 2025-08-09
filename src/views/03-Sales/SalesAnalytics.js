// src/views/03-Sales/SalesAnalytics.js
import React, { useMemo, useState, useEffect } from 'react';
import { getUnifiedFinancialData } from '../../api/firestoreService';
import { logAppEvent } from '../../services/loggingService';

import PageTitle from '../../components/shared/PageTitle';
import StatCard from '../../components/shared/StatCard';
import BarChart from '../../components/charts/BarChart';
import { formatCurrency } from '../../utils/formatters';
import { TrendingUp, ShoppingCart } from 'lucide-react';

export default function SalesAnalytics() {
    const [unifiedData, setUnifiedData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            logAppEvent('DEBUG', 'SalesAnalytics: Starting data fetch.', { component: 'SalesAnalytics' });
            setLoading(true);
            try {
                const data = await getUnifiedFinancialData();
                setUnifiedData(data.filter(d => d.type === 'sale'));
                logAppEvent('DEBUG', `SalesAnalytics: Data fetch complete. Found ${data.length} total records, ${data.filter(d => d.type === 'sale').length} are sales.`, { recordCount: data.length });
            } catch (error) {
                logAppEvent('ERROR', 'SalesAnalytics: Failed to fetch data.', { error: error.message });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const analyticsData = useMemo(() => {
        logAppEvent('DEBUG', 'SalesAnalytics: Recalculating analytics data.', { recordCount: unifiedData.length });
        if (unifiedData.length === 0) {
            logAppEvent('WARN', 'SalesAnalytics: Calculation skipped, no sales data available.', { component: 'SalesAnalytics' });
            return { monthlyRevenue: [], totalRevenue: 0, totalKgSold: 0 };
        }

        const monthlyTotals = {};
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        unifiedData.forEach(log => {
            const date = log.date.toDate();
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            if (!monthlyTotals[monthKey]) {
                monthlyTotals[monthKey] = { label: `${monthNames[date.getMonth()]} '${String(date.getFullYear()).slice(2)}`, value: 0, year: date.getFullYear(), month: date.getMonth() };
            }
            monthlyTotals[monthKey].value += log.revenue;
        });

        const monthlyRevenue = Object.values(monthlyTotals).sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
        const totalRevenue = unifiedData.reduce((sum, log) => sum + log.revenue, 0);
        const totalKgSold = unifiedData.reduce((sum, log) => sum + log.kgSold, 0);

        return { monthlyRevenue, totalRevenue, totalKgSold };
    }, [unifiedData]);

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
