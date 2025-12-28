import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import { ShieldAlert, Search } from 'lucide-react';

export default function AuditLog() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // You might need to add this endpoint to your admin.routes.js: 
        // router.get('/logs', authMiddleware('admin'), adminController.getSystemLogs);
        // For now, we simulate or fetch if available.
        apiClient.get('/admin/logs')
            .then(res => setLogs(res.data))
            .catch(err => console.log("Logs not available via API yet"))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-6">
            <PageTitle title="System Audit Logs" subtitle="Security and operational events" />
            
            <Card className="p-0 overflow-hidden">
                <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                    <div className="relative w-64">
                        <input type="text" placeholder="Search logs..." className="pl-9 pr-4 py-2 border rounded-lg w-full text-sm"/>
                        <Search size={16} className="absolute left-3 top-3 text-gray-400"/>
                    </div>
                    <button className="text-sm text-blue-600 font-medium">Export CSV</button>
                </div>
                
                {loading ? <div className="p-8 text-center">Loading logs...</div> : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white text-gray-500 font-medium border-b">
                            <tr>
                                <th className="p-4">Timestamp</th>
                                <th className="p-4">User</th>
                                <th className="p-4">Action</th>
                                <th className="p-4">IP Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {logs.length === 0 ? (
                                <tr><td colSpan="4" className="p-8 text-center text-gray-500">No logs found.</td></tr>
                            ) : logs.map((log, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="p-4 text-gray-600">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className="p-4 font-medium">{log.userEmail}</td>
                                    <td className="p-4">
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono text-xs">{log.ip}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Card>
        </div>
    );
}