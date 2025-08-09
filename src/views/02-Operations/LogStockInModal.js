// src/views/02-Operations/LogStockInModal.js
import React, { useState } from 'react';
import { addStockIn } from '../../api/firestoreService';
import Modal from '../../components/shared/Modal';
import Button from '../../components/shared/Button';

export default function LogStockInModal({ onClose, onSuccess, user }) {
    const [formData, setFormData] = useState({
        quantityKg: '2500',
        supplier: 'Refinery',
        purchaseDate: new Date().toISOString().split('T')[0],
        costPerKg: '',
        targetSalePricePerKg: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await addStockIn(formData, user);
            onSuccess(`Successfully logged a stock-in of ${formData.quantityKg} kg.`);
            onClose();
        } catch (error) {
            console.error("Stock-in Error:", error);
            onSuccess('Failed to log stock-in.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal title="Log Bulk LPG Purchase" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Quantity (kg)</label>
                    <input type="number" name="quantityKg" value={formData.quantityKg} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Cost Price / kg (₦)</label>
                        <input type="number" name="costPerKg" value={formData.costPerKg} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" placeholder="e.g., 850" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Target Sale Price / kg (₦)</label>
                        <input type="number" name="targetSalePricePerKg" value={formData.targetSalePricePerKg} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" placeholder="e.g., 1100" required />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Supplier</label>
                    <input type="text" name="supplier" value={formData.supplier} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Purchase Date</label>
                    <input type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" required />
                </div>
                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Logging...' : 'Confirm Stock-In'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}