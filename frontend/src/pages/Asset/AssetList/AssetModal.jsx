import { useState, useEffect } from 'react';
import { FiX, FiSave, FiUpload, FiXCircle, FiPlus } from 'react-icons/fi';
import axios from '../../../utils/axios';
import SearchableSelect from '../../../components/Form/SearchableSelect';
import Toast from '../../../components/Toast/Toast';
import { QuickAddCategoryModal, QuickAddLocationModal, QuickAddSupplierModal } from './QuickAddModals';
import './AssetModal.css';

const AssetModal = ({ isOpen, onClose, onSuccess, assetId = null, cloneAssetId = null }) => {
    const isEditMode = !!assetId;
    const isCloneMode = !!cloneAssetId;

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [categories, setCategories] = useState([]);
    const [locations, setLocations] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    // Quick Add Modal States
    const [showQuickCategory, setShowQuickCategory] = useState(false);
    const [showQuickLocation, setShowQuickLocation] = useState(false);
    const [showQuickSupplier, setShowQuickSupplier] = useState(false);

    // Toast State
    const [toast, setToast] = useState({ message: '', type: '' });

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
            if (isEditMode) {
                if (categories.length === 0) fetchDependencies();
                fetchAsset(assetId);
            } else if (isCloneMode) {
                if (categories.length === 0) fetchDependencies();
                fetchAsset(cloneAssetId, true);
            } else {
                if (categories.length === 0) fetchDependencies();
                resetForm();
            }
        }
    }, [isOpen, assetId, cloneAssetId]);

    // Separate effect for autogenerating tag
    useEffect(() => {
        if (isOpen && !isEditMode && !formData.asset_tag) {
            fetchNextAssetTag();
        }
    }, [isOpen, isEditMode, formData.category_id, formData.location_id, formData.purchase_date, formData.asset_tag]);

    // Helper to show toast
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    const fetchNextAssetTag = async () => {
        try {
            const params = {
                category_id: formData.category_id,
                location_id: formData.location_id,
                date: formData.purchase_date
            };
            const response = await axios.get('/asset/assets/next-tag', { params });
            if (response.data.success) {
                setFormData(prev => ({
                    ...prev,
                    asset_tag: response.data.data
                }));
            }
        } catch (error) {
            console.error('Error fetching next asset tag:', error);
        }
    };

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

    const fetchAsset = async (id, isClone = false) => {
        try {
            setLoading(true);
            const response = await axios.get(`/asset/assets/${id}`);
            if (response.data.success) {
                const asset = response.data.data;
                setFormData({
                    asset_tag: isClone ? '' : asset.asset_tag, // Clear tag if cloning
                    asset_name: asset.asset_name,
                    category_id: asset.category_id || '',
                    description: asset.description || '',
                    serial_number: isClone ? '' : (asset.serial_number || ''), // Clear serial if cloning
                    model: asset.model || '',
                    manufacturer: asset.manufacturer || '',
                    purchase_date: asset.purchase_date ? asset.purchase_date.split('T')[0] : '',
                    purchase_cost: asset.purchase_cost || '',
                    supplier_id: asset.supplier_id || '',
                    warranty_expiry: asset.warranty_expiry ? asset.warranty_expiry.split('T')[0] : '',
                    location_id: asset.location_id || '',
                    status: isClone ? 'available' : asset.status, // Reset status to available if cloning
                    condition_status: asset.condition_status || 'good',
                    notes: asset.notes || ''
                });
                if (asset.image_url) {
                    const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/api$/, '');
                    setImagePreview(`${BASE_URL}${asset.image_url}`);
                    // Note: We can't easily clone the actual file object for re-upload without fetching it as blob
                    // For now, we'll keep the preview but user might need to re-upload if they want to change it
                    // Or if backend supports copying image from URL. 
                    // To keep it simple, we might want to clear image on clone or let it persist visually 
                    // but we need to handle the submission correctly.
                    // If we want to copy the image, the backend create endpoint would need to handle 'image_url' input 
                    // or we fetch blob here. 
                    // Let's clear image for now to avoid confusion or specific backend requirement complexity 
                    // unless requested otherwise.
                    if (isClone) {
                        setImagePreview(null);
                        // Optional: If we want to keep the image, we'd need to handle it.
                        // Let's leave it cleared for clean clone state as per "create new" paradigm
                    }
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

    const handleSelectChange = (name, value) => {
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

    // Quick Add Handlers
    const handleQuickCategorySuccess = (newCategory) => {
        setCategories(prev => [...prev, { id: newCategory.id, category_name: newCategory.name }]);
        handleSelectChange('category_id', newCategory.id);
        showToast('Category added successfully!', 'success');
    };

    const handleQuickLocationSuccess = (newLocation) => {
        setLocations(prev => [...prev, { id: newLocation.id, location_name: newLocation.name }]);
        handleSelectChange('location_id', newLocation.id);
        showToast('Location added successfully!', 'success');
    };

    const handleQuickSupplierSuccess = (newSupplier) => {
        setSuppliers(prev => [...prev, { id: newSupplier.id, supplier_name: newSupplier.name }]);
        handleSelectChange('supplier_id', newSupplier.id);
        showToast('Supplier added successfully!', 'success');
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
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal asset-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2 className="modal-title">
                            {isEditMode ? 'Edit Asset' : isCloneMode ? 'Clone Asset' : 'Add New Asset'}
                        </h2>
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
                                        <label className="form-label">Asset Tag </label>
                                        <input
                                            type="text"
                                            name="asset_tag"
                                            value={formData.asset_tag}
                                            onChange={handleChange}
                                            className="form-input bg-gray-50 text-gray-500 cursor-not-allowed"
                                            disabled
                                            placeholder="Automatically filled"
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
                                        <label className="form-label">Category <span className="required">*</span> </label>
                                        <div className="input-group-with-button" style={{ display: 'flex', gap: '8px' }}>
                                            <div style={{ flex: 1 }}>
                                                <SearchableSelect
                                                    options={categories.map(c => ({ value: c.id, label: c.category_name }))}
                                                    value={Number(formData.category_id)}
                                                    onChange={(value) => handleSelectChange('category_id', value)}
                                                    placeholder="Select Category"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                className="btn btn-outline btn-quick-add"
                                                onClick={() => setShowQuickCategory(true)}
                                                title="Add New Category"
                                            >
                                                <FiPlus />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Location <span className="required">*</span></label>
                                        <div className="input-group-with-button" style={{ display: 'flex', gap: '8px' }}>
                                            <div style={{ flex: 1 }}>
                                                <SearchableSelect
                                                    options={locations.map(l => ({ value: l.id, label: l.location_name }))}
                                                    value={Number(formData.location_id)}
                                                    onChange={(value) => handleSelectChange('location_id', value)}
                                                    placeholder="Select Location"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                className="btn btn-outline btn-quick-add"
                                                onClick={() => setShowQuickLocation(true)}
                                                title="Add New Location"
                                            >
                                                <FiPlus />
                                            </button>
                                        </div>
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
                                        <div className="input-group-with-button" style={{ display: 'flex', gap: '8px' }}>
                                            <div style={{ flex: 1 }}>
                                                <SearchableSelect
                                                    options={suppliers.map(s => ({ value: s.id, label: s.supplier_name }))}
                                                    value={Number(formData.supplier_id)}
                                                    onChange={(value) => handleSelectChange('supplier_id', value)}
                                                    placeholder="Select Supplier"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                className="btn btn-outline btn-quick-add"
                                                onClick={() => setShowQuickSupplier(true)}
                                                title="Add New Supplier"
                                            >
                                                <FiPlus />
                                            </button>
                                        </div>
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

            {toast.message && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ message: '', type: '' })}
                />
            )}

            <QuickAddCategoryModal
                isOpen={showQuickCategory}
                onClose={() => setShowQuickCategory(false)}
                onSuccess={handleQuickCategorySuccess}
                showToast={showToast}
            />

            <QuickAddLocationModal
                isOpen={showQuickLocation}
                onClose={() => setShowQuickLocation(false)}
                onSuccess={handleQuickLocationSuccess}
                showToast={showToast}
            />

            <QuickAddSupplierModal
                isOpen={showQuickSupplier}
                onClose={() => setShowQuickSupplier(false)}
                onSuccess={handleQuickSupplierSuccess}
                showToast={showToast}
            />
        </>
    );
};

export default AssetModal;
