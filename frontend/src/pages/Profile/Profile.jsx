
import { useState, useEffect } from 'react';
import axios from '../../utils/axios';
import { useAuth } from '../../contexts/AuthContext';
import { FiSave, FiUser, FiLock, FiMail, FiPhone, FiAlertCircle, FiEye, FiEyeOff, FiGlobe, FiCopy, FiSearch } from 'react-icons/fi';
import './Profile.css';

const Profile = () => {
    const { user, login } = useAuth(); // login used here to potentially update local user state if needed, or we might need a setUser in context
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        new_password: '',
        confirm_password: ''
    });

    const [credentials, setCredentials] = useState([]);
    const [visiblePasswords, setVisiblePasswords] = useState({});

    const togglePassword = (id) => {
        setVisiblePasswords(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                full_name: user.full_name || '',
                email: user.email || '',
                phone: user.phone || ''
            }));
            fetchCredentials();
        }
    }, [user]);

    const fetchCredentials = async () => {
        try {
            const response = await axios.get('/asset/credentials/my-assignments');
            if (response.data.success) {
                setCredentials(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching credentials:', error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setMessage({ type: '', text: '' });

        if (formData.new_password && formData.new_password !== formData.confirm_password) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        setLoading(true);
        try {
            const response = await axios.put('/auth/profile', formData);

            if (response.data.success) {
                setMessage({ type: 'success', text: 'Profile updated successfully. Please re-login to see changes completely.' });
                // Ideally refresh user context here, but re-login prompt is safer for now or we could manually update localStorage
                const currentUser = JSON.parse(localStorage.getItem('user'));
                currentUser.user = response.data.data.user;
                localStorage.setItem('user', JSON.stringify(currentUser));
                // Force reload or better way to update context would be adding setUser to AuthContext export
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to update profile'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-container">
            <div className="profile-card">
                <div className="profile-header">
                    <h2>Edit Profile</h2>
                    <p>Update your personal information and password</p>
                </div>

                {message.text && (
                    <div className={`alert ${message.type}`}>
                        <FiAlertCircle />
                        <span>{message.text}</span>
                    </div>
                )}

                <div className="profile-grid">
                    <form onSubmit={handleSubmit} className="profile-form">
                        <div className="form-section">
                            <h3>Personal Information</h3>

                            <div className="form-group">
                                <label>Full Name</label>
                                <div className="input-with-icon">
                                    <FiUser />
                                    <input
                                        type="text"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        placeholder="Enter full name"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Email Address</label>
                                <div className="input-with-icon">
                                    <FiMail />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Enter email"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Phone Number</label>
                                <div className="input-with-icon">
                                    <FiPhone />
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="Enter phone number"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3>Change Password <small>(Leave blank to keep current)</small></h3>

                            <div className="form-group">
                                <label>Current Password</label>
                                <div className="input-with-icon">
                                    <FiLock />
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Required to set new password"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>New Password</label>
                                    <div className="input-with-icon">
                                        <FiLock />
                                        <input
                                            type="password"
                                            name="new_password"
                                            value={formData.new_password}
                                            onChange={handleChange}
                                            placeholder="New password"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Confirm New Password</label>
                                    <div className="input-with-icon">
                                        <FiLock />
                                        <input
                                            type="password"
                                            name="confirm_password"
                                            value={formData.confirm_password}
                                            onChange={handleChange}
                                            placeholder="Confirm new password"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn-primary" disabled={loading}>
                                <FiSave />
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Assigned Credentials Section */}
                <div className="credentials-section">
                    <div className="credentials-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3>Assigned Credentials</h3>
                        <div className="profile-search-box">
                            <FiSearch className="profile-search-icon" />
                            <input
                                type="text"
                                className="profile-search-input"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    {credentials.filter(cred =>
                        cred.platform_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        cred.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        cred.category.toLowerCase().includes(searchTerm.toLowerCase())
                    ).length > 0 ? (
                        <div className="credentials-list">
                            {credentials.filter(cred =>
                                cred.platform_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                cred.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                cred.category.toLowerCase().includes(searchTerm.toLowerCase())
                            ).map(cred => (
                                <div key={cred.id} className="credential-item">
                                    <div className="credential-icon">
                                        <FiLock />
                                    </div>
                                    <div className="credential-main-info">
                                        <div className="credential-header">
                                            <strong>{cred.platform_name}</strong>
                                            <span className="credential-category">{cred.category}</span>
                                        </div>
                                        <div className="credential-details">
                                            <div className="credential-detail-row">
                                                <FiUser size={14} />
                                                <span>{cred.username}</span>
                                            </div>
                                            {cred.url && (
                                                <div className="credential-detail-row">
                                                    <FiGlobe size={14} />
                                                    <a href={cred.url.startsWith('http') ? cred.url : `https://${cred.url}`} target="_blank" rel="noopener noreferrer">
                                                        {cred.url}
                                                    </a>
                                                </div>
                                            )}
                                            {cred.password && (
                                                <div className="credential-detail-row">
                                                    <FiLock size={14} />
                                                    <span className="password-text">
                                                        {visiblePasswords[cred.id] ? cred.password : '••••••••••••'}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="btn-icon-sm"
                                                        onClick={() => togglePassword(cred.id)}
                                                    >
                                                        {visiblePasswords[cred.id] ? <FiEyeOff /> : <FiEye />}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state-small">
                            <p>No credentials found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
