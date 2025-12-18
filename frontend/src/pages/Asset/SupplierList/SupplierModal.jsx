import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import axios from '../../../utils/axios';
import './SupplierModal.css';

const SupplierModal = ({ isOpen, onClose, onSuccess, supplier = null }) => {
    const [formData, setFormData] = useState({
        supplier_name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        website: '',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (supplier) {
                setFormData({
                    supplier_name: supplier.supplier_name || '',
                    contact_person: supplier.contact_person || '',
                    email: supplier.email || '',
                    phone: supplier.phone || '',
                    address: supplier.address || '',
                    website: supplier.website || '',
                    notes: supplier.notes || ''
                });
            } else {
                setFormData({
                    supplier_name: '',
                    contact_person: '',
                    email: '',
                    phone: '',
                    address: '',
                    website: '',
                    notes: ''
                });
            }
            setError('');
        }
    }, [isOpen, supplier]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (supplier) {
                await axios.put(`/asset/suppliers/${supplier.id}`, formData);
            } else {
                await axios.post('/asset/suppliers', formData);
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error saving supplier:', err);
            setError(err.response?.data?.message || 'Error saving supplier');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal supplier-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{supplier ? 'Edit Supplier' : 'Add Supplier'}</h2>
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
                                <label className="form-label">Supplier Name <span>*</span></label>
                                <input
                                    type="text"
                                    name="supplier_name"
                                    className="form-input"
                                    value={formData.supplier_name}
                                    onChange={handleChange}
                                    placeholder="e.g. PT Mitra Teknologi"
                                    required
                                />
                            </div>

                            <div className="grid-cols-2">
                                <div className="form-group">
                                    <label className="form-label">Contact Person</label>
                                    <input
                                        type="text"
                                        name="contact_person"
                                        className="form-input"
                                        value={formData.contact_person}
                                        onChange={handleChange}
                                        placeholder="e.g. John Doe"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        className="form-input"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="e.g. 08123456789"
                                    />
                                </div>
                            </div>

                            <div className="grid-cols-2">
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        className="form-input"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="e.g. contact@company.com"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Website</label>
                                    <input
                                        type="text"
                                        name="website"
                                        className="form-input"
                                        value={formData.website}
                                        onChange={handleChange}
                                        placeholder="https://"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Address</label>
                                <textarea
                                    name="address"
                                    className="form-input"
                                    value={formData.address}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="e.g. Jl. Sudirman No. 123, Jakarta"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Notes</label>
                                <textarea
                                    name="notes"
                                    className="form-input"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows="2"
                                    placeholder="Additional notes..."
                                />
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
                            {loading ? 'Saving...' : (supplier ? 'Update Supplier' : 'Add Supplier')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SupplierModal;
