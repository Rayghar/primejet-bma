import React, { useState, useEffect } from 'react';
import { getAssets, addAsset, getLoans, addLoan, deleteAsset, deleteLoan } from '../../api/inventoryService';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Modal from '../../components/shared/Modal';
import { formatCurrency } from '../../utils/formatters';
import { PlusCircle, Trash2, Building, TrendingDown } from 'lucide-react';

export default function AssetAndLoan() {
    const [assets, setAssets] = useState([]);
    const [loans, setLoans] = useState([]);
    const [showAssetModal, setShowAssetModal] = useState(false);
    const [showLoanModal, setShowLoanModal] = useState(false);
    
    // Forms
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
        if(!window.confirm("Delete this item?")) return;
        type === 'asset' ? await deleteAsset(id) : await deleteLoan(id);
        fetchData();
    };

    return (
        <div className="space-y-8">
            <PageTitle title="Assets & Liabilities" subtitle="Balance Sheet Management" />
            
            {/* Assets Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white flex items-center"><Building className="mr-2 text-blue-400"/> Assets</h3>
                    <Button size="sm" onClick={() => setShowAssetModal(true)} icon={PlusCircle}>Add Asset</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {assets.map(a => (
                        <div key={a.id} className="glass-card border-l-4 border-blue-500 relative group">
                            <h4 className="font-bold text-white">{a.name}</h4>
                            <p className="text-xs text-gray-400">{a.type}</p>
                            <p className="text-lg font-bold text-white mt-2">{formatCurrency(a.cost)}</p>
                            <button onClick={() => handleDelete(a.id, 'asset')} className="absolute top-4 right-4 text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Loans Section */}
            <div className="border-t border-white/10 pt-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white flex items-center"><TrendingDown className="mr-2 text-red-400"/> Loans</h3>
                    <Button size="sm" onClick={() => setShowLoanModal(true)} icon={PlusCircle} variant="secondary">Add Loan</Button>
                </div>
                <Card className="p-0 overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-white/5"><tr><th className="p-3">Lender</th><th className="p-3">Principal</th><th className="p-3">Rate</th><th className="p-3">Action</th></tr></thead>
                        <tbody>
                            {loans.map(l => (
                                <tr key={l.id} className="border-b border-white/5">
                                    <td className="p-3 text-white">{l.lenderName}</td>
                                    <td className="p-3">{formatCurrency(l.principal)}</td>
                                    <td className="p-3">{l.interestRate}%</td>
                                    <td className="p-3"><button onClick={() => handleDelete(l.id, 'loan')} className="text-red-400"><Trash2 size={16}/></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </div>

            {/* Modals */}
            {showAssetModal && (
                <Modal title="Add Asset" onClose={() => setShowAssetModal(false)}>
                    <form onSubmit={handleAddAsset} className="space-y-4">
                        <input className="glass-input w-full p-2" placeholder="Name" onChange={e => setAssetForm({...assetForm, name: e.target.value})} required/>
                        <input className="glass-input w-full p-2" type="number" placeholder="Cost" onChange={e => setAssetForm({...assetForm, cost: e.target.value})} required/>
                        <div className="flex justify-end"><Button type="submit">Save</Button></div>
                    </form>
                </Modal>
            )}
            
            {showLoanModal && (
                <Modal title="Add Loan" onClose={() => setShowLoanModal(false)}>
                    <form onSubmit={handleAddLoan} className="space-y-4">
                        <input className="glass-input w-full p-2" placeholder="Lender" onChange={e => setLoanForm({...loanForm, lenderName: e.target.value})} required/>
                        <input className="glass-input w-full p-2" type="number" placeholder="Principal" onChange={e => setLoanForm({...loanForm, principal: e.target.value})} required/>
                        <input className="glass-input w-full p-2" type="number" placeholder="Interest %" onChange={e => setLoanForm({...loanForm, interestRate: e.target.value})} required/>
                        <div className="flex justify-end"><Button type="submit">Save</Button></div>
                    </form>
                </Modal>
            )}
        </div>
    );
}