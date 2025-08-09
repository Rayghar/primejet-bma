// src/views/05-Admin/DataMigration.js
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { addDailySummary, addHistoricalEntry, getPlantsQuery } from '../../api/firestoreService';
import { useFirestoreQuery } from '../../hooks/useFirestoreQuery';
import Papa from 'papaparse';
import { logAppEvent } from '../../services/loggingService';
import { EXPENSE_CATEGORIES } from '../../utils/constants';

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Notification from '../../components/shared/Notification';
import { UploadCloud, PlusCircle, Trash2, FileUp } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

// --- BulkUpload Component (for individual sales) ---
const BulkUpload = ({ user, plants, onSuccess, onError }) => {
    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        logAppEvent('DEBUG', 'DataMigration: Starting CSV bulk upload.', { fileName: file.name });
        setIsUploading(true);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const records = results.data;
                    logAppEvent('INFO', `DataMigration: Parsed ${records.length} records from CSV.`, { recordCount: records.length });
                    const batch = [];
                    for (const record of records) {
                        if (!record.date || !record.kgSold || !record.amountPaid || !record.branchName) {
                            logAppEvent('WARN', 'DataMigration: Skipping invalid record in CSV.', { record });
                            continue;
                        }
                        const plant = plants.find(p => p.name.toLowerCase() === record.branchName.toLowerCase());
                        if (!plant) {
                            logAppEvent('WARN', `DataMigration: Skipping record with unknown branch: "${record.branchName}"`, { record });
                            continue;
                        }
                        batch.push(addHistoricalEntry({ ...record, branchId: plant.id }, user));
                    }
                    await Promise.all(batch);
                    onSuccess(`${batch.length} historical records uploaded successfully!`);
                } catch (error) {
                    logAppEvent('ERROR', 'DataMigration: Bulk upload failed.', { error: error.message });
                    onError("An error occurred during the bulk upload.");
                } finally {
                    setIsUploading(false);
                }
            },
            error: (error) => {
                logAppEvent('ERROR', 'DataMigration: CSV parsing failed.', { error: error.message });
                onError("Failed to parse CSV file.");
                setIsUploading(false);
            }
        });
    };

    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Bulk Upload from CSV</h3>
            <p className="text-sm text-gray-500 mb-4">Upload a CSV of individual sales with headers: `date`, `kgSold`, `amountPaid`, `branchName`, etc.</p>
            <label htmlFor="csv-upload" className="w-full inline-block cursor-pointer">
                <div className="flex items-center justify-center font-bold py-2 px-4 rounded-lg transition-colors duration-200 bg-gray-200 text-gray-800 hover:bg-gray-300">
                    <FileUp size={20} className="mr-2" />
                    {isUploading ? 'Uploading...' : 'Choose CSV File'}
                </div>
                <input id="csv-upload" type="file" accept=".csv" onChange={handleFileUpload} className="hidden" disabled={isUploading} />
            </label>
        </div>
    );
};

