import React, { useState, useEffect } from 'react';
import { getDashboardKpis, getSalesChartData } from '../api/analyticsService';
import { getOnlineDrivers } from '../api/operationsService';
import PageTitle from '../components/shared/PageTitle';
import BarChart from '../components/charts/BarChart';
import { TrendingUp, ShoppingCart, Truck, Users, Activity } from 'lucide-react';

// Reusable Glass Stat Card
const GlassStatCard = ({ title, value, icon: Icon, colorClass }) => (
    <div className={`glass-card relative overflow-hidden group`}>
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${colorClass}`}>
            <Icon size={64} />
        </div>
        <div className="relative z-10">
            <p className="text-blue-200 text-sm font-medium uppercase tracking-wider">{title}</p>
            <h3 className="text-3xl font-bold text-white mt-1">{value}</h3>
        </div>
    </div>
);

export default function Dashboard() {
    const [stats, setStats] = useState({ 
        totalRevenue: 0, 
        totalKgSold: 0, 
        activeDeliveries: 0,
        onlineDrivers: 0
    });
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [kpis, drivers, sales] = await Promise.all([
                getDashboardKpis(),
                getOnlineDrivers(),
                getSalesChartData()
            ]);

            setStats({
                ...kpis,
                onlineDrivers: drivers.length
            });

            if (sales && sales.breakdown) {
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

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <PageTitle title="Executive Dashboard" subtitle="Live Operational Overview" />
                <div className="flex items-center space-x-2 text-green-400 text-sm bg-green-900/20 px-3 py-1 rounded-full border border-green-500/30">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span>System Live</span>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <GlassStatCard 
                    title="Total Revenue" 
                    value={loading ? '...' : `₦${stats.totalRevenue.toLocaleString()}`} 
                    icon={TrendingUp} 
                    colorClass="text-green-500" 
                />
                <GlassStatCard 
                    title="LPG Sold" 
                    value={loading ? '...' : `${stats.totalKgSold.toLocaleString()} kg`} 
                    icon={ShoppingCart} 
                    colorClass="text-blue-500" 
                />
                <GlassStatCard 
                    title="Active Runs" 
                    value={loading ? '...' : stats.activeDeliveries} 
                    icon={Truck} 
                    colorClass="text-purple-500" 
                />
                <GlassStatCard 
                    title="Fleet Online" 
                    value={loading ? '...' : stats.onlineDrivers} 
                    icon={Users} 
                    colorClass="text-yellow-500" 
                />
            </div>

            {/* Charts & Health */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-card min-h-[400px]">
                    <h3 className="text-xl font-bold text-white mb-6">Revenue Trend</h3>
                    <BarChart data={chartData} />
                </div>
                
                <div className="glass-card">
                    <h3 className="text-xl font-bold text-white mb-6">System Health</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center text-blue-200">
                                <Activity size={18} className="mr-3" /> API Latency
                            </div>
                            <span className="text-green-400 font-mono">45ms</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center text-blue-200">
                                <Users size={18} className="mr-3" /> Active Sessions
                            </div>
                            <span className="text-white font-mono">12</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center text-blue-200">
                                <Truck size={18} className="mr-3" /> GPS Updates
                            </div>
                            <span className="text-green-400 font-mono">Real-time</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}