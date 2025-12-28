import React, { useState, useEffect } from 'react';
import { getPendingApprovals, approveSummary, rejectSummary } from '../../api/dataEntryService'; // Ensure rejectSummary is exported
import { formatCurrency, formatDate } from '../../utils/formatters';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Notification from '../../components/shared/Notification';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function ApprovalQueue() {
    const [summaries, setSummaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    const fetchQueue = async () => {
        setLoading(true);
        try {
            const data = await getPendingApprovals();
            setSummaries(data || []);
        } catch (e) {
            setNotification({ show: true, message: 'Failed to load queue', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchQueue(); }, []);

    const handleAction = async (id, action) => {
        const confirmMsg = action === 'approve' ? "Approve this report?" : "Reject this report?";
        if (!window.confirm(confirmMsg)) return;

        try {
            if (action === 'approve') await approveSummary(id);
            else await rejectSummary(id); // Assume this function exists in service
            
            setNotification({ show: true, message: `Report ${action}d successfully`, type: 'success' });
            fetchQueue();
        } catch (e) {
            setNotification({ show: true, message: 'Action failed', type: 'error' });
        }
    };

    return (
        <div className="space-y-6">
            <Notification notification={notification} setNotification={setNotification} />
            <PageTitle title="Approval Queue" subtitle="Pending End-of-Day Reports" />

            {loading ? <p className="text-center text-gray-500 animate-pulse">Checking for pending reports...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {summaries.length === 0 ? (
                        <div className="col-span-full text-center py-20 text-gray-500">
                            <CheckCircle size={48} className="mx-auto mb-4 text-green-500/50"/>
                            <p>All caught up! No pending approvals.</p>
                        </div>
                    ) : summaries.map(sum => (
                        <div key={sum.id || sum._id} className="glass-card border-l-4 border-yellow-500 relative">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-white text-lg">{sum.branchName || 'Unknown Branch'}</h3>
                                    <p className="text-xs text-gray-400">{formatDate(sum.date)} • {sum.cashierName}</p>
                                </div>
                                <span className="bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded text-xs font-bold uppercase">Review</span>
                            </div>

                            <div className="space-y-3 mb-6 bg-black/20 p-4 rounded-xl">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Total Revenue</span>
                                    <span className="text-green-400 font-bold">{formatCurrency(sum.totalRevenue)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Total Expenses</span>
                                    <span className="text-red-400 font-bold">{formatCurrency(sum.totalExpenses)}</span>
                                </div>
                                <div className="border-t border-white/10 pt-2 flex justify-between text-sm">
                                    <span className="text-white">Net Cash</span>
                                    <span className="text-white font-bold">{formatCurrency(sum.netCash)}</span>
                                </div>
                            </div>

                            {/* Discrepancy Alert */}
                            {sum.reconciliation?.discrepancy !== 0 && (
                                <div className="flex items-center text-xs text-red-400 mb-4 bg-red-500/10 p-2 rounded">
                                    <AlertTriangle size={14} className="mr-2" />
                                    Discrepancy: {formatCurrency(sum.reconciliation.discrepancy)}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button onClick={() => handleAction(sum.id || sum._id, 'approve')} className="flex-1 bg-green-600 hover:bg-green-500 text-xs">Approve</Button>
                                <Button onClick={() => handleAction(sum.id || sum._id, 'reject')} className="flex-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 text-xs">Reject</Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}