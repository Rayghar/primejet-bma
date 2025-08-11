// src/views/01-Finance/TaxCompliance.js (Refactored)

import React, { useState, useEffect } from 'react';
import { getTaxComplianceReport } from '../../api/inventoryService'; // Import the new service function
import { formatCurrency } from '../../utils/formatters';

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import { Printer, FileText } from 'lucide-react';

export default function TaxCompliance() {
    const [taxData, setTaxData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch pre-calculated tax compliance data from the Node.js backend
                const data = await getTaxComplianceReport();
                setTaxData(data);
            } catch (error) {
                console.error('Failed to fetch tax compliance data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []); // Empty dependency array means this runs once on mount

    const handlePrint = () => {
        // This function prepares the content for printing by isolating the report section.
        // It's a client-side print functionality.
        const printContents = document.getElementById('tax-report-content').innerHTML;
        const originalContents = document.body.innerHTML;

        // Temporarily replace body content with only the report for printing
        document.body.innerHTML = `<html><head><title>Tax Compliance Report</title></head><body>${printContents}</body></html>`;
        window.print(); // Trigger the browser's print dialog
        document.body.innerHTML = originalContents; // Restore original content
        window.location.reload(); // Reload to ensure all scripts/styles are re-applied correctly
    };

    if (loading) {
        return <PageTitle title="Tax Compliance" subtitle="Calculating tax obligations..." />;
    }

    if (!taxData) {
        return (
            <Card>
                <p className="text-center p-8 text-gray-500">
                    Could not generate tax compliance report. Please ensure you have sales and expense records in the system.
                </p>
            </Card>
        );
    }

    return (
        <>
            <div className="flex justify-between items-center mb-4">
                <PageTitle title="Tax Compliance" subtitle="Overview of your tax obligations." />
                <Button onClick={handlePrint} icon={Printer}>Print Report</Button>
            </div>
            <Card>
                <div id="tax-report-content" className="p-4"> {/* ID for print functionality */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">PrimeJet Gas LLC Tax Compliance Report</h2>
                    <p className="text-gray-600 mb-6">Summary of revenue, expenses, and VAT payable.</p>

                    <div className="space-y-4 text-base">
                        <div className="flex justify-between items-center p-4 rounded-lg border border-gray-200">
                            <span className="font-medium text-gray-700">Total Revenue (Approved Sales)</span>
                            <span className="font-bold text-lg text-green-600">{formatCurrency(taxData.totalRevenue)}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 rounded-lg border border-gray-200">
                            <span className="font-medium text-gray-700">Total Expenses (Approved)</span>
                            <span className="font-bold text-lg text-red-600">{formatCurrency(taxData.totalExpenses)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <span className="font-medium text-blue-800">Value-Added Tax (VAT) at 7.5%</span>
                            <span className="font-bold text-lg text-blue-800">{formatCurrency(taxData.vatPayable)}</span>
                        </div>
                    </div>

                    {/* Pioneer Status Note */}
                    <div className="mt-8 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
                        <h4 className="font-bold text-green-800">Pioneer Status Eligibility</h4>
                        <p className="text-sm text-green-700 mt-1">
                            As a company with Pioneer Status, PrimeJet Gas LLC is eligible for a 0% Corporate Income Tax rate for the initial period. This report is provided for VAT and other compliance records.
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="mt-12 pt-4 border-t text-center text-xs text-gray-400">
                        <p>Generated on {new Date().toLocaleString()}</p>
                        <p>This is a system-generated document from the PrimeJet Business Management Application.</p>
                    </div>
                </div>
            </Card>
        </>
    );
}