// src/views/04-DataEntry/SalesLogForm.js
import React, { useState } from 'react';
import { addDataEntry } from '../../api/firestoreService';
import { generateRawBtReceipt, createRawBtLink } from '../../utils/rawbt';
import Button from '../../components/shared/Button';
import { Send } from 'lucide-react';
import Modal from '../../components/shared/Modal';

export default function SalesLogForm({ user, plants, onSuccess, onError, onClose }) {
    const initialState = { kgSold: '', revenue: '', paymentMethod: 'Cash', branchId: plants[0]?.id || '', date: new Date().toISOString().split('T')[0] };
    const [formData, setFormData] = useState(initialState);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await addDataEntry(formData, user, 'sale');
            onSuccess('Sales log submitted for approval!');

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

            onClose();
        } catch (error) {
            onError(error.message || 'Failed to submit sales log.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <Modal title="Log Customer Sale" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium">Branch</label>
                    <select name="branchId" value={formData.branchId} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md bg-white">
                        {plants.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>
                <div><label className="block text-sm font-medium">KG Sold</label><input type="number" name="kgSold" value={formData.kgSold} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" required/></div>
                <div><label className="block text-sm font-medium">Total Revenue (₦)</label><input type="number" name="revenue" value={formData.revenue} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" required/></div>
                <div>
                    <label className="block text-sm font-medium">Payment Method</label>
                    <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md bg-white">
                        <option>Cash</option>
                        <option>POS</option>
                        <option>Transfer</option>
                    </select>
                </div>
                <div className="flex justify-end pt-2"><Button type="submit" disabled={isSubmitting} icon={Send}>{isSubmitting ? 'Submitting...' : 'Log & Print Receipt'}</Button></div>
            </form>
        </Modal>
    );
};