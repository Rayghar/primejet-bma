// src/views/04-DataEntry/DailyLog.js
import React, { useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useFirestoreQuery } from '../../hooks/useFirestoreQuery';
import { getPlantsQuery } from '../../api/firestoreService';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { db, appId } from '../../api/firebase';
import { formatCurrency } from '../../utils/formatters';
import { logAppEvent } from '../../services/loggingService';

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Notification from '../../components/shared/Notification';
import SalesLogForm from './SalesLogForm';
import ExpenseLogForm from './ExpenseLogForm';
import EndOfDayReportModal from './EndOfDayReportModal';
import { PlusCircle, Printer } from 'lucide-react';

export default function DailyLog() {
    const { user } = useAuth();
    const [showSalesModal, setShowSalesModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    const { docs: plants, loading: loadingPlants } = useFirestoreQuery(getPlantsQuery());

    const todaysEntriesQuery = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return query(
            collection(db, `artifacts/${appId}/data_entries`),
            where("submittedBy.uid", "==", user.uid),
            where("status", "==", "pending"),
            where("submittedAt", ">=", today),
            orderBy("submittedAt", "desc")
        );
    }, [user.uid]);
    
    const { docs: todaysEntries, loading: entriesLoading } = useFirestoreQuery(todaysEntriesQuery);

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
            {showSalesModal && <SalesLogForm user={user} plants={plants} onSuccess={handleSuccess} onError={handleError} onClose={() => setShowSalesModal(false)} />}
            {showExpenseModal && <ExpenseLogForm user={user} plants={plants} onSuccess={handleSuccess} onError={handleError} onClose={() => setShowExpenseModal(false)} />}
            {showReportModal && <EndOfDayReportModal date={new Date()} onClose={() => setShowReportModal(false)} />}

            <div className="flex justify-between items-center">
                <PageTitle title="Daily Transaction Log (POS)" subtitle="Log sales and expenses as they happen." />
                <div className="flex gap-2">
                    <Button onClick={() => setShowExpenseModal(true)} variant="secondary">Log Expense</Button>
                    <Button onClick={() => setShowSalesModal(true)} icon={PlusCircle}>Log Sale</Button>
                </div>
            </div>
            
            <Card>
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
                <div className="flex justify-end mt-6">
                    <Button onClick={() => setShowReportModal(true)} icon={Printer}>End Day & Generate Report</Button>
                </div>
            </Card>
        </>
    );
}