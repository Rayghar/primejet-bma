import React, { useState, useEffect } from 'react';
import { getRevenueAssuranceReport } from '../../api/financialService';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

export default function RevenueAssurance() {
    const [report, setReport] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getRevenueAssuranceReport().then(data => {
            setReport(data || []);
            setLoading(false);
        });
    }, []);

    if(loading) return <div className="p-8 text-center text-blue-400 animate-pulse">Running Revenue Audit...</div>;

    return (
        <div className="space-y-6">
            <PageTitle title="Revenue Assurance" subtitle="Inventory vs. Revenue Reconciliation" />
            
            <div className="grid gap-4">
                {report.map((batch, i) => {
                    const isLeakage = batch.discrepancy < -500;
                    return (
                        <div key={i} className={`glass-card border-l-4 ${isLeakage ? 'border-red-500' : 'border-green-500'}`}>
                            <div className="flex justify-between mb-4">
                                <div className="flex items-center">
                                    {isLeakage ? <AlertTriangle className="text-red-500 mr-3"/> : <ShieldCheck className="text-green-500 mr-3"/>}
                                    <div>
                                        <h4 className="text-white font-bold">{batch.batchId}</h4>
                                        <p className="text-xs text-gray-400">{formatDate(batch.date)}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">Integrity</p>
                                    <p className={`font-bold ${isLeakage ? 'text-red-400' : 'text-green-400'}`}>{batch.integrityScore}%</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 bg-black/20 p-3 rounded-lg text-sm">
                                <div><p className="text-gray-500 text-xs">Expected</p><p className="text-white font-mono">{formatCurrency(batch.expectedRevenue)}</p></div>
                                <div><p className="text-gray-500 text-xs">Actual</p><p className="text-white font-mono">{formatCurrency(batch.actualRevenue)}</p></div>
                                <div>
                                    <p className="text-gray-500 text-xs">Discrepancy</p>
                                    <p className={`font-mono font-bold ${isLeakage ? 'text-red-400' : 'text-green-400'}`}>
                                        {formatCurrency(batch.discrepancy)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}