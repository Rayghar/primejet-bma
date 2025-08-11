// src/views/05-Admin/DataMigration.js
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth'; // To get current user for submittedBy info
import { addDailySummary } from '../../api/dataEntryService'; // Import the new service function
import { getPlants } from '../../api/operationsService'; // Import to get plant list for dropdowns
import Papa from 'papaparse'; // For CSV parsing
import { EXPENSE_CATEGORIES } from '../../utils/constants'; // Assuming constants are available

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Notification from '../../components/shared/Notification';
import { UploadCloud, PlusCircle, Trash2, FileUp } from 'lucide-react'; // Icons
import { formatCurrency } from '../../utils/formatters';

// --- BulkUpload Component (for historical daily summaries via CSV) ---
const BulkUpload = ({ user, plants, onSuccess, onError }) => {
    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploading(true);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const records = results.data;
                    const uploadPromises = [];
                    
                    for (const record of records) {
                        // Skip completely empty rows
                        if (Object.values(record).every(value => !value)) {
                            console.warn('DataMigration: Skipping a completely empty row in CSV.');
                            continue;
                        }

                        const plant = plants.find(p => p.name?.toLowerCase() === record.branchName?.toLowerCase());
                        if (!plant) {
                            console.warn(`DataMigration: Skipping record with unknown branch: "${record.branchName}"`, { record });
                            continue;
                        }

                        const summaryDate = new Date(record.date);
                        if (isNaN(summaryDate.getTime())) {
                            console.error(`DataMigration: Skipping record with invalid date format: "${record.date}"`, { record });
                            continue;
                        }

                        // Parse expenses from CSV columns if available
                        const expenses = [];
                        if (record.expenseDescription && record.expenseAmount) {
                            expenses.push({
                                description: record.expenseDescription,
                                amount: parseFloat(record.expenseAmount) || 0,
                                category: record.expenseCategory || 'Other',
                                date: summaryDate,
                            });
                        }
                        // Add more expense fields if your CSV supports multiple expenses per summary row

                        const summaryData = {
                            date: summaryDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD string for consistency with other forms
                            branchId: plant.id,
                            cashierName: record.cashierName || user.email, // Use user email as fallback
                            meters: {
                                openingMeterA: parseFloat(record.openingMeterA) || 0,
                                closingMeterA: parseFloat(record.closingMeterA) || 0,
                                openingMeterB: parseFloat(record.openingMeterB) || 0,
                                closingMeterB: parseFloat(record.closingMeterB) || 0,
                                pricePerKg: parseFloat(record.pricePerKg) || 0,
                            },
                            sales: {
                                posAmount: parseFloat(record.posAmount) || 0,
                                cashAmount: parseFloat(record.cashAmount) || 0,
                                // totalRevenue will be calculated by backend
                            },
                            expenses: expenses,
                            status: 'approved', // Explicitly set status to 'approved' for historical data
                            // submittedBy and submittedAt will be set by backend
                        };
                        
                        uploadPromises.push(addDailySummary(summaryData)); // Call the service
                    }
                    
                    await Promise.all(uploadPromises); // Wait for all uploads to complete
                    onSuccess(`${uploadPromises.length} historical daily summaries uploaded successfully!`);
                } catch (error) {
                    console.error('DataMigration: Bulk upload failed.', error);
                    onError(`An error occurred during the bulk upload: ${error.response?.data?.message || error.message}`);
                } finally {
                    setIsUploading(false);
                }
            },
            error: (error) => {
                console.error('DataMigration: CSV parsing failed.', error);
                onError("Failed to parse CSV file. Please check its format.");
                setIsUploading(false);
            }
        });
    };

    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Bulk Upload from CSV</h3>
            <p className="text-sm text-gray-500 mb-4">
                Upload a CSV of daily summaries with headers: `date`, `branchName`, `cashierName`, `openingMeterA`, `closingMeterA`, `openingMeterB`, `closingMeterB`, `pricePerKg`, `posAmount`, `cashAmount`, `expenseDescription`, `expenseCategory`, and `expenseAmount`.
            </p>
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


