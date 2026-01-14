import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/axios';
import Pagination from '../../../components/Pagination/Pagination';
import './ActivityLogs.css';
import {
    FiRefreshCw, FiSearch, FiFilter, FiUser, FiActivity, FiCpu,
    FiCalendar, FiX, FiEye, FiTrash2
} from 'react-icons/fi';

const ActivityLogs = () => {
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);

    // Pagination & Filter State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [totalItems, setTotalItems] = useState(0);

    const [filters, setFilters] = useState({
        user_id: '',
        module: '',
        search: ''
    });

    const [cleaning, setCleaning] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);

    // Modules list for filter
    const modules = [
        'sysadmin', 'asset'
    ];

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [currentPage, itemsPerPage, filters]);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/sysadmin/users');
            if (response.data.success) {
                setUsers(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch users', error);
        }
    };

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const offset = (currentPage - 1) * itemsPerPage;

            const params = {
                limit: itemsPerPage,
                offset: offset,
                user_id: filters.user_id,
                module: filters.module,
                search: filters.search
            };

            const response = await api.get('/sysadmin/logs', { params });

            if (response.data.success) {
                // If the API returns a standard pagination structure (data, total)
                // Assuming current API returns just data, we might need to adjust or rely on 'hasMore' logic
                // But for standard UI, let's assume valid array.
                // NOTE: The current API doesn't return 'total' count. 
                // We'll approximate: if we get less than limit, we reached end.
                // But Pagination component needs totalItems.
                // For now let's just set logs.
                setLogs(response.data.data);

                // If getting full page, assume there might be more. 
                // To support real pagination, backend should return count.
                // For now, let's fake a large number if full page returned, 
                // or just handle what we have.
                // Quick fix: Set totalItems to (currentPage * itemsPerPage) + (response.data.data.length < itemsPerPage ? 0 : 100)
                // This is hacky. Let's stick to simple Next/Prev if API is limited, 
                // OR just show what we have.
                // Better: Just set a high number if full page to enable "Next" button.
                if (response.data.data.length === itemsPerPage) {
                    setTotalItems(offset + itemsPerPage + 100); // Allow next pages
                } else {
                    setTotalItems(offset + response.data.data.length);
                }
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1); // Reset to page 1 on filter
    };

    const handleCleanup = async () => {
        if (!window.confirm('Are you sure you want to delete logs older than 100 days? This action cannot be undone.')) {
            return;
        }

        try {
            setCleaning(true);
            const response = await api.delete('/sysadmin/logs/cleanup');
            if (response.data.success) {
                alert(response.data.message);
                fetchLogs(); // Refresh list
            }
        } catch (error) {
            console.error('Cleanup failed:', error);
            alert('Failed to cleanup logs');
        } finally {
            setCleaning(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };

    const getActionColor = (action) => {
        const act = (action || '').toUpperCase();
        if (act.includes('CREATE') || act.includes('ADD') || act.includes('INSERT')) return 'badge-success';
        if (act.includes('UPDATE') || act.includes('EDIT')) return 'badge-info';
        if (act.includes('DELETE') || act.includes('REMOVE')) return 'badge-error';
        if (act.includes('LOGIN')) return 'badge-primary';
        if (act.includes('LOGOUT')) return 'badge-neutral';
        return 'badge-ghost';
    };

    const handleViewDetail = (id) => {
        navigate(`/sysadmin/logs/${id}`);
    };

    return (
        <div className="activity-logs">
            <div className="page-header">
                <div>
                    <h1>Activity Logs</h1>
                    <p>Track system usage and user activities</p>
                </div>
                <div className="header-actions">
                    <button
                        onClick={handleCleanup}
                        className="btn btn-outline btn-error btn-sm"
                        disabled={cleaning}
                    >
                        <FiTrash2 /> {cleaning ? 'Cleaning...' : 'Cleanup Old Logs'}
                    </button>
                    <button
                        onClick={() => fetchLogs()}
                        className="btn btn-ghost btn-sm"
                        title="Refresh"
                    >
                        <FiRefreshCw className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            <div className="card">
                {/* Filters */}
                <div className="filter-section">
                    <div className="filter-group">
                        <label><FiFilter /> Search</label>
                        <input
                            type="text"
                            name="search"
                            placeholder="Search action, details, IP..."
                            value={filters.search}
                            onChange={handleFilterChange}
                        />
                    </div>

                    <div className="filter-group">
                        <label><FiUser /> User</label>
                        <select
                            name="user_id"
                            value={filters.user_id}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Users</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.username}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label><FiCpu /> Module</label>
                        <select
                            name="module"
                            value={filters.module}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Modules</option>
                            {modules.map(m => (
                                <option key={m} value={m}>{m.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="desktop-table">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>User</th>
                                <th>Module</th>
                                <th>Action</th>
                                <th>IP Address</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && logs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8">
                                        <div className="loading-spinner mb-2"></div>
                                        <div>Loading logs...</div>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-base-content/50">
                                        No activity logs found
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id}>
                                        <td className="font-mono text-xs">{formatDate(log.created_at)}</td>
                                        <td>
                                            <div className="font-bold text-sm">{log.username || 'System'}</div>
                                            <div className="text-xs text-secondary">{log.full_name}</div>
                                        </td>
                                        <td>
                                            <span className="badge badge-outline badge-sm">{log.module}</span>
                                        </td>
                                        <td>
                                            <span className={`badge ${getActionColor(log.action)} badge-sm`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="font-mono text-xs">{log.ip_address}</td>
                                        <td>
                                            <button
                                                className="btn-view-transparent"
                                                onClick={() => handleViewDetail(log.id)}
                                            >
                                                <FiEye /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="mobile-list">
                    {logs.map(log => (
                        <div key={log.id} className="mobile-card">
                            <div className="mobile-card-header">
                                <span className={`badge ${getActionColor(log.action)}`}>{log.action}</span>
                                <span className="mobile-meta">{formatDate(log.created_at)}</span>
                            </div>
                            <div className="mobile-card-body">
                                <div className="mobile-user">
                                    <div className="avatar placeholder">
                                        <div className="bg-neutral-focus text-neutral-content rounded-full w-6">
                                            <span className="text-xs">{(log.username || 'S').charAt(0)}</span>
                                        </div>
                                    </div>
                                    <span className="font-bold">{log.username || 'System'}</span>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="badge badge-ghost badge-sm">{log.module}</span>
                                    <button
                                        className="btn btn-xs btn-outline"
                                        onClick={() => handleViewDetail(log.id)}
                                    >
                                        Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                <Pagination
                    currentPage={currentPage}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                />
            </div>
        </div>
    );
};

export default ActivityLogs;
