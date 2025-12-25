import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../utils/axios';
import { useAuth } from '../../../contexts/AuthContext';
import CredentialModal from './CredentialModal';
import CredentialCheckOutModal from './CredentialCheckOutModal';
import CredentialCheckInModal from './CredentialCheckInModal';
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
    FiShield,
    FiMonitor,
    FiDatabase,
    FiMail,
    FiBox,
    FiCheckCircle,
    FiLogOut,
    FiMoreVertical,
    FiExternalLink
} from 'react-icons/fi';
import './CredentialList.css';

const CredentialList = () => {
    const navigate = useNavigate();
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

    const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);
    const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
    // Close dropdown when clicking outside
    const [selectedCredential, setSelectedCredential] = useState(null);
    const [activeDropdownId, setActiveDropdownId] = useState(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (activeDropdownId && !event.target.closest('.action-dropdown-container')) {
                setActiveDropdownId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeDropdownId]);

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

    const toggleDropdown = (id) => {
        setActiveDropdownId(activeDropdownId === id ? null : id);
    };

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = Array.isArray(credentials) ? credentials.slice(indexOfFirstItem, indexOfLastItem) : [];

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleOpenCheckOut = (credential) => {
        setSelectedCredential(credential);
        setIsCheckOutModalOpen(true);
    };

    const handleOpenCheckIn = (credential) => {
        setSelectedCredential(credential);
        setIsCheckInModalOpen(true);
    };

    const handleCloseCheckOut = () => {
        setIsCheckOutModalOpen(false);
        setSelectedCredential(null);
    };

    const handleCloseCheckIn = () => {
        setIsCheckInModalOpen(false);
        setSelectedCredential(null);
    };

    const handleActionSuccess = () => {
        fetchCredentials();
        setToastMessage('Action successfully completed');
        setShowToast(true);
    };

    const getAssignedUsers = (item) => {
        const assignments = [];

        if (item.assigned_ids) {
            const ids = item.assigned_ids.toString().split(',');
            const names = item.assigned_names ? item.assigned_names.split(', ') : [];
            const usernames = item.assigned_usernames ? item.assigned_usernames.split(', ') : [];

            ids.forEach((id, index) => {
                assignments.push({
                    id: id,
                    name: names[index] || usernames[index] || 'Unknown User',
                    type: 'user'
                });
            });
        }

        if (item.assigned_asset_ids) {
            const ids = item.assigned_asset_ids.toString().split(',');
            const names = item.assigned_asset_names ? item.assigned_asset_names.split(', ') : [];

            ids.forEach((id, index) => {
                assignments.push({
                    id: id,
                    name: names[index] || 'Unknown Asset',
                    type: 'asset'
                });
            });
        }

        return assignments;
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'social_media':
                return <FiMonitor />;
            case 'storage':
                return <FiDatabase />;
            case 'email':
                return <FiMail />;
            case 'other':
            default:
                return <FiBox />;
        }
    };

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
                                        <th>Category</th>
                                        <th>Status</th>
                                        <th>Assigned To</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map((item) => (
                                        <tr key={item.id}>
                                            <td>
                                                <div className="platform-info">
                                                    <div>
                                                        <div className="platform-name">{item.platform_name}</div>
                                                        {item.url && (
                                                            <a
                                                                href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="platform-url-icon"
                                                                title={item.url}
                                                            >
                                                                <FiExternalLink />
                                                            </a >
                                                        )}
                                                    </div >
                                                </div >
                                            </td >
                                            <td>
                                                <div className="copy-wrapper">
                                                    {item.username}
                                                    {item.username && (
                                                        <FiCopy
                                                            className="copy-icon"
                                                            title="Copy username"
                                                            onClick={() => copyToClipboard(item.username)}
                                                        />
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="password-wrapper">
                                                    <span className="password-text">
                                                        {visiblePasswords[item.id] ? item.password : '••••••••'}
                                                    </span>
                                                    <button
                                                        className="btn-icon-small"
                                                        onClick={() => togglePasswordVisibility(item.id)}
                                                        title={visiblePasswords[item.id] ? "Hide" : "Show"}
                                                    >
                                                        {visiblePasswords[item.id] ? <FiEyeOff /> : <FiEye />}
                                                    </button>
                                                    <button
                                                        className="btn-icon-small"
                                                        onClick={() => copyToClipboard(item.password)}
                                                        title="Copy password"
                                                    >
                                                        <FiCopy />
                                                    </button>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge badge-secondary`} style={{ textTransform: 'capitalize' }}>
                                                    {item.category ? item.category.replace('_', ' ') : 'Other'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${item.status || 'available'}`}>
                                                    {item.status || 'available'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="assigned-info" style={{ fontSize: '13px' }}>
                                                    {item.assigned_names && (
                                                        <div>
                                                            <strong>Pop: {item.assigned_names}</strong>
                                                        </div>
                                                    )}
                                                    {item.assigned_asset_names && (
                                                        <div>
                                                            <strong>Asset: {item.assigned_asset_names}</strong>
                                                        </div>
                                                    )}
                                                    {!item.assigned_names && !item.assigned_asset_names && '-'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    {hasPermission('asset.credentials.manage') && (
                                                        <>
                                                            <button
                                                                className="btn-icon"
                                                                title="View Details"
                                                                onClick={() => navigate(`/asset/credentials/${item.id}`)}
                                                            >
                                                                <FiEye />
                                                            </button>
                                                            <button
                                                                className="btn-icon"
                                                                title="Edit"
                                                                onClick={() => handleEditClick(item.id)}
                                                            >
                                                                <FiEdit2 />
                                                            </button>
                                                            <button
                                                                className="btn-icon btn-danger"
                                                                title="Delete"
                                                                onClick={() => handleDeleteClick(item)}
                                                            >
                                                                <FiTrash2 />
                                                            </button>

                                                            <div className="action-dropdown-container" style={{ position: 'relative' }}>
                                                                <button
                                                                    className="btn-icon"
                                                                    onClick={() => toggleDropdown(item.id)}
                                                                    title="More Actions"
                                                                >
                                                                    <FiMoreVertical />
                                                                </button>
                                                                {activeDropdownId === item.id && (
                                                                    <div className="action-dropdown-menu">
                                                                        <button
                                                                            className="dropdown-item"
                                                                            onClick={() => {
                                                                                navigate(`/asset/credentials/${item.id}`);
                                                                                setActiveDropdownId(null);
                                                                            }}
                                                                        >
                                                                            <FiEye /> View Details
                                                                        </button>
                                                                        <button
                                                                            className="dropdown-item"
                                                                            onClick={() => {
                                                                                handleOpenCheckOut(item);
                                                                                setActiveDropdownId(null);
                                                                            }}
                                                                        >
                                                                            <FiLogOut className="text-primary" /> Check Out
                                                                        </button>
                                                                        {item.status !== 'available' && (
                                                                            <button
                                                                                className="dropdown-item"
                                                                                onClick={() => {
                                                                                    handleOpenCheckIn(item);
                                                                                    setActiveDropdownId(null);
                                                                                }}
                                                                            >
                                                                                <FiCheckCircle className="text-warning" /> Check In
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr >
                                    ))}
                                </tbody >
                            </table >
                        </div >

                        {/* Mobile List View */}
                        < div className="mobile-list" >
                            {
                                currentItems.map((item) => (
                                    <div key={item.id} className="mobile-list-item">
                                        <div className="mobile-list-main" onClick={() => toggleMobileItem(item.id)}>
                                            <div className="mobile-item-icon">
                                                {getCategoryIcon(item.category)}
                                            </div>
                                            <div className="mobile-item-info">
                                                <div className="item-primary-text">
                                                    <span className="platform-name">{item.platform_name}</span>
                                                    <span className="category-badge-small">
                                                        {item.category ? item.category.replace('_', ' ') : 'Other'}
                                                    </span>
                                                </div>
                                                <div className="item-secondary-text">{item.username || 'No username'}</div>
                                            </div>
                                        </div>

                                        {expandedItemId === item.id && (
                                            <div className="mobile-list-details">
                                                <div className="detail-grid">
                                                    <div className="detail-item full-width">
                                                        <span className="label">Password</span>
                                                        <div className="password-wrapper mobile-password">
                                                            <span className="password-text">
                                                                {visiblePasswords[item.id] ? item.password : '••••••••'}
                                                            </span>
                                                            <div className="mobile-password-actions">
                                                                <button
                                                                    className="btn-icon-small"
                                                                    onClick={() => togglePasswordVisibility(item.id)}
                                                                >
                                                                    {visiblePasswords[item.id] ? <FiEyeOff /> : <FiEye />}
                                                                </button>
                                                                <button
                                                                    className="btn-icon-small"
                                                                    onClick={() => copyToClipboard(item.password)}
                                                                >
                                                                    <FiCopy />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {item.url && (
                                                        <div className="detail-item full-width">
                                                            <span className="label">URL</span>
                                                            <a
                                                                href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="mobile-link"
                                                            >
                                                                {item.url}
                                                            </a>
                                                        </div>
                                                    )}

                                                    {item.description && (
                                                        <div className="detail-item full-width">
                                                            <span className="label">Description</span>
                                                            <span className="value">{item.description}</span>
                                                        </div>
                                                    )}

                                                    <div className="detail-item">
                                                        <span className="label">Status</span>
                                                        <span className={`status-badge ${item.status || 'available'}`} style={{ width: 'fit-content' }}>
                                                            {item.status || 'available'}
                                                        </span>
                                                    </div>
                                                    {item.assigned_names && (
                                                        <div className="detail-item">
                                                            <span className="label">Assigned To</span>
                                                            <span className="value">{item.assigned_names}</span>
                                                        </div>
                                                    )}
                                                    <div className="detail-item">
                                                        <span className="label">Category</span>
                                                        <span className="value" style={{ textTransform: 'capitalize' }}>
                                                            {item.category.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="mobile-actions">
                                                    {hasPermission('asset.credentials.manage') && (
                                                        <>
                                                            <button
                                                                className="action-btn view"
                                                                style={{ backgroundColor: '#6366f1', color: 'white' }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(`/asset/credentials/${item.id}`);
                                                                }}
                                                            >
                                                                <FiEye /> <span>View</span>
                                                            </button>
                                                            <button
                                                                className="action-btn checkout"
                                                                style={{ backgroundColor: '#2563eb', color: 'white' }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleOpenCheckOut(item);
                                                                }}
                                                            >
                                                                <FiLogOut /> <span>Check Out</span>
                                                            </button>
                                                            {item.status !== 'available' && (
                                                                <button
                                                                    className="action-btn checkin"
                                                                    style={{ backgroundColor: '#10b981', color: 'white' }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleOpenCheckIn(item);
                                                                    }}
                                                                >
                                                                    <FiCheckCircle /> <span>Check In</span>
                                                                </button>
                                                            )}
                                                            <button
                                                                className="action-btn edit"
                                                                onClick={() => handleEditClick(item.id)}
                                                            >
                                                                <FiEdit2 /> <span>Edit</span>
                                                            </button>
                                                            <button
                                                                className="action-btn delete"
                                                                onClick={() => handleDeleteClick(item)}
                                                            >
                                                                <FiTrash2 /> <span>Delete</span>
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            }
                        </div >

                        <Pagination
                            currentPage={currentPage}
                            totalItems={credentials.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={paginate}
                            onItemsPerPageChange={setItemsPerPage}
                        />
                    </>
                )}
            </div >

            <CredentialCheckOutModal
                isOpen={isCheckOutModalOpen}
                onClose={handleCloseCheckOut}
                onSuccess={handleActionSuccess}
                credentialId={selectedCredential?.id}
                credentialName={selectedCredential?.platform_name}
                assignedUserIds={selectedCredential?.assigned_ids ? selectedCredential.assigned_ids.toString().split(',') : []}
                assignedAssetIds={selectedCredential?.assigned_asset_ids ? selectedCredential.assigned_asset_ids.toString().split(',') : []}
            />

            <CredentialCheckInModal
                isOpen={isCheckInModalOpen}
                onClose={handleCloseCheckIn}
                onSuccess={handleActionSuccess}
                credentialId={selectedCredential?.id}
                credentialName={selectedCredential?.platform_name}
                assignedUsers={selectedCredential ? getAssignedUsers(selectedCredential) : []}
            />

            <CredentialModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={handleModalSuccess}
                credentialId={selectedCredentialId}
            />

            {
                showToast && (
                    <Toast
                        message={toastMessage}
                        type="success"
                        onClose={() => setShowToast(false)}
                    />
                )
            }

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="Delete Credential"
                message={`Are you sure you want to delete credential for "${credentialToDelete?.platform_name}"?`}
                confirmText="Delete"
                type="danger"
            />
        </div >
    );
};

export default CredentialList;
