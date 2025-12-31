import { useState, useEffect } from 'react';
import { FiX, FiSave, FiTool } from 'react-icons/fi';
import axios from '../../../utils/axios';
import Toast from '../../../components/Toast/Toast';
import './AssetModal.css'; // Reusing styles

const MaintenanceModal = ({ isOpen, onClose, onSuccess, assetId, maintenanceId = null, initialData = null }) => {
    const isEditMode = !!maintenanceId;
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        maintenance_type: 'preventive',
        maintenance_date: new Date().toISOString().split('T')[0],
        performed_by: '',
        cost: '',
        description: '',
        next_maintenance_date: '',
        status: 'scheduled'
    });

    // Helper to format number with dots
    const formatNumber = (val) => {
        if (!val) return '';
        // Ensure string and remove existing non-digits first to clean
        const stringVal = val.toString().replace(/\D/g, '');
        return stringVal.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    maintenance_type: initialData.maintenance_type || 'preventive',
                    maintenance_date: initialData.maintenance_date ? initialData.maintenance_date.split('T')[0] : '',
                    performed_by: initialData.performed_by || '',
                    cost: initialData.cost ? formatNumber(Math.floor(Number(initialData.cost))) : '',
                    description: initialData.description || '',
                    next_maintenance_date: initialData.next_maintenance_date ? initialData.next_maintenance_date.split('T')[0] : '',
                    status: initialData.status || 'scheduled'
                });
            } else {
                setFormData({
                    maintenance_type: 'preventive',
                    maintenance_date: new Date().toISOString().split('T')[0],
                    performed_by: '',
                    cost: '',
                    description: '',
                    next_maintenance_date: '',
                    status: 'scheduled'
                });
            }
            setError('');
        }
    }, [isOpen, initialData, maintenanceId]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            // Parse cost back to number for submission (remove dots)
            const rawCost = formData.cost ? formData.cost.toString().replace(/\./g, '') : null;

            const payload = {
                asset_id: assetId,
                ...formData,
                cost: rawCost ? Number(rawCost) : null
            };

            if (isEditMode) {
                await axios.put(`/asset/maintenance/${maintenanceId}`, payload);
            } else {
                await axios.post('/asset/maintenance', payload);
            }

            onSuccess(isEditMode ? 'Maintenance updated' : 'Maintenance scheduled');
            onClose();
        } catch (error) {
            console.error('Error submitting maintenance:', error);
            const errorMsg = error.response?.data?.message || 'Failed to submit maintenance record';
            const detailedError = error.response?.data?.error ? ` (${error.response.data.error})` : '';
            setError(errorMsg + detailedError);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal asset-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        <FiTool style={{ marginRight: '8px' }} />
                        {isEditMode ? 'Update Maintenance' : 'Schedule Maintenance'}
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
                            <div className="form-column full-width">
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
                                    />
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
                                    {isEditMode ? 'Update Record' : 'Schedule Maintenance'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MaintenanceModal;
