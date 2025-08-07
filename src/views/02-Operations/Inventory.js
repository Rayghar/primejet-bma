// src/views/02-Operations/Inventory.js (UPDATED)

import React, { useState, useMemo } from 'react';
import { useFirestoreQuery } from '../../hooks/useFirestoreQuery';
import { getApprovedSalesQuery, getStockInsQuery } from '../../api/firestoreService';

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Notification from '../../components/shared/Notification';
import LogStockInModal from './LogStockInModal'; // Import the new modal
import { PlusCircle } from 'lucide-react';

// Reusable Stock Gauge Component
const StockGauge = ({ percentage, stockKg }) => {
    const circumference = 2 * Math.PI * 52;
    const offset = circumference - (percentage / 100) * circumference;
    let strokeColor = 'stroke-green-500';
    if (percentage < 50) strokeColor = 'stroke-yellow-500';
    if (percentage < 25) strokeColor = 'stroke-red-500';

    return (
        <div className="relative w-48 h-48">
            <svg className="w-full h-full" viewBox="0 0 120 120">
                <circle className="stroke-current text-gray-200" strokeWidth="10" fill="transparent" r="52" cx="60" cy="60" />
                <circle
                    className={`stroke-current ${strokeColor} transform -rotate-90 origin-center`}
                    strokeWidth="10" strokeLinecap="round" fill="transparent" r="52" cx="60" cy="60"
                    style={{ strokeDasharray: circumference, strokeDashoffset: offset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-800">{Math.round(stockKg).toLocaleString()}</span>
                <span className="text-sm text-gray-500">kg remaining</span>
            </div>
        </div>
    );
};

// Main Inventory View Component
export default function Inventory() {
    const [showStockInModal, setShowStockInModal] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    // Fetch all necessary data with hooks
    const { docs: approvedSales, loading: salesLoading } = useFirestoreQuery(getApprovedSalesQuery());
    const { docs: stockIns, loading: stockInsLoading } = useFirestoreQuery(getStockInsQuery());

    // Memoized calculations for performance
    const inventoryData = useMemo(() => {
        const totalStockIn = stockIns.reduce((sum, entry) => sum + (entry.quantityKg || 0), 0);
        const totalStockOut = approvedSales.reduce((sum, log) => sum + (log.kgSold || 0), 0);
        const currentBulkStock = totalStockIn - totalStockOut;
        const maxCapacity = Math.max(totalStockIn, 20000); // Use total stock-in or a 20-ton default as max

        return {
            bulkStock: {
                current: currentBulkStock,
                percentage: maxCapacity > 0 ? (currentBulkStock / maxCapacity) * 100 : 0,
            },
        };
    }, [approvedSales, stockIns]);

    // Simplified static data for cylinder asset counts
    const cylinderAssetData = [
        { size: '12.5 kg', quantity: 500 },
        { size: '6 kg', quantity: 800 },
        { size: '3 kg', quantity: 1000 },
    ];

    const handleSuccess = (message, type = 'success') => {
        setNotification({ show: true, message, type });
    };

    const loading = salesLoading || stockInsLoading;

    return (
        <>
            <Notification notification={notification} setNotification={setNotification} />
            {showStockInModal && <LogStockInModal onClose={() => setShowStockInModal(false)} onSuccess={handleSuccess} />}
            
            <div className="flex justify-between items-center">
                <PageTitle title="Inventory Command Center" subtitle="Live tracking of bulk LPG and company assets." />
                <Button onClick={() => setShowStockInModal(true)} icon={PlusCircle}>
                    Log Stock-In
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <Card className="flex flex-col items-center justify-center">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Bulk LPG Stock</h3>
                        {loading ? <p>Calculating...</p> : <StockGauge percentage={inventoryData.bulkStock.percentage} stockKg={inventoryData.bulkStock.current} />}
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Cylinder Assets (Total Owned)</h3>
                        {loading ? <p>Loading asset data...</p> : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b bg-gray-50">
                                            <th className="p-4 text-sm font-semibold text-gray-600">Cylinder Size</th>
                                            <th className="p-4 text-sm font-semibold text-gray-600 text-right">Total Quantity</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cylinderAssetData.map(row => (
                                            <tr key={row.size} className="border-b hover:bg-gray-50">
                                                <td className="p-4 font-medium">{row.size}</td>
                                                <td className="p-4 text-right font-semibold">{row.quantity.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </>
    );
}
