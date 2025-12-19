import { useState, useEffect } from 'react';
import axios from '../../../utils/axios';
import { FiX, FiSave, FiEye, FiEyeOff } from 'react-icons/fi';

const CredentialModal = ({ isOpen, onClose, onSuccess, credentialId }) => {
    const [formData, setFormData] = useState({
        platform_name: '',
        username: '',
        password: '',
        url: '',
        category: 'other',
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && credentialId) {
            fetchCredential(credentialId);
        } else if (isOpen) {
            // Reset form for new entry
            setFormData({
                platform_name: '',
                username: '',
                password: '',
                url: '',
                category: 'other',
                description: ''
            });
            setError('');
        }
    }, [isOpen, credentialId]);

    const fetchCredential = async (id) => {
        try {
            setLoading(true);
            const response = await axios.get(`/asset/credentials/${id}`);
            if (response.data.success) {
                setFormData(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching credential:', error);
            setError('Failed to load credential details');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (credentialId) {
                await axios.put(`/asset/credentials/${credentialId}`, formData);
                onSuccess('Credential updated successfully');
            } else {
                await axios.post('/asset/credentials', formData);
                onSuccess('Credential created successfully');
            }
            onClose();
        } catch (error) {
            console.error('Error saving credential:', error);
            setError(error.response?.data?.message || 'Failed to save credential');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-header">
                    <h2>{credentialId ? 'Edit Credential' : 'Add Credential'}</h2>
                    <button className="close-btn" onClick={onClose}>
                        <FiX />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="modal-body">
                        {error && <div className="alert alert-danger">{error}</div>}

                        <div className="form-group">
                            <label>Platform Name *</label>
                            <input
                                type="text"
                                name="platform_name"
                                value={formData.platform_name}
                                onChange={handleChange}
                                placeholder="e.g. Facebook, Dropbox, Company Email"
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Username</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="form-select"
                                >
                                    <option value="social_media">Social Media</option>
                                    <option value="storage">Storage</option>
                                    <option value="email">Email</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <div className="input-with-icon-right">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="form-input"
                                />
                                <button
                                    type="button"
                                    className="icon-btn-right"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>URL</label>
                            <input
                                type="text"
                                name="url"
                                value={formData.url}
                                onChange={handleChange}
                                placeholder="https://..."
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="form-textarea"
                                rows="3"
                            ></textarea>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : <><FiSave /> Save</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CredentialModal;
