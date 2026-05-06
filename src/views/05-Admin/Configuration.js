import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Modal from '../../components/shared/Modal';
import { Save, Sliders, Factory, PlusCircle, Trash2, Percent } from 'lucide-react';
import WhatsAppIntegrationSettings from './WhatsAppIntegrationSettings';

// --- Sub-Component: Add Plant Modal ---
const AddPlantModal = ({ onClose, onRefresh }) => {
    const [form, setForm] = useState({ name: '', capacity: '', status: 'Operational', location: '' });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Mapping to V2 Operations API
            await apiClient.post('/api/v2/operations/plants', {
                ...form,
                capacity: parseFloat(form.capacity)
            });
            onRefresh();
            onClose();
        } catch (e) {
            alert('Failed to add plant: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal title="Add New Plant" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input required placeholder="Plant Name (e.g. Lekki Branch)" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="glass-input w-full p-3" />
                <input required type="number" placeholder="Capacity (KG)" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} className="glass-input w-full p-3" />
                <input placeholder="Location/Address" value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="glass-input w-full p-3" />
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="glass-input w-full p-3 bg-slate-800">
                    <option>Operational</option><option>Maintenance</option><option>Offline</option>
                </select>
                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Create Plant'}</Button>
                </div>
            </form>
        </Modal>
    );
};

