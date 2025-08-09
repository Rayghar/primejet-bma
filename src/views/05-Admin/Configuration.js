// src/views/05-Admin/Configuration.js
import React, { useState, useEffect } from 'react';
import { getConfiguration, updateConfiguration, getPlantsQuery, addPlant, deletePlant } from '../../api/firestoreService';
import { useFirestoreQuery } from '../../hooks/useFirestoreQuery';

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Notification from '../../components/shared/Notification';
import { Save, PlusCircle, Trash2, Factory } from 'lucide-react';

// --- Add Plant Form Component ---
const AddPlantForm = ({ onSuccess, onError }) => {
    const [formData, setFormData] = useState({ name: '', capacity: '2500', status: 'Online' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.capacity) {
            onError('Plant name and capacity are required.');
            return;
        }
        setIsSubmitting(true);
        try {
            await addPlant(formData);
            onSuccess(`Plant "${formData.name}" added successfully!`);
            setFormData({ name: '', capacity: '2500', status: 'Online' }); // Reset form
        } catch (error) {
            console.error("Error adding plant:", error);
            onError('Failed to add plant.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-1">
                <label className="block text-sm font-medium">Plant Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" placeholder="e.g., Ikeja Plant" required />
            </div>
            <div className="md:col-span-1">
                <label className="block text-sm font-medium">Capacity (kg)</label>
                <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" required />
            </div>
            <div className="md:col-span-1">
                <Button type="submit" disabled={isSubmitting} icon={PlusCircle} className="w-full">
                    {isSubmitting ? 'Adding...' : 'Add Plant'}
                </Button>
            </div>
        </form>
    );
};


// --- Main Configuration View Component ---
export default function Configuration() {
    const [settings, setSettings] = useState({ lowStockThreshold: '', taxRateVAT: '' });
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    // Fetch plants data
    const { docs: plants, loading: plantsLoading } = useFirestoreQuery(getPlantsQuery());

    useEffect(() => {
        const fetchConfig = async () => {
            setLoading(true);
            const config = await getConfiguration();
            setSettings(config);
            setLoading(false);
        };
        fetchConfig();
    }, []);

    const handleSettingsChange = (e) => {
        setSettings({ ...settings, [e.target.name]: parseFloat(e.target.value) || 0 });
    };

    const handleSaveSettings = async () => {
        setIsSaving(true);
        try {
            await updateConfiguration(settings);
            setNotification({ show: true, message: 'Settings saved successfully!', type: 'success' });
        } catch (error) {
            console.error("Error saving settings:", error);
            setNotification({ show: true, message: 'Failed to save settings.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemovePlant = async (plantId, plantName) => {
        if (window.confirm(`Are you sure you want to remove the plant "${plantName}"? This action cannot be undone.`)) {
            try {
                await deletePlant(plantId);
                setNotification({ show: true, message: `Plant "${plantName}" removed.`, type: 'success' });
            } catch (error) {
                console.error("Error removing plant:", error);
                setNotification({ show: true, message: 'Failed to remove plant.', type: 'error' });
            }
        }
    };
    
    const handleSuccess = (message) => setNotification({ show: true, message, type: 'success' });
    const handleError = (message) => setNotification({ show: true, message, type: 'error' });

    return (
        <>
            <Notification notification={notification} setNotification={setNotification} />
            <PageTitle title="Admin Configuration Panel" subtitle="Manage application-wide settings and plant locations." />

            {/* Plant Management Section */}
            <Card className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><Factory className="mr-2" /> Plant Management</h3>
                <div className="mb-6">
                    <AddPlantForm onSuccess={handleSuccess} onError={handleError} />
                </div>
                <div className="space-y-2">
                    {plantsLoading ? <p>Loading plants...</p> : plants.map(plant => (
                        <div key={plant.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                            <div>
                                <p className="font-medium">{plant.name}</p>
                                <p className="text-xs text-gray-500">Capacity: {plant.capacity} kg</p>
                            </div>
                            <Button onClick={() => handleRemovePlant(plant.id, plant.name)} variant="danger" icon={Trash2} />
                        </div>
                    ))}
                </div>
            </Card>

            {/* General Settings Section */}
            <Card>
                <h3 className="text-lg font-semibold text-gray-800">General Settings</h3>
                {loading ? <p>Loading settings...</p> : (
                    <>
                        <div className="space-y-6 mt-4">
                            {/* Inventory Settings */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Low Stock Alert Threshold (kg)</label>
                                <p className="text-xs text-gray-500 mb-1">Set the bulk LPG level that triggers a low stock warning.</p>
                                <input
                                    type="number"
                                    name="lowStockThreshold"
                                    value={settings.lowStockThreshold}
                                    onChange={handleSettingsChange}
                                    className="p-2 border rounded-md w-full md:w-1/2"
                                />
                            </div>
                            {/* Financial Settings */}
                            <div className="border-t pt-6">
                                <label className="block text-sm font-medium text-gray-700">VAT Rate (%)</label>
                                <p className="text-xs text-gray-500 mb-1">Set the Value-Added Tax rate for tax compliance reports.</p>
                                <input
                                    type="number"
                                    name="taxRateVAT"
                                    step="0.1"
                                    value={settings.taxRateVAT}
                                    onChange={handleSettingsChange}
                                    className="p-2 border rounded-md w-full md:w-1/2"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end mt-8 pt-4 border-t">
                            <Button onClick={handleSaveSettings} disabled={isSaving} icon={Save}>
                                {isSaving ? 'Saving...' : 'Save Settings'}
                            </Button>
                        </div>
                    </>
                )}
            </Card>
        </>
    );
}
