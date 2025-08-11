// src/views/01-Finance/RevenueAssurance.js
import React, { useState, useEffect } from 'react';
import { getRevenueAssuranceReport } from '../../api/inventoryService'; // Import the new service function
import { formatCurrency, formatDate } from '../../utils/formatters';

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';

export default function RevenueAssurance() {
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch pre-calculated revenue assurance data from the Node.js backend
                const data = await getRevenueAssuranceReport();
                setReportData(data);
            } catch (error) {
                console.error('Failed to fetch revenue assurance data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []); // Empty dependency array means this runs once on mount

    if (loading) {
        return <PageTitle title="Revenue Assurance" subtitle="Calculating revenue performance for stock batches..." />;
    }

    if (!reportData || reportData.length === 0) {
        return (
            <Card>
                <p className="text-center p-8 text-gray-500">
                    No stock batch data available to generate revenue assurance report.
                </p>
            </Card>
        );
    }

    return (
        <>
            <PageTitle title="Revenue Assurance" subtitle="Track expected vs. actual revenue from LPG stock batches." />
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b bg-gray-50">
                                <th className="p-4 text-sm font-semibold text-gray-600">Purchase Date</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">Quantity (Kg)</th>
                                <th className="p-4 text-sm font-semibold text-gray-600 text-right">Expected Revenue</th>
                                <th className="p-4 text-sm font-semibold text-gray-600 text-right">Actual Revenue</th>
                                <th className="p-4 text-sm font-semibold text-gray-600 text-center">Deviation</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">Sales Progress</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.map(batch => (
                                <tr key={batch.id} className="border-b hover:bg-gray-50">
                                    <td className="p-4">{formatDate(batch.purchaseDate)}</td>
                                    <td className="p-4 font-medium">{batch.quantityKg.toLocaleString()} kg</td>
                                    <td className="p-4 text-right">{formatCurrency(batch.expectedRevenue)}</td>
                                    <td className="p-4 text-right font-bold">{formatCurrency(batch.actualRevenue)}</td>
                                    <td className={`p-4 text-center font-bold ${batch.deviation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {batch.deviation.toFixed(1)}%
                                    </td>
                                    <td className="p-4">
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${batch.progress}%` }}></div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </>
    );
}