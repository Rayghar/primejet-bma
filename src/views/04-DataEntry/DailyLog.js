// src/views/04-DataEntry/DailyLog.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getPlants } from '../../api/operationsService';
import { 
    getDailySummaryInProgress, 
    addDailySummary, 
    updateSummaryStatus 
} from '../../api/dataEntryService';
import { formatCurrency, formatDate } from '../../utils/formatters';

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Notification from '../../components/shared/Notification';
import SalesLogForm from './SalesLogForm';
import ExpenseLogForm from './ExpenseLogForm';
import EndOfDayReportModal from './EndOfDayReportModal';
import Button from '../../components/shared/Button';
import { FileText, TrendingUp, TrendingDown, PlusCircle, Trash2 } from 'lucide-react';

// --- Meter Readings Form Component ---
const MeterReadingsForm = ({ summaryData, setSummaryData, plants, plantsLoading, onSave, isSaving }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('meters.')) {
            const meterField = name.split('.')[1];
            setSummaryData(prev => ({
                ...prev,
                meters: { ...prev.meters, [meterField]: value }
            }));
        } else if (name.startsWith('sales.')) {
            const salesField = name.split('.')[1];
            setSummaryData(prev => ({
                ...prev,
                sales: { ...prev.sales, [salesField]: value }
            }));
        } else {
            setSummaryData(prev => ({ ...prev, [name]: value }));
        }
    };

    const calculations = useMemo(() => {
        const kgA = (parseFloat(summaryData.meters.closingMeterA) || 0) - (parseFloat(summaryData.meters.openingMeterA) || 0);
        const kgB = (parseFloat(summaryData.meters.closingMeterB) || 0) - (parseFloat(summaryData.meters.openingMeterB) || 0);
        const totalKgSold = kgA + kgB;
        const calculatedRevenue = totalKgSold * (parseFloat(summaryData.meters.pricePerKg) || 0.01);
        const actualRevenue = (parseFloat(summaryData.sales.posAmount) || 0) + (parseFloat(summaryData.sales.cashAmount) || 0);
        const discrepancy = actualRevenue - calculatedRevenue;
        return { totalKgSold, calculatedRevenue, actualRevenue, discrepancy };
    }, [summaryData.meters, summaryData.sales]);

    return (
        <form onSubmit={onSave} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div><label htmlFor="summary-date" className="block text-sm font-medium">Date</label><input type="date" id="summary-date" name="date" value={summaryData.date} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" required /></div>
                <div><label htmlFor="summary-branch" className="block text-sm font-medium">Branch</label>{plantsLoading ? <p>Loading...</p> : (<select id="summary-branch" name="branchId" value={summaryData.branchId} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md bg-white" required>{plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>)}</div>
                <div><label htmlFor="summary-cashier" className="block text-sm font-medium">Cashier Name</label><input type="text" id="summary-cashier" name="cashierName" value={summaryData.cashierName} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" placeholder="e.g., John Doe" required /></div>
            </div>

            <div className="border-t pt-6"><h3 className="text-lg font-semibold text-gray-700">Meter Readings</h3><div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4"><input type="number" step="0.01" name="meters.openingMeterA" value={summaryData.meters.openingMeterA} onChange={handleChange} placeholder="Opening A (kg)" className="p-2 border rounded-md" required /><input type="number" step="0.01" name="meters.closingMeterA" value={summaryData.meters.closingMeterA} onChange={handleChange} placeholder="Closing A (kg)" className="p-2 border rounded-md" required /><div className="hidden md:block"></div><input type="number" step="0.01" name="meters.openingMeterB" value={summaryData.meters.openingMeterB} onChange={handleChange} placeholder="Opening B (kg)" className="p-2 border rounded-md" /><input type="number" step="0.01" name="meters.closingMeterB" value={summaryData.meters.closingMeterB} onChange={handleChange} placeholder="Closing B (kg)" className="p-2 border rounded-md" /></div></div>
            <div className="border-t pt-6"><h3 className="text-lg font-semibold text-gray-700">Sales & Revenue</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4"><input type="number" name="meters.pricePerKg" value={summaryData.meters.pricePerKg} onChange={handleChange} placeholder="Price per kg (₦)" className="p-2 border rounded-md" required /><input type="number" name="sales.posAmount" value={summaryData.sales.posAmount} onChange={handleChange} placeholder="POS Amount (₦)" className="p-2 border rounded-md" required /><input type="number" name="sales.cashAmount" value={summaryData.sales.cashAmount} onChange={handleChange} placeholder="Cash Amount (₦)" className="p-2 border rounded-md" required /></div></div>
            <div className="p-4 bg-gray-50 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4 text-center"><div><p className="text-xs text-gray-500">Total KG Sold</p><p className="font-bold text-lg">{calculations.totalKgSold.toFixed(2)} kg</p></div><div><p className="text-xs text-gray-500">Calculated Revenue</p><p className="font-bold text-lg">{formatCurrency(calculations.calculatedRevenue)}</p></div><div><p className="text-xs text-gray-500">Actual Revenue</p><p className="font-bold text-lg">{formatCurrency(calculations.actualRevenue)}</p></div><div><p className="text-xs text-gray-500">Discrepancy</p><p className={`font-bold text-lg ${calculations.discrepancy >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(calculations.discrepancy)}</p></div></div>

            <div className="flex justify-end pt-4 border-t">
                {/* Removed the comment from the icon prop */}
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Daily Summary Progress'}
                </Button>
            </div>
        </form>
    );
};

export default function DailyLog() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('pos');
    const [dailySummaryId, setDailySummaryId] = useState(null);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    const [showReportModal, setShowReportModal] = useState(false);
    const [isSavingSummary, setIsSavingSummary] = useState(false);
    const [isFinalizingSummary, setIsFinalizingSummary] = useState(false);
    const [plants, setPlants] = useState([]);
    const [plantsLoading, setPlantsLoading] = useState(true);
    const [dailyEntries, setDailyEntries] = useState([]);

    const initialSummaryState = useMemo(() => ({
        date: new Date().toISOString().split('T')[0],
        branchId: '',
        cashierName: user?.name || '',
        meters: {
            openingMeterA: '', closingMeterA: '',
            openingMeterB: '', closingMeterB: '',
            pricePerKg: '1100',
        },
        sales: { posAmount: '', cashAmount: '' },
        expenses: [],
    }), [user]);

    const [summaryFormData, setSummaryFormData] = useState(initialSummaryState);

    useEffect(() => {
        const fetchPlants = async () => {
            setPlantsLoading(true);
            try {
                const plantList = await getPlants();
                setPlants(plantList);
                if (plantList.length > 0 && !summaryFormData.branchId) {
                    setSummaryFormData(prev => ({ ...prev, branchId: plantList[0].id }));
                }
            } catch (error) {
                console.error('Failed to fetch plants:', error);
                handleError('Failed to load branch data.');
            } finally {
                setPlantsLoading(false);
            }
        };
        fetchPlants();
    }, [summaryFormData.branchId]);

    const fetchOrCreateSummary = useCallback(async () => {
        if (!user?.id || plantsLoading) return;
        
        try {
            let summary = await getDailySummaryInProgress();

            if (summary) {
                setDailySummaryId(summary.id);
                setSummaryFormData({
                    date: summary.date.split('T')[0],
                    branchId: summary.branchId,
                    cashierName: summary.cashierName,
                    meters: summary.meters,
                    sales: summary.sales,
                    expenses: summary.expenses,
                });
                handleSuccess('Resumed in-progress daily summary.');
            } else {
                const newSummaryData = {
                    date: new Date().toISOString().split('T')[0],
                    branchId: plants[0]?.id || 'default_branch_id',
                    cashierName: user.email,
                    status: 'in_progress',
                    // FIX: Initialize all number fields with 0 instead of empty strings
                    meters: { openingMeterA: 0, closingMeterA: 0, openingMeterB: 0, closingMeterB: 0, pricePerKg: 1100 }, 
                    sales: { posAmount: 0, cashAmount: 0, totalRevenue: 0 },
                    expenses: [],
                };
                const createdSummaryResponse = await addDailySummary(newSummaryData);
                setDailySummaryId(createdSummaryResponse.summaryId);
                setSummaryFormData(newSummaryData);
                handleSuccess('Started a new daily summary.');
            }
        } catch (error) {
            console.error('Failed to fetch or create daily summary:', error);
            handleError('Failed to initialize daily log. Please try again.');
        } finally {
            // No specific loading state
        }
    }, [user, plantsLoading, plants]);

    useEffect(() => {
        fetchOrCreateSummary();
    }, [fetchOrCreateSummary]);

    const handleSuccess = (message) => setNotification({ show: true, message, type: 'success' });
    const handleError = (message) => setNotification({ show: true, message, type: 'error' });

    const handleSaveDailySummary = async (e) => {
        e.preventDefault();
        setIsSavingSummary(true);
        if (!summaryFormData.date || !summaryFormData.branchId || !summaryFormData.cashierName || 
            !summaryFormData.meters.openingMeterA || !summaryFormData.meters.closingMeterA ||
            !summaryFormData.meters.pricePerKg || 
            (summaryFormData.sales.posAmount === '' || summaryFormData.sales.cashAmount === '')) {
            handleError('Please fill in all required fields for meters and sales.');
            setIsSavingSummary(false);
            return;
        }

        try {
            await addDailySummary({ 
                ...summaryFormData,
                summaryId: dailySummaryId,
                status: 'in_progress',
            });
            handleSuccess('Daily summary progress saved successfully.');
        } catch (error) {
            console.error("Save Daily Summary Error:", error);
            handleError(error.response?.data?.message || 'Failed to save daily summary progress.');
        } finally {
            setIsSavingSummary(false);
        }
    };

    const handleFinalizeDailySummary = async () => {
        if (!dailySummaryId) {
            handleError('No daily summary to finalize. Please save one first.');
            return;
        }
        if (!window.confirm('Are you sure you want to finalize today\'s daily summary and submit it for approval? This will close the current log.')) {
            return;
        }

        setIsFinalizingSummary(true);
        try {
            await updateSummaryStatus(dailySummaryId, 'pending'); 
            
            handleSuccess('Daily summary finalized and submitted for approval!');
            setDailySummaryId(null);
            setSummaryFormData(initialSummaryState);
            setShowReportModal(true);

        } catch (error) {
            console.error("Finalize Daily Summary Error:", error);
            handleError(error.response?.data?.message || 'Failed to finalize daily summary.');
        } finally {
            setIsFinalizingSummary(false);
        }
    };

    const loadingState = plantsLoading || (!dailySummaryId && !plantsLoading && user);

    return (
        <>
            <Notification notification={notification} setNotification={setNotification} />
            {showReportModal && dailySummaryId && (
                <EndOfDayReportModal 
                    summaryId={dailySummaryId}
                    date={summaryFormData.date}
                    onClose={() => setShowReportModal(false)} 
                />
            )}

            <PageTitle title="Daily Transaction Log (POS)" subtitle="Log daily sales, expenses, and finalize end-of-day reports." />

            {loadingState ? (
                <Card><p className="p-8 text-center">Initializing daily log...</p></Card>
            ) : dailySummaryId ? (
                <>
                    <Card className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Current Daily Summary Overview</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <p><strong>Date:</strong> {formatDate(summaryFormData.date)}</p>
                            <p><strong>Branch:</strong> {plants.find(p => p.id === summaryFormData.branchId)?.name || 'N/A'}</p>
                            <p><strong>Cashier:</strong> {summaryFormData.cashierName || user.email}</p>
                            <p><strong>Status:</strong> <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">In Progress</span></p>
                            <p><strong>Total Sales (POS):</strong> {formatCurrency(parseFloat(summaryFormData.sales.posAmount) || 0)}</p>
                            <p><strong>Total Sales (Cash):</strong> {formatCurrency(parseFloat(summaryFormData.sales.cashAmount) || 0)}</p>
                            <p><strong>Total Revenue:</strong> {formatCurrency((parseFloat(summaryFormData.sales.posAmount) || 0) + (parseFloat(summaryFormData.sales.cashAmount) || 0))}</p>
                            <p><strong>Total Expenses:</strong> {formatCurrency(summaryFormData.expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0))}</p>
                        </div>
                        <div className="mt-6 flex justify-end space-x-4">
                            <Button 
                                onClick={() => setShowReportModal(true)} 
                                icon={FileText} 
                                variant="secondary"
                                disabled={!dailySummaryId}
                            >
                                View End-of-Day Report
                            </Button>
                            <Button 
                                onClick={handleFinalizeDailySummary} 
                                icon={FileText} 
                                variant="primary"
                                disabled={!dailySummaryId || isFinalizingSummary}
                            >
                                {isFinalizingSummary ? 'Finalizing...' : 'Finalize Day & Submit for Approval'}
                            </Button>
                        </div>
                    </Card>

                    <Card>
                        <div className="border-b border-gray-200 mb-6">
                            <nav className="-mb-px flex space-x-8">
                                <button 
                                    onClick={() => setActiveTab('pos')} 
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'pos' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    POS Entry
                                </button>
                                <button 
                                    onClick={() => setActiveTab('summary')} 
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'summary' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    End-of-Day Summary (Meters & Aggregates)
                                </button>
                            </nav>
                        </div>

                        {activeTab === 'pos' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center"><TrendingUp className="mr-2" /> Log New Sale</h3>
                                    <SalesLogForm 
                                        user={user} 
                                        plants={plants} 
                                        onSuccess={handleSuccess} 
                                        onError={handleError} 
                                        dailySummaryId={dailySummaryId}
                                    />
                                </Card>

                                <Card>
                                    <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center"><TrendingDown className="mr-2" /> Log New Expense</h3>
                                    <ExpenseLogForm 
                                        user={user} 
                                        plants={plants} 
                                        onSuccess={handleSuccess} 
                                        onError={handleError} 
                                        dailySummaryId={dailySummaryId}
                                    />
                                </Card>
                            </div>
                        ) : (
                            <div>
                                <MeterReadingsForm
                                    summaryData={summaryFormData}
                                    setSummaryData={setSummaryFormData}
                                    plants={plants}
                                    plantsLoading={plantsLoading}
                                    onSave={handleSaveDailySummary}
                                    isSaving={isSavingSummary}
                                />
                            </div>
                        )}
                    </Card>
                </>
            ) : (
                <Card><p className="p-8 text-center text-gray-500">No active daily log for today. Please refresh or contact support.</p></Card>
            )}
        </>
    );
}