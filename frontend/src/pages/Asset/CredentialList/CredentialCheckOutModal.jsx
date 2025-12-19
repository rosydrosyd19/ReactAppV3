import { useState, useEffect } from 'react';
import { FiX, FiUser, FiFileText, FiLogOut } from 'react-icons/fi';
import SearchableSelect from '../../../components/Form/SearchableSelect';
import axios from '../../../utils/axios';

const CredentialCheckOutModal = ({ isOpen, onClose, onSuccess, credentialId, credentialName, assignedUserIds = [] }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        user_id: '',
        notes: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
            setFormData({ user_id: '', notes: '' });
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.user_id) return;

        try {
            setSubmitting(true);
            const response = await axios.post(`/asset/credentials/${credentialId}/checkout`, {
                user_id: formData.user_id,
                notes: formData.notes
            });

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

    // Filter out users who already have this credential assigned
    const availableUsers = users.filter(u => !assignedUserIds.includes(String(u.id)));

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
                        Check out <strong>{credentialName}</strong> to a user.
                    </p>

                    <form onSubmit={handleSubmit} id="checkout-form">
                        <div className="form-group">
                            <label>Assign User <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                            <SearchableSelect
                                icon={FiUser}
                                options={availableUsers.map(u => ({
                                    value: u.id,
                                    label: `${u.full_name} (${u.username})`
                                }))}
                                value={formData.user_id}
                                onChange={(value) => setFormData({ ...formData, user_id: value })}
                                placeholder="Search and select user..."
                            />
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
                        disabled={submitting || !formData.user_id}
                    >
                        {submitting ? 'Saving...' : <><FiLogOut /> Check Out</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CredentialCheckOutModal;
