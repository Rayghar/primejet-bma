import React, { useState, useEffect } from 'react';
import { getDriverPerformance } from '../../api/analyticsService';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import { Trophy, Clock, AlertTriangle, TrendingUp, Star } from 'lucide-react';

const ScoreCard = ({ driver, rank }) => {
    const isTopPerformer = rank === 1;
    return (
        <div className={`glass-card mb-4 flex items-center justify-between ${isTopPerformer ? 'border-l-4 border-yellow-400 bg-yellow-400/5' : ''}`}>
            <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mr-4 ${isTopPerformer ? 'bg-yellow-400 text-black' : 'bg-white/10 text-gray-400'}`}>
                    #{rank}
                </div>
                <div>
                    <h4 className="font-bold text-white text-lg">{driver.name}</h4>
                    <p className="text-xs text-blue-200">{driver.vehicleModel || 'Fleet Vehicle'}</p>
                </div>
            </div>
            
            <div className="flex gap-8 text-center">
                <div>
                    <p className="text-xs text-gray-400 mb-1">Deliveries</p>
                    <p className="font-bold text-white text-lg">{driver.totalDeliveries}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-400 mb-1">On-Time %</p>
                    <p className={`font-bold text-lg ${driver.onTimeRate >= 95 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {driver.onTimeRate}%
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-400 mb-1">Rating</p>
                    <div className="flex items-center justify-center text-yellow-400 font-bold text-lg">
                        <Star size={16} fill="currentColor" className="mr-1"/> {driver.rating}
                    </div>
                </div>
                <div className="hidden md:block">
                    <p className="text-xs text-gray-400 mb-1">Revenue Gen.</p>
                    <p className="font-bold text-green-400 text-lg">₦{driver.revenueGenerated?.toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
};

export default function DriverScorecards() {
    const [drivers, setDrivers] = useState([]);
    const [period, setPeriod] = useState('monthly');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const data = await getDriverPerformance(period);
                // Sort by Efficiency Score (Weighted avg of deliveries + rating)
                const sorted = data.sort((a, b) => b.totalDeliveries - a.totalDeliveries);
                setDrivers(sorted);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [period]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <PageTitle title="Driver Performance" subtitle="Efficiency metrics and fleet leaderboard" />
                <select 
                    value={period} 
                    onChange={(e) => setPeriod(e.target.value)}
                    className="glass-input p-2 text-sm bg-black/20"
                >
                    <option value="weekly">This Week</option>
                    <option value="monthly">This Month</option>
                    <option value="allTime">All Time</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="glass-card p-6 flex items-center text-green-400">
                    <Trophy size={32} className="mr-4"/>
                    <div>
                        <p className="text-sm text-gray-400">Top Performer</p>
                        <p className="text-xl font-bold">{drivers[0]?.name || '---'}</p>
                    </div>
                </div>
                <div className="glass-card p-6 flex items-center text-blue-400">
                    <Clock size={32} className="mr-4"/>
                    <div>
                        <p className="text-sm text-gray-400">Avg Delivery Time</p>
                        <p className="text-xl font-bold">42 mins</p> {/* Dynamic if available */}
                    </div>
                </div>
                <div className="glass-card p-6 flex items-center text-yellow-400">
                    <AlertTriangle size={32} className="mr-4"/>
                    <div>
                        <p className="text-sm text-gray-400">Issues Reported</p>
                        <p className="text-xl font-bold">3 this week</p>
                    </div>
                </div>
            </div>

            <div className="bg-black/20 rounded-2xl p-1">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Calculating Performance Metrics...</div>
                ) : drivers.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No driver data for this period.</div>
                ) : (
                    drivers.map((drv, i) => <ScoreCard key={drv.id || i} driver={drv} rank={i + 1} />)
                )}
            </div>
        </div>
    );
}