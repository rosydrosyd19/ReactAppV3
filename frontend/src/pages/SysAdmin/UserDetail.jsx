import './UserDetail.css';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import { useAuth } from '../../contexts/AuthContext';
import EditUserModal from './EditUserModal';
import ConfirmationModal from '../../components/Modal/ConfirmationModal';
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
    FiXCircle,
    FiClock,
    FiPackage,
    FiEye
} from 'react-icons/fi';

const UserDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
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

    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            const response = await axios.delete(`/sysadmin/users/${id}`);
            if (response.data.success) {
                // Not using internal alert, just navigate
                navigate('/sysadmin/users');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert(error.response?.data?.message || 'Failed to delete user'); // Keep native alert for error for now or use Toast? Native is fine for error.
            setShowDeleteModal(false);
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
                        <button className="btn btn-primary" onClick={() => setShowEditModal(true)} title="Edit">
                            <FiEdit2 /> <span>Edit</span>
                        </button>
                    )}
                    {hasPermission('sysadmin.users.delete') && (
                        <button className="btn btn-danger" onClick={handleDeleteClick} title="Delete">
                            <FiTrash2 /> <span>Delete</span>
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

                {/* Assigned Assets Card */}
                <div className="card">
                    <div className="card-header">
                        <h2><FiPackage /> Assigned Assets</h2>
                    </div>
                    <div className="card-body">
                        {user.assigned_assets && user.assigned_assets.length > 0 ? (
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Asset Tag</th>
                                            <th>Asset Name</th>
                                            <th>Category</th>
                                            <th>Location</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {user.assigned_assets.map(asset => (
                                            <tr key={asset.id}>
                                                <td>{asset.asset_tag}</td>
                                                <td>{asset.asset_name}</td>
                                                <td>{asset.category_name}</td>
                                                <td>{asset.location_name || '-'}</td>
                                                <td>
                                                    <button
                                                        className="btn-icon"
                                                        onClick={() => navigate(`/asset/items/${asset.id}`, { state: { from: `/sysadmin/users/${id}` } })}
                                                        title="View Asset Detail"
                                                    >
                                                        <FiEye />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-state-small">
                                <p>No assets assigned to this user</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* System Information Card */}
                <div className="card">
                    <div className="card-header">
                        <h2><FiClock /> System Information</h2>
                    </div>
                    <div className="card-body">
                        <div className="info-grid">
                            <div className="info-item">
                                <label><FiClock /> Created At</label>
                                <p>{user.created_at ? new Date(user.created_at).toLocaleString() : '-'}</p>
                            </div>
                            <div className="info-item">
                                <label><FiClock /> Last Updated</label>
                                <p>{user.updated_at ? new Date(user.updated_at).toLocaleString() : 'No changes yet'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <EditUserModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSuccess={handleUserUpdated}
                userId={id}
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
                title="Delete User"
                message={`Are you sure you want to delete user "${user?.username}"? This action cannot be undone.`}
                confirmText="Delete User"
                type="danger"
            />
        </div>
    );
};

export default UserDetail;
