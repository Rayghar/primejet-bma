// src/views/04-DataEntry/ApprovalQueue.js
import React, { useState, useEffect } from 'react';
import { getPendingSummaries, updateSummaryStatus } from '../../api/dataEntryService';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../hooks/useAuth';

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Notification from '../../components/shared/Notification';
import { CheckCircle, XCircle } from 'lucide-react';

export default function ApprovalQueue() {
    const [pendingSummaries, setPendingSummaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    const { user } = useAuth();

    const fetchPendingSummaries = async () => {
        setLoading(true);
        try {
            const summaries = await getPendingSummaries();
            setPendingSummaries(summaries);
        } catch (error) {
            console.error('Failed to fetch pending summaries:', error);
            handleError('Failed to load pending summaries.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingSummaries();
    }, [fetchPendingSummaries]); // Added fetchPendingSummaries to dependency array

    const handleSuccess = (message) => {
        setNotification({ show: true, message, type: 'success' });
        fetchPendingSummaries();
    };
    
    const handleError = (msg) => setNotification({ show: true, message: msg, type: 'error' });

    const handleSummaryAction = async (summaryId, status) => {
        if (!user || !user.id || !user.email) {
            handleError('User information missing. Cannot perform action.');
            return;
        }

        const actionText = status === 'approved' ? 'approve' : 'reject';
        if (!window.confirm(`Are you sure you want to ${actionText} this daily summary?`)) {
            return;
        }

        try {
            await updateSummaryStatus(summaryId, status);
            handleSuccess(`Daily summary ${status} successfully.`);
        } catch (error) {
            console.error(`Failed to ${actionText} summary ${summaryId}:`, error);
            handleError(error.response?.data?.message || `Failed to ${actionText} summary.`);
        }
    };

    return (
        <>
            <Notification notification={notification} setNotification={setNotification} />
            <PageTitle title="Approval Queue" subtitle="Review and approve daily sales and expense summaries." />

            <Card>
                {loading ? (
                    <p>Loading pending summaries...</p>
                ) : pendingSummaries.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b bg-gray-50">
                                    <th className="p-4 text-sm font-semibold text-gray-600">Date</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600">Branch</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600">Cashier</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600 text-right">Total Revenue</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600 text-right">Total Expenses</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingSummaries.map(summary => (
                                    <tr key={summary.id} className="border-b hover:bg-gray-50">
                                        <td className="p-4">{formatDate(summary.date)}</td>
                                        <td className="p-4">{summary.branchId}</td>
                                        <td className="p-4">{summary.cashierName || summary.submittedBy?.email || 'N/A'}</td>
                                        <td className="p-4 text-right font-semibold">{formatCurrency(summary.sales?.totalRevenue || 0)}</td>
                                        <td className="p-4 text-right text-red-600">{formatCurrency(summary.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0)}</td>
                                        <td className="p-4 flex space-x-2">
                                            <Button 
                                                onClick={() => handleSummaryAction(summary.id, 'approved')} 
                                                variant="primary" 
                                                icon={CheckCircle} 
                                                title="Approve"
                                            >
                                                Approve
                                            </Button>
                                            <Button 
                                                onClick={() => handleSummaryAction(summary.id, 'rejected')} 
                                                variant="danger" 
                                                icon={XCircle} 
                                                title="Reject"
                                            >
                                                Reject
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-500 text-center p-8">No daily summaries pending approval.</p>
                )}
            </Card>
        </>
    );
}