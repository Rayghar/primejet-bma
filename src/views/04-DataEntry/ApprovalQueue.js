// =======================================================================
// src/views/04-DataEntry/ApprovalQueue.js (UPDATED)
// Now fetches and displays both sales and expense logs.
// =======================================================================
import React, { useState } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { db, appId } from '../../api/firebase';
import { useFirestoreQuery } from '../../hooks/useFirestoreQuery';
import { useAuth } from '../../hooks/useAuth';
import { updateLogStatus } from '../../api/firestoreService';
import { formatDate, formatCurrency } from '../../utils/formatters';

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import NotificationHandler from '../../components/shared/Notification';
import Button from '../../components/shared/Button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

const LogItem = ({ log, onAction }) => {
    const isSale = log.type === 'sale';
    return (
        <div className="border rounded-lg p-4 flex justify-between items-center hover:bg-gray-50">
            <div>
                <p className={`font-bold text-lg ${isSale ? 'text-green-600' : 'text-red-600'}`}>
                    {isSale ? `+ ${formatCurrency(log.revenue)}` : `- ${formatCurrency(log.amount)}`}
                </p>
                <p className="text-sm text-gray-600">
                    {isSale 
                        ? `${log.kgSold} kg (${log.saleType})` 
                        : `${log.description} (${log.category})`
                    }
                </p>
                <p className="text-xs text-gray-500">
                    Submitted by {log.submittedBy.email} on {formatDate(log.submittedAt)}
                </p>
            </div>
            <div className="flex gap-2">
                <Button onClick={() => onAction(log.id, 'rejected')} variant="secondary" icon={ThumbsDown} />
                <Button onClick={() => onAction(log.id, 'approved')} icon={ThumbsUp} />
            </div>
        </div>
    );
};

export default function ApprovalQueue() {
    const { user } = useAuth();
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    // Query for all pending entries
    const pendingLogsQuery = query(collection(db, `artifacts/${appId}/data_entries`), where("status", "==", "pending"));
    const { docs: pendingLogs, loading } = useFirestoreQuery(pendingLogsQuery);

    const handleAction = async (logId, newStatus) => {
        try {
            await updateLogStatus(logId, newStatus, user);
            setNotification({ show: true, message: `Log has been ${newStatus}.`, type: 'success' });
        } catch (error) {
            setNotification({ show: true, message: 'Action failed. Please try again.', type: 'error' });
        }
    };

    return (
        <>
            <NotificationHandler notification={notification} setNotification={setNotification} />
            <PageTitle title="Approval Queue" subtitle="Review and approve or reject data entry submissions." />
            <Card>
                {loading ? <p>Loading pending submissions...</p> : 
                 pendingLogs.length > 0 ? (
                    <div className="space-y-4">
                        {pendingLogs.map(log => <LogItem key={log.id} log={log} onAction={handleAction} />)}
                    </div>
                 ) : (
                    <p className="text-center text-gray-500 py-8">The approval queue is empty. Great job!</p>
                 )
                }
            </Card>
        </>
    );
};
