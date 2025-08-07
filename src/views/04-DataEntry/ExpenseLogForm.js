// =======================================================================
// src/views/04-DataEntry/ExpenseLogForm.js (NEW)
// A new component for the expense logging form.
// =======================================================================
import React, { useState } from 'react';
import { addExpenseLog } from '../../api/firestoreService';
import Button from '../../components/shared/Button';
import { Send } from 'lucide-react';

export default function ExpenseLogForm({ user, onSuccess, onError }) {
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: 'Maintenance',
        date: new Date().toISOString().split('T')[0]
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.description || !formData.amount || !formData.category) {
            onError('Please fill in all required fields.');
            return;
        }
        if (parseFloat(formData.amount) > 400000) {
            onError('Expense exceeds the plant\'s monthly budget of ₦400,000.');
            return;
        }
        setIsSubmitting(true);
        try {
            await addExpenseLog(formData, user);
            onSuccess('Expense log submitted for approval!');
            // Reset form
            setFormData({ description: '', amount: '', category: 'Maintenance', date: new Date().toISOString().split('T')[0] });
        } catch (error) {
            console.error("Error submitting expense log:", error);
            onError('Failed to submit expense log.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="exp_date" className="block text-sm font-medium text-gray-700">Date</label>
                <input type="date" name="date" id="exp_date" value={formData.date} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                <input type="text" name="description" id="description" value={formData.description} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" placeholder="e.g., Generator fuel purchase" />
            </div>
            <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount (₦)</label>
                <input type="number" name="amount" id="amount" value={formData.amount} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" placeholder="e.g., 50000" />
            </div>
            <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                <select name="category" id="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white">
                    <option>Maintenance</option>
                    <option>Supplies</option>
                    <option>Logistics</option>
                    <option>Utilities</option>
                    <option>Other</option>
                </select>
            </div>
            <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting} icon={Send}>
                    {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
                </Button>
            </div>
        </form>
    );
};