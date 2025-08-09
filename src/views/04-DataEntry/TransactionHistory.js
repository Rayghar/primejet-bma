import React, { useState } from 'react';
import { useFirestoreQuery } from '../../hooks/useFirestoreQuery';
import { getTransactionHistoryQuery, getPlantsQuery } from '../../api/firestoreService';
import { formatCurrency, formatDate } from '../../utils/formatters';

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Modal from '../../components/shared/Modal';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

const TransactionDetailModal = ({ transaction, onClose }) => {
    return (
        <Modal title="Transaction Details" onClose={onClose}>
            <div className="space-y-4 text-sm">
                <p><strong>Transaction ID:</strong> {transaction.id}</p>
                <p><strong>Type:</strong> {transaction.type}</p>
                <p><strong>Date:</strong> {formatDate(transaction.date)}</p>
                {transaction.type === 'sale' ? (
                    <>
                        <p><strong>KG Sold:</strong> {transaction.kgSold} kg</p>
                        <p><strong>Revenue:</strong> {formatCurrency(transaction.revenue)}</p>
                        <p><strong>Payment Method:</strong> {transaction.paymentMethod}</p>
                    </>
                ) : (
                    <>
                        <p><strong>Description:</strong> {transaction.description}</p>
                        <p><strong>Amount:</strong> {formatCurrency(transaction.amount)}</p>
                        <p><strong>Category:</strong> {transaction.category}</p>
                    </>
                )}
                <p><strong>Submitted By:</strong> {transaction.submittedBy?.email}</p>
            </div>
        </Modal>
    );
};

export default function TransactionHistory() {
    const [filters, setFilters] = useState({
        branchId: 'all',
        type: 'all',
        startDate: '',
        endDate: '',
    });
    const [lastDoc, setLastDoc] = useState(null);
    const [queryKey, setQueryKey] = useState(Date.now());
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    const { docs: plants } = useFirestoreQuery(getPlantsQuery());
    const query = getTransactionHistoryQuery(filters, lastDoc);
    const { docs: transactions, loading } = useFirestoreQuery(query);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setLastDoc(null); // Reset pagination on new search
        setQueryKey(Date.now()); // Force a re-fetch with new filters
    };
    
    // Rerunning the query with `lastDoc` will get the next page
    const handleNextPage = () => {
        if (transactions.length > 0) {
            setLastDoc(transactions[transactions.length - 1]);
            setQueryKey(Date.now());
        }
    };
    
    // A more complex implementation would handle previous pages
    // For now, this is a basic "next" pagination.

    return (
        <>
            {selectedTransaction && <TransactionDetailModal transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} />}
            <PageTitle title="Transaction History" subtitle="View and filter all approved business transactions." />

            <Card>
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-6">
                    <div>
                        <label className="block text-sm font-medium">Branch</label>
                        <select name="branchId" value={filters.branchId} onChange={handleFilterChange} className="mt-1 w-full p-2 border rounded-md bg-white">
                            <option value="all">All Branches</option>
                            {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Type</label>
                        <select name="type" value={filters.type} onChange={handleFilterChange} className="mt-1 w-full p-2 border rounded-md bg-white">
                            <option value="all">All Types</option>
                            <option value="sale">Sale</option>
                            <option value="expense">Expense</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Start Date</label>
                        <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="mt-1 w-full p-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">End Date</label>
                        <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="mt-1 w-full p-2 border rounded-md" />
                    </div>
                    <Button type="submit" icon={Search}>Search</Button>
                </form>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b bg-gray-50">
                                <th className="p-4 text-sm font-semibold">Date</th>
                                <th className="p-4 text-sm font-semibold">Type</th>
                                <th className="p-4 text-sm font-semibold">Details</th>
                                <th className="p-4 text-sm font-semibold text-right">Amount</th>
                                <th className="p-4 text-sm font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" className="text-center p-8">Loading history...</td></tr>
                            ) : transactions.length > 0 ? (
                                transactions.map(entry => (
                                    <tr key={entry.id} className="border-b hover:bg-gray-50">
                                        <td className="p-4">{formatDate(entry.date)}</td>
                                        <td className="p-4"><span className={`px-2 py-1 text-xs rounded-full ${entry.type === 'sale' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{entry.type}</span></td>
                                        <td className="p-4">{entry.type === 'sale' ? `${entry.kgSold} kg (${entry.paymentMethod})` : entry.description}</td>
                                        <td className="p-4 text-right font-semibold">{formatCurrency(entry.revenue || entry.amount)}</td>
                                        <td className="p-4"><Button onClick={() => setSelectedTransaction(entry)} variant="secondary" size="sm">View</Button></td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="5" className="text-center p-8 text-gray-500">No transactions found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end mt-4 space-x-2">
                    <Button onClick={() => {}} disabled={true} icon={ChevronLeft}>Previous</Button>
                    <Button onClick={handleNextPage} disabled={transactions.length < 25 || loading} icon={ChevronRight}>Next</Button>
                </div>
            </Card>
        </>
    );
}