import React, { useState, useEffect } from 'react';
import { FiX, FiSave, FiAlertCircle, FiCamera, FiImage, FiTrash2 } from 'react-icons/fi';
import CameraModal from '../../../components/Camera/CameraModal';
import './MaintenanceRequestModal.css';

const MaintenanceRequestModal = ({ isOpen, onClose, onSubmit, user, loading }) => {
    const [formData, setFormData] = useState({
        requester_name: '',
        requester_phone: '',
        issue_description: '',
        image: null,
        imagePreview: null
    });
    const [errors, setErrors] = useState({});
    const [showCamera, setShowCamera] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Reset form when opening
            setFormData({
                requester_name: user ? user.full_name : '',
                requester_phone: user ? user.phone : '',
                issue_description: '',
                image: null,
                imagePreview: null
            });
            setErrors({});
            setShowCamera(false);
        }
    }, [isOpen, user]);

    const validate = () => {
        const newErrors = {};
        if (!formData.issue_description.trim()) {
            newErrors.issue_description = 'Issue description is required';
        }
        if (!user && !formData.requester_name.trim()) {
            newErrors.requester_name = 'Name is required';
        }
        if (!user && !formData.requester_phone.trim()) {
            newErrors.requester_phone = 'WhatsApp number is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({
                ...formData,
                image: file,
                imagePreview: URL.createObjectURL(file)
            });
        }
    };

    const handleCameraCapture = (file) => {
        if (file) {
            setFormData({
                ...formData,
                image: file,
                imagePreview: URL.createObjectURL(file)
            });
            setShowCamera(false);
        }
    };

    const removeImage = () => {
        setFormData({
            ...formData,
            image: null,
            imagePreview: null
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            // Use FormData for file upload
            const data = new FormData();
            data.append('requester_name', formData.requester_name);
            data.append('requester_phone', formData.requester_phone);
            data.append('issue_description', formData.issue_description);
            if (formData.image) {
                data.append('image', formData.image);
            }
            onSubmit(data);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h3>Report Issue / Request Maintenance</h3>
                    <button className="close-button" onClick={onClose} disabled={loading}>
                        <FiX />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {/* If user is NOT logged in, show Name and Phone fields */}
                        {!user && (
                            <>
                                <div className="form-group">
                                    <label className="form-label">Your Name <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        className={`form-input ${errors.requester_name ? 'error' : ''}`}
                                        value={formData.requester_name}
                                        onChange={(e) => setFormData({ ...formData, requester_name: e.target.value })}
                                        placeholder="Enter your full name"
                                        disabled={loading}
                                    />
                                    {errors.requester_name && <span className="error-text">{errors.requester_name}</span>}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">WhatsApp Number <span className="text-danger">*</span></label>
                                    <input
                                        type="tel"
                                        className={`form-input ${errors.requester_phone ? 'error' : ''}`}
                                        value={formData.requester_phone}
                                        onChange={(e) => setFormData({ ...formData, requester_phone: e.target.value })}
                                        placeholder="e.g. 62812345678"
                                        disabled={loading}
                                    />
                                    <small style={{ color: 'var(--text-secondary)' }}>We will update you via WhatsApp Or Telegram.</small>
                                    {errors.requester_phone && <span className="error-text">{errors.requester_phone}</span>}
                                </div>
                            </>
                        )}

                        {/* If user IS logged in, verify if they have phone number (optional: warn if missing) */}
                        {user && !user.phone && (
                            <div className="alert alert-warning" style={{ marginBottom: '10px', fontSize: '13px' }}>
                                <FiAlertCircle style={{ marginRight: '5px' }} />
                                Your profile doesn't have a phone number.
                                <br />Please add one in your profile to receive updates, or enter it below:
                                <div style={{ marginTop: '5px' }}>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        value={formData.requester_phone}
                                        onChange={(e) => setFormData({ ...formData, requester_phone: e.target.value })}
                                        placeholder="e.g. 62812345678"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        )}

                        {user && user.phone && (
                            <div className="alert alert-warning" style={{ marginBottom: '15px', fontSize: '13px' }}>
                                <FiAlertCircle style={{ marginRight: '5px', flexShrink: 0 }} />
                                <span>Ensure your phone number <strong>({user.phone})</strong> is active on WhatsApp / Telegram for updates.</span>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Issue Description <span className="text-danger">*</span></label>
                            <textarea
                                className={`form-input ${errors.issue_description ? 'error' : ''}`}
                                value={formData.issue_description}
                                onChange={(e) => setFormData({ ...formData, issue_description: e.target.value })}
                                placeholder="Describe the problem, e.g. 'Screen is flickering', 'Printer jammed', etc."
                                rows={4}
                                disabled={loading}
                            />
                            {errors.issue_description && <span className="error-text">{errors.issue_description}</span>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Attach Photo (Optional)</label>

                            {!formData.imagePreview ? (
                                <div className="upload-actions">
                                    <div className="upload-btn-wrapper">
                                        <button
                                            type="button"
                                            className="btn-upload btn-camera"
                                            onClick={() => setShowCamera(true)}
                                        >
                                            <FiCamera size={24} />
                                            <span>Take Photo</span>
                                        </button>
                                    </div>

                                    <div className="upload-btn-wrapper">
                                        <button
                                            type="button"
                                            className="btn-upload btn-gallery"
                                            onClick={() => document.getElementById('gallery-input').click()}
                                        >
                                            <FiImage size={24} />
                                            <span>From Gallery</span>
                                        </button>
                                        <input
                                            id="gallery-input"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            disabled={loading}
                                            style={{ display: 'none' }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="image-preview-container">
                                    <img src={formData.imagePreview} alt="Preview" className="image-preview" />
                                    <button
                                        type="button"
                                        className="btn btn-danger btn-sm remove-image-btn"
                                        onClick={removeImage}
                                        disabled={loading}
                                    >
                                        <FiTrash2 /> Remove
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>

            <CameraModal
                isOpen={showCamera}
                onClose={() => setShowCamera(false)}
                onCapture={handleCameraCapture}
            />
        </div>
    );
};

export default MaintenanceRequestModal;
