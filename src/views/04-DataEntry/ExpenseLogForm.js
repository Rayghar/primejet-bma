// src/views/04-DataEntry/ExpenseLogForm.js

import React, { useState } from 'react';
import { EXPENSE_CATEGORIES } from '../../utils/constants';
import Button from '../../components/shared/Button';
import { PlusCircle } from 'lucide-react';

export default function ExpenseLogForm({ user, plants, onPushToTable, onError }) {
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: EXPENSE_CATEGORIES[0],
        branchId: plants[0]?.id || '',
        date: new Date().toISOString().split('T')[0]
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePush = (e) => {
        e.preventDefault();
        if (!formData.description || !formData.amount || !formData.category || !formData.branchId) {
            onError('Please fill in all required fields.');
            return;
        }

        // Call the function passed from the parent component to add this entry to the local state
        onPushToTable(formData, 'expense');

        // Reset the form after successfully pushing the entry
        setFormData({
            description: '',
            amount: '',
            category: EXPENSE_CATEGORIES[0],
            branchId: plants[0]?.id || '',
            date: new Date().toISOString().split('T')[0]
        });
    };

    return (
        <form onSubmit={handlePush} className="space-y-4 p-4 border rounded-lg bg-white">
            <h3 className="font-semibold text-gray-700">Log Operational Expense</h3>
            <div>
                <label className="block text-sm font-medium text-gray-700">Branch</label>
                <select name="branchId" value={formData.branchId} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md bg-white">
                    {plants.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select name="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md bg-white">
                    {EXPENSE_CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input type="text" name="description" value={formData.description} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md" placeholder="e.g., Generator fuel" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Amount (₦)</label>
                <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md" placeholder="e.g., 50000" required />
            </div>
            <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSubmitting} icon={PlusCircle}>
                    Add to Today's Entries
                </Button>
            </div>
        </form>
    );
}