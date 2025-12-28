import React, { useState, useEffect } from 'react';
import { getRevenueAssuranceReport } from '../../api/financialService';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ShieldCheck, AlertTriangle, Search } from 'lucide-react';

export default function RevenueAssurance() {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetches from V2 financials controller
        getRevenueAssuranceReport().then(data => {
            setBatches(data || []); 
            setLoading(false);
        });
    }, []);

    return (
        <div className="space-y-6">
            <PageTitle title="Revenue Assurance" subtitle="Inventory Audit & Leakage Detection" />

            {loading ? <p className="text-center text-gray-500">Auditing records...</p> : (
                <div className="grid grid-cols-1 gap-6">
                    {batches.map((batch, i) => {
                        const isLeakage = batch.discrepancy < -1000;
                        return (
                            <div key={i} className={`glass-card border-l-4 ${isLeakage ? 'border-red-500 bg-red-500/5' : 'border-green-500 bg-green-500/5'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center">
                                        {isLeakage ? <AlertTriangle className="text-red-500 mr-3"/> : <ShieldCheck className="text-green-500 mr-3"/>}
                                        <div>
                                            <h4 className="text-white font-bold">Batch #{batch.batchId}</h4>
                                            <p className="text-xs text-gray-400">{formatDate(batch.date)} • {batch.supplier}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 uppercase">Integrity</p>
                                        <p className={`font-bold ${isLeakage ? 'text-red-400' : 'text-green-400'}`}>{batch.integrityScore}%</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 text-sm bg-black/20 p-3 rounded-lg">
                                    <div>
                                        <p className="text-gray-500 text-xs">Expected (Stock)</p>
                                        <p className="text-white font-mono">{formatCurrency(batch.expectedRevenue)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs">Actual (Sales)</p>
                                        <p className="text-white font-mono">{formatCurrency(batch.actualRevenue)}</p>
                                    </div>
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
            )}
        </div>
    );
}