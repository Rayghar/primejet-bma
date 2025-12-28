import React, { useState, useEffect } from 'react';
import { getSalesReport, getSalesByPaymentMethod, getTopSellingProducts } from '../../api/analyticsService';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import BarChart from '../../components/charts/BarChart';
import { TrendingUp, CreditCard, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export default function SalesAnalytics() {
    const [salesData, setSalesData] = useState(null);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('monthly');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [report, payments, products] = await Promise.all([
                    getSalesReport(period),
                    getSalesByPaymentMethod(),
                    getTopSellingProducts()
                ]);
                setSalesData(report);
                setPaymentMethods(payments);
                setTopProducts(products);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [period]);

    if (loading) return <div className="p-8 text-center text-blue-400 animate-pulse">Loading Analytics...</div>;

    // Formatting for Chart
    const chartData = salesData?.breakdown?.map(item => ({
        label: item.label,
        value: item.revenue
    })) || [];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <PageTitle title="Sales Intelligence" subtitle="Revenue, Methods & Product Mix" />
                <select value={period} onChange={e => setPeriod(e.target.value)} className="glass-input p-2 text-sm bg-black/20">
                    <option value="weekly">This Week</option>
                    <option value="monthly">This Month</option>
                    <option value="yearly">This Year</option>
                </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 glass-card">
                    <h3 className="font-bold text-white mb-6 flex items-center">
                        <TrendingUp className="mr-2 text-green-500" /> Revenue Trend
                    </h3>
                    <BarChart data={chartData} />
                </div>

                {/* Payment Methods */}
                <div className="glass-card flex flex-col">
                    <h3 className="font-bold text-white mb-6 flex items-center">
                        <CreditCard className="mr-2 text-blue-500" /> Payment Mix
                    </h3>
                    <div className="flex-1 space-y-3">
                        {paymentMethods.map((method, i) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="capitalize text-gray-300">{method._id}</span>
                                <div className="text-right">
                                    <p className="font-bold text-white">{formatCurrency(method.totalAmount)}</p>
                                    <p className="text-xs text-gray-500">{method.count} txns</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Products Table (Restored Feature) */}
            <div className="glass-card">
                <h3 className="font-bold text-white mb-6 flex items-center">
                    <ShoppingBag className="mr-2 text-purple-500" /> Top Selling Products
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 text-gray-300 uppercase text-xs">
                            <tr>
                                <th className="p-4 rounded-tl-xl">Product Name</th>
                                <th className="p-4 text-right">Quantity Sold</th>
                                <th className="p-4 text-right">Revenue Generated</th>
                                <th className="p-4 rounded-tr-xl">Contribution</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {topProducts.map((product, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-medium text-white">{product._id}</td>
                                    <td className="p-4 text-right text-blue-300">{product.totalQuantitySold.toLocaleString()}</td>
                                    <td className="p-4 text-right font-bold text-green-400">{formatCurrency(product.totalRevenue)}</td>
                                    <td className="p-4">
                                        <div className="w-24 bg-gray-700 h-1.5 rounded-full ml-auto overflow-hidden">
                                            <div className="bg-purple-500 h-full" style={{ width: `${(product.totalRevenue / (salesData?.totalRevenue || 1)) * 100}%` }}></div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}