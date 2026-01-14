import React, { useState } from 'react';
import { FiX, FiSave } from 'react-icons/fi';
import axios from '../../../utils/axios';

const BaseQuickModal = ({ isOpen, onClose, title, onSubmit, children, loading }) => {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay" style={{ zIndex: 3000 }} onClick={onClose}>
            <div className="modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    <button className="modal-close" onClick={onClose}><FiX /></button>
                </div>
                <form onSubmit={onSubmit}>
                    <div className="modal-body">
                        {children}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : <><FiSave /> Save</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const QuickAddCategoryModal = ({ isOpen, onClose, onSuccess, showToast }) => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post('/asset/categories', { category_name: name });
            if (res.data.success) {
                onSuccess({ id: res.data.data.id, name });
                setName('');
                onClose();
            }
        } catch (error) {
            console.error(error);
            showToast(error.response?.data?.message || 'Failed to create category', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <BaseQuickModal isOpen={isOpen} onClose={onClose} title="Add Category" onSubmit={handleSubmit} loading={loading}>
            <div className="form-group">
                <label className="form-label">Category Name</label>
                <input required type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Laptop" />
            </div>
        </BaseQuickModal>
    );
};

export const QuickAddLocationModal = ({ isOpen, onClose, onSuccess, showToast }) => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post('/asset/locations', { location_name: name });
            if (res.data.success) {
                onSuccess({ id: res.data.data.id, name });
                setName('');
                onClose();
            }
        } catch (error) {
            console.error(error);
            showToast(error.response?.data?.message || 'Failed to create location', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <BaseQuickModal isOpen={isOpen} onClose={onClose} title="Add Location" onSubmit={handleSubmit} loading={loading}>
            <div className="form-group">
                <label className="form-label">Location Name</label>
                <input required type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. HQ - Server Room" />
            </div>
        </BaseQuickModal>
    );
};

export const QuickAddSupplierModal = ({ isOpen, onClose, onSuccess, showToast }) => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post('/asset/suppliers', { supplier_name: name });
            if (res.data.success) {
                onSuccess({ id: res.data.data.id, name });
                setName('');
                onClose();
            }
        } catch (error) {
            console.error(error);
            showToast(error.response?.data?.message || 'Failed to create supplier', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <BaseQuickModal isOpen={isOpen} onClose={onClose} title="Add Supplier" onSubmit={handleSubmit} loading={loading}>
            <div className="form-group">
                <label className="form-label">Supplier Name</label>
                <input required type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Apple Inc." />
            </div>
        </BaseQuickModal>
    );
};

export const QuickAddCredentialCategoryModal = ({ isOpen, onClose, onSuccess, showToast }) => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post('/asset/credentials/categories', { category_name: name });
            if (res.data.success) {
                // Return id and name. Note: standard QuickAddCategoryModal returns {id, name}
                // We follow same pattern
                onSuccess({ id: res.data.data.id, name });
                setName('');
                onClose();
            }
        } catch (error) {
            console.error(error);
            showToast(error.response?.data?.message || 'Failed to create category', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <BaseQuickModal isOpen={isOpen} onClose={onClose} title="Add Credential Category" onSubmit={handleSubmit} loading={loading}>
            <div className="form-group">
                <label className="form-label">Category Name</label>
                <input required type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Server Access, SaaS" />
            </div>
        </BaseQuickModal>
    );
};
