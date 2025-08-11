// src/views/05-Admin/AuditLog.js
import React, { useState, useEffect } from 'react';
import { getAuditLogs } from '../../api/logService'; // Import the new service function
import { formatDate } from '../../utils/formatters';

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button'; // Assuming Button is used for pagination/filters
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'; // Icons for search and pagination

export default function AuditLog() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        page: 1,
        limit: 20, // Default limit, can be adjusted
        search: '', // Search term for email, action, details
        action: '', // Filter by specific action type
        userId: '', // Filter by specific user ID
    });
    const [totalPages, setTotalPages] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);

    // Function to fetch audit logs based on current filters
    const fetchAuditLogs = async () => {
        setLoading(true);
        try {
            const result = await getAuditLogs(filters); // Call the new service function
            setLogs(result.logs);
            setTotalPages(result.totalPages);
            setTotalLogs(result.totalLogs);
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
            // Optionally, set a notification or error state here
        } finally {
            setLoading(false);
        }
    };

    // Fetch logs on component mount and when filters change
    useEffect(() => {
        fetchAuditLogs();
    }, [filters]); // Re-fetch when filters object changes

    // Handle filter input changes
    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value, page: 1 })); // Reset page to 1 on filter change
    };

    // Handle search button click (triggers re-fetch via useEffect)
    const handleSearch = (e) => {
        e.preventDefault();
        setFilters(prev => ({ ...prev, page: 1 })); // Ensure page is reset to 1 on explicit search
    };

    // Handle pagination: next page
    const handleNextPage = () => {
        setFilters(prev => ({ ...prev, page: prev.page + 1 }));
    };

    // Handle pagination: previous page
    const handlePreviousPage = () => {
        setFilters(prev => ({ ...prev, page: prev.page - 1 }));
    };

    return (
        <>
            <PageTitle title="System Audit Log" subtitle="A record of important actions taken within the application." />
            <Card>
                {/* Filter and Search Section */}
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-6">
                    <div>
                        <label htmlFor="search-term" className="block text-sm font-medium">Search</label>
                        <input
                            type="text"
                            id="search-term"
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                            placeholder="Search email, action, details..."
                            className="mt-1 w-full p-2 border rounded-md"
                        />
                    </div>
                    <div>
                        <label htmlFor="filter-action" className="block text-sm font-medium">Action Type</label>
                        <input
                            type="text" // Could be a select dropdown if action types are predefined
                            id="filter-action"
                            name="action"
                            value={filters.action}
                            onChange={handleFilterChange}
                            placeholder="e.g., USER_LOGIN"
                            className="mt-1 w-full p-2 border rounded-md"
                        />
                    </div>
                    <div>
                        <label htmlFor="filter-user-id" className="block text-sm font-medium">User ID</label>
                        <input
                            type="text"
                            id="filter-user-id"
                            name="userId"
                            value={filters.userId}
                            onChange={handleFilterChange}
                            placeholder="e.g., 123-abc-456"
                            className="mt-1 w-full p-2 border rounded-md"
                        />
                    </div>
                    <Button type="submit" icon={Search} className="md:col-span-1">Apply Filters</Button>
                </form>

                {/* Audit Log Table */}
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
                            ) : logs.length > 0 ? (
                                logs.map(log => (
                                    <tr key={log.id} className="border-b hover:bg-gray-50 text-sm">
                                        <td className="p-4">{formatDate(log.timestamp)}</td>
                                        <td className="p-4">{log.user?.email || log.user?.uid || 'N/A'}</td>
                                        <td className="p-4 font-medium text-blue-600">{log.action}</td>
                                        <td className="p-4 text-gray-500 text-xs">
                                            {/* Display details object as a string, or format more nicely if structure is known */}
                                            {JSON.stringify(log.details)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="4" className="text-center p-8 text-gray-500">No audit logs found matching criteria.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-gray-600">Showing {logs.length} of {totalLogs} logs.</p>
                    <div className="flex space-x-2">
                        <Button
                            onClick={handlePreviousPage}
                            disabled={filters.page <= 1 || loading}
                            icon={ChevronLeft}
                        >
                            Previous
                        </Button>
                        <Button
                            onClick={handleNextPage}
                            disabled={filters.page >= totalPages || loading}
                            icon={ChevronRight}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </Card>
        </>
    );
}