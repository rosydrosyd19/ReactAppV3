import './UserList.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import { useAuth } from '../../contexts/AuthContext';
import AddUserModal from './AddUserModal';
import Toast from '../../components/Toast/Toast';
import {
    FiPlus,
    FiSearch,
    FiEdit2,
    FiTrash2,
    FiUser,
    FiMail,
    FiShield,
    FiEye,
    FiChevronDown
} from 'react-icons/fi';

const UserList = () => {
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [expandedUserId, setExpandedUserId] = useState(null);

    const toggleMobileItem = (id) => {
        setExpandedUserId(expandedUserId === id ? null : id);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/sysadmin/users');
            if (response.data.success) {
                setUsers(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, username) => {
        if (!window.confirm(`Are you sure you want to delete user ${username}?`)) {
            return;
        }

        try {
            const response = await axios.delete(`/sysadmin/users/${id}`);
            if (response.data.success) {
                alert('User successfully deleted');
                fetchUsers();
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert(error.response?.data?.message || 'Failed to delete user');
        }
    };

    const handleUserAdded = () => {
        // Tampilkan toast notification
        setToastMessage('User successfully added!');
        setShowToast(true);

        // Refresh data
        fetchUsers();
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(search.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="user-list">
            <div className="page-header">
                <div>
                    <h1>Users</h1>
                    <p>Manage User Systems</p>
                </div>
                {hasPermission('sysadmin.users.create') && (
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                        <FiPlus /> Add User
                    </button>
                )}
            </div>

            <div className="card">
                <div className="search-section">
                    <div className="input-with-icon">
                        <FiSearch />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search for name, username, or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner" />
                        <p>Loading data...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="empty-state">
                        <FiUser />
                        <h3>No users</h3>
                        <p>Start by adding your first user</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="desktop-table">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Username</th>
                                        <th>Full Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id}>
                                            <td><strong>{user.username}</strong></td>
                                            <td>{user.full_name || '-'}</td>
                                            <td>{user.email}</td>
                                            <td>
                                                {user.roles ? user.roles.split(',').map((role, idx) => (
                                                    <span key={idx} className="badge badge-primary" style={{ marginRight: '4px' }}>
                                                        {role.trim()}
                                                    </span>
                                                )) : '-'}
                                            </td>
                                            <td>
                                                <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    {hasPermission('sysadmin.users.view') && (
                                                        <button
                                                            className="btn-icon btn-info"
                                                            title="View"
                                                            onClick={() => navigate(`/sysadmin/users/${user.id}`)}
                                                        >
                                                            <FiEye />
                                                        </button>
                                                    )}
                                                    {hasPermission('sysadmin.users.edit') && (
                                                        <button className="btn-icon" title="Edit" onClick={() => alert('Edit feature coming soon')}>
                                                            <FiEdit2 />
                                                        </button>
                                                    )}
                                                    {hasPermission('sysadmin.users.delete') && (
                                                        <button
                                                            className="btn-icon btn-danger"
                                                            title="Delete"
                                                            onClick={() => handleDelete(user.id, user.username)}
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

                        {/* Mobile List View - Cleaner & More User Friendly */}
                        <div className="mobile-list">
                            {filteredUsers.map((user) => (
                                <div key={user.id} className="mobile-list-item">
                                    <div className="mobile-list-main" onClick={() => toggleMobileItem(user.id)}>
                                        <div className="mobile-user-avatar">
                                            <span className="avatar-letter">{user.username.charAt(0).toUpperCase()}</span>
                                            <span className={`status-dot ${user.is_active ? 'active' : 'inactive'}`} />
                                        </div>
                                        <div className="mobile-user-info">
                                            <div className="user-primary-text">
                                                <span className="username">{user.username}</span>
                                                {user.roles && (
                                                    <span className="role-badge-small">
                                                        {user.roles.split(',')[0]}
                                                        {user.roles.split(',').length > 1 && '+'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="user-secondary-text">{user.full_name || user.email}</div>
                                        </div>
                                        <div className="mobile-expand-icon">
                                            <FiChevronDown className={expandedUserId === user.id ? 'rotated' : ''} />
                                        </div>
                                    </div>

                                    {expandedUserId === user.id && (
                                        <div className="mobile-list-details">
                                            <div className="detail-grid">
                                                <div className="detail-item">
                                                    <span className="label">Email</span>
                                                    <span className="value">{user.email}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="label">Full Name</span>
                                                    <span className="value">{user.full_name || '-'}</span>
                                                </div>
                                                <div className="detail-item full-width">
                                                    <span className="label">Roles</span>
                                                    <div className="roles-inline">
                                                        {user.roles ? user.roles.split(',').map((role, idx) => (
                                                            <span key={idx} className="role-pill">{role.trim()}</span>
                                                        )) : '-'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mobile-actions">
                                                {hasPermission('sysadmin.users.view') && (
                                                    <button
                                                        className="action-btn view"
                                                        onClick={() => navigate(`/sysadmin/users/${user.id}`)}
                                                    >
                                                        <FiEye /> View
                                                    </button>
                                                )}
                                                {hasPermission('sysadmin.users.edit') && (
                                                    <button className="action-btn edit" onClick={() => alert('Coming soon')}>
                                                        <FiEdit2 /> Edit
                                                    </button>
                                                )}
                                                {hasPermission('sysadmin.users.delete') && (
                                                    <button
                                                        className="action-btn delete"
                                                        onClick={() => handleDelete(user.id, user.username)}
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
                    </>
                )}
            </div>

            <AddUserModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={handleUserAdded}
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

export default UserList;
