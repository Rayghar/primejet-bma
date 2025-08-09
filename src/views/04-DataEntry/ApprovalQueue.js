// src/views/04-DataEntry/ApprovalQueue.js
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useFirestoreQuery } from '../../hooks/useFirestoreQuery';
import { collection, query, where, orderBy, doc, writeBatch } from 'firebase/firestore';
import { db, appId } from '../../api/firebase';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { logAppEvent } from '../../services/loggingService';
import { approveDailySummary } from '../../api/firestoreService';

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import Modal from '../../components/shared/Modal'; // Import Modal for detail view

const SummaryDetailModal = ({ summary, onClose }) => (
    <Modal title={`Daily Report for ${formatDate(summary.date)}`} onClose={onClose}>
        <div className="space-y-3 text-sm">
            <p><strong>Branch:</strong> {summary.branchId}</p>
            <p><strong>Cashier:</strong> {summary.cashierName}</p>
            <p><strong>Submitted:</strong> {formatDate(summary.createdAt)} by {summary.submittedBy?.email}</p>
            
            <h4 className="font-semibold text-gray-700 mt-4">Meter Readings:</h4>
            <div className="grid grid-cols-2 gap-2">
                <p>Opening A: {summary.meters?.openingMeterA} kg</p>
                <p>Closing A: {summary.meters?.closingMeterA} kg</p>
                <p>Opening B: {summary.meters?.openingMeterB} kg</p>
                <p>Closing B: {summary.meters?.closingMeterB} kg</p>
                <p>Price per kg: {formatCurrency(summary.meters?.pricePerKg)}</p>
            </div>

            {summary.reconciliation && (
                <>
                    <h4 className="font-semibold text-gray-700 mt-4">Reconciliation Summary:</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <p>Total KG Sold (Meters): {summary.reconciliation.totalKgSold?.toFixed(2)} kg</p>
                        <p>Calculated Revenue: {formatCurrency(summary.reconciliation.calculatedRevenue)}</p>
                        <p>Actual Revenue (Sales): {formatCurrency(summary.reconciliation.actualRevenue)}</p>
                        <p className={summary.reconciliation.discrepancy >= 0 ? 'text-green-600' : 'text-red-600'}>
                            Discrepancy: {formatCurrency(summary.reconciliation.discrepancy)}
                        </p>
                        <p>Total Expenses: {formatCurrency(summary.reconciliation.totalExpenses)}</p>
                    </div>
                </>
            )}
            {/* You could add a list of individual sales/expenses here if needed,
                but that would require fetching them separately. */}
        </div>
    </Modal>
);

export default function ApprovalQueue() {
    const { user } = useAuth();
    const [selectedSummary, setSelectedSummary] = useState(null); // State for modal
    
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

    const handleAction = async (summaryId, status) => { // Removed entryIds from params
        logAppEvent('DEBUG', `ApprovalQueue: User attempting to ${status} daily summary ID ${summaryId}.`, { summaryId, status });
        try {
            // When approving/rejecting a summary, we only need to update the summary itself.
            // The individual data_entries will be updated by a Cloud Function triggered by summary status change,
            // or we'd need to fetch them here if not using a Cloud Function.
            // For now, assuming approveDailySummary in firestoreService handles individual entries.
            await approveDailySummary(summaryId, [], status, user); // Pass empty array for entryIds if not needed
            logAppEvent('INFO', `ApprovalQueue: Daily summary ${summaryId} successfully updated to ${status}.`, { summaryId, status });
            refetch(); // Re-fetch to update the list
        } catch (err) {
            logAppEvent('ERROR', `ApprovalQueue: Failed to update summary status for ${summaryId}.`, { error: err.message, summaryId, status });
            // Use notification instead of alert
            alert(`Error: Could not update status. ${err.message}`); 
        }
    };

    return (
        <>
            {selectedSummary && <SummaryDetailModal summary={selectedSummary} onClose={() => setSelectedSummary(null)} />}

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
                                        {summary.reconciliation ? (
                                            <>
                                                <p className="text-sm text-gray-600">Total Revenue: {formatCurrency(summary.reconciliation.actualRevenue)}</p>
                                                <p className="text-sm text-gray-600">Total Expenses: {formatCurrency(summary.reconciliation.totalExpenses)}</p>
                                                <p className={`text-sm ${summary.reconciliation.discrepancy >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    Discrepancy: {formatCurrency(summary.reconciliation.discrepancy)}
                                                </p>
                                            </>
                                        ) : (
                                            <p className="text-sm text-gray-600">Summary data not fully available.</p>
                                        )}
                                        <p className="text-xs text-gray-500">Submitted by {summary.submittedBy?.email} on {formatDate(summary.createdAt)}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={() => setSelectedSummary(summary)} variant="secondary" icon={FileText} title="View Details" />
                                        <Button onClick={() => handleAction(summary.id, 'rejected')} variant="danger" icon={ThumbsDown} title="Reject" />
                                        <Button onClick={() => handleAction(summary.id, 'approved')} icon={ThumbsUp} title="Approve" />
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