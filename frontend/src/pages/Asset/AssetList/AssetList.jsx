import Pagination from '../../../components/Pagination/Pagination';
import './AssetList.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../utils/axios';
import { useAuth } from '../../../contexts/AuthContext';
import AssetModal from './AssetModal';
import ConfirmationModal from '../../../components/Modal/ConfirmationModal';
import CheckOutModal from './CheckOutModal';
import CheckInModal from './CheckInModal';
import QRCodeModal from './QRCodeModal';
import BulkQRModal from './BulkQRModal';
import MaintenanceModal from './MaintenanceModal';
import Toast from '../../../components/Toast/Toast';
import { BsQrCode } from 'react-icons/bs';
import {
    FiTool,
    FiPlus,
    FiSearch,
    FiFilter,
    FiEdit2,
    FiTrash2,
    FiLogIn,
    FiEye,
    FiPackage,
    FiChevronDown,
    FiLogOut,
    FiMoreVertical,
    FiCopy,
    FiAlertCircle
} from 'react-icons/fi';
import { useMemo } from 'react';

const AssetList = () => {
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal State
    const [showAssetModal, setShowAssetModal] = useState(false);
    const [selectedAssetId, setSelectedAssetId] = useState(null);
    const [cloneAssetId, setCloneAssetId] = useState(null);

    const [statusFilter, setStatusFilter] = useState('');
    const [expandedItemId, setExpandedItemId] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [assetToDelete, setAssetToDelete] = useState(null);

    const [activeDropdownId, setActiveDropdownId] = useState(null);

    // Close dropdown when clicking outside
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

    const toggleDropdown = (id) => {
        if (activeDropdownId === id) {
            setActiveDropdownId(null);
        } else {
            setActiveDropdownId(id);
        }
    };

    // Check In/Out State
    const [showCheckOutModal, setShowCheckOutModal] = useState(false);
    const [showCheckInModal, setShowCheckInModal] = useState(false);

    const [selectedTransactionAsset, setSelectedTransactionAsset] = useState(null);

    // QR Modal State
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrAsset, setQrAsset] = useState(null);

    // Maintenance Modal State
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
    const [maintenanceAsset, setMaintenanceAsset] = useState(null);
    const [maintenanceRecord, setMaintenanceRecord] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Bulk Action State
    const [selectedAssets, setSelectedAssets] = useState(new Set());
    const [showBulkQRModal, setShowBulkQRModal] = useState(false);

    const toggleMobileItem = (id) => {
        setExpandedItemId(expandedItemId === id ? null : id);
    };

    useEffect(() => {
        fetchAssets();
    }, [statusFilter]);

    // Reset pagination when search or status filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter]);

    const fetchAssets = async () => {
        try {
            setLoading(true);
            const params = {};
            if (statusFilter) params.status = statusFilter;
            // Removed search param from server call to enable client-side filtering

            const response = await axios.get('/asset/assets', { params });
            if (response.data.success) {
                setAssets(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching assets:', error);
            alert('Failed to fetch assets');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id, assetTag) => {
        setAssetToDelete({ id, assetTag });
        setShowDeleteModal(true);
    };

    const handleCheckOut = (asset) => {
        setSelectedTransactionAsset(asset);
        setShowCheckOutModal(true);
    };

    const handleCheckIn = (asset) => {
        setSelectedTransactionAsset(asset);
        setShowCheckInModal(true);
    };

    const handleQRClick = (asset) => {
        setQrAsset(asset);
        setShowQRModal(true);
    };

    const handleMaintenanceClick = async (asset) => {
        setMaintenanceAsset(asset);
        setMaintenanceRecord(null); // Default to new

        // If already in maintenance, try to find active record to edit
        if (asset.status === 'maintenance') {
            try {
                const response = await axios.get('/asset/maintenance', { params: { asset_id: asset.id } });
                if (response.data.success) {
                    // Find first record that is not completed or cancelled
                    const activeRecord = response.data.data.find(m => m.status === 'in_progress' || m.status === 'scheduled');
                    if (activeRecord) {
                        setMaintenanceRecord(activeRecord);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch active maintenance", err);
                // Fallback to creating new one if fetch fails, or maybe show error? 
                // Creating new is safer fallback to avoid blocking user.
            }
        }
        setShowMaintenanceModal(true);
    };

    const handleMaintenanceSuccess = (message) => {
        setToastMessage(message);
        setShowToast(true);
        fetchAssets();
        setMaintenanceAsset(null);
        setMaintenanceRecord(null);
    };

    const handleTransactionSuccess = () => {
        setToastMessage('Asset status updated successfully');
        setShowToast(true);
        fetchAssets();
        setSelectedTransactionAsset(null);
    };

    const confirmDelete = async () => {
        if (!assetToDelete) return;

        try {
            const response = await axios.delete(`/asset/assets/${assetToDelete.id}`);
            if (response.data.success) {
                setToastMessage('Asset deleted successfully');
                setShowToast(true);
                fetchAssets();
            }
        } catch (error) {
            console.error('Error deleting asset:', error);
            alert('Failed to delete asset');
        } finally {
            setShowDeleteModal(false);
            setAssetToDelete(null);
        }
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            available: 'badge-success',
            assigned: 'badge-primary',
            maintenance: 'badge-warning',
            retired: 'badge-danger',
            lost: 'badge-danger',
        };
        return `badge ${statusColors[status] || 'badge-primary'}`;
    };

    const filteredAssets = assets.filter(asset =>
        asset.asset_name.toLowerCase().includes(search.toLowerCase()) ||
        asset.asset_tag.toLowerCase().includes(search.toLowerCase()) ||
        (asset.serial_number && asset.serial_number.toLowerCase().includes(search.toLowerCase())) ||
        (asset.category_name && asset.category_name.toLowerCase().includes(search.toLowerCase()))
    );

    // Identify duplicate serial numbers
    const duplicateSerialNumbers = useMemo(() => {
        const serialCounts = {};
        assets.forEach(asset => {
            if (asset.serial_number) {
                const sn = asset.serial_number.trim();
                if (sn) {
                    serialCounts[sn] = (serialCounts[sn] || 0) + 1;
                }
            }
        });

        const duplicates = new Set();
        Object.entries(serialCounts).forEach(([sn, count]) => {
            if (count > 1) {
                duplicates.add(sn);
            }
        });
        return duplicates;
    }, [assets]);

    const isDuplicateSerial = (serialNumber) => {
        return serialNumber && duplicateSerialNumbers.has(serialNumber.trim());
    };

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredAssets.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleCreateClick = () => {
        setSelectedAssetId(null);
        setCloneAssetId(null);
        setShowAssetModal(true);
    };

    const handleEditClick = (id) => {
        setSelectedAssetId(id);
        setCloneAssetId(null);
        setShowAssetModal(true);
    };

    const handleCloneClick = (id) => {
        setSelectedAssetId(null);
        setCloneAssetId(id);
        setShowAssetModal(true);
    };



    const handleModalSuccess = (action) => {
        setToastMessage(`Asset ${action} successfully`);
        setShowToast(true);
        fetchAssets();
    };

    // Bulk Actions Logic
    const toggleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = new Set(currentItems.map(asset => asset.id));
            setSelectedAssets(allIds);
        } else {
            setSelectedAssets(new Set());
        }
    };

    const toggleSelectAsset = (id) => {
        const newSelected = new Set(selectedAssets);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedAssets(newSelected);
    };

    const handleBulkQRClick = () => {
        setShowBulkQRModal(true);
    };

    const getSelectedAssetsList = () => {
        return assets.filter(a => selectedAssets.has(a.id));
    };

    return (
        <div className="asset-list">
            <div className="page-header">
                <div>
                    <h1>Assets</h1>
                    <p>Manage your organization's assets</p>
                </div>
                {hasPermission('asset.items.create') && (
                    <button className="btn btn-primary" onClick={handleCreateClick}>
                        <FiPlus /> Add Asset
                    </button>
                )}
            </div>

            <div className="card">
                <div className="filters-bar">
                    {/* Bulk Actions Menu (conditionally rendered) */}
                    {selectedAssets.size > 0 && (
                        <div className="bulk-actions" style={{
                            background: 'var(--bg-secondary)',
                            padding: '10px 15px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px',
                            marginBottom: '10px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <span style={{ fontWeight: 'bold' }}>{selectedAssets.size} selected</span>
                            <button className="btn btn-outline btn-sm" onClick={handleBulkQRClick}>
                                <BsQrCode /> Print QR Codes
                            </button>
                            <button className="btn btn-text btn-sm" onClick={() => setSelectedAssets(new Set())}>
                                Clear Selection
                            </button>
                        </div>
                    )}

                    <div className="search-form">
                        <div className="input-with-icon">
                            <FiSearch />
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Search by name, tag, or category..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="filter-group">
                        <FiFilter />
                        <select
                            className="form-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="available">Available</option>
                            <option value="assigned">Assigned</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="retired">Retired</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner" />
                        <p>Loading assets...</p>
                    </div>
                ) : filteredAssets.length === 0 ? (
                    <div className="empty-state">
                        <FiPackage />
                        <h3>No assets found</h3>
                        <p>Start by adding your first asset</p>
                        {hasPermission('asset.items.create') && (
                            <button
                                className="btn btn-primary"
                                onClick={handleCreateClick}
                            >
                                <FiPlus /> Add Asset
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="desktop-table">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px' }}>
                                            <input
                                                type="checkbox"
                                                onChange={toggleSelectAll}
                                                checked={currentItems.length > 0 && selectedAssets.size === currentItems.length}
                                            />
                                        </th>
                                        <th>Asset Tag</th>
                                        <th>Serial Number</th>
                                        <th>Name</th>
                                        <th>Location</th>
                                        <th>Assigned To</th>
                                        <th>Status / Condition</th>
                                        <th style={{ textAlign: 'center' }}>QR Prints</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map((asset) => (
                                        <tr key={asset.id} className={selectedAssets.has(asset.id) ? 'selected-row' : ''}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedAssets.has(asset.id)}
                                                    onChange={() => toggleSelectAsset(asset.id)}
                                                />
                                            </td>
                                            <td>
                                                <strong>{asset.asset_tag}</strong>
                                            </td>
                                            <td>
                                                {asset.serial_number || '-'}
                                                {isDuplicateSerial(asset.serial_number) && (
                                                    <span
                                                        className="duplicate-dot"
                                                        title="Duplicate Serial Number"
                                                    />
                                                )}
                                            </td>
                                            <td>{asset.asset_name}</td>
                                            <td>{asset.location_name || '-'}</td>
                                            <td>
                                                {asset.assigned_to_name
                                                    ? asset.assigned_to_name
                                                    : asset.assigned_to_asset_name
                                                        ? `Asset: ${asset.assigned_to_asset_name}`
                                                        : asset.assigned_location_name
                                                            ? asset.assigned_location_name
                                                            : '-'}
                                            </td>
                                            <td>
                                                <span className={getStatusBadge(asset.status)}>
                                                    {asset.status}
                                                </span>
                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', textTransform: 'capitalize' }}>
                                                    {asset.condition_status || '-'}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                {asset.qr_print_count || 0}
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    {/* Primary Actions (View, Edit, Delete) */}
                                                    {hasPermission('asset.items.view') && (
                                                        <button
                                                            className="btn-icon"
                                                            title="View"
                                                            onClick={() => navigate(`/asset/items/${asset.id}`)}
                                                        >
                                                            <FiEye />
                                                        </button>
                                                    )}
                                                    {hasPermission('asset.items.edit') && (
                                                        <button
                                                            className="btn-icon"
                                                            title="Edit"
                                                            onClick={() => handleEditClick(asset.id)}
                                                        >
                                                            <FiEdit2 />
                                                        </button>
                                                    )}
                                                    {hasPermission('asset.items.delete') && (
                                                        <button
                                                            className="btn-icon btn-danger"
                                                            title="Delete"
                                                            onClick={() => handleDelete(asset.id, asset.asset_tag)}
                                                        >
                                                            <FiTrash2 />
                                                        </button>
                                                    )}

                                                    {/* Dropdown for Secondary Actions */}
                                                    <div className="action-dropdown-container" style={{ position: 'relative' }}>
                                                        <button
                                                            className="btn-icon"
                                                            onClick={() => toggleDropdown(asset.id)}
                                                            title="More Actions"
                                                        >
                                                            <FiMoreVertical />
                                                        </button>
                                                        {activeDropdownId === asset.id && (
                                                            <div className="action-dropdown-menu">
                                                                {asset.status === 'available' && hasPermission('asset.items.checkout') && (
                                                                    <button
                                                                        className="dropdown-item"
                                                                        onClick={() => {
                                                                            handleCheckOut(asset);
                                                                            setActiveDropdownId(null);
                                                                        }}
                                                                    >
                                                                        <FiLogOut className="text-primary" /> Check Out
                                                                    </button>
                                                                )}
                                                                {asset.status === 'assigned' && hasPermission('asset.items.checkin') && (
                                                                    <button
                                                                        className="dropdown-item"
                                                                        onClick={() => {
                                                                            handleCheckIn(asset);
                                                                            setActiveDropdownId(null);
                                                                        }}
                                                                    >
                                                                        <FiLogIn className="text-warning" /> Check In
                                                                    </button>
                                                                )}
                                                                {(asset.status === 'available' || asset.status === 'maintenance') && hasPermission('asset.maintenance.manage') && (
                                                                    <button
                                                                        className="dropdown-item"
                                                                        onClick={() => {
                                                                            handleMaintenanceClick(asset);
                                                                            setActiveDropdownId(null);
                                                                        }}
                                                                    >
                                                                        <FiTool className={asset.status === 'maintenance' ? 'text-warning' : ''} />
                                                                        {asset.status === 'maintenance' ? "Update Maintenance" : "Maintenance"}
                                                                    </button>
                                                                )}
                                                                {hasPermission('asset.items.create') && (
                                                                    <button
                                                                        className="dropdown-item"
                                                                        onClick={() => {
                                                                            handleCloneClick(asset.id);
                                                                            setActiveDropdownId(null);
                                                                        }}
                                                                    >
                                                                        <FiCopy /> Clone Asset
                                                                    </button>
                                                                )}
                                                                <button
                                                                    className="dropdown-item"
                                                                    onClick={() => {
                                                                        handleQRClick(asset);
                                                                        setActiveDropdownId(null);
                                                                    }}
                                                                >
                                                                    <BsQrCode /> QR Code
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile List View */}
                        <div className="mobile-list">
                            {currentItems.map((asset) => (
                                <div key={asset.id} className="mobile-list-item">
                                    <div className="mobile-list-main" onClick={() => toggleMobileItem(asset.id)}>
                                        <div className="mobile-asset-icon">
                                            <FiPackage />
                                            <span className={`status-dot ${asset.status === 'available' ? 'active' :
                                                asset.status === 'maintenance' ? 'warning' :
                                                    asset.status === 'assigned' ? 'primary' : 'danger'
                                                }`} />
                                        </div>
                                        <div className="mobile-asset-info">
                                            <div className="asset-primary-text">
                                                <span className="asset-tag">{asset.asset_tag}</span>
                                                <span className="category-badge-small">{asset.category_name || 'No Category'}</span>
                                            </div>
                                            <div className="asset-secondary-text">{asset.asset_name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                SN: {asset.serial_number || '-'}
                                                {isDuplicateSerial(asset.serial_number) && (
                                                    <span
                                                        className="duplicate-dot"
                                                        title="Duplicate Serial Number"
                                                        style={{ marginLeft: '4px' }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        <div className="mobile-expand-icon">
                                            <FiChevronDown className={expandedItemId === asset.id ? 'rotated' : ''} />
                                        </div>
                                    </div>

                                    {expandedItemId === asset.id && (
                                        <div className="mobile-list-details">
                                            <div className="detail-grid">

                                                <div className="detail-item">
                                                    <span className="label">Status</span>
                                                    <span className="value" style={{ textTransform: 'capitalize' }}>{asset.status}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="label">Condition</span>
                                                    <span className="value" style={{ textTransform: 'capitalize' }}>{asset.condition_status || '-'}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="label">Type</span>
                                                    <span className="value">{asset.item_type_name || 'Asset'}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="label">Location</span>
                                                    <span className="value">{asset.location_name || '-'}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="label">Assigned To</span>
                                                    <span className="value">
                                                        {asset.assigned_to_name
                                                            || (asset.assigned_to_asset_name ? `Asset: ${asset.assigned_to_asset_name}` : '')
                                                            || asset.assigned_location_name
                                                            || '-'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mobile-actions">
                                                {hasPermission('asset.items.create') && (
                                                    <button
                                                        className="action-btn clone"
                                                        onClick={() => handleCloneClick(asset.id)}
                                                        title="Clone Asset"
                                                    >
                                                        <FiCopy /> <span>Clone</span>
                                                    </button>
                                                )}
                                                {asset.status === 'available' && hasPermission('asset.items.checkout') && (
                                                    <button
                                                        className="action-btn primary"
                                                        onClick={() => handleCheckOut(asset)}
                                                        title="Check Out"
                                                    >
                                                        <FiLogOut /> <span>Check Out</span>
                                                    </button>
                                                )}
                                                {asset.status === 'assigned' && hasPermission('asset.items.checkin') && (
                                                    <button
                                                        className="action-btn warning"
                                                        onClick={() => handleCheckIn(asset)}
                                                        title="Check In"
                                                    >
                                                        <FiLogIn /> <span>Check In</span>
                                                    </button>
                                                )}
                                                {(asset.status === 'available' || asset.status === 'maintenance') && hasPermission('asset.maintenance.manage') && (
                                                    <button
                                                        className={`action-btn ${asset.status === 'maintenance' ? 'warning' : 'secondary'}`}
                                                        onClick={() => handleMaintenanceClick(asset)}
                                                        title="Maintenance"
                                                    >
                                                        <FiTool /> <span>{asset.status === 'maintenance' ? 'Update Maint.' : 'Maintenance'}</span>
                                                    </button>
                                                )}
                                                <button
                                                    className="action-btn qr-code"
                                                    onClick={() => handleQRClick(asset)}
                                                    title="QR Code"
                                                >
                                                    <BsQrCode /> <span>QR Code</span>
                                                </button>
                                                {hasPermission('asset.items.view') && (
                                                    <button
                                                        className="action-btn view"
                                                        onClick={() => navigate(`/asset/items/${asset.id}`)}
                                                        title="View"
                                                    >
                                                        <FiEye /> <span>View</span>
                                                    </button>
                                                )}
                                                {hasPermission('asset.items.edit') && (
                                                    <button
                                                        className="action-btn edit"
                                                        onClick={() => handleEditClick(asset.id)}
                                                        title="Edit"
                                                    >
                                                        <FiEdit2 /> <span>Edit</span>
                                                    </button>
                                                )}
                                                {hasPermission('asset.items.delete') && (
                                                    <button
                                                        className="action-btn delete"
                                                        onClick={() => handleDelete(asset.id, asset.asset_tag)}
                                                        title="Delete"
                                                    >
                                                        <FiTrash2 /> <span>Delete</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <Pagination
                            currentPage={currentPage}
                            totalItems={filteredAssets.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={paginate}
                            onItemsPerPageChange={setItemsPerPage}
                        />
                    </>
                )}
            </div>

            <AssetModal
                isOpen={showAssetModal}
                onClose={() => setShowAssetModal(false)}
                onSuccess={handleModalSuccess}
                assetId={selectedAssetId}
                cloneAssetId={cloneAssetId}
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
                title="Delete Asset"
                message={`Are you sure you want to delete asset "${assetToDelete?.assetTag}"? This action cannot be undone.`}
                confirmText="Delete Asset"
                type="danger"
            />

            <CheckOutModal
                isOpen={showCheckOutModal}
                onClose={() => setShowCheckOutModal(false)}
                onSuccess={handleTransactionSuccess}
                assetId={selectedTransactionAsset?.id}
                assetName={selectedTransactionAsset?.asset_name}
            />

            <CheckInModal
                isOpen={showCheckInModal}
                onClose={() => setShowCheckInModal(false)}
                onSuccess={handleTransactionSuccess}
                assetId={selectedTransactionAsset?.id}
                assetName={selectedTransactionAsset?.asset_name}
            />

            <QRCodeModal
                isOpen={showQRModal}
                onClose={() => setShowQRModal(false)}
                assetId={qrAsset?.id}
                assetName={qrAsset?.asset_name}
                assetTag={qrAsset?.asset_tag}
                serialNumber={qrAsset?.serial_number}
                onSuccess={() => fetchAssets()}
            />

            <BulkQRModal
                isOpen={showBulkQRModal}
                onClose={() => setShowBulkQRModal(false)}
                assets={getSelectedAssetsList()}
                onSuccess={() => fetchAssets()}
            />

            <MaintenanceModal
                isOpen={showMaintenanceModal}
                onClose={() => setShowMaintenanceModal(false)}
                onSuccess={handleMaintenanceSuccess}
                assetId={maintenanceAsset?.id}
                maintenanceId={maintenanceRecord?.id}
                initialData={maintenanceRecord}
            />
        </div >
    );
};

export default AssetList;
