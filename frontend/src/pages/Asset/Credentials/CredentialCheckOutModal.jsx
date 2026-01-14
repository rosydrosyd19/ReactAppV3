import { useState, useEffect } from 'react';
import { FiX, FiUser, FiFileText, FiLogOut } from 'react-icons/fi';
import SearchableSelect from '../../../components/Form/SearchableSelect';
import axios from '../../../utils/axios';

const CredentialCheckOutModal = ({ isOpen, onClose, onSuccess, credentialId, credentialName, assignedUserIds = [], assignedAssetIds = [] }) => {
    const [targetType, setTargetType] = useState('user'); // 'user' or 'asset'
    const [users, setUsers] = useState([]);
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        target_id: '',
        notes: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
            fetchAssets();
            setFormData({ target_id: '', notes: '' });
            setTargetType('user');
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/asset/users/list');
            if (response.data.success) {
                setUsers(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAssets = async () => {
        try {
            setLoading(true);
            // Fetch assets, preferably only available ones but all works for selection
            const response = await axios.get('/asset/assets');
            if (response.data.success) {
                setAssets(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching assets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.target_id) return;

        try {
            setSubmitting(true);
            const payload = {
                notes: formData.notes
            };

            if (targetType === 'user') {
                payload.user_id = formData.target_id;
            } else {
                payload.asset_id = formData.target_id;
            }

            const response = await axios.post(`/asset/credentials/${credentialId}/checkout`, payload);

            if (response.data.success) {
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error('Error checking out credential:', error);
            alert(error.response?.data?.message || 'Failed to checkout credential');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    // Filter lists
    const availableUsers = users.filter(u => !assignedUserIds.includes(String(u.id)));
    const availableAssets = assets.filter(a => !assignedAssetIds.includes(String(a.id)));

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Check Out Credential</h2>
                    <button className="close-btn" onClick={onClose}>
                        <FiX />
                    </button>
                </div>
                <div className="modal-body">
                    <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
                        Check out <strong>{credentialName}</strong> to a target.
                    </p>

                    <div className="checkout-type-toggle">
                        <button
                            type="button"
                            className={`toggle-btn ${targetType === 'user' ? 'active' : ''}`}
                            onClick={() => { setTargetType('user'); setFormData(prev => ({ ...prev, target_id: '' })); }}
                        >
                            <FiUser /> User
                        </button>
                        <button
                            type="button"
                            className={`toggle-btn ${targetType === 'asset' ? 'active' : ''}`}
                            onClick={() => { setTargetType('asset'); setFormData(prev => ({ ...prev, target_id: '' })); }}
                        >
                            <FiFileText /> Asset
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} id="checkout-form">
                        <div className="form-group">
                            <label>Assign to {targetType === 'user' ? 'User' : 'Asset'} <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                            {targetType === 'user' ? (
                                <SearchableSelect
                                    icon={FiUser}
                                    options={availableUsers.map(u => ({
                                        value: u.id,
                                        label: `${u.full_name} (${u.username})`
                                    }))}
                                    value={formData.target_id}
                                    onChange={(value) => setFormData({ ...formData, target_id: value })}
                                    placeholder="Search and select user..."
                                />
                            ) : (
                                <SearchableSelect
                                    icon={FiFileText}
                                    options={availableAssets.map(a => ({
                                        value: a.id,
                                        label: `${a.asset_name} (${a.asset_tag})`
                                    }))}
                                    value={formData.target_id}
                                    onChange={(value) => setFormData({ ...formData, target_id: value })}
                                    placeholder="Search and select asset..."
                                />
                            )}
                        </div>

                        <div className="form-group">
                            <label>Notes</label>
                            <div className="input-with-icon-right">
                                <textarea
                                    className="form-input"
                                    placeholder="Optional notes..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows="3"
                                    style={{ resize: 'vertical', minHeight: '80px', paddingRight: '1rem' }}
                                />
                            </div>
                        </div>
                    </form>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-outline" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="checkout-form"
                        className="btn btn-primary"
                        disabled={submitting || !formData.target_id}
                    >
                        {submitting ? 'Saving...' : <><FiLogOut /> Check Out</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CredentialCheckOutModal;
