// src/views/01-Finance/AssetAndLoan.js
import React, { useState, useEffect, useMemo } from 'react';
import { getAssets, addAsset, getLoans, addLoan, deleteLoan } from '../../api/inventoryService'; // Import new service functions
import { formatCurrency, formatDate } from '../../utils/formatters';

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Modal from '../../components/shared/Modal';
import Notification from '../../components/shared/Notification';
import { PlusCircle, Landmark, TrendingDown, Trash2 } from 'lucide-react';

// --- Add Asset Form Component ---
const AddAssetForm = ({ onSuccess, onError }) => {
    const [formData, setFormData] = useState({ name: '', type: 'Plant', cost: '', purchaseDate: new Date().toISOString().split('T')[0] });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Call the new addAsset service function
            await addAsset({ ...formData, cost: parseFloat(formData.cost) });
            onSuccess('Asset added successfully!');
            setFormData({ name: '', type: 'Plant', cost: '', purchaseDate: new Date().toISOString().split('T')[0] }); // Reset form
        } catch (error) {
            console.error("Add Asset Error:", error);
            onError(error.response?.data?.message || 'Failed to add asset.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Plant 1" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" required />
            <input type="number" name="cost" value={formData.cost} onChange={handleChange} placeholder="e.g., 18000000" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" required />
            <select name="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white">
                <option>Plant</option>
                <option>Delivery Van</option>
                <option>Bobtail Truck</option>
                <option>Other</option>
            </select>
            <input type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
            <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Adding...' : 'Add Asset'}
                </Button>
            </div>
        </form>
    );
};

