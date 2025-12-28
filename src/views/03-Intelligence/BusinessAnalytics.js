import React, { useState, useEffect } from 'react';
import { getBusinessMetrics } from '../../api/analyticsService'; // You need to add this export to analyticsService
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import BarChart from '../../components/charts/BarChart';
import { Users, UserPlus, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

const MetricCard = ({ label, value, trend, isPositive, suffix = '' }) => (
    <div className="glass-card">
        <p className="text-gray-400 text-xs uppercase tracking-wider">{label}</p>
        <div className="flex items-end justify-between mt-2">
            <h3 className="text-3xl font-bold text-white">{value}{suffix}</h3>
            {trend !== undefined && (
                <div className={`flex items-center text-xs font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? <ArrowUpRight size={14} className="mr-1"/> : <ArrowDownRight size={14} className="mr-1"/>}
                    {Math.abs(trend)}%
                </div>
            )}
        </div>
    </div>
);

export default function BusinessAnalytics() {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mocking the response structure if the API isn't live yet
        // In production: getBusinessMetrics().then(setMetrics)...
        setTimeout(() => {
            setMetrics({
                totalCustomers: 1240,
                newCustomers: 85,
                churnRate: 2.4,
                avgOrderValue: 14500,
                ltv: 150000,
                acquisitionTrend: [
                    { label: 'Jan', value: 45 }, { label: 'Feb', value: 52 },
                    { label: 'Mar', value: 38 }, { label: 'Apr', value: 85 }
                ]
            });
            setLoading(false);
        }, 1000);
    }, []);

    if (loading) return <div className="p-8 text-center text-blue-400 animate-pulse">Computing Business Logic...</div>;

    return (
        <div className="space-y-6">
            <PageTitle title="Business Intelligence" subtitle="Growth, Retention & Customer Value" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                    label="Active Customers" 
                    value={metrics.totalCustomers.toLocaleString()} 
                    trend={12} 
                    isPositive={true} 
                />
                <MetricCard 
                    label="Customer Churn" 
                    value={metrics.churnRate} 
                    suffix="%" 
                    trend={-0.5} 
                    isPositive={true} // Lower churn is positive
                />
                <MetricCard 
                    label="Avg Order Value" 
                    value={`₦${metrics.avgOrderValue.toLocaleString()}`} 
                    trend={5.4} 
                    isPositive={true} 
                />
                <MetricCard 
                    label="Lifetime Value (LTV)" 
                    value={`₦${metrics.ltv.toLocaleString()}`} 
                    trend={2.1} 
                    isPositive={true} 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card">
                    <h3 className="font-bold text-white mb-6 flex items-center">
                        <UserPlus className="mr-2 text-blue-500" /> Customer Acquisition Cohort
                    </h3>
                    <BarChart data={metrics.acquisitionTrend} />
                </div>
                
                <div className="glass-card">
                    <h3 className="font-bold text-white mb-4 flex items-center">
                        <Activity className="mr-2 text-purple-500" /> Retention Health
                    </h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex justify-between text-sm text-gray-400 mb-2">
                                <span>Repeat Purchase Rate</span>
                                <span className="text-white font-bold">68%</span>
                            </div>
                            <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                                <div className="bg-purple-500 h-full" style={{ width: '68%' }}></div>
                            </div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex justify-between text-sm text-gray-400 mb-2">
                                <span>Net Promoter Score (NPS)</span>
                                <span className="text-white font-bold">72</span>
                            </div>
                            <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                                <div className="bg-green-500 h-full" style={{ width: '72%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}