import { useState, useEffect } from 'react';
import axios from '../../../utils/axios';
import { FiX, FiSave } from 'react-icons/fi';
import Toast from '../../../components/Toast/Toast';

const CredentialCategoryModal = ({ isOpen, onClose, onSuccess, category = null }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (category) {
                setName(category.category_name);
                setDescription(category.description || '');
            } else {
                setName('');
                setDescription('');
            }
            setError('');
        }
    }, [isOpen, category]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (category) {
                // Update
                const res = await axios.put(`/asset/credentials/categories/${category.id}`, { category_name: name, description });
                if (res.data.success) {
                    onSuccess('Category updated successfully');
                    onClose();
                }
            } else {
                // Create
                const res = await axios.post('/asset/credentials/categories', { category_name: name, description });
                if (res.data.success) {
                    onSuccess('Category created successfully');
                    onClose();
                }
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to save category');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{category ? 'Edit Category' : 'Add Category'}</h2>
                    <button className="modal-close" onClick={onClose}><FiX /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && <div className="alert alert-error">{error}</div>}
                        <div className="form-group">
                            <label className="form-label">Category Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Server, Database, SaaS"
                                required
                                autoFocus
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea
                                className="form-input"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Optional description..."
                                rows="3"
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            <FiSave style={{ marginRight: '8px' }} /> {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CredentialCategoryModal;
