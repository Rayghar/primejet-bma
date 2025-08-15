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

// ## Component 1: Receipt Preview Modal ##
const ReceiptPreviewModal = ({ entry, onClose }) => {
    if (!entry) return null;

    const companyInfo = {
        name: 'Your Company Name',
        address: '123 Gas Lane, City, State',
    };

    const isSale = entry.type === 'sale';

    return (
        // Backdrop
        <div 
            onClick={onClose} 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
        >
            {/* Modal Content */}
            <div 
                onClick={(e) => e.stopPropagation()} 
                className="bg-white p-5 rounded-lg shadow-xl w-full max-w-xs font-mono text-sm"
            >
                {/* Header */}
                <div className="text-center border-b pb-4 mb-4 border-dashed">
                    <h3 className="font-bold text-lg">{companyInfo.name}</h3>
                    <p className="text-xs">{companyInfo.address}</p>
                </div>

                {/* Body */}
                <div className="space-y-2">
                    <h4 className="text-center font-bold mb-4">{isSale ? 'SALE RECEIPT' : 'EXPENSE VOUCHER'}</h4>
                    <div className="flex justify-between">
                        <span>Receipt #:</span>
                        <span>{entry._id.slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Date:</span>
                        <span>{new Date(entry.createdAt).toLocaleDateString('en-GB')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Time:</span>
                        <span>{new Date(entry.createdAt).toLocaleTimeString('en-US', { hour12: true })}</span>
                    </div>
                    <div className="border-t my-2 border-dashed"></div>

                    {isSale ? (
                        <>
                            <div className="flex justify-between font-bold">
                                <span>Item</span>
                                <span>Amount</span>
                            </div>
                            <div className="border-t my-2 border-dashed"></div>
                            <div className="flex justify-between">
                                <span>LPG Gas ({entry.kgSold.toFixed(2)} kg)</span>
                                <span>{formatCurrency(entry.amount)}</span>
                            </div>
                            <div className="border-t mt-4 border-double border-black"></div>
                            <div className="flex justify-between font-bold text-base">
                                <span>TOTAL:</span>
                                <span>{formatCurrency(entry.amount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Payment:</span>
                                <span>{entry.transactionType}</span>
                            </div>
                        </>
                    ) : (
                        <>
                           <div className="flex justify-between">
                                <span>Category:</span>
                                <span>{entry.category}</span>
                            </div>
                             <div className="flex justify-between">
                                <span>Details:</span>
                                <span className="text-right pl-2">{entry.description}</span>
                            </div>
                            <div className="border-t mt-4 border-double border-black"></div>
                            <div className="flex justify-between font-bold text-base">
                                <span>TOTAL:</span>
                                <span>{formatCurrency(entry.amount)}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center border-t pt-4 mt-4 border-dashed">
                    <p>Thank you!</p>
                    <button 
                        onClick={onClose} 
                        className="mt-4 bg-gray-600 text-white px-4 py-2 rounded-lg w-full font-sans"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};


// ## Component 2: Table Row Entry ##
const TransactionEntry = ({ entry, onPreview }) => {
    const isSale = entry.type === 'sale';

    const handlePrintReceipt = () => {
        if (!isSale) {
            alert('Printing receipts is only available for sales.');
            return;
        }

        const companyInfo = {
            name: 'YOUR COMPANY NAME',
            address: '123 Gas Lane, City, State',
            phone: '123-456-7890',
            website: 'www.yourcompany.com',
        };
        const RECEIPT_WIDTH = 32;

        const centerText = (text) => {
            const padding = Math.floor((RECEIPT_WIDTH - text.length) / 2);
            return ' '.repeat(padding > 0 ? padding : 0) + text;
        };

        const alignLeftRight = (left, right) => {
            const space = RECEIPT_WIDTH - left.length - right.length;
            return left + ' '.repeat(space > 0 ? space : 0) + right;
        };

        const divider = (char = '-') => char.repeat(RECEIPT_WIDTH);

        const now = new Date(entry.createdAt);
        const formattedDate = now.toLocaleDateString('en-GB');
        const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

        let receiptLines = [];
        receiptLines.push(centerText(companyInfo.name));
        receiptLines.push(centerText(companyInfo.address));
        receiptLines.push(centerText(`Phone: ${companyInfo.phone}`));
        receiptLines.push(divider('='));
        receiptLines.push(centerText('SALES RECEIPT'));
        receiptLines.push(divider());
        receiptLines.push(alignLeftRight(`Receipt #:`, entry._id.slice(-8).toUpperCase()));
        receiptLines.push(alignLeftRight(`Date: ${formattedDate}`, `Time: ${formattedTime}`));
        receiptLines.push(alignLeftRight(`Cashier:`, entry.cashierEmail || 'N/A'));
        receiptLines.push(divider());
        receiptLines.push(alignLeftRight('Item', 'Amount'));
        receiptLines.push(divider());
        
        const itemName = `LPG Gas (${entry.kgSold.toFixed(2)} kg)`;
        const itemAmount = `NGN ${entry.amount.toLocaleString()}`;
        receiptLines.push(alignLeftRight(itemName, itemAmount));
        receiptLines.push(divider('='));
        
        receiptLines.push(alignLeftRight('TOTAL', `NGN ${entry.amount.toLocaleString()}`));
        receiptLines.push(alignLeftRight('Payment:', entry.transactionType));
        receiptLines.push(divider('='));
        receiptLines.push('');
        receiptLines.push(centerText('Thank you for your patronage!'));
        receiptLines.push(centerText(companyInfo.website));
        receiptLines.push('\n\n\n');

        const receiptText = receiptLines.join('\n');

        try {
            const base64Text = btoa(unescape(encodeURIComponent(receiptText)));
            const rawbtUrl = `rawbt:${base64Text}`;
            window.open(rawbtUrl, '_blank');
        } catch (error) {
            console.error('Failed to generate or send receipt to RAWBT:', error);
            alert('Could not print receipt. Please ensure the RAWBT app is installed on this device.');
        }
    };

    return (
        <tr className="border-b last:border-b-0">
            <td className="py-2 px-4 text-sm font-medium text-gray-900">{isSale ? 'Sale' : 'Expense'}</td>
            <td className="py-2 px-4 text-sm text-gray-500">{formatDate(entry.createdAt)}</td>
            <td className="py-2 px-4 text-sm text-gray-500">{isSale ? `${entry.kgSold?.toFixed(2) || '0.00'} kg` : entry.description}</td>
            <td className="py-2 px-4 text-sm text-gray-500">{formatCurrency(entry.amount)}</td>
            <td className="py-2 px-4 text-sm text-gray-500">{isSale ? entry.transactionType : entry.category}</td>
            <td className="py-2 px-4 text-sm text-gray-500 space-x-4 flex items-center">
                <button
                    onClick={() => onPreview(entry)}
                    className="text-green-600 hover:text-green-800 font-medium"
                >
                    View
                </button>
                <button
                    onClick={handlePrintReceipt}
                    className="text-blue-500 hover:text-blue-700 font-medium disabled:text-gray-400"
                    disabled={!isSale}
                >
                    Print
                </button>
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

// ## Component 3: Main Page Component ##
export default function DailyLog() {
    const { user } = useAuth();
    const [dailySummary, setDailySummary] = useState(null);
    const [plants, setPlants] = useState([]);
    const [plantsLoading, setPlantsLoading] = useState(true);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    const [dailyEntries, setDailyEntries] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState('');
    const [previewedEntry, setPreviewedEntry] = useState(null);

    const initialMetersState = {
        openingMeterA: 0, openingMeterB: 0,
        closingMeterA: 0, closingMeterB: 0,
        pricePerKg: 1100,
    };
    const [metersFormData, setMetersFormData] = useState(initialMetersState);
    const [saleFormData, setSaleFormData] = useState({ amount: '', kgSold: '', transactionType: 'POS' });
    const [expenseFormData, setExpenseFormData] = useState({ category: EXPENSE_CATEGORIES[0], amount: '', description: '' });
    
    const handleSuccess = useCallback((message) => setNotification({ show: true, message, type: 'success' }), []);
    const handleError = useCallback((message) => setNotification({ show: true, message, type: 'error' }), []);
    
    const isClosingMetersEntered = useMemo(() => {
        return (metersFormData.closingMeterA > 0 || metersFormData.closingMeterB > 0);
    }, [metersFormData]);
    
    useEffect(() => {
        const initializeDailyLog = async () => {
            setPlantsLoading(true);
            try {
                const plantList = await getPlants();
                setPlants(plantList);
                if (plantList.length > 0) {
                    setSelectedBranch(plantList[0]._id);
                }
            } catch (error) {
                handleError('Failed to load branches.');
            } finally {
                setPlantsLoading(false);
            }
        };
        initializeDailyLog();
    }, [handleError]);
    
    useEffect(() => {
        const fetchDailySummary = async () => {
            if (!selectedBranch || !user) return;
            try {
                const newSummary = await createOrGetDailySummary(selectedBranch, user.name || 'Unknown Cashier', metersFormData.pricePerKg);
                setDailySummary(newSummary);
                setMetersFormData({
                    openingMeterA: newSummary.openingMeters?.meterA || 0,
                    openingMeterB: newSummary.openingMeters?.meterB || 0,
                    closingMeterA: newSummary.closingMeters?.meterA || 0,
                    closingMeterB: newSummary.closingMeters?.meterB || 0,
                    pricePerKg: newSummary.pricePerKg || initialMetersState.pricePerKg,
                });
            } catch (error) {
                handleError('Failed to initialize daily log: ' + (error.response?.data?.error || error.message));
            }
        };
        if (selectedBranch) fetchDailySummary();
    }, [selectedBranch, user, metersFormData.pricePerKg, handleError, initialMetersState.pricePerKg]);
    
    useEffect(() => {
        const fetchEntries = async () => {
            if (dailySummary?._id) {
                try {
                    const entries = await getDailyEntries(dailySummary._id);
                    setDailyEntries(entries);
                } catch (error) {
                    handleError('Failed to fetch daily entries.');
                }
            }
        };
        if (dailySummary) fetchEntries();
    }, [dailySummary, handleError]);
    
    const handleMetersChange = useCallback((e) => {
        const { name, value } = e.target;
        setMetersFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    }, []);
    
    const handleBranchChange = useCallback((e) => {
        setSelectedBranch(e.target.value);
        setDailySummary(null);
    }, []);
    
    const handleUpdateMeters = useCallback(async (e) => {
        e.preventDefault();
        if (!dailySummary?._id) return handleError('Daily summary not found.');
        setIsSaving(true);
        try {
            const updatedSummary = await updateSummaryMeters(dailySummary._id, {
                openingMeters: { meterA: metersFormData.openingMeterA, meterB: metersFormData.openingMeterB },
                closingMeters: { meterA: metersFormData.closingMeterA, meterB: metersFormData.closingMeterB },
                pricePerKg: metersFormData.pricePerKg,
            });
            setDailySummary(updatedSummary);
            handleSuccess('Meter readings updated successfully.');
        } catch (error) {
            handleError('Failed to update meter readings.');
        } finally {
            setIsSaving(false);
        }
    }, [dailySummary, metersFormData, handleSuccess, handleError]);
    
    const handleSaleFormChange = useCallback((e) => {
        const { name, value } = e.target;
        setSaleFormData(prev => ({ ...prev, [name]: value }));
    }, []);
    
    const handleSaleCalculation = useCallback((e) => {
        const { name, value } = e.target;
        const pricePerKg = metersFormData.pricePerKg || 1100;
        if (name === 'amount' && value) {
            setSaleFormData({ ...saleFormData, amount: value, kgSold: (parseFloat(value) / pricePerKg).toFixed(2) });
        } else if (name === 'kgSold' && value) {
            setSaleFormData({ ...saleFormData, kgSold: value, amount: (parseFloat(value) * pricePerKg).toFixed(2) });
        }
    }, [metersFormData.pricePerKg, saleFormData]);
    
    const handleExpenseFormChange = useCallback((e) => {
        const { name, value } = e.target;
        setExpenseFormData(prev => ({ ...prev, [name]: value }));
    }, []);
    
    const handleLogSale = useCallback(async (e) => {
        e.preventDefault();
        if (!dailySummary?._id || dailySummary.status === 'pending_approval') return handleError('Cannot log sale: Invalid summary or awaiting manager approval.');
        setIsSaving(true);
        try {
            const saleData = {
                dailySummaryId: dailySummary._id, branchId: dailySummary.branchId, cashierId: user.id,
                transactionType: saleFormData.transactionType, amount: parseFloat(saleFormData.amount),
                kgSold: parseFloat(saleFormData.kgSold), pricePerKg: metersFormData.pricePerKg,
                date: new Date().toISOString(),
                cashierEmail: user.email // Pass cashier email
            };
            await createSaleEntry(saleData);
            const updatedEntries = await getDailyEntries(dailySummary._id);
            setDailyEntries(updatedEntries);
            const refreshedSummary = await createOrGetDailySummary(selectedBranch, user.name || 'Unknown Cashier', metersFormData.pricePerKg);
            setDailySummary(refreshedSummary);
            setSaleFormData({ amount: '', kgSold: '', transactionType: 'POS' });
            handleSuccess('Sale logged successfully.');
        } catch (error) {
            handleError('Failed to log sale.');
        } finally {
            setIsSaving(false);
        }
    }, [dailySummary, saleFormData, user, metersFormData.pricePerKg, selectedBranch, handleSuccess, handleError]);
    
    const handleLogExpense = useCallback(async (e) => {
        e.preventDefault();
        if (!dailySummary?._id || dailySummary.status === 'pending_approval') return handleError('Cannot log expense: Invalid summary or awaiting manager approval.');
        setIsSaving(true);
        try {
            const expenseData = {
                dailySummaryId: dailySummary._id, branchId: dailySummary.branchId, cashierId: user.id,
                category: expenseFormData.category, amount: parseFloat(expenseFormData.amount),
                description: expenseFormData.description || `Expense for ${expenseFormData.category}`,
                date: new Date().toISOString(),
            };
            await createExpenseEntry(expenseData);
            const updatedEntries = await getDailyEntries(dailySummary._id);
            setDailyEntries(updatedEntries);
            const refreshedSummary = await createOrGetDailySummary(selectedBranch, user.name || 'Unknown Cashier', metersFormData.pricePerKg);
            setDailySummary(refreshedSummary);
            setExpenseFormData({ category: EXPENSE_CATEGORIES[0], amount: '', description: '' });
            handleSuccess('Expense logged successfully.');
        } catch (error) {
            handleError('Failed to log expense.');
        } finally {
            setIsSaving(false);
        }
    }, [dailySummary, expenseFormData, user.id, selectedBranch, user.name, metersFormData.pricePerKg, handleSuccess, handleError]);
    
    const handleFinalizeDailySummary = useCallback(async () => {
        if (!window.confirm('Are you sure you want to finalize today\'s daily summary?')) return;
        if (!dailySummary?._id) return handleError('Invalid or missing daily summary ID.');
        setIsSaving(true);
        try {
            const finalizedSummary = await finalizeDailySummary(dailySummary._id);
            setDailySummary(finalizedSummary);
            handleSuccess('Daily summary submitted for approval!');
        } catch (error) {
            handleError('Failed to finalize daily summary.');
        } finally {
            setIsSaving(false);
        }
    }, [dailySummary, handleSuccess, handleError]);
    
    const dailyCalculations = useMemo(() => {
        if (!dailySummary) return {};
        const meterA_kg = (metersFormData.closingMeterA || 0) - (metersFormData.openingMeterA || 0);
        const meterB_kg = (metersFormData.closingMeterB || 0) - (metersFormData.openingMeterB || 0);
        const totalMetersKg = meterA_kg + meterB_kg;
        const expectedRevenue = totalMetersKg * (metersFormData.pricePerKg || 0);
        const actualRevenue = dailySummary.sales.totalRevenue || 0;
        const discrepancy = actualRevenue - expectedRevenue;
        return { totalMetersKg, expectedRevenue, actualRevenue, discrepancy };
    }, [dailySummary, metersFormData]);
    
    if (plantsLoading) {
        return <Card><p className="p-8 text-center">Loading branches...</p></Card>;
    }
    
    return (
        <>
            <Notification notification={notification} setNotification={setNotification} />
            <PageTitle
                title="Daily Transaction Log (POS)"
                subtitle={`Cashier: ${user?.name || 'N/A'} | Branch: ${plants.find(p => p._id === dailySummary?.branchId)?.name || (selectedBranch ? plants.find(p => p._id === selectedBranch)?.name : 'Select a branch')}`}
            />
            <Card className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Daily Log Setup</h3>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="branch" className="block text-sm font-medium text-gray-700">Select Branch</label>
                        <select id="branch" value={selectedBranch} onChange={handleBranchChange} className="p-2 w-full border rounded-md" required>
                            <option value="">Select a branch</option>
                            {plants.map(plant => (
                                <option key={plant._id} value={plant._id}>{plant.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Cashier Name</label>
                        <p className="p-2 w-full border rounded-md bg-gray-100">{user?.name || 'N/A'}</p>
                    </div>
                </div>
            </Card>

            {dailySummary && (
                <Card className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Reconciliation & Finalization</h3>
                    <form onSubmit={handleUpdateMeters} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="openingMeterA" className="block text-sm font-medium text-gray-700">Opening Meter A (kg)</label>
                                <input type="number" step="0.01" id="openingMeterA" name="openingMeterA" value={metersFormData.openingMeterA} onChange={handleMetersChange} className="p-2 border rounded-md w-full" required />
                            </div>
                            <div>
                                <label htmlFor="closingMeterA" className="block text-sm font-medium text-gray-700">Closing Meter A (kg)</label>
                                <input type="number" step="0.01" id="closingMeterA" name="closingMeterA" value={metersFormData.closingMeterA} onChange={handleMetersChange} className="p-2 border rounded-md w-full" />
                            </div>
                            <div>
                                <label htmlFor="openingMeterB" className="block text-sm font-medium text-gray-700">Opening Meter B (kg)</label>
                                <input type="number" step="0.01" id="openingMeterB" name="openingMeterB" value={metersFormData.openingMeterB} onChange={handleMetersChange} className="p-2 border rounded-md w-full" />
                            </div>
                            <div>
                                <label htmlFor="closingMeterB" className="block text-sm font-medium text-gray-700">Closing Meter B (kg)</label>
                                <input type="number" step="0.01" id="closingMeterB" name="closingMeterB" value={metersFormData.closingMeterB} onChange={handleMetersChange} className="p-2 border rounded-md w-full" />
                            </div>
                            <div>
                                <label htmlFor="pricePerKg" className="block text-sm font-medium text-gray-700">Price per KG (₦)</label>
                                <input type="number" step="0.01" id="pricePerKg" name="pricePerKg" value={metersFormData.pricePerKg} onChange={handleMetersChange} className="p-2 border rounded-md w-full" required />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSaving || dailySummary.status === 'pending_approval'}>Update Meters</Button>
                        </div>
                    </form>
                    {isClosingMetersEntered && (
                        <>
                            <div className="p-4 bg-gray-50 rounded-lg grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 text-center">
                                <div><p className="text-xs text-gray-500">Total KG by Meter</p><p className="font-bold text-lg">{dailyCalculations.totalMetersKg?.toFixed(2) || '0.00'} kg</p></div>
                                <div><p className="text-xs text-gray-500">Expected Revenue</p><p className="font-bold text-lg">{formatCurrency(dailyCalculations.expectedRevenue || 0)}</p></div>
                                <div><p className="text-xs text-gray-500">Actual Revenue</p><p className="font-bold text-lg">{formatCurrency(dailyCalculations.actualRevenue || 0)}</p></div>
                                <div><p className="text-xs text-gray-500">Discrepancy</p><p className={`font-bold text-lg ${dailyCalculations.discrepancy >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(dailyCalculations.discrepancy || 0)}</p></div>
                            </div>
                            <div className="flex justify-end mt-6 border-t pt-6">
                                <Button onClick={handleFinalizeDailySummary} disabled={isSaving || dailySummary.status === 'pending_approval'}>Finalize Day & Submit for Approval</Button>
                            </div>
                        </>
                    )}
                    {dailySummary?.status === 'pending_approval' && (
                        <p className="text-yellow-600 text-center mt-4">Waiting for manager approval. No further edits can be made.</p>
                    )}
                </Card>
            )}

            {dailySummary && dailySummary.status !== 'pending_approval' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <Card>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                            <TrendingUp className="mr-2" /> Log Sale
                        </h3>
                        <form onSubmit={handleLogSale} className="space-y-4">
                            <div>
                                <label htmlFor="saleAmount" className="block text-sm font-medium text-gray-700">Amount (₦)</label>
                                <input type="number" step="0.01" id="saleAmount" name="amount" value={saleFormData.amount} onChange={handleSaleFormChange} onBlur={handleSaleCalculation} className="p-2 border rounded-md w-full" required />
                            </div>
                            <div>
                                <label htmlFor="saleKgSold" className="block text-sm font-medium text-gray-700">KG Sold</label>
                                <input type="number" step="0.01" id="saleKgSold" name="kgSold" value={saleFormData.kgSold} onChange={handleSaleFormChange} onBlur={handleSaleCalculation} className="p-2 border rounded-md w-full" required />
                            </div>
                            <div>
                                <label htmlFor="transactionType" className="block text-sm font-medium text-gray-700">Payment Method</label>
                                <select id="transactionType" name="transactionType" value={saleFormData.transactionType} onChange={handleSaleFormChange} className="p-2 border rounded-md w-full" required>
                                    <option value="POS">POS</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Transfer">Transfer</option>
                                </select>
                            </div>
                            <Button type="submit" className="w-full" disabled={isSaving}>Log Sale</Button>
                        </form>
                    </Card>
                    <Card>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                            <TrendingDown className="mr-2" /> Log Expense
                        </h3>
                        <form onSubmit={handleLogExpense} className="space-y-4">
                            <div>
                                <label htmlFor="expenseCategory" className="block text-sm font-medium text-gray-700">Category</label>
                                <select id="expenseCategory" name="category" value={expenseFormData.category} onChange={handleExpenseFormChange} className="p-2 border rounded-md w-full" required>
                                    {EXPENSE_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="expenseAmount" className="block text-sm font-medium text-gray-700">Amount (₦)</label>
                                <input type="number" step="0.01" id="expenseAmount" name="amount" value={expenseFormData.amount} onChange={handleExpenseFormChange} className="p-2 border rounded-md w-full" required />
                            </div>
                            <div>
                                <label htmlFor="expenseDescription" className="block text-sm font-medium text-gray-700">Description</label>
                                <input type="text" id="expenseDescription" name="description" value={expenseFormData.description} onChange={handleExpenseFormChange} className="p-2 border rounded-md w-full" required />
                            </div>
                            <Button type="submit" className="w-full" disabled={isSaving}>Log Expense</Button>
                        </form>
                    </Card>
                </div>
            )}

            {dailySummary && (
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
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category/Method</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {dailyEntries.map(entry => (
                                        <TransactionEntry 
                                            key={entry._id} 
                                            entry={entry}
                                            onPreview={setPreviewedEntry}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-4">No transactions logged yet.</p>
                    )}
                </Card>
            )}

            {previewedEntry && (
                <ReceiptPreviewModal
                    entry={previewedEntry}
                    onClose={() => setPreviewedEntry(null)}
                />
            )}
        </>
    );
}