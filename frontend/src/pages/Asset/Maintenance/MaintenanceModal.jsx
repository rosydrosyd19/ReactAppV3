import { useState, useEffect } from 'react';
import axios from '../../../utils/axios';
import { FiX, FiSave, FiTool } from 'react-icons/fi';
import SearchableSelect from '../../../components/Form/SearchableSelect';
import '../AssetList/AssetModal.css'; // Reuse styles from AssetList

const MaintenanceModal = ({ isOpen, onClose, onSuccess, maintenance = null }) => {
    const isEditMode = !!maintenance;
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [assets, setAssets] = useState([]);

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

    useEffect(() => {
        if (isOpen) {
            fetchAssets();
            if (maintenance) {
                setFormData({
                    asset_id: maintenance.asset_id,
                    maintenance_type: maintenance.maintenance_type || 'preventive',
                    maintenance_date: maintenance.maintenance_date ? maintenance.maintenance_date.split('T')[0] : '',
                    cost: maintenance.cost ? formatNumber(Math.floor(Number(maintenance.cost))) : '',
                    description: maintenance.description || '',
                    next_maintenance_date: maintenance.next_maintenance_date ? maintenance.next_maintenance_date.split('T')[0] : '',
                    status: maintenance.status || 'scheduled',
                    performed_by: maintenance.performed_by || ''
                });
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
            }
            setError('');
        }
    }, [isOpen, maintenance]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            // Parse cost back to number for submission
            const rawCost = formData.cost ? formData.cost.toString().replace(/\./g, '') : null;

            const payload = {
                ...formData,
                cost: rawCost ? Number(rawCost) : null
            };

            if (isEditMode) {
                await axios.put(`/asset/maintenance/${maintenance.id}`, payload);
            } else {
                await axios.post('/asset/maintenance', payload);
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
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal asset-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
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
    );
};

export default MaintenanceModal;
