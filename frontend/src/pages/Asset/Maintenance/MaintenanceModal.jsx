import { useState, useEffect } from 'react';
import axios from '../../../utils/axios';
import { FiX, FiSave, FiTool, FiUpload, FiImage, FiTrash, FiCamera } from 'react-icons/fi';
import SearchableSelect from '../../../components/Form/SearchableSelect';
import imageCompression from 'browser-image-compression';
import CameraModal from '../../../components/Camera/CameraModal';
import '../Assets/AssetModal.css'; // Reuse styles from Assets

const MaintenanceModal = ({ isOpen, onClose, onSuccess, maintenance = null }) => {
    const isEditMode = !!maintenance;
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [assets, setAssets] = useState([]);

    const [selectedImages, setSelectedImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [showCamera, setShowCamera] = useState(false);

    const [formData, setFormData] = useState({
        asset_id: '',
        maintenance_type: 'preventive',
        maintenance_date: new Date().toISOString().split('T')[0],
        cost: '',
        description: '',
        next_maintenance_date: '',
        status: 'scheduled',
        performed_by: ''
    });

    // Helper to format number with dots
    const formatNumber = (val) => {
        if (!val) return '';
        const stringVal = val.toString().replace(/\D/g, '');
        return stringVal.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/api$/, '');

    // Helper to format date for input (YYYY-MM-DD) handling timezone
    const formatDateForInput = (isoDate) => {
        if (!isoDate) return '';
        const date = new Date(isoDate);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        if (isOpen) {
            fetchAssets();
            if (maintenance) {
                setFormData({
                    asset_id: maintenance.asset_id,
                    maintenance_type: maintenance.maintenance_type || 'preventive',
                    maintenance_date: formatDateForInput(maintenance.maintenance_date),
                    cost: maintenance.cost ? formatNumber(Math.floor(Number(maintenance.cost))) : '',
                    description: maintenance.description || '',
                    next_maintenance_date: formatDateForInput(maintenance.next_maintenance_date),
                    status: maintenance.status || 'scheduled',
                    performed_by: maintenance.performed_by || ''
                });

                // Fetch full details including images for edit
                fetchMaintenanceDetails(maintenance.id);

            } else {
                setFormData({
                    asset_id: '',
                    maintenance_type: 'preventive',
                    maintenance_date: new Date().toISOString().split('T')[0],
                    cost: '',
                    description: '',
                    next_maintenance_date: '',
                    status: 'scheduled',
                    performed_by: ''
                });
                setExistingImages([]);
            }
            setSelectedImages([]);
            setImagePreviews([]);
            setDeletedImageIds([]);
            setError('');
        }
    }, [isOpen, maintenance]);

    const fetchMaintenanceDetails = async (id) => {
        try {
            const res = await axios.get(`/asset/maintenance/${id}`);
            if (res.data.success && res.data.data.images) {
                setExistingImages(res.data.data.images);
            }
        } catch (err) {
            console.error('Error fetching maintenance details:', err);
        }
    };

    const fetchAssets = async () => {
        try {
            const res = await axios.get('/asset/assets');
            if (res.data.success) {
                setAssets(res.data.data.map(a => ({ value: a.id, label: `${a.asset_tag} - ${a.asset_name}` })));
            }
        } catch (err) {
            console.error('Error fetching assets:', err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'cost') {
            const formatted = formatNumber(value);
            setFormData(prev => ({
                ...prev,
                [name]: formatted
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleImageChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const newImages = [];
        const newPreviews = [];

        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1280,
            useWebWorker: true,
        };

        try {
            for (const file of files) {
                const compressedFile = await imageCompression(file, options);
                newImages.push(compressedFile);
                newPreviews.push(URL.createObjectURL(compressedFile));
            }

            setSelectedImages([...selectedImages, ...newImages]);
            setImagePreviews([...imagePreviews, ...newPreviews]);
        } catch (error) {
            console.error('Image compression error:', error);
            setError('Error processing images');
        }
    };

    const handleCameraCapture = async (file) => {
        if (!file) return;

        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1280,
            useWebWorker: true,
        };

        try {
            const compressedFile = await imageCompression(file, options);
            const previewUrl = URL.createObjectURL(compressedFile);

            setSelectedImages(prev => [...prev, compressedFile]);
            setImagePreviews(prev => [...prev, previewUrl]);
        } catch (error) {
            console.error('Camera image compression error:', error);
            setError('Error processing camera image');
        }
    };

    const [deletedImageIds, setDeletedImageIds] = useState([]);

    const removeSelectedImage = (index) => {
        const updatedImages = [...selectedImages];
        const updatedPreviews = [...imagePreviews];
        updatedImages.splice(index, 1);
        updatedPreviews.splice(index, 1);
        setSelectedImages(updatedImages);
        setImagePreviews(updatedPreviews);
    };

    const handleRemoveExistingImage = (id) => {
        setDeletedImageIds([...deletedImageIds, id]);
        setExistingImages(existingImages.filter(img => img.id !== id));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const rawCost = formData.cost ? formData.cost.toString().replace(/\./g, '') : null;

            const submissionData = new FormData();
            submissionData.append('asset_id', formData.asset_id);
            submissionData.append('maintenance_type', formData.maintenance_type);
            submissionData.append('maintenance_date', formData.maintenance_date);
            if (rawCost) submissionData.append('cost', rawCost);
            submissionData.append('description', formData.description);
            if (formData.next_maintenance_date) submissionData.append('next_maintenance_date', formData.next_maintenance_date);
            submissionData.append('status', formData.status);
            submissionData.append('performed_by', formData.performed_by);

            // Append images
            selectedImages.forEach((image) => {
                submissionData.append('images', image);
            });

            // Append deleted image IDs
            if (deletedImageIds.length > 0) {
                submissionData.append('deleted_image_ids', JSON.stringify(deletedImageIds));
            }

            if (isEditMode) {
                await axios.put(`/asset/maintenance/${maintenance.id}`, submissionData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await axios.post('/asset/maintenance', submissionData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error saving maintenance record:', err);
            setError(err.response?.data?.message || 'Error saving maintenance record');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal asset-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
                    <div className="modal-header">
                        <h3 className="modal-title">
                            <FiTool style={{ marginRight: '8px' }} />
                            {isEditMode ? 'Edit Maintenance' : 'Add Maintenance'}
                        </h3>
                        <button className="modal-close" onClick={onClose}><FiX /></button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            {error && <div className="alert alert-error">{error}</div>}

                            <div className="form-grid">
                                <div className="form-column full-width">

                                    {/* Asset Selection - Unique to this modal */}
                                    <div className="form-group">
                                        <label className="form-label">Asset <span className="required">*</span></label>
                                        <SearchableSelect
                                            options={assets}
                                            value={formData.asset_id}
                                            onChange={(val) => setFormData({ ...formData, asset_id: val })}
                                            placeholder="Select Asset..."
                                            required
                                            disabled={isEditMode}
                                        />
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group half">
                                            <label className="form-label">Type <span className="required">*</span></label>
                                            <select
                                                name="maintenance_type"
                                                value={formData.maintenance_type}
                                                onChange={handleChange}
                                                className="form-select"
                                                required
                                            >
                                                <option value="preventive">Preventive</option>
                                                <option value="corrective">Corrective</option>
                                                <option value="inspection">Inspection</option>
                                                <option value="upgrade">Upgrade</option>
                                            </select>
                                        </div>
                                        <div className="form-group half">
                                            <label className="form-label">Status <span className="required">*</span></label>
                                            <select
                                                name="status"
                                                value={formData.status}
                                                onChange={handleChange}
                                                className="form-select"
                                                required
                                            >
                                                <option value="scheduled">Scheduled</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="completed">Completed</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group half">
                                            <label className="form-label">Date <span className="required">*</span></label>
                                            <input
                                                type="date"
                                                name="maintenance_date"
                                                value={formData.maintenance_date}
                                                onChange={handleChange}
                                                className="form-input"
                                                required
                                            />
                                        </div>
                                        <div className="form-group half">
                                            <label className="form-label">Cost (Rp)</label>
                                            <input
                                                type="text"
                                                name="cost"
                                                value={formData.cost}
                                                onChange={handleChange}
                                                className="form-input"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Performed By</label>
                                        <input
                                            type="text"
                                            name="performed_by"
                                            value={formData.performed_by}
                                            onChange={handleChange}
                                            className="form-input"
                                            placeholder="Technician or Vendor Name"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Description</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            className="form-textarea"
                                            rows="3"
                                            placeholder="Describe the maintenance activity..."
                                        ></textarea>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Next Maintenance Due</label>
                                        <input
                                            type="date"
                                            name="next_maintenance_date"
                                            value={formData.next_maintenance_date}
                                            onChange={handleChange}
                                            className="form-input"
                                        />
                                    </div>

                                    {/* Image Upload Section */}
                                    <div className="form-group">
                                        <label className="form-label">
                                            Images
                                            <span className="info-text" style={{ fontWeight: 'normal', fontSize: '0.85em', marginLeft: '5px', color: '#666' }}>
                                                (Auto-compressed, Max 1MB/img)
                                            </span>
                                        </label>

                                        <div className="upload-actions" style={{ marginBottom: '16px', display: 'flex', gap: '10px' }}>
                                            <div className="upload-btn-wrapper" style={{ flex: 1 }}>
                                                <button
                                                    type="button"
                                                    className="btn-upload btn-camera"
                                                    onClick={() => setShowCamera(true)}
                                                >
                                                    <FiCamera size={24} />
                                                    <span>Take Photo</span>
                                                </button>
                                            </div>

                                            <div className="upload-btn-wrapper" style={{ flex: 1 }}>
                                                <button
                                                    type="button"
                                                    className="btn-upload btn-gallery"
                                                    onClick={() => document.getElementById('maintenance-images').click()}
                                                >
                                                    <FiUpload size={24} />
                                                    <span>Upload Image</span>
                                                </button>
                                                <input
                                                    type="file"
                                                    id="maintenance-images"
                                                    multiple
                                                    accept="image/*"
                                                    onChange={handleImageChange}
                                                    style={{ display: 'none' }}
                                                />
                                            </div>
                                        </div>

                                        {/* Preview New Images */}
                                        {imagePreviews.length > 0 && (
                                            <div className="image-previews" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                                                {imagePreviews.map((src, index) => (
                                                    <div key={index} style={{ position: 'relative', width: '100%', paddingTop: '100%', borderRadius: '4px', overflow: 'hidden', border: '1px solid #eee' }}>
                                                        <img src={src} alt={`Preview ${index}`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeSelectedImage(index)}
                                                            style={{
                                                                position: 'absolute',
                                                                top: '4px',
                                                                right: '4px',
                                                                background: 'rgba(255,0,0,0.7)',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '50%',
                                                                width: '24px',
                                                                height: '24px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            <FiX size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Existing Images */}
                                        {existingImages.length > 0 && (
                                            <div>
                                                <label className="form-label" style={{ fontSize: '0.9em', color: '#666' }}>Existing Images</label>
                                                <div className="image-previews" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
                                                    {existingImages.map((img) => (
                                                        <div key={img.id} style={{ position: 'relative', width: '100%', paddingTop: '100%', borderRadius: '4px', overflow: 'hidden', border: '1px solid #eee' }}>
                                                            <img src={`${BASE_URL}${img.image_url}`} alt="Existing" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveExistingImage(img.id)}
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: '4px',
                                                                    right: '4px',
                                                                    background: 'rgba(255,0,0,0.7)',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '50%',
                                                                    width: '24px',
                                                                    height: '24px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                <FiTrash size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                <FiSave /> {submitting ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <CameraModal
                isOpen={showCamera}
                onClose={() => setShowCamera(false)}
                onCapture={handleCameraCapture}
            />
        </>
    );
};

export default MaintenanceModal;
