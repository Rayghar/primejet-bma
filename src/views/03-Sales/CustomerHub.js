// src/views/03-Sales/CustomerHub.js (NEW)

import React, { useState, useMemo } from 'react';
import { useFirestoreQuery } from '../../hooks/useFirestoreQuery';
import { getCustomersQuery, addCustomer, getSalesForCustomerQuery } from '../../api/firestoreService';
import { formatDate, formatCurrency } from '../../utils/formatters';

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Modal from '../../components/shared/modal';
import Notification from '../../components/shared/Notification';
import { PlusCircle, Search, User, Phone, Mail, ShoppingBag } from 'lucide-react';

// --- Add Customer Modal ---
const AddCustomerModal = ({ onClose, onSuccess }) => {
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
            onSuccess('Failed to add customer.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal title="Add New Customer" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium">Full Name / Company Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" required />
                </div>
                <div>
                    <label className="block text-sm font-medium">Phone Number</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" required />
                </div>
                <div>
                    <label className="block text-sm font-medium">Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" />
                </div>
                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Adding...' : 'Add Customer'}</Button>
                </div>
            </form>
        </Modal>
    );
};

// --- Customer Details Modal ---
const CustomerDetailsModal = ({ customer, onClose }) => {
    // Note: We are client-side filtering sales by customer name for this demo.
    // A production app should store `customerId` on the sales log for efficient querying.
    const { docs: sales, loading } = useFirestoreQuery(getSalesForCustomerQuery());
    const customerSales = sales.filter(sale => sale.customerName === customer.name); // Simulated join

    return (
        <Modal title="Customer Details" onClose={onClose}>
            <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center"><User className="mr-2"/>{customer.name}</h3>
                    <p className="text-sm text-gray-600 flex items-center mt-1"><Phone size={14} className="mr-2"/>{customer.phone}</p>
                    <p className="text-sm text-gray-600 flex items-center"><Mail size={14} className="mr-2"/>{customer.email || 'N/A'}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-700 flex items-center"><ShoppingBag className="mr-2"/>Order History</h4>
                    {loading ? <p>Loading order history...</p> : (
                        <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                            {customerSales.length > 0 ? customerSales.map(sale => (
                                <div key={sale.id} className="flex justify-between text-sm border-b pb-1">
                                    <span>{formatDate(sale.date)}</span>
                                    <span>{sale.kgSold} kg</span>
                                    <span className="font-semibold">{formatCurrency(sale.revenue)}</span>
                                </div>
                            )) : <p className="text-sm text-gray-500">No approved orders found for this customer.</p>}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};


// --- Main Customer Hub View ---
export default function CustomerHub() {
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    const { docs: customers, loading } = useFirestoreQuery(getCustomersQuery());

    const filteredCustomers = useMemo(() => {
        return customers.filter(c => 
            c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone?.includes(searchTerm)
        );
    }, [customers, searchTerm]);

    const handleSuccess = (message, type = 'success') => {
        setNotification({ show: true, message, type });
    };

    return (
        <>
            <Notification notification={notification} setNotification={setNotification} />
            {showAddModal && <AddCustomerModal onClose={() => setShowAddModal(false)} onSuccess={handleSuccess} />}
            {selectedCustomer && <CustomerDetailsModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />}

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
                                            <Button onClick={() => setSelectedCustomer(customer)} variant="secondary">View Details</Button>
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
