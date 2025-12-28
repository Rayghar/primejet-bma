import React, { useState, useEffect } from 'react';
import { getCustomers, getCustomerOrders, addCustomer } from '../../api/customerService'; // Assumes addCustomer exists in service
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Modal from '../../components/shared/Modal';
import { Search, PlusCircle, User, Phone, Mail, Eye, Clock, MessageSquare } from 'lucide-react';

export default function CustomerHub() {
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerHistory, setCustomerHistory] = useState([]);
    
    // Restored Form State
    const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '', email: '', type: 'Individual' });

    useEffect(() => {
        getCustomers(searchTerm).then(data => setCustomers(data || []));
    }, [searchTerm]);

    const handleAddCustomer = async (e) => {
        e.preventDefault();
        try {
            await addCustomer(newCustomerForm);
            setShowAddModal(false);
            setNewCustomerForm({ name: '', phone: '', email: '', type: 'Individual' });
            // Refresh list
            const updated = await getCustomers(searchTerm);
            setCustomers(updated || []);
        } catch (e) { alert("Error adding customer: " + e.message); }
    };

    const handleViewDetails = async (customer) => {
        setSelectedCustomer(customer);
        try {
            const history = await getCustomerOrders(customer.id);
            setCustomerHistory(history);
        } catch (e) { setCustomerHistory([]); }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <PageTitle title="Customer Hub" subtitle="CRM & History" />
                <Button onClick={() => setShowAddModal(true)} icon={PlusCircle}>Add Customer</Button>
            </div>

            <Card className="p-0 overflow-hidden">
                <div className="p-4 border-b border-white/5">
                    <div className="relative">
                        <input type="text" placeholder="Search..." className="glass-input w-full pl-10 py-2" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        <Search className="absolute left-3 top-2.5 text-gray-500" size={18}/>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-white/5 text-gray-300 uppercase text-xs">
                            <tr>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Contact</th>
                                <th className="p-4 text-center">Type</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {customers.map(cust => (
                                <tr key={cust.id} className="hover:bg-white/5">
                                    <td className="p-4 font-medium text-white">{cust.name}</td>
                                    <td className="p-4">
                                        <div className="flex items-center"><Phone size={12} className="mr-1"/> {cust.phone}</div>
                                        <div className="flex items-center"><Mail size={12} className="mr-1"/> {cust.email}</div>
                                    </td>
                                    <td className="p-4 text-center"><span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">{cust.type || 'Individual'}</span></td>
                                    <td className="p-4 text-right">
                                        <Button size="sm" variant="secondary" onClick={() => handleViewDetails(cust)} icon={Eye}>Details</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Restored Add Customer Modal */}
            {showAddModal && (
                <Modal title="Add New Customer" onClose={() => setShowAddModal(false)}>
                    <form onSubmit={handleAddCustomer} className="space-y-4">
                        <div>
                            <label className="block text-gray-400 text-xs mb-1">Name</label>
                            <input className="glass-input w-full p-3" value={newCustomerForm.name} onChange={e => setNewCustomerForm({...newCustomerForm, name: e.target.value})} required />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-xs mb-1">Phone</label>
                            <input className="glass-input w-full p-3" value={newCustomerForm.phone} onChange={e => setNewCustomerForm({...newCustomerForm, phone: e.target.value})} required />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-xs mb-1">Email</label>
                            <input className="glass-input w-full p-3" value={newCustomerForm.email} onChange={e => setNewCustomerForm({...newCustomerForm, email: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-xs mb-1">Type</label>
                            <select className="glass-input w-full p-3 bg-slate-800" value={newCustomerForm.type} onChange={e => setNewCustomerForm({...newCustomerForm, type: e.target.value})}>
                                <option>Individual</option><option>Corporate</option>
                            </select>
                        </div>
                        <div className="flex justify-end pt-4"><Button type="submit">Create Account</Button></div>
                    </form>
                </Modal>
            )}

            {/* Details Modal */}
            {selectedCustomer && (
                <Modal title={selectedCustomer.name} onClose={() => setSelectedCustomer(null)}>
                    <div className="space-y-4">
                        <h4 className="font-bold text-white flex items-center border-b border-white/10 pb-2"><Clock size={16} className="mr-2"/> Order History</h4>
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                            {customerHistory.length === 0 ? <p className="text-gray-500 text-sm">No orders found.</p> : customerHistory.map(o => (
                                <div key={o.id} className="p-3 bg-white/5 rounded flex justify-between text-sm">
                                    <span>{new Date(o.createdAt).toLocaleDateString()}</span>
                                    <span className="text-white font-mono">₦{o.grandTotal?.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                        {/* Note: You can add the "Add Note" section here similarly to the Add Customer form */}
                    </div>
                </Modal>
            )}
        </div>
    );
}