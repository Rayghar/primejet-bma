// src/views/03-Sales/CustomerHub.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getCustomers, addCustomer, getCustomerDetails, getCustomerOrders, addCustomerNote, getCustomerNotes } from '../../api/customerService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../hooks/useAuth';

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Modal from '../../components/shared/Modal';
import Notification from '../../components/shared/Notification';
import { PlusCircle, Search, User, Phone, Mail, ShoppingBag, MessageSquare, History, Star, TrendingUp, Edit, Trash2, Eye } from 'lucide-react';

// --- Add Customer Modal Component ---
const AddCustomerModal = ({ onSuccess, onError, onClose }) => {
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', type: 'Individual' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await addCustomer(formData);
            onSuccess(`Customer "${formData.name}" added successfully.`);
            onClose();
        } catch (error) {
            console.error("Add Customer Error:", error);
            onError(error.response?.data?.message || 'Failed to add customer.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal title="Add New Customer" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Customer Name" className="w-full p-2 border rounded-md" required />
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number (e.g., +23480...)" className="w-full p-2 border rounded-md" required />
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email (Optional)" className="w-full p-2 border rounded-md" />
                <select name="type" value={formData.type} onChange={handleChange} className="w-full p-2 border rounded-md bg-white">
                    <option>Individual</option>
                    <option>Corporate</option>
                </select>
                <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Adding...' : 'Add Customer'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

// --- Customer Details Modal Component (Enhanced) ---
const CustomerDetailModal = ({ customer, onClose, onSuccess, onError }) => {
    const [activeTab, setActiveTab] = useState('orders');
    const [orders, setOrders] = useState([]);
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [loadingNotes, setLoadingNotes] = useState(true);
    const [isAddingNote, setIsAddingNote] = useState(false);
    const { user } = useAuth(); // Current logged-in user for adding notes

    const fetchOrders = useCallback(async () => {
        setLoadingOrders(true);
        try {
            const fetchedOrders = await getCustomerOrders(customer.id);
            setOrders(fetchedOrders);
        } catch (error) {
            console.error("Failed to fetch customer orders:", error);
            onError('Failed to load customer orders.');
        } finally {
            setLoadingOrders(false);
        }
    }, [customer, onError]);

    useEffect(() => {
        if (customer?.id) {
            fetchOrders();
        }
    }, [customer, fetchOrders]);

    const fetchNotes = useCallback(async () => {
        setLoadingNotes(true);
        try {
            const fetchedNotes = await getCustomerNotes(customer.id);
            setNotes(fetchedNotes);
        } catch (error) {
            console.error("Failed to fetch customer notes:", error);
            onError('Failed to load customer notes.');
        } finally {
            setLoadingNotes(false);
        }
    }, [customer, onError]);

    useEffect(() => {
        if (customer?.id) {
            fetchNotes();
        }
    }, [customer, fetchNotes]);

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        setIsAddingNote(true);
        try {
            await addCustomerNote(customer.id, newNote, user.email);
            setNewNote('');
            onSuccess('Note added successfully!');
            fetchNotes();
        } catch (error) {
            console.error("Failed to add note:", error);
            onError('Failed to add note.');
        } finally {
            setIsAddingNote(false);
        }
    };

    return (
        <Modal title="Customer Details" onClose={onClose}>
            <div className="space-y-4 text-sm">
                <p className="flex items-center"><User size={16} className="mr-2 text-blue-500" /><strong>Name:</strong> {customer.name}</p>
                <p className="flex items-center"><Phone size={16} className="mr-2 text-green-500" /><strong>Phone:</strong> {customer.phone}</p>
                {customer.email && <p className="flex items-center"><Mail size={16} className="mr-2 text-purple-500" /><strong>Email:</strong> {customer.email}</p>}
                {customer.totalOrders !== undefined && <p className="flex items-center"><ShoppingBag size={16} className="mr-2 text-yellow-500" /><strong>Total Orders:</strong> {customer.totalOrders}</p>}
                {customer.totalSpent !== undefined && <p className="flex items-center"><TrendingUp size={16} className="mr-2 text-red-500" /><strong>Total Spent:</strong> {formatCurrency(customer.totalSpent)}</p>}
            </div>

            <div className="border-b border-gray-200 mt-6 mb-4">
                <nav className="-mb-px flex space-x-8">
                    <button onClick={() => setActiveTab('orders')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'orders' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        Order History
                    </button>
                    <button onClick={() => setActiveTab('notes')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'notes' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        Notes ({notes.length})
                    </button>
                </nav>
            </div>

            {activeTab === 'orders' && (
                <div>
                    <h5 className="font-semibold mb-2">Recent Orders</h5>
                    {loadingOrders ? <p>Loading orders...</p> : orders.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b">
                                        <th className="p-2">Order ID</th>
                                        <th className="p-2">Date</th>
                                        <th className="p-2">Status</th>
                                        <th className="p-2 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(order => (
                                        <tr key={order.id} className="border-b hover:bg-gray-50">
                                            <td className="p-2">{order.id.substring(0, 8)}...</td>
                                            <td className="p-2">{formatDate(order.orderDate)}</td>
                                            <td className="p-2">{order.status}</td>
                                            <td className="p-2 text-right">{formatCurrency(order.grandTotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500">No orders found for this customer.</p>
                    )}
                </div>
            )}

            {activeTab === 'notes' && (
                <div>
                    <h5 className="font-semibold mb-2">Customer Notes</h5>
                    <form onSubmit={handleAddNote} className="flex space-x-2 mb-4">
                        <input
                            type="text"
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Add a new note..."
                            className="flex-grow p-2 border rounded-md"
                            required
                        />
                        <Button type="submit" disabled={isAddingNote}>Add Note</Button>
                    </form>
                    {loadingNotes ? <p>Loading notes...</p> : notes.length > 0 ? (
                        <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                            {notes.map((note, index) => (
                                <div key={note.id || index} className="bg-gray-50 p-3 rounded-md border text-xs">
                                    <p>{note.text}</p>
                                    <p className="text-gray-500 mt-1">
                                        <span className="font-medium">{note.authorEmail || 'System'}</span> on {formatDate(note.createdAt)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">No notes for this customer yet.</p>
                    )}
                </div>
            )}
        </Modal>
    );
};

// --- Main Customer Hub View Component ---
export default function CustomerHub() {
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try {
            const fetchedCustomers = await getCustomers();
            setCustomers(fetchedCustomers);
        } catch (error) {
            console.error('Failed to fetch customers:', error);
            handleError('Failed to load customers.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const filteredCustomers = useMemo(() => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return customers.filter(customer =>
            customer.name.toLowerCase().includes(lowerCaseSearchTerm) ||
            customer.phone.includes(lowerCaseSearchTerm) ||
            customer.email?.toLowerCase().includes(lowerCaseSearchTerm)
        );
    }, [customers, searchTerm]);

    const handleSuccess = (message) => {
        setNotification({ show: true, message, type: 'success' });
        setShowAddModal(false);
        setSelectedCustomer(null);
        fetchCustomers();
    };
    const handleError = (msg) => setNotification({ show: true, message: msg, type: 'error' });

    // FIX: Define handleViewDetailsClick here
    const handleViewDetailsClick = (customer) => {
        setSelectedCustomer(customer);
    };

    return (
        <>
            <Notification notification={notification} setNotification={setNotification} />
            {showAddModal && <AddCustomerModal onClose={() => setShowAddModal(false)} onSuccess={handleSuccess} onError={handleError} />}
            {selectedCustomer && <CustomerDetailModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} onSuccess={handleSuccess} onError={handleError} />}

            <div className="flex justify-between items-center">
                <PageTitle title="Customer Hub (CRM)" subtitle="Manage customer information and view order history." />
                <Button onClick={() => setShowAddModal(true)} icon={PlusCircle}>Add Customer</Button>
            </div>

            <Card>
                <div className="flex justify-between mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 p-2 border rounded-md"
                        />
                    </div>
                </div>
                {loading ? <p>Loading customers...</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b bg-gray-50">
                                    <th className="p-4 text-sm font-semibold text-gray-600">Name</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600">Phone</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600">Email</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.map(customer => (
                                    <tr key={customer.id} className="border-b hover:bg-gray-50">
                                        <td className="p-4 font-medium">{customer.name}</td>
                                        <td className="p-4">{customer.phone}</td>
                                        <td className="p-4">{customer.email || 'N/A'}</td>
                                        <td className="p-4">
                                            {/* Correctly call handleViewDetailsClick */}
                                            <Button onClick={() => handleViewDetailsClick(customer)} variant="secondary" size="sm">View Details</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </>
    );
}