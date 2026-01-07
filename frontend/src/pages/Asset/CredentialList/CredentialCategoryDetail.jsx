import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from '../../../utils/axios';
import { useAuth } from '../../../contexts/AuthContext';
import {
    FiArrowLeft,
    FiEdit2,
    FiTrash2,
    FiLock,
    FiGrid,
    FiSearch,
    FiEye,
    FiUser,
    FiCalendar
} from 'react-icons/fi';
import CredentialCategoryModal from './CredentialCategoryModal';
import ConfirmationModal from '../../../components/Modal/ConfirmationModal';
import Toast from '../../../components/Toast/Toast';
import '../CategoryDetail/CategoryDetail.css'; // Reusing CategoryDetail styles for consistency

const CredentialCategoryDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { hasPermission } = useAuth();

    // Data states
    const [category, setCategory] = useState(null);
    const [credentials, setCredentials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        fetchCategoryData();
    }, [id]);

    const fetchCategoryData = async () => {
        try {
            setLoading(true);
            // Fetch category details
            const catRes = await axios.get(`/asset/credentials/categories/${id}`);
            if (!catRes.data.success) throw new Error('Failed to load category');
            setCategory(catRes.data.data);

            // Fetch credentials in this category
            // Assuming we filter by category name or id. 
            // The category object from backend has "category_name". 
            // The GET /asset/credentials accepts "category" query param which matches "category" column string in credentials table.

            const credRes = await axios.get(`/asset/credentials`, {
                params: { category: catRes.data.data.category_name }
            });
            if (credRes.data.success) {
                setCredentials(credRes.data.data);
            }
        } catch (err) {
            console.error('Error fetching detail:', err);
            setError(err.message || 'Error loading data');
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = () => {
        setShowEditModal(true);
    };

    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`/asset/credentials/categories/${id}`);
            setToastMessage('Category deleted successfully');
            setShowToast(true);
            setTimeout(() => {
                navigate('/asset/credential-categories');
            }, 1000);
        } catch (error) {
            console.error('Error deleting category:', error);
            // Optionally show error toast
        } finally {
            setShowDeleteModal(false);
        }
    };

    const handleEditSuccess = () => {
        setToastMessage('Category updated successfully');
        setShowToast(true);
        fetchCategoryData();
        setShowEditModal(false);
    };

    if (loading) return (
        <div className="loading-container">
            <div className="loading-spinner" />
        </div>
    );

    if (error || !category) return (
        <div className="error-container">
            <h3>Error</h3>
            <p>{error || 'Category not found'}</p>
            <button className="btn btn-primary" onClick={() => navigate('/asset/credential-categories')}>
                <FiArrowLeft /> Back
            </button>
        </div>
    );

    return (
        <div className="category-detail-container">
            {/* Header */}
            <div className="detail-header">
                <div className="header-left">
                    <button className="btn btn-outline back-btn" onClick={() => navigate('/asset/credential-categories')}>
                        <FiArrowLeft /> <span className="back-text">Back</span>
                    </button>
                    <div className="header-title" style={{ marginTop: '0rem' }}>
                        <h1>
                            <FiGrid className="text-primary" />
                            {category.category_name}
                        </h1>
                        <p>{category.description || 'No description provided'}</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="header-actions">
                    <button className="btn btn-outline" onClick={handleEditClick}>
                        <FiEdit2 /> Edit
                    </button>
                    <button className="btn btn-danger" onClick={handleDeleteClick}>
                        <FiTrash2 /> Delete
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="stats-grid">
                <div className="stat-card mobile-border-free">
                    <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                        <FiLock />
                    </div>
                    <div className="stat-info">
                        <h3>Total Credentials</h3>
                        <p>{credentials.length}</p>
                    </div>
                </div>
            </div>

            {/* Credentials List Table */}
            <div className="card">
                <div className="card-header">
                    <h2><FiLock /> Credentials in this Category</h2>
                </div>
                <div className="assets-table-wrapper">
                    <table className="assets-table">
                        <thead>
                            <tr>
                                <th>Platform</th>
                                <th>Username</th>
                                <th>URL</th>
                                <th>Status</th>
                                <th>Public</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {credentials.length > 0 ? (
                                credentials.map(cred => (
                                    <tr key={cred.id}>
                                        <td><strong>{cred.platform_name}</strong></td>
                                        <td>{cred.username}</td>
                                        <td>
                                            <a href={cred.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                                {cred.url || '-'}
                                            </a>
                                        </td>
                                        <td>
                                            <span className={`badge ${cred.status === 'assigned' ? 'badge-primary' : 'badge-success'}`}>
                                                {cred.status || 'Available'}
                                            </span>
                                        </td>
                                        <td>
                                            {cred.is_public ? <span className="badge badge-warning">Public</span> : <span className="badge badge-secondary">Private</span>}
                                        </td>
                                        <td onClick={(e) => e.stopPropagation()}>
                                            <div className="action-buttons">
                                                <button
                                                    className="btn-icon"
                                                    title="View Details"
                                                    onClick={() => navigate(`/asset/credentials/${cred.id}`, { state: { from: location.pathname } })}
                                                >
                                                    <FiEye />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                        <FiLock style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block', margin: '0 auto 0.5rem' }} />
                                        No credentials found in this category
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Credentials List */}
                <div className="mobile-assets-list">
                    {credentials.length > 0 ? (
                        credentials.map(cred => (
                            <div key={cred.id} className="mobile-asset-card" onClick={() => navigate(`/asset/credentials/${cred.id}`, { state: { from: location.pathname } })}>
                                <div className="mobile-card-header">
                                    <div className="mobile-card-title">
                                        <span className="mobile-asset-tag">{cred.username}</span>
                                        <h3 className="mobile-asset-name">{cred.platform_name}</h3>
                                    </div>
                                    <span className={`badge ${cred.status === 'assigned' ? 'badge-primary' : 'badge-success'}`}>
                                        {cred.status || 'Available'}
                                    </span>
                                </div>
                                <div className="mobile-card-body">
                                    <div className="mobile-info-row">
                                        <span className="text-secondary">URL:</span>
                                        <a href={cred.url} target="_blank" rel="noopener noreferrer" className="text-primary truncate" onClick={(e) => e.stopPropagation()}>
                                            {cred.url || '-'}
                                        </a>
                                    </div>

                                </div>
                                <div className="mobile-card-actions">
                                    <button
                                        className="btn btn-outline btn-sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/asset/credentials/${cred.id}`, { state: { from: location.pathname } });
                                        }}
                                    >
                                        <FiEye /> View Details
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <FiLock />
                            <p>No credentials found in this category</p>
                        </div>
                    )}
                </div>
            </div>

            <CredentialCategoryModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSuccess={handleEditSuccess}
                category={category}
            />

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="Delete Category"
                message={`Are you sure you want to delete "${category.category_name}"?`}
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

export default CredentialCategoryDetail;
