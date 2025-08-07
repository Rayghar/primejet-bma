// =======================================================================
// src/views/04-DataEntry/POSDataEntry.js (UPDATED)
// Now correctly renders the new ExpenseLogForm component.
// =======================================================================
import React, { useState } from 'react';
import PageTitle from '../../components/shared/PageTitle';
import NotificationHandler from '../../components/shared/Notification';
import SalesLogForm from './SalesLogForm';
import ExpenseLogForm from './ExpenseLogForm'; // Import the new form
import { useAuth } from '../../hooks/useAuth';
import Card from '../../components/shared/Card';

export default function POSDataEntry({ setActiveView }) {
    const [entryType, setEntryType] = useState('sales');
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    const { user } = useAuth();

    const handleSuccess = (message) => {
        setNotification({ show: true, message, type: 'success' });
        // Optional: Navigate to queue after submission
        // setTimeout(() => {
        //     setActiveView('ApprovalQueue');
        // }, 2000);
    };

    const handleError = (message) => {
        setNotification({ show: true, message, type: 'error' });
    };

    return (
        <>
            <NotificationHandler notification={notification} setNotification={setNotification} />
            <PageTitle title="Daily Log" subtitle="Log daily sales and expenses for manager approval." />
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