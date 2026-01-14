import './RoleModal.css';
import React, { useState, useEffect } from 'react';
import { FiX, FiSave, FiCheckSquare } from 'react-icons/fi';
import api from '../../../utils/axios';

const RoleModal = ({ isOpen, onClose, onSuccess, role = null }) => {
    const [formData, setFormData] = useState({
        role_name: '',
        description: '',
        permission_ids: []
    });
    const [allPermissions, setAllPermissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fetchingPerms, setFetchingPerms] = useState(false);
    const [moduleSearch, setModuleSearch] = useState({});

    useEffect(() => {
        if (isOpen) {
            fetchPermissions();
            setModuleSearch({}); // Reset module searches
            if (role) {
                // Edit mode
                fetchRoleDetails(role.id);
            } else {
                // Create mode - reset form
                setFormData({
                    role_name: '',
                    description: '',
                    permission_ids: []
                });
            }
        }
    }, [isOpen, role]);

    const fetchPermissions = async () => {
        try {
            setFetchingPerms(true);
            const response = await api.get('/sysadmin/permissions');
            if (response.data.success) {
                setAllPermissions(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching permissions:', error);
            setError('Failed to load permissions');
        } finally {
            setFetchingPerms(false);
        }
    };

    const fetchRoleDetails = async (roleId) => {
        try {
            setLoading(true);
            const response = await api.get(`/sysadmin/roles/${roleId}`);
            if (response.data.success) {
                const roleData = response.data.data;
                setFormData({
                    role_name: roleData.role_name,
                    description: roleData.description,
                    permission_ids: roleData.permissions.map(p => p.id)
                });
            }
        } catch (error) {
            console.error('Error fetching role details:', error);
            setError('Failed to load role details');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
    };

    const handlePermissionToggle = (permId) => {
        setFormData(prev => {
            const currentIds = prev.permission_ids;
            const newIds = currentIds.includes(permId)
                ? currentIds.filter(id => id !== permId)
                : [...currentIds, permId];
            return { ...prev, permission_ids: newIds };
        });
    };

    const handleGroupToggle = (moduleName, permissionIds) => {
        setFormData(prev => {
            const currentIds = prev.permission_ids;
            const allSelected = permissionIds.every(id => currentIds.includes(id));

            let newIds;
            if (allSelected) {
                // Uncheck all in group
                newIds = currentIds.filter(id => !permissionIds.includes(id));
            } else {
                // Check all in group
                // Use Set to avoid duplicates
                newIds = [...new Set([...currentIds, ...permissionIds])];
            }
            return { ...prev, permission_ids: newIds };
        });
    };

    const handleModuleSearch = (moduleName, term) => {
        setModuleSearch(prev => ({
            ...prev,
            [moduleName]: term
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.role_name) {
            setError('Role name is required');
            return;
        }

        setLoading(true);

        try {
            if (role) {
                // Update
                await api.put(`/sysadmin/roles/${role.id}`, formData);
            } else {
                // Create
                await api.post('/sysadmin/roles', formData);
            }
            onSuccess();
            handleClose();
        } catch (error) {
            console.error('Error saving role:', error);
            setError(error.response?.data?.message || 'Failed to save role');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setError('');
        onClose();
    };

    // Filter permissions based solely on hidden/deprecated permissions
    // The search is now handled per-module in the render loop
    const validPermissions = allPermissions.filter(perm => {
        // Hide "manage" permissions for granular modules
        const hiddenPermissions = [
            'asset.categories.manage',
            'asset.locations.manage',
            'asset.suppliers.manage',
            'asset.maintenance.manage'
        ];
        if (hiddenPermissions.includes(perm.permission_key)) return false;

        return true;
    });

    // Group permissions by module
    const groupedPermissions = validPermissions.reduce((groups, perm) => {
        const module = perm.module_name || 'Other';
        if (!groups[module]) {
            groups[module] = [];
        }
        groups[module].push(perm);
        return groups;
    }, {});

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal role-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{role ? 'Edit Role' : 'Add New Role'}</h2>
                    <button className="modal-close" onClick={handleClose}>
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

                        <div className="form-section">
                            <h3 className="form-section-title">Role Information</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Role Name *</label>
                                    <input
                                        type="text"
                                        name="role_name"
                                        className="form-input"
                                        value={formData.role_name}
                                        onChange={handleChange}
                                        placeholder="e.g. Finance Manager"
                                        required
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        name="description"
                                        className="form-input"
                                        value={formData.description || ''}
                                        onChange={handleChange}
                                        placeholder="Enter role description"
                                        rows={2}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <div className="permissions-header" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                                <h3 className="form-section-title" style={{ marginBottom: 0, border: 'none', padding: 0 }}>Permissions</h3>
                            </div>
                            {fetchingPerms ? (
                                <div className="loading-spinner" />
                            ) : (
                                <div className="permissions-grid">
                                    {Object.entries(groupedPermissions).map(([module, perms]) => {
                                        // Filter permissions for this module based on its own search term
                                        const moduleSearchTerm = moduleSearch[module] || '';
                                        const displayedPerms = perms.filter(perm =>
                                            perm.permission_name.toLowerCase().includes(moduleSearchTerm.toLowerCase()) ||
                                            perm.permission_key.toLowerCase().includes(moduleSearchTerm.toLowerCase())
                                        );

                                        // All permissions in this module (for Select All logic, should apply to displayed matches or all?)
                                        // Usually Select All applies to visible items in a filtered list
                                        const visibleIds = displayedPerms.map(p => p.id);
                                        const isAllSelected = visibleIds.length > 0 && visibleIds.every(id => formData.permission_ids.includes(id));

                                        // If search hides everything, don't show the group? Or show empty?
                                        // Better to show empty state or just the list if nothing matches
                                        if (moduleSearchTerm && displayedPerms.length === 0) {
                                            // You might want to hide the module if no matches, but keeping it visible with "No results" is often better UX
                                        }

                                        return (
                                            <div key={module} className="permission-group">
                                                <div className="group-header">
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                                                        <span className="group-title">{module}</span>
                                                        <input
                                                            type="text"
                                                            placeholder={`Search ${module}...`}
                                                            className="form-input search-sm"
                                                            style={{
                                                                fontSize: '0.8rem',
                                                                padding: '4px 8px',
                                                                width: '180px',
                                                                marginLeft: '10px'
                                                            }}
                                                            value={moduleSearchTerm}
                                                            onChange={(e) => handleModuleSearch(module, e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="select-all-btn"
                                                        onClick={() => handleGroupToggle(module, visibleIds)}
                                                    >
                                                        {isAllSelected ? 'Unselect All' : 'Select All'}
                                                    </button>
                                                </div>
                                                <div className="permission-list">
                                                    {displayedPerms.length > 0 ? (
                                                        displayedPerms.map(perm => (
                                                            <label key={perm.id} className="permission-item">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={formData.permission_ids.includes(perm.id)}
                                                                    onChange={() => handlePermissionToggle(perm.id)}
                                                                />
                                                                <span className="permission-label">
                                                                    <span className="perm-name">{perm.permission_name}</span>
                                                                    <span className="perm-key">{perm.permission_key}</span>
                                                                </span>
                                                            </label>
                                                        ))
                                                    ) : (
                                                        <div style={{ padding: '10px', color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                                                            No permissions found matching "{moduleSearchTerm}"
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={handleClose}
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
                                    Save Role
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RoleModal;