// --- Main Configuration View ---
export default function Configuration() {
    const [config, setConfig] = useState({});
    const [plants, setPlants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPlantModal, setShowPlantModal] = useState(false);


    const updateFeeSetting = (key, value) => {
        const nextValue = Number.isFinite(Number(value)) ? parseFloat(value) : 0;
        setConfig(prev => ({
            ...prev,
            feeSettings: { ...(prev.feeSettings || {}), [key]: nextValue },
            ...(key === 'vatPercentage' ? { financialSettings: { ...(prev.financialSettings || {}), vatPercentage: nextValue } } : {})
        }));
    };

    const updateFinancialSetting = (key, value) => {
        const parsed = typeof value === 'boolean' ? value : (Number.isFinite(Number(value)) ? parseFloat(value) : 0);
        setConfig(prev => ({
            ...prev,
            financialSettings: { ...(prev.financialSettings || {}), [key]: parsed }
        }));
    };

    const fetchData = async () => {
        try {
            const [confRes, plantRes] = await Promise.all([
                apiClient.get('/config'),
                apiClient.get('/api/v2/operations/plants')
            ]);
            setConfig(confRes.data);
            setPlants(plantRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSaveConfig = async () => {
        setSaving(true);
        try {
            await apiClient.put('/config', config);
            alert('Settings Saved');
        } catch (e) {
            alert('Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePlant = async (id) => {
        if(!window.confirm("Delete this plant? This cannot be undone.")) return;
        try {
            await apiClient.delete(`/api/v2/operations/plants/${id}`);
            fetchData();
        } catch (e) { alert("Failed to delete"); }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading System Config...</div>;

    return (
        <div className="space-y-8">
            <PageTitle title="Business Setup" subtitle="Global pricing, routing rules, finance/tax settings and plant infrastructure" />
            
            {/* 1. Global Pricing & Routing (Restored inputs) */}
            <div className="glass-card">
                <div className="flex items-center mb-6 text-blue-400 border-b border-white/10 pb-2">
                    <Sliders size={20} className="mr-2"/>
                    <h3 className="font-bold">Global Settings</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Base Selling Price (₦/kg)</label>
                        <input type="number" className="glass-input w-full p-3" value={config.pricePerKg || ''} onChange={(e) => setConfig({...config, pricePerKg: parseFloat(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Cost Price (₦/kg) - Internal</label>
                        <input type="number" className="glass-input w-full p-3" value={config.costPerKg || ''} onChange={(e) => setConfig({...config, costPerKg: parseFloat(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">VAT Rate (%)</label>
                        <input type="number" step="0.01" className="glass-input w-full p-3" value={config.financialSettings?.vatPercentage ?? config.feeSettings?.vatPercentage ?? ''} onChange={(e) => updateFeeSetting('vatPercentage', e.target.value)} />
                        <p className="text-xs text-gray-500 mt-1">Used by Tax & VAT reports and synchronized with order fee VAT.</p>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Delivery Base Fee (₦)</label>
                        <input type="number" className="glass-input w-full p-3" value={config.feeSettings?.baseDeliveryFee ?? config.deliveryFee ?? ''} onChange={(e) => setConfig({...config, feeSettings: {...(config.feeSettings || {}), baseDeliveryFee: parseFloat(e.target.value)}})} />
                    </div>
                    
                    {/* RESTORED: Routing Specifics */}
                    <div className="md:col-span-2 border-t border-white/10 pt-4 mt-2">
                        <h4 className="text-white font-bold mb-4">Logistics Algorithm Tuning</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Max Pickup Window (Mins)</label>
                                <input type="number" className="glass-input w-full p-3" value={config.routingSettings?.maxPickupWindowMinutes || ''} 
                                    onChange={(e) => setConfig({...config, routingSettings: {...config.routingSettings, maxPickupWindowMinutes: parseInt(e.target.value)}})} />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Max Batch Weight (Kg)</label>
                                <input type="number" className="glass-input w-full p-3" value={config.routingSettings?.maxBatchWeightKg || ''} 
                                    onChange={(e) => setConfig({...config, routingSettings: {...config.routingSettings, maxBatchWeightKg: parseInt(e.target.value)}})} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <Button onClick={handleSaveConfig} disabled={saving} icon={Save} className="glass-button px-8">
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            {/* Finance & Tax Settings */}
            <div className="glass-card">
                <div className="flex items-center mb-6 text-amber-300 border-b border-white/10 pb-2">
                    <Percent size={20} className="mr-2"/>
                    <h3 className="font-bold">Finance & Tax Settings</h3>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100 mb-6">
                    Set management-account tax assumptions here. VAT currently defaults to 7.5% and company income tax defaults to 30%, but confirm with your accountant/tax adviser before filing.
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Company Income Tax Rate (%)</label>
                        <input type="number" step="0.01" className="glass-input w-full p-3" value={config.financialSettings?.companyIncomeTaxPercentage ?? 30} onChange={(e) => updateFinancialSetting('companyIncomeTaxPercentage', e.target.value)} />
                        <p className="text-xs text-gray-500 mt-1">Used for operational management-account tax provision.</p>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">VAT Output Rate (%)</label>
                        <input type="number" step="0.01" className="glass-input w-full p-3" value={config.financialSettings?.vatPercentage ?? config.feeSettings?.vatPercentage ?? 7.5} onChange={(e) => updateFeeSetting('vatPercentage', e.target.value)} />
                        <p className="text-xs text-gray-500 mt-1">Used by Tax & VAT compliance calculations.</p>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Withholding Tax Rate (%)</label>
                        <input type="number" step="0.01" className="glass-input w-full p-3" value={config.financialSettings?.withholdingTaxPercentage ?? 0} onChange={(e) => updateFinancialSetting('withholdingTaxPercentage', e.target.value)} />
                    </div>
                    <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 md:col-span-2">
                        <input type="checkbox" className="mt-1" checked={config.financialSettings?.applyCompanyIncomeTaxProvision !== false} onChange={(e) => updateFinancialSetting('applyCompanyIncomeTaxProvision', e.target.checked)} />
                        <span>
                            <span className="block text-white font-semibold">Apply company income tax provision in operational financial statements</span>
                            <span className="block text-xs text-gray-400 mt-1">GL audit mode still uses posted tax journals only. This switch affects management-account operational mode.</span>
                        </span>
                    </label>
                    <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                        <input type="checkbox" className="mt-1" checked={Boolean(config.financialSettings?.showDscrWhenNoDebt)} onChange={(e) => updateFinancialSetting('showDscrWhenNoDebt', e.target.checked)} />
                        <span>
                            <span className="block text-white font-semibold">Show DSCR as 0.00x when no debt exists</span>
                            <span className="block text-xs text-gray-400 mt-1">Recommended OFF. When off, DSCR shows N/A until a loan/debt service schedule exists.</span>
                        </span>
                    </label>
                </div>
                <div className="mt-8 flex justify-end">
                    <Button onClick={handleSaveConfig} disabled={saving} icon={Save} className="glass-button px-8">
                        {saving ? 'Saving...' : 'Save Finance Settings'}
                    </Button>
                </div>
            </div>

            {/* 2. Plant Management (Restored) */}
            <div className="glass-card">
                <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-2">
                    <div className="flex items-center text-green-400">
                        <Factory size={20} className="mr-2"/>
                        <h3 className="font-bold">Plant Infrastructure</h3>
                    </div>
                    <Button size="sm" onClick={() => setShowPlantModal(true)} icon={PlusCircle} variant="secondary">Add Plant</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plants.map(plant => (
                        <div key={plant.id} className="bg-white/5 border border-white/5 p-4 rounded-xl flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-white">{plant.name}</h4>
                                <p className="text-xs text-gray-400">{plant.location || 'No address'}</p>
                                <div className="mt-2 flex gap-2">
                                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">{plant.capacity.toLocaleString()} kg</span>
                                    <span className={`text-xs px-2 py-1 rounded ${plant.status === 'Operational' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                        {plant.status}
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => handleDeletePlant(plant.id)} className="text-gray-500 hover:text-red-400 transition-colors">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. Wave 22C: WhatsApp Live Integration Setup */}
            <WhatsAppIntegrationSettings />

            {showPlantModal && <AddPlantModal onClose={() => setShowPlantModal(false)} onRefresh={fetchData} />}
        </div>
    );
}