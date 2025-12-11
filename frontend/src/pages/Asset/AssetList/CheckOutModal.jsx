import { useState, useEffect } from 'react';
import { FiX, FiUser, FiMapPin, FiFileText, FiSave, FiLogOut } from 'react-icons/fi';
import SearchableSelect from '../../../components/Form/SearchableSelect';
import axios from '../../../utils/axios';
import './CheckOutModal.css';

const CheckOutModal = ({ isOpen, onClose, onSuccess, assetId, assetName }) => {
    const [checkoutType, setCheckoutType] = useState('user'); // 'user' or 'location'
    const [users, setUsers] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        user_id: '',
        location_id: '',
        notes: '',
        due_date: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchDependencies();
            setFormData({ user_id: '', location_id: '', notes: '', due_date: '' });
            setCheckoutType('user');
        }
    }, [isOpen]);

    const fetchDependencies = async () => {
        try {
            setLoading(true);
            const [usersRes, locsRes] = await Promise.all([
                axios.get('/asset/users/list'),
                axios.get('/asset/locations')
            ]);

            if (usersRes.data.success) setUsers(usersRes.data.data);
            if (locsRes.data.success) setLocations(locsRes.data.data);
        } catch (error) {
            console.error('Error fetching dependencies:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (checkoutType === 'user' && !formData.user_id) return;
        if (checkoutType === 'location' && !formData.location_id) return;

        try {
            setSubmitting(true);

            // Prepare payload based on type
            const payload = {
                notes: formData.notes,
                due_date: formData.due_date
            };

            if (checkoutType === 'user') {
                payload.user_id = formData.user_id;
            } else {
                payload.location_id = formData.location_id;
            }

            const response = await axios.post(`/asset/assets/${assetId}/checkout`, payload);
            if (response.data.success) {
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error('Error checking out asset:', error);
            alert(error.response?.data?.message || 'Failed to checkout asset');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const isValid = checkoutType === 'user' ? !!formData.user_id : !!formData.location_id;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="action-modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Check Out Asset</h2>
                    <button className="close-button" onClick={onClose}>
                        <FiX />
                    </button>
                </div>
                <div className="modal-body">
                    <p className="mb-4" style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
                        Check out <strong>{assetName}</strong>.
                    </p>

                    <form onSubmit={handleSubmit}>
                        {/* Type Toggle */}
                        <div className="checkout-type-toggle">
                            <button
                                type="button"
                                className={`toggle-btn ${checkoutType === 'user' ? 'active' : ''}`}
                                onClick={() => setCheckoutType('user')}
                            >
                                <FiUser /> To User
                            </button>
                            <button
                                type="button"
                                className={`toggle-btn ${checkoutType === 'location' ? 'active' : ''}`}
                                onClick={() => setCheckoutType('location')}
                            >
                                <FiMapPin /> To Location
                            </button>
                        </div>
                        {/* User Selection */}
                        {checkoutType === 'user' && (
                            <div className="form-group">
                                <label>Assign User <span className="text-danger">*</span></label>
                                <SearchableSelect
                                    icon={FiUser}
                                    options={users.map(u => ({
                                        value: u.id,
                                        label: `${u.full_name} (${u.username})`
                                    }))}
                                    value={formData.user_id}
                                    onChange={(value) => setFormData({ ...formData, user_id: value })}
                                    placeholder="Search and select user..."
                                />
                            </div>
                        )}

                        {/* Location Selection */}
                        {checkoutType === 'location' && (
                            <div className="form-group">
                                <label>Assign Location <span className="text-danger">*</span></label>
                                <SearchableSelect
                                    icon={FiMapPin}
                                    options={locations.map(l => ({
                                        value: l.id,
                                        label: l.location_name
                                    }))}
                                    value={formData.location_id}
                                    onChange={(value) => setFormData({ ...formData, location_id: value })}
                                    placeholder="Search and select location..."
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label>Notes</label>
                            <div className="input-with-icon">
                                <FiFileText />
                                <textarea
                                    className="form-input"
                                    placeholder={`Notes about this check-out...`}
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows="3"
                                    style={{ resize: 'vertical', minHeight: '80px' }}
                                />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-outline" onClick={onClose}>
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={submitting || !isValid}
                            >
                                {submitting ? 'Saving...' : <><FiLogOut /> Check Out</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CheckOutModal;
