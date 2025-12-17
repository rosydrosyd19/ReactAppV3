import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiTag, FiChevronDown, FiBox } from 'react-icons/fi';
import axios from '../../../utils/axios';
import { useAuth } from '../../../contexts/AuthContext';
import Pagination from '../../../components/Pagination/Pagination';
import ConfirmationModal from '../../../components/Modal/ConfirmationModal';
import Toast from '../../../components/Toast/Toast';
import CategoryModal from './CategoryModal';
import './CategoryList.css';

const CategoryList = () => {
    const { hasPermission } = useAuth();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null); // If null, it's Add mode. If set, Edit mode.

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);

    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Mobile expand state
    const [expandedIds, setExpandedIds] = useState([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const toggleMobileItem = (id) => {
        setExpandedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/asset/categories');
            if (response.data.success) {
                setCategories(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // Filter
    const filteredCategories = categories.filter(cat =>
        cat.category_name.toLowerCase().includes(search.toLowerCase()) ||
        cat.category_code.toLowerCase().includes(search.toLowerCase())
    );

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredCategories.slice(indexOfFirstItem, indexOfLastItem);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleAddClick = () => {
        setSelectedCategory(null);
        setShowModal(true);
    };

    const handleEditClick = (category) => {
        setSelectedCategory(category);
        setShowModal(true);
    };

    const handleDeleteClick = (category) => {
        setCategoryToDelete(category);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`/asset/categories/${categoryToDelete.id}`);
            setToastMessage('Category deleted successfully');
            setShowToast(true);
            fetchCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            // Optionally show error toast
        } finally {
            setShowDeleteModal(false);
            setCategoryToDelete(null);
        }
    };

    const handleSuccess = () => {
        setToastMessage(selectedCategory ? 'Category updated successfully' : 'Category added successfully');
        setShowToast(true);
        fetchCategories();
    };

    return (
        <div className="category-list">
            <div className="page-header">
                <div>
                    <h1>Asset Categories</h1>
                    <p>Manage asset categories and classifications</p>
                </div>
                {hasPermission('asset.categories.manage') && (
                    <button className="btn btn-primary" onClick={handleAddClick}>
                        <FiPlus /> Add Category
                    </button>
                )}
            </div>

            <div className="card">
                <div className="search-section">
                    <div className="input-with-icon">
                        <FiSearch />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search categories..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner" />
                        <p>Loading categories...</p>
                    </div>
                ) : filteredCategories.length === 0 ? (
                    <div className="empty-state">
                        <FiTag />
                        <h3>No categories found</h3>
                        <p>Try adjusting your search or add a new category.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="desktop-table">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Code</th>
                                        <th>Category Name</th>
                                        <th>Description</th>
                                        <th>Assets</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map((cat) => (
                                        <tr key={cat.id}>
                                            <td><span className="badge badge-secondary">{cat.category_code}</span></td>
                                            <td>{cat.category_name}</td>
                                            <td>{cat.description || '-'}</td>
                                            <td>{cat.asset_count} assets</td>
                                            <td>
                                                <div className="action-buttons">
                                                    {hasPermission('asset.categories.manage') && (
                                                        <>
                                                            <button
                                                                className="btn-icon"
                                                                title="Edit"
                                                                onClick={() => handleEditClick(cat)}
                                                            >
                                                                <FiEdit2 />
                                                            </button>
                                                            <button
                                                                className="btn-icon btn-danger"
                                                                title="Delete"
                                                                onClick={() => handleDeleteClick(cat)}
                                                            >
                                                                <FiTrash2 />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile List */}
                        <div className="mobile-list">
                            {currentItems.map((cat) => (
                                <div key={cat.id} className="mobile-list-item">
                                    <div className="mobile-list-main" onClick={() => toggleMobileItem(cat.id)}>
                                        <div className="mobile-category-icon">
                                            <FiTag />
                                        </div>
                                        <div className="mobile-category-info">
                                            <div className="category-primary-text">
                                                {cat.category_name}
                                                <span className="category-code-badge">{cat.category_code}</span>
                                            </div>
                                            <div className="category-secondary-text">
                                                {cat.asset_count} assets • {cat.description || 'No description'}
                                            </div>
                                        </div>
                                        <div className="mobile-expand-icon">
                                            <FiChevronDown className={expandedIds.includes(cat.id) ? 'rotated' : ''} />
                                        </div>
                                    </div>

                                    {expandedIds.includes(cat.id) && (
                                        <div className="mobile-list-details">
                                            <div className="detail-grid">
                                                <div className="detail-item">
                                                    <span className="label">Category Code</span>
                                                    <span className="value">{cat.category_code}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="label">Total Assets</span>
                                                    <span className="value">{cat.asset_count}</span>
                                                </div>
                                                <div className="detail-item full-width">
                                                    <span className="label">Description</span>
                                                    <span className="value">{cat.description || '-'}</span>
                                                </div>
                                            </div>

                                            {hasPermission('asset.categories.manage') && (
                                                <div className="mobile-actions">
                                                    <button
                                                        className="action-btn edit"
                                                        onClick={() => handleEditClick(cat)}
                                                    >
                                                        <FiEdit2 /> <span>Edit</span>
                                                    </button>
                                                    <button
                                                        className="action-btn delete"
                                                        onClick={() => handleDeleteClick(cat)}
                                                    >
                                                        <FiTrash2 /> <span>Delete</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <Pagination
                            currentPage={currentPage}
                            totalItems={filteredCategories.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={paginate}
                            onItemsPerPageChange={setItemsPerPage}
                        />
                    </>
                )}
            </div>

            <CategoryModal
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
                message={`Are you sure you want to delete "${categoryToDelete?.category_name}"?`}
                confirmText="Delete"
                type="danger"
            />

            {showToast && (
                <Toast
                    message={toastMessage}
                    type="success"
                    onClose={() => setShowToast(false)}
                />
            )}
        </div>
    );
};

export default CategoryList;
