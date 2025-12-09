import './UserDetail.css';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import { useAuth } from '../../contexts/AuthContext';
import EditUserModal from './EditUserModal';
import Toast from '../../components/Toast/Toast';
import {
    FiArrowLeft,
    FiUser,
    FiMail,
    FiPhone,
    FiShield,
    FiEdit2,
    FiTrash2,
    FiCheckCircle,
    FiXCircle
} from 'react-icons/fi';

const UserDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        fetchUserDetail();
    }, [id]);

    const fetchUserDetail = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/sysadmin/users/${id}`);
            if (response.data.success) {
                setUser(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching user detail:', error);
            setError('Failed to load user details');
        } finally {
            setLoading(false);
        }
    };

    const handleUserUpdated = () => {
        setToastMessage('User successfully updated!');
        setShowToast(true);
        fetchUserDetail();
    };

    const handleDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete user ${user.username}?`)) {
            return;
        }

        try {
            const response = await axios.delete(`/sysadmin/users/${id}`);
            if (response.data.success) {
                alert('User successfully deleted');
                navigate('/sysadmin/users');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert(error.response?.data?.message || 'Failed to delete user');
        }
    };

    if (loading) {
        return (
            <div className="user-detail">
                <div className="loading-container">
                    <div className="loading-spinner" />
                    <p>Loading user details...</p>
                </div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="user-detail">
                <div className="error-container">
                    <h3>Error</h3>
                    <p>{error || 'User not found'}</p>
                    <button className="btn btn-primary" onClick={() => navigate('/sysadmin/users')}>
                        <FiArrowLeft /> Back to Users
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="user-detail">
            <div className="page-header">
                <div className="header-left">
                    <button className="btn btn-outline" onClick={() => navigate('/sysadmin/users')}>
                        <FiArrowLeft /> <span>Back</span>
                    </button>
                    <div>
                        <h1>User Details</h1>
                        <p>View user information and permissions</p>
                    </div>
                </div>
                <div className="header-actions">
                    {hasPermission('sysadmin.users.edit') && (
                        <button className="btn btn-primary" onClick={() => setShowEditModal(true)}>
                            <FiEdit2 /> Edit
                        </button>
                    )}
                    {hasPermission('sysadmin.users.delete') && (
                        <button className="btn btn-danger" onClick={handleDelete}>
                            <FiTrash2 /> Delete
                        </button>
                    )}
                </div>
            </div>

            <div className="detail-content">
                {/* User Information Card */}
                <div className="card">
                    <div className="card-header">
                        <h2>User Information</h2>
                        <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                            {user.is_active ? (
                                <><FiCheckCircle /> Active</>
                            ) : (
                                <><FiXCircle /> Inactive</>
                            )}
                        </span>
                    </div>
                    <div className="card-body">
                        <div className="info-grid">
                            <div className="info-item">
                                <label><FiUser /> Username</label>
                                <p>{user.username}</p>
                            </div>
                            <div className="info-item">
                                <label><FiMail /> Email</label>
                                <p>{user.email}</p>
                            </div>
                            <div className="info-item">
                                <label><FiUser /> Full Name</label>
                                <p>{user.full_name || '-'}</p>
                            </div>
                            <div className="info-item">
                                <label><FiPhone /> Phone Number</label>
                                <p>{user.phone || '-'}</p>
                            </div>
                            <div className="info-item">
                                <label>Created At</label>
                                <p>{new Date(user.created_at).toLocaleString()}</p>
                            </div>
                            <div className="info-item">
                                <label>Last Updated</label>
                                <p>{user.updated_at ? new Date(user.updated_at).toLocaleString() : 'No changes yet'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Roles Card */}
                <div className="card">
                    <div className="card-header">
                        <h2><FiShield /> Assigned Roles</h2>
                    </div>
                    <div className="card-body">
                        {user.roles && user.roles.length > 0 ? (
                            <div className="roles-list">
                                {user.roles.map((role, idx) => (
                                    <div key={idx} className="role-card">
                                        <div className="role-info">
                                            <h3>{role.role_name}</h3>
                                            {role.description && <p>{role.description}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state-small">
                                <p>No roles assigned</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Direct Permissions Card */}
                {user.direct_permissions && user.direct_permissions.length > 0 && (
                    <div className="card">
                        <div className="card-header">
                            <h2>Direct Permissions</h2>
                        </div>
                        <div className="card-body">
                            <div className="permissions-list">
                                {user.direct_permissions.map((permission, idx) => (
                                    <span key={idx} className="permission-badge">
                                        {permission.permission_name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <EditUserModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSuccess={handleUserUpdated}
                userId={id}
            />

            {
                showToast && (
                    <Toast
                        message={toastMessage}
                        type="success"
                        onClose={() => setShowToast(false)}
                    />
                )
            }
        </div >
    );
};

export default UserDetail;
