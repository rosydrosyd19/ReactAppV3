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
    FiEye,
    FiTruck,
    FiPhone,
    FiMail,
    FiGlobe
} from 'react-icons/fi';
import SupplierModal from './SupplierModal';
import ConfirmationModal from '../../../components/Modal/ConfirmationModal';
import Toast from '../../../components/Toast/Toast';
import '../../SysAdmin/UserDetail.css'; // Import shared detail styles
import './SupplierDetail.css';

const SupplierDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { hasPermission } = useAuth();

    // Data states
    const [supplierData, setSupplierData] = useState(null);
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        fetchSupplierData();
    }, [id]);

    const fetchSupplierData = async () => {
        try {
            setLoading(true);
            // Fetch supplier details - finding from list first or adding endpoint?
            // Usually we have GET /asset/suppliers/:id. Let's assume it exists or use list filtering if not?
            // The list uses GET /asset/suppliers. Backend might not have detail endpoint yet.
            // Let's check if GET /asset/suppliers/:id exists. If not, we fetch all and find.
            // Based on routes/asset.js I saw earlier, there was GET /suppliers, POST, PUT, DELETE.
            // I probably need to add GET /suppliers/:id to backend if it's missing, OR just filter from list.
            // Filtering from list is safer if I'm not sure about backend changes.
            // But efficient way is ID. Let's try to query with ID.

            // Actually, let's verify backend routes first or assume I can add it.
            // The backend I viewed earlier had:
            // router.get('/suppliers', ...)
            // router.post('/suppliers', ...)
            // router.put('/suppliers/:id', ...)
            // router.delete('/suppliers/:id', ...)
            // It MISSING GET /suppliers/:id.

            // I will implement GET /suppliers/:id on backend as well.
            const supRes = await axios.get(`/asset/suppliers/${id}`);
            if (!supRes.data.success) throw new Error('Failed to load supplier');
            setSupplierData(supRes.data.data);

            // Fetch assets supplied by this supplier
            const assetsRes = await axios.get(`/asset/assets`, {
                params: { supplier_id: id }
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
            await axios.delete(`/asset/suppliers/${id}`);
            setToastMessage('Supplier deleted successfully');
            setShowToast(true);
            setTimeout(() => {
                navigate('/asset/suppliers');
            }, 1000);
        } catch (error) {
            console.error('Error deleting supplier:', error);
        } finally {
            setShowDeleteModal(false);
        }
    };

    const handleEditSuccess = () => {
        setToastMessage('Supplier updated successfully');
        setShowToast(true);
        fetchSupplierData();
        setShowEditModal(false);
    };

    if (loading) return (
        <div className="user-detail">
            <div className="loading-container">
                <div className="loading-spinner" />
            </div>
        </div>
    );

    if (error || !supplierData) return (
        <div className="user-detail">
            <div className="error-container">
                <h3>Error</h3>
                <p>{error || 'Supplier not found'}</p>
                <button className="btn btn-primary" onClick={() => navigate('/asset/suppliers')}>
                    <FiArrowLeft /> Back
                </button>
            </div>
        </div>
    );

    // Calculate total value of supplied assets
    const totalValue = assets.reduce((sum, asset) => sum + (Number(asset.purchase_cost) || 0), 0);

    return (
        <div className="user-detail supplier-detail-override">
            {/* Header */}
            <div className="page-header">
                <div className="header-left">
                    <button className="btn btn-outline" onClick={() => navigate('/asset/suppliers')}>
                        <FiArrowLeft /> <span>Back</span>
                    </button>
                    <div>
                        <h1>
                            <FiTruck className="text-primary" style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                            {supplierData.supplier_name}
                        </h1>
                        <p>
                            {[
                                supplierData.contact_person,
                                supplierData.city
                            ].filter(Boolean).join(' • ') || 'Supplier Details'}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="header-actions">
                    {hasPermission('asset.suppliers.manage') && (
                        <>
                            <button className="btn btn-outline" onClick={handleEditClick}>
                                <FiEdit2 /> <span>Edit</span>
                            </button>
                            <button className="btn btn-danger" onClick={handleDeleteClick}>
                                <FiTrash2 /> <span>Delete</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="detail-content">
                {/* Contact Info Cards */}
                <div className="supplier-stats-grid">
                    <div className="supplier-stat-card">
                        <div className="supplier-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                            <FiBox />
                        </div>
                        <div className="supplier-stat-info">
                            <h3>Assets Supplied</h3>
                            <p>{assets.length}</p>
                        </div>
                    </div>

                    <div className="supplier-stat-card">
                        <div className="supplier-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                            <FiDollarSign />
                        </div>
                        <div className="supplier-stat-info">
                            <h3>Total Value</h3>
                            <p>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalValue)}</p>
                        </div>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <div className="card-header">
                        <h2>Contact Information</h2>
                    </div>
                    <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                        <div>
                            <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Contact Person</label>
                            <div style={{ fontWeight: '500' }}>{supplierData.contact_person || '-'}</div>
                        </div>
                        <div>
                            <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Email</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FiMail className="text-secondary" />
                                {supplierData.email ? <a href={`mailto:${supplierData.email}`} style={{ color: 'var(--primary-color)' }}>{supplierData.email}</a> : '-'}
                            </div>
                        </div>
                        <div>
                            <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Phone</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FiPhone className="text-secondary" />
                                {supplierData.phone || '-'}
                            </div>
                        </div>
                        <div>
                            <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Website</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FiGlobe className="text-secondary" />
                                {supplierData.website ? <a href={supplierData.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)' }}>{supplierData.website}</a> : '-'}
                            </div>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Address</label>
                            <div>{supplierData.address || '-'}</div>
                        </div>
                        {supplierData.notes && (
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Notes</label>
                                <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{supplierData.notes}</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Assets List Table */}
                <div className="card">
                    <div className="card-header">
                        <h2><FiBox /> Supplied Assets</h2>
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
                                        <th>Location</th>
                                        <th>Cost</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assets.length > 0 ? (
                                        assets.map(asset => (
                                            <tr key={asset.id}>
                                                <td>{asset.asset_tag}</td>
                                                <td>{asset.asset_name}</td>
                                                <td>{asset.model || '-'}</td>
                                                <td>
                                                    <span className={`status-badge ${asset.status}`}>
                                                        {asset.status}
                                                    </span>
                                                </td>
                                                <td>{asset.location_name || '-'}</td>
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
                                                No assets found for this supplier
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
                                            {asset.location_name && (
                                                <div className="mobile-info-row">
                                                    <FiArrowLeft className="text-secondary" /> <span>{asset.location_name}</span>
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
                                    <p>No assets found for this supplier</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <SupplierModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSuccess={handleEditSuccess}
                supplier={supplierData}
            />

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="Delete Supplier"
                message={`Are you sure you want to delete "${supplierData.supplier_name}"?`}
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

export default SupplierDetail;
