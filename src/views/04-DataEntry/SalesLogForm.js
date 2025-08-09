// src/views/04-DataEntry/SalesLogForm.js
import React, { useState } from 'react';
// addDataEntry is no longer directly used here, but kept for context if needed elsewhere
import { generateRawBtReceipt, createRawBtLink } from '../../utils/rawbt';
import Button from '../../components/shared/Button';
import { Send } from 'lucide-react';

export default function SalesLogForm({ user, plants, onPushToTable, onError }) {
    const initialState = { 
        kgSold: '', 
        revenue: '', 
        paymentMethod: 'Cash', 
        branchId: plants[0]?.id || '', 
        date: new Date().toISOString().split('T')[0] 
    };
    const [formData, setFormData] = useState(initialState);
    const [isSubmitting, setIsSubmitting] = useState(false); // Renamed to isAddingToTable for clarity

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    
    const handleAddAndPrint = async (e) => {
        e.preventDefault();
        setIsSubmitting(true); // Indicate that we are processing
        try {
            // Call the function passed from the parent to add this entry to the local state
            onPushToTable(formData, 'sale');

            // Generate and print receipt (this part remains the same)
            const receiptData = {
                ...formData,
                revenue: parseFloat(formData.revenue),
                cashierEmail: user.email,
                receiptNumber: `SALE-${Date.now()}`
            };
            const companyInfo = { name: "PrimeJet Gas LLC", address: "Lagos, Nigeria", phone: "0800-PRIMEJET", website: "www.primejet.ng" };
            const receiptString = generateRawBtReceipt(receiptData, companyInfo);
            const printLink = createRawBtLink(receiptString);
            
            window.open(printLink, '_blank');

            setFormData(initialState); // Reset form after successful processing
        } catch (error) {
            onError(error.message || 'Failed to add sales log or print receipt.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <form onSubmit={handleAddAndPrint} className="space-y-4 p-4 border rounded-lg bg-white">
            <h3 className="font-semibold text-gray-700">Log Customer Sale</h3>
            <div>
                <label className="block text-sm font-medium">Branch</label>
                <select name="branchId" value={formData.branchId} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md bg-white">
                    {plants.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium">KG Sold</label>
                <input type="number" name="kgSold" value={formData.kgSold} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" required/>
            </div>
            <div>
                <label className="block text-sm font-medium">Total Revenue (₦)</label>
                <input type="number" name="revenue" value={formData.revenue} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" required/>
            </div>
            <div>
                <label className="block text-sm font-medium">Payment Method</label>
                <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md bg-white">
                    <option>Cash</option>
                    <option>POS</option>
                    <option>Transfer</option>
                </select>
            </div>
            <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSubmitting} icon={Send}>
                    {isSubmitting ? 'Adding...' : 'Add & Print Receipt'}
                </Button>
            </div>
        </form>
    );
}