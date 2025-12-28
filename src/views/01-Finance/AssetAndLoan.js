import React, { useState, useEffect } from 'react';
import { getAssets, addAsset, getLoans, addLoan, deleteLoan, deleteAsset } from '../../api/inventoryService';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Modal from '../../components/shared/Modal';
import { formatCurrency } from '../../utils/formatters';
import { PlusCircle, Trash2, TrendingDown, Building } from 'lucide-react';

export default function AssetAndLoan() {
    const [assets, setAssets] = useState([]);
    const [loans, setLoans] = useState([]);
    const [showAssetModal, setShowAssetModal] = useState(false);
    const [showLoanModal, setShowLoanModal] = useState(false);
    
    // Form States
    const [assetForm, setAssetForm] = useState({ name: '', type: 'Plant', cost: '', purchaseDate: '' });
    const [loanForm, setLoanForm] = useState({ lenderName: '', principal: '', interestRate: '', term: '' });

    const fetchData = async () => {
        try {
            const [a, l] = await Promise.all([getAssets(), getLoans()]);
            setAssets(a); 
            setLoans(l);
        } catch (e) { 
            console.error(e); 
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleAddAsset = async (e) => {
        e.preventDefault();
        try {
            await addAsset({...assetForm, cost: parseFloat(assetForm.cost)});
            setShowAssetModal(false);
            fetchData();
        } catch (e) {
            alert('Failed to add asset');
        }
    };

    const handleAddLoan = async (e) => {
        e.preventDefault();
        try {
            await addLoan({...loanForm, principal: parseFloat(loanForm.principal), interestRate: parseFloat(loanForm.interestRate)});
            setShowLoanModal(false);
            fetchData();
        } catch (e) {
            alert('Failed to add loan');
        }
    };

    const handleDelete = async (id, type) => {
        // ✅ FIX: Use window.confirm to satisfy linter
        if(!window.confirm("Delete item? This cannot be undone.")) return;
        
        try {
            type === 'asset' ? await deleteAsset(id) : await deleteLoan(id);
            fetchData();
        } catch (e) {
            alert('Failed to delete item');
        }
    };

    return (
        <div className="space-y-8">
            <PageTitle title="Assets & Liabilities" subtitle="Financial health tracking" />
            
            {/* Assets */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center"><Building className="mr-2 text-blue-400"/> Fixed Assets</h3>
                    <Button size="sm" onClick={() => setShowAssetModal(true)} icon={PlusCircle}>Add Asset</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {assets.map(asset => (
                        <div key={asset.id} className="glass-card border-l-4 border-blue-500 relative group">
                            <h4 className="font-bold text-white">{asset.name}</h4>
                            <p className="text-xs text-gray-400">{asset.type}</p>
                            <p className="text-xl font-bold text-white mt-2">{formatCurrency(asset.cost)}</p>
                            <button onClick={() => handleDelete(asset.id, 'asset')} className="absolute top-4 right-4 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Loans */}
            <div>
                <div className="flex justify-between items-center mb-4 pt-6 border-t border-white/10">
                    <h3 className="text-xl font-bold text-white flex items-center"><TrendingDown className="mr-2 text-red-400"/> Active Loans</h3>
                    <Button size="sm" onClick={() => setShowLoanModal(true)} icon={PlusCircle} variant="secondary">Record Loan</Button>
                </div>
                <Card className="p-0 overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-white/5 text-gray-300">
                            <tr><th className="p-3">Lender</th><th className="p-3">Principal</th><th className="p-3">Interest</th><th className="p-3 text-right">Action</th></tr>
                        </thead>
                        <tbody>
                            {loans.map(loan => (
                                <tr key={loan.id} className="border-b border-white/5">
                                    <td className="p-3 font-medium text-white">{loan.lenderName}</td>
                                    <td className="p-3">{formatCurrency(loan.principal)}</td>
                                    <td className="p-3">{loan.interestRate}%</td>
                                    <td className="p-3 text-right"><button onClick={() => handleDelete(loan.id, 'loan')} className="text-red-400 hover:text-red-300"><Trash2 size={16}/></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </div>

            {/* Asset Modal */}
            {showAssetModal && (
                <Modal title="Add Asset" onClose={() => setShowAssetModal(false)}>
                    <form onSubmit={handleAddAsset} className="space-y-4">
                        <input className="glass-input w-full p-2" placeholder="Name" onChange={e => setAssetForm({...assetForm, name: e.target.value})} required />
                        <select className="glass-input w-full p-2 bg-slate-800" onChange={e => setAssetForm({...assetForm, type: e.target.value})}>
                            <option>Plant</option><option>Vehicle</option><option>Equipment</option>
                        </select>
                        <input type="number" className="glass-input w-full p-2" placeholder="Cost" onChange={e => setAssetForm({...assetForm, cost: e.target.value})} required />
                        <input type="date" className="glass-input w-full p-2" onChange={e => setAssetForm({...assetForm, purchaseDate: e.target.value})} required />
                        <div className="flex justify-end"><Button type="submit">Save</Button></div>
                    </form>
                </Modal>
            )}

            {/* Loan Modal */}
            {showLoanModal && (
                <Modal title="Record Loan" onClose={() => setShowLoanModal(false)}>
                    <form onSubmit={handleAddLoan} className="space-y-4">
                        <input className="glass-input w-full p-2" placeholder="Lender Name" onChange={e => setLoanForm({...loanForm, lenderName: e.target.value})} required />
                        <input type="number" className="glass-input w-full p-2" placeholder="Principal Amount" onChange={e => setLoanForm({...loanForm, principal: e.target.value})} required />
                        <input type="number" className="glass-input w-full p-2" placeholder="Interest Rate (%)" onChange={e => setLoanForm({...loanForm, interestRate: e.target.value})} required />
                        <input type="number" className="glass-input w-full p-2" placeholder="Term (Years)" onChange={e => setLoanForm({...loanForm, term: e.target.value})} required />
                        <div className="flex justify-end"><Button type="submit">Save</Button></div>
                    </form>
                </Modal>
            )}
        </div>
    );
}