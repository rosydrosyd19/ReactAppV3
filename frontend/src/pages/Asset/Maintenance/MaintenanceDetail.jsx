import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from '../../../utils/axios';
import { FiArrowLeft, FiTool, FiCalendar, FiDollarSign, FiUser, FiInfo, FiEdit2, FiClock, FiEye } from 'react-icons/fi';
import MaintenanceModal from './MaintenanceModal';
import Toast from '../../../components/Toast/Toast';

const MaintenanceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [maintenance, setMaintenance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });

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
            case 'in_progress': return <span className="badge badge-primary">In Progress</span>;
            case 'completed': return <span className="badge badge-success">Completed</span>;
            default: return <span className="badge">{status}</span>;
        }
    };

    return (
        <div className="user-detail">
            <div className="page-header">
                <div className="header-left">
                    <button className="btn btn-outline" onClick={() => navigate('/asset/maintenance')}>
                        <FiArrowLeft /> Back
                    </button>
                    <div>
                        <h1>Maintenance Details</h1>
                        <p>View maintenance record information</p>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn btn-outline" onClick={() => setShowEditModal(true)}>
                        <FiEdit2 /> Edit
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
                                    style={{ fontSize: '1rem', color: '#fff' }}
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
