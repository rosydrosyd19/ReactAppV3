import React, { useState, useEffect } from 'react';
import { FiX, FiSave } from 'react-icons/fi';
import axios from '../../../utils/axios';
import './LocationModal.css';

const LocationModal = ({ isOpen, onClose, onSuccess, location = null, locations = [] }) => {
    const isEdit = !!location;
    const [formData, setFormData] = useState({
        location_name: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        parent_location_id: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (location) {
                setFormData({
                    location_name: location.location_name || '',
                    address: location.address || '',
                    city: location.city || '',
                    state: location.state || '',
                    postal_code: location.postal_code || '',
                    country: location.country || '',
                    parent_location_id: location.parent_location_id || ''
                });
            } else {
                setFormData({
                    location_name: '',
                    address: '',
                    city: '',
                    state: '',
                    postal_code: '',
                    country: '',
                    parent_location_id: ''
                });
            }
            setError('');
        }
    }, [isOpen, location]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.location_name.trim()) {
            setError('Location Name is required');
            return;
        }

        setLoading(true);
        try {
            const payload = { ...formData };
            if (!payload.parent_location_id) {
                payload.parent_location_id = null;
            }

            if (isEdit) {
                await axios.put(`/asset/locations/${location.id}`, payload);
            } else {
                await axios.post('/asset/locations', payload);
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error saving location:', err);
            setError(err.response?.data?.message || 'Failed to save location');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Filter out current location from parent options to avoid circular reference (basic check)
    const availableParents = locations.filter(l => !isEdit || l.id !== location.id);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal location-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{isEdit ? 'Edit Location' : 'Add Location'}</h2>
                    <button className="modal-close" onClick={onClose}>
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
                            <div className="form-group">
                                <label className="form-label">Location Name *</label>
                                <input
                                    type="text"
                                    name="location_name"
                                    className="form-input"
                                    value={formData.location_name}
                                    onChange={handleChange}
                                    placeholder="e.g. Main Office, Warehouse A"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Parent Location</label>
                                <select
                                    name="parent_location_id"
                                    className="form-input"
                                    value={formData.parent_location_id}
                                    onChange={handleChange}
                                >
                                    <option value="">None</option>
                                    {availableParents.map(loc => (
                                        <option key={loc.id} value={loc.id}>
                                            {loc.location_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Address</label>
                                <textarea
                                    name="address"
                                    className="form-input"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="Street address..."
                                    rows={2}
                                />
                            </div>

                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        className="form-input"
                                        value={formData.city}
                                        onChange={handleChange}
                                        placeholder="City"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">State/Province</label>
                                    <input
                                        type="text"
                                        name="state"
                                        className="form-input"
                                        value={formData.state}
                                        onChange={handleChange}
                                        placeholder="State"
                                    />
                                </div>
                            </div>

                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Postal Code</label>
                                    <input
                                        type="text"
                                        name="postal_code"
                                        className="form-input"
                                        value={formData.postal_code}
                                        onChange={handleChange}
                                        placeholder="Postal Code"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Country</label>
                                    <input
                                        type="text"
                                        name="country"
                                        className="form-input"
                                        value={formData.country}
                                        onChange={handleChange}
                                        placeholder="Country"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={onClose}
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

export default LocationModal;
