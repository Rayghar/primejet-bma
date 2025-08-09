// src/views/01-Finance/TaxCompliance.js
import React, { useMemo } from 'react';
import { useFirestoreQuery } from '../../hooks/useFirestoreQuery';
import { getMonthlyReportsQuery } from '../../api/firestoreService';
import { formatCurrency } from '../../utils/formatters';

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import { Printer, FileText } from 'lucide-react';

export default function TaxCompliance() {
    const { docs: monthlyReports, loading } = useFirestoreQuery(getMonthlyReportsQuery());

    const taxData = useMemo(() => {
        if (!monthlyReports || monthlyReports.length === 0) return null;

        const totals = monthlyReports.reduce((acc, report) => {
            acc.totalRevenue += report.totalRevenue;
            acc.totalExpenses += report.totalExpenses;
            return acc;
        }, { totalRevenue: 0, totalExpenses: 0 });

        const VAT_RATE = 0.075;
        const vatPayable = totals.totalRevenue * VAT_RATE;

        return {
            ...totals,
            vatPayable,
        };
    }, [monthlyReports]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return <PageTitle title="Tax Compliance Report" subtitle="Loading financial data..." />;
    }

    if (!taxData) {
        return <p>Could not calculate tax data. Please ensure you have sales and expense records in the system.</p>;
    }

    return (
        <>
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #print-section, #print-section * {
                        visibility: visible;
                    }
                    #print-section {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .no-print {
                        display: none;
                    }
                }
            `}</style>

            <div className="flex justify-between items-center no-print">
                <PageTitle title="Tax Compliance Report" subtitle="Generate reports formatted for FIRS/CAC submission." />
                <Button onClick={handlePrint} icon={Printer}>Print Report</Button>
            </div>

            <Card id="print-section">
                <div className="p-4 md:p-8">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-800">PrimeJet Gas LLC</h2>
                            <p className="text-sm text-gray-500">RC: 1234567</p>
                            <p className="text-sm text-gray-500">Lagos, Nigeria</p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-xl font-semibold text-gray-600">Official Tax Summary</h3>
                            <p className="text-sm text-gray-500">For Period Ending: {new Date().toLocaleDateString('en-GB')}</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                            <span className="font-medium text-gray-600">Total Revenue (Gross)</span>
                            <span className="font-bold text-lg text-gray-800">{formatCurrency(taxData.totalRevenue)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                            <span className="font-medium text-gray-600">Total Operational Expenses</span>
                            <span className="font-bold text-lg text-gray-800">{formatCurrency(taxData.totalExpenses)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <span className="font-medium text-blue-800">Value-Added Tax (VAT) at 7.5%</span>
                            <span className="font-bold text-lg text-blue-800">{formatCurrency(taxData.vatPayable)}</span>
                        </div>
                    </div>
                    <div className="mt-8 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
                        <h4 className="font-bold text-green-800">Pioneer Status Eligibility</h4>
                        <p className="text-sm text-green-700 mt-1">
                            As a company with Pioneer Status, PrimeJet Gas LLC is eligible for a 0% Corporate Income Tax rate for the initial period. This report is provided for VAT and other compliance records.
                        </p>
                    </div>
                    <div className="mt-12 pt-4 border-t text-center text-xs text-gray-400">
                        <p>Generated on {new Date().toString()}</p>
                        <p>This is a system-generated document from the PrimeJet Business Management Application.</p>
                    </div>
                </div>
            </Card>
        </>
    );
}