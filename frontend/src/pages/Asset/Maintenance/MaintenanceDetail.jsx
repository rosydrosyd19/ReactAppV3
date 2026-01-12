import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import '../../SysAdmin/UserDetail.css';
import '../AssetDetail/AssetDetail.css';
import './MaintenanceDetail.css';
import axios from '../../../utils/axios';
import { FiArrowLeft, FiTool, FiCalendar, FiDollarSign, FiUser, FiInfo, FiEdit2, FiClock, FiEye, FiImage, FiTrash2 } from 'react-icons/fi';
import MaintenanceModal from './MaintenanceModal';
import ConfirmationModal from '../../../components/Modal/ConfirmationModal';
import Toast from '../../../components/Toast/Toast';

const MaintenanceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [maintenance, setMaintenance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });

    const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/api$/, '');

    const fetchMaintenanceDetail = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/asset/maintenance/${id}`);
            if (res.data.success) {
                setMaintenance(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching maintenance details:', err);
            setError('Failed to load maintenance details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMaintenanceDetail();
    }, [id]);

    const handleEditSuccess = () => {
        setToast({ show: true, message: 'Maintenance record updated successfully', type: 'success' });
        fetchMaintenanceDetail();
    };

    const handleDelete = async () => {
        try {
            const res = await axios.delete(`/asset/maintenance/${id}`);
            if (res.data.success) {
                navigate('/asset/maintenance', { state: { message: 'Maintenance record deleted successfully' } });
            }
        } catch (err) {
            console.error('Error deleting maintenance record:', err);
            setToast({ show: true, message: 'Failed to delete maintenance record', type: 'error' });
            setShowDeleteModal(false);
        }
    };

    if (loading) {
        return (
            <div className="user-detail">
                <div className="loading-container">
                    <div className="loading-spinner" />
                    <p>Loading maintenance details...</p>
                </div>
            </div>
        );
    }

    if (error || !maintenance) {
        return (
            <div className="user-detail">
                <div className="error-container">
                    <h3>Error</h3>
                    <p>{error || 'Maintenance record not found'}</p>
                    <button className="btn btn-primary" onClick={() => navigate('/asset/maintenance')}>
                        <FiArrowLeft /> Back to List
                    </button>
                </div>
            </div>
        );
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'scheduled': return <span className="badge badge-warning">Scheduled</span>;
            case 'requests': return <span className="badge badge-info">Requests</span>;
            case 'in_progress': return <span className="badge badge-primary">In Progress</span>;
            case 'completed': return <span className="badge badge-success">Completed</span>;
            default: return <span className="badge">{status}</span>;
        }
    };

    return (
        <div className="user-detail asset-detail-override maintenance-detail-override">
            <div className="page-header">
                <div className="header-left">
                    <button className="btn btn-outline" onClick={() => navigate('/asset/maintenance')}>
                        <FiArrowLeft /> <span>Back</span>
                    </button>
                    <div>
                        <h1>Maintenance Details</h1>
                        <p>View maintenance record information</p>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn btn-outline" onClick={() => setShowEditModal(true)}>
                        <FiEdit2 /> <span>Edit</span>
                    </button>
                    <button className="btn btn-danger" onClick={() => setShowDeleteModal(true)}>
                        <FiTrash2 /> <span>Delete</span>
                    </button>
                </div>
            </div>

            <div className="detail-content">
                <div className="card">
                    <div className="card-header">
                        <h2><FiTool /> Maintenance Information</h2>
                        {getStatusBadge(maintenance.status)}
                    </div>
                    <div className="card-body">
                        <div className="info-grid">
                            <div className="info-item">
                                <label><FiTool /> Ticket Number</label>
                                <p>{maintenance.ticket_number || '-'}</p>
                            </div>
                            <div className="info-item">
                                <label><FiTool /> Maintenance Type</label>
                                <p style={{ textTransform: 'capitalize' }}>{maintenance.maintenance_type}</p>
                            </div>
                            <div className="info-item">
                                <label><FiCalendar /> Date</label>
                                <p>{new Date(maintenance.maintenance_date).toLocaleDateString()}</p>
                            </div>
                            <div className="info-item">
                                <label><FiUser /> Performed By</label>
                                <p>{maintenance.performed_by || '-'}</p>
                            </div>
                            <div className="info-item">
                                <label><FiDollarSign /> Cost</label>
                                <p>{maintenance.cost ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(maintenance.cost) : '-'}</p>
                            </div>
                            <div className="info-item">
                                <label><FiClock /> Next Maintenance</label>
                                <p>{maintenance.next_maintenance_date ? new Date(maintenance.next_maintenance_date).toLocaleDateString() : '-'}</p>
                            </div>
                            <div className="info-item">
                                <label><FiUser /> Created By</label>
                                <p>{maintenance.created_by_username || 'System'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Unified Images Section */}
                {(maintenance.request_image_url || (maintenance.images && maintenance.images.length > 0)) && (
                    <div className="card">
                        <div className="card-header">
                            <h2><FiImage /> Documentation & Images</h2>
                        </div>
                        <div className="card-body">
                            {/* Request Image Section */}
                            {maintenance.request_image_url && (
                                <div style={{ marginBottom: (maintenance.images && maintenance.images.length > 0) ? '24px' : '0' }}>
                                    <h4 style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reported Issue Image</h4>
                                    <div className="image-container" style={{ maxWidth: '100%', overflow: 'hidden', borderRadius: '8px' }}>
                                        <img
                                            src={`${BASE_URL}${maintenance.request_image_url}`}
                                            alt="Maintenance Request"
                                            style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain', cursor: 'pointer' }}
                                            onClick={() => window.open(`${BASE_URL}${maintenance.request_image_url}`, '_blank')}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Maintenance Images Grid */}
                            {maintenance.images && maintenance.images.length > 0 && (
                                <div>
                                    {maintenance.request_image_url && (
                                        <h4 style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Maintenance Work Images</h4>
                                    )}
                                    <div className="image-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                                        {maintenance.images.map((img, index) => (
                                            <div key={img.id || index} className="image-item" style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', position: 'relative', paddingTop: '75%' }}>
                                                <img
                                                    src={`${BASE_URL}${img.image_url}`}
                                                    alt={`Maintenance Image ${index + 1}`}
                                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                                                    onClick={() => window.open(`${BASE_URL}${img.image_url}`, '_blank')}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="card">
                    <div className="card-header">
                        <h2><FiInfo /> Description</h2>
                    </div>
                    <div className="card-body">
                        <p>{maintenance.description || 'No description provided.'}</p>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h2>Asset Information</h2>
                    </div>
                    <div className="card-body">
                        <div className="info-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                            <div className="info-item">
                                <label>Asset Tag</label>
                                <p>{maintenance.asset_tag}</p>
                            </div>
                            <div className="info-item">
                                <label>Asset Name</label>
                                <p>{maintenance.asset_name}</p>
                            </div>
                            <div className="info-item">
                                <label>Actions</label>
                                <button
                                    className="btn-icon"
                                    onClick={() => navigate(`/asset/items/${maintenance.asset_id}`, { state: { from: location.pathname } })}
                                    title="View Asset Details"
                                    style={{ fontSize: '1rem' }}
                                >
                                    <FiEye />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <MaintenanceModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSuccess={handleEditSuccess}
                maintenance={maintenance}
            />

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Maintenance Record"
                message="Are you sure you want to delete this maintenance record? This action cannot be undone."
                confirmText="Delete"
                confirmType="danger"
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

export default MaintenanceDetail;
