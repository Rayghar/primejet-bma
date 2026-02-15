import React, { useState, useEffect } from 'react';
import { getAssets, addAsset, getLoans, addLoan, deleteAsset, deleteLoan } from '../../api/inventoryService';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Modal from '../../components/shared/Modal';
import { formatCurrency } from '../../utils/formatters';
import { PlusCircle, Trash2, Building, TrendingDown, Calculator } from 'lucide-react';

export default function AssetAndLoan() {
    const [assets, setAssets] = useState([]);
    const [loans, setLoans] = useState([]);
    const [showAssetModal, setShowAssetModal] = useState(false);
    const [showLoanModal, setShowLoanModal] = useState(false);
    
    const [assetForm, setAssetForm] = useState({ name: '', type: 'Plant', cost: '', purchaseDate: '' });
    const [loanForm, setLoanForm] = useState({ lenderName: '', principal: '', interestRate: '', term: '' });

    const fetchData = async () => {
        try {
            const [a, l] = await Promise.all([getAssets(), getLoans()]);
            setAssets(a || []);
            setLoans(l || []);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { fetchData(); }, []);

    // Calculate Depreciation (Straight Line)
    const calculateBookValue = (cost, purchaseDate) => {
        const years = (new Date() - new Date(purchaseDate)) / (1000 * 60 * 60 * 24 * 365);
        const depreciationRate = 0.15; // 15% per year
        const value = cost * (1 - (depreciationRate * years));
        return Math.max(0, value);
    };

    // ... [Handlers for Add/Delete remain same as previous, just ensure they are included] ...
    const handleAddAsset = async (e) => {
        e.preventDefault();
        await addAsset({...assetForm, cost: parseFloat(assetForm.cost)});
        setShowAssetModal(false);
        fetchData();
    };
    const handleAddLoan = async (e) => {
        e.preventDefault();
        await addLoan({...loanForm, principal: parseFloat(loanForm.principal), interestRate: parseFloat(loanForm.interestRate)});
        setShowLoanModal(false);
        fetchData();
    };
    const handleDelete = async (id, type) => {
        if(!window.confirm("Delete item?")) return;
        type === 'asset' ? await deleteAsset(id) : await deleteLoan(id);
        fetchData();
    };

    return (
        <div className="space-y-8">
            <PageTitle title="Balance Sheet Management" subtitle="Assets, Depreciation & Liability Tracking" />
            
            {/* Assets Table with Depreciation */}
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-white flex items-center"><Building className="mr-2 text-blue-400"/> Fixed Asset Register</h3>
                    <Button size="sm" onClick={() => setShowAssetModal(true)} icon={PlusCircle}>Add Asset</Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-white/5 text-gray-300">
                            <tr>
                                <th className="p-3">Asset</th>
                                <th className="p-3">Type</th>
                                <th className="p-3">Purchase Date</th>
                                <th className="p-3 text-right">Original Cost</th>
                                <th className="p-3 text-right">Current Book Value</th>
                                <th className="p-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {assets.map(a => {
                                const bookVal = calculateBookValue(a.cost, a.purchaseDate);
                                return (
                                    <tr key={a.id} className="hover:bg-white/5">
                                        <td className="p-3 font-medium text-white">{a.name}</td>
                                        <td className="p-3">{a.type}</td>
                                        <td className="p-3">{new Date(a.purchaseDate).toLocaleDateString()}</td>
                                        <td className="p-3 text-right">{formatCurrency(a.cost)}</td>
                                        <td className="p-3 text-right font-bold text-green-400">{formatCurrency(bookVal)}</td>
                                        <td className="p-3 text-right"><button onClick={() => handleDelete(a.id, 'asset')}><Trash2 size={16} className="text-red-400"/></button></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded text-xs text-blue-300 flex items-center">
                    <Calculator size={14} className="mr-2"/>
                    <span>Values calculated using 15% Straight Line Depreciation. Total Asset Value: <strong>{formatCurrency(assets.reduce((sum, a) => sum + calculateBookValue(a.cost, a.purchaseDate), 0))}</strong></span>
                </div>
            </Card>

            {/* Loans Table with Interest Calc */}
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-white flex items-center"><TrendingDown className="mr-2 text-red-400"/> Long Term Liabilities</h3>
                    <Button size="sm" onClick={() => setShowLoanModal(true)} icon={PlusCircle} variant="secondary">Record Loan</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {loans.map(l => {
                        const monthlyInterest = (l.principal * (l.interestRate / 100)) / 12;
                        return (
                            <div key={l.id} className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-red-500/50 transition-all">
                                <div className="flex justify-between mb-2">
                                    <h4 className="font-bold text-white">{l.lenderName}</h4>
                                    <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded">{l.interestRate}% APR</span>
                                </div>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between text-gray-400"><span>Principal</span><span className="text-white">{formatCurrency(l.principal)}</span></div>
                                    <div className="flex justify-between text-gray-400"><span>Term</span><span className="text-white">{l.term} Years</span></div>
                                    <div className="flex justify-between text-gray-400 pt-2 border-t border-white/10"><span>Est. Monthly Interest</span><span className="text-red-400">{formatCurrency(monthlyInterest)}</span></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Modals (Asset and Loan) would go here - keeping previous implementation logic */}
            {showAssetModal && (
                <Modal title="Add Asset" onClose={() => setShowAssetModal(false)}>
                    <form onSubmit={handleAddAsset} className="space-y-4">
                        <input className="glass-input w-full p-2" placeholder="Name" onChange={e => setAssetForm({...assetForm, name: e.target.value})} required/>
                        <select className="glass-input w-full p-2 bg-slate-800" onChange={e => setAssetForm({...assetForm, type: e.target.value})}>
                            <option>Plant</option><option>Vehicle</option><option>Equipment</option>
                        </select>
                        <input type="number" className="glass-input w-full p-2" placeholder="Cost" onChange={e => setAssetForm({...assetForm, cost: e.target.value})} required/>
                        <input type="date" className="glass-input w-full p-2" onChange={e => setAssetForm({...assetForm, purchaseDate: e.target.value})} required/>
                        <div className="flex justify-end"><Button type="submit">Save</Button></div>
                    </form>
                </Modal>
            )}
            
            {showLoanModal && (
                <Modal title="Record Loan" onClose={() => setShowLoanModal(false)}>
                    <form onSubmit={handleAddLoan} className="space-y-4">
                        <input className="glass-input w-full p-2" placeholder="Lender" onChange={e => setLoanForm({...loanForm, lenderName: e.target.value})} required/>
                        <input className="glass-input w-full p-2" type="number" placeholder="Principal" onChange={e => setLoanForm({...loanForm, principal: e.target.value})} required/>
                        <input className="glass-input w-full p-2" type="number" placeholder="Interest %" onChange={e => setLoanForm({...loanForm, interestRate: e.target.value})} required/>
                        <input className="glass-input w-full p-2" type="number" placeholder="Term (Years)" onChange={e => setLoanForm({...loanForm, term: e.target.value})} required/>
                        <div className="flex justify-end"><Button type="submit">Save</Button></div>
                    </form>
                </Modal>
            )}
        </div>
    );
}