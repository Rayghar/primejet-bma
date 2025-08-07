// src/views/04-DataEntry/DailyLog.js (UPDATED)

import React, { useState } from 'react';
import PageTitle from '../../components/shared/PageTitle';
import NotificationHandler from '../../components/shared/Notification';
import SalesLogForm from './SalesLogForm';
import ExpenseLogForm from './ExpenseLogForm';
import { useAuth } from '../../hooks/useAuth';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import EndOfDayReportModal from './EndOfDayReportModal'; // Import the new modal
import { FileText } from 'lucide-react';

export default function DailyLog({ setActiveView }) {
    const [entryType, setEntryType] = useState('sales');
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportDate, setReportDate] = useState(new Date());
    const { user } = useAuth();

    const handleSuccess = (message) => {
        setNotification({ show: true, message, type: 'success' });
    };

    const handleError = (message) => {
        setNotification({ show: true, message, type: 'error' });
    };

    const handleGenerateReport = () => {
        // In a real app, you might have a date picker here.
        // For simplicity, we'll generate the report for "today".
        setReportDate(new Date());
        setShowReportModal(true);
    };

    return (
        <>
            <NotificationHandler notification={notification} setNotification={setNotification} />
            {showReportModal && <EndOfDayReportModal date={reportDate} onClose={() => setShowReportModal(false)} />}

            <div className="flex justify-between items-center">
                <PageTitle title="Daily Log" subtitle="Log daily sales and expenses for manager approval." />
                <Button onClick={handleGenerateReport} icon={FileText} variant="secondary">
                    End-of-Day Report
                </Button>
            </div>

            <Card>
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8">
                        <button onClick={() => setEntryType('sales')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${entryType === 'sales' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            Log Daily Sales
                        </button>
                        <button onClick={() => setEntryType('expenses')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${entryType === 'expenses' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            Log Operational Expense
                        </button>
                    </nav>
                </div>
                {entryType === 'sales' 
                    ? <SalesLogForm user={user} onSuccess={handleSuccess} onError={handleError} /> 
                    : <ExpenseLogForm user={user} onSuccess={handleSuccess} onError={handleError} />
                }
            </Card>
        </>
    );
};
