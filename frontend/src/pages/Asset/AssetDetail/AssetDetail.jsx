import './AssetDetail.css';
import '../../SysAdmin/UserDetail.css'; // Import UserDetail styles to ensure exact match
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../../utils/axios';
import { useAuth } from '../../../contexts/AuthContext';
import AssetModal from '../AssetList/AssetModal'; // Reusing existing modal
import ConfirmationModal from '../../../components/Modal/ConfirmationModal';
import Toast from '../../../components/Toast/Toast';
import CheckOutModal from '../AssetList/CheckOutModal';
import CheckInModal from '../AssetList/CheckInModal';
import {
    FiArrowLeft,
    FiPackage,
    FiMapPin,
    FiUser,
    FiTag,
    FiCalendar,
    FiDollarSign,
    FiTool,
    FiEdit2,
    FiTrash2,
    FiCheckCircle,
    FiXCircle,
    FiAlertCircle,
    FiInfo,
    FiImage,
    FiLogOut,
    FiLogIn,
    FiClock
} from 'react-icons/fi';

const AssetDetail = ({ readOnly = false }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hasPermission, isAuthenticated } = useAuth();
    const [asset, setAsset] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showCheckOutModal, setShowCheckOutModal] = useState(false);
    const [showCheckInModal, setShowCheckInModal] = useState(false);

    useEffect(() => {
        fetchAssetDetail();
    }, [id, isAuthenticated]);

    const fetchAssetDetail = async () => {
        try {
            setLoading(true);
            // If logged in, use the authenticated endpoint even for scan route to get full details/history if needed
            // If guest (readOnly true AND not authenticated), use public endpoint
            const endpoint = (readOnly && !isAuthenticated) ? `/asset/public/${id}` : `/asset/assets/${id}`;
            const response = await axios.get(endpoint);
            if (response.data.success) {
                setAsset(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching asset detail:', error);
            setError('Failed to load asset details');
        } finally {
            setLoading(false);
        }
    };

    const handleAssetUpdated = (action) => {
        setToastMessage(`Asset ${action} successfully!`);
        setShowToast(true);
        fetchAssetDetail();
        setShowEditModal(false);
    };

    const handleTransactionSuccess = () => {
        setToastMessage('Asset status updated successfully!');
        setShowToast(true);
        fetchAssetDetail();
        fetchAssetDetail(); // Refresh data
    };

    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            const response = await axios.delete(`/asset/assets/${id}`);
            if (response.data.success) {
                navigate('/asset/items');
            }
        } catch (error) {
            console.error('Error deleting asset:', error);
            alert('Failed to delete asset');
        } finally {
            setShowDeleteModal(false);
        }
    };

    if (loading) {
        return (
            <div className="user-detail"> {/* Use user-detail class for loading state too */}
                <div className="loading-container">
                    <div className="loading-spinner" />
                    <p>Loading asset details...</p>
                </div>
            </div>
        );
    }

    if (error || !asset) {
        return (
            <div className="user-detail">
                <div className="error-container">
                    <h3>Error</h3>
                    <p>{error || 'Asset not found'}</p>
                    <button className="btn btn-primary" onClick={() => navigate('/asset/items')}>
                        <FiArrowLeft /> Back to Assets
                    </button>
                </div>
            </div>
        );
    }

    // Determine if actions should be shown:
    // Show if it is NOT readOnly (normal view) OR if it IS readOnly (scan view) but user IS authenticated
    const showActions = !readOnly || isAuthenticated;

    return (
        <div className="user-detail asset-detail-override"> {/* Adopt user-detail styles */}
            <div className="page-header">
                <div className="header-left">
                    <button className="btn btn-outline" onClick={() => navigate(readOnly && !isAuthenticated ? '/login' : '/asset/items')}>
                        <FiArrowLeft /> <span>{readOnly && !isAuthenticated ? 'Login' : 'Back'}</span>
                    </button>
                    <div>
                        <h1>Asset Details</h1>
                        <p>View asset information and history</p>
                    </div>
                </div>
                <div className="header-actions">
                    {/* Show Login button for guests in read-only mode */}
                    {readOnly && !isAuthenticated && (
                        <button className="btn btn-primary btn-login-guest" onClick={() => navigate('/login')} title="Login">
                            <FiUser /> <span>Login</span>
                        </button>
                    )}

                    {showActions && (
                        <>
                            {/* Check In/Out Buttons */}
                            {asset.status === 'available' && hasPermission('asset.items.checkout') && (
                                <button className="btn btn-primary" onClick={() => setShowCheckOutModal(true)} title="Check Out">
                                    <FiLogOut /> <span>Check Out</span>
                                </button>
                            )}
                            {asset.status === 'assigned' && hasPermission('asset.items.checkin') && (
                                <button className="btn btn-warning" onClick={() => setShowCheckInModal(true)} title="Check In">
                                    <FiLogIn /> <span>Check In</span>
                                </button>
                            )}

                            {hasPermission('asset.items.edit') && (
                                <button className="btn btn-outline" onClick={() => setShowEditModal(true)} title="Edit">
                                    <FiEdit2 /> <span>Edit</span>
                                </button>
                            )}
                            {hasPermission('asset.items.delete') && (
                                <button className="btn btn-danger" onClick={handleDeleteClick} title="Delete">
                                    <FiTrash2 /> <span>Delete</span>
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="detail-content">
                {/* Asset Image Section */}
                <div className="card">
                    <div className="card-header">
                        <h2><FiImage /> Asset Image</h2>
                    </div>
                    <div className="card-body">
                        <div className="image-container">
                            {asset.image_url ? (
                                <img src={asset.image_url} alt={asset.asset_name} className="asset-image" />
                            ) : (
                                <div className="placeholder-image">
                                    <FiPackage />
                                    <span>No image available</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Asset Information Card */}
                <div className="card">
                    <div className="card-header">
                        <h2>Asset Information</h2>
                        <span className={`status-badge ${asset.status}`}>
                            {asset.status === 'available' && <FiCheckCircle />}
                            {asset.status === 'assigned' && <FiUser />}
                            {asset.status === 'maintenance' && <FiTool />}
                            {(asset.status === 'retired' || asset.status === 'lost') && <FiXCircle />}
                            {asset.status}
                        </span>
                    </div>
                    <div className="card-body">
                        <div className="info-grid">
                            <div className="info-item">
                                <label><FiTag /> Asset Tag</label>
                                <p>{asset.asset_tag}</p>
                            </div>
                            <div className="info-item">
                                <label><FiPackage /> Asset Name</label>
                                <p>{asset.asset_name}</p>
                            </div>
                            <div className="info-item">
                                <label><FiPackage /> Category</label>
                                <p>{asset.category_name || '-'}</p>
                            </div>
                            <div className="info-item">
                                <label><FiMapPin /> Location</label>
                                <p>{asset.location_name || '-'}</p>
                            </div>
                            <div className="info-item">
                                <label><FiTool /> Manufacturer</label>
                                <p>{asset.manufacturer || '-'}</p>
                            </div>
                            <div className="info-item">
                                <label><FiTool /> Model</label>
                                <p>{asset.model || '-'}</p>
                            </div>
                            <div className="info-item">
                                <label><FiTag /> Serial Number</label>
                                <p>{asset.serial_number || '-'}</p>
                            </div>
                            <div className="info-item">
                                <label><FiUser /> Assigned To</label>
                                <p>
                                    {asset.assigned_to_name ? (
                                        <span><FiUser style={{ marginRight: '4px' }} /> {asset.assigned_to_name}</span>
                                    ) : asset.assigned_to_asset_name ? (
                                        <span
                                            onClick={() => navigate(`/asset/items/${asset.assigned_to_asset_id}`)}
                                            style={{ cursor: 'pointer', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        >
                                            <FiPackage /> {asset.assigned_to_asset_name}
                                        </span>
                                    ) : '-'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Purchase & Warranty Card */}
                <div className="card">
                    <div className="card-header">
                        <h2><FiDollarSign /> Purchase & Warranty</h2>
                    </div>
                    <div className="card-body">
                        <div className="info-grid">
                            <div className="info-item">
                                <label><FiCalendar /> Purchase Date</label>
                                <p>{asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : '-'}</p>
                            </div>
                            <div className="info-item">
                                <label><FiDollarSign /> Purchase Cost</label>
                                <p>{asset.purchase_cost ? `Rp ${Number(asset.purchase_cost).toLocaleString()}` : '-'}</p>
                            </div>
                            <div className="info-item">
                                <label><FiUser /> Supplier</label>
                                <p>{asset.supplier_name || '-'}</p>
                            </div>
                            <div className="info-item">
                                <label><FiCalendar /> Warranty Expiry</label>
                                <p>{asset.warranty_expiry ? new Date(asset.warranty_expiry).toLocaleDateString() : '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes Card */}
                {asset.notes && (
                    <div className="card">
                        <div className="card-header">
                            <h2><FiEdit2 /> Notes</h2>
                        </div>
                        <div className="card-body">
                            <p>{asset.notes}</p>
                        </div>
                    </div>
                )}

                {/* System Information Card */}
                <div className="card">
                    <div className="card-header">
                        <h2><FiClock /> System Information</h2>
                    </div>
                    <div className="card-body">
                        <div className="info-grid">
                            <div className="info-item">
                                <label><FiClock /> Created At</label>
                                <p>
                                    {asset.created_at ? new Date(asset.created_at).toLocaleString() : '-'}
                                    {asset.created_by_username && <span className="text-muted"> by {asset.created_by_username}</span>}
                                </p>
                            </div>
                            <div className="info-item">
                                <label><FiClock /> Last Updated</label>
                                <p>
                                    {asset.updated_at && asset.created_at && new Date(asset.updated_at).getTime() > new Date(asset.created_at).getTime()
                                        ? new Date(asset.updated_at).toLocaleString()
                                        : 'No changes yet'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            <AssetModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSuccess={() => handleAssetUpdated('updated')}
                assetId={id}
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
                message={`Are you sure you want to delete asset "${asset.asset_name}"? This action cannot be undone.`}
                confirmText="Delete Asset"
                type="danger"
            />

            <CheckOutModal
                isOpen={showCheckOutModal}
                onClose={() => setShowCheckOutModal(false)}
                onSuccess={handleTransactionSuccess}
                assetId={id}
                assetName={asset.asset_name}
            />

            <CheckInModal
                isOpen={showCheckInModal}
                onClose={() => setShowCheckInModal(false)}
                onSuccess={handleTransactionSuccess}
                assetId={id}
                assetName={asset.asset_name}
            />
        </div>
    );
};

export default AssetDetail;
