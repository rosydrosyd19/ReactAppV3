import Pagination from '../../../components/Pagination/Pagination';
import './RoleList.css';
import React, { useState, useEffect } from 'react';
import api from '../../../utils/axios';
import { useAuth } from '../../../contexts/AuthContext';
import RoleModal from './RoleModal';
import ConfirmationModal from '../../../components/Modal/ConfirmationModal';
import Toast from '../../../components/Toast/Toast';
import {
    FiPlus,
    FiSearch,
    FiEdit2,
    FiTrash2,
    FiShield,
    FiChevronDown,
    FiUsers,
    FiLock
} from 'react-icons/fi';

const RoleList = () => {
    const { hasPermission } = useAuth();
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null); // null for add, object for edit
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [expandedRoleId, setExpandedRoleId] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const toggleMobileItem = (id) => {
        setExpandedRoleId(expandedRoleId === id ? null : id);
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    // Reset pagination when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const fetchRoles = async () => {
        try {
            setLoading(true);
            const response = await api.get('/sysadmin/roles');
            if (response.data.success) {
                setRoles(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching roles:', error);
            if (error.response && error.response.data) {
                console.error('Server Error Details:', error.response.data);
                showNotification(`Error: ${error.response.data.message}`, 'error');
            } else {
                showNotification('Failed to fetch roles', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (message) => {
        setToastMessage(message);
        setShowToast(true);
    };

    const handleDeleteClick = (role) => {
        setRoleToDelete(role);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            setLoading(true);
            const response = await api.delete(`/sysadmin/roles/${roleToDelete.id}`);
            if (response.data.success) {
                showNotification('Role successfully deleted');
                fetchRoles();
            }
        } catch (error) {
            console.error('Error deleting role:', error);
            alert(error.response?.data?.message || 'Failed to delete role');
        } finally {
            setLoading(false);
            setShowDeleteModal(false);
            setRoleToDelete(null);
        }
    };

    const handleAddClick = () => {
        setSelectedRole(null);
        setShowModal(true);
    };

    const handleEditClick = (role) => {
        setSelectedRole(role);
        setShowModal(true);
    };

    const handleModalSuccess = () => {
        showNotification(selectedRole ? 'Role updated successfully' : 'Role created successfully');
        fetchRoles();
    };

    const filteredRoles = roles.filter(role =>
        role.role_name.toLowerCase().includes(search.toLowerCase()) ||
        role.description?.toLowerCase().includes(search.toLowerCase())
    );

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredRoles.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="role-list">
            <div className="page-header">
                <div>
                    <h1>Role Management</h1>
                    <p>Manage System Roles & Permissions</p>
                </div>
                {hasPermission('sysadmin.roles.manage') && (
                    <button className="btn btn-primary" onClick={handleAddClick}>
                        <FiPlus /> Add Role
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
                            placeholder="Search role name or description..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner" />
                        <p>Loading roles...</p>
                    </div>
                ) : filteredRoles.length === 0 ? (
                    <div className="empty-state">
                        <FiShield />
                        <h3>No roles found</h3>
                        <p>Start by adding your first role</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="desktop-table">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Role Name</th>
                                        <th>Description</th>
                                        <th>Users</th>
                                        <th>Permissions</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map((role) => (
                                        <tr key={role.id}>
                                            <td><strong>{role.role_name}</strong></td>
                                            <td>{role.description || '-'}</td>
                                            <td>
                                                <span className="count-badge">
                                                    <FiUsers style={{ marginRight: '6px' }} />
                                                    {role.user_count || 0}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="count-badge">
                                                    <FiLock style={{ marginRight: '6px' }} />
                                                    {role.permission_count || 0}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    {hasPermission('sysadmin.roles.manage') && !role.is_system_role && (
                                                        <>
                                                            <button
                                                                className="btn-icon"
                                                                title="Edit"
                                                                onClick={() => handleEditClick(role)}
                                                            >
                                                                <FiEdit2 />
                                                            </button>
                                                            <button
                                                                className="btn-icon btn-danger"
                                                                title="Delete"
                                                                onClick={() => handleDeleteClick(role)}
                                                            >
                                                                <FiTrash2 />
                                                            </button>
                                                        </>
                                                    )}
                                                    {!!role.is_system_role && (
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                                                            System Role
                                                        </span>
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
                            {currentItems.map((role) => (
                                <div key={role.id} className="mobile-list-item">
                                    <div className="mobile-list-main" onClick={() => toggleMobileItem(role.id)}>
                                        <div className="mobile-role-icon">
                                            <FiShield />
                                        </div>
                                        <div className="mobile-role-info">
                                            <span className="role-name">{role.role_name}</span>
                                            <span className="role-desc">{role.description || 'No description'}</span>
                                        </div>
                                        <div className="mobile-expand-icon">
                                            <FiChevronDown className={expandedRoleId === role.id ? 'rotated' : ''} />
                                        </div>
                                    </div>

                                    {expandedRoleId === role.id && (
                                        <div className="mobile-list-details">
                                            <div className="detail-grid">
                                                <div className="detail-item">
                                                    <span className="label">Users Assigned</span>
                                                    <span className="value">{role.user_count || 0}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="label">Permissions</span>
                                                    <span className="value">{role.permission_count || 0}</span>
                                                </div>
                                            </div>

                                            {hasPermission('sysadmin.roles.manage') && !role.is_system_role && (
                                                <div className="mobile-actions">
                                                    <button
                                                        className="action-btn edit"
                                                        onClick={() => handleEditClick(role)}
                                                    >
                                                        <FiEdit2 /> <span>Edit</span>
                                                    </button>
                                                    <button
                                                        className="action-btn delete"
                                                        onClick={() => handleDeleteClick(role)}
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

                        {/* Pagination Component */}
                        <Pagination
                            currentPage={currentPage}
                            totalItems={filteredRoles.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={paginate}
                            onItemsPerPageChange={setItemsPerPage}
                        />
                    </>
                )}
            </div>

            {/* Role Modal (Create/Edit) */}
            <RoleModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={handleModalSuccess}
                role={selectedRole}
            />

            {/* Delete Confirmation */}
            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="Delete Role"
                message={`Are you sure you want to delete role "${roleToDelete?.role_name}"? This will remove permissions from all assigned users.`}
                confirmText="Delete Role"
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

export default RoleList;
