// src/views/04-DataEntry/ApprovalQueue.js
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useFirestoreQuery } from '../../hooks/useFirestoreQuery';
import { collection, query, where, orderBy, doc, writeBatch } from 'firebase/firestore';
import { db, appId } from '../../api/firebase';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { logAppEvent } from '../../services/loggingService';
import { approveDailySummary } from '../../api/firestoreService'; // A new service function

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

export default function ApprovalQueue() {
    const { user } = useAuth();
    // Query for pending daily summaries, not individual entries
    const pendingSummariesQuery = query(
        collection(db, `artifacts/${appId}/daily_summaries`),
        where("status", "==", "pending"),
        orderBy("date", "desc")
    );
    const { docs: pendingSummaries, loading, error, refetch } = useFirestoreQuery(pendingSummariesQuery);

    React.useEffect(() => {
        if (error) logAppEvent('ERROR', 'ApprovalQueue: Failed to fetch pending summaries.', { error });
    }, [error]);

    const handleAction = async (summaryId, entryIds, status) => {
        logAppEvent('DEBUG', `ApprovalQueue: User attempting to ${status} daily summary ID ${summaryId}.`, { summaryId, status });
        try {
            await approveDailySummary(summaryId, entryIds, status, user);
            logAppEvent('INFO', `ApprovalQueue: Daily summary ${summaryId} and all associated entries successfully updated to ${status}.`, { summaryId, status });
            refetch();
        } catch (err) {
            logAppEvent('ERROR', `ApprovalQueue: Failed to update summary status for ${summaryId}.`, { error: err.message, summaryId, status });
            alert(`Error: Could not update status.`);
        }
    };

    return (
        <>
            <PageTitle title="Approval Queue" subtitle="Review and approve or reject end-of-day reports." />
            <Card>
                {loading && <p>Loading pending summaries...</p>}
                {error && <p className="text-red-500">Failed to load data. The error has been logged.</p>}
                {!loading && !error && (
                    pendingSummaries.length > 0 ? (
                        <div className="space-y-4">
                            {pendingSummaries.map(summary => (
                                <div key={summary.id} className="border rounded-lg p-4 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-lg">Report for {formatDate(summary.date)}</p>
                                        <p className="text-sm text-gray-600">Total Revenue: {formatCurrency(summary.totalRevenue)}</p>
                                        <p className="text-sm text-gray-600">Total Expenses: {formatCurrency(summary.totalExpenses)}</p>
                                        <p className="text-xs text-gray-500">Submitted by {summary.submittedBy.email} on {formatDate(summary.createdAt)}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={() => handleAction(summary.id, summary.entries, 'rejected')} variant="secondary" icon={ThumbsDown} />
                                        <Button onClick={() => handleAction(summary.id, summary.entries, 'approved')} icon={ThumbsUp} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-8">The approval queue is empty. Great job!</p>
                    )
                )}
            </Card>
        </>
    );
}