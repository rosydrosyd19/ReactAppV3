import { useState, useEffect } from 'react';
import axios from '../../../utils/axios';
import { useAuth } from '../../../contexts/AuthContext';
import CredentialModal from './CredentialModal';
import ConfirmationModal from '../../../components/Modal/ConfirmationModal';
import Toast from '../../../components/Toast/Toast';
import Pagination from '../../../components/Pagination/Pagination';
import {
    FiPlus,
    FiSearch,
    FiFilter,
    FiEdit2,
    FiTrash2,
    FiEye,
    FiEyeOff,
    FiCopy,
    FiShield
} from 'react-icons/fi';
import './CredentialList.css';

const CredentialList = () => {
    const { hasPermission } = useAuth();
    const [credentials, setCredentials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [selectedCredentialId, setSelectedCredentialId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [credentialToDelete, setCredentialToDelete] = useState(null);

    // Toast State
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Password Visibility State (per row)
    const [visiblePasswords, setVisiblePasswords] = useState({});

    useEffect(() => {
        fetchCredentials();
    }, [categoryFilter]);

    const fetchCredentials = async () => {
        try {
            setLoading(true);
            const params = {};
            if (categoryFilter) params.category = categoryFilter;
            if (search) params.search = search;

            const response = await axios.get('/asset/credentials', { params });
            if (response.data.success) {
                setCredentials(Array.isArray(response.data.data) ? response.data.data : []);
            }
        } catch (error) {
            console.error('Error fetching credentials:', error);
            setToastMessage('Failed to fetch credentials');
            setShowToast(true);
        } finally {
            setLoading(false);
        }
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCredentials();
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const handleCreateClick = () => {
        setSelectedCredentialId(null);
        setShowModal(true);
    };

    const handleEditClick = (id) => {
        setSelectedCredentialId(id);
        setShowModal(true);
    };

    const handleDeleteClick = (credential) => {
        setCredentialToDelete(credential);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!credentialToDelete) return;
        try {
            await axios.delete(`/asset/credentials/${credentialToDelete.id}`);
            setToastMessage('Credential deleted successfully');
            setShowToast(true);
            fetchCredentials();
        } catch (error) {
            console.error('Error deleting credential:', error);
            setToastMessage('Failed to delete credential');
            setShowToast(true);
        } finally {
            setShowDeleteModal(false);
            setCredentialToDelete(null);
        }
    };

    const handleModalSuccess = (message) => {
        setToastMessage(message);
        setShowToast(true);
        fetchCredentials();
    };

    const togglePasswordVisibility = (id) => {
        setVisiblePasswords(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const copyToClipboard = async (text) => {
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(text);
                setToastMessage('Copied to clipboard!');
                setShowToast(true);
            } catch (err) {
                console.error('Failed to copy credentials: ', err);
                fallbackCopyTextToClipboard(text);
            }
        } else {
            fallbackCopyTextToClipboard(text);
        }
    };

    const fallbackCopyTextToClipboard = (text) => {
        var textArea = document.createElement("textarea");
        textArea.value = text;

        // Avoid scrolling to bottom
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            var successful = document.execCommand('copy');
            if (successful) {
                setToastMessage('Copied to clipboard!');
                setShowToast(true);
            } else {
                setToastMessage('Failed to copy');
                setShowToast(true);
            }
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
            setToastMessage('Failed to copy');
            setShowToast(true);
        }

        document.body.removeChild(textArea);
    };

    // Mobile State
    const [expandedItemId, setExpandedItemId] = useState(null);

    const toggleMobileItem = (id) => {
        setExpandedItemId(expandedItemId === id ? null : id);
    };

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = Array.isArray(credentials) ? credentials.slice(indexOfFirstItem, indexOfLastItem) : [];

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="credential-list">
            <div className="page-header">
                <div>
                    <h1>Credentials</h1>
                    <p>Manage passwords and account details</p>
                </div>
                {hasPermission('asset.credentials.manage') && (
                    <button className="btn btn-primary" onClick={handleCreateClick}>
                        <FiPlus /> Add Credential
                    </button>
                )}
            </div>

            <div className="card">
                <div className="filters-bar">
                    <div className="search-form">
                        <div className="input-with-icon">
                            <FiSearch />
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Search platform, username..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="filter-group">
                        <FiFilter />
                        <select
                            className="form-select"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            <option value="social_media">Social Media</option>
                            <option value="storage">Storage</option>
                            <option value="email">Email</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner" />
                        <p>Loading credentials...</p>
                    </div>
                ) : credentials.length === 0 ? (
                    <div className="empty-state">
                        <FiShield />
                        <h3>No credentials found</h3>
                        <p>Start by adding your first credential</p>
                        {hasPermission('asset.credentials.manage') && (
                            <button className="btn btn-primary" onClick={handleCreateClick}>
                                <FiPlus /> Add Credential
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="desktop-table">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Platform</th>
                                        <th>Username</th>
                                        <th>Password</th>
                                        <th>URL</th>
                                        <th>Category</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map((cred) => (
                                        <tr key={cred.id}>
                                            <td>
                                                <div className="platform-info">
                                                    <strong>{cred.platform_name}</strong>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="copy-wrapper">
                                                    {cred.username}
                                                    {cred.username && (
                                                        <FiCopy
                                                            className="copy-icon"
                                                            title="Copy username"
                                                            onClick={() => copyToClipboard(cred.username)}
                                                        />
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="password-wrapper">
                                                    <span className="password-text">
                                                        {visiblePasswords[cred.id] ? cred.password : '••••••••'}
                                                    </span>
                                                    <button
                                                        className="btn-icon-small"
                                                        onClick={() => togglePasswordVisibility(cred.id)}
                                                        title={visiblePasswords[cred.id] ? "Hide" : "Show"}
                                                    >
                                                        {visiblePasswords[cred.id] ? <FiEyeOff /> : <FiEye />}
                                                    </button>
                                                    <button
                                                        className="btn-icon-small"
                                                        onClick={() => copyToClipboard(cred.password)}
                                                        title="Copy password"
                                                    >
                                                        <FiCopy />
                                                    </button>
                                                </div>
                                            </td>
                                            <td>
                                                {cred.url ? (
                                                    <a href={cred.url.startsWith('http') ? cred.url : `https://${cred.url}`} target="_blank" rel="noopener noreferrer">
                                                        Link
                                                    </a>
                                                ) : '-'}
                                            </td>
                                            <td>
                                                <span className="badge badge-secondary" style={{ textTransform: 'capitalize' }}>
                                                    {cred.category ? cred.category.replace('_', ' ') : 'Other'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    {hasPermission('asset.credentials.manage') && (
                                                        <>
                                                            <button
                                                                className="btn-icon"
                                                                title="Edit"
                                                                onClick={() => handleEditClick(cred.id)}
                                                            >
                                                                <FiEdit2 />
                                                            </button>
                                                            <button
                                                                className="btn-icon btn-danger"
                                                                title="Delete"
                                                                onClick={() => handleDeleteClick(cred)}
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

                        {/* Mobile List View */}
                        <div className="mobile-list">
                            {currentItems.map((cred) => (
                                <div key={cred.id} className="mobile-list-item">
                                    <div className="mobile-list-main" onClick={() => toggleMobileItem(cred.id)}>
                                        <div className="mobile-item-icon">
                                            <FiShield />
                                        </div>
                                        <div className="mobile-item-info">
                                            <div className="item-primary-text">
                                                <span className="platform-name">{cred.platform_name}</span>
                                                <span className="category-badge-small">
                                                    {cred.category ? cred.category.replace('_', ' ') : 'Other'}
                                                </span>
                                            </div>
                                            <div className="item-secondary-text">{cred.username || 'No username'}</div>
                                        </div>
                                    </div>

                                    {expandedItemId === cred.id && (
                                        <div className="mobile-list-details">
                                            <div className="detail-grid">
                                                <div className="detail-item full-width">
                                                    <span className="label">Password</span>
                                                    <div className="password-wrapper mobile-password">
                                                        <span className="password-text">
                                                            {visiblePasswords[cred.id] ? cred.password : '••••••••'}
                                                        </span>
                                                        <div className="mobile-password-actions">
                                                            <button
                                                                className="btn-icon-small"
                                                                onClick={() => togglePasswordVisibility(cred.id)}
                                                            >
                                                                {visiblePasswords[cred.id] ? <FiEyeOff /> : <FiEye />}
                                                            </button>
                                                            <button
                                                                className="btn-icon-small"
                                                                onClick={() => copyToClipboard(cred.password)}
                                                            >
                                                                <FiCopy />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {cred.url && (
                                                    <div className="detail-item full-width">
                                                        <span className="label">URL</span>
                                                        <a href={cred.url.startsWith('http') ? cred.url : `https://${cred.url}`} target="_blank" rel="noopener noreferrer" className="mobile-link">
                                                            {cred.url}
                                                        </a>
                                                    </div>
                                                )}

                                                {cred.description && (
                                                    <div className="detail-item full-width">
                                                        <span className="label">Description</span>
                                                        <span className="value">{cred.description}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mobile-actions">
                                                {hasPermission('asset.credentials.manage') && (
                                                    <>
                                                        <button
                                                            className="action-btn edit"
                                                            onClick={() => handleEditClick(cred.id)}
                                                        >
                                                            <FiEdit2 /> <span>Edit</span>
                                                        </button>
                                                        <button
                                                            className="action-btn delete"
                                                            onClick={() => handleDeleteClick(cred)}
                                                        >
                                                            <FiTrash2 /> <span>Delete</span>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <Pagination
                            currentPage={currentPage}
                            totalItems={credentials.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={paginate}
                            onItemsPerPageChange={setItemsPerPage}
                        />
                    </>
                )}
            </div>

            <CredentialModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={handleModalSuccess}
                credentialId={selectedCredentialId}
            />

            {showToast && (
                <Toast
                    message={toastMessage}
                    type="success"
                    onClose={() => setShowToast(false)}
                />
            )}

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="Delete Credential"
                message={`Are you sure you want to delete credential for "${credentialToDelete?.platform_name}"?`}
                confirmText="Delete"
                type="danger"
            />
        </div>
    );
};

export default CredentialList;
