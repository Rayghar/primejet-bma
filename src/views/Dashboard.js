// src/views/Dashboard.js
import React, { useMemo } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { db, appId } from '../api/firebase';
import { useFirestoreQuery } from '../hooks/useFirestoreQuery';
// Correctly import new query functions
import { getMonthlyReportsQuery, getBulkStockQuery, getPlantsQuery } from '../api/firestoreService';
import { formatCurrency } from '../utils/formatters';

import PageTitle from '../components/shared/PageTitle';
import StatCard from '../components/shared/StatCard';
import Card from '../components/shared/Card';
// Only import used icons
import { TrendingUp, ShoppingCart, Truck, Factory } from 'lucide-react';

export default function Dashboard() {
    const { docs: monthlyReports, loading: reportsLoading } = useFirestoreQuery(getMonthlyReportsQuery());
    const { docs: bulkStock, loading: stockLoading } = useFirestoreQuery(getBulkStockQuery());
    const { docs: activeDeliveries, loading: deliveryLoading } = useFirestoreQuery(query(collection(db, `artifacts/${appId}/vans`), where("status", "==", "On Delivery")));
    const { docs: plants, loading: plantsLoading } = useFirestoreQuery(getPlantsQuery());
    
    const totalRevenue = useMemo(() => {
        return monthlyReports.reduce((sum, report) => sum + report.totalRevenue, 0);
    }, [monthlyReports]);

    const totalKgSold = useMemo(() => {
        return monthlyReports.reduce((sum, report) => sum + report.totalKgSold, 0);
    }, [monthlyReports]);

    const loading = reportsLoading || stockLoading || deliveryLoading || plantsLoading;

    return (
        <>
            <PageTitle title="Executive Dashboard" subtitle="A real-time, unified overview of the PrimeJet business." />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatCard title="Total Revenue" value={loading ? '...' : formatCurrency(totalRevenue)} icon={TrendingUp} color="green" />
                <StatCard title="Bulk LPG Stock" value={loading ? '...' : `${Math.round(bulkStock[0]?.currentStock || 0).toLocaleString()} kg`} icon={Factory} color="indigo" />
                <StatCard title="Total LPG Sold" value={loading ? '...' : `${Math.round(totalKgSold).toLocaleString()} kg`} icon={ShoppingCart} color="blue" />
                <StatCard title="Active Deliveries" value={loading ? '...' : activeDeliveries.length} icon={Truck} color="purple" />
            </div>
            <Card>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Live Plant Status</h3>
                 {loading ? <p>Loading plant data...</p> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {plants.map(plant => (
                            <div key={plant.id} className="border p-3 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <p className="font-bold">{plant.name}</p>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${plant.status === 'Online' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{plant.status}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Uptime: {plant.uptime}%</p>
                            </div>
                        ))}
                    </div>
                 )}
            </Card>
        </>
    );
}