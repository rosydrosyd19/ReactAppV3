import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../utils/axios';
import { FiPlus, FiEdit2, FiTrash2, FiTool, FiSearch, FiFilter, FiEye, FiChevronDown } from 'react-icons/fi';
import Pagination from '../../../components/Pagination/Pagination';
import ConfirmationModal from '../../../components/Modal/ConfirmationModal';
import Toast from '../../../components/Toast/Toast';
import MaintenanceModal from './MaintenanceModal';
import '../AssetList/AssetList.css'; // Reuse AssetList styles

const MaintenanceList = () => {
    const navigate = useNavigate();
    const [maintenanceRecords, setMaintenanceRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [filters, setFilters] = useState({ search: '', status: '' });
    const [modal, setModal] = useState({ isOpen: false, data: null });
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
    const [toast, setToast] = useState({ show: false, message: '', type: '' });
    const [expandedId, setExpandedId] = useState(null); // For mobile view expansion

    const fetchMaintenance = async () => {
        setLoading(true);
        try {
            // Check if backend supports pagination params, otherwise handle client side or just fetch all
            // Based on asset.js, it fetches ALL by default (no pagination in query params shown in grep).
            // We will paginate client side if needed or just show all for now.
            // Wait, standard pattern in this app seems to be client-side pagination or server-side.
            // Let's assume server returns all "data" and we verify.
            // The route GET /maintenance returns { success: true, data: [...] }
            const res = await axios.get('/asset/maintenance');
            if (res.data.success) {
                let data = res.data.data;
                // Filter client side
                if (filters.search) {
                    const search = filters.search.toLowerCase();
                    data = data.filter(m =>
                        m.asset_name?.toLowerCase().includes(search) ||
                        m.asset_tag?.toLowerCase().includes(search) ||
                        m.maintenance_type?.toLowerCase().includes(search)
                    );
                }
                if (filters.status) {
                    data = data.filter(m => m.status === filters.status);
                }

                // Pagination logic
                const total = data.length || 0;
                setTotalItems(total);
                setTotalPages(Math.ceil(total / itemsPerPage) || 1);

                const startIndex = (currentPage - 1) * itemsPerPage;
                setMaintenanceRecords(data.slice(startIndex, startIndex + itemsPerPage));
            }
        } catch (error) {
            console.error('Error fetching maintenance:', error);
            showToast('Error loading maintenance records', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMaintenance();
    }, [currentPage, filters, itemsPerPage]); // Re-fetch/Re-filter when these change

    const handleDelete = async () => {
        try {
            await axios.delete(`/asset/maintenance/${confirmModal.id}`);
            showToast('Maintenance record deleted', 'success');
            setConfirmModal({ isOpen: false, id: null });
            fetchMaintenance();
        } catch (error) {
            showToast('Error deleting record', 'error');
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'scheduled': return <span className="badge badge-warning">Scheduled</span>;
            case 'requests': return <span className="badge badge-info">Requests</span>;
            case 'in_progress': return <span className="badge badge-primary">In Progress</span>;
            case 'completed': return <span className="badge badge-success">Completed</span>;
            case 'cancelled': return <span className="badge badge-danger">Cancelled</span>;
            default: return <span className="badge">{status}</span>;
        }
    };

    return (
        <div className="asset-list">
            <div className="page-header">
                <div>
                    <h1>Maintenance Management</h1>
                    <p>Track asset maintenance and repairs</p>
                </div>
                <button className="btn btn-primary" onClick={() => setModal({ isOpen: true, data: null })}>
                    <FiPlus /> Add Maintenance
                </button>
            </div>

            <div className="card">
                <div className="filters-bar">
                    <div className="search-form">
                        <div className="input-with-icon">
                            <FiSearch />
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Search asset or type..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="filter-group">
                        <FiFilter />
                        <select
                            className="form-select"
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        >
                            <option value="">All Status</option>
                            <option value="requests">Requests</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                </div>
                <div className="desktop-table">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Asset</th>
                                <th>Type / Ticket No</th>
                                <th>Date</th>
                                <th>Cost</th>
                                <th>Status</th>
                                <th>Performed By</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="text-center" style={{ padding: '2rem' }}>
                                        <div className="loading-spinner"></div>
                                    </td>
                                </tr>
                            ) : maintenanceRecords.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center" style={{ padding: '2rem' }}>No maintenance records found.</td>
                                </tr>
                            ) : (
                                maintenanceRecords.map(record => (
                                    <tr key={record.id}>
                                        <td>
                                            <div><strong>{record.asset_tag}</strong></div>
                                            <div className="text-secondary" style={{ fontSize: '12px' }}>{record.asset_name}</div>
                                        </td>
                                        <td>
                                            <div>{record.maintenance_type}</div>
                                            <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#666' }}>
                                                {record.ticket_number || '-'}
                                            </div>
                                        </td>
                                        <td>{new Date(record.maintenance_date).toLocaleDateString()}</td>
                                        <td>
                                            {record.cost && !isNaN(parseFloat(record.cost))
                                                ? `$${parseFloat(record.cost).toFixed(2)}`
                                                : '-'}
                                        </td>
                                        <td>{getStatusBadge(record.status)}</td>
                                        <td>{record.performed_by || '-'}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => navigate(`/asset/maintenance/${record.id}`)}
                                                    title="View Details"
                                                >
                                                    <FiEye />
                                                </button>
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => setModal({ isOpen: true, data: record })}
                                                    title="Edit"
                                                >
                                                    <FiEdit2 />
                                                </button>
                                                <button
                                                    className="btn-icon btn-danger"
                                                    onClick={() => setConfirmModal({ isOpen: true, id: record.id })}
                                                    title="Delete"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Mobile View */}
                <div className="mobile-list">
                    {loading ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                        </div>
                    ) : maintenanceRecords.length === 0 ? (
                        <div className="empty-state">No records found</div>
                    ) : (
                        maintenanceRecords.map(record => (
                            <div key={record.id} className="mobile-list-item">
                                <div
                                    className="mobile-list-main"
                                    onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                                >
                                    <div className="mobile-asset-icon">
                                        <FiTool />
                                        <div className={`status-dot ${record.status === 'completed' ? 'active' :
                                            record.status === 'scheduled' ? 'warning' : 'danger'
                                            }`}></div>
                                    </div>
                                    <div className="mobile-asset-info">
                                        <div className="asset-primary-text">
                                            <span className="asset-tag">{record.ticket_number || '-'}</span>
                                            <span className="category-badge-small">{record.maintenance_type}</span>
                                        </div>
                                        <div className="asset-secondary-text">
                                            {record.asset_name} ({record.asset_tag})
                                        </div>
                                    </div>
                                    <div className={`mobile-expand-icon ${expandedId === record.id ? 'rotated' : ''}`}>
                                        <FiChevronDown />
                                    </div>
                                </div>
                                {expandedId === record.id && (
                                    <div className="mobile-list-details">
                                        <div className="detail-grid">
                                            <div className="detail-item">
                                                <span className="label">Date</span>
                                                <span className="value">{new Date(record.maintenance_date).toLocaleDateString()}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="label">Cost</span>
                                                <span className="value">
                                                    {record.cost && !isNaN(parseFloat(record.cost))
                                                        ? `$${parseFloat(record.cost).toFixed(2)}`
                                                        : '-'}
                                                </span>
                                            </div>
                                            <div className="detail-item full-width">
                                                <span className="label">Status</span>
                                                <span className="value">{getStatusBadge(record.status)}</span>
                                            </div>
                                        </div>
                                        <div className="mobile-actions">
                                            <button className="action-btn view" onClick={() => navigate(`/asset/maintenance/${record.id}`)}>
                                                <FiEye /> View
                                            </button>
                                            <button className="action-btn edit" onClick={() => setModal({ isOpen: true, data: record })}>
                                                <FiEdit2 /> Edit
                                            </button>
                                            <button className="action-btn delete" onClick={() => setConfirmModal({ isOpen: true, id: record.id })}>
                                                <FiTrash2 /> Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
                {(totalPages > 1 || totalItems > 0) && (
                    <Pagination
                        currentPage={currentPage}
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={setItemsPerPage}
                    />
                )}
            </div>

            <MaintenanceModal
                isOpen={modal.isOpen}
                onClose={() => setModal({ isOpen: false, data: null })}
                onSuccess={fetchMaintenance}
                maintenance={modal.data}
            />

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, id: null })}
                onConfirm={handleDelete}
                title="Delete Maintenance Record"
                message="Are you sure you want to delete this maintenance record?"
            />

            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}
        </div>
    );
};

export default MaintenanceList;