// --- End-of-Day Summary Form Component ---
const EndOfDaySummaryForm = ({ user, plants, plantsLoading, onSuccess, onError }) => {
    const initialExpenseState = { 
        description: '', 
        amount: '', 
        category: EXPENSE_CATEGORIES[0], 
        date: new Date().toISOString().split('T')[0] 
    };

    const initialFormState = {
        date: new Date().toISOString().split('T')[0],
        branchId: '',
        cashierName: '',
        openingMeterA: '', closingMeterA: '',
        openingMeterB: '', closingMeterB: '',
        pricePerKg: '1100',
        posAmount: '', cashAmount: '',
        expenses: [initialExpenseState],
    };

    const [formData, setFormData] = useState(initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    useEffect(() => {
        if (plants.length > 0 && !formData.branchId) {
            setFormData(prev => ({ ...prev, branchId: plants[0].id }));
        }
    }, [plants, formData.branchId]);
    
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleExpenseChange = (index, e) => {
        const updatedExpenses = formData.expenses.map((expense, i) => 
            index === i ? { ...expense, [e.target.name]: e.target.value } : expense
        );
        setFormData({ ...formData, expenses: updatedExpenses });
    };

    const addExpenseField = () => {
        setFormData({ ...formData, expenses: [...formData.expenses, initialExpenseState] });
    };

    const removeExpenseField = (index) => {
        const filteredExpenses = formData.expenses.filter((_, i) => i !== index);
        setFormData({ ...formData, expenses: filteredExpenses });
    };

    const calculations = useMemo(() => {
        const kgA = (parseFloat(formData.closingMeterA) || 0) - (parseFloat(formData.openingMeterA) || 0);
        const kgB = (parseFloat(formData.closingMeterB) || 0) - (parseFloat(formData.openingMeterB) || 0);
        const totalKgSold = kgA + kgB;
        const calculatedRevenue = totalKgSold * (parseFloat(formData.pricePerKg) || 0);
        const actualRevenue = (parseFloat(formData.posAmount) || 0) + (parseFloat(formData.cashAmount) || 0);
        const discrepancy = actualRevenue - calculatedRevenue;
        return { totalKgSold, calculatedRevenue, actualRevenue, discrepancy };
    }, [formData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await addDailySummary(formData, user);
            onSuccess(`Summary for ${formData.date} saved successfully.`);
            setFormData(prev => ({ ...initialFormState, branchId: prev.branchId }));
        } catch (error) {
            logAppEvent('ERROR', 'DataMigration: Failed to save daily summary.', { error: error.message });
            onError('Failed to save daily summary.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div><label className="block text-sm font-medium">Date</label><input type="date" name="date" value={formData.date} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" required /></div>
                <div><label className="block text-sm font-medium">Branch</label>{plantsLoading ? <p>Loading...</p> : (<select name="branchId" value={formData.branchId} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md bg-white" required>{plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>)}</div>
                <div><label className="block text-sm font-medium">Cashier Name</label><input type="text" name="cashierName" value={formData.cashierName} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" placeholder="e.g., Notiq" required /></div>
            </div>

            <div className="border-t pt-6"><h3 className="text-lg font-semibold text-gray-700">Meter Readings</h3><div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4"><input type="number" step="0.01" name="openingMeterA" value={formData.openingMeterA} onChange={handleChange} placeholder="Opening A (kg)" className="p-2 border rounded-md" /><input type="number" step="0.01" name="closingMeterA" value={formData.closingMeterA} onChange={handleChange} placeholder="Closing A (kg)" className="p-2 border rounded-md" /><div className="hidden md:block"></div><input type="number" step="0.01" name="openingMeterB" value={formData.openingMeterB} onChange={handleChange} placeholder="Opening B (kg)" className="p-2 border rounded-md" /><input type="number" step="0.01" name="closingMeterB" value={formData.closingMeterB} onChange={handleChange} placeholder="Closing B (kg)" className="p-2 border rounded-md" /></div></div>
            <div className="border-t pt-6"><h3 className="text-lg font-semibold text-gray-700">Sales & Revenue</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4"><input type="number" name="pricePerKg" value={formData.pricePerKg} onChange={handleChange} placeholder="Price per kg (₦)" className="p-2 border rounded-md" /><input type="number" name="posAmount" value={formData.posAmount} onChange={handleChange} placeholder="POS Amount (₦)" className="p-2 border rounded-md" /><input type="number" name="cashAmount" value={formData.cashAmount} onChange={handleChange} placeholder="Cash Amount (₦)" className="p-2 border rounded-md" /></div></div>
            <div className="p-4 bg-gray-50 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4 text-center"><div><p className="text-xs text-gray-500">Total KG Sold</p><p className="font-bold text-lg">{calculations.totalKgSold.toFixed(2)} kg</p></div><div><p className="text-xs text-gray-500">Calculated Revenue</p><p className="font-bold text-lg">{formatCurrency(calculations.calculatedRevenue)}</p></div><div><p className="text-xs text-gray-500">Actual Revenue</p><p className="font-bold text-lg">{formatCurrency(calculations.actualRevenue)}</p></div><div><p className="text-xs text-gray-500">Discrepancy</p><p className={`font-bold text-lg ${calculations.discrepancy >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(calculations.discrepancy)}</p></div></div>

            <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-700">Expenditure</h3>
                <div className="space-y-4 mt-4">
                    {formData.expenses.map((exp, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                            <input type="date" name="date" value={exp.date} onChange={(e) => handleExpenseChange(index, e)} className="p-2 border rounded-md" />
                            <select name="category" value={exp.category} onChange={(e) => handleExpenseChange(index, e)} className="p-2 border rounded-md bg-white">
                                {EXPENSE_CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
                            </select>
                            <input type="text" name="description" value={exp.description} onChange={(e) => handleExpenseChange(index, e)} placeholder="Description" className="p-2 border rounded-md" />
                            <div className="flex items-center gap-2">
                                <input type="number" name="amount" value={exp.amount} onChange={(e) => handleExpenseChange(index, e)} placeholder="Amount (₦)" className="flex-grow p-2 border rounded-md" />
                                <Button onClick={() => removeExpenseField(index)} variant="danger" icon={Trash2} />
                            </div>
                        </div>
                    ))}
                </div>
                <Button onClick={addExpenseField} icon={PlusCircle} variant="secondary" className="mt-2">Add Expense</Button>
            </div>

            <div className="flex justify-end pt-4 border-t">
                <Button type="submit" disabled={isSubmitting} icon={UploadCloud}>
                    {isSubmitting ? 'Saving...' : 'Save Daily Summary'}
                </Button>
            </div>
        </form>
    );
};

// --- Main Data Migration View (with tabs) ---
export default function DataMigration() {
    const { user } = useAuth();
    const { docs: plants, loading: plantsLoading } = useFirestoreQuery(getPlantsQuery());
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    const [activeTab, setActiveTab] = useState('summary');

    const handleSuccess = (message) => setNotification({ show: true, message, type: 'success' });
    const handleError = (message) => setNotification({ show: true, message, type: 'error' });

    return (
        <>
            <Notification notification={notification} setNotification={setNotification} />
            <PageTitle title="Historical Data Migration" subtitle="Enter past records using a daily summary or bulk CSV upload." />
            <Card>
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8">
                        <button onClick={() => setActiveTab('summary')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'summary' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                            End-of-Day Summary
                        </button>
                        <button onClick={() => setActiveTab('bulk')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'bulk' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                            Bulk Upload (CSV)
                        </button>
                    </nav>
                </div>
                {activeTab === 'summary' ? (
                    <EndOfDaySummaryForm user={user} plants={plants} plantsLoading={plantsLoading} onSuccess={handleSuccess} onError={handleError} />
                ) : (
                    <BulkUpload user={user} plants={plants} onSuccess={handleSuccess} onError={handleError} />
                )}
            </Card>
        </>
    );
}