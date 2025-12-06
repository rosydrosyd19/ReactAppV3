import './UserList.css';
import { useState, useEffect } from 'react';
import axios from '../../utils/axios';
import { useAuth } from '../../contexts/AuthContext';
import {
    FiPlus,
    FiSearch,
    FiEdit2,
    FiTrash2,
    FiUser
} from 'react-icons/fi';

const UserList = () => {
    const { hasPermission } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

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
            // alert('Failed to fetch users'); // Squelch error for now or show toast
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        // Frontend filtering since API might not support search yet or it's small enough
        // Ideally API should handle this, but for now filtering locally if needed or re-fetching
        // The current plan doesn't specifying modifying API for search, so I'll just filter displayed data or re-fetch if API supported it.
        // Looking at sysadmin.js, it doesn't seem to support search query params for /users. 
        // So I will implement client-side filtering for search or just ignore it for now if complex.
        // Let's do simple client-side filtering for this iteration to be helpful.
    };

    const handleDelete = async (id, username) => {
        if (!window.confirm(`Are you sure you want to delete user ${username}?`)) {
            return;
        }

        try {
            const response = await axios.delete(`/sysadmin/users/${id}`);
            if (response.data.success) {
                alert('User deleted successfully');
                fetchUsers();
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert(error.response?.data?.message || 'Failed to delete user');
        }
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
                    <p>Manage system users and access</p>
                </div>
                {hasPermission('sysadmin.users.create') && (
                    <button className="btn btn-primary" onClick={() => alert('Add User functionality coming next')}>
                        <FiPlus /> Add User
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
                                placeholder="Search by name, username, or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </form>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner" />
                        <p>Loading users...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="empty-state">
                        <FiUser />
                        <h3>No users found</h3>
                        <p>Start by adding your first user</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Full Name</th>
                                    <th>Email</th>
                                    <th>Roles</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            <strong>{user.username}</strong>
                                        </td>
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
                                                {hasPermission('sysadmin.users.edit') && (
                                                    <button className="btn-icon" title="Edit" onClick={() => alert('Edit functionality coming next')}>
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
                )}
            </div>
        </div>
    );
};

export default UserList;
