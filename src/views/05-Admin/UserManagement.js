// src/views/05-Admin/UserManagement.js
import React, { useState, useMemo, useEffect } from 'react';
import { useFirestoreQuery } from '../../hooks/useFirestoreQuery';
import { collection, query, orderBy } from 'firebase/firestore';
import { db, appId } from '../../api/firebase';
import { addUserInvitation, updateUserRole } from '../../api/firestoreService';
import { USER_ROLES } from '../../utils/constants';
import { logAppEvent } from '../../services/loggingService';

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Modal from '../../components/shared/Modal';
import Notification from '../../components/shared/Notification';
import { PlusCircle } from 'lucide-react';

// --- Invite User Modal ---
const InviteUserModal = ({ onSuccess, onError, onClose }) => {
    const [formData, setFormData] = useState({ email: '', role: USER_ROLES.CASHIER });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await addUserInvitation(formData.email, formData.role);
            onSuccess(`Invitation sent to ${formData.email}`);
            onClose();
        } catch (error) {
            logAppEvent('ERROR', 'UserManagement: Failed to send invitation.', { error: error.message, email: formData.email });
            onError('Failed to send invitation.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal title="Invite New User" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="User's Email Address" className="w-full p-2 border rounded-md" required />
                <select name="role" value={formData.role} onChange={handleChange} className="w-full p-2 border rounded-md bg-white">
                    {Object.values(USER_ROLES).map(role => <option key={role} value={role}>{role}</option>)}
                </select>
                <div className="flex justify-end pt-2"><Button type="submit" disabled={isSubmitting}>Send Invitation</Button></div>
            </form>
        </Modal>
    );
};


// --- Main User Management View ---
export default function UserManagement() {
    const [showModal, setShowModal] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    const usersQuery = useMemo(() => query(collection(db, `artifacts/${appId}/users`), orderBy('email')), []);
    const { docs: users, loading, error } = useFirestoreQuery(usersQuery);

    useEffect(() => {
        logAppEvent('DEBUG', 'UserManagement: Component did mount.', { component: 'UserManagement' });
        if (error) logAppEvent('ERROR', 'UserManagement: Failed to fetch users.', { error });
    }, [error]);

    const handleRoleChange = async (uid, newRole) => {
        logAppEvent('DEBUG', `UserManagement: Attempting to change role for user ${uid} to ${newRole}.`, { uid, newRole });
        try {
            await updateUserRole(uid, newRole);
            handleSuccess('User role updated successfully.');
        } catch (err) {
            logAppEvent('ERROR', 'UserManagement: Failed to update user role.', { error: err.message, uid, newRole });
            handleError('Failed to update role.');
        }
    };

    const handleSuccess = (message) => setNotification({ show: true, message, type: 'success' });
    const handleError = (message) => setNotification({ show: true, message, type: 'error' });

    return (
        <>
            <Notification notification={notification} setNotification={setNotification} />
            {showModal && <InviteUserModal onClose={() => setShowModal(false)} onSuccess={handleSuccess} onError={handleError} />}
            <div className="flex justify-between items-center">
                <PageTitle title="User Management" subtitle="Invite new users and manage their roles." />
                <Button onClick={() => setShowModal(true)} icon={PlusCircle}>Invite User</Button>
            </div>
            <Card>
                {loading ? <p>Loading users...</p> : (
                    <table className="w-full text-left">
                        <thead><tr className="border-b"><th className="p-2">Email</th><th className="p-2">Role</th><th className="p-2">Status</th></tr></thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className="border-b">
                                    <td className="p-2 font-medium">{user.email}</td>
                                    <td className="p-2">
                                        <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value)} className="p-1 border rounded-md bg-white">
                                            {Object.values(USER_ROLES).map(role => <option key={role} value={role}>{role}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-2"><span className={`px-2 py-1 text-xs rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{user.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Card>
        </>
    );
}
