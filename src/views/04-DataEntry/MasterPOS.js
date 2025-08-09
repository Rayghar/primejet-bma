// src/views/04-DataEntry/MasterPOS.js
import React, { useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useFirestoreQuery } from '../../hooks/useFirestoreQuery';
import { getPlantsQuery } from '../../api/firestoreService';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { db, appId } from '../../api/firebase';
import { formatCurrency } from '../../utils/formatters';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Notification from '../../components/shared/Notification';
import SalesLogForm from './SalesLogForm';
import ExpenseLogForm from './ExpenseLogForm';
import { Printer } from 'lucide-react';
import { getEntriesForDate } from '../../api/firestoreService';
import DailySummaryForm from './DailySummaryForm';

export default function MasterPOS() {
    const { user } = useAuth();
    const [entryType, setEntryType] = useState('sales');
    const [showSummaryForm, setShowSummaryForm] = useState(false);
    const [summaryReportData, setSummaryReportData] = useState(null);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    // Fetch plants for dropdowns
    const { docs: plants, loading: loadingPlants } = useFirestoreQuery(getPlantsQuery());

    // Fetch today's pending transactions for the current user
    const todaysEntriesQuery = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today

        return query(
            collection(db, `artifacts/${appId}/data_entries`),
            where("submittedBy.uid", "==", user.uid),
            where("status", "==", "pending"),
            where("submittedAt", ">=", today),
            orderBy("submittedAt", "desc")
        );
    }, [user.uid]);
    
    const { docs: todaysEntries, loading: entriesLoading, refetch } = useFirestoreQuery(todaysEntriesQuery);

    const handleSuccess = (message) => {
        setNotification({ show: true, message, type: 'success' });
        refetch();
    };
    const handleError = (message) => setNotification({ show: true, message, type: 'error' });

    const handleEndDay = async () => {
        setLoadingSummary(true);
        const date = new Date().toISOString().split('T')[0];
        const entries = await getEntriesForDate(date);
        
        const sales = entries.filter(e => e.type === 'sale');
        const expenses = entries.filter(e => e.type === 'expense');

        const totals = {
            totalRevenue: sales.reduce((sum, s) => sum + (s.revenue || 0), 0),
            totalKgSold: sales.reduce((sum, s) => sum + (s.kgSold || 0), 0),
            totalExpenses: expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
        };

        setSummaryReportData({ sales, expenses, totals, allEntries: entries });
        setLoadingSummary(false);
        setShowSummaryForm(true);
    };

    const isSalesActive = entryType === 'sales';

    if (loadingPlants) {
      return <div>Loading...</div>;
    }

    return (
        <>
            <Notification notification={notification} setNotification={setNotification} />
            {/* The DailySummaryForm is correctly rendered as a modal ONLY when showSummaryForm is true */}
            {showSummaryForm && summaryReportData && (
                <DailySummaryForm 
                    user={user} 
                    date={new Date().toISOString().split('T')[0]} 
                    reportData={summaryReportData}
                    onClose={() => setShowSummaryForm(false)} 
                    onSuccess={handleSuccess}
                    onError={handleError}
                />
            )}

            <div className="flex justify-between items-center mb-6">
                <PageTitle title="Daily Transaction Log (POS)" subtitle="Log sales and expenses as they happen." />
                <div className="flex gap-2">
                    <Button onClick={handleEndDay} icon={Printer} variant="secondary" disabled={loadingSummary}>
                        {loadingSummary ? 'Generating Report...' : 'End Day & Print Report'}
                    </Button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* This section correctly uses tabs to switch between embedded forms */}
                <Card className="lg:col-span-1">
                    <div className="border-b border-gray-200 mb-6">
                        <nav className="-mb-px flex space-x-8">
                            <button onClick={() => setEntryType('sales')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${isSalesActive ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                Log Daily Sales
                            </button>
                            <button onClick={() => setEntryType('expenses')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${!isSalesActive ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                Log Operational Expense
                            </button>
                        </nav>
                    </div>
                    {/* The SalesLogForm and ExpenseLogForm are rendered directly here, not in a modal */}
                    {isSalesActive
                        ? <SalesLogForm user={user} plants={plants} onSuccess={handleSuccess} onError={handleError} /> 
                        : <ExpenseLogForm user={user} plants={plants} onSuccess={handleSuccess} onError={handleError} />
                    }
                </Card>

                <Card className="lg:col-span-1">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Today's Pending Entries</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b bg-gray-50">
                                    <th className="p-4 text-sm font-semibold text-gray-600">Time</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600">Type</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600">Details</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entriesLoading ? (
                                    <tr><td colSpan="4" className="text-center p-8">Loading transactions...</td></tr>
                                ) : todaysEntries.length > 0 ? (
                                    todaysEntries.map(entry => (
                                        <tr key={entry.id} className="border-b hover:bg-gray-50">
                                            <td className="p-4">{entry.submittedAt?.toDate().toLocaleTimeString() || 'N/A'}</td>
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
                </Card>
            </div>
        </>
    );
}