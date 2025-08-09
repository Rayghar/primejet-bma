// src/views/Dashboard.js
import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { db, appId } from '../api/firebase';
import { useFirestoreQuery } from '../hooks/useFirestoreQuery';
import { getUnifiedFinancialData, getStockInsQuery, getPlantsQuery } from '../api/firestoreService';
import { formatCurrency } from '../utils/formatters';
import { logAppEvent } from '../services/loggingService';

import PageTitle from '../components/shared/PageTitle';
import StatCard from '../components/shared/StatCard';
import Card from '../components/shared/Card';
import { TrendingUp, ShoppingCart, Truck, Factory } from 'lucide-react';

export default function Dashboard() {
    const [unifiedData, setUnifiedData] = useState([]);
    const [kpiLoading, setKpiLoading] = useState(true);

    const { docs: stockIns, loading: stockInsLoading } = useFirestoreQuery(getStockInsQuery());
    const { docs: activeDeliveries, loading: deliveryLoading } = useFirestoreQuery(query(collection(db, `artifacts/${appId}/vans`), where("status", "==", "On Delivery")));
    const { docs: plants, loading: plantsLoading } = useFirestoreQuery(getPlantsQuery());

    useEffect(() => {
        const fetchData = async () => {
            logAppEvent('DEBUG', 'Dashboard: Starting unified data fetch for KPIs.', { component: 'Dashboard' });
            setKpiLoading(true);
            try {
                const data = await getUnifiedFinancialData();
                setUnifiedData(data);
                logAppEvent('DEBUG', `Dashboard: Unified data fetch complete. Found ${data.length} records.`, { recordCount: data.length });
            } catch (error) {
                logAppEvent('ERROR', 'Dashboard: Failed to fetch unified data.', { error: error.message, stack: error.stack });
            } finally {
                setKpiLoading(false);
            }
        };
        fetchData();
    }, []);

    const kpiData = useMemo(() => {
        logAppEvent('DEBUG', 'Dashboard: Recalculating KPI data.', { component: 'Dashboard' });
        const sales = unifiedData.filter(d => d.type === 'sale');
        const totalRevenue = sales.reduce((sum, sale) => sum + sale.revenue, 0);
        const totalKgSold = sales.reduce((sum, sale) => sum + sale.kgSold, 0);
        
        const totalStockIn = stockIns.reduce((sum, stock) => sum + (stock.quantityKg || 0), 0);
        const currentStock = totalStockIn - totalKgSold;

        return { totalRevenue, totalKgSold, currentStock };
    }, [unifiedData, stockIns]);

    const loading = kpiLoading || stockInsLoading || deliveryLoading || plantsLoading;

    return (
        <>
            <PageTitle title="Executive Dashboard" subtitle="A real-time, unified overview of the PrimeJet business." />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatCard title="Total Revenue" value={loading ? '...' : formatCurrency(kpiData.totalRevenue)} icon={TrendingUp} color="green" />
                <StatCard title="Bulk LPG Stock" value={loading ? '...' : `${Math.round(kpiData.currentStock).toLocaleString()} kg`} icon={Factory} color="indigo" />
                <StatCard title="Total LPG Sold" value={loading ? '...' : `${Math.round(kpiData.totalKgSold).toLocaleString()} kg`} icon={ShoppingCart} color="blue" />
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
