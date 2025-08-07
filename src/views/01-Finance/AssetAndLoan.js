// src/views/01-Finance/AssetAndLoan.js (NEW)

import React, { useState, useMemo } from 'react';
import { useFirestoreQuery } from '../../hooks/useFirestoreQuery';
import { getAssetsQuery, addAsset } from '../../api/firestoreService';
import { formatDate, formatCurrency } from '../../utils/formatters';

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Modal from '../../components/shared/Modal';
import NotificationHandler from '../../components/shared/Notification';
import { PlusCircle, Landmark, Banknote, TrendingDown } from 'lucide-react';

// --- Add Asset Form Component ---
const AddAssetForm = ({ onSuccess, onError }) => {
    const [formData, setFormData] = useState({
        name: '',
        type: 'Plant',
        cost: '',
        purchaseDate: new Date().toISOString().split('T')[0],
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.cost) {
            onError('Asset name and cost are required.');
            return;
        }
        setIsSubmitting(true);
        try {
            await addAsset(formData);
            onSuccess('Asset added successfully!');
            setFormData({ name: '', type: 'Plant', cost: '', purchaseDate: new Date().toISOString().split('T')[0] });
        } catch (error) {
            console.error("Error adding asset:", error);
            onError('Failed to add asset.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Asset Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Plant 1" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
                <label htmlFor="cost" className="block text-sm font-medium text-gray-700">Purchase Cost (₦)</label>
                <input type="number" name="cost" value={formData.cost} onChange={handleChange} placeholder="e.g., 18000000" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">Asset Type</label>
                <select name="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white">
                    <option>Plant</option>
                    <option>Delivery Van</option>
                    <option>Bobtail Truck</option>
                    <option>Other</option>
                </select>
            </div>
            <div>
                <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700">Purchase Date</label>
                <input type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Adding...' : 'Add Asset'}
                </Button>
            </div>
        </form>
    );
};

// --- Loan Amortization Component ---
const LoanCard = ({ loan }) => {
    const annualRepayment = loan.principal / loan.term + (loan.principal * (loan.interestRate / 100));
    
    return (
        <Card>
            <div className="flex items-center mb-2">
                <Banknote className="mr-3 text-blue-500" />
                <h4 className="text-lg font-bold text-gray-800">{loan.name}</h4>
            </div>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Principal:</span> <span className="font-semibold">{formatCurrency(loan.principal)}</span></div>
                <div className="flex justify-between"><span>Interest Rate:</span> <span className="font-semibold">{loan.interestRate}%</span></div>
                <div className="flex justify-between"><span>Term:</span> <span className="font-semibold">{loan.term} years</span></div>
                <div className="flex justify-between"><span>Disbursed:</span> <span className="font-semibold">{loan.disbursed}</span></div>
                <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="font-bold">Est. Annual Repayment:</span> 
                    <span className="font-bold text-red-600">{formatCurrency(annualRepayment)}</span>
                </div>
            </div>
        </Card>
    );
};

// --- Main View Component ---
export default function AssetAndLoan() {
    const [showModal, setShowModal] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    
    const { docs: assets, loading } = useFirestoreQuery(getAssetsQuery());

    const totalAssetValue = useMemo(() => assets.reduce((sum, asset) => sum + asset.cost, 0), [assets]);
    const totalDepreciation = useMemo(() => assets.reduce((sum, asset) => sum + (asset.cost * 0.10), 0), [assets]);

    const loans = [
        { name: 'Plant & Van Loan', principal: 78000000, interestRate: 10, term: 3, disbursed: 'June 2025' },
        { name: 'Bobtail Truck Loan', principal: 60000000, interestRate: 10, term: 3, disbursed: 'April 2026' },
    ];

    const handleSuccess = (message) => {
        setNotification({ show: true, message, type: 'success' });
        setShowModal(false);
    };

    return (
        <>
            <NotificationHandler notification={notification} setNotification={setNotification} />
            {showModal && (
                <Modal title="Add New Fixed Asset" onClose={() => setShowModal(false)}>
                    <AddAssetForm onSuccess={handleSuccess} onError={(msg) => setNotification({ show: true, message: msg, type: 'error' })} />
                </Modal>
            )}

            <div className="flex justify-between items-center">
                <PageTitle title="Assets & Loans" subtitle="Manage fixed assets and track loan liabilities." />
                <Button onClick={() => setShowModal(true)} icon={PlusCircle}>Add Asset</Button>
            </div>

            {/* Asset Section */}
            <h3 className="text-xl font-semibold text-gray-700 mt-6 mb-4 flex items-center"><Landmark className="mr-3" /> Fixed Asset Ledger</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                    <h4 className="text-gray-500 text-sm font-medium">Total Asset Value</h4>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{loading ? '...' : formatCurrency(totalAssetValue)}</p>
                </Card>
                <Card>
                    <h4 className="text-gray-500 text-sm font-medium">Est. Annual Depreciation (10%)</h4>
                    <p className="text-3xl font-bold text-red-600 mt-1">{loading ? '...' : formatCurrency(totalDepreciation)}</p>
                </Card>
            </div>
            <Card>
                {loading ? <p>Loading assets...</p> : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b bg-gray-50">
                                <th className="p-4 text-sm font-semibold text-gray-600">Asset Name</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">Type</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">Purchase Date</th>
                                <th className="p-4 text-sm font-semibold text-gray-600 text-right">Cost</th>
                                <th className="p-4 text-sm font-semibold text-gray-600 text-right">Annual Depreciation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assets.map(asset => (
                                <tr key={asset.id} className="border-b hover:bg-gray-50">
                                    <td className="p-4 font-medium">{asset.name}</td>
                                    <td className="p-4">{asset.type}</td>
                                    <td className="p-4">{formatDate(asset.purchaseDate)}</td>
                                    <td className="p-4 text-right">{formatCurrency(asset.cost)}</td>
                                    <td className="p-4 text-right text-red-600">{formatCurrency(asset.cost * 0.10)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Card>

            {/* Loan Section */}
            <h3 className="text-xl font-semibold text-gray-700 mt-8 mb-4 flex items-center"><TrendingDown className="mr-3" /> Loan Amortization</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loans.map(loan => <LoanCard key={loan.name} loan={loan} />)}
            </div>
        </>
    );
}
