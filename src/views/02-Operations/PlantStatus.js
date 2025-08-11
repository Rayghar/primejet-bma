// src/views/02-Operations/PlantStatus.js (Refactored)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getPlants, getMaintenanceLogs, getPlantDailyOutputHistory, addMaintenanceLog } from '../../api/operationsService';
import { formatCurrency, formatDate } from '../../utils/formatters';

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Modal from '../../components/shared/Modal';
import Notification from '../../components/shared/Notification';
import LineChart from '../../components/charts/LineChart';
import { Factory, AlertTriangle, Wrench, Calendar, PlusCircle, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'; // Added DollarSign, TrendingUp, TrendingDown

// --- Add Maintenance Log Modal Component (remains unchanged) ---
const AddMaintenanceLogModal = ({ plantId, onSuccess, onError, onClose }) => {
    const [formData, setFormData] = useState({
        type: 'Routine',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        cost: '',
        performedBy: '',
        status: 'Scheduled',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await addMaintenanceLog(plantId, {
                ...formData,
                cost: parseFloat(formData.cost) || 0,
            });
            onSuccess('Maintenance log added successfully!');
            onClose();
        } catch (error) {
            console.error("Add Maintenance Log Error:", error);
            onError(error.response?.data?.message || 'Failed to add maintenance log.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal title={`Add Maintenance Log for ${plantId}`} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select name="type" value={formData.type} onChange={handleChange} className="w-full p-2 border rounded-md bg-white">
                        <option>Routine</option>
                        <option>Emergency</option>
                        <option>Repair</option>
                        <option>Upgrade</option>
                        <option>Inspection</option>
                        <option>Other</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} className="w-full p-2 border rounded-md" rows="3" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Start Date</label>
                        <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full p-2 border rounded-md" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">End Date (Optional)</label>
                        <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full p-2 border rounded-md" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Cost (₦)</label>
                    <input type="number" name="cost" value={formData.cost} onChange={handleChange} className="w-full p-2 border rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Performed By</label>
                    <input type="text" name="performedBy" value={formData.performedBy} onChange={handleChange} className="w-full p-2 border rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border rounded-md bg-white">
                        <option>Scheduled</option>
                        <option>In Progress</option>
                        <option>Completed</option>
                        <option>Canceled</option>
                    </select>
                </div>
                <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Add Log'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};


// --- PlantStatusCard Sub-component (Enhanced) ---
const PlantStatusCard = ({ plant, onAddMaintenance, plantHistory, maintenanceLogs }) => {
    const statusColors = {
        Operational: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-500' },
        Maintenance: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-500' },
        Offline: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-500' },
        Warning: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-500' },
    };
    const color = statusColors[plant.status] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-500' };
    
    const outputToday = parseFloat(plant.outputToday) || 0;
    const capacity = parseFloat(plant.capacity) || 0;
    const targetDailyOutput = parseFloat(plant.targetDailyOutputKg) || 0;

    // Calculate percentage against target output
    const outputProgressPercentage = targetDailyOutput > 0 ? (outputToday / targetDailyOutput) * 100 : 0;
    const outputGaugeColor = outputProgressPercentage >= 90 ? 'bg-green-600' : outputProgressPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500';

    // Determine alerts
    const lowOutputAlert = targetDailyOutput > 0 && outputToday < (targetDailyOutput * 0.5) && plant.status === 'Operational'; // Less than 50% of target
    const maintenanceDueAlert = plant.nextMaintenanceDate && new Date(plant.nextMaintenanceDate) < new Date(); // Next maintenance date is in the past

    // Prepare data for the mini-chart
    const chartData = useMemo(() => {
        return plantHistory.map(entry => ({
            label: formatDate(entry.date),
            value: entry.totalKgSold || 0,
        }));
    }, [plantHistory]);

    const latestMaintenance = maintenanceLogs.find(log => log.status === 'Completed' || log.status === 'In Progress');
    const nextScheduledMaintenance = maintenanceLogs.find(log => log.status === 'Scheduled' && new Date(log.startDate) >= new Date());


    return (
        <Card className={`border-l-4 ${color.border}`}>
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">{plant.name}</h3>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${color.bg} ${color.text}`}>
                    {plant.status}
                </span>
            </div>
            
            {/* Daily Output Gauge */}
            <div className="mt-4 text-center">
                <p className="text-xs text-gray-500 uppercase">Daily Output Progress</p>
                <div className="relative w-full h-4 bg-gray-200 rounded-full mt-2">
                    <div className={`h-full rounded-full ${outputGaugeColor}`} style={{ width: `${Math.min(100, outputProgressPercentage)}%` }}></div>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-800">
                        {outputToday.toLocaleString()} kg / {targetDailyOutput.toLocaleString()} kg
                    </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{outputProgressPercentage.toFixed(1)}% of target</p>
            </div>

            {/* Alerts */}
            {(lowOutputAlert || maintenanceDueAlert) && (
                <div className="mt-4 p-2 bg-red-100 text-red-800 rounded-md flex items-center text-sm font-semibold">
                    <AlertTriangle size={18} className="mr-2" />
                    {lowOutputAlert && <span>Low Output! </span>}
                    {maintenanceDueAlert && <span>Maintenance Overdue!</span>}
                </div>
            )}

            {/* Key Metrics */}
            <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                <div>
                    <p className="text-xs text-gray-500 uppercase">Uptime</p>
                    <p className={`text-2xl font-bold ${color.text}`}>{plant.uptime || 0}%</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 uppercase">Capacity</p>
                    <p className="text-2xl font-bold text-gray-700">{capacity.toLocaleString()} kg</p>
                </div>
            </div>

            {/* NEW: Plant Profitability Metrics */}
            <div className="mt-4 border-t pt-4">
                <h4 className="text-md font-semibold text-gray-700 mb-2 flex items-center"><DollarSign size={16} className="mr-2" />Profitability (Last 30 Days)</h4>
                <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                        <span>Revenue:</span>
                        <span className="font-semibold">{formatCurrency(plant.totalPlantRevenue || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span>Expenses:</span>
                        <span className="font-semibold text-red-600">{formatCurrency(plant.totalPlantExpenses || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold">
                        <span>Net Profit:</span>
                        <span className={`${plant.plantProfitability >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(plant.plantProfitability || 0)}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span>Expenses as % of Revenue:</span>
                        <span className="font-semibold">{plant.expensesAsPercentageOfRevenue.toFixed(1)}%</span>
                    </div>
                </div>
            </div>

            {/* Mini-Graph of Daily Output */}
            <div className="mt-4 border-t pt-4">
                <h4 className="text-md font-semibold text-gray-700 mb-2">Last 7 Days Output (kg)</h4>
                {chartData.length > 0 ? (
                    <LineChart data={chartData} title="" />
                ) : (
                    <p className="text-gray-500 text-sm">No recent output data.</p>
                )}
            </div>

            {/* Maintenance Info */}
            <div className="mt-4 border-t pt-4">
                <h4 className="text-md font-semibold text-gray-700 mb-2 flex items-center"><Wrench size={16} className="mr-2" />Maintenance</h4>
                {latestMaintenance ? (
                    <p className="text-sm text-gray-700">Last: {latestMaintenance.type} on {formatDate(latestMaintenance.startDate)}</p>
                ) : (
                    <p className="text-sm text-gray-500">No recent maintenance logs.</p>
                )}
                {nextScheduledMaintenance ? (
                    <p className="text-sm text-gray-700 flex items-center"><Calendar size={14} className="mr-1" />Next: {nextScheduledMaintenance.type} on {formatDate(nextScheduledMaintenance.startDate)}</p>
                ) : (
                    <p className="text-sm text-gray-500">No upcoming scheduled maintenance.</p>
                )}
                <Button onClick={() => onAddMaintenance(plant.id)} variant="secondary" size="sm" icon={PlusCircle} className="mt-2">
                    Add Maintenance Log
                </Button>
            </div>
        </Card>
    );
};

// --- Main PlantStatus View Component ---
export default function PlantStatus() {
    const [plants, setPlants] = useState([]);
    const [plantHistoryData, setPlantHistoryData] = useState({});
    const [maintenanceLogsData, setMaintenanceLogsData] = useState({});
    const [loading, setLoading] = useState(true);
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
    const [selectedPlantIdForMaintenance, setSelectedPlantIdForMaintenance] = useState(null);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    // Notification handlers (moved here for useCallback dependencies)
    const handleSuccess = useCallback((message) => {
        setNotification({ show: true, message, type: 'success' });
        setShowMaintenanceModal(false); // Close modal on success
        // No need to call fetchData here, as it's a dependency of the useEffect
    }, []); // Empty dependency array for stability

    const handleError = useCallback((msg) => setNotification({ show: true, message: msg, type: 'error' }), []); // Empty dependency array for stability

    // Function to fetch all necessary data for the Plant Status view, wrapped in useCallback
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const plantList = await getPlants();
            setPlants(plantList);

            const historyPromises = plantList.map(plant => getPlantDailyOutputHistory(plant.id));
            const maintenancePromises = plantList.map(plant => getMaintenanceLogs(plant.id));

            const allHistory = await Promise.all(historyPromises);
            const allMaintenance = await Promise.all(maintenancePromises);

            const historyMap = {};
            allHistory.forEach((history, index) => {
                historyMap[plantList[index].id] = history;
            });
            setPlantHistoryData(historyMap);

            const maintenanceMap = {};
            allMaintenance.forEach((logs, index) => {
                maintenanceMap[plantList[index].id] = logs;
            });
            setMaintenanceLogsData(maintenanceMap);

        } catch (error) {
            console.error('Failed to fetch plant status data:', error);
            handleError('Failed to load plant data.'); // Use stable handleError
        } finally {
            setLoading(false);
        }
    }, [handleError]); // fetchData depends on handleError

    // Fetch data on component mount and after any maintenance log is added
    useEffect(() => {
        fetchData();
    }, [fetchData]); // fetchData is now a stable dependency

    // Handler for opening the Add Maintenance Log modal
    const handleAddMaintenance = useCallback((plantId) => {
        setSelectedPlantIdForMaintenance(plantId);
        setShowMaintenanceModal(true);
    }, []); // Empty dependency array for stability

    return (
        <>
            <Notification notification={notification} setNotification={setNotification} />
            {showMaintenanceModal && selectedPlantIdForMaintenance && (
                <AddMaintenanceLogModal 
                    plantId={selectedPlantIdForMaintenance} 
                    onSuccess={handleSuccess} // Use stable handleSuccess
                    onError={handleError} // Use stable handleError
                    onClose={() => setShowMaintenanceModal(false)} 
                />
            )}

            <PageTitle title="Multi-Plant Dashboard" subtitle="Real-time operational status and performance of all plant locations." />
            
            {loading ? (
                <p>Loading plant status...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {plants.length > 0 ? (
                        plants.map(plant => (
                            <PlantStatusCard 
                                key={plant.id} 
                                plant={plant} 
                                onAddMaintenance={handleAddMaintenance}
                                plantHistory={plantHistoryData[plant.id] || []}
                                maintenanceLogs={maintenanceLogsData[plant.id] || []}
                            />
                        ))
                    ) : (
                        <p className="text-gray-500">No plant data found. Please add plants in the admin configuration.</p>
                    )}
                </div>
            )}
        </>
    );
}