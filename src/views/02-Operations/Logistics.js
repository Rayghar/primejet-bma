// src/views/02-Operations/Logistics.js (UPDATED)

import React, { useState, useEffect } from 'react';
import { useFirestoreQuery } from '../../hooks/useFirestoreQuery';
import { getVansQuery, getUnassignedOrdersQuery, assignOrderToVan } from '../../api/firestoreService';

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Notification from '../../components/shared/Notification';
import { MapPin, Truck, ClipboardList, CheckCircle } from 'lucide-react';

export default function Logistics() {
    // --- Live Data Fetching ---
    const { docs: vans, loading: vansLoading } = useFirestoreQuery(getVansQuery());
    const { docs: orders, loading: ordersLoading } = useFirestoreQuery(getUnassignedOrdersQuery());

    // --- State Management ---
    const [selectedOrder, setSelectedOrder] = useState('');
    const [selectedVan, setSelectedVan] = useState('');
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    // --- Effects to update selections when data changes ---
    useEffect(() => {
        if (orders.length > 0 && !selectedOrder) {
            setSelectedOrder(orders[0].id);
        }
    }, [orders, selectedOrder]);

    useEffect(() => {
        const firstIdleVan = vans.find(v => v.status === 'Idle');
        if (firstIdleVan && !selectedVan) {
            setSelectedVan(firstIdleVan.id);
        }
    }, [vans, selectedVan]);

    // --- Handlers ---
    const handleAssignRun = async () => {
        if (!selectedOrder || !selectedVan) {
            setNotification({ show: true, message: 'Please select an order and an available van.', type: 'error' });
            return;
        }
        
        const orderDetails = orders.find(o => o.id === selectedOrder);
        try {
            await assignOrderToVan(selectedVan, selectedOrder, orderDetails);
            setNotification({ show: true, message: `Order ${selectedOrder} assigned to Van ${selectedVan}.`, type: 'success' });
            // Selections will reset automatically as the documents update
            setSelectedOrder('');
            setSelectedVan('');
        } catch (error) {
            console.error("Assignment Error:", error);
            setNotification({ show: true, message: 'Failed to assign run.', type: 'error' });
        }
    };

    const StatusBadge = ({ status }) => {
        const colors = {
            'Idle': 'bg-green-100 text-green-800',
            'On Delivery': 'bg-blue-100 text-blue-800',
            'Returning': 'bg-yellow-100 text-yellow-800',
        };
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[status]}`}>{status}</span>;
    };

    const loading = vansLoading || ordersLoading;
    const idleVans = vans.filter(v => v.status === 'Idle');

    return (
        <>
            <Notification notification={notification} setNotification={setNotification} />
            <PageTitle title="Logistics & Dispatch Hub" subtitle="Monitor your delivery fleet and assign runs in real-time." />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Map & Vans */}
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
                                {vans.map(van => (
                                    <div key={van.id} className="border p-3 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="font-bold">{`Van ${van.vanNumber}`}<span className="font-normal text-gray-600 text-sm"> - {van.driver}</span></p>
                                            <p className="text-sm text-gray-500">{van.status === 'Idle' ? van.location : van.destination}</p>
                                        </div>
                                        <StatusBadge status={van.status} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                {/* Right Column: Order Assignment */}
                <div className="lg:col-span-1">
                    <Card>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center"><ClipboardList className="mr-2" /> Assign Delivery Run</h3>
                        {loading ? <p>Loading orders...</p> : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">1. Select Unassigned Order</label>
                                    <select value={selectedOrder} onChange={(e) => setSelectedOrder(e.target.value)} className="mt-1 w-full p-2 border rounded-md bg-white">
                                        {orders.length > 0 ? orders.map(order => <option key={order.id} value={order.id}>{`${order.id} - ${order.customerName} (${order.area})`}</option>) : <option>No unassigned orders</option>}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">2. Select Available Van</label>
                                    <select value={selectedVan} onChange={(e) => setSelectedVan(e.target.value)} className="mt-1 w-full p-2 border rounded-md bg-white">
                                        {idleVans.length > 0 ? idleVans.map(van => <option key={van.id} value={van.id}>{`Van ${van.vanNumber} - ${van.driver}`}</option>) : <option>No vans available</option>}
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
        </>
    );
}
