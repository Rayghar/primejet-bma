import React, { useState, useEffect } from 'react';
import { getDashboardKpis, getSalesChartData } from '../../api/analyticsService';
import { getOnlineDrivers } from '../../api/operationsService';
import { formatCurrency } from '../../utils/formatters';
import PageTitle from '../../components/shared/PageTitle';
import StatCard from '../../components/shared/StatCard';
import BarChart from '../../components/charts/BarChart';
import { TrendingUp, ShoppingCart, Truck, Users, Activity } from 'lucide-react';

export default function Dashboard() {
    const [stats, setStats] = useState({ totalRevenue: 0, totalKgSold: 0, activeDeliveries: 0, onlineDrivers: 0 });
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [kpis, drivers, sales] = await Promise.all([
                    getDashboardKpis(),
                    getOnlineDrivers(),
                    getSalesChartData('monthly')
                ]);

                setStats({
                    ...kpis,
                    onlineDrivers: drivers.length
                });

                if (sales?.breakdown) {
                    setChartData(sales.breakdown.map(item => ({
                        label: item.label,
                        value: item.revenue
                    })));
                }
            } catch (error) {
                console.error("Dashboard Sync Failed", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 30000); 
        return () => clearInterval(interval);
    }, []);

    if(loading) return <div className="p-10 text-center text-blue-400">Loading Command Center...</div>;

    return (
        <div className="space-y-8">
            <PageTitle title="Executive Dashboard" subtitle="Live Operational Overview" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={TrendingUp} color="green" />
                <StatCard title="LPG Sold" value={`${stats.totalKgSold?.toLocaleString()} kg`} icon={ShoppingCart} color="blue" />
                <StatCard title="Active Runs" value={stats.activeDeliveries} icon={Truck} color="purple" />
                <StatCard title="Fleet Online" value={stats.onlineDrivers} icon={Users} color="indigo" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-card">
                    <h3 className="font-bold text-white mb-6">Revenue Trend</h3>
                    <BarChart data={chartData} />
                </div>
                
                <div className="glass-card">
                    <h3 className="font-bold text-white mb-6">System Health</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                            <span className="text-gray-300 flex items-center"><Activity size={16} className="mr-2"/> API Status</span>
                            <span className="text-green-400 font-mono">Online</span>
                        </div>
                        <div className="flex justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                            <span className="text-gray-300 flex items-center"><Truck size={16} className="mr-2"/> Dispatch Engine</span>
                            <span className="text-green-400 font-mono">Active</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}