// --- End-of-Day Summary Form Component (for live daily summaries) ---
const EndOfDaySummaryForm = ({ user, plants, plantsLoading, onSuccess, onError }) => {
    const initialExpenseState = { 
        description: '', 
        amount: '', 
        category: EXPENSE_CATEGORIES[0], 
        date: new Date().toISOString().split('T')[0] // Default to today's date
    };

    const initialFormState = {
        date: new Date().toISOString().split('T')[0],
        branchId: '',
        cashierName: '',
        meters: {
            openingMeterA: '', closingMeterA: '',
            openingMeterB: '', closingMeterB: '',
            pricePerKg: '1100', // Default price
        },
        sales: {
            posAmount: '', cashAmount: '',
        },
        expenses: [initialExpenseState], // Start with one empty expense field
    };

    const [formData, setFormData] = useState(initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Set default branch once plants are loaded
    useEffect(() => {
        if (plants.length > 0 && !formData.branchId) {
            setFormData(prev => ({ ...prev, branchId: plants[0].id }));
        }
    }, [plants, formData.branchId]);
    
    // Generic handler for top-level form data changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        // Handle nested meter/sales objects
        if (name.startsWith('meters.')) {
            const meterField = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                meters: { ...prev.meters, [meterField]: value }
            }));
        } else if (name.startsWith('sales.')) {
            const salesField = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                sales: { ...prev.sales, [salesField]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // Handler for changes within the dynamic expenses array
    const handleExpenseChange = (index, e) => {
        const { name, value } = e.target;
        const updatedExpenses = formData.expenses.map((expense, i) => 
            index === i ? { ...expense, [name]: value } : expense
        );
        setFormData({ ...formData, expenses: updatedExpenses });
    };

    // Adds a new empty expense field
    const addExpenseField = () => {
        setFormData({ ...formData, expenses: [...formData.expenses, initialExpenseState] });
    };

    // Removes an expense field
    const removeExpenseField = (index) => {
        const filteredExpenses = formData.expenses.filter((_, i) => i !== index);
        setFormData({ ...formData, expenses: filteredExpenses });
    };

    // Memoized calculations for display
    const calculations = useMemo(() => {
        const kgA = (parseFloat(formData.meters.closingMeterA) || 0) - (parseFloat(formData.meters.openingMeterA) || 0);
        const kgB = (parseFloat(formData.meters.closingMeterB) || 0) - (parseFloat(formData.meters.openingMeterB) || 0);
        const totalKgSold = kgA + kgB;
        const calculatedRevenue = totalKgSold * (parseFloat(formData.meters.pricePerKg) || 0);
        const actualRevenue = (parseFloat(formData.sales.posAmount) || 0) + (parseFloat(formData.sales.cashAmount) || 0);
        const discrepancy = actualRevenue - calculatedRevenue;
        return { totalKgSold, calculatedRevenue, actualRevenue, discrepancy };
    }, [formData.meters, formData.sales]);

    // Handles form submission for daily summary
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Basic validation
        if (!formData.date || !formData.branchId || !formData.cashierName || 
            !formData.meters.openingMeterA || !formData.meters.closingMeterA ||
            !formData.meters.pricePerKg || !formData.sales.posAmount || !formData.sales.cashAmount) {
            onError('Please fill in all required fields for meters and sales.');
            setIsSubmitting(false);
            return;
        }

        try {
            // Call the addDailySummary service function.
            // Status defaults to 'pending' on backend if not explicitly set here.
            await addDailySummary({ 
                ...formData,
                submittedBy: { uid: user.id, email: user.email }, // Pass user info
                // Backend will handle setting submittedAt and status (defaulting to 'pending')
            });
            onSuccess(`Summary for ${formData.date} saved successfully and submitted for approval.`);
            setFormData(prev => ({ ...initialFormState, branchId: prev.branchId })); // Reset form
        } catch (error) {
            console.error('DataMigration: Failed to save daily summary.', error);
            onError(error.response?.data?.message || 'Failed to save daily summary.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* General Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div><label htmlFor="summary-date" className="block text-sm font-medium">Date</label><input type="date" id="summary-date" name="date" value={formData.date} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" required /></div>
                <div><label htmlFor="summary-branch" className="block text-sm font-medium">Branch</label>{plantsLoading ? <p>Loading...</p> : (<select id="summary-branch" name="branchId" value={formData.branchId} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md bg-white" required>{plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>)}</div>
                <div><label htmlFor="summary-cashier" className="block text-sm font-medium">Cashier Name</label><input type="text" id="summary-cashier" name="cashierName" value={formData.cashierName} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" placeholder="e.g., Notiq" required /></div>
            </div>

            {/* Meter Readings */}
            <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-700">Meter Readings</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                    <input type="number" step="0.01" name="meters.openingMeterA" value={formData.meters.openingMeterA} onChange={handleChange} placeholder="Opening A (kg)" className="p-2 border rounded-md" required />
                    <input type="number" step="0.01" name="meters.closingMeterA" value={formData.meters.closingMeterA} onChange={handleChange} placeholder="Closing A (kg)" className="p-2 border rounded-md" required />
                    <div className="hidden md:block"></div> {/* Spacer */}
                    <input type="number" step="0.01" name="meters.openingMeterB" value={formData.meters.openingMeterB} onChange={handleChange} placeholder="Opening B (kg)" className="p-2 border rounded-md" />
                    <input type="number" step="0.01" name="meters.closingMeterB" value={formData.meters.closingMeterB} onChange={handleChange} placeholder="Closing B (kg)" className="p-2 border rounded-md" />
                </div>
            </div>

            {/* Sales & Revenue */}
            <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-700">Sales & Revenue</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                    <input type="number" name="meters.pricePerKg" value={formData.meters.pricePerKg} onChange={handleChange} placeholder="Price per kg (₦)" className="p-2 border rounded-md" required />
                    <input type="number" name="sales.posAmount" value={formData.sales.posAmount} onChange={handleChange} placeholder="POS Amount (₦)" className="p-2 border rounded-md" required />
                    <input type="number" name="sales.cashAmount" value={formData.sales.cashAmount} onChange={handleChange} placeholder="Cash Amount (₦)" className="p-2 border rounded-md" required />
                </div>
            </div>

            {/* Calculations Summary */}
            <div className="p-4 bg-gray-50 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div><p className="text-xs text-gray-500">Total KG Sold</p><p className="font-bold text-lg">{calculations.totalKgSold.toFixed(2)} kg</p></div>
                <div><p className="text-xs text-gray-500">Calculated Revenue</p><p className="font-bold text-lg">{formatCurrency(calculations.calculatedRevenue)}</p></div>
                <div><p className="text-xs text-gray-500">Actual Revenue</p><p className="font-bold text-lg">{formatCurrency(calculations.actualRevenue)}</p></div>
                <div><p className="text-xs text-gray-500">Discrepancy</p><p className={`font-bold text-lg ${calculations.discrepancy >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(calculations.discrepancy)}</p></div>
            </div>

            {/* Expenditure */}
            <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-700">Expenditure</h3>
                <div className="space-y-4 mt-4">
                    {formData.expenses.map((exp, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                            <input type="date" name="date" value={exp.date} onChange={(e) => handleExpenseChange(index, e)} className="p-2 border rounded-md" required />
                            <select name="category" value={exp.category} onChange={(e) => handleExpenseChange(index, e)} className="p-2 border rounded-md bg-white" required>
                                {EXPENSE_CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
                            </select>
                            <input type="text" name="description" value={exp.description} onChange={(e) => handleExpenseChange(index, e)} placeholder="Description" className="p-2 border rounded-md" required />
                            <div className="flex items-center gap-2">
                                <input type="number" name="amount" value={exp.amount} onChange={(e) => handleExpenseChange(index, e)} placeholder="Amount (₦)" className="flex-grow p-2 border rounded-md" required />
                                {formData.expenses.length > 1 && ( // Allow removing only if more than one expense field
                                    <Button onClick={() => removeExpenseField(index)} variant="danger" icon={Trash2} />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <Button onClick={addExpenseField} icon={PlusCircle} variant="secondary" className="mt-2">Add Expense</Button>
            </div>

            {/* Submit Button */}
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
    const { user } = useAuth(); // Get current user for forms
    const [plants, setPlants] = useState([]); // State to hold plant list for dropdowns
    const [plantsLoading, setPlantsLoading] = useState(true);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    const [activeTab, setActiveTab] = useState('summary'); // Default to End-of-Day Summary tab

    // Fetch plants for the dropdowns in both forms
    useEffect(() => {
        const fetchPlants = async () => {
            setPlantsLoading(true);
            try {
                const plantList = await getPlants();
                setPlants(plantList);
            } catch (error) {
                console.error('Failed to fetch plants for data migration forms:', error);
            } finally {
                setPlantsLoading(false);
            }
        };
        fetchPlants();
    }, []);

    // Notification handlers
    const handleSuccess = (message) => setNotification({ show: true, message, type: 'success' });
    const handleError = (message) => setNotification({ show: true, message, type: 'error' });

    return (
        <>
            <Notification notification={notification} setNotification={setNotification} />
            <PageTitle title="Historical Data Migration" subtitle="Enter past records using a daily summary or bulk CSV upload." />
            <Card>
                {/* Tab Navigation */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8">
                        <button 
                            onClick={() => setActiveTab('summary')} 
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'summary' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            End-of-Day Summary
                        </button>
                        <button 
                            onClick={() => setActiveTab('bulk')} 
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'bulk' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Bulk Upload (CSV)
                        </button>
                    </nav>
                </div>

                {/* Conditional Rendering of Forms based on activeTab */}
                {activeTab === 'summary' ? (
                    <EndOfDaySummaryForm 
                        user={user} 
                        plants={plants} 
                        plantsLoading={plantsLoading} 
                        onSuccess={handleSuccess} 
                        onError={handleError} 
                    />
                ) : (
                    <BulkUpload 
                        user={user} 
                        plants={plants} 
                        onSuccess={handleSuccess} 
                        onError={handleError} 
                    />
                )}
            </Card>
        </>
    );
}