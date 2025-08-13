// src/views/05-Admin/Configuration.js
import React, { useState, useEffect, useCallback } from 'react';
import { getConfiguration, updateConfiguration } from '../../api/configService';
import { getPlants, addPlant, deletePlant } from '../../api/operationsService';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Notification from '../../components/shared/Notification';
import { Save, PlusCircle, Trash2, Factory } from 'lucide-react';

// --- Add Plant Form Component ---
const AddPlantForm = ({ onSuccess, onError }) => {
    const [formData, setFormData] = useState({ name: '', capacity: '2500', status: 'Operational' });
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
            await addPlant({ ...formData, capacity: parseFloat(formData.capacity) });
            onSuccess(`Plant "${formData.name}" added successfully!`);
            setFormData({ name: '', capacity: '2500', status: 'Operational' });
        } catch (error) {
            console.error("Add Plant Error:", error);
            onError(error.response?.data?.message || 'Failed to add plant.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Plant Name (e.g., Ikeja Plant)" className="w-full p-2 border rounded-md" required />
            <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} placeholder="Capacity (kg)" className="w-full p-2 border rounded-md" required />
            <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border rounded-md bg-white">
                <option value="Operational">Operational</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Offline">Offline</option>
            </select>
            <Button type="submit" disabled={isSubmitting} icon={PlusCircle} className="w-full">Add Plant</Button>
        </form>
    );
};

// --- Main Configuration View ---
export default function Configuration() {
    const [settings, setSettings] = useState(null);
    const [plants, setPlants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    const handleError = useCallback((msg) => {
        setNotification({ show: true, message: msg, type: 'error' });
    }, []);

    const handleSuccess = useCallback((message) => {
        setNotification({ show: true, message, type: 'success' });
        fetchData();
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [configData, plantData] = await Promise.all([
                getConfiguration(),
                getPlants(),
            ]);
            setSettings(configData);
            setPlants(plantData);
        } catch (error) {
            console.error('Failed to fetch configuration data:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to load configuration.';
            handleError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [handleError]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSettingsChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setSettings(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: type === 'checkbox' ? checked : parseFloat(value) || value
                }
            }));
        } else {
            setSettings(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : parseFloat(value) || value
            }));
        }
    };

    const handleSaveSettings = async () => {
        setIsSaving(true);
        try {
            await updateConfiguration(settings);
            handleSuccess('Configuration settings saved successfully!');
        } catch (error) {
            console.error('Failed to save configuration:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to save settings.';
            handleError(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemovePlant = async (plantId, plantName) => {
        if (window.confirm(`Are you sure you want to remove plant "${plantName}"? This action cannot be undone.`)) {
            try {
                await deletePlant(plantId);
                handleSuccess(`Plant "${plantName}" removed.`);
            } catch (error) {
                console.error("Remove Plant Error:", error);
                const errorMessage = error.response?.data?.message || error.message || 'Failed to remove plant.';
                handleError(errorMessage);
            }
        }
    };

    if (loading) {
        return <p>Loading configuration data...</p>;
    }

    return (
        <>
            <Notification notification={notification} setNotification={setNotification} />
            <PageTitle title="Application Configuration" subtitle="Manage global settings and operational parameters." />

            <h3 className="text-xl font-semibold text-gray-700 mt-6 mb-4 flex items-center"><Factory className="mr-3" /> Plant Management</h3>
            <Card className="mb-6">
                <h4 className="text-lg font-semibold text-gray-700 mb-4">Existing Plants</h4>
                {plants.length > 0 ? (
                    <div className="overflow-x-auto mb-4">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b bg-gray-50">
                                    <th className="p-2">Name</th>
                                    <th className="p-2">Capacity (kg)</th>
                                    <th className="p-2">Status</th>
                                    <th className="p-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {plants.map(plant => (
                                    <tr key={plant.id} className="border-b hover:bg-gray-50">
                                        <td className="p-2 font-medium">{plant.name}</td>
                                        <td className="p-2">{plant.capacity}</td>
                                        <td className="p-2">{plant.status}</td>
                                        <td className="p-2">
                                        <Button onClick={() => handleRemovePlant(plant.id, plant.name)} variant="danger" icon={Trash2} title="Remove Plant" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-500 mb-4">No plants configured yet.</p>
                )}
                <h4 className="text-lg font-semibold text-gray-700 mb-4 border-t pt-4">Add New Plant</h4>
                <AddPlantForm onSuccess={handleSuccess} onError={handleError} />
            </Card>

            <h3 className="text-xl font-semibold text-gray-700 mt-6 mb-4">Global Application Settings</h3>
            <Card>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Low Stock Threshold (kg)</label>
                        <p className="text-xs text-gray-500 mb-1">Alerts will be triggered when bulk LPG stock falls below this level.</p>
                        <input
                            type="number"
                            name="lowStockThreshold"
                            value={settings?.lowStockThreshold || ''}
                            onChange={handleSettingsChange}
                            className="p-2 border rounded-md w-full md:w-1/2"
                        />
                    </div>

                    <div className="border-t pt-6">
                        <h4 className="text-lg font-semibold text-gray-700 mb-4">Financial Settings</h4>
                        <label className="block text-sm font-medium text-gray-700">VAT Rate (%)</label>
                        <p className="text-xs text-gray-500 mb-1">Set the Value-Added Tax rate for tax compliance reports.</p>
                        <input
                            type="number"
                            name="feeSettings.vatPercentage"
                            step="0.1"
                            value={settings?.feeSettings?.vatPercentage || ''}
                            onChange={handleSettingsChange}
                            className="p-2 border rounded-md w-full md:w-1/2"
                        />
                        <label className="block text-sm font-medium text-gray-700 mt-4">Service Fee Percentage (%)</label>
                        <p className="text-xs text-gray-500 mb-1">Percentage applied as a service charge on orders.</p>
                        <input
                            type="number"
                            name="feeSettings.serviceFeePercentage"
                            step="0.1"
                            value={settings?.feeSettings?.serviceFeePercentage || ''}
                            onChange={handleSettingsChange}
                            className="p-2 border rounded-md w-full md:w-1/2"
                        />
                        <label className="block text-sm font-medium text-gray-700 mt-4">Base Delivery Fee (₦)</label>
                        <p className="text-xs text-gray-500 mb-1">Standard delivery charge for all orders.</p>
                        <input
                            type="number"
                            name="feeSettings.baseDeliveryFee"
                            value={settings?.feeSettings?.baseDeliveryFee || ''}
                            onChange={handleSettingsChange}
                            className="p-2 border rounded-md w-full md:w-1/2"
                        />
                        <label className="block text-sm font-medium text-gray-700 mt-4">Express Delivery Surcharge (₦)</label>
                        <p className="text-xs text-gray-500 mb-1">Additional fee for express delivery option.</p>
                        <input
                            type="number"
                            name="feeSettings.expressDeliverySurcharge"
                            value={settings?.feeSettings?.expressDeliverySurcharge || ''}
                            onChange={handleSettingsChange}
                            className="p-2 border rounded-md w-full md:w-1/2"
                        />
                        <label className="block text-sm font-medium text-gray-700 mt-4">Share Capital (₦)</label>
                        <p className="text-xs text-gray-500 mb-1">The company's initial share capital for financial statements.</p>
                        <input
                            type="number"
                            name="financialSettings.shareCapital"
                            value={settings?.financialSettings?.shareCapital || ''}
                            onChange={handleSettingsChange}
                            className="p-2 border rounded-md w-full md:w-1/2"
                        />
                    </div>

                    <div className="border-t pt-6">
                        <h4 className="text-lg font-semibold text-gray-700 mb-4">Routing Settings</h4>
                        <label className="block text-sm font-medium text-gray-700">Max Pickup Window (Minutes)</label>
                        <p className="text-xs text-gray-500 mb-1">Maximum time a driver has to pick up an order after assignment.</p>
                        <input
                            type="number"
                            name="routingSettings.maxPickupWindowMinutes"
                            value={settings?.routingSettings?.maxPickupWindowMinutes || ''}
                            onChange={handleSettingsChange}
                            className="p-2 border rounded-md w-full md:w-1/2"
                        />
                        <label className="block text-sm font-medium text-gray-700 mt-4">Max Batch Weight (kg)</label>
                        <p className="text-xs text-gray-500 mb-1">Maximum total weight for a single delivery route batch.</p>
                        <input
                            type="number"
                            name="routingSettings.maxBatchWeightKg"
                            value={settings?.routingSettings?.maxBatchWeightKg || ''}
                            onChange={handleSettingsChange}
                            className="p-2 border rounded-md w-full md:w-1/2"
                        />
                    </div>

                    <div className="mt-6 pt-6 border-t">
                        <Button onClick={handleSaveSettings} disabled={isSaving} icon={Save}>
                            {isSaving ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </div>
                </div>
            </Card>
        </>
    );
}