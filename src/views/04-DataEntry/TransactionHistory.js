import React, { useState, useEffect } from 'react';
import { getTransactionHistory } from '../../api/dataEntryService';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Search, Filter } from 'lucide-react';

export default function TransactionHistory() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        getTransactionHistory().then(data => {
            setTransactions(data || []);
            setLoading(false);
        });
    }, []);

    const filtered = transactions.filter(t => 
        t.description?.toLowerCase().includes(filter.toLowerCase()) || 
        t.type?.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <PageTitle title="Transaction Ledger" subtitle="Historical record of all POS entries" />
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Search ledger..." 
                        className="glass-input pl-10 py-2 w-64 text-sm"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-500" size={16}/>
                </div>
            </div>

            <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-white/5 text-gray-300 uppercase text-xs">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Type</th>
                                <th className="p-4">Description</th>
                                <th className="p-4 text-right">Amount</th>
                                <th className="p-4">Cashier</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filtered.map(tx => (
                                <tr key={tx.id || tx._id} className="hover:bg-white/5">
                                    <td className="p-4">{formatDate(tx.date || tx.createdAt)}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${tx.type === 'sale' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td className="p-4 text-white">
                                        {tx.type === 'sale' ? `${tx.kgSold}kg LPG` : tx.description}
                                    </td>
                                    <td className={`p-4 text-right font-mono font-bold ${tx.type === 'sale' ? 'text-green-400' : 'text-red-400'}`}>
                                        {tx.type === 'expense' ? '-' : ''}{formatCurrency(tx.amount)}
                                    </td>
                                    <td className="p-4 text-xs">{tx.cashierName || 'Unknown'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}