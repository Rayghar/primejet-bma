// src/views/04-DataEntry/TransactionHistory.js
import React, { useState, useEffect } from 'react';
import { getTransactionHistory } from '../../api/dataEntryService'; // Import the new service function
import { getPlants } from '../../api/operationsService'; // Import to get plant list for dropdown
import { formatCurrency, formatDate } from '../../utils/formatters';

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Modal from '../../components/shared/Modal';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

// --- TransactionDetailModal Sub-component ---
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
                <p><strong>Submitted By:</strong> {transaction.submittedBy?.email || 'N/A'}</p>
                {transaction.reviewedBy && <p><strong>Reviewed By:</strong> {transaction.reviewedBy?.email || 'N/A'}</p>}
                {transaction.dailySummaryId && <p><strong>Daily Summary ID:</strong> {transaction.dailySummaryId}</p>}
            </div>
        </Modal>
    );
};

// --- Main TransactionHistory View Component ---
export default function TransactionHistory() {
    const [filters, setFilters] = useState({
        branchId: 'all',
        type: 'all',
        startDate: '',
        endDate: '',
        page: 1, // Current page number
        limit: 25, // Items per page
    });
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [plants, setPlants] = useState([]); // State to hold plant list for dropdown
    const [totalPages, setTotalPages] = useState(1);
    const [totalTransactions, setTotalTransactions] = useState(0);

    // Fetch plants for the branch filter dropdown
    useEffect(() => {
        const fetchPlants = async () => {
            try {
                const plantList = await getPlants();
                setPlants(plantList);
            } catch (error) {
                console.error('Failed to fetch plants for filter:', error);
            }
        };
        fetchPlants();
    }, []);

    // Fetch transactions based on current filters
    useEffect(() => {
        const fetchTransactions = async () => {
            setLoading(true);
            try {
                // Call the new getTransactionHistory service function
                const result = await getTransactionHistory(filters);
                setTransactions(result.transactions);
                setTotalPages(result.totalPages);
                setTotalTransactions(result.totalTransactions);
            } catch (error) {
                console.error('Failed to fetch transactions:', error);
                // Optionally, set a notification or error state here
            } finally {
                setLoading(false);
            }
        };
        fetchTransactions();
    }, [filters]); // Re-fetch when filters change

    // Handles changes to filter input fields.
    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value, page: 1 })); // Reset to page 1 on filter change
    };

    // Handles search button click (re-fetches with current filters)
    const handleSearch = (e) => {
        e.preventDefault();
        setFilters(prev => ({ ...prev, page: 1 })); // Ensure page is reset to 1
    };
    
    // Handles pagination: navigate to the next page
    const handleNextPage = () => {
        setFilters(prev => ({ ...prev, page: prev.page + 1 }));
    };

    // Handles pagination: navigate to the previous page
    const handlePreviousPage = () => {
        setFilters(prev => ({ ...prev, page: prev.page - 1 }));
    };

    return (
        <>
            {selectedTransaction && <TransactionDetailModal transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} />}
            <PageTitle title="Transaction History" subtitle="View and filter all approved business transactions." />

            <Card>
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-6">
                    {/* Branch Filter */}
                    <div>
                        <label htmlFor="filter-branch" className="block text-sm font-medium">Branch</label>
                        <select 
                            id="filter-branch"
                            name="branchId" 
                            value={filters.branchId} 
                            onChange={handleFilterChange} 
                            className="mt-1 w-full p-2 border rounded-md bg-white"
                        >
                            <option value="all">All Branches</option>
                            {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    {/* Type Filter */}
                    <div>
                        <label htmlFor="filter-type" className="block text-sm font-medium">Type</label>
                        <select 
                            id="filter-type"
                            name="type" 
                            value={filters.type} 
                            onChange={handleFilterChange} 
                            className="mt-1 w-full p-2 border rounded-md bg-white"
                        >
                            <option value="all">All Types</option>
                            <option value="sale">Sale</option>
                            <option value="expense">Expense</option>
                        </select>
                    </div>
                    {/* Start Date Filter */}
                    <div>
                        <label htmlFor="filter-start-date" className="block text-sm font-medium">Start Date</label>
                        <input 
                            type="date" 
                            id="filter-start-date"
                            name="startDate" 
                            value={filters.startDate} 
                            onChange={handleFilterChange} 
                            className="mt-1 w-full p-2 border rounded-md" 
                        />
                    </div>
                    {/* End Date Filter */}
                    <div>
                        <label htmlFor="filter-end-date" className="block text-sm font-medium">End Date</label>
                        <input 
                            type="date" 
                            id="filter-end-date"
                            name="endDate" 
                            value={filters.endDate} 
                            onChange={handleFilterChange} 
                            className="mt-1 w-full p-2 border rounded-md" 
                        />
                    </div>
                    {/* Search Button */}
                    <Button type="submit" icon={Search}>Search</Button>
                </form>
                
                {/* Transaction Table */}
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
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs rounded-full ${entry.type === 'sale' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {entry.type}
                                            </span>
                                        </td>
                                        <td className="p-4">{entry.type === 'sale' ? `${entry.kgSold} kg (${entry.paymentMethod})` : entry.description}</td>
                                        <td className="p-4 text-right font-semibold">{formatCurrency(entry.revenue || entry.amount)}</td>
                                        <td className="p-4">
                                            <Button onClick={() => setSelectedTransaction(entry)} variant="secondary" size="sm">View</Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="5" className="text-center p-8 text-gray-500">No transactions found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-gray-600">Showing {transactions.length} of {totalTransactions} transactions.</p>
                    <div className="flex space-x-2">
                        <Button 
                            onClick={handlePreviousPage} 
                            disabled={filters.page <= 1 || loading} 
                            icon={ChevronLeft}
                        >
                            Previous
                        </Button>
                        <Button 
                            onClick={handleNextPage} 
                            disabled={filters.page >= totalPages || loading} 
                            icon={ChevronRight}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </Card>
        </>
    );
}