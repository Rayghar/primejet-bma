// src/views/05-Admin/UserManagement.js (Refactored Frontend View)
import React, { useState, useEffect } from 'react';
import { getUsers, inviteUser, updateUserRole, getSingleUser, updateUser, deleteUser } from '../../api/userService'; // Import new service functions
import { useAuth } from '../../hooks/useAuth';
import { USER_ROLES } from '../../utils/constants';
import { formatCurrency, formatDate } from '../../utils/formatters'; // Import formatters

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Modal from '../../components/shared/Modal';
import Notification from '../../components/shared/Notification';
import { PlusCircle, Edit, Trash2, Eye, User, Phone, Mail, DollarSign, Truck, ShoppingBag, Star } from 'lucide-react'; // Import more icons

// --- Invite User Modal ---
const InviteUserModal = ({ onSuccess, onError, onClose }) => {
  const [formData, setFormData] = useState({ email: '', role: USER_ROLES.CASHIER });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await inviteUser(formData.email, formData.role);
      onSuccess(`Invitation sent to ${formData.email}`);
      onClose();
    } catch (error) {
      onError(error.response?.data?.message || 'Failed to send invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal title='Invite New User' onClose={onClose}>
      <form onSubmit={handleSubmit} className='space-y-4'>
        {/* Corrected line: changed outer quotes to double quotes */}
        <input type='email' name='email' value={formData.email} onChange={handleChange} placeholder="User's Email Address" className='w-full p-2 border rounded-md' required />
        <select name='role' value={formData.role} onChange={handleChange} className='w-full p-2 border rounded-md bg-white'>
          {Object.values(USER_ROLES).map(role => <option key={role} value={role}>{role}</option>)}
        </select>
        <div className='flex justify-end pt-2'><Button type='submit' disabled={isSubmitting}>Send Invitation</Button></div>
      </form>
    </Modal>
  );
};

// --- Edit User Modal ---
const EditUserModal = ({ user: initialUser, onSuccess, onError, onClose }) => {
    const [formData, setFormData] = useState({
        name: initialUser.name,
        email: initialUser.email, // Email might not be editable or requires special handling
        phone: initialUser.phone,
        role: initialUser.role,
        status: initialUser.status,
        walletBalance: initialUser.walletBalance,
        isAvailableOnline: initialUser.isAvailableOnline,
        // Add other fields you want to make editable
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await updateUser(initialUser.id, formData);
            onSuccess(`User ${formData.name}'s profile updated successfully.`);
            onClose();
        } catch (error) {
            console.error("Update User Error:", error);
            onError(error.response?.data?.message || 'Failed to update user.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal title={`Edit User: ${initialUser.name}`} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded-md" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-100 cursor-not-allowed" disabled title="Email cannot be changed directly" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-2 border rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select name="role" value={formData.role} onChange={handleChange} className="w-full p-2 border rounded-md bg-white">
                        {Object.values(USER_ROLES).map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border rounded-md bg-white">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                        <option value="pending_verification">Pending Verification</option>
                    </select>
                </div>
                {formData.role === 'customer' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Wallet Balance (₦)</label>
                        <input type="number" name="walletBalance" value={formData.walletBalance} onChange={handleChange} className="w-full p-2 border rounded-md" />
                    </div>
                )}
                {formData.role === 'driver' && (
                    <div className="flex items-center">
                        <input type="checkbox" name="isAvailableOnline" checked={formData.isAvailableOnline} onChange={handleChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                        <label className="ml-2 block text-sm font-medium text-gray-700">Available Online</label>
                    </div>
                )}
                <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

// --- View User Details Modal ---
const UserDetailModal = ({ user: detailedUser, onClose, onError }) => {
    const [loadingDetails, setLoadingDetails] = useState(true);
    const [fullUser, setFullUser] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            setLoadingDetails(true);
            try {
                const data = await getSingleUser(detailedUser.id);
                setFullUser(data);
            } catch (error) {
                console.error("Failed to fetch user details:", error);
                onError(error.response?.data?.message || 'Failed to load user details.');
            } finally {
                setLoadingDetails(false);
            }
        };
        if (detailedUser?.id) {
            fetchDetails();
        }
    }, [detailedUser, onError]);

    if (loadingDetails) {
        return <Modal title="User Details" onClose={onClose}><p className="p-4 text-center">Loading user details...</p></Modal>;
    }

    if (!fullUser) {
        return <Modal title="User Details" onClose={onClose}><p className="p-4 text-center text-red-500">Could not load user details.</p></Modal>;
    }

    return (
        <Modal title={`Details for ${fullUser.name}`} onClose={onClose}>
            <div className="space-y-4 text-sm">
                <p className="flex items-center"><User size={16} className="mr-2 text-blue-500" /><strong>Name:</strong> {fullUser.name}</p>
                <p className="flex items-center"><Mail size={16} className="mr-2 text-purple-500" /><strong>Email:</strong> {fullUser.email}</p>
                <p className="flex items-center"><Phone size={16} className="mr-2 text-green-500" /><strong>Phone:</strong> {fullUser.phone || 'N/A'}</p>
                <p><strong>Role:</strong> {fullUser.role}</p>
                <p><strong>Status:</strong> <span className={`px-2 py-1 text-xs rounded-full ${fullUser.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{fullUser.status}</span></p>
                <p><strong>Created At:</strong> {formatDate(fullUser.createdAt)}</p>

                {fullUser.role === 'customer' && (
                    <div className="border-t pt-4 mt-4">
                        <h5 className="font-bold mb-2">Customer Specifics</h5>
                        <p className="flex items-center"><DollarSign size={16} className="mr-2 text-indigo-500" /><strong>Wallet Balance:</strong> {formatCurrency(fullUser.walletBalance || 0)}</p>
                        <p className="flex items-center"><ShoppingBag size={16} className="mr-2 text-yellow-500" /><strong>Total Orders:</strong> {fullUser.totalOrders || 0}</p>
                        <p className="flex items-center"><TrendingUp size={16} className="mr-2 text-green-500" /><strong>Total Spent:</strong> {formatCurrency(fullUser.totalSpent || 0)}</p>
                        {fullUser.lastOrderDate && <p><strong>Last Order:</strong> {formatDate(fullUser.lastOrderDate)}</p>}
                        {fullUser.defaultAddress && (
                            <div>
                                <h6 className="font-semibold text-xs mt-3">Default Address:</h6>
                                <p className="ml-4 text-xs">{fullUser.defaultAddress.fullAddress}</p>
                                <p className="ml-4 text-xs">{fullUser.defaultAddress.city}, {fullUser.defaultAddress.state}</p>
                            </div>
                        )}
                        {fullUser.recentOrders && fullUser.recentOrders.length > 0 && (
                            <div className="mt-3">
                                <h6 className="font-semibold text-xs">Recent Orders:</h6>
                                <ul className="list-disc list-inside ml-4 text-xs">
                                    {fullUser.recentOrders.map(order => (
                                        <li key={order.id}>{formatDate(order.orderDate)} - {formatCurrency(order.grandTotal)} ({order.status})</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {fullUser.role === 'driver' && (
                    <div className="border-t pt-4 mt-4">
                        <h5 className="font-bold mb-2">Driver Specifics</h5>
                        <p><strong>Online Status:</strong> {fullUser.isAvailableOnline ? 'Available' : 'Offline'}</p>
                        <p><strong>Vehicle Type:</strong> {fullUser.driverProfile?.vehicleType || 'N/A'}</p>
                        <p><strong>License Plate:</strong> {fullUser.driverProfile?.licensePlate || 'N/A'}</p>
                        <p className="flex items-center"><Truck size={16} className="mr-2 text-blue-500" /><strong>Total Deliveries:</strong> {fullUser.totalDeliveriesCompleted || 0}</p>
                        <p className="flex items-center"><DollarSign size={16} className="mr-2 text-green-500" /><strong>Total Earnings:</strong> {formatCurrency(fullUser.totalEarnings || 0)}</p>
                        <p className="flex items-center"><Star size={16} className="mr-2 text-yellow-500" /><strong>Average Rating:</strong> {fullUser.averageRating?.toFixed(1) || 'N/A'}</p>
                        {fullUser.lastDeliveryDate && <p><strong>Last Delivery:</strong> {formatDate(fullUser.lastDeliveryDate)}</p>}
                        {fullUser.recentDeliveries && fullUser.recentDeliveries.length > 0 && (
                            <div className="mt-3">
                                <h6 className="font-semibold text-xs">Recent Deliveries:</h6>
                                <ul className="list-disc list-inside ml-4 text-xs">
                                    {fullUser.recentDeliveries.map(order => (
                                        <li key={order.id}>{formatDate(order.orderDate)} - {formatCurrency(order.grandTotal)} ({order.status})</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
};


// --- Main User Management View ---
export default function UserManagement() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // User object for edit/detail modals

  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth(); // Current logged-in admin user

  // Function to fetch all users from the backend
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const userList = await getUsers(); // Call the new getUsers service function
      setUsers(userList);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      handleError(err.response?.data?.message || 'Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch users on component mount and after any user-related action
  useEffect(() => {
    if (currentUser) { // Ensure current user is logged in before fetching
      fetchUsers();
    }
  }, [currentUser]);

  // Handler for changing a user's role directly from the table dropdown
  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole); // Call the new updateUserRole service function
      handleSuccess('User role updated successfully.');
    } catch (err) {
      console.error('Failed to update user role:', err);
      handleError(err.response?.data?.message || 'Failed to update role.');
    }
  };

  // Handler for opening the Edit User modal
  const handleEditClick = (userToEdit) => {
    setSelectedUser(userToEdit);
    setShowEditModal(true);
  };

  // Handler for opening the View User Details modal
  const handleViewDetailsClick = (userToView) => {
    setSelectedUser(userToView);
    setShowDetailModal(true);
  };

  // Handler for deleting a user
  const handleDeleteClick = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      try {
        await deleteUser(userId); // Call the new deleteUser service function
        handleSuccess(`User "${userName}" deleted successfully.`);
        fetchUsers(); // Re-fetch users to update the list
      } catch (err) {
        console.error('Failed to delete user:', err);
        handleError(err.response?.data?.message || 'Failed to delete user.');
      }
    }
  };

  // Notification handlers
  const handleSuccess = (message) => {
    setNotification({ show: true, message, type: 'success' });
    setShowInviteModal(false); // Close modals on success
    setShowEditModal(false);
    setShowDetailModal(false);
    setSelectedUser(null); // Clear selected user
    fetchUsers(); // Re-fetch users to update the list
  };
  const handleError = (message) => setNotification({ show: true, message, type: 'error' });

  return (
    <>
      <Notification notification={notification} setNotification={setNotification} />
      
      {/* Invite User Modal */}
      {showInviteModal && <InviteUserModal onClose={() => setShowInviteModal(false)} onSuccess={handleSuccess} onError={handleError} />}
      
      {/* Edit User Modal */}
      {showEditModal && selectedUser && <EditUserModal user={selectedUser} onClose={() => setShowEditModal(false)} onSuccess={handleSuccess} onError={handleError} />}

      {/* View User Details Modal */}
      {showDetailModal && selectedUser && <UserDetailModal user={selectedUser} onClose={() => setShowDetailModal(false)} onError={handleError} />}

      <div className="flex justify-between items-center">
        <PageTitle title="User Management" subtitle="Invite new users and manage their roles and profiles." />
        <Button onClick={() => setShowInviteModal(true)} icon={PlusCircle}>Invite User</Button>
      </div>

      <Card>
        {loading ? <p>Loading users...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-2">Email</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Phone</th>
                  <th className="p-2">Role</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{user.email}</td>
                    <td className="p-2">{user.name || 'N/A'}</td>
                    <td className="p-2">{user.phone || 'N/A'}</td>
                    <td className="p-2">
                      <select 
                        value={user.role} 
                        onChange={(e) => handleRoleChange(user.id, e.target.value)} 
                        className="p-1 border rounded-md bg-white"
                        // Disable role change for the currently logged-in user to prevent self-demotion issues
                        disabled={user.id === currentUser.id} 
                      >
                        {Object.values(USER_ROLES).map(role => <option key={role} value={role}>{role}</option>)}
                      </select>
                    </td>
                    <td className="p-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-2 flex space-x-2">
                      <Button onClick={() => handleViewDetailsClick(user)} variant="secondary" size="sm" icon={Eye} title="View Details" />
                      <Button onClick={() => handleEditClick(user)} variant="secondary" size="sm" icon={Edit} title="Edit User" />
                      {/* Prevent deleting the currently logged-in user */}
                      {user.id !== currentUser.id && (
                        <Button onClick={() => handleDeleteClick(user.id, user.name)} variant="danger" size="sm" icon={Trash2} title="Delete User" />
                      )}
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