import React, { useState, useEffect } from 'react';
import { getTaxComplianceReport } from '../../api/financialService';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import { formatCurrency } from '../../utils/formatters';
import { Landmark, FileCheck } from 'lucide-react';

export default function TaxCompliance() {
    const [report, setReport] = useState(null);

    useEffect(() => {
        getTaxComplianceReport().then(setReport);
    }, []);

    if (!report) return <div className="p-8 text-center text-gray-500">Loading Tax Data...</div>;

    return (
        <div className="space-y-6">
            <PageTitle title="Tax Compliance" subtitle="VAT & Regulatory Reporting" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card bg-blue-600/10 border border-blue-500/30">
                    <div className="flex items-center mb-4">
                        <div className="p-3 bg-blue-500/20 rounded-full mr-3"><Landmark className="text-blue-400"/></div>
                        <div>
                            <p className="text-xs text-blue-300 uppercase font-bold">VAT Payable</p>
                            <p className="text-3xl font-bold text-white">{formatCurrency(report.vatPayable)}</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-400">Based on {formatCurrency(report.taxableRevenue)} taxable revenue at 7.5%</p>
                </div>

                <div className="glass-card">
                    <h3 className="font-bold text-white mb-4">Compliance Status</h3>
                    <div className="flex items-center p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <FileCheck className="text-green-400 mr-3" />
                        <div>
                            <p className="text-green-300 font-bold text-sm">Pioneer Status Active</p>
                            <p className="text-xs text-gray-400">Corporate Income Tax (CIT) Exempt</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}