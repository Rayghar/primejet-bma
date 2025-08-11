// src/views/03-Sales/SalesAnalytics.js (Refactored Frontend View)
import React, { useState, useEffect, useMemo } from 'react';
import { getSalesReport, getSalesByPaymentMethod, getSalesByBranch, getTopSellingProducts } from '../../api/analyticsService';
import { formatCurrency } from '../../utils/formatters';

import PageTitle from '../../components/shared/PageTitle';
import StatCard from '../../components/shared/StatCard';
import BarChart from '../../components/charts/BarChart';
import Card from '../../components/shared/Card'; // Ensure Card is imported
import { TrendingUp, ShoppingCart, CreditCard, MapPin, Package } from 'lucide-react';

export default function SalesAnalytics() {
    const [salesData, setSalesData] = useState([]);
    const [salesByMethod, setSalesByMethod] = useState([]);
    const [salesByBranch, setSalesByBranch] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [report, methodSales, branchSales, products] = await Promise.all([
                    getSalesReport(),
                    getSalesByPaymentMethod(),
                    getSalesByBranch(),
                    getTopSellingProducts(),
                ]);
                setSalesData(report);
                setSalesByMethod(methodSales);
                setSalesByBranch(branchSales);
                setTopProducts(products);
            } catch (error) {
                console.error('Failed to fetch sales analytics data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const analyticsData = useMemo(() => {
        if (salesData.length === 0) {
            return { monthlyRevenue: [], totalRevenue: 0, totalKgSold: 0 };
        }

        const monthlyRevenue = salesData.map(d => ({
            label: `Month ${d._id.month}`, // Consider a more robust month/year formatting
            value: d.totalRevenue,
        }));

        const totalRevenue = salesData.reduce((sum, d) => sum + d.totalRevenue, 0);
        const totalKgSold = salesData.reduce((sum, d) => sum + d.totalKgSold, 0);

        return { monthlyRevenue, totalRevenue, totalKgSold };
    }, [salesData]);

    return (
        <>
            <PageTitle title='Sales Analytics' subtitle='Visualize sales performance across all channels.' />
            
            {/* Overall Sales KPIs */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
                <StatCard title='Total Revenue (All Time)' value={loading ? '...' : formatCurrency(analyticsData.totalRevenue)} icon={TrendingUp} color='blue' />
                <StatCard title='Total LPG Sold (All Time)' value={loading ? '...' : `${Math.round(analyticsData.totalKgSold).toLocaleString()} kg`} icon={ShoppingCart} color='green' />
            </div>

            {/* Monthly Revenue Trend */}
            <div className="mb-6">
                <BarChart data={analyticsData.monthlyRevenue} title='Monthly Revenue (₦)' />
            </div>

            {/* Additional Sales Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales by Payment Method */}
                <Card>
                    <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center"><CreditCard className="mr-2 text-purple-500" />Sales by Payment Method</h3>
                    {loading ? <p>Loading data...</p> : salesByMethod.length > 0 ? (
                        <div className="space-y-3">
                            {salesByMethod.map(item => (
                                <div key={item._id} className="flex justify-between items-center border-b pb-2">
                                    <span className="font-medium">{item._id || 'Unknown'}</span>
                                    <span className="text-gray-700">{formatCurrency(item.totalRevenue)} ({item.count} orders)</span>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-gray-500">No data for payment methods.</p>}
                </Card>

                {/* Sales by Branch */}
                <Card>
                    <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center"><MapPin className="mr-2 text-red-500" />Sales by Branch</h3>
                    {loading ? <p>Loading data...</p> : salesByBranch.length > 0 ? (
                        <div className="space-y-3">
                            {salesByBranch.map(item => (
                                <div key={item.branchId} className="flex justify-between items-center border-b pb-2">
                                    <span className="font-medium">{item.branchName || 'N/A'}</span>
                                    <span className="text-gray-700">{formatCurrency(item.totalRevenue)} ({item.count} orders)</span>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-gray-500">No data for sales by branch.</p>}
                </Card>

                {/* Top Selling Products */}
                <Card className="lg:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center"><Package className="mr-2 text-blue-500" />Top 10 Selling Products</h3>
                    {loading ? <p>Loading data...</p> : topProducts.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b bg-gray-50">
                                        <th className="p-2">Product Name</th>
                                        <th className="p-2 text-right">Total Quantity Sold</th>
                                        <th className="p-2 text-right">Total Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topProducts.map(product => (
                                        <tr key={product._id} className="border-b hover:bg-gray-50">
                                            <td className="p-2 font-medium">{product._id || 'Unknown Product'}</td>
                                            <td className="p-2 text-right">{product.totalQuantitySold.toLocaleString()}</td>
                                            <td className="p-2 text-right">{formatCurrency(product.totalRevenue)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : <p className="text-gray-500">No data for top selling products.</p>}
                </Card>
            </div>
        </>
    );
}