// --- Add Loan Form Component ---
const AddLoanForm = ({ onSuccess, onError }) => {
    const [formData, setFormData] = useState({ name: '', principal: '', interestRate: '10', term: '3' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Call the new addLoan service function
            await addLoan({
                ...formData,
                principal: parseFloat(formData.principal),
                interestRate: parseFloat(formData.interestRate),
                term: parseInt(formData.term, 10),
            });
            onSuccess(`Loan "${formData.name}" added successfully.`);
            setFormData({ name: '', principal: '', interestRate: '10', term: '3' }); // Reset form
        } catch (error) {
            console.error("Add Loan Error:", error);
            onError(error.response?.data?.message || 'Failed to add loan.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Loan Name (e.g., Plant & Van Loan)" className="w-full p-2 border rounded-md" required />
            <input type="number" name="principal" value={formData.principal} onChange={handleChange} placeholder="Principal Amount (₦)" className="w-full p-2 border rounded-md" required />
            <div className="flex gap-4">
                <input type="number" name="interestRate" value={formData.interestRate} onChange={handleChange} placeholder="Interest Rate (%)" className="w-full p-2 border rounded-md" required />
                <input type="number" name="term" value={formData.term} onChange={handleChange} placeholder="Term (Years)" className="w-full p-2 border rounded-md" required />
            </div>
            <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Adding...' : 'Add Loan'}
                </Button>
            </div>
        </form>
    );
};

// --- Main Asset & Loan View Component ---
export default function AssetAndLoan() {
    const [showAssetModal, setShowAssetModal] = useState(false);
    const [showLoanModal, setShowLoanModal] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    
    const [assets, setAssets] = useState([]);
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const fetchedAssets = await getAssets();
            const fetchedLoans = await getLoans();
            setAssets(fetchedAssets);
            setLoans(fetchedLoans);
        } catch (error) {
            console.error('Failed to fetch assets and loans:', error);
            handleError('Failed to load data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]); // Added fetchData to dependency array

    const totalAssetValue = useMemo(() => assets.reduce((sum, asset) => sum + asset.cost, 0), [assets]);
    const totalDepreciation = useMemo(() => assets.reduce((sum, asset) => sum + (asset.cost * 0.10), 0), [assets]);

    const handleSuccess = (message) => {
        setNotification({ show: true, message, type: 'success' });
        setShowAssetModal(false);
        setShowLoanModal(false);
        fetchData();
    };
    
    const handleError = (msg) => setNotification({ show: true, message: msg, type: 'error' });

    const handleRemoveLoan = async (loanId, loanName) => {
        if (window.confirm(`Are you sure you want to remove the loan "${loanName}"?`)) {
            try {
                await deleteLoan(loanId);
                handleSuccess(`Loan "${loanName}" removed.`);
            } catch (error) {
                console.error("Remove Loan Error:", error);
                handleError('Failed to remove loan.');
            }
        }
    };

    return (
        <>
            <Notification notification={notification} setNotification={setNotification} />
            {showAssetModal && <Modal title="Add New Fixed Asset" onClose={() => setShowAssetModal(false)}><AddAssetForm onSuccess={handleSuccess} onError={handleError} /></Modal>}
            {showLoanModal && <Modal title="Add New Loan" onClose={() => setShowLoanModal(false)}><AddLoanForm onSuccess={handleSuccess} onError={handleError} /></Modal>}

            <div className="flex justify-between items-center">
                <PageTitle title="Assets & Loans" subtitle="Manage fixed assets and track loan liabilities." />
                <Button onClick={() => setShowAssetModal(true)} icon={PlusCircle}>Add Asset</Button>
            </div>

            <h3 className="text-xl font-semibold text-gray-700 mt-6 mb-4 flex items-center"><Landmark className="mr-3" /> Fixed Asset Ledger</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card><h4 className="text-gray-500 text-sm font-medium">Total Asset Value</h4><p className="text-3xl font-bold text-gray-800 mt-1">{loading ? '...' : formatCurrency(totalAssetValue)}</p></Card>
                <Card><h4 className="text-gray-500 text-sm font-medium">Est. Annual Depreciation (10%)</h4><p className="text-3xl font-bold text-red-600 mt-1">{loading ? '...' : formatCurrency(totalDepreciation)}</p></Card>
            </div>
            <Card>
                {loading ? <p>Loading assets...</p> : (
                    <table className="w-full text-left">
                        <thead><tr className="border-b bg-gray-50"><th className="p-4 text-sm font-semibold text-gray-600">Asset Name</th><th className="p-4 text-sm font-semibold text-gray-600">Type</th><th className="p-4 text-sm font-semibold text-gray-600">Purchase Date</th><th className="p-4 text-sm font-semibold text-gray-600 text-right">Cost</th><th className="p-4 text-sm font-semibold text-gray-600 text-right">Annual Depreciation</th></tr></thead>
                        <tbody>{assets.map(asset => (<tr key={asset.id} className="border-b hover:bg-gray-50"><td className="p-4 font-medium">{asset.name}</td><td className="p-4">{asset.type}</td><td className="p-4">{formatDate(asset.purchaseDate)}</td><td className="p-4 text-right">{formatCurrency(asset.cost)}</td><td className="p-4 text-right text-red-600">{formatCurrency(asset.cost * 0.10)}</td></tr>))}</tbody>
                    </table>
                )}
            </Card>

            <div className="flex justify-between items-center mt-8 mb-4">
                <h3 className="text-xl font-semibold text-gray-700 flex items-center"><TrendingDown className="mr-3" /> Loan Management</h3>
                <Button onClick={() => setShowLoanModal(true)} icon={PlusCircle} variant="secondary">Add Loan</Button>
            </div>
            <Card>
                {loading ? <p>Loading loans...</p> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {loans.map(loan => (
                            <Card key={loan.id}>
                                <div className="flex justify-between items-start"><h4 className="text-lg font-bold text-gray-800">{loan.name}</h4><Button onClick={() => handleRemoveLoan(loan.id, loan.name)} variant="danger" icon={Trash2} /></div>
                                <div className="space-y-2 text-sm mt-2"><div className="flex justify-between"><span>Principal:</span> <span className="font-semibold">{formatCurrency(loan.principal)}</span></div><div className="flex justify-between"><span>Interest Rate:</span> <span className="font-semibold">{loan.interestRate}%</span></div><div className="flex justify-between"><span>Term:</span> <span className="font-semibold">{loan.term} years</span></div></div>
                            </Card>
                        ))}
                    </div>
                )}
            </Card>
        </>
    );
}