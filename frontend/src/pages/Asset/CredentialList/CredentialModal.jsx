import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import axios from '../../../utils/axios';
import { FiX, FiSave, FiEye, FiEyeOff, FiPlus } from 'react-icons/fi';
import SearchableSelect from '../../../components/Form/SearchableSelect';
import Toast from '../../../components/Toast/Toast';
import { QuickAddCredentialCategoryModal } from '../AssetList/QuickAddModals';

const CredentialModal = ({ isOpen, onClose, onSuccess, credentialId, cloneId }) => {
    const [formData, setFormData] = useState({
        platform_name: '',
        username: '',
        password: '',
        url: '',
        category: '', // Default to empty, will be selected from dropdown
        description: '',
        is_public: false
    });
    const [categories, setCategories] = useState([]);
    const [showQuickCategory, setShowQuickCategory] = useState(false);
    const [toast, setToast] = useState({ message: '', type: '' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { hasPermission } = useAuth();

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
            if (credentialId) {
                fetchCredential(credentialId);
            } else if (cloneId) {
                fetchCredential(cloneId, true);
            } else {
                // Reset form for new entry
                setFormData({
                    platform_name: '',
                    username: '',
                    password: '',
                    url: '',
                    category: '',
                    description: '',
                    is_public: false
                });
                setError('');
            }
        }
    }, [isOpen, credentialId, cloneId]);

    const fetchCategories = async () => {
        try {
            const response = await axios.get('/asset/credentials/categories');
            if (response.data.success) {
                setCategories(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            // Don't block modal if categories fail, just show empty list or handle gracefully
        }
    };

    const fetchCredential = async (id, isClone = false) => {
        try {
            setLoading(true);
            const response = await axios.get(`/asset/credentials/${id}`);
            if (response.data.success) {
                const data = response.data.data;

                if (isClone) {
                    setFormData({
                        ...data,
                        platform_name: `${data.platform_name}`,
                    });
                } else {
                    setFormData(data);
                }
            }
        } catch (error) {
            console.error('Error fetching credential:', error);
            setError('Failed to load credential details');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // ... (rest of submit logic)
            // No changes needed here, formData.category is already a string
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

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    const handleQuickCategorySuccess = (newCategory) => {
        // newCategory is { id, name }
        setCategories(prev => [...prev, { id: newCategory.id, category_name: newCategory.name }]);
        // Set the value to the NAME since that's what we store in credentials
        setFormData(prev => ({ ...prev, category: newCategory.name }));
        showToast('Category added successfully!', 'success');
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="modal-overlay">
                <div className="modal-container">
                    <div className="modal-header">
                        <h2>{credentialId ? 'Edit Credential' : cloneId ? 'Clone Credential' : 'Add Credential'}</h2>
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
                                    <label>Category <span className="required">*</span></label>
                                    <div className="input-group-with-button" style={{ display: 'flex', gap: '8px' }}>
                                        <div style={{ flex: 1 }}>
                                            <SearchableSelect
                                                options={categories.map(c => ({ value: c.category_name, label: c.category_name }))}
                                                value={formData.category}
                                                onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                                                placeholder="Select Category"
                                                required
                                            />
                                        </div>
                                        {hasPermission('asset.credential_categories.create') && (
                                            <button
                                                type="button"
                                                className="btn btn-outline btn-quick-add"
                                                style={{ height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '42px', padding: '0' }}
                                                onClick={() => setShowQuickCategory(true)}
                                                title="Add New Category"
                                            >
                                                <FiPlus />
                                            </button>
                                        )}
                                    </div>
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

                            <div className="form-group">
                                <label className="checkbox-container" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        name="is_public"
                                        checked={formData.is_public}
                                        onChange={handleChange}
                                    />
                                    <span>Mask as Public? (Visible to anyone with asset access)</span>
                                </label>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Saving...' : (
                                    <>
                                        <FiSave />
                                        Save
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {toast.message && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ message: '', type: '' })}
                />
            )}

            <QuickAddCredentialCategoryModal
                isOpen={showQuickCategory}
                onClose={() => setShowQuickCategory(false)}
                onSuccess={handleQuickCategorySuccess}
                showToast={showToast}
            />
        </>
    );
};

export default CredentialModal;
