import './AddUserModal.css';
import { useState, useEffect } from 'react';
import { FiX, FiEye, FiEyeOff, FiSave } from 'react-icons/fi';
import api from '../../../utils/axios';
import './AddUserModal.css';

const AddUserModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        full_name: '',
        phone: '',
        role_ids: []
    });
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [roles, setRoles] = useState([]);
    const [roleSearch, setRoleSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchRoles();
        }
    }, [isOpen]);

    const fetchRoles = async () => {
        try {
            const response = await api.get('/sysadmin/roles-list');
            if (response.data.success) {
                setRoles(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Validasi untuk phone: hanya angka
        if (name === 'phone') {
            // Hanya izinkan angka (0-9)
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

        // Validasi
        if (!formData.username || !formData.email || !formData.password) {
            setError('Username, Email, and Password are required');
            scrollToTop();
            return;
        }

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

        setLoading(true);

        try {
            const response = await api.post('/sysadmin/users', formData);
            if (response.data.success) {
                // Langsung close modal dan callback ke parent
                handleClose();
                onSuccess(); // Parent akan handle toast notification
            }
        } catch (error) {
            console.error('Error creating user:', error);
            setError(error.response?.data?.message || 'Failed to add user');
            scrollToTop(); // Scroll ke atas untuk menampilkan error
        } finally {
            setLoading(false);
        }
    };

    const scrollToTop = () => {
        // Scroll modal body ke atas (untuk mobile yang scrollable)
        const modalBody = document.querySelector('.add-user-modal .modal-body');
        if (modalBody) {
            modalBody.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }

        // Scroll modal container ke atas (untuk desktop)
        const modal = document.querySelector('.add-user-modal');
        if (modal) {
            modal.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    };

    const handleClose = () => {
        setFormData({
            username: '',
            email: '',
            password: '',
            full_name: '',
            phone: '',
            role_ids: []
        });
        setConfirmPassword('');
        setShowPassword(false);
        setShowConfirmPassword(false);
        setRoleSearch('');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    // Filter roles berdasarkan search
    const filteredRoles = roles.filter(role =>
        role.role_name.toLowerCase().includes(roleSearch.toLowerCase())
    );

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal add-user-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Add New User</h2>
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

                        <div className="form-grid">
                            <div className="form-column">
                                <div className="form-group">
                                    <label className="form-label">Username *</label>
                                    <input
                                        type="text"
                                        name="username"
                                        className="form-input"
                                        value={formData.username}
                                        onChange={handleChange}
                                        placeholder="Enter username"
                                        required
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
                                    <label className="form-label">Password *</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            className="form-input"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="Enter minimum 6 characters"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <FiEyeOff /> : <FiEye />}
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Konfirmasi Password *</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            className="form-input"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Enter password confirmation"
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
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : (
                                <>
                                    <FiSave style={{ marginRight: '8px' }} />
                                    Save
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddUserModal;
