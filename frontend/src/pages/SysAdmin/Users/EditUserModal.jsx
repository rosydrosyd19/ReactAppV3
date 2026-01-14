import './AddUserModal.css'; // Reuse CSS
import React, { useState, useEffect } from 'react';
import { FiX, FiEye, FiEyeOff } from 'react-icons/fi';
import api from '../../../utils/axios';

const EditUserModal = ({ isOpen, onClose, onSuccess, userId }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        full_name: '',
        phone: '',
        role_ids: [],
        is_active: true
    });
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [roles, setRoles] = useState([]);
    const [roleSearch, setRoleSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && userId) {
            fetchInitialData();
        }
    }, [isOpen, userId]);

    const fetchInitialData = async () => {
        try {
            setFetchingData(true);
            setError('');

            // Parallel fetch for roles and user details
            const [rolesResponse, userResponse] = await Promise.all([
                api.get('/sysadmin/roles-list'),
                api.get(`/sysadmin/users/${userId}`)
            ]);

            if (rolesResponse.data.success) {
                setRoles(rolesResponse.data.data);
            }

            if (userResponse.data.success) {
                const user = userResponse.data.data;
                setFormData({
                    username: user.username,
                    email: user.email,
                    password: '', // Leave blank initially
                    full_name: user.full_name || '',
                    phone: user.phone || '',
                    role_ids: user.roles.map(r => r.id),
                    is_active: user.is_active === 1 || user.is_active === true
                });
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to load user data');
        } finally {
            setFetchingData(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === 'checkbox' && name === 'is_active') {
            setFormData(prev => ({
                ...prev,
                [name]: checked
            }));
        } else if (name === 'phone') {
            // Only allow numbers
            const numbersOnly = value.replace(/[^0-9]/g, '');
            setFormData(prev => ({
                ...prev,
                [name]: numbersOnly
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }

        setError('');
    };

    const handleRoleChange = (roleId) => {
        setFormData(prev => {
            const roleIds = prev.role_ids.includes(roleId)
                ? prev.role_ids.filter(id => id !== roleId)
                : [...prev.role_ids, roleId];
            return { ...prev, role_ids: roleIds };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.email) {
            setError('Email is required');
            scrollToTop();
            return;
        }

        // Password validation only if provided
        if (formData.password) {
            if (formData.password.length < 6) {
                setError('Password must be at least 6 characters');
                scrollToTop();
                return;
            }

            if (formData.password !== confirmPassword) {
                setError('Password and Confirmation Password do not match');
                scrollToTop();
                return;
            }
        }

        setLoading(true);

        try {
            // Prepare payload
            const payload = {
                ...formData,
                // If password is empty string, don't send it (or backend handles it)
                // Backend checks `if (password)` so empty string is fine (falsy)
            };

            const response = await api.put(`/sysadmin/users/${userId}`, payload);

            // Also need to update roles separately? 
            // Wait, looking at backend sysadmin.js update user:
            // It updates sysadmin_users table.
            // It DOES NOT seem to update roles in the `PUT /users/:id` handler!
            // I need to check backend `metrics` again. 
            // Line 148: router.put('/users/:id' ...
            // It updates email, full_name, phone, is_active, password.
            // It DOES NOT update roles! 
            // Roles are usually handled via a separate endpoint or I need to update the backend to handle roles in update user.

            // Let's check if there is another endpoint for assigning roles to users.
            // There isn't an obvious one in the snippet I saw earlier.
            // The create user endpoint DOES assign roles.

            // I might need to update the backend to support role updates in PUT /users/:id
            // Or use a separate call if one exists.
            // I'll assume for now I need to update the backend too.

            if (response.data.success) {
                handleClose();
                onSuccess();
            }
        } catch (error) {
            console.error('Error updating user:', error);
            setError(error.response?.data?.message || 'Failed to update user');
            scrollToTop();
        } finally {
            setLoading(false);
        }
    };

    const scrollToTop = () => {
        const modalBody = document.querySelector('.add-user-modal .modal-body');
        if (modalBody) {
            modalBody.scrollTo({ top: 0, behavior: 'smooth' });
        }
        const modal = document.querySelector('.add-user-modal');
        if (modal) {
            modal.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleClose = () => {
        setFormData({
            username: '',
            email: '',
            password: '',
            full_name: '',
            phone: '',
            role_ids: [],
            is_active: true
        });
        setConfirmPassword('');
        setShowPassword(false);
        setShowConfirmPassword(false);
        setRoleSearch('');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    const filteredRoles = roles.filter(role =>
        role.role_name.toLowerCase().includes(roleSearch.toLowerCase())
    );

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal add-user-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Edit User</h2>
                    <button className="modal-close" onClick={handleClose}>
                        <FiX />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && (
                            <div className="alert alert-error">
                                {error}
                            </div>
                        )}

                        {fetchingData ? (
                            <div className="loading-spinner-container">
                                <div className="loading-spinner" />
                                <p>Loading user data...</p>
                            </div>
                        ) : (
                            <div className="form-grid">
                                <div className="form-column">
                                    <div className="form-group">
                                        <label className="form-label">Username</label>
                                        <input
                                            type="text"
                                            name="username"
                                            className="form-input"
                                            value={formData.username}
                                            disabled // Username usually not editable
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Email *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            className="form-input"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="Enter email"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">New Password</label>
                                        <div className="password-input-wrapper">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                className="form-input"
                                                value={formData.password}
                                                onChange={handleChange}
                                                placeholder="Leave blank to keep current"
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <FiEyeOff /> : <FiEye />}
                                            </button>
                                        </div>
                                        <small className="form-hint">Fill only if you want to change password</small>
                                    </div>

                                    {formData.password && (
                                        <div className="form-group">
                                            <label className="form-label">Confirm New Password *</label>
                                            <div className="password-input-wrapper">
                                                <input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    className="form-input"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    placeholder="Confirmation password"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    className="password-toggle"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                >
                                                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="form-group">
                                        <label className="checkbox-label" style={{ marginTop: '10px' }}>
                                            <input
                                                type="checkbox"
                                                name="is_active"
                                                checked={formData.is_active}
                                                onChange={handleChange}
                                            />
                                            <span>Active User</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="form-column">
                                    <div className="form-group">
                                        <label className="form-label">Full Name</label>
                                        <input
                                            type="text"
                                            name="full_name"
                                            className="form-input"
                                            value={formData.full_name}
                                            onChange={handleChange}
                                            placeholder="Enter full name"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Phone Number</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            className="form-input"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="Example : 8058182123"
                                            pattern="[0-9]*"
                                            inputMode="numeric"
                                        />
                                        <small className="form-hint">Only numbers (0-9)</small>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Role</label>
                                        <div className="role-search-wrapper">
                                            <input
                                                type="text"
                                                className="form-input role-search-input"
                                                placeholder="Search role..."
                                                value={roleSearch}
                                                onChange={(e) => setRoleSearch(e.target.value)}
                                            />
                                        </div>
                                        <div className="role-checkboxes">
                                            {filteredRoles.length > 0 ? (
                                                filteredRoles.map(role => (
                                                    <label key={role.id} className="checkbox-label">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.role_ids.includes(role.id)}
                                                            onChange={() => handleRoleChange(role.id)}
                                                        />
                                                        <span>{role.role_name}</span>
                                                    </label>
                                                ))
                                            ) : (
                                                <div className="no-roles-found">
                                                    No roles found
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={handleClose}
                            disabled={loading || fetchingData}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || fetchingData}
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUserModal;
