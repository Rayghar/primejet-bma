import React, { useState, useEffect } from 'react';
import { getTransactionHistory } from '../../api/dataEntryService';
import { getPlants } from '../../api/operationsService';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Notification from '../../components/shared/Notification';
import { formatCurrency, formatDate } from '../../utils/formatters';

const TransactionHistory = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [plants, setPlants] = useState([]);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        branchId: '',
    });

    useEffect(() => {
        fetchPlants();
        fetchTransactions();
    }, []);

    const fetchPlants = async () => {
        try {
            const plantList = await getPlants();
            setPlants(plantList);
        } catch (err) {
            console.error('Failed to fetch plants:', err);
        }
    };

    const fetchTransactions = async (currentFilters = filters) => {
        setLoading(true);
        try {
            const data = await getTransactionHistory(currentFilters);
            setTransactions(data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch transaction history:', err);
            setError('Failed to load transaction history. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        fetchTransactions(filters);
    };

    const getBranchName = (branchId) => {
        const plant = plants.find(p => p._id === branchId);
        return plant ? plant.name : 'N/A';
    };

    if (loading) {
        return <Card><p className="p-8 text-center">Loading transaction history...</p></Card>;
    }

    return (
        <>
            <PageTitle title="Transaction History" subtitle="View and search all sales and expense records." />
            {error && <Notification message={error} type="error" />}

            <Card className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Filters</h3>
                <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Start Date</label>
                        <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">End Date</label>
                        <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Branch</label>
                        <select name="branchId" value={filters.branchId} onChange={handleFilterChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                            <option value="">All Branches</option>
                            {plants.map(plant => (
                                <option key={plant._id} value={plant._id}>{plant.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <Button type="submit">Apply Filters</Button>
                    </div>
                </form>
            </Card>

            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {transactions.length > 0 ? (
                                transactions.map((tx) => (
                                    <tr key={tx._id} className={tx.transactionType ? 'bg-green-50' : 'bg-red-50'}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatDate(tx.createdAt, true)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.transactionType ? 'Sale' : 'Expense'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getBranchName(tx.branchId)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {tx.transactionType ? `${tx.kgSold?.toFixed(2) || 'N/A'} kg, ${tx.transactionType}` : tx.description}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(tx.amount)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No transactions found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </>
    );
};

export default TransactionHistory;