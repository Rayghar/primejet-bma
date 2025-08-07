// src/views/05-Admin/DataMigration.js (NEW FILE)

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { addHistoricalEntry } from '../../api/firestoreService';
import { BRANCHES } from '../../utils/constants';

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Notification from '../../components/shared/Notification';
import { UploadCloud } from 'lucide-react';

export default function DataMigration() {
    const { user } = useAuth();
    const initialFormState = {
        receiptNumber: '',
        transactionRef: '',
        kgSold: '',
        amountPaid: '',
        paymentMethod: 'Cash',
        branchId: 'ijora',
        date: new Date().toISOString().split('T')[0],
    };
    const [formData, setFormData] = useState(initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await addHistoricalEntry(formData, user);
            setNotification({ show: true, message: `Historical entry ${formData.receiptNumber} saved.`, type: 'success' });
            setFormData(initialFormState); // Clear form for next entry
        } catch (error) {
            console.error("Data migration error:", error);
            setNotification({ show: true, message: 'Failed to save historical entry.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Notification notification={notification} setNotification={setNotification} />
            <PageTitle title="Historical Data Migration" subtitle="Enter past sales records to complete your financial history." />

            <Card>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Column 1 */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium">Receipt Number</label>
                            <input type="text" name="receiptNumber" value={formData.receiptNumber} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Transaction Reference</label>
                            <input type="text" name="transactionRef" value={formData.transactionRef} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">KG Sold</label>
                            <input type="number" name="kgSold" value={formData.kgSold} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" required />
                        </div>
                    </div>

                    {/* Column 2 */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium">Amount Paid (₦)</label>
                            <input type="number" name="amountPaid" value={formData.amountPaid} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Payment Method</label>
                            <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md bg-white">
                                <option>Cash</option>
                                <option>POS</option>
                                <option>Transfer</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Branch</label>
                            <select name="branchId" value={formData.branchId} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md bg-white">
                                {BRANCHES.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium">Transaction Date</label>
                            <input type="date" name="date" value={formData.date} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" required />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="md:col-span-2 flex justify-end pt-4 border-t">
                        <Button type="submit" disabled={isSubmitting} icon={UploadCloud}>
                            {isSubmitting ? 'Saving...' : 'Save Historical Entry'}
                        </Button>
                    </div>
                </form>
            </Card>
        </>
    );
}
