import React, { useState, useEffect } from 'react';
import { getPlants, getMaintenanceLogs, addMaintenanceLog } from '../../api/operationsService'; 
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Modal from '../../components/shared/Modal';
import { Factory, Wrench, AlertTriangle, CheckCircle, PlusCircle, History } from 'lucide-react';

// --- Maintenance Modal ---
const AddMaintenanceModal = ({ plantId, onClose, onRefresh }) => {
    const [form, setForm] = useState({ type: 'Routine', description: '', cost: '', performedBy: '' });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await addMaintenanceLog(plantId, { ...form, cost: parseFloat(form.cost), startDate: new Date() });
            onRefresh();
            onClose();
        } catch(e) { alert("Error: " + e.message); } 
        finally { setSubmitting(false); }
    };

    return (
        <Modal title="Log Maintenance" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <select className="glass-input w-full p-2 bg-slate-800" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    <option>Routine</option><option>Repair</option><option>Emergency</option>
                </select>
                <textarea placeholder="Description of work..." className="glass-input w-full p-2 h-24" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
                <input type="number" placeholder="Cost (₦)" className="glass-input w-full p-2" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} required />
                <input placeholder="Performed By" className="glass-input w-full p-2" value={form.performedBy} onChange={e => setForm({...form, performedBy: e.target.value})} />
                <div className="flex justify-end"><Button type="submit" disabled={submitting}>Save Log</Button></div>
            </form>
        </Modal>
    );
};

// --- Main View ---
export default function PlantStatus() {
    const [plants, setPlants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlant, setSelectedPlant] = useState(null); // For maintenance modal

    const refresh = () => {
        getPlants().then(data => { setPlants(data); setLoading(false); });
    };

    useEffect(() => { refresh(); }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Telemetry...</div>;

    return (
        <div className="space-y-6">
            <PageTitle title="Plant Performance" subtitle="Operational health & maintenance logs" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plants.map(plant => (
                    <div key={plant.id} className={`glass-card border-l-4 ${plant.status === 'Operational' ? 'border-green-500' : 'border-red-500'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center">
                                <div className={`p-3 rounded-xl mr-4 ${plant.status === 'Operational' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    <Factory size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">{plant.name}</h3>
                                    <p className="text-xs text-gray-400">{plant.location}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedPlant(plant.id)} className="text-xs flex items-center bg-blue-600/20 text-blue-300 px-2 py-1 rounded hover:bg-blue-600/40">
                                <Wrench size={12} className="mr-1"/> Log Fix
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                    <span>Load</span><span>{plant.currentLoad || 0}%</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${plant.currentLoad || 0}%` }}></div></div>
                            </div>
                            <div className="flex justify-between items-center text-sm pt-2">
                                <span className="text-gray-400">Output Today</span>
                                <span className="text-white font-mono">{plant.outputToday?.toLocaleString() || 0} kg</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {selectedPlant && <AddMaintenanceModal plantId={selectedPlant} onClose={() => setSelectedPlant(null)} onRefresh={refresh} />}
        </div>
    );
}