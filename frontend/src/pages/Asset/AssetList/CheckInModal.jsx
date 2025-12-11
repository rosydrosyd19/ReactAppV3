import { useState, useEffect } from 'react';
import { FiX, FiCheckCircle, FiAlertTriangle, FiFileText, FiSave, FiMapPin, FiLogIn } from 'react-icons/fi';
import SearchableSelect from '../../../components/Form/SearchableSelect';
import axios from '../../../utils/axios';
import './CheckOutModal.css'; // Reusing same styles

const CheckInModal = ({ isOpen, onClose, onSuccess, assetId, assetName }) => {
    const [locations, setLocations] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        condition_status: '',
        location_id: '',
        notes: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchLocations();
            setFormData({ condition_status: '', location_id: '', notes: '' });
        }
    }, [isOpen]);

    const fetchLocations = async () => {
        try {
            const response = await axios.get('/asset/locations');
            if (response.data.success) {
                setLocations(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching locations:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const response = await axios.post(`/asset/assets/${assetId}/checkin`, formData);
            if (response.data.success) {
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error('Error checking in asset:', error);
            alert(error.response?.data?.message || 'Failed to check in asset');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="action-modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Check In Asset</h2>
                    <button className="close-button" onClick={onClose}>
                        <FiX />
                    </button>
                </div>
                <div className="modal-body">
                    <p className="mb-4" style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
                        Return <strong>{assetName}</strong> to inventory.
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Return Location (Optional)</label>
                            <SearchableSelect
                                icon={FiMapPin}
                                options={[
                                    { value: "", label: "Keep Current Location" },
                                    ...locations.map(loc => ({
                                        value: loc.id,
                                        label: loc.location_name
                                    }))
                                ]}
                                value={formData.location_id}
                                onChange={(value) => setFormData({ ...formData, location_id: value })}
                                placeholder="Select return location..."
                            />
                        </div>

                        <div className="form-group">
                            <label>Update Condition (Optional)</label>
                            <div className="input-with-icon">
                                <FiCheckCircle />
                                <select
                                    className="form-select"
                                    value={formData.condition_status}
                                    onChange={(e) => setFormData({ ...formData, condition_status: e.target.value })}
                                >
                                    <option value="">Keep Current Condition</option>
                                    <option value="excellent">Excellent</option>
                                    <option value="good">Good</option>
                                    <option value="fair">Fair</option>
                                    <option value="poor">Poor</option>
                                    <option value="damaged">Damaged</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Notes</label>
                            <div className="input-with-icon">
                                <FiFileText />
                                <textarea
                                    className="form-input"
                                    placeholder="Optional notes..."
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
                                disabled={submitting}
                            >
                                {submitting ? 'Saving...' : <><FiLogIn /> Check In</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CheckInModal;
