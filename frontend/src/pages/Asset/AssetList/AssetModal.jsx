import { useState, useEffect } from 'react';
import { FiX, FiSave, FiUpload, FiXCircle } from 'react-icons/fi';
import axios from '../../../utils/axios';
import './AssetModal.css';

const AssetModal = ({ isOpen, onClose, onSuccess, assetId = null }) => {
    const isEditMode = !!assetId;

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [categories, setCategories] = useState([]);
    const [locations, setLocations] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    // Image state
    const [imagePreview, setImagePreview] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        asset_tag: '',
        asset_name: '',
        category_id: '',
        description: '',
        serial_number: '',
        model: '',
        manufacturer: '',
        purchase_date: '',
        purchase_cost: '',
        supplier_id: '',
        warranty_expiry: '',
        location_id: '',
        status: 'available',
        condition_status: 'good',
        notes: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchDependencies();
            if (isEditMode) {
                fetchAsset();
            } else {
                resetForm();
            }
        }
    }, [isOpen, assetId]);

    const resetForm = () => {
        setFormData({
            asset_tag: '',
            asset_name: '',
            category_id: '',
            description: '',
            serial_number: '',
            model: '',
            manufacturer: '',
            purchase_date: '',
            purchase_cost: '',
            supplier_id: '',
            warranty_expiry: '',
            location_id: '',
            status: 'available',
            condition_status: 'good',
            notes: ''
        });
        setImagePreview(null);
        setSelectedImage(null);
        setError('');
    };

    const fetchDependencies = async () => {
        try {
            const [catsRes, locsRes, suppRes] = await Promise.all([
                axios.get('/asset/categories'),
                axios.get('/asset/locations'),
                axios.get('/asset/suppliers')
            ]);

            if (catsRes.data.success) setCategories(catsRes.data.data);
            if (locsRes.data.success) setLocations(locsRes.data.data);
            if (suppRes.data.success) setSuppliers(suppRes.data.data);
        } catch (error) {
            console.error('Error fetching dependencies:', error);
            setError('Failed to load form dependencies');
        }
    };

    const fetchAsset = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/asset/assets/${assetId}`);
            if (response.data.success) {
                const asset = response.data.data;
                setFormData({
                    asset_tag: asset.asset_tag,
                    asset_name: asset.asset_name,
                    category_id: asset.category_id || '',
                    description: asset.description || '',
                    serial_number: asset.serial_number || '',
                    model: asset.model || '',
                    manufacturer: asset.manufacturer || '',
                    purchase_date: asset.purchase_date ? asset.purchase_date.split('T')[0] : '',
                    purchase_cost: asset.purchase_cost || '',
                    supplier_id: asset.supplier_id || '',
                    warranty_expiry: asset.warranty_expiry ? asset.warranty_expiry.split('T')[0] : '',
                    location_id: asset.location_id || '',
                    status: asset.status,
                    condition_status: asset.condition_status || 'good',
                    notes: asset.notes || ''
                });
                if (asset.image_url) {
                    setImagePreview(`${import.meta.env.VITE_API_URL}${asset.image_url}`);
                }
            }
        } catch (error) {
            console.error('Error fetching asset:', error);
            setError('Failed to fetch asset details');
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

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                data.append(key, formData[key]);
            });

            if (selectedImage) {
                data.append('image', selectedImage);
            }

            if (isEditMode) {
                await axios.put(`/asset/assets/${assetId}`, data);
            } else {
                await axios.post('/asset/assets', data);
            }

            onSuccess(isEditMode ? 'updated' : 'created');
            onClose();
        } catch (error) {
            console.error('Error submitting form:', error);
            setError(error.response?.data?.message || 'Failed to submit form');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal asset-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{isEditMode ? 'Edit Asset' : 'Add New Asset'}</h2>
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
                            {/* Left Column */}
                            <div className="form-column">
                                <div className="form-section-title">Basic Information</div>

                                <div className="form-group">
                                    <label className="form-label">Asset Tag <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        name="asset_tag"
                                        value={formData.asset_tag}
                                        onChange={handleChange}
                                        className="form-input"
                                        required
                                        placeholder="e.g. AST-001"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Asset Name <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        name="asset_name"
                                        value={formData.asset_name}
                                        onChange={handleChange}
                                        className="form-input"
                                        required
                                        placeholder="e.g. MacBook Pro M1"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <select
                                        name="category_id"
                                        value={formData.category_id}
                                        onChange={handleChange}
                                        className="form-select"
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.category_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Location</label>
                                    <select
                                        name="location_id"
                                        value={formData.location_id}
                                        onChange={handleChange}
                                        className="form-select"
                                    >
                                        <option value="">Select Location</option>
                                        {locations.map(loc => (
                                            <option key={loc.id} value={loc.id}>{loc.location_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-section-title">Status & Condition</div>

                                <div className="form-row">
                                    <div className="form-group half">
                                        <label className="form-label">Status</label>
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleChange}
                                            className="form-select"
                                        >
                                            <option value="available">Available</option>
                                            <option value="assigned">Assigned</option>
                                            <option value="maintenance">Maintenance</option>
                                            <option value="retired">Retired</option>
                                            <option value="lost">Lost</option>
                                        </select>
                                    </div>
                                    <div className="form-group half">
                                        <label className="form-label">Condition</label>
                                        <select
                                            name="condition_status"
                                            value={formData.condition_status}
                                            onChange={handleChange}
                                            className="form-select"
                                        >
                                            <option value="good">Good</option>
                                            <option value="fair">Fair</option>
                                            <option value="poor">Poor</option>
                                            <option value="damaged">Damaged</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="form-column">
                                <div className="form-section-title">Details</div>

                                <div className="form-row">
                                    <div className="form-group half">
                                        <label className="form-label">Model</label>
                                        <input
                                            type="text"
                                            name="model"
                                            value={formData.model}
                                            onChange={handleChange}
                                            className="form-input"
                                        />
                                    </div>
                                    <div className="form-group half">
                                        <label className="form-label">Manufacturer</label>
                                        <input
                                            type="text"
                                            name="manufacturer"
                                            value={formData.manufacturer}
                                            onChange={handleChange}
                                            className="form-input"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Serial Number</label>
                                    <input
                                        type="text"
                                        name="serial_number"
                                        value={formData.serial_number}
                                        onChange={handleChange}
                                        className="form-input"
                                    />
                                </div>

                                <div className="form-section-title">Purchase Info</div>

                                <div className="form-group">
                                    <label className="form-label">Supplier</label>
                                    <select
                                        name="supplier_id"
                                        value={formData.supplier_id}
                                        onChange={handleChange}
                                        className="form-select"
                                    >
                                        <option value="">Select Supplier</option>
                                        {suppliers.map(sup => (
                                            <option key={sup.id} value={sup.id}>{sup.supplier_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-row">
                                    <div className="form-group half">
                                        <label className="form-label">Purchase Date</label>
                                        <input
                                            type="date"
                                            name="purchase_date"
                                            value={formData.purchase_date}
                                            onChange={handleChange}
                                            className="form-input"
                                        />
                                    </div>
                                    <div className="form-group half">
                                        <label className="form-label">Cost</label>
                                        <input
                                            type="number"
                                            name="purchase_cost"
                                            value={formData.purchase_cost}
                                            onChange={handleChange}
                                            className="form-input"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Full Width Sections */}
                            <div className="form-column full-width">
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        className="form-textarea"
                                        rows="2"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Image</label>
                                    {!imagePreview ? (
                                        <div className="image-upload-area-small" onClick={() => document.getElementById('modal-image-upload').click()}>
                                            <input
                                                id="modal-image-upload"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                style={{ display: 'none' }}
                                            />
                                            <div className="upload-placeholder-content">
                                                <FiUpload className="upload-icon" />
                                                <span>Upload</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="image-preview-small">
                                            <img src={imagePreview} alt="Preview" />
                                            <button type="button" className="remove-image-btn-small" onClick={removeImage}>
                                                <FiXCircle />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submitting}
                        >
                            {submitting ? 'Saving...' : (
                                <>
                                    <FiSave />
                                    {isEditMode ? 'Update' : 'Create'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AssetModal;
