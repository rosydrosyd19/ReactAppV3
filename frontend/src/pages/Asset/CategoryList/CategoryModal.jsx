import React, { useState, useEffect } from 'react';
import { FiX, FiSave } from 'react-icons/fi';
import axios from '../../../utils/axios';
import './CategoryModal.css';

const CategoryModal = ({ isOpen, onClose, onSuccess, category = null }) => {
    const isEdit = !!category;
    const [formData, setFormData] = useState({
        category_name: '',
        description: '',
        icon: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (category) {
                setFormData({
                    category_name: category.category_name || '',
                    description: category.description || '',
                    icon: category.icon || ''
                });
            } else {
                setFormData({
                    category_name: '',
                    description: '',
                    icon: ''
                });
            }
            setError('');
        }
    }, [isOpen, category]);

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

        if (!formData.category_name.trim()) {
            setError('Category Name is required');
            return;
        }

        setLoading(true);
        try {
            if (isEdit) {
                await axios.put(`/asset/categories/${category.id}`, formData);
            } else {
                await axios.post('/asset/categories', formData);
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error saving category:', err);
            setError(err.response?.data?.message || 'Failed to save category');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal category-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{isEdit ? 'Edit Category' : 'Add Category'}</h2>
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
                                <label className="form-label">Category Name *</label>
                                <input
                                    type="text"
                                    name="category_name"
                                    className="form-input"
                                    value={formData.category_name}
                                    onChange={handleChange}
                                    placeholder="e.g. Laptop, Keyboard"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    name="description"
                                    className="form-input"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Optional description..."
                                    rows={3}
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

export default CategoryModal;
