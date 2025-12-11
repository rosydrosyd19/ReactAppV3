import Pagination from '../../../components/Pagination/Pagination';
import './AssetList.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../utils/axios';
import { useAuth } from '../../../contexts/AuthContext';
import AssetModal from './AssetModal';
import ConfirmationModal from '../../../components/Modal/ConfirmationModal';
import Toast from '../../../components/Toast/Toast';
import {
    FiPlus,
    FiSearch,
    FiFilter,
    FiEdit2,
    FiTrash2,
    FiEye,
    FiPackage,
    FiChevronDown
} from 'react-icons/fi';

const AssetList = () => {
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal State
    const [showAssetModal, setShowAssetModal] = useState(false);
    const [selectedAssetId, setSelectedAssetId] = useState(null);

    const [statusFilter, setStatusFilter] = useState('');
    const [expandedItemId, setExpandedItemId] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [assetToDelete, setAssetToDelete] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const toggleMobileItem = (id) => {
        setExpandedItemId(expandedItemId === id ? null : id);
    };

    useEffect(() => {
        fetchAssets();
    }, [statusFilter]);

    // Reset pagination when search or status filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter]);

    const fetchAssets = async () => {
        try {
            setLoading(true);
            const params = {};
            if (statusFilter) params.status = statusFilter;
            // Removed search param from server call to enable client-side filtering

            const response = await axios.get('/asset/assets', { params });
            if (response.data.success) {
                setAssets(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching assets:', error);
            alert('Failed to fetch assets');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id, assetTag) => {
        setAssetToDelete({ id, assetTag });
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!assetToDelete) return;

        try {
            const response = await axios.delete(`/asset/assets/${assetToDelete.id}`);
            if (response.data.success) {
                setToastMessage('Asset deleted successfully');
                setShowToast(true);
                fetchAssets();
            }
        } catch (error) {
            console.error('Error deleting asset:', error);
            alert('Failed to delete asset');
        } finally {
            setShowDeleteModal(false);
            setAssetToDelete(null);
        }
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            available: 'badge-success',
            assigned: 'badge-primary',
            maintenance: 'badge-warning',
            retired: 'badge-danger',
            lost: 'badge-danger',
        };
        return `badge ${statusColors[status] || 'badge-primary'}`;
    };

    const filteredAssets = assets.filter(asset =>
        asset.asset_name.toLowerCase().includes(search.toLowerCase()) ||
        asset.asset_tag.toLowerCase().includes(search.toLowerCase()) ||
        (asset.category_name && asset.category_name.toLowerCase().includes(search.toLowerCase()))
    );

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredAssets.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleCreateClick = () => {
        setSelectedAssetId(null);
        setShowAssetModal(true);
    };

    const handleEditClick = (id) => {
        setSelectedAssetId(id);
        setShowAssetModal(true);
    };

    const handleModalSuccess = (action) => {
        setToastMessage(`Asset ${action} successfully`);
        setShowToast(true);
        fetchAssets();
    };

    return (
        <div className="asset-list">
            <div className="page-header">
                <div>
                    <h1>Assets</h1>
                    <p>Manage your organization's assets</p>
                </div>
                {hasPermission('asset.items.create') && (
                    <button className="btn btn-primary" onClick={handleCreateClick}>
                        <FiPlus /> Add Asset
                    </button>
                )}
            </div>

            <div className="card">
                <div className="filters-bar">
                    <div className="search-form">
                        <div className="input-with-icon">
                            <FiSearch />
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Search by name, tag, or category..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="filter-group">
                        <FiFilter />
                        <select
                            className="form-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="available">Available</option>
                            <option value="assigned">Assigned</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="retired">Retired</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner" />
                        <p>Loading assets...</p>
                    </div>
                ) : filteredAssets.length === 0 ? (
                    <div className="empty-state">
                        <FiPackage />
                        <h3>No assets found</h3>
                        <p>Start by adding your first asset</p>
                        {hasPermission('asset.items.create') && (
                            <button
                                className="btn btn-primary"
                                onClick={handleCreateClick}
                            >
                                <FiPlus /> Add Asset
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="desktop-table">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Asset Tag</th>
                                        <th>Name</th>
                                        <th>Category</th>
                                        <th>Location</th>
                                        <th>Assigned To</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map((asset) => (
                                        <tr key={asset.id}>
                                            <td>
                                                <strong>{asset.asset_tag}</strong>
                                            </td>
                                            <td>{asset.asset_name}</td>
                                            <td>{asset.category_name || '-'}</td>
                                            <td>{asset.location_name || '-'}</td>
                                            <td>{asset.assigned_to_name || '-'}</td>
                                            <td>
                                                <span className={getStatusBadge(asset.status)}>
                                                    {asset.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    {hasPermission('asset.items.view') && (
                                                        <button
                                                            className="btn-icon"
                                                            title="View"
                                                            onClick={() => navigate(`/asset/items/${asset.id}`)}
                                                        >
                                                            <FiEye />
                                                        </button>
                                                    )}
                                                    {hasPermission('asset.items.edit') && (
                                                        <button
                                                            className="btn-icon"
                                                            title="Edit"
                                                            onClick={() => handleEditClick(asset.id)}
                                                        >
                                                            <FiEdit2 />
                                                        </button>
                                                    )}
                                                    {hasPermission('asset.items.delete') && (
                                                        <button
                                                            className="btn-icon btn-danger"
                                                            title="Delete"
                                                            onClick={() => handleDelete(asset.id, asset.asset_tag)}
                                                        >
                                                            <FiTrash2 />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile List View */}
                        <div className="mobile-list">
                            {currentItems.map((asset) => (
                                <div key={asset.id} className="mobile-list-item">
                                    <div className="mobile-list-main" onClick={() => toggleMobileItem(asset.id)}>
                                        <div className="mobile-asset-icon">
                                            <FiPackage />
                                            <span className={`status-dot ${asset.status === 'available' ? 'active' :
                                                asset.status === 'maintenance' ? 'warning' :
                                                    asset.status === 'assigned' ? 'primary' : 'danger'
                                                }`} />
                                        </div>
                                        <div className="mobile-asset-info">
                                            <div className="asset-primary-text">
                                                <span className="asset-tag">{asset.asset_tag}</span>
                                                <span className="category-badge-small">{asset.category_name || 'No Category'}</span>
                                            </div>
                                            <div className="asset-secondary-text">{asset.asset_name}</div>
                                        </div>
                                        <div className="mobile-expand-icon">
                                            <FiChevronDown className={expandedItemId === asset.id ? 'rotated' : ''} />
                                        </div>
                                    </div>

                                    {expandedItemId === asset.id && (
                                        <div className="mobile-list-details">
                                            <div className="detail-grid">
                                                <div className="detail-item">
                                                    <span className="label">Status</span>
                                                    <span className="value" style={{ textTransform: 'capitalize' }}>{asset.status}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="label">Type</span>
                                                    <span className="value">{asset.item_type_name || 'Asset'}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="label">Location</span>
                                                    <span className="value">{asset.location_name || '-'}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="label">Assigned To</span>
                                                    <span className="value">{asset.assigned_to_name || '-'}</span>
                                                </div>
                                            </div>

                                            <div className="mobile-actions">
                                                {hasPermission('asset.items.view') && (
                                                    <button
                                                        className="action-btn view"
                                                        onClick={() => navigate(`/asset/items/${asset.id}`)}
                                                    >
                                                        <FiEye /> View
                                                    </button>
                                                )}
                                                {hasPermission('asset.items.edit') && (
                                                    <button
                                                        className="action-btn edit"
                                                        onClick={() => handleEditClick(asset.id)}
                                                    >
                                                        <FiEdit2 /> Edit
                                                    </button>
                                                )}
                                                {hasPermission('asset.items.delete') && (
                                                    <button
                                                        className="action-btn delete"
                                                        onClick={() => handleDelete(asset.id, asset.asset_tag)}
                                                    >
                                                        <FiTrash2 /> Delete
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <Pagination
                            currentPage={currentPage}
                            totalItems={filteredAssets.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={paginate}
                            onItemsPerPageChange={setItemsPerPage}
                        />
                    </>
                )}
            </div>

            <AssetModal
                isOpen={showAssetModal}
                onClose={() => setShowAssetModal(false)}
                onSuccess={handleModalSuccess}
                assetId={selectedAssetId}
            />

            {showToast && (
                <Toast
                    message={toastMessage}
                    type="success"
                    onClose={() => setShowToast(false)}
                />
            )}

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="Delete Asset"
                message={`Are you sure you want to delete asset "${assetToDelete?.assetTag}"? This action cannot be undone.`}
                confirmText="Delete Asset"
                type="danger"
            />
        </div>
    );
};

export default AssetList;
