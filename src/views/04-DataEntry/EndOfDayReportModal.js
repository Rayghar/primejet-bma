// src/views/04-DataEntry/EndOfDayReportModal.js
import React, { useState, useEffect } from 'react';
import { getDailySummaryReport } from '../../api/dataEntryService'; // Import the new service function
import { formatDate, formatCurrency } from '../../utils/formatters';
import Modal from '../../components/shared/Modal';
import Button from '../../components/shared/Button';
import { Printer } from 'lucide-react';

export default function EndOfDayReportModal({ summaryId, date, onClose }) { // Accept summaryId instead of just date
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            try {
                // Fetch the detailed report from the backend using the summaryId
                const data = await getDailySummaryReport(summaryId);
                setReportData(data);
            } catch (error) {
                console.error("Failed to fetch report data:", error);
                // Optionally, set a notification or error state here
            } finally {
                setLoading(false);
            }
        };

        if (summaryId) { // Only fetch if summaryId is provided
            fetchReportData();
        } else {
            setLoading(false); // If no summaryId, stop loading and show error
            setReportData(null);
        }
    }, [summaryId]); // Re-fetch when summaryId changes

    const handlePrint = () => {
        // Create a new window for printing to isolate content
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Print Report</title>');
        // Add basic print styles
        printWindow.document.write('<style>');
        printWindow.document.write(`
            body { font-family: sans-serif; margin: 20px; }
            .report-header { text-align: center; margin-bottom: 20px; }
            .report-header h1 { font-size: 24px; margin-bottom: 5px; }
            .report-header h2 { font-size: 18px; margin-bottom: 10px; }
            .summary-section h3 { font-size: 16px; margin-top: 15px; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            .summary-section p { margin-bottom: 5px; }
            .summary-section hr { border: 0; border-top: 1px dashed #ccc; margin: 10px 0; }
            .total-line { font-weight: bold; }
            @media print {
                .no-print { display: none !important; }
            }
        `);
        printWindow.document.write('</style></head><body>');
        
        // Write the content to the new window
        const reportContent = document.getElementById('report-content').innerHTML;
        printWindow.document.write(reportContent);
        
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };

    return (
        <Modal title={`End-of-Day Report for ${formatDate(reportData?.summary?.date || date)}`} onClose={onClose}>
            {loading ? (
                <p className="text-center p-8">Generating report...</p>
            ) : reportData ? (
                <div>
                    <div id="report-content">
                        <div className="report-header">
                            <h1>PrimeJet Gas LLC</h1>
                            <h2>End-of-Day Summary</h2>
                            <p>Date: {formatDate(reportData.summary.date)}</p>
                            <p>Branch: {reportData.summary.branchId}</p> {/* Display branch ID, ideally would populate name */}
                            <p>Cashier: {reportData.summary.cashierName || reportData.summary.submittedBy?.email || 'N/A'}</p>
                        </div>
                        <hr />

                        <div className="summary-section">
                            <h3>Summary</h3>
                            <p>Total Revenue: <strong className="float-right">{formatCurrency(reportData.totals.totalRevenue)}</strong></p>
                            <p>Total LPG Sold: <strong className="float-right">{reportData.totals.totalKgSold.toLocaleString()} kg</strong></p>
                            <p>Total Expenses: <strong className="float-right">{formatCurrency(reportData.totals.totalExpenses)}</strong></p>
                        </div>
                        
                        <hr />
                        <div className="summary-section">
                            <h3>Sales Details</h3>
                            {reportData.sales.length > 0 ? reportData.sales.map((s, i) => (
                                <p key={`sale-${s.id || i}`}>{s.kgSold} kg ({s.paymentMethod}) - <span className="float-right">{formatCurrency(s.revenue)}</span></p>
                            )) : <p>No sales recorded.</p>}
                        </div>

                        <hr />
                        <div className="summary-section">
                            <h3>Expense Details</h3>
                            {reportData.expenses.length > 0 ? reportData.expenses.map((e, i) => (
                                <p key={`exp-${e.id || i}`}>{e.description} ({e.category}) - <span className="float-right">{formatCurrency(e.amount)}</span></p>
                            )) : <p>No expenses recorded.</p>}
                        </div>

                        <hr />
                        <div className="summary-section">
                            <h3>Meter Readings</h3>
                            <p>Opening Meter A: <span className="float-right">{reportData.summary.meters.openingMeterA} kg</span></p>
                            <p>Closing Meter A: <span className="float-right">{reportData.summary.meters.closingMeterA} kg</span></p>
                            <p>Opening Meter B: <span className="float-right">{reportData.summary.meters.openingMeterB} kg</span></p>
                            <p>Closing Meter B: <span className="float-right">{reportData.summary.meters.closingMeterB} kg</span></p>
                            <p>Price Per Kg: <span className="float-right">{formatCurrency(reportData.summary.meters.pricePerKg)}</span></p>
                        </div>
                    </div>
                    <div className="flex justify-end pt-4 no-print">
                        <Button onClick={handlePrint} icon={Printer}>Print Report</Button>
                    </div>
                </div>
            ) : (
                <p className="text-center p-8 text-gray-500">Could not generate report. Summary not found or data is incomplete.</p>
            )}
        </Modal>
    );
}