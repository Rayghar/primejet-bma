// src/views/05-Admin/AuditLog.js
import React from 'react';
import { useFirestoreQuery } from '../../hooks/useFirestoreQuery';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { db, appId } from '../../api/firebase';
import { formatDate } from '../../utils/formatters';

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';

export default function AuditLog() {
    // Query for the 100 most recent audit log entries
    const auditLogQuery = query(
        collection(db, `artifacts/${appId}/audit_logs`),
        orderBy('timestamp', 'desc'),
        limit(100)
    );

    const { docs: logs, loading } = useFirestoreQuery(auditLogQuery);

    return (
        <>
            <PageTitle title="System Audit Log" subtitle="A record of important actions taken within the application." />
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b bg-gray-50">
                                <th className="p-4 text-sm font-semibold text-gray-600">Timestamp</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">User</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">Action</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4" className="text-center p-8">Loading audit trail...</td></tr>
                            ) : logs.map(log => (
                                <tr key={log.id} className="border-b hover:bg-gray-50 text-sm">
                                    <td className="p-4">{formatDate(log.timestamp)}</td>
                                    <td className="p-4">{log.user?.email || 'N/A'}</td>
                                    <td className="p-4 font-medium text-blue-600">{log.action}</td>
                                    <td className="p-4 text-gray-500 text-xs">
                                        {/* Display details object as a string */}
                                        {JSON.stringify(log.details)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </>
    );
}
