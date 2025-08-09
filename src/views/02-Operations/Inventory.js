// src/views/02-Operations/Inventory.js
import React, { useState, useMemo, useEffect } from 'react';
import { useFirestoreQuery } from '../../hooks/useFirestoreQuery';
import { getBulkStockQuery, getCylindersQuery, addCylinder, deleteCylinder } from '../../api/firestoreService';

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Notification from '../../components/shared/Notification';
import LogStockInModal from './LogStockInModal';
import { PlusCircle, Trash2 } from 'lucide-react';

const StockGauge = ({ percentage, stockKg }) => {
    const circumference = 2 * Math.PI * 52;
    const offset = circumference - (percentage / 100) * circumference;
    let strokeColor = 'stroke-green-500';
    if (percentage < 50) strokeColor = 'stroke-yellow-500';
    if (percentage < 25) strokeColor = 'stroke-red-500';
    return (
        <div className="relative w-48 h-48">
            <svg className="w-full h-full" viewBox="0 0 120 120"><circle className="stroke-current text-gray-200" strokeWidth="10" fill="transparent" r="52" cx="60" cy="60" /><circle className={`stroke-current ${strokeColor} transform -rotate-90 origin-center`} strokeWidth="10" strokeLinecap="round" fill="transparent" r="52" cx="60" cy="60" style={{ strokeDasharray: circumference, strokeDashoffset: offset, transition: 'stroke-dashoffset 0.5s ease-in-out' }} /></svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-3xl font-bold text-gray-800">{Math.round(stockKg).toLocaleString()}</span><span className="text-sm text-gray-500">kg remaining</span></div>
        </div>
    );
};

const AddCylinderForm = ({ onSuccess, onError }) => {
    const [formData, setFormData] = useState({ size: '12.5 kg', quantity: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await addCylinder(formData);
            onSuccess(`${formData.quantity} x ${formData.size} cylinders added.`);
            setFormData({ size: '12.5 kg', quantity: '' });
        } catch (error) {
            onError('Failed to add cylinders.');
        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <input type="text" name="size" value={formData.size} onChange={handleChange} placeholder="Cylinder Size (e.g., 12.5 kg)" className="w-full p-2 border rounded-md" required />
            <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="Quantity" className="w-full p-2 border rounded-md" required />
            <Button type="submit" disabled={isSubmitting} icon={PlusCircle} className="w-full">Add Batch</Button>
        </form>
    );
};

export default function Inventory() {
    const [showStockInModal, setShowStockInModal] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    
    // Refactored to query a single, real-time bulk stock document
    const { docs: bulkStockDoc, loading: stockLoading } = useFirestoreQuery(getBulkStockQuery());
    const { docs: cylinders, loading: cylindersLoading } = useFirestoreQuery(getCylindersQuery());
    
    const currentBulkStock = bulkStockDoc.length > 0 ? bulkStockDoc[0].currentStock : 0;
    const maxCapacity = 20000; // Use a fixed capacity or fetch it from a config doc

    const loading = stockLoading || cylindersLoading;

    const bulkStockData = useMemo(() => ({
        current: currentBulkStock,
        percentage: (currentBulkStock / maxCapacity) * 100,
    }), [currentBulkStock]);
    
    const handleSuccess = (message) => setNotification({ show: true, message, type: 'success' });
    const handleError = (msg) => setNotification({ show: true, message: msg, type: 'error' });

    const handleRemoveCylinder = async (cylinderId, cylinderName) => {
        if (window.confirm(`Are you sure you want to remove the cylinder batch "${cylinderName}"?`)) {
            await deleteCylinder(cylinderId);
            handleSuccess(`Cylinder batch "${cylinderName}" removed.`);
        }
    };

    return (
        <>
            <Notification notification={notification} setNotification={setNotification} />
            {showStockInModal && <LogStockInModal onClose={() => setShowStockInModal(false)} onSuccess={handleSuccess} />}
            
            <div className="flex justify-between items-center">
                <PageTitle title="Inventory Command Center" subtitle="Live tracking of bulk LPG and company assets." />
                <Button onClick={() => setShowStockInModal(true)} icon={PlusCircle}>Log Stock-In</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <Card className="flex flex-col items-center justify-center">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Bulk LPG Stock</h3>
                        {loading ? <p>Calculating...</p> : <StockGauge percentage={bulkStockData.percentage} stockKg={bulkStockData.current} />}
                    </Card>
                </div>
                
                <div className="lg:col-span-2">
                    <Card>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Cylinder Assets (Total Owned)</h3>
                        {loading ? <p>Loading asset data...</p> : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead><tr className="border-b bg-gray-50"><th className="p-4 text-sm font-semibold text-gray-600">Cylinder Size</th><th className="p-4 text-sm font-semibold text-gray-600 text-right">Total Quantity</th><th className="p-4 text-sm font-semibold text-gray-600 text-right">Actions</th></tr></thead>
                                    <tbody>{cylinders.map(row => (<tr key={row.id} className="border-b hover:bg-gray-50"><td className="p-4 font-medium">{row.size}</td><td className="p-4 text-right font-semibold">{row.quantity.toLocaleString()}</td><td className="p-4 text-right"><Button onClick={() => handleRemoveCylinder(row.id, row.size)} variant="danger" icon={Trash2} /></td></tr>))}</tbody>
                                </table>
                            </div>
                        )}
                        <div className="border-t mt-4 pt-4">
                             <AddCylinderForm onSuccess={handleSuccess} onError={handleError} />
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );
}