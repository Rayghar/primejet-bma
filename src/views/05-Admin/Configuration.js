// src/views/05-Admin/Configuration.js (NEW FILE)

import React, { useState, useEffect } from 'react';
import { getConfiguration, updateConfiguration } from '../../api/firestoreService';

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Notification from '../../components/shared/Notification';
import { Save } from 'lucide-react';

export default function Configuration() {
    const [settings, setSettings] = useState({ lowStockThreshold: '', taxRateVAT: '' });
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        const fetchConfig = async () => {
            setLoading(true);
            const config = await getConfiguration();
            setSettings(config);
            setLoading(false);
        };
        fetchConfig();
    }, []);

    const handleChange = (e) => {
        setSettings({ ...settings, [e.target.name]: parseFloat(e.target.value) || 0 });
    };

    const handleSave = async () => {
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

    if (loading) {
        return <PageTitle title="Configuration" subtitle="Loading settings..." />;
    }

    return (
        <>
            <Notification notification={notification} setNotification={setNotification} />
            <PageTitle title="Admin Configuration Panel" subtitle="Manage application-wide settings and thresholds." />

            <Card>
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">Inventory Settings</h3>
                        <div className="mt-2 pl-4">
                            <label className="block text-sm font-medium text-gray-700">Low Stock Alert Threshold (kg)</label>
                            <p className="text-xs text-gray-500 mb-1">Set the bulk LPG level that triggers a low stock warning.</p>
                            <input
                                type="number"
                                name="lowStockThreshold"
                                value={settings.lowStockThreshold}
                                onChange={handleChange}
                                className="p-2 border rounded-md w-full md:w-1/2"
                            />
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-800">Financial Settings</h3>
                         <div className="mt-2 pl-4">
                            <label className="block text-sm font-medium text-gray-700">VAT Rate (%)</label>
                            <p className="text-xs text-gray-500 mb-1">Set the Value-Added Tax rate for tax compliance reports.</p>
                            <input
                                type="number"
                                name="taxRateVAT"
                                step="0.1"
                                value={settings.taxRateVAT}
                                onChange={handleChange}
                                className="p-2 border rounded-md w-full md:w-1/2"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end mt-8 pt-4 border-t">
                    <Button onClick={handleSave} disabled={isSaving} icon={Save}>
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </Button>
                </div>
            </Card>
        </>
    );
}
