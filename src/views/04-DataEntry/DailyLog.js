// src/views/04-DataEntry/DailyLog.js

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useFirestoreQuery } from '../../hooks/useFirestoreQuery';
import { getPlantsQuery, getDailySummaryQuery, saveDailyReadings, finalizeDailySummary, addDataEntry } from '../../api/firestoreService';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { db, appId } from '../../api/firebase';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { logAppEvent } from '../../services/loggingService';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Notification from '../../components/shared/Notification';
import SalesLogForm from './SalesLogForm';
import ExpenseLogForm from './ExpenseLogForm';
import { PlusCircle, Printer, FileText, Send } from 'lucide-react';
import EndOfDayReportModal from './EndOfDayReportModal';

// --- Tab Components ---

const MeterReadingsForm = ({ user, plants, dailySummary, onSave, loading }) => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        branchId: plants[0]?.id || '',
        cashierName: user.email,
        openingMeterA: '', closingMeterA: '',
        openingMeterB: '', closingMeterB: '',
        pricePerKg: '1100',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (dailySummary) {
            setFormData({
                date: dailySummary.date,
                branchId: dailySummary.branchId,
                cashierName: dailySummary.cashierName,
                openingMeterA: dailySummary.meters?.openingMeterA || '',
                closingMeterA: dailySummary.meters?.closingMeterA || '',
                openingMeterB: dailySummary.meters?.openingMeterB || '',
                closingMeterB: dailySummary.meters?.closingMeterB || '',
                pricePerKg: dailySummary.meters?.pricePerKg || '1100',
            });
        }
    }, [dailySummary]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSave(formData);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Today's Readings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div><label className="block text-sm font-medium">Branch</label><select name="branchId" value={formData.branchId} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md bg-white" required>{plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                <div><label className="block text-sm font-medium">Price per kg (₦)</label><input type="number" step="0.01" name="pricePerKg" value={formData.pricePerKg} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" required /></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div><label className="block text-sm font-medium">Opening Meter A (kg)</label><input type="number" step="0.01" name="openingMeterA" value={formData.openingMeterA} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" required /></div>
                <div><label className="block text-sm font-medium">Closing Meter A (kg)</label><input type="number" step="0.01" name="closingMeterA" value={formData.closingMeterA} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" required /></div>
                <div><label className="block text-sm font-medium">Opening Meter B (kg)</label><input type="number" step="0.01" name="openingMeterB" value={formData.openingMeterB} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" required /></div>
                <div><label className="block text-sm font-medium">Closing Meter B (kg)</label><input type="number" step="0.01" name="closingMeterB" value={formData.closingMeterB} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" required /></div>
            </div>
            <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Readings'}</Button>
            </div>
        </form>
    );
};

