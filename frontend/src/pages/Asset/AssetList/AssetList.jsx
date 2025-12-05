import './AssetList.css';
import { useState, useEffect } from 'react';
import axios from '../../../utils/axios';
import { useAuth } from '../../../contexts/AuthContext';
import {
    FiPlus,
    FiSearch,
    FiFilter,
    FiEdit2,
    FiTrash2,
    FiEye,
    FiPackage
} from 'react-icons/fi';

const AssetList = () => {
    const { hasPermission } = useAuth();
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        fetchAssets();
    }, [statusFilter]);

    const fetchAssets = async () => {
        try {
            setLoading(true);
            const params = {};
            if (statusFilter) params.status = statusFilter;
            if (search) params.search = search;

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

    const handleSearch = (e) => {
        e.preventDefault();
        fetchAssets();
    };

    const handleDelete = async (id, assetTag) => {
        if (!window.confirm(`Are you sure you want to delete asset ${assetTag}?`)) {
            return;
        }

        try {
            const response = await axios.delete(`/asset/assets/${id}`);
            if (response.data.success) {
                alert('Asset deleted successfully');
                fetchAssets();
            }
        } catch (error) {
            console.error('Error deleting asset:', error);
            alert('Failed to delete asset');
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

    return (
        <div className="asset-list">
            <div className="page-header">
                <div>
                    <h1>Assets</h1>
                    <p>Manage your organization's assets</p>
                </div>
                {hasPermission('asset.items.create') && (
                    <button className="btn btn-primary">
                        <FiPlus /> Add Asset
                    </button>
                )}
            </div>

            <div className="card">
                <div className="filters-bar">
                    <form onSubmit={handleSearch} className="search-form">
                        <div className="input-with-icon">
                            <FiSearch />
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Search by name, tag, or serial number..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary">Search</button>
                    </form>

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
                ) : assets.length === 0 ? (
                    <div className="empty-state">
                        <FiPackage />
                        <h3>No assets found</h3>
                        <p>Start by adding your first asset</p>
                        {hasPermission('asset.items.create') && (
                            <button className="btn btn-primary">
                                <FiPlus /> Add Asset
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="table-container">
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
                                {assets.map((asset) => (
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
                                                    <button className="btn-icon" title="View">
                                                        <FiEye />
                                                    </button>
                                                )}
                                                {hasPermission('asset.items.edit') && (
                                                    <button className="btn-icon" title="Edit">
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
                )}
            </div>
        </div>
    );
};

export default AssetList;
