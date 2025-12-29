import React, { useState, useEffect } from 'react';
import { getInventorySummary, getStockInHistory, getCylinders, addCylinder, deleteCylinder, addStockIn } from '../../api/inventoryService';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Modal from '../../components/shared/Modal';
import { Package, AlertTriangle, TrendingUp, History, PlusCircle, Trash2, Factory } from 'lucide-react';

export default function Inventory() {
    const [summary, setSummary] = useState(null);
    const [history, setHistory] = useState([]);
    const [cylinders, setCylinders] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal States
    const [showStockModal, setShowStockModal] = useState(false);
    const [showCylinderModal, setShowCylinderModal] = useState(false);

    // Initial Data Load
    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = async () => {
        setLoading(true);
        try {
            const [sum, hist, cyl] = await Promise.all([
                getInventorySummary(),
                getStockInHistory(),
                getCylinders()
            ]);
            setSummary(sum);
            setHistory(hist);
            setCylinders(cyl);
        } catch (e) {
            console.error("Inventory Sync Failed", e);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveCylinder = async (id) => {
        if (!window.confirm("Delete this cylinder batch?")) return;
        await deleteCylinder(id);
        refreshData();
    };

    // Calculation for Gauge
    // ✅ FIX: Prevent NaN
    const stockPercent = (summary && summary.totalCapacity > 0) 
        ? (summary.currentStock / summary.totalCapacity) * 100 
        : 0;
        
    if (loading) return <div className="p-8 text-center text-blue-400 animate-pulse">Loading Inventory Intelligence...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <PageTitle title="Inventory Intelligence" subtitle="Stock Levels & Batch Profitability" />
                <div className="flex gap-2">
                    <Button onClick={() => setShowCylinderModal(true)} variant="secondary" icon={Package}>Cylinders</Button>
                    <Button onClick={() => setShowStockModal(true)} icon={PlusCircle}>Log Stock-In</Button>
                </div>
            </div>

            {/* TOP ROW: Gauge & Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Live Gauge */}
                <div className="glass-card flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-600/5"></div>
                    <h3 className="font-bold text-gray-400 mb-6 uppercase tracking-wider text-xs z-10">Current LPG Level</h3>
                    
                    <div className="relative w-48 h-48 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="96" cy="96" r="88" className="stroke-white/5" strokeWidth="12" fill="none" />
                            <circle 
                                cx="96" cy="96" r="88" 
                                className={`${stockPercent < 20 ? 'stroke-red-500' : 'stroke-blue-500'} transition-all duration-1000`} 
                                strokeWidth="12" 
                                fill="none" 
                                strokeDasharray={553} 
                                strokeDashoffset={553 - (553 * stockPercent) / 100} 
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute text-center">
                            <span className="text-4xl font-bold text-white block">{summary?.currentStock?.toLocaleString() || 0}</span>
                            <span className="text-xs text-gray-400 uppercase">Kilograms</span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4 z-10">Total Capacity: {summary?.totalCapacity?.toLocaleString()} kg</p>
                </div>

                {/* Alerts & Quick Stats */}
                <div className="flex flex-col gap-6">
                    <div className="glass-card flex-1 flex flex-col justify-center">
                        <h3 className="font-bold text-gray-400 mb-4 uppercase tracking-wider text-xs">System Alerts</h3>
                        {stockPercent < 20 ? (
                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start">
                                <AlertTriangle className="text-red-500 mr-3 mt-0.5" size={20} />
                                <div>
                                    <h4 className="text-red-400 font-bold text-sm">Low Stock Warning</h4>
                                    <p className="text-red-300/70 text-xs mt-1">Reserves are critical. Re-order immediately.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex items-start">
                                <Factory className="text-green-500 mr-3 mt-0.5" size={20} />
                                <div>
                                    <h4 className="text-green-400 font-bold text-sm">Optimal Levels</h4>
                                    <p className="text-green-300/70 text-xs mt-1">Operations running normally.</p>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Cylinder Summary */}
                    <div className="glass-card flex-1">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-400 uppercase tracking-wider text-xs">Cylinder Assets</h3>
                            <span className="text-xs text-blue-400">{cylinders.reduce((a,b)=>a+b.quantity,0)} Total</span>
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                            {cylinders.map(c => (
                                <div key={c.id} className="flex justify-between text-sm p-2 bg-white/5 rounded-lg">
                                    <span className="text-gray-300">{c.size}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono font-bold text-white">{c.quantity}</span>
                                        <button onClick={() => handleRemoveCylinder(c.id)} className="text-red-400 hover:text-red-300"><Trash2 size={14}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* BOTTOM ROW: Profitability Table */}
            <div className="glass-card">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-white flex items-center">
                        <TrendingUp className="mr-2 text-green-500" size={20}/> Batch Profitability Analysis
                    </h3>
                    <button className="glass-button-secondary px-3 py-1 text-xs">Export CSV</button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="text-xs uppercase bg-white/5 text-gray-300 font-semibold">
                            <tr>
                                <th className="p-4 rounded-tl-xl">Date</th>
                                <th className="p-4">Supplier</th>
                                <th className="p-4 text-right">Cost</th>
                                <th className="p-4 text-right">Est. Revenue</th>
                                <th className="p-4 text-right">Net Profit</th>
                                <th className="p-4 text-center">Margin</th>
                                <th className="p-4 rounded-tr-xl">Progress</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {history.length === 0 ? (
                                <tr><td colSpan="7" className="p-8 text-center text-gray-500">No stock history available.</td></tr>
                            ) : history.map((batch, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 text-white">{new Date(batch.purchaseDate).toLocaleDateString()}</td>
                                    <td className="p-4">{batch.supplier}</td>
                                    <td className="p-4 text-right">₦{batch.totalCost?.toLocaleString()}</td>
                                    <td className="p-4 text-right text-gray-300">₦{batch.estimatedActualRevenue?.toLocaleString()}</td>
                                    <td className={`p-4 text-right font-bold ${batch.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {batch.profitLoss >= 0 ? '+' : ''}{batch.profitLoss?.toLocaleString()}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${batch.profitMargin > 15 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                            {batch.profitMargin}%
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-16 bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-blue-500 h-full" style={{ width: `${batch.salesProgress}%` }}></div>
                                            </div>
                                            <span className="text-[10px]">{batch.salesProgress}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            {showStockModal && (
                <AddStockModal onClose={() => setShowStockModal(false)} onRefresh={refreshData} />
            )}
            {showCylinderModal && (
                <AddCylinderModal onClose={() => setShowCylinderModal(false)} onRefresh={refreshData} />
            )}
        </div>
    );
}

// --- Sub-components (Modals) ---

const AddStockModal = ({ onClose, onRefresh }) => {
    const [form, setForm] = useState({ quantityKg: '', costPerKg: '', supplier: '', purchaseDate: new Date().toISOString().split('T')[0] });
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        await addStockIn(form);
        onRefresh();
        onClose();
    };

    return (
        <Modal title="Log Bulk Stock-In" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-400 text-xs mb-1">Quantity (KG)</label>
                    <input type="number" className="glass-input w-full p-2" value={form.quantityKg} onChange={e => setForm({...form, quantityKg: e.target.value})} required />
                </div>
                <div>
                    <label className="block text-gray-400 text-xs mb-1">Cost per KG (₦)</label>
                    <input type="number" className="glass-input w-full p-2" value={form.costPerKg} onChange={e => setForm({...form, costPerKg: e.target.value})} required />
                </div>
                <div>
                    <label className="block text-gray-400 text-xs mb-1">Supplier</label>
                    <input type="text" className="glass-input w-full p-2" value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} required />
                </div>
                <div className="flex justify-end pt-4">
                    <Button type="submit" className="glass-button">Confirm Stock-In</Button>
                </div>
            </form>
        </Modal>
    );
};

const AddCylinderModal = ({ onClose, onRefresh }) => {
    const [form, setForm] = useState({ size: '12.5 kg', quantity: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        await addCylinder(form);
        onRefresh();
        onClose();
    };

    return (
        <Modal title="Add Cylinder Assets" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-400 text-xs mb-1">Size</label>
                    <select className="glass-input w-full p-2 bg-slate-800" value={form.size} onChange={e => setForm({...form, size: e.target.value})}>
                        <option>3 kg</option><option>5 kg</option><option>6 kg</option><option>12.5 kg</option><option>25 kg</option><option>50 kg</option>
                    </select>
                </div>
                <div>
                    <label className="block text-gray-400 text-xs mb-1">Quantity</label>
                    <input type="number" className="glass-input w-full p-2" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} required />
                </div>
                <div className="flex justify-end pt-4">
                    <Button type="submit" className="glass-button">Add Batch</Button>
                </div>
            </form>
        </Modal>
    );
};