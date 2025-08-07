import React, { useContext, useMemo } from 'react';
import { AppContext } from '../../app';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, Users, Target } from 'lucide-react';

const formatNaira = (value) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value);

const SalesView = () => {
    const { state } = useContext(AppContext);
    const { dataEntries } = state;

    const salesData = useMemo(() => {
        const approvedSales = dataEntries.filter(e => e.type === 'Sales' && e.status === 'Approved');
        
        const salesByChannel = {
            'Site Sale': { revenue: 0, kg: 0 },
            'Delivered Sale': { revenue: 0, kg: 0 },
            'App-Driven': { revenue: 0, kg: 0 }, // Placeholder for future integration
            'Bulk Supply': { revenue: 0, kg: 0 }, // Placeholder for future integration
        };

        approvedSales.forEach(sale => {
            const kg = parseFloat(sale.details.match(/(\d+(\.\d+)?)/)[0]);
            if (sale.details.includes('Site')) {
                salesByChannel['Site Sale'].revenue += sale.amount;
                salesByChannel['Site Sale'].kg += kg;
            } else {
                salesByChannel['Delivered Sale'].revenue += sale.amount;
                salesByChannel['Delivered Sale'].kg += kg;
            }
        });
        
        return Object.entries(salesByChannel).map(([name, data]) => ({ name, Revenue: data.revenue, KG: data.kg }));
    }, [dataEntries]);

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Sales & Customer Analytics</h2>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Sales Performance by Channel</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={salesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis yAxisId="left" orientation="left" stroke="#38bdf8" tickFormatter={(val) => `₦${val/1000}k`} />
                        <YAxis yAxisId="right" orientation="right" stroke="#34d399" tickFormatter={(val) => `${val}kg`} />
                        <Tooltip formatter={(value, name) => name === 'Revenue' ? formatNaira(value) : `${value} kg`} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="Revenue" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="right" dataKey="KG" fill="#34d399" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center"><Target className="h-5 w-5 mr-2 text-red-500"/>Generator Conversion Program</h3>
                    <div className="text-center mt-4">
                        <p className="text-5xl font-bold">45 <span className="text-xl text-slate-500">/ 200</span></p>
                        <p className="text-sm text-slate-500 font-medium">Conversions this Quarter</p>
                        <p className="text-xs text-slate-400 mt-2">Next bonus at 50 conversions.</p>
                    </div>
                </div>
                 <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center"><Users className="h-5 w-5 mr-2 text-purple-500"/>Customer Hub (CRM)</h3>
                     <div className="mt-4 h-24 bg-slate-100 rounded-lg flex items-center justify-center">
                        <p className="text-slate-500">Full CRM Interface (Integration Required)</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesView;
