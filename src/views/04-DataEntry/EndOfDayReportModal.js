// src/views/04-DataEntry/EndOfDayReportModal.js
import React, { useState, useEffect } from 'react';
import { getEntriesForDate } from '../../api/firestoreService';
import { formatDate, formatCurrency } from '../../utils/formatters';
import Modal from '../../components/shared/Modal';
import Button from '../../components/shared/Button';
import { Printer } from 'lucide-react';

export default function EndOfDayReportModal({ date, onClose }) {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            try {
                const entries = await getEntriesForDate(date);
                
                const sales = entries.filter(e => e.type === 'sale');
                const expenses = entries.filter(e => e.type === 'expense');

                const totals = {
                    totalRevenue: sales.reduce((sum, s) => sum + s.revenue, 0),
                    totalKgSold: sales.reduce((sum, s) => sum + s.kgSold, 0),
                    totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
                };

                setReportData({ sales, expenses, totals });
            } catch (error) {
                console.error("Failed to fetch report data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, [date]);

    const handlePrint = () => {
        const printContents = document.getElementById('report-content').innerHTML;
        const originalContents = document.body.innerHTML;
        document.body.innerHTML = `<html><head><title>Print Report</title></head><body>${printContents}</body></html>`;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload();
    };

    return (
        <Modal title={`End-of-Day Report for ${formatDate(date)}`} onClose={onClose}>
            {loading ? (
                <p>Generating report...</p>
            ) : reportData ? (
                <div>
                    <div id="report-content">
                        <h1 style={{color: 'black', fontSize: '24px', fontWeight: 'bold'}}>PrimeJet Gas LLC</h1>
                        <h2 style={{color: 'black', fontSize: '18px'}}>End-of-Day Summary</h2>
                        <p style={{color: 'black'}}>Date: {formatDate(date)}</p>
                        <hr style={{margin: '1rem 0'}} />

                        <h3 style={{color: 'black', fontWeight: 'bold'}}>Summary</h3>
                        <p>Total Revenue: <strong>{formatCurrency(reportData.totals.totalRevenue)}</strong></p>
                        <p>Total LPG Sold: <strong>{reportData.totals.totalKgSold.toLocaleString()} kg</strong></p>
                        <p>Total Expenses: <strong>{formatCurrency(reportData.totals.totalExpenses)}</strong></p>
                        
                        <hr style={{margin: '1rem 0'}} />
                        <h3 style={{color: 'black', fontWeight: 'bold'}}>All Sales</h3>
                        {reportData.sales.length > 0 ? reportData.sales.map((s, i) => (
                            <p key={`sale-${i}`}>{s.kgSold} kg ({s.paymentMethod}) - {formatCurrency(s.revenue)}</p>
                        )) : <p>No sales recorded.</p>}

                        <hr style={{margin: '1rem 0'}} />
                        <h3 style={{color: 'black', fontWeight: 'bold'}}>All Expenses</h3>
                        {reportData.expenses.length > 0 ? reportData.expenses.map((e, i) => (
                            <p key={`exp-${i}`}>{e.description} ({e.category}) - {formatCurrency(e.amount)}</p>
                        )) : <p>No expenses recorded.</p>}
                    </div>
                    <div className="flex justify-end pt-4 no-print">
                        <Button onClick={handlePrint} icon={Printer}>Print Report</Button>
                    </div>
                </div>
            ) : (
                <p>Could not generate report.</p>
            )}
        </Modal>
    );
}