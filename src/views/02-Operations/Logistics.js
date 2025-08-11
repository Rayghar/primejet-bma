// src/views/02-Operations/Logistics.js (Refactored & Reimagined)

import React, { useState, useEffect, useCallback } from 'react';
import { getVans } from '../../api/operationsService'; // For van status
import { getUnassignedOrders, assignDriverToRun, getActiveRuns, getRunDetails, getDriverRunHistory } from '../../api/runService'; // New run service
import { getDriverStats } from '../../api/userService'; // New user service for driver stats
import { formatCurrency, formatDate } from '../../utils/formatters';

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Modal from '../../components/shared/Modal'; // For run details modal
import Notification from '../../components/shared/Notification';
import { MapPin, Truck, ClipboardList, CheckCircle, User, History, TrendingUp, DollarSign, Star, ChevronLeft, ChevronRight } from 'lucide-react'; // New icons

// --- Run Details Modal ---
const RunDetailsModal = ({ run, onClose }) => {
    return (
        <Modal title={`Run Details: ${run.id.substring(0, 8)}...`} onClose={onClose}>
            <div className="space-y-4 text-sm">
                <p><strong>Status:</strong> {run.overallStatus}</p>
                <p><strong>Driver:</strong> {run.driver?.name || 'N/A'} ({run.driver?.email || 'N/A'})</p>
                <p><strong>Total Stops:</strong> {run.totalStops}</p>
                <p><strong>Completed Stops:</strong> {run.completedStops}</p>
                <p><strong>Start Date:</strong> {formatDate(run.actualStartDate || run.estimatedStartDate)}</p>
                {run.actualCompletionDate && <p><strong>Completion Date:</strong> {formatDate(run.actualCompletionDate)}</p>}
                
                <h4 className="font-semibold mt-4 mb-2 border-b pb-1">Stops</h4>
                {run.stops && run.stops.length > 0 ? (
                    <ul className="list-disc list-inside space-y-2">
                        {run.stops.map(stop => (
                            <li key={stop.stopId} className="bg-gray-50 p-2 rounded-md">
                                <p><strong>Order:</strong> {stop.order?.id.substring(0, 8)}... ({stop.order?.recipientName})</p>
                                <p className="ml-4 text-xs">Address: {stop.order?.deliveryAddressSnapshot?.fullAddress}</p>
                                <p className="ml-4 text-xs">Status: {stop.status}</p>
                            </li>
                        ))}
                    </ul>
                ) : <p>No stops found for this run.</p>}
            </div>
        </Modal>
    );
};

// --- Driver Performance Card ---
const DriverPerformanceCard = ({ driver, onShowHistory }) => {
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoadingStats(true);
            try {
                const driverStats = await getDriverStats(driver.id);
                setStats(driverStats);
            } catch (error) {
                console.error(`Failed to fetch stats for driver ${driver.id}:`, error);
            } finally {
                setLoadingStats(false);
            }
        };
        fetchStats();
    }, [driver.id]);

    return (
        <Card>
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center"><User className="mr-2 text-blue-500" />{driver.name}</h3>
            <p className="text-sm text-gray-500 mb-2">{driver.email || driver.phone}</p>
            <p className="text-xs text-gray-500">Van: {driver.vanNumber || 'N/A'}</p>
            
            {loadingStats ? <p>Loading stats...</p> : stats ? (
                <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                    <div><p className="text-xs text-gray-500 uppercase">Orders Executed</p><p className="font-bold text-lg">{stats.totalOrdersExecuted}</p></div>
                    <div><p className="text-xs text-gray-500 uppercase">Total Revenue</p><p className="font-bold text-lg">{formatCurrency(stats.totalRevenueMade)}</p></div>
                    <div><p className="text-xs text-gray-500 uppercase">Avg Rating</p><p className="font-bold text-lg flex items-center">{stats.averageRating.toFixed(1)} <Star size={16} className="ml-1 text-yellow-500" /></p></div>
                    <div><p className="text-xs text-gray-500 uppercase">Avg Delivery Time</p><p className="font-bold text-lg">{stats.averageDeliveryTimeMinutes.toFixed(0)} min</p></div>
                </div>
            ) : <p className="text-gray-500 mt-4">No stats available.</p>}
            
            <div className="mt-4 border-t pt-4">
                <Button onClick={() => onShowHistory(driver.id, driver.name)} variant="secondary" size="sm" icon={History}>
                    View Run History
                </Button>
            </div>
        </Card>
    );
};

// --- Driver Run History Modal ---
const DriverRunHistoryModal = ({ driverId, driverName, onClose, onError }) => {
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchHistory = useCallback(async () => {
        setLoadingHistory(true);
        try {
            const result = await getDriverRunHistory(driverId, { page, limit: 10 });
            setHistory(result.runs);
            setTotalPages(result.totalPages);
        } catch (error) {
            console.error(`Failed to fetch run history for ${driverId}:`, error);
            onError('Failed to load driver run history.');
        } finally {
            setLoadingHistory(false);
        }
    }, [driverId, page, onError]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    return (
        <Modal title={`Run History: ${driverName}`} onClose={onClose}>
            {loadingHistory ? <p className="text-center p-4">Loading history...</p> : history.length > 0 ? (
                <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b bg-gray-50">
                                <th className="p-2">Run ID</th>
                                <th className="p-2">Date</th>
                                <th className="p-2">Status</th>
                                <th className="p-2">Stops</th>
                                <th className="p-2">Completed</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map(run => (
                                <tr key={run.id} className="border-b hover:bg-gray-50">
                                    <td className="p-2">{run.id.substring(0, 8)}...</td>
                                    <td className="p-2">{formatDate(run.actualCompletionDate || run.actualStartDate)}</td>
                                    <td className="p-2">{run.overallStatus}</td>
                                    <td className="p-2">{run.totalStops}</td>
                                    <td className="p-2">{run.completedStops}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex justify-between items-center mt-4">
                        <Button onClick={() => setPage(prev => prev - 1)} disabled={page <= 1 || loadingHistory} icon={ChevronLeft}>Previous</Button>
                        <span>Page {page} of {totalPages}</span>
                        <Button onClick={() => setPage(prev => prev + 1)} disabled={page >= totalPages || loadingHistory} icon={ChevronRight}>Next</Button>
                    </div>
                </div>
            ) : <p className="text-gray-500 text-center p-4">No run history found for this driver.</p>}
        </Modal>
    );
};


// --- Main Logistics View Component ---
export default function Logistics() {
    // --- Live Data Fetching ---
    const [vans, setVans] = useState([]);
    const [orders, setOrders] = useState([]);
    const [activeRuns, setActiveRuns] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- State Management for UI ---
    const [selectedOrder, setSelectedOrder] = useState('');
    const [selectedVan, setSelectedVan] = useState('');
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    const [activeTab, setActiveTab] = useState('assignment');
    const [showRunDetailsModal, setShowRunDetailsModal] = useState(false);
    const [selectedRunDetails, setSelectedRunDetails] = useState(null);
    const [showDriverHistoryModal, setShowDriverHistoryModal] = useState(false);
    const [selectedDriverForHistory, setSelectedDriverForHistory] = useState(null);


    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [fetchedVans, fetchedOrders, fetchedActiveRuns] = await Promise.all([
                getVans(),
                getUnassignedOrders(),
                getActiveRuns(),
            ]);
            setVans(fetchedVans);
            setOrders(fetchedOrders);
            setActiveRuns(fetchedActiveRuns);
        } catch (error) {
            console.error('Failed to fetch logistics data:', error);
            setNotification({ show: true, message: 'Failed to load logistics data.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (orders.length > 0 && !selectedOrder) {
            setSelectedOrder(orders[0].id);
        } else if (orders.length === 0) {
            setSelectedOrder('');
        }
    }, [orders, selectedOrder]);

    useEffect(() => {
        const firstIdleVan = vans.find(v => v.status === 'Idle');
        if (firstIdleVan && !selectedVan) {
            setSelectedVan(firstIdleVan.id);
        } else if (!firstIdleVan) {
            setSelectedVan('');
        }
    }, [vans, selectedVan]);

    const handleAssignRun = async () => {
        if (!selectedOrder || !selectedVan) {
            setNotification({ show: true, message: 'Please select an order and an available van.', type: 'error' });
            return;
        }
        
        const orderDetails = orders.find(o => o.id === selectedOrder);
        if (!orderDetails) {
            setNotification({ show: true, message: 'Selected order details not found.', type: 'error' });
            return;
        }

        try {
            await assignDriverToRun(selectedOrder, selectedVan);
            setNotification({ show: true, message: `Order ${selectedOrder.substring(0,8)}... assigned to Van ${selectedVan.substring(0,8)}...`, type: 'success' });
            fetchData();
        } catch (error) {
            console.error("Assignment Error:", error);
            setNotification({ show: true, message: error.response?.data?.message || 'Failed to assign run.', type: 'error' });
        }
    };

    const handleViewRunDetails = async (runId) => {
        try {
            const details = await getRunDetails(runId);
            setSelectedRunDetails(details);
            setShowRunDetailsModal(true);
        } catch (error) {
            console.error("Failed to fetch run details:", error);
            setNotification({ show: true, message: error.response?.data?.message || 'Failed to load run details.', type: 'error' });
        }
    };

    const handleShowDriverHistory = (driverId, driverName) => {
        setSelectedDriverForHistory({ id: driverId, name: driverName });
        setShowDriverHistoryModal(true);
    };

    const StatusBadge = ({ status }) => {
        const colors = {
            'Idle': 'bg-green-100 text-green-800',
            'On Delivery': 'bg-blue-100 text-blue-800',
            'Returning': 'bg-yellow-100 text-yellow-800',
            'Maintenance': 'bg-orange-100 text-orange-800',
            'Offline': 'bg-red-100 text-red-800',
        };
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
    };

    const idleVans = vans.filter(v => v.status === 'Idle');

    return (
        <>
            <Notification notification={notification} setNotification={setNotification} />
            {selectedRunDetails && <RunDetailsModal run={selectedRunDetails} onClose={() => setShowRunDetailsModal(false)} />}
            {selectedDriverForHistory && <DriverRunHistoryModal driverId={selectedDriverForHistory.id} driverName={selectedDriverForHistory.name} onClose={() => setShowDriverHistoryModal(false)} onError={setNotification} />}

            <PageTitle title="Logistics & Dispatch Hub" subtitle="Monitor your delivery fleet and assign runs in real-time." />

            <Card className="mb-6">
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8">
                        <button 
                            onClick={() => setActiveTab('assignment')} 
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'assignment' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Run Assignment
                        </button>
                        <button 
                            onClick={() => setActiveTab('performance')} 
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'performance' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Driver Performance & History
                        </button>
                    </nav>
                </div>

                {activeTab === 'assignment' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center"><MapPin className="mr-2" /> Fleet Map</h3>
                                <div className="bg-gray-200 h-96 rounded-md flex items-center justify-center">
                                    <p className="text-gray-500">Live map integration will be here.</p>
                                </div>
                            </Card>
                            <Card>
                                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center"><Truck className="mr-2" /> Van Status</h3>
                                {loading ? <p>Loading van status...</p> : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {vans.length > 0 ? vans.map(van => (
                                            <div key={van.id} className="border p-3 rounded-lg flex justify-between items-center">
                                                <div>
                                                    <p className="font-bold">{`Van ${van.vanNumber}`}<span className="font-normal text-gray-600 text-sm"> - {van.driverName || 'Unassigned'}</span></p>
                                                    <p className="text-sm text-gray-500">{van.status === 'Idle' ? van.location || 'Depot' : van.destination || 'Unknown Destination'}</p>
                                                </div>
                                                <StatusBadge status={van.status} />
                                            </div>
                                        )) : <p className="text-gray-500">No vans found.</p>}
                                    </div>
                                )}
                            </Card>
                            <Card>
                                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center"><ClipboardList className="mr-2" /> Active Delivery Runs</h3>
                                {loading ? <p>Loading active runs...</p> : activeRuns.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr className="border-b bg-gray-50">
                                                    <th className="p-2">Run ID</th>
                                                    <th className="p-2">Driver</th>
                                                    <th className="p-2">Status</th>
                                                    <th className="p-2">Stops</th>
                                                    <th className="p-2">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {activeRuns.map(run => (
                                                    <tr key={run.id} className="border-b hover:bg-gray-50">
                                                        <td className="p-2">{run.id.substring(0, 8)}...</td>
                                                        <td className="p-2">{run.driver?.name || 'N/A'}</td>
                                                        <td className="p-2">{run.overallStatus}</td>
                                                        <td className="p-2">{run.completedStops}/{run.totalStops}</td>
                                                        <td className="p-2">
                                                            <Button onClick={() => handleViewRunDetails(run.id)} variant="secondary" size="sm">View</Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : <p className="text-gray-500">No active runs.</p>}
                            </Card>
                        </div>

                        <div className="lg:col-span-1">
                            <Card>
                                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center"><ClipboardList className="mr-2" /> Assign Delivery Run</h3>
                                {loading ? <p>Loading orders...</p> : (
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="select-order" className="block text-sm font-medium text-gray-700">1. Select Unassigned Order</label>
                                            <select 
                                                id="select-order"
                                                value={selectedOrder} 
                                                onChange={(e) => setSelectedOrder(e.target.value)} 
                                                className="mt-1 w-full p-2 border rounded-md bg-white"
                                            >
                                                {orders.length > 0 ? orders.map(order => (
                                                    <option key={order.id} value={order.id}>
                                                        {`${order.id.substring(0, 8)} - ${order.recipientName} (${order.deliveryAddressSnapshot?.city || 'N/A'})`}
                                                    </option>
                                                )) : <option value="">No unassigned orders</option>}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="select-van" className="block text-sm font-medium text-gray-700">2. Select Available Van</label>
                                            <select 
                                                id="select-van"
                                                value={selectedVan} 
                                                onChange={(e) => setSelectedVan(e.target.value)} 
                                                className="mt-1 w-full p-2 border rounded-md bg-white"
                                            >
                                                {idleVans.length > 0 ? idleVans.map(van => (
                                                    <option key={van.id} value={van.id}>
                                                        {`Van ${van.vanNumber} - ${van.driverName || 'Unassigned'}`}
                                                    </option>
                                                )) : <option value="">No vans available</option>}
                                            </select>
                                        </div>
                                        <div className="pt-2">
                                            <Button onClick={handleAssignRun} disabled={!selectedOrder || !selectedVan || loading} icon={CheckCircle} className="w-full">
                                                Assign Run
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {vans.filter(v => v.driverId).length > 0 ? (
                            vans.filter(v => v.driverId).map(van => (
                                <DriverPerformanceCard 
                                    key={van.driverId} 
                                    driver={{ id: van.driverId, name: van.driverName, email: van.driverEmail, vanNumber: van.vanNumber }}
                                    onShowHistory={handleShowDriverHistory} 
                                />
                            ))
                        ) : (
                            <p className="text-gray-500 lg:col-span-2 text-center p-8">No drivers found or assigned to vans.</p>
                        )}
                    </div>
                )}
            </Card>
        </>
    );
}