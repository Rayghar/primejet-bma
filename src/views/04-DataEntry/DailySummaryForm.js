// src/views/04-DataEntry/DailySummaryForm.js
import React, { useState } from 'react';
import { addDailySummary } from '../../api/firestoreService';
import Modal from '../../components/shared/Modal';
import Button from '../../components/shared/Button';
import { Send } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export default function DailySummaryForm({ user, date, reportData, onClose, onSuccess, onError }) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Here, we'll create a single daily summary object to submit for approval
            const summaryToSubmit = {
                date: date,
                branchId: reportData.sales[0]?.branchId, // Assuming all sales are from one branch
                totalRevenue: reportData.totals.totalRevenue,
                totalExpenses: reportData.totals.totalExpenses,
                entries: reportData.allEntries.map(entry => entry.id) // Submit a list of the entry IDs
            };
            await addDailySummary(summaryToSubmit, user); // A new firestore service function
            onSuccess('End-of-day report submitted for approval!');
            onClose();
        } catch (error) {
            console.error("Error submitting daily summary:", error);
            onError('Failed to submit end-of-day report.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal title={`End-of-Day Report Summary for ${date}`} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <h3 className="text-lg font-bold">Summary</h3>
                    <p>Total Revenue: <strong>{formatCurrency(reportData.totals.totalRevenue)}</strong></p>
                    <p>Total Expenses: <strong>{formatCurrency(reportData.totals.totalExpenses)}</strong></p>
                    <p>Net Income: <strong>{formatCurrency(reportData.totals.totalRevenue - reportData.totals.totalExpenses)}</strong></p>
                </div>

                <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={isSubmitting} icon={Send}>
                        {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}