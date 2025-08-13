// src/views/04-DataEntry/DailyLog.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getPlants } from '../../api/operationsService';
import {
    createOrGetDailySummary,
    updateSummaryMeters,
    createSaleEntry,
    createExpenseEntry,
    getDailyEntries,
    finalizeDailySummary,
} from '../../api/dataEntryService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Notification from '../../components/shared/Notification';
import Button from '../../components/shared/Button';
import { FileText, TrendingUp, TrendingDown } from 'lucide-react';

const TransactionEntry = ({ entry }) => {
    const isSale = !!entry.transactionType;
    return (
        <tr className="border-b last:border-b-0">
            <td className="py-2 px-4 text-sm font-medium text-gray-900">{isSale ? 'Sale' : 'Expense'}</td>
            <td className="py-2 px-4 text-sm text-gray-500">{formatDate(entry.createdAt, true)}</td>
            <td className="py-2 px-4 text-sm text-gray-500">{isSale ? `${entry.kgSold?.toFixed(2) || '0.00'} kg` : entry.description}</td>
            <td className="py-2 px-4 text-sm text-gray-500">{formatCurrency(entry.amount)}</td>
            <td className="py-2 px-4 text-sm text-gray-500">{isSale ? entry.transactionType : 'N/A'}</td>
            <td className="py-2 px-4 text-sm text-gray-500">
                <button className="text-blue-500 hover:text-blue-700 font-medium">Print Receipt</button>
            </td>
        </tr>
    );
};

const EXPENSE_CATEGORIES = [
    'Fuel',
    'Maintenance',
    'Salaries',
    'Utilities',
    'Miscellaneous',
];

export default function DailyLog() {
    const { user } = useAuth();
    const [dailySummary, setDailySummary] = useState(null);
    const [plants, setPlants] = useState([]);
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const [plantsLoading, setPlantsLoading] = useState(true);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    const [dailyEntries, setDailyEntries] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    
    const initialMetersState = {
        openingMeterA: 0,
        openingMeterB: 0,
        closingMeterA: 0,
        closingMeterB: 0,
        pricePerKg: 1100,
    };

    const [metersFormData, setMetersFormData] = useState(initialMetersState);
    const [saleFormData, setSaleFormData] = useState({ amount: '', kgSold: '', transactionType: 'POS' });
    const [expenseFormData, setExpenseFormData] = useState({ category: EXPENSE_CATEGORIES[0], amount: '', description: '' });

    const handleSuccess = (message) => setNotification({ show: true, message, type: 'success' });
    const handleError = (message) => setNotification({ show: true, message, type: 'error' });

    const isOpeningMetersEntered = useMemo(() => {
        return dailySummary?.openingMeters?.meterA > 0 || dailySummary?.openingMeters?.meterB > 0;
    }, [dailySummary]);

    const isClosingMetersEntered = useMemo(() => {
        return dailySummary?.closingMeters?.meterA > 0 || dailySummary?.closingMeters?.meterB > 0;
    }, [dailySummary]);

    useEffect(() => {
        const fetchPlants = async () => {
            setPlantsLoading(true);
            try {
                const plantList = await getPlants();
                setPlants(plantList);
                if (plantList.length > 0) {
                    setSelectedBranchId(plantList[0].id);
                }
            } catch (error) {
                handleError('Failed to fetch plant list.');
            } finally {
                setPlantsLoading(false);
            }
        };
        fetchPlants();
    }, []);

    useEffect(() => {
        const initializeDailyLog = async () => {
            if (!selectedBranchId || !user) return;

            console.debug(`[DEBUG] DailyLog: Initializing for branch ID: ${selectedBranchId}`);
            try {
                const newSummary = await createOrGetDailySummary(
                    selectedBranchId,
                    user.name,
                    initialMetersState.pricePerKg
                );
                setDailySummary(newSummary);
                setMetersFormData({
                    openingMeterA: newSummary.openingMeters?.meterA || 0,
                    openingMeterB: newSummary.openingMeters?.meterB || 0,
                    closingMeterA: newSummary.closingMeters?.meterA || 0,
                    closingMeterB: newSummary.closingMeters?.meterB || 0,
                    pricePerKg: newSummary.pricePerKg || initialMetersState.pricePerKg,
                });
                handleSuccess('Daily log initialized.');
            } catch (error) {
                console.error('[DEBUG] DailyLog: Initialization error:', error);
                handleError('Failed to initialize daily log.');
            }
        };

        initializeDailyLog();
    }, [selectedBranchId, user]);

    useEffect(() => {
        const fetchEntries = async () => {
            if (dailySummary?._id) {
                const entries = await getDailyEntries(dailySummary._id);
                setDailyEntries(entries);
            }
        };
        if (isOpeningMetersEntered) {
            fetchEntries();
        }
    }, [dailySummary, isOpeningMetersEntered]);

    const handleMetersChange = (e) => {
        const { name, value } = e.target;
        setMetersFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0, }));
    };

    const handleUpdateMeters = async (e) => {
        e.preventDefault();
        if (!dailySummary?._id) {
            handleError('Daily summary not found.');
            return;
        }

        setIsSaving(true);
        try {
            const updatedSummary = await updateSummaryMeters(dailySummary._id, {
                openingMeters: { meterA: metersFormData.openingMeterA, meterB: metersFormData.openingMeterB },
                closingMeters: { meterA: metersFormData.closingMeterA, meterB: metersFormData.closingMeterB },
                pricePerKg: metersFormData.pricePerKg
            });
            setDailySummary(updatedSummary);
            handleSuccess('Meter readings updated successfully.');
        } catch (error) {
            handleError('Failed to update meter readings.');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleSaleFormChange = (e) => {
        const { name, value } = e.target;
        setSaleFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaleCalculation = (e) => {
        const { name, value } = e.target;
        const pricePerKg = dailySummary?.pricePerKg || 1100;
        if (name === 'amount' && value) {
            setSaleFormData({ amount: value, kgSold: (parseFloat(value) / pricePerKg).toFixed(2), transactionType: saleFormData.transactionType });
        } else if (name === 'kgSold' && value) {
            setSaleFormData({ kgSold: value, amount: (parseFloat(value) * pricePerKg).toFixed(2), transactionType: saleFormData.transactionType });
        } else {
            setSaleFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleExpenseFormChange = (e) => {
        const { name, value } = e.target;
        setExpenseFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLogSale = async (e) => {
        e.preventDefault();
        if (!dailySummary?._id) {
            handleError('Daily summary not found.');
            return;
        }

        setIsSaving(true);
        try {
            const saleData = {
                dailySummaryId: dailySummary._id,
                branchId: dailySummary.branchId,
                transactionType: saleFormData.transactionType,
                amount: parseFloat(saleFormData.amount),
                kgSold: parseFloat(saleFormData.kgSold),
                pricePerKg: dailySummary.pricePerKg,
            };
            await createSaleEntry(saleData);
            const [entries, updatedSummary] = await Promise.all([
                getDailyEntries(dailySummary._id),
                createOrGetDailySummary(dailySummary.branchId, user.name, dailySummary.pricePerKg)
            ]);
            setDailyEntries(entries);
            setDailySummary(updatedSummary);
            setSaleFormData({ amount: '', kgSold: '', transactionType: 'POS' });
            handleSuccess('Sale logged successfully.');
        } catch (error) {
            handleError('Failed to log sale.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogExpense = async (e) => {
        e.preventDefault();
        if (!dailySummary?._id) {
            handleError('Daily summary not found.');
            return;
        }

        setIsSaving(true);
        try {
            const expenseData = {
                dailySummaryId: dailySummary._id,
                branchId: dailySummary.branchId,
                category: expenseFormData.category,
                amount: parseFloat(expenseFormData.amount),
                description: expenseFormData.description,
            };
            await createExpenseEntry(expenseData);
            const [entries, updatedSummary] = await Promise.all([
                getDailyEntries(dailySummary._id),
                createOrGetDailySummary(dailySummary.branchId, user.name, dailySummary.pricePerKg)
            ]);
            setDailyEntries(entries);
            setDailySummary(updatedSummary);
            setExpenseFormData({ category: EXPENSE_CATEGORIES[0], amount: '', description: '' });
            handleSuccess('Expense logged successfully.');
        } catch (error) {
            handleError('Failed to log expense.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleFinalizeDailySummary = async () => {
        if (!window.confirm("Are you sure you want to finalize today's daily summary?")) return;
        
        if (!dailySummary?._id) {
            handleError('Daily summary not found.');
            return;
        }

        setIsSaving(true);
        try {
            await finalizeDailySummary(dailySummary._id);
            handleSuccess('Daily summary finalized and submitted for approval!');
            setDailySummary(null);
            setDailyEntries([]);
            setSelectedBranchId(plants.length > 0 ? plants[0].id : '');
        } catch (error) {
            handleError('Failed to finalize daily summary.');
        } finally {
            setIsSaving(false);
        }
    };

    const dailyCalculations = useMemo(() => {
        if (!dailySummary) return {};
        const meterA_kg = dailySummary.closingMeters?.meterA - dailySummary.openingMeters?.meterA;
        const meterB_kg = dailySummary.closingMeters?.meterB - dailySummary.openingMeters?.meterB;
        const totalMetersKg = (meterA_kg || 0) + (meterB_kg || 0);
        
        const calculatedRevenue = totalMetersKg * (dailySummary.pricePerKg || 0);
        const actualRevenue = dailySummary.sales.totalRevenue;
        const discrepancy = actualRevenue - calculatedRevenue;
        
        return { totalMetersKg, calculatedRevenue, actualRevenue, discrepancy };
    }, [dailySummary]);

    if (plantsLoading) {
        return <Card><p className="p-8 text-center">Loading...</p></Card>;
    }

    return (
        <>
            <Notification notification={notification} setNotification={setNotification} />
            <PageTitle title="Daily Transaction Log (POS)" />

            {/* START: New section with the requested fields */}
            <Card className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                        <label htmlFor="branch" className="block text-sm font-medium text-gray-700">Branch</label>
                        <select
                            id="branch"
                            name="branch"
                            className="p-2 border rounded-md w-full"
                            value={selectedBranchId}
                            onChange={(e) => setSelectedBranchId(e.target.value)}
                        >
                            {plants.map(plant => (
                                <option key={plant.id} value={plant.id}>{plant.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="cashierName" className="block text-sm font-medium text-gray-700">Cashier Name</label>
                        <input type="text" id="cashierName" name="cashierName" value={user?.name || 'N/A'} className="p-2 border rounded-md w-full bg-gray-100" readOnly />
                    </div>
                    <div>
                        <label htmlFor="pricePerKg" className="block text-sm font-medium text-gray-700">Price per KG (₦)</label>
                        <input type="text" id="pricePerKg" name="pricePerKg" value={formatCurrency(dailySummary?.pricePerKg || 0, 'NGN', 'en-NG', false)} className="p-2 border rounded-md w-full bg-gray-100" readOnly />
                    </div>
                    <div>
                        <label htmlFor="dailySummaryId" className="block text-sm font-medium text-gray-700">Summary ID</label>
                        <input type="text" id="dailySummaryId" name="dailySummaryId" value={dailySummary?._id || 'N/A'} className="p-2 border rounded-md w-full bg-gray-100" readOnly />
                    </div>
                </div>
            </Card>
            {/* END: New section */}

            <Card className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Reconciliation & Finalization</h3>
                <form onSubmit={handleUpdateMeters} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="openingMeterA" className="block text-sm font-medium text-gray-700">Opening Meter A (kg)</label>
                            <input type="number" step="0.01" id="openingMeterA" name="openingMeterA" value={metersFormData.openingMeterA} onChange={handleMetersChange} placeholder="Opening Meter A (kg)" className="p-2 border rounded-md w-full" required />
                        </div>
                        <div>
                            <label htmlFor="closingMeterA" className="block text-sm font-medium text-gray-700">Closing Meter A (kg)</label>
                            <input type="number" step="0.01" id="closingMeterA" name="closingMeterA" value={metersFormData.closingMeterA} onChange={handleMetersChange} placeholder="Closing Meter A (kg)" className="p-2 border rounded-md w-full" disabled={!isOpeningMetersEntered} required />
                        </div>
                        <div>
                            <label htmlFor="openingMeterB" className="block text-sm font-medium text-gray-700">Opening Meter B (kg)</label>
                            <input type="number" step="0.01" id="openingMeterB" name="openingMeterB" value={metersFormData.openingMeterB} onChange={handleMetersChange} placeholder="Opening Meter B (kg)" className="p-2 border rounded-md w-full" />
                        </div>
                        <div>
                            <label htmlFor="closingMeterB" className="block text-sm font-medium text-gray-700">Closing Meter B (kg)</label>
                            <input type="number" step="0.01" id="closingMeterB" name="closingMeterB" value={metersFormData.closingMeterB} onChange={handleMetersChange} placeholder="Closing Meter B (kg)" className="p-2 border rounded-md w-full" disabled={!isOpeningMetersEntered} />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSaving}>Update Meters</Button>
                    </div>
                </form>

                {isOpeningMetersEntered && (
                    <>
                        <div className="p-4 bg-gray-50 rounded-lg grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 text-center">
                            <div><p className="text-xs text-gray-500">Total KG Sold (Meters)</p><p className="font-bold text-lg">{dailyCalculations.totalMetersKg?.toFixed(2) || '0.00'} kg</p></div>
                            <div><p className="text-xs text-gray-500">Calculated Revenue</p><p className="font-bold text-lg">{formatCurrency(dailyCalculations.calculatedRevenue || 0)}</p></div>
                            <div><p className="text-xs text-gray-500">Actual Revenue</p><p className="font-bold text-lg">{formatCurrency(dailyCalculations.actualRevenue || 0)}</p></div>
                            <div><p className={`text-xs text-gray-500`}>Discrepancy</p><p className={`font-bold text-lg ${dailyCalculations.discrepancy >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(dailyCalculations.discrepancy || 0)}</p></div>
                        </div>
                        <div className="flex justify-end mt-6 border-t pt-6">
                            <Button onClick={handleFinalizeDailySummary} disabled={isSaving || !isClosingMetersEntered}>Finalize Day & Submit for Approval</Button>
                        </div>
                    </>
                )}
            </Card>
            
            {isOpeningMetersEntered && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <Card>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center"><TrendingUp className="mr-2" /> Log New Sale</h3>
                        <form onSubmit={handleLogSale} className="space-y-4">
                            <input type="number" step="0.01" name="amount" value={saleFormData.amount} onChange={handleSaleCalculation} placeholder="Amount (₦)" className="p-2 w-full border rounded-md" required />
                            <input type="number" step="0.01" name="kgSold" value={saleFormData.kgSold} onChange={handleSaleCalculation} placeholder="KG Sold" className="p-2 w-full border rounded-md" required />
                            <select name="transactionType" value={saleFormData.transactionType} onChange={handleSaleFormChange} className="p-2 w-full border rounded-md">
                                <option value="POS">POS</option>
                                <option value="CASH">CASH</option>
                                <option value="TRANSFER">TRANSFER</option>
                            </select>
                            <Button type="submit" className="w-full" disabled={isSaving}>Add Sale</Button>
                        </form>
                    </Card>

                    <Card>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center"><TrendingDown className="mr-2" /> Log New Expense</h3>
                        <form onSubmit={handleLogExpense} className="space-y-4">
                            <select name="category" value={expenseFormData.category} onChange={handleExpenseFormChange} className="p-2 w-full border rounded-md" required>
                                {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                            <input type="text" name="description" value={expenseFormData.description} onChange={handleExpenseFormChange} placeholder="Description (e.g., 'Office supplies')" className="p-2 w-full border rounded-md" required />
                            <input type="number" step="0.01" name="amount" value={expenseFormData.amount} onChange={handleExpenseFormChange} placeholder="Amount (₦)" className="p-2 w-full border rounded-md" required />
                            <Button type="submit" className="w-full" disabled={isSaving}>Add Expense</Button>
                        </form>
                    </Card>
                </div>
            )}

            {isOpeningMetersEntered && (
                <Card>
                    <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                        <FileText className="mr-2" /> Daily Entries
                    </h3>
                    {dailyEntries.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {dailyEntries.map(entry => (
                                        <TransactionEntry key={entry._id} entry={entry} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-4">No transactions logged yet.</p>
                    )}
                </Card>
            )}
        </>
    );
}