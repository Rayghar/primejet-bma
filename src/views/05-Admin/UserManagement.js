// src/views/05-Admin/UserManagement.js
import React, { useState, useEffect } from 'react';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import { PlusCircle } from 'lucide-react';
import userService from '../../services/userService';

// Assume Modal, UserTable, InviteUserModal components are created and imported
// For brevity, their implementation is simplified here.

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await userService.adminGetUsers({ role: 'admin' }); // Example filter
                setUsers(response.data.users);
            } catch (error) {
                console.error("Failed to fetch users", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    return (
        <>
            <div className="flex justify-between items-center">
                <PageTitle title="User Management" />
                <Button icon={PlusCircle}>Invite User</Button>
            </div>
            <Card>
                {loading ? <p>Loading...</p> : <p>{users.length} users found.</p> /* Replace with UserTable */}
            </Card>
        </>
    );
}
