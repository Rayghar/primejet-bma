// src/views/02-Operations/LogStockInModal.js
import React, { useState } from 'react';
//import { useAuth } from '../../hooks/useAuth';
import { addStockIn } from '../../api/inventoryService'; // Import from new inventory service
import Modal from '../../components/shared/Modal';
import Button from '../../components/shared/Button';

export default function LogStockInModal({ onClose, onSuccess }) {
    //const { user } = useAuth();
    const [formData, setFormData] = useState({
        quantityKg: '',
        supplier: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        costPerKg: '',
        targetSalePricePerKg: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (!formData.quantityKg || !formData.supplier || !formData.purchaseDate || !formData.costPerKg || !formData.targetSalePricePerKg) {
            onSuccess('Please fill in all required fields.', 'error');
            setIsSubmitting(false);
            return;
        }

        try {
            // Call the new addStockIn service function
            await addStockIn({
                ...formData,
                quantityKg: parseFloat(formData.quantityKg),
                costPerKg: parseFloat(formData.costPerKg),
                targetSalePricePerKg: parseFloat(formData.targetSalePricePerKg),
                // The backend will handle setting 'loggedBy' from req.user
            });
            onSuccess(`Successfully logged a stock-in of ${formData.quantityKg} kg.`);
            onClose();
        } catch (error) {
            console.error("Stock-in Error:", error);
            onSuccess(error.response?.data?.message || 'Failed to log stock-in.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal title="Log New Stock-In" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Quantity (KG)</label>
                    <input type="number" name="quantityKg" value={formData.quantityKg} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" placeholder="e.g., 2500" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Cost / kg (₦)</label>
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