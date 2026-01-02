import { useState, useEffect } from 'react';
import axios from '../../../utils/axios';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiFolder, FiLock, FiChevronDown } from 'react-icons/fi';
import Toast from '../../../components/Toast/Toast';
import ConfirmationModal from '../../../components/Modal/ConfirmationModal';
import CredentialCategoryModal from './CredentialCategoryModal';
import '../AssetList/AssetList.css'; // Reusing AssetList styles for consistency

const CredentialCategoryList = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });
    const [expandedItemId, setExpandedItemId] = useState(null);

    const toggleMobileItem = (id) => {
        setExpandedItemId(expandedItemId === id ? null : id);
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/asset/credentials/categories');
            if (response.data.success) {
                setCategories(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            showToast('Failed to fetch categories', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setSelectedCategory(null);
        setShowModal(true);
    };

    const handleEdit = (category) => {
        setSelectedCategory(category);
        setShowModal(true);
    };

    const handleDeleteClick = (category) => {
        setCategoryToDelete(category);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            const response = await axios.delete(`/asset/credentials/categories/${categoryToDelete.id}`);
            if (response.data.success) {
                showToast('Category deleted successfully', 'success');
                fetchCategories();
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            showToast(error.response?.data?.message || 'Failed to delete category', 'error');
        } finally {
            setShowDeleteModal(false);
            setCategoryToDelete(null);
        }
    };

    const handleSuccess = (message) => {
        showToast(message, 'success');
        fetchCategories();
    };

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };

    const filteredCategories = categories.filter(cat =>
        cat.category_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="asset-list">
            <div className="page-header">
                <div>
                    <h1>Credential Categories</h1>
                    <p>Manage categories for digital assets and credentials</p>
                </div>
                <button className="btn btn-primary" onClick={handleAdd}>
                    <FiPlus /> Add Category
                </button>
            </div>

            <div className="card">
                <div className="filters-bar">
                    <div className="search-form">
                        <div className="input-with-icon">
                            <FiSearch />
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Search categories..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="desktop-table">
                    {loading ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>Loading categories...</p>
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Created At</th>
                                    <th style={{ width: '150px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCategories.length > 0 ? (
                                    filteredCategories.map((category) => (
                                        <tr key={category.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div className="icon-placeholder" style={{ background: 'var(--bg-secondary)', padding: '8px', borderRadius: '8px', display: 'flex' }}>
                                                        <FiLock color="var(--primary-color)" />
                                                    </div>
                                                    <span style={{ fontWeight: 500 }}>{category.category_name}</span>
                                                </div>
                                            </td>
                                            <td>{new Date(category.created_at).toLocaleDateString()}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="btn-icon"
                                                        onClick={() => handleEdit(category)}
                                                        title="Edit"
                                                    >
                                                        <FiEdit2 />
                                                    </button>
                                                    <button
                                                        className="btn-icon btn-danger"
                                                        onClick={() => handleDeleteClick(category)}
                                                        title="Delete"
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="empty-state">
                                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                                <FiFolder size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                                <p>No categories found</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Mobile List View */}
                <div className="mobile-list">
                    {filteredCategories.map((category) => (
                        <div key={category.id} className="mobile-list-item">
                            <div className="mobile-list-main" onClick={() => toggleMobileItem(category.id)}>
                                <div className="mobile-asset-icon">
                                    <FiLock />
                                </div>
                                <div className="mobile-asset-info">
                                    <div className="asset-primary-text">
                                        <span className="asset-tag" style={{ fontSize: '16px' }}>{category.category_name}</span>
                                    </div>
                                    <div className="asset-secondary-text">
                                        Created: {new Date(category.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="mobile-expand-icon">
                                    <FiChevronDown className={expandedItemId === category.id ? 'rotated' : ''} />
                                </div>
                            </div>

                            {expandedItemId === category.id && (
                                <div className="mobile-list-details">
                                    <div className="mobile-actions">
                                        <button
                                            className="action-btn edit"
                                            onClick={() => handleEdit(category)}
                                        >
                                            <FiEdit2 /> <span>Edit</span>
                                        </button>
                                        <button
                                            className="action-btn delete"
                                            onClick={() => handleDeleteClick(category)}
                                        >
                                            <FiTrash2 /> <span>Delete</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {filteredCategories.length === 0 && !loading && (
                        <div className="empty-state">
                            <FiFolder size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <p>No categories found</p>
                        </div>
                    )}
                </div>
            </div>

            <CredentialCategoryModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={handleSuccess}
                category={selectedCategory}
            />

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="Delete Category"
                message={`Are you sure you want to delete "${categoryToDelete?.category_name}"? This action cannot be undone.`}
            />

            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}
        </div>
    );
};

export default CredentialCategoryList;
