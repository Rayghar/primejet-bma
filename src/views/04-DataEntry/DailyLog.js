import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getPlants } from '../../api/operationsService';
import { 
    createOrGetDailySummary, 
    updateSummaryMeters, 
    logSale, 
    logExpense, 
    getDailyEntries, 
    finalizeDailySummary 
} from '../../api/dataEntryService';
import { formatCurrency } from '../../utils/formatters';
import { generateRawBtReceipt } from '../../utils/rawbt';

import PageTitle from '../../components/shared/PageTitle';
import Button from '../../components/shared/Button';
import Notification from '../../components/shared/Notification';
import ReceiptPreviewModal from '../../components/shared/ReceiptPreviewModal';
import { FileText, Printer } from 'lucide-react'; // Cleaned imports

const EXPENSE_CATEGORIES = ['Fuel', 'Maintenance', 'Salaries', 'Utilities', 'Miscellaneous'];

export default function DailyLog() {
    const { user } = useAuth();
    
    // --- State ---
    const [dailySummary, setDailySummary] = useState(null);
    const [plants, setPlants] = useState([]);
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState('');
    const [previewedEntry, setPreviewedEntry] = useState(null);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    // --- Forms ---
    const [activeTab, setActiveTab] = useState('sale');
    const [meters, setMeters] = useState({
        openingMeterA: 0, openingMeterB: 0,
        closingMeterA: 0, closingMeterB: 0,
        pricePerKg: 1100,
    });
    const [saleForm, setSaleForm] = useState({ amount: '', kgSold: '', paymentMethod: 'Cash', transactionType: 'POS' });
    const [expenseForm, setExpenseForm] = useState({ category: EXPENSE_CATEGORIES[0], amount: '', description: '' });

    // --- Initialization ---
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                const plantList = await getPlants();
                setPlants(plantList);
                if (plantList.length > 0) setSelectedBranch(plantList[0].id || plantList[0]._id);
            } catch (e) {
                console.error("Init Error", e);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    // --- Fetch Summary ---
    const fetchDailySummary = useCallback(async () => {
        if (!selectedBranch || !user) return;
        try {
            const summary = await createOrGetDailySummary({
                branchId: selectedBranch,
                cashierName: user.name || 'Unknown',
                pricePerKg: meters.pricePerKg
            });
            
            setDailySummary(summary);
            setMeters({
                openingMeterA: summary.openingMeters?.meterA || 0,
                openingMeterB: summary.openingMeters?.meterB || 0,
                closingMeterA: summary.closingMeters?.meterA || 0,
                closingMeterB: summary.closingMeters?.meterB || 0,
                pricePerKg: summary.pricePerKg || 1100,
            });

            const entryList = await getDailyEntries(summary.dailySummaryId || summary._id);
            setEntries(entryList);
        } catch (error) {
            setNotification({ show: true, message: 'Failed to load daily log', type: 'error' });
        }
    }, [selectedBranch, user, meters.pricePerKg]); // ✅ FIX: Added missing dependency

    useEffect(() => { fetchDailySummary(); }, [fetchDailySummary]);

    // --- Handlers ---
    const handleUpdateMeters = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const updated = await updateSummaryMeters(dailySummary._id || dailySummary.dailySummaryId, {
                openingMeters: { meterA: meters.openingMeterA, meterB: meters.openingMeterB },
                closingMeters: { meterA: meters.closingMeterA, meterB: meters.closingMeterB },
                pricePerKg: meters.pricePerKg
            });
            setDailySummary(updated);
            setNotification({ show: true, message: 'Meters updated successfully', type: 'success' });
        } catch (e) {
            setNotification({ show: true, message: 'Update failed', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleTransaction = async (e) => {
        e.preventDefault();
        if (!dailySummary) return;
        
        setIsSaving(true);
        try {
            if (activeTab === 'sale') {
                const res = await logSale({
                    dailySummaryId: dailySummary.dailySummaryId || dailySummary._id,
                    branchId: selectedBranch,
                    revenue: parseFloat(saleForm.amount),
                    kgSold: parseFloat(saleForm.kgSold),
                    paymentMethod: saleForm.paymentMethod,
                    transactionType: saleForm.transactionType
                });
                
                const receiptText = generateRawBtReceipt(res.transaction, { name: 'PrimeJet', address: 'Lagos' });
                window.location.href = `rawbt:${btoa(receiptText)}`;
                
                setSaleForm({ amount: '', kgSold: '', paymentMethod: 'Cash', transactionType: 'POS' });
                setPreviewedEntry(res.transaction);
                setNotification({ show: true, message: 'Sale logged & Print sent', type: 'success' });
            } else {
                await logExpense({
                    dailySummaryId: dailySummary.dailySummaryId || dailySummary._id,
                    branchId: selectedBranch,
                    amount: parseFloat(expenseForm.amount),
                    category: expenseForm.category,
                    description: expenseForm.description
                });
                setExpenseForm({ category: EXPENSE_CATEGORIES[0], amount: '', description: '' });
                setNotification({ show: true, message: 'Expense logged', type: 'success' });
            }
            fetchDailySummary(); 
        } catch (e) {
            setNotification({ show: true, message: 'Transaction failed: ' + e.message, type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaleCalc = (e) => {
        const { name, value } = e.target;
        const price = meters.pricePerKg || 1100;
        
        if (name === 'amount' && value) {
            setSaleForm(prev => ({ ...prev, amount: value, kgSold: (parseFloat(value) / price).toFixed(2) }));
        } else if (name === 'kgSold' && value) {
            setSaleForm(prev => ({ ...prev, kgSold: value, amount: (parseFloat(value) * price).toFixed(2) }));
        } else {
            setSaleForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFinalize = async () => {
        if (!window.confirm("Finalize today's log? This will submit for approval.")) return;
        try {
            await finalizeDailySummary(dailySummary._id || dailySummary.dailySummaryId);
            fetchDailySummary();
            setNotification({ show: true, message: 'Day finalized!', type: 'success' });
        } catch (e) {
            setNotification({ show: true, message: 'Finalization failed', type: 'error' });
        }
    };

    const calculations = useMemo(() => {
        const meterTotal = (meters.closingMeterA - meters.openingMeterA) + (meters.closingMeterB - meters.openingMeterB);
        const expected = meterTotal * meters.pricePerKg;
        const actual = dailySummary?.sales?.totalRevenue || 0;
        const diff = actual - expected;
        return { meterTotal, expected, actual, diff };
    }, [meters, dailySummary]);

    if (loading) return <div className="p-8 text-center text-blue-400 animate-pulse">Initializing Terminal...</div>;

    return (
        <div className="space-y-6">
            <Notification notification={notification} setNotification={setNotification} />
            
            <div className="flex justify-between items-center">
                <PageTitle title="Daily POS Log" subtitle={`Session: ${new Date().toLocaleDateString()}`} />
                <div className="flex items-center gap-4">
                    <select 
                        value={selectedBranch} 
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="glass-input p-2 text-sm bg-black/20 w-48"
                    >
                        {plants.map(p => <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>)}
                    </select>
                    <div className="text-right hidden sm:block">
                        <p className="text-xs text-gray-400">Cashier</p>
                        <p className="font-bold text-white text-sm">{user?.name}</p>
                    </div>
                </div>
            </div>

            {dailySummary && (
                <div className="glass-card border-l-4 border-blue-500">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-white">Meter Reconciliation</h3>
                        <span className={`text-xs px-2 py-1 rounded ${dailySummary.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {dailySummary.status?.toUpperCase()}
                        </span>
                    </div>
                    
                    <form onSubmit={handleUpdateMeters}>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                            <div><label className="block text-gray-400 text-xs mb-1">Open A</label><input type="number" className="glass-input w-full p-2" value={meters.openingMeterA} onChange={e => setMeters({...meters, openingMeterA: parseFloat(e.target.value)})} /></div>
                            <div><label className="block text-gray-400 text-xs mb-1">Close A</label><input type="number" className="glass-input w-full p-2" value={meters.closingMeterA} onChange={e => setMeters({...meters, closingMeterA: parseFloat(e.target.value)})} /></div>
                            <div><label className="block text-gray-400 text-xs mb-1">Open B</label><input type="number" className="glass-input w-full p-2" value={meters.openingMeterB} onChange={e => setMeters({...meters, openingMeterB: parseFloat(e.target.value)})} /></div>
                            <div><label className="block text-gray-400 text-xs mb-1">Close B</label><input type="number" className="glass-input w-full p-2" value={meters.closingMeterB} onChange={e => setMeters({...meters, closingMeterB: parseFloat(e.target.value)})} /></div>
                            <div><label className="block text-gray-400 text-xs mb-1">Price/Kg</label><input type="number" className="glass-input w-full p-2 text-green-400 font-bold" value={meters.pricePerKg} onChange={e => setMeters({...meters, pricePerKg: parseFloat(e.target.value)})} /></div>
                        </div>
                        
                        <div className="mt-4 p-3 bg-white/5 rounded-lg flex flex-col md:flex-row justify-between items-center text-xs md:text-sm space-y-2 md:space-y-0">
                            <div><span className="text-gray-400">Total Metered:</span> <span className="text-white font-bold">{calculations.meterTotal.toFixed(2)} kg</span></div>
                            <div><span className="text-gray-400">Expected:</span> <span className="text-white font-bold">{formatCurrency(calculations.expected)}</span></div>
                            <div><span className="text-gray-400">Actual:</span> <span className="text-green-400 font-bold">{formatCurrency(calculations.actual)}</span></div>
                            <div className={`${calculations.diff < -100 ? 'text-red-400' : 'text-green-400'} font-bold`}>Diff: {formatCurrency(calculations.diff)}</div>
                            
                            <div className="flex gap-2">
                                <Button type="submit" size="sm" variant="secondary" disabled={isSaving}>Update</Button>
                                <Button type="button" size="sm" onClick={handleFinalize} disabled={isSaving || dailySummary.status === 'approved'}>Finalize</Button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="glass-card">
                    <div className="flex mb-4 gap-2">
                        <button onClick={() => setActiveTab('sale')} className={`flex-1 py-2 rounded text-sm transition-all ${activeTab === 'sale' ? 'bg-green-600 text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:text-white'}`}>Log Sale</button>
                        <button onClick={() => setActiveTab('expense')} className={`flex-1 py-2 rounded text-sm transition-all ${activeTab === 'expense' ? 'bg-red-600 text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:text-white'}`}>Log Expense</button>
                    </div>

                    <form onSubmit={handleTransaction} className="space-y-4">
                        {activeTab === 'sale' ? (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-xs text-gray-400 mb-1">KG Sold</label><input type="number" className="glass-input w-full p-3" value={saleForm.kgSold} onChange={handleSaleCalc} name="kgSold" placeholder="0.00" required /></div>
                                    <div><label className="block text-xs text-gray-400 mb-1">Amount (₦)</label><input type="number" className="glass-input w-full p-3" value={saleForm.amount} onChange={handleSaleCalc} name="amount" placeholder="0.00" required /></div>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Payment Method</label>
                                    <select className="glass-input w-full p-3 bg-slate-800" value={saleForm.paymentMethod} onChange={e => setSaleForm({...saleForm, paymentMethod: e.target.value})}>
                                        <option>Cash</option><option>POS</option><option>Transfer</option>
                                    </select>
                                </div>
                            </>
                        ) : (
                            <>
                                <div><label className="block text-xs text-gray-400 mb-1">Description</label><input type="text" className="glass-input w-full p-3" value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} required placeholder="Details" /></div>
                                <div><label className="block text-xs text-gray-400 mb-1">Amount (₦)</label><input type="number" className="glass-input w-full p-3" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} required placeholder="0.00" /></div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Category</label>
                                    <select className="glass-input w-full p-3 bg-slate-800" value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}>
                                        {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                            </>
                        )}
                        <Button type="submit" className={`w-full ${activeTab === 'sale' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'}`} disabled={isSaving}>
                            {activeTab === 'sale' ? 'Log & Print Receipt' : 'Record Expense'}
                        </Button>
                    </form>
                </div>

                <div className="lg:col-span-2 glass-card flex flex-col">
                    <h3 className="font-bold text-white mb-4 flex items-center"><FileText className="mr-2 text-blue-400"/> Session Entries</h3>
                    <div className="flex-1 overflow-y-auto max-h-[400px]">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/5 text-gray-400 text-xs uppercase sticky top-0 backdrop-blur-md">
                                <tr><th>Time</th><th>Type</th><th>Details</th><th>Amount</th><th>Receipt</th></tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {entries.map((entry, i) => (
                                    <tr key={i} className="hover:bg-white/5">
                                        <td className="p-3 text-gray-400">{new Date(entry.createdAt).toLocaleTimeString()}</td>
                                        <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${entry.type === 'sale' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{entry.type}</span></td>
                                        <td className="p-3 text-white">{entry.type === 'sale' ? `${entry.kgSold}kg (${entry.paymentMethod})` : entry.description}</td>
                                        <td className={`p-3 text-right font-mono font-bold ${entry.type === 'sale' ? 'text-green-400' : 'text-red-400'}`}>{entry.type === 'expense' ? '-' : ''}{formatCurrency(entry.amount)}</td>
                                        <td className="p-3 text-center">
                                            {entry.type === 'sale' && (
                                                <button onClick={() => setPreviewedEntry(entry)} className="text-gray-400 hover:text-white"><Printer size={16}/></button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {previewedEntry && (
                <ReceiptPreviewModal 
                    entry={previewedEntry} 
                    onClose={() => setPreviewedEntry(null)} 
                />
            )}
        </div>
    );
}