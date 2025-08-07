// src/views/04-DataEntry/SalesLogForm.js (UPDATED)
import React, { useState } from 'react';
// ... other imports
import { BRANCHES } from '../../utils/constants'; // Import branches

export default function SalesLogForm({ user, onSuccess, onError }) {
    const [formData, setFormData] = useState({
        kgSold: '',
        revenue: '',
        saleType: 'Site Sale',
        branchId: 'ijora', // Add branchId with a default
        date: new Date().toISOString().split('T')[0]
    });
    // ... (handleChange and handleSubmit logic remains the same)

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Add the new Branch dropdown */}
            <div>
                <label htmlFor="branchId" className="block text-sm font-medium text-gray-700">Branch Location</label>
                <select name="branchId" id="branchId" value={formData.branchId} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white">
                    {BRANCHES.map(branch => (
                        <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                </select>
            </div>
            {/* ... (other form fields remain the same) */}
        </form>
    );
};