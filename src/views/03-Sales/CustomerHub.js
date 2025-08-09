// src/views/03-Sales/CustomerHub.js
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useFirestoreQuery } from '../../hooks/useFirestoreQuery';
import { getCustomersQuery, addCustomer, getSalesForCustomerQuery, addCustomerNote, getCustomerNotesQuery } from '../../api/firestoreService';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { logAppEvent } from '../../services/loggingService';

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Modal from '../../components/shared/Modal';
import Notification from '../../components/shared/Notification';
import { PlusCircle, Search, User, Phone, Mail, ShoppingBag, MessageSquare } from 'lucide-react';

const AddCustomerModal = ({ onSuccess, onError }) => {
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', type: 'Individual' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await addCustomer(formData);
            onSuccess(`Customer "${formData.name}" added successfully.`);
        } catch (error) {
            onError('Failed to add customer.');
        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        <Modal title="Add New Customer" onClose={() => onSuccess()}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name / Company Name" className="mt-1 w-full p-2 border rounded-md" required />
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number" className="mt-1 w-full p-2 border rounded-md" required />
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" className="mt-1 w-full p-2 border rounded-md" />
                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Adding...' : 'Add Customer'}</Button>
                </div>
            </form>
        </Modal>
    );
};

const InternalNotes = ({ customer, user }) => {
    const [noteText, setNoteText] = useState('');
    const notesQuery = useMemo(() => getCustomerNotesQuery(customer.id), [customer.id]);
    const { docs: notes, loading, error } = useFirestoreQuery(notesQuery);

    useEffect(() => {
        if (error) logAppEvent('ERROR', 'CustomerHub: Failed to fetch customer notes.', { error, customerId: customer.id });
    }, [error, customer.id]);

    const handleAddNote = async () => {
        if (!noteText.trim()) return;
        try {
            await addCustomerNote(customer.id, noteText, user);
            logAppEvent('INFO', 'CustomerHub: New note added.', { customerId: customer.id });
            setNoteText('');
        } catch (error) {
            logAppEvent('ERROR', 'CustomerHub: Failed to add note.', { error: error.message, customerId: customer.id });
        }
    };
    return (
        <div className="border-t pt-4 mt-4">
            <h4 className="font-semibold text-gray-700 flex items-center mb-2"><MessageSquare className="mr-2"/>Internal Notes</h4>
            <div className="flex gap-2"><textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a new note..." className="flex-grow p-2 border rounded-md text-sm"></textarea><Button onClick={handleAddNote}>Save</Button></div>
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">{loading ? <p>Loading notes...</p> : notes.map(note => (<div key={note.id} className="bg-yellow-50 p-2 rounded-md text-xs"><p>{note.text}</p><p className="text-right text-gray-500 mt-1">- {note.author.email} on {formatDate(note.createdAt)}</p></div>))}</div>
        </div>
    );
};

const CustomerDetailsModal = ({ customer, onClose }) => {
    const { user } = useAuth();
    const salesQuery = useMemo(() => getSalesForCustomerQuery(customer.id), [customer.id]);
    const { docs: sales, loading, error } = useFirestoreQuery(salesQuery);

    useEffect(() => {
        if (error) logAppEvent('ERROR', 'CustomerHub: Failed to fetch sales for customer.', { error, customerId: customer.id });
    }, [error, customer.id]);

    return (
        <Modal title="Customer Details" onClose={onClose}>
            <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg"><h3 className="text-xl font-bold text-gray-800 flex items-center"><User className="mr-2"/>{customer.name}</h3><p className="text-sm text-gray-600 flex items-center mt-1"><Phone size={14} className="mr-2"/>{customer.phone}</p><p className="text-sm text-gray-600 flex items-center"><Mail size={14} className="mr-2"/>{customer.email || 'N/A'}</p></div>
                <div><h4 className="font-semibold text-gray-700 flex items-center"><ShoppingBag className="mr-2"/>Order History</h4>{loading ? <p>Loading order history...</p> : (<div className="mt-2 space-y-2 max-h-64 overflow-y-auto">{sales.length > 0 ? sales.map(sale => (<div key={sale.id} className="flex justify-between text-sm border-b pb-1"><span>{formatDate(sale.date)}</span><span>{sale.kgSold} kg</span><span className="font-semibold">{formatCurrency(sale.revenue)}</span></div>)) : <p className="text-sm text-gray-500">No approved orders found for this customer.</p>}</div>)}</div>
                <InternalNotes customer={customer} user={user} />
            </div>
        </Modal>
    );
};

export default function CustomerHub() {
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    const { docs: customers, loading, error } = useFirestoreQuery(getCustomersQuery());

    // ADDED: Log when the component mounts
    useEffect(() => {
        logAppEvent('DEBUG', 'CustomerHub: Component did mount.', { component: 'CustomerHub' });
    }, []);

    useEffect(() => {
        if (error) logAppEvent('ERROR', 'CustomerHub: Failed to fetch customer list.', { error });
    }, [error]);

    const filteredCustomers = useMemo(() => {
        logAppEvent('DEBUG', 'CustomerHub: Filtering customer list.', { searchTerm, customerCount: customers.length });
        return customers.filter(c => c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone?.includes(searchTerm));
    }, [customers, searchTerm]);

    const handleSuccess = (message) => setNotification({ show: true, message, type: 'success' });

    return (
        <>
            <Notification notification={notification} setNotification={setNotification} />
            {showAddModal && <AddCustomerModal onClose={() => setShowAddModal(false)} onSuccess={handleSuccess} />}
            {selectedCustomer && <CustomerDetailsModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />}
            <div className="flex justify-between items-center"><PageTitle title="Customer Hub (CRM)" subtitle="Manage customer information and view order history." /><Button onClick={() => setShowAddModal(true)} icon={PlusCircle}>Add Customer</Button></div>
            <Card>
                <div className="flex justify-between mb-4"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder="Search by name or phone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 p-2 border rounded-md" /></div></div>
                {loading ? <p>Loading customers...</p> : (<div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b bg-gray-50"><th className="p-4 text-sm font-semibold text-gray-600">Name</th><th className="p-4 text-sm font-semibold text-gray-600">Phone</th><th className="p-4 text-sm font-semibold text-gray-600">Email</th><th className="p-4 text-sm font-semibold text-gray-600">Actions</th></tr></thead><tbody>{filteredCustomers.map(customer => (<tr key={customer.id} className="border-b hover:bg-gray-50"><td className="p-4 font-medium">{customer.name}</td><td className="p-4">{customer.phone}</td><td className="p-4">{customer.email || 'N/A'}</td><td className="p-4"><Button onClick={() => setSelectedCustomer(customer)} variant="secondary">View Details</Button></td></tr>))}</tbody></table></div>)}
            </Card>
        </>
    );
}
