// src/views/05-Admin/AppLogViewer.js
import React from 'react';
import { useFirestoreQuery } from '../../hooks/useFirestoreQuery';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { db, appId } from '../../api/firebase';
import { formatDate } from '../../utils/formatters';

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';

export default function AppLogViewer() {
    const appLogQuery = query(
        collection(db, `artifacts/${appId}/app_logs`),
        orderBy('timestamp', 'desc'),
        limit(100)
    );

    const { docs: logs, loading } = useFirestoreQuery(appLogQuery);

    const getLevelColor = (level) => {
        switch (level) {
            case 'ERROR': return 'bg-red-100 text-red-800';
            case 'WARN': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-blue-100 text-blue-800';
        }
    };

    return (
        <>
            <PageTitle title="Application Logs" subtitle="View recent errors and events for troubleshooting." />
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b bg-gray-50">
                                <th className="p-4 text-sm font-semibold text-gray-600">Timestamp</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">Level</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">User</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">Message</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" className="text-center p-8">Loading logs...</td></tr>
                            ) : logs.map(log => (
                                <tr key={log.id} className="border-b hover:bg-gray-50 text-sm">
                                    <td className="p-4 whitespace-nowrap">{formatDate(log.timestamp)}</td>
                                    <td className="p-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getLevelColor(log.level)}`}>{log.level}</span></td>
                                    <td className="p-4">{log.user?.email || 'anonymous'}</td>
                                    <td className="p-4 font-medium">{log.message}</td>
                                    <td className="p-4"><pre className="bg-gray-100 p-2 rounded-md text-xs whitespace-pre-wrap"><code>{log.details}</code></pre></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </>
    );
}
