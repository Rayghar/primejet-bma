// src/views/Dashboard.js (Refactored Frontend View)
import React, { useState, useEffect, useMemo } from 'react';
import { getDashboardKpis, getSalesReport, getTopSellingProducts } from '../api/analyticsService'; // Import analytics services
import { getPlants } from '../api/operationsService'; // Import operations service for plants
import { getInventorySummary } from '../api/inventoryService'; // Import inventory service for summary
import { formatCurrency } from '../utils/formatters';

import PageTitle from '../components/shared/PageTitle';
import StatCard from '../components/shared/StatCard';
import Card from '../components/shared/Card';
import BarChart from '../components/charts/BarChart'; // For monthly revenue chart
import { TrendingUp, ShoppingCart, Truck, Factory, Package, AlertTriangle, Box } from 'lucide-react'; // More icons for insights

export default function Dashboard() {
    const [kpiData, setKpiData] = useState({ totalRevenue: 0, totalKgSold: 0, activeDeliveries: 0 });
    const [plants, setPlants] = useState([]);
    const [inventorySummary, setInventorySummary] = useState({ currentBulkLpgKg: 0, totalCylinders: 0, lowStockAlert: false });
    const [monthlySales, setMonthlySales] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch all necessary data concurrently
                const [kpis, plantList, invSummary, salesReport, topProdList] = await Promise.all([
                    getDashboardKpis(),
                    getPlants(),
                    getInventorySummary(), // Fetch new inventory summary
                    getSalesReport(), // Fetch monthly sales for chart
                    getTopSellingProducts(), // Fetch top selling products
                ]);

                setKpiData(kpis);
                setPlants(plantList);
                setInventorySummary(invSummary);
                setMonthlySales(salesReport);
                setTopProducts(topProdList);

            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
                // Optionally, set a notification or error state here
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Prepare data for the monthly revenue chart
    const monthlyRevenueChartData = useMemo(() => {
        if (!monthlySales || monthlySales.length === 0) return [];
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return monthlySales.map(d => ({
            label: `${monthNames[d._id.month - 1]} '${String(d._id.year).slice(2)}`,
            value: d.totalRevenue,
        })).sort((a, b) => {
            // Sort by year then month for correct chart order
            const yearA = parseInt(a.label.slice(-2));
            const yearB = parseInt(b.label.slice(-2));
            const monthA = monthNames.indexOf(a.label.slice(0, 3));
            const monthB = monthNames.indexOf(b.label.slice(0, 3));
            if (yearA !== yearB) return yearA - yearB;
            return monthA - monthB;
        });
    }, [monthlySales]);

    return (
        <>
            <PageTitle title='Executive Dashboard' subtitle='A real-time, unified overview of the PrimeJet business.' />
            
            {/* Top-level KPIs */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6'>
                <StatCard title='Total Revenue' value={loading ? '...' : formatCurrency(kpiData.totalRevenue)} icon={TrendingUp} color='green' />
                <StatCard title='Bulk LPG Stock' value={loading ? '...' : `${Math.round(inventorySummary.currentBulkLpgKg).toLocaleString()} kg`} icon={Factory} color='indigo' />
                <StatCard title='Total LPG Sold' value={loading ? '...' : `${Math.round(kpiData.totalKgSold).toLocaleString()} kg`} icon={ShoppingCart} color='blue' />
                <StatCard title='Active Deliveries' value={loading ? '...' : kpiData.activeDeliveries} icon={Truck} color='purple' />
            </div>

            {/* Monthly Revenue Chart */}
            <div className="mb-6">
                <BarChart data={monthlyRevenueChartData} title='Monthly Revenue (₦)' />
            </div>

            {/* Additional Insights Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Live Plant Status */}
                <Card>
                    <h3 className='text-lg font-semibold text-gray-700 mb-4'>Live Plant Status</h3>
                     {loading ? <p>Loading plant data...</p> : (
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                            {plants.length > 0 ? plants.map(plant => (
                                <div key={plant.id} className='border p-3 rounded-lg'>
                                    <div className='flex justify-between items-center'>
                                        <p className='font-bold'>{plant.name}</p>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${plant.status === 'Operational' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{plant.status}</span>
                                    </div>
                                    <p className='text-xs text-gray-500 mt-2'>Uptime: {plant.uptime || 0}%</p>
                                </div>
                            )) : <p className="text-gray-500">No plant data found.</p>}
                        </div>
                     )}
                </Card>

                {/* Inventory Overview */}
                <Card>
                    <h3 className='text-lg font-semibold text-gray-700 mb-4 flex items-center'><Box className="mr-2 text-orange-500" />Inventory Overview</h3>
                    {loading ? <p>Loading inventory data...</p> : (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="font-medium">Total Cylinders Owned:</span>
                                <span className="text-gray-700">{inventorySummary.totalCylinders.toLocaleString()}</span>
                            </div>
                            {inventorySummary.lowStockAlert && (
                                <div className="flex items-center text-red-600 font-semibold">
                                    <AlertTriangle size={20} className="mr-2" />
                                    <span>LOW STOCK ALERT: Bulk LPG below threshold!</span>
                                </div>
                            )}
                            {/* Add more detailed inventory insights here if needed */}
                        </div>
                    )}
                </Card>

                {/* Top Selling Products */}
                <Card className="lg:col-span-2">
                    <h3 className='text-lg font-semibold text-gray-700 mb-4 flex items-center'><ShoppingCart className="mr-2 text-blue-500" />Top Selling Products</h3>
                    {loading ? <p>Loading data...</p> : topProducts.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b bg-gray-50">
                                        <th className="p-2">Product Name</th>
                                        <th className="p-2 text-right">Quantity Sold</th>
                                        <th className="p-2 text-right">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topProducts.map(product => (
                                        <tr key={product._id} className="border-b hover:bg-gray-50">
                                            <td className="p-2 font-medium">{product._id || 'Unknown'}</td>
                                            <td className="p-2 text-right">{product.totalQuantitySold.toLocaleString()}</td>
                                            <td className="p-2 text-right">{formatCurrency(product.totalRevenue)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : <p className="text-gray-500">No top selling products data available.</p>}
                </Card>
            </div>
        </>
    );
}