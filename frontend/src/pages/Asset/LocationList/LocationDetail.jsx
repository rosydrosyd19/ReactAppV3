import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from '../../../utils/axios';
import { useAuth } from '../../../contexts/AuthContext';
import {
    FiArrowLeft,
    FiEdit2,
    FiTrash2,
    FiBox,
    FiDollarSign,
    FiGrid,
    FiSearch,
    FiEye,
    FiMapPin
} from 'react-icons/fi';
import LocationModal from './LocationModal';
import ConfirmationModal from '../../../components/Modal/ConfirmationModal';
import Toast from '../../../components/Toast/Toast';
import '../../SysAdmin/UserDetail.css'; // Import shared detail styles
import './LocationDetail.css';

const LocationDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { hasPermission } = useAuth();

    // Data states
    const [locationData, setLocationData] = useState(null);
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        fetchLocationData();
    }, [id]);

    const fetchLocationData = async () => {
        try {
            setLoading(true);
            // Fetch location details
            const locRes = await axios.get(`/asset/locations/${id}`);
            if (!locRes.data.success) throw new Error('Failed to load location');
            setLocationData(locRes.data.data);

            // Fetch assets in this location
            const assetsRes = await axios.get(`/asset/assets`, {
                params: { location_id: id }
            });
            if (assetsRes.data.success) {
                setAssets(assetsRes.data.data);
            }
        } catch (err) {
            console.error('Error fetching detail:', err);
            setError(err.message || 'Error loading data');
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = () => {
        setShowEditModal(true);
    };

    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`/asset/locations/${id}`);
            setToastMessage('Location deleted successfully');
            setShowToast(true);
            setTimeout(() => {
                navigate('/asset/locations');
            }, 1000);
        } catch (error) {
            console.error('Error deleting location:', error);
            // Optionally show error toast
        } finally {
            setShowDeleteModal(false);
        }
    };

    const handleEditSuccess = () => {
        setToastMessage('Location updated successfully');
        setShowToast(true);
        fetchLocationData();
        setShowEditModal(false);
    };

    if (loading) return (
        <div className="user-detail">
            <div className="loading-container">
                <div className="loading-spinner" />
            </div>
        </div>
    );

    if (error || !locationData) return (
        <div className="user-detail">
            <div className="error-container">
                <h3>Error</h3>
                <p>{error || 'Location not found'}</p>
                <button className="btn btn-primary" onClick={() => navigate('/asset/locations')}>
                    <FiArrowLeft /> Back
                </button>
            </div>
        </div>
    );

    // Calculate total value
    const totalValue = assets.reduce((sum, asset) => sum + (Number(asset.purchase_cost) || 0), 0);

    return (
        <div className="user-detail location-detail-override">
            {/* Header */}
            <div className="page-header">
                <div className="header-left">
                    <button className="btn btn-outline" onClick={() => navigate('/asset/locations')}>
                        <FiArrowLeft /> <span>Back</span>
                    </button>
                    <div>
                        <h1>
                            <FiMapPin className="text-primary" style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                            {locationData.location_name}
                            <span className="location-code-badge" style={{ marginLeft: '10px', fontSize: '0.9rem', verticalAlign: 'middle' }}>{locationData.location_code}</span>
                        </h1>
                        <p>{[locationData.address, locationData.city, locationData.state, locationData.country].filter(Boolean).join(', ') || 'No address details'}</p>
                        {locationData.parent_location_name && (
                            <p style={{ fontSize: '13px', marginTop: '4px' }}>
                                Parent: <strong>{locationData.parent_location_name}</strong>
                            </p>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="header-actions">
                    <button className="btn btn-outline" onClick={handleEditClick}>
                        <FiEdit2 /> <span>Edit</span>
                    </button>
                    <button className="btn btn-danger" onClick={handleDeleteClick}>
                        <FiTrash2 /> <span>Delete</span>
                    </button>
                </div>
            </div>

            <div className="detail-content">
                {/* Stats Overview */}
                <div className="location-stats-grid">
                    <div className="location-stat-card">
                        <div className="location-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                            <FiBox />
                        </div>
                        <div className="location-stat-info">
                            <h3>Total Assets</h3>
                            <p>{assets.length}</p>
                        </div>
                    </div>

                    <div className="location-stat-card">
                        <div className="location-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                            <FiDollarSign />
                        </div>
                        <div className="location-stat-info">
                            <h3>Total Value</h3>
                            <p>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalValue)}</p>
                        </div>
                    </div>
                </div>

                {/* Assets List Table */}
                <div className="card">
                    <div className="card-header">
                        <h2><FiBox /> Assets in this Location</h2>
                    </div>
                    <div className="card-body">
                        <div className="table-responsive assets-table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Asset Tag</th>
                                        <th>Name</th>
                                        <th>Model</th>
                                        <th>Status</th>
                                        <th>Assigned To</th>
                                        <th>Cost</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assets.length > 0 ? (
                                        assets.map(asset => (
                                            <tr key={asset.id}>
                                                <td>
                                                    {asset.asset_tag}
                                                </td>
                                                <td>{asset.asset_name}</td>
                                                <td>{asset.model || '-'}</td>
                                                <td>
                                                    <span className={`status-badge ${asset.status}`}>
                                                        {asset.status}
                                                    </span>
                                                </td>
                                                <td>{asset.assigned_to_username || asset.assigned_to_asset_name || '-'}</td>
                                                <td>
                                                    {asset.purchase_cost
                                                        ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(asset.purchase_cost)
                                                        : '-'}
                                                </td>
                                                <td onClick={(e) => e.stopPropagation()}>
                                                    <div className="action-buttons">
                                                        <button
                                                            className="btn-icon"
                                                            title="View Details"
                                                            onClick={() => navigate(`/asset/items/${asset.id}`, { state: { from: location.pathname } })}
                                                        >
                                                            <FiEye />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                                <FiBox style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block', margin: '0 auto 0.5rem' }} />
                                                No assets found in this location
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Assets List */}
                        <div className="mobile-assets-list">
                            {assets.length > 0 ? (
                                assets.map(asset => (
                                    <div key={asset.id} className="mobile-asset-card" onClick={() => navigate(`/asset/items/${asset.id}`, { state: { from: location.pathname } })}>
                                        <div className="mobile-card-header">
                                            <div className="mobile-card-title">
                                                <span className="mobile-asset-tag">{asset.asset_tag}</span>
                                                <h3 className="mobile-asset-name">{asset.asset_name}</h3>
                                            </div>
                                            <span className={`status-badge ${asset.status}`}>
                                                {asset.status}
                                            </span>
                                        </div>
                                        <div className="mobile-card-body">
                                            <div className="mobile-info-row">
                                                <FiBox className="text-secondary" /> <span>{asset.model || '-'}</span>
                                            </div>
                                            <div className="mobile-info-row">
                                                <FiDollarSign className="text-secondary" />
                                                <span>
                                                    {asset.purchase_cost
                                                        ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(asset.purchase_cost)
                                                        : '-'}
                                                </span>
                                            </div>
                                            {asset.assigned_to_username && (
                                                <div className="mobile-info-row">
                                                    <FiArrowLeft className="text-secondary" /> <span>{asset.assigned_to_username}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="mobile-card-actions">
                                            <button
                                                className="btn btn-outline btn-sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/asset/items/${asset.id}`, { state: { from: location.pathname } });
                                                }}
                                            >
                                                <FiEye /> View Details
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">
                                    <FiBox />
                                    <p>No assets found in this location</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <LocationModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSuccess={handleEditSuccess}
                location={locationData}
            />

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="Delete Location"
                message={`Are you sure you want to delete "${locationData.location_name}"?`}
                confirmText="Delete"
                type="danger"
            />

            {showToast && (
                <Toast
                    message={toastMessage}
                    type="success"
                    onClose={() => setShowToast(false)}
                />
            )}
        </div>
    );
};

export default LocationDetail;
