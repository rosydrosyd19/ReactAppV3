import { useState, useEffect } from 'react';
import axios from '../../../utils/axios';
import { FiX, FiSave } from 'react-icons/fi';
import SearchableSelect from '../../../components/Form/SearchableSelect';

const MaintenanceModal = ({ isOpen, onClose, onSuccess, maintenance = null }) => {
    const [formData, setFormData] = useState({
        asset_id: '',
        maintenance_type: '',
        maintenance_date: '',
        cost: '',
        description: '',
        next_maintenance_date: '',
        status: 'scheduled',
        performed_by: '' // Currently text, could be user select if needed
    });
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchAssets();
            if (maintenance) {
                setFormData({
                    asset_id: maintenance.asset_id,
                    maintenance_type: maintenance.maintenance_type,
                    maintenance_date: maintenance.maintenance_date ? maintenance.maintenance_date.split('T')[0] : '',
                    cost: maintenance.cost || '',
                    description: maintenance.description || '',
                    next_maintenance_date: maintenance.next_maintenance_date ? maintenance.next_maintenance_date.split('T')[0] : '',
                    status: maintenance.status,
                    performed_by: maintenance.performed_by || ''
                });
            } else {
                setFormData({
                    asset_id: '',
                    maintenance_type: '',
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (maintenance) {
                await axios.put(`/asset/maintenance/${maintenance.id}`, formData);
            } else {
                await axios.post('/asset/maintenance', formData);
            }
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Error saving maintenance record');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <div className="modal-header">
                    <h3 className="modal-title">{maintenance ? 'Edit Maintenance' : 'Add Maintenance'}</h3>
                    <button className="modal-close" onClick={onClose}><FiX /></button>
                </div>
                <div className="modal-body">
                    {error && <div className="alert alert-error">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Asset *</label>
                            <SearchableSelect
                                options={assets}
                                value={assets.find(a => a.value === formData.asset_id)}
                                onChange={(opt) => setFormData({ ...formData, asset_id: opt ? opt.value : '' })}
                                placeholder="Select Asset..."
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Maintenance Type *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.maintenance_type}
                                onChange={(e) => setFormData({ ...formData, maintenance_type: e.target.value })}
                                placeholder="e.g. Repair, Prevention, Upgrade"
                                required
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Date *</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.maintenance_date}
                                    onChange={(e) => setFormData({ ...formData, maintenance_date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Status *</label>
                                <select
                                    className="form-select"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="scheduled">Scheduled</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Cost</label>
                            <input
                                type="number"
                                className="form-input"
                                value={formData.cost}
                                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Performed By</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.performed_by}
                                onChange={(e) => setFormData({ ...formData, performed_by: e.target.value })}
                                placeholder="Technician or Vendor Name"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea
                                className="form-textarea"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows="3"
                            ></textarea>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Next Maintenance Date</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.next_maintenance_date}
                                onChange={(e) => setFormData({ ...formData, next_maintenance_date: e.target.value })}
                            />
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                <FiSave /> {loading ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceModal;