const TransactionLogger = ({ user, plants, dailySummaryId, onSuccess, onError, onPushToTable, localEntries, handleSubmitAll, isSubmitting }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
                <SalesLogForm user={user} plants={plants} onSuccess={onSuccess} onError={onError} dailySummaryId={dailySummaryId} onPushToTable={onPushToTable} />
                <ExpenseLogForm user={user} plants={plants} onSuccess={onSuccess} onError={onError} dailySummaryId={dailySummaryId} onPushToTable={onPushToTable} />
            </div>
            <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Today's Entries</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead><tr className="border-b bg-gray-50"><th className="p-4 text-sm font-semibold">Time</th><th className="p-4 text-sm font-semibold">Type</th><th className="p-4 text-sm font-semibold">Details</th><th className="p-4 text-sm font-semibold text-right">Amount</th></tr></thead>
                        <tbody>
                            {/* Check if localEntries is an array before checking its length */}
                            {Array.isArray(localEntries) && localEntries.length > 0 ? (
                                localEntries.map((entry, index) => (
                                    <tr key={index} className="border-b hover:bg-gray-50">
                                        <td className="p-4">{new Date().toLocaleTimeString()}</td>
                                        <td className="p-4"><span className={`px-2 py-1 text-xs rounded-full ${entry.type === 'sale' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{entry.type}</span></td>
                                        <td className="p-4">{entry.type === 'sale' ? `${entry.kgSold} kg (${entry.paymentMethod})` : entry.description}</td>
                                        <td className="p-4 text-right font-semibold">{formatCurrency(entry.revenue || entry.amount)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="4" className="text-center p-8 text-gray-500">No transactions logged yet today.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end mt-6">
                    <Button onClick={handleSubmitAll} disabled={!Array.isArray(localEntries) || localEntries.length === 0 || isSubmitting} icon={Send}>
                        {isSubmitting ? 'Submitting...' : 'Submit All for Approval'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

const DailyReconciliation = ({ dailySummary, entries, onFinalize, loading }) => {
    const calculations = useMemo(() => {
        if (!dailySummary || !dailySummary.meters) return { totalKgSold: 0, calculatedRevenue: 0, actualRevenue: 0, discrepancy: 0, totalExpenses: 0 };
        const { openingMeterA, closingMeterA, openingMeterB, closingMeterB, pricePerKg } = dailySummary.meters;
        const totalKgSold = (parseFloat(closingMeterA) || 0) - (parseFloat(openingMeterA) || 0) + (parseFloat(closingMeterB) || 0) - (parseFloat(openingMeterB) || 0);
        const calculatedRevenue = totalKgSold * (parseFloat(pricePerKg) || 0);
        const actualRevenue = entries.filter(e => e.type === 'sale').reduce((sum, s) => sum + s.revenue, 0);
        const totalExpenses = entries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
        const discrepancy = actualRevenue - calculatedRevenue;
        return { totalKgSold, calculatedRevenue, actualRevenue, discrepancy, totalExpenses };
    }, [dailySummary, entries]);

    if (loading) return <p>Loading reconciliation data...</p>;
    if (!dailySummary) return <p className="text-center p-8 text-gray-500">Please start by logging meter readings to begin your daily summary.</p>;

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Daily Summary for {formatDate(dailySummary.date)}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                <Card><p className="text-sm text-gray-500">Total KG Sold</p><p className="font-bold text-lg mt-1">{calculations.totalKgSold.toFixed(2)} kg</p></Card>
                <Card><p className="text-sm text-gray-500">Calculated Revenue</p><p className="font-bold text-lg mt-1">{formatCurrency(calculations.calculatedRevenue)}</p></Card>
                <Card><p className="text-sm text-gray-500">Actual Revenue</p><p className="font-bold text-lg mt-1">{formatCurrency(calculations.actualRevenue)}</p></Card>
                <Card><p className="text-sm text-gray-500">Discrepancy</p><p className={`font-bold text-lg mt-1 ${calculations.discrepancy >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(calculations.discrepancy)}</p></Card>
            </div>
            <Card>
                <h4 className="font-semibold text-gray-700">Expenses for the Day</h4>
                <p className="text-2xl font-bold mt-2">{formatCurrency(calculations.totalExpenses)}</p>
            </Card>
            <div className="flex justify-center pt-4">
                <Button onClick={() => onFinalize(dailySummary.id)} icon={FileText}>Submit End-of-Day Report</Button>
            </div>
        </div>
    );
};

// --- Main Component ---

export default function DailyLog() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('readings');
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    const [showReportModal, setShowReportModal] = useState(false);

    const { docs: plants, loading: loadingPlants } = useFirestoreQuery(getPlantsQuery());
    const dailySummaryQuery = useMemo(() => getDailySummaryQuery(user.uid), [user.uid]);
    const { docs: dailySummary, loading: loadingSummary } = useFirestoreQuery(dailySummaryQuery);
    const inProgressSummary = dailySummary[0]; // Assuming there is only one in-progress summary per user per day

    const todaysEntriesQuery = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return query(
            collection(db, `artifacts/${appId}/data_entries`),
            where("submittedBy.uid", "==", user.uid),
            where("submittedAt", ">=", today),
            orderBy("submittedAt", "desc")
        );
    }, [user.uid]);
    const { docs: todaysEntries, loading: loadingEntries } = useFirestoreQuery(todaysEntriesQuery);

    const handleSaveReadings = async (formData) => {
        try {
            await saveDailyReadings(formData, user, inProgressSummary?.id);
            setNotification({ show: true, message: 'Meter readings saved!', type: 'success' });
            setActiveTab('transactions');
        } catch (error) {
            logAppEvent('ERROR', 'DailyLog: Failed to save meter readings.', { error: error.message });
            setNotification({ show: true, message: 'Failed to save readings.', type: 'error' });
        }
    };

    const handleFinalize = async (summaryId) => {
        try {
            await finalizeDailySummary(summaryId, user);
            setNotification({ show: true, message: 'End-of-day report submitted for approval!', type: 'success' });
            setShowReportModal(true);
        } catch (error) {
            logAppEvent('ERROR', 'DailyLog: Failed to finalize report.', { error: error.message });
            setNotification({ show: true, message: 'Failed to submit report.', type: 'error' });
        }
    };

    const handleSuccess = (message) => {
        logAppEvent('INFO', `DailyLog: ${message}`, { component: 'DailyLog' });
        setNotification({ show: true, message, type: 'success' });
    };
    const handleError = (message) => {
        logAppEvent('ERROR', `DailyLog: ${message}`, { component: 'DailyLog' });
        setNotification({ show: true, message, type: 'error' });
    };

    return (
        <>
            <Notification notification={notification} setNotification={setNotification} />
            {showReportModal && <EndOfDayReportModal date={new Date()} onClose={() => setShowReportModal(false)} />}

            <PageTitle title="Daily Transaction Log (POS)" subtitle="Log sales and expenses as they happen." />

            <Card>
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8">
                        <button onClick={() => setActiveTab('readings')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'readings' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            Meter Readings
                        </button>
                        <button onClick={() => setActiveTab('transactions')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'transactions' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            Transaction Log
                        </button>
                        <button onClick={() => setActiveTab('reconciliation')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'reconciliation' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            Reconciliation
                        </button>
                    </nav>
                </div>
                {activeTab === 'readings' && <MeterReadingsForm user={user} plants={plants} dailySummary={inProgressSummary} onSave={handleSaveReadings} loading={loadingSummary} />}
                {activeTab === 'transactions' && <TransactionLogger user={user} plants={plants} dailySummaryId={inProgressSummary?.id} onSuccess={handleSuccess} onError={handleError} entries={todaysEntries} loadingEntries={loadingEntries} />}
                {activeTab === 'reconciliation' && <DailyReconciliation dailySummary={inProgressSummary} entries={todaysEntries} onFinalize={handleFinalize} loading={loadingSummary || loadingEntries} />}
            </Card>
        </>
    );
}