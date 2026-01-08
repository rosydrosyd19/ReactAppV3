import './AssetDetail.css';
import '../../SysAdmin/UserDetail.css';
import { useState, useEffect } from 'react';
import { intervalToDuration } from 'date-fns';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from '../../../utils/axios';
import { useAuth } from '../../../contexts/AuthContext';
import AssetModal from '../AssetList/AssetModal';
import ConfirmationModal from '../../../components/Modal/ConfirmationModal';
import Toast from '../../../components/Toast/Toast';
import CheckOutModal from '../AssetList/CheckOutModal';
import CheckInModal from '../AssetList/CheckInModal';
import MaintenanceModal from '../AssetList/MaintenanceModal';
import MaintenanceRequestModal from '../AssetList/MaintenanceRequestModal';
import { BsQrCode } from 'react-icons/bs'; // Correctly imported
import QRCode from 'react-qr-code';
import {
    FiArrowLeft,
    FiPackage,
    FiMapPin,
    FiUser,
    FiTag,
    FiCalendar,
    FiDollarSign,
    FiTool,
    FiEdit2,
    FiTrash2,
    FiCheckCircle,
    FiXCircle,
    FiAlertCircle,
    FiInfo,
    FiImage,
    FiLogOut,
    FiLogIn,
    FiClock,
    FiPrinter,
    FiLock,
    FiEye,
    FiEyeOff,
    FiAlertTriangle,
    FiMoreVertical
} from 'react-icons/fi';

const PasswordReveal = ({ password }) => {
    const [visible, setVisible] = useState(false);
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{visible ? password : '••••••••'}</span>
            <button
                type="button"
                onClick={() => setVisible(!visible)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}
            >
                {visible ? <FiEyeOff /> : <FiEye />}
            </button>
        </div>
    );
};

const AssetDetail = ({ readOnly = false }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { hasPermission, isAuthenticated, user } = useAuth();
    const [asset, setAsset] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [maintenanceRecords, setMaintenanceRecords] = useState([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
    const [maintenanceRecord, setMaintenanceRecord] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [showActionDropdown, setShowActionDropdown] = useState(false);

    const renderDescriptionWithLinks = (text) => {
        if (!text) return '-';

        // Regular expression to find URLs
        const urlRegex = /(https?:\/\/[^\s]+)/g;

        const parts = text.split(urlRegex);

        return parts.map((part, index) => {
            if (part.match(urlRegex)) {
                return (
                    <a
                        key={index}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {part}
                    </a>
                );
            }
            return part;
        });
    };

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showCheckOutModal, setShowCheckOutModal] = useState(false);
    const [showCheckInModal, setShowCheckInModal] = useState(false);

    useEffect(() => {
        fetchAssetDetail();
        fetchMaintenanceRecords();
    }, [id, isAuthenticated]);

    const fetchMaintenanceRecords = async () => {
        try {
            if (isAuthenticated) {
                const response = await axios.get('/asset/maintenance', { params: { asset_id: id } });
                if (response.data.success) {
                    setMaintenanceRecords(response.data.data);
                }
            }
        } catch (error) {
            console.error('Error fetching maintenance records:', error);
        }
    };

    const fetchAssetDetail = async () => {
        try {
            setLoading(true);
            const endpoint = (readOnly && !isAuthenticated) ? `/asset/public/${id}` : `/asset/assets/${id}`;
            const response = await axios.get(endpoint);
            if (response.data.success) {
                setAsset(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching asset detail:', error);
            setError('Failed to load asset details');
        } finally {
            setLoading(false);
        }
    };

    const handleAssetUpdated = (action) => {
        setToastMessage(`Asset ${action} successfully!`);
        setShowToast(true);
        fetchAssetDetail();
        setShowEditModal(false);
    };

    const handleTransactionSuccess = () => {
        setToastMessage('Asset status updated successfully!');
        setShowToast(true);
        fetchAssetDetail();
    };

    const handleMaintenanceClick = () => {
        if (asset.status === 'maintenance') {
            // Find the active maintenance record (in_progress)
            const activeRecord = maintenanceRecords.find(r => r.status === 'in_progress');
            if (activeRecord) {
                setMaintenanceRecord(activeRecord);
                setShowMaintenanceModal(true);
                return;
            }
        }
        setMaintenanceRecord(null);
        setShowMaintenanceModal(true);
    };

    const handleSubmitRequest = async (formData) => {
        try {
            setLoading(true);
            const response = await axios.post('/asset/maintenance-request', {
                asset_id: id,
                ...formData
            });

            if (response.data.success) {
                setToastMessage('Maintenance request submitted successfully!');
                setShowToast(true);
                setShowRequestModal(false);
                // Refresh asset details to see updated status if changed, although usually it just creates a ticket
                // But if we want to show it in history, we might need to refresh history too if we display 'scheduled' requests
                fetchMaintenanceRecords();
            }
        } catch (error) {
            console.error('Error submitting request:', error);
            alert(error.response?.data?.message || 'Failed to submit maintenance request');
        } finally {
            setLoading(false);
        }
    };

    const handleEditMaintenance = (record) => {
        setMaintenanceRecord(record);
        setShowMaintenanceModal(true);
    };

    const handleMaintenanceSuccess = (message) => {
        setToastMessage(message);
        setShowToast(true);
        fetchAssetDetail();
        fetchMaintenanceRecords();
        setMaintenanceRecord(null);
    };

    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            const response = await axios.delete(`/asset/assets/${id}`);
            if (response.data.success) {
                navigate('/asset/items');
            }
        } catch (error) {
            console.error('Error deleting asset:', error);
            alert('Failed to delete asset');
        } finally {
            setShowDeleteModal(false);
        }
    };

    const handlePrintQR = () => {
        const printWindow = window.open('', '', 'width=600,height=600');

        // Logic for serial number display
        const getSerialDisplay = (sn) => {
            if (!sn) return '-';
            if (sn.length > 7) {
                return '...' + sn.slice(-7);
            }
            return sn;
        };

        const serialDisplay = getSerialDisplay(asset.serial_number);

        printWindow.document.write(`
            <html>
                <head>
                    <title>Print QR Code - ${asset.asset_tag}</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            height: 100vh;
                            margin: 0;
                            text-align: center;
                        }
                        .qr-container {
                            border: 2px solid #000;
                            padding: 20px;
                            border-radius: 10px;
                        }
                        h2 { margin: 10px 0 5px; font-size: 18px; }
                        p { margin: 5px 0; font-size: 14px; color: #555; }
                        .tag { font-weight: bold; font-size: 16px; margin-top: 10px; }
                    </style>
                </head>
                <body>
                    <div class="qr-container">
                        <h2>${serialDisplay}</h2>
                        <div id="qr-code"></div>
                        <p class="tag">${asset.asset_tag}</p>
                    </div>
                </body>
            </html>
        `);

        // We need to render the QR code into the print window
        // An easy way is to use the SVG string from the main window or re-render using a library
        // Since we are using react-qr-code (SVG), we can grab the outerHTML of the SVG in the document
        const qrSvg = document.querySelector('.qr-code-wrapper svg');
        if (qrSvg) {
            const printQrDiv = printWindow.document.getElementById('qr-code');
            printQrDiv.innerHTML = qrSvg.outerHTML;
            // Adjust size for print
            const svg = printQrDiv.querySelector('svg');
            svg.style.width = '200px';
            svg.style.height = '200px';
        }

        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { // Wait for content to render
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    if (loading) {
        return (
            <div className="user-detail">
                <div className="loading-container">
                    <div className="loading-spinner" />
                    <p>Loading asset details...</p>
                </div>
            </div>
        );
    }

    if (error || !asset) {
        return (
            <div className="user-detail">
                <div className="error-container">
                    <h3>Error</h3>
                    <p>{error || 'Asset not found'}</p>
                    <button className="btn btn-primary" onClick={() => navigate('/asset/items')}>
                        <FiArrowLeft /> Back to Assets
                    </button>
                </div>
            </div>
        );
    }

    const showActions = !readOnly || isAuthenticated;

    // Filter history for display (exclude maintenance from general history)
    const generalHistory = asset?.history?.filter(h => h.action_type !== 'maintenance') || [];

    // Use maintenanceRecords (from state if auth, or from asset details if guest)
    const displayMaintenance = maintenanceRecords.length > 0
        ? maintenanceRecords
        : (asset?.maintenance_records || []);

    const childAssets = asset?.child_assets || [];

    const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/api$/, '');

    const getWarrantyStatusDisplay = () => {
        if (!asset.warranty_expiry) return '-';

        const now = new Date();
        const expiry = new Date(asset.warranty_expiry);
        now.setHours(0, 0, 0, 0);
        expiry.setHours(0, 0, 0, 0);

        if (expiry < now) {
            return <span style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>Expired</span>;
        }

        const duration = intervalToDuration({ start: now, end: expiry });
        const { years, months, days } = duration;

        let parts = [];
        if (years > 0) parts.push(`${years} Year`);
        if (months > 0) parts.push(`${months} Month`);
        if (days > 0) parts.push(`${days} Day`);

        const durationText = parts.length > 0 ? parts.join(' ') : 'Today';

        return (
            <span>
                <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>Active</span>
                <span style={{ marginLeft: '4px', color: 'var(--text-secondary)' }}>({durationText})</span>
            </span>
        );
    };

    return (
        <div className="user-detail asset-detail-override">
            <div className="page-header">
                <div className="header-left">
                    <button
                        className="btn btn-outline"
                        onClick={() => {
                            if (location.state?.from) {
                                navigate(location.state.from);
                            } else {
                                navigate(readOnly && !isAuthenticated ? '/login' : '/asset/items');
                            }
                        }}
                    >
                        <FiArrowLeft /> <span>{readOnly && !isAuthenticated ? 'Login' : 'Back'}</span>
                    </button>
                    <div>
                        <h1>Asset Details</h1>
                        <p>View asset information and history</p>
                    </div>
                </div>
                <div className="header-actions">
                    {/* Show Login button for guests in read-only mode */}
                    {readOnly && !isAuthenticated && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn btn-warning" onClick={() => setShowRequestModal(true)} title="Report Issue">
                                <FiAlertTriangle /> <span>Report Issue</span>
                            </button>
                            <button className="btn btn-primary btn-login-guest" onClick={() => navigate('/login', { state: { from: location } })} title="Login">
                                <FiUser /> <span>Login</span>
                            </button>
                        </div>
                    )}

                    {showActions && (
                        <>
                            {/* Primary Actions (Always Visible) */}
                            <button className="btn btn-warning" onClick={() => setShowRequestModal(true)} title="Report Issue">
                                <FiAlertTriangle /> <span>Report Issue</span>
                            </button>

                            {asset.status === 'available' && hasPermission('asset.items.checkout') && (
                                <button className="btn btn-primary" onClick={() => setShowCheckOutModal(true)} title="Check Out">
                                    <FiLogOut /> <span>Check Out</span>
                                </button>
                            )}
                            {asset.status === 'assigned' && hasPermission('asset.items.checkin') && (
                                <button className="btn btn-warning" onClick={() => setShowCheckInModal(true)} title="Check In">
                                    <FiLogIn /> <span>Check In</span>
                                </button>
                            )}

                            {/* Secondary Actions (Dropdown) */}
                            <div className="action-dropdown-container">
                                <button
                                    className="btn btn-outline btn-icon-only"
                                    onClick={() => setShowActionDropdown(!showActionDropdown)}
                                    title="More Actions"
                                >
                                    <FiMoreVertical />
                                </button>

                                {showActionDropdown && (
                                    <>
                                        <div
                                            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }}
                                            onClick={() => setShowActionDropdown(false)}
                                        />
                                        <div className="action-dropdown-menu">
                                            {(asset.status === 'available' || asset.status === 'maintenance') && hasPermission('asset.maintenance.manage') && (
                                                <button className="action-dropdown-item" onClick={() => { handleMaintenanceClick(); setShowActionDropdown(false); }}>
                                                    <FiTool className={asset.status === 'maintenance' ? 'text-warning' : ''} />
                                                    {asset.status === 'maintenance' ? "Update Maintenance" : "Maintenance"}
                                                </button>
                                            )}

                                            {hasPermission('asset.items.edit') && (
                                                <button className="action-dropdown-item" onClick={() => { setShowEditModal(true); setShowActionDropdown(false); }}>
                                                    <FiEdit2 /> Edit Asset
                                                </button>
                                            )}

                                            {hasPermission('asset.items.delete') && (
                                                <button className="action-dropdown-item text-danger" onClick={() => { handleDeleteClick(); setShowActionDropdown(false); }}>
                                                    <FiTrash2 /> Delete Asset
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="detail-content">
                {/* Asset Media Section */}
                <div className="card">
                    <div className="card-header">
                        <h2><FiImage /> Asset Media</h2>
                    </div>
                    <div className="card-body">
                        <div className="media-container">
                            <div className="media-image-section">
                                <label className="media-label">Asset Image</label>
                                <div className="image-container">
                                    {asset.image_url ? (
                                        <img src={`${BASE_URL}${asset.image_url}`} alt={asset.asset_name} className="asset-image" />
                                    ) : (
                                        <div className="placeholder-image">
                                            <FiPackage />
                                            <span>No image available</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="media-divider"></div>

                            <div className="media-qr-section">
                                <label className="media-label">QR Code</label>
                                <div className="qr-container">
                                    <div className="qr-code-wrapper" id="printable-qr">
                                        <QRCode
                                            value={`${window.location.origin}/asset/scan/${asset.id}`}
                                            size={128}
                                            style={{ height: "auto", maxWidth: "128px", width: "100%" }}
                                            viewBox={`0 0 256 256`}
                                        />
                                    </div>
                                    <button
                                        className="btn btn-outline btn-sm"
                                        style={{ marginTop: '10px', width: '100%' }}
                                        onClick={handlePrintQR}
                                    >
                                        <FiPrinter /> Print QR
                                    </button>
                                    <p className="qr-help-text">Scan to view details</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Asset Information Card */}
                <div className="card">
                    <div className="card-header">
                        <h2>Asset Information</h2>
                        <span className={`status-badge ${asset.status}`}>
                            {asset.status === 'available' && <FiCheckCircle />}
                            {asset.status === 'assigned' && <FiUser />}
                            {asset.status === 'maintenance' && <FiTool />}
                            {(asset.status === 'retired' || asset.status === 'lost') && <FiXCircle />}
                            {asset.status}
                        </span>
                    </div>
                    <div className="card-body">
                        <div className="info-grid">
                            <div className="info-item">
                                <label><FiTag /> Asset Tag</label>
                                <p>{asset.asset_tag}</p>
                            </div>
                            <div className="info-item">
                                <label><FiPackage /> Asset Name</label>
                                <p>{asset.asset_name}</p>
                            </div>
                            <div className="info-item" style={{ gridColumn: 'span 2' }}>
                                <label><FiInfo /> Description</label>
                                <p style={{ whiteSpace: 'pre-wrap' }}>{renderDescriptionWithLinks(asset.description)}</p>
                            </div>
                            <div className="info-item">
                                <label><FiPackage /> Category</label>
                                <p>{asset.category_name || '-'}</p>
                            </div>
                            <div className="info-item">
                                <label><FiPackage /> Model / Type</label>
                                <p>{asset.model || '-'}</p>
                            </div>
                            <div className="info-item">
                                <label><FiAlertCircle /> Serial Number</label>
                                <p>{asset.serial_number || '-'}</p>
                            </div>
                            <div className="info-item">
                                <label><FiTool /> Manufacturer</label>
                                <p>{asset.manufacturer || '-'}</p>
                            </div>
                            <div className="info-item">
                                <label><FiMapPin /> Location</label>
                                <p>{asset.location_name || '-'}</p>
                            </div>
                            <div className="info-item">
                                <label><FiUser /> Assigned To</label>
                                <p>
                                    {asset.assigned_to_name ? (
                                        <span><FiUser style={{ marginRight: '4px' }} /> {asset.assigned_to_name}</span>
                                    ) : asset.assigned_to_asset_name ? (
                                        <span
                                            onClick={() => navigate(`/asset/items/${asset.assigned_to_asset_id}`)}
                                            style={{ cursor: 'pointer', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        >
                                            <FiPackage /> {asset.assigned_to_asset_name}
                                        </span>
                                    ) : '-'}
                                </p>
                            </div>
                            <div className="info-item">
                                <label><FiCalendar /> Purchase Date</label>
                                <p>{asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : '-'}</p>
                            </div>
                            <div className="info-item">
                                <label><FiDollarSign /> Cost</label>
                                <p>{asset.purchase_cost ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(asset.purchase_cost) : '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Maintenance History Card */}
                {displayMaintenance.length > 0 && (
                    <div className="card">
                        <div className="card-header">
                            <h2><FiTool /> Maintenance Records</h2>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive maintenance-desktop-table">
                                <table className="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Type</th>
                                            <th>Description</th>
                                            <th>Performed By</th>
                                            {isAuthenticated && <th>Cost</th>}
                                            <th>Status</th>
                                            {hasPermission('asset.maintenance.manage') || hasPermission('asset.maintenance.view') ? <th>Action</th> : null}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayMaintenance.map((record) => (
                                            <tr key={record.id}>
                                                <td>{new Date(record.maintenance_date).toLocaleDateString()}</td>
                                                <td style={{ textTransform: 'capitalize' }}>{record.maintenance_type}</td>
                                                <td>{record.description}</td>
                                                <td>{record.performed_by || '-'}</td>
                                                {isAuthenticated && (
                                                    <td>{record.cost ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(record.cost) : '-'}</td>
                                                )}
                                                <td>
                                                    <span className={`badge ${record.status === 'completed' ? 'badge-success' :
                                                        record.status === 'in_progress' ? 'badge-warning' :
                                                            record.status === 'cancelled' ? 'badge-danger' : 'badge-primary'
                                                        }`}>
                                                        {record.status}
                                                    </span>
                                                </td>
                                                {(hasPermission('asset.maintenance.manage') || hasPermission('asset.maintenance.view')) && (
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                            {hasPermission('asset.maintenance.view') && (
                                                                <button
                                                                    className="btn-icon"
                                                                    onClick={() => navigate(`/asset/maintenance/${record.id}`, { state: { from: location.pathname } })}
                                                                    title="View Details"
                                                                >
                                                                    <FiEye />
                                                                </button>
                                                            )}
                                                            {hasPermission('asset.maintenance.manage') && (
                                                                <button
                                                                    className="btn-icon"
                                                                    onClick={() => handleEditMaintenance(record)}
                                                                    title="Edit Maintenance"
                                                                >
                                                                    <FiEdit2 />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile View for Maintenance Records */}
                            <div className="maintenance-mobile-list">
                                <div className="history-timeline">
                                    {displayMaintenance.map((record) => (
                                        <div key={record.id} className="history-item">
                                            <div className="history-icon type-maintenance">
                                                <FiTool />
                                            </div>
                                            <div className="history-content">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                    <span className="history-title" style={{ textTransform: 'capitalize', margin: 0 }}>
                                                        {record.maintenance_type} Maintenance
                                                    </span>
                                                    <span className={`badge ${record.status === 'completed' ? 'badge-success' :
                                                        record.status === 'in_progress' ? 'badge-warning' :
                                                            record.status === 'cancelled' ? 'badge-danger' : 'badge-primary'
                                                        }`}>
                                                        {record.status}
                                                    </span>
                                                </div>

                                                <div className="history-meta">
                                                    <span className="history-date">
                                                        {new Date(record.maintenance_date).toLocaleDateString()}
                                                    </span>
                                                    <span className="history-user">
                                                        by {record.performed_by || '-'}
                                                    </span>
                                                </div>

                                                {record.description && (
                                                    <p className="history-notes">{record.description}</p>
                                                )}

                                                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '1rem' }}>
                                                    {isAuthenticated && record.cost && (
                                                        <span>
                                                            <strong>Cost: </strong>
                                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(record.cost)}
                                                        </span>
                                                    )}
                                                </div>

                                                {(hasPermission('asset.maintenance.manage') || hasPermission('asset.maintenance.view')) && (
                                                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '8px' }}>
                                                        {hasPermission('asset.maintenance.view') && (
                                                            <button
                                                                className="btn btn-outline btn-sm"
                                                                onClick={() => navigate(`/asset/maintenance/${record.id}`, { state: { from: location.pathname } })}
                                                                style={{ flex: 1 }}
                                                            >
                                                                <FiEye /> View
                                                            </button>
                                                        )}
                                                        {hasPermission('asset.maintenance.manage') && (
                                                            <button
                                                                className="btn btn-outline btn-sm"
                                                                onClick={() => handleEditMaintenance(record)}
                                                                style={{ flex: 1 }}
                                                            >
                                                                <FiEdit2 /> Edit
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Asset History Card - Show for both authenticated and public/read-only */}
                <div className="card">
                    <div className="card-header">
                        <h2><FiClock /> Asset History</h2>
                    </div>
                    <div className="card-body">
                        {generalHistory.length > 0 ? (
                            <div className="history-timeline">
                                {generalHistory.map((record, index) => (
                                    <div key={index} className="history-item">
                                        <div className={`history-icon type-${record.action_type}`}>
                                            {record.action_type === 'checkout' && <FiLogOut />}
                                            {record.action_type === 'checkin' && <FiLogIn />}
                                            {record.action_type === 'create' && <FiCheckCircle />}
                                            {record.action_type === 'update' && <FiEdit2 />}
                                            {record.action_type === 'delete' && <FiTrash2 />}
                                            {/* maintenance is filtered out */}
                                        </div>
                                        <div className="history-content">
                                            <p className="history-title">
                                                {record.action_type === 'create' && 'Asset Created'}
                                                {record.action_type === 'update' && 'Asset Updated'}
                                                {record.action_type === 'delete' && 'Asset Deleted'}
                                                {record.action_type === 'checkin' && (
                                                    <>
                                                        Asset Checked In
                                                        {record.to_location_name && <span> to <strong>{record.to_location_name}</strong></span>}
                                                    </>
                                                )}
                                                {record.action_type === 'checkout' && (
                                                    <>
                                                        Checked out
                                                        {record.to_user_username && <span> to User <strong>{record.to_user_username}</strong></span>}
                                                        {record.to_asset_name && <span> to Asset <strong>{record.to_asset_name}</strong></span>}
                                                        {!record.to_asset_name && record.to_asset_id && <span> to Asset ID <strong>{record.to_asset_id}</strong></span>}
                                                        {record.to_location_name && <span> to Location <strong>{record.to_location_name}</strong></span>}
                                                    </>
                                                )}
                                                {record.action_type === 'maintenance' && 'Maintenance Performed'}
                                            </p>
                                            <div className="history-meta">
                                                <span className="history-date">
                                                    {new Date(record.action_date).toLocaleString()}
                                                </span>
                                                <span className="history-user">
                                                    by {record.performed_by_username || 'System'}
                                                </span>
                                            </div>
                                            {record.notes && <p className="history-notes">{record.notes}</p>}
                                            {record.from_location_name && record.action_type === 'checkin' && (
                                                <p className="history-detail">From Location: {record.from_location_name}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted" style={{ textAlign: 'center', padding: '20px' }}>No history available</p>
                        )}
                    </div>
                </div>

                {/* Purchase & Warranty Card */}
                < div className="card" >
                    <div className="card-header">
                        <h2><FiDollarSign /> Purchase & Warranty</h2>
                    </div>
                    <div className="card-body">
                        <div className="info-grid">
                            <div className="info-item">
                                <label><FiCalendar /> Purchase Date</label>
                                <p>{asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : '-'}</p>
                            </div>
                            <div className="info-item">
                                <label><FiDollarSign /> Purchase Cost</label>
                                <p>{asset.purchase_cost ? `Rp ${Number(asset.purchase_cost).toLocaleString()}` : '-'}</p>
                            </div>
                            <div className="info-item">
                                <label><FiUser /> Supplier</label>
                                <p>{asset.supplier_name || '-'}</p>
                            </div>
                            <div className="info-item">
                                <label><FiCalendar /> Warranty Expiry</label>
                                <p>{asset.warranty_expiry ? new Date(asset.warranty_expiry).toLocaleDateString() : '-'}</p>
                            </div>
                            <div className="info-item">
                                <label><FiCheckCircle /> Warranty Status</label>
                                <p>
                                    {getWarrantyStatusDisplay()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div >

                {/* Notes Card */}
                {
                    asset.notes && (
                        <div className="card">
                            <div className="card-header">
                                <h2><FiEdit2 /> Notes</h2>
                            </div>
                            <div className="card-body">
                                <p>{asset.notes}</p>
                            </div>
                        </div>
                    )
                }

                {/* Child Assets / Assigned Assets Card */}
                {childAssets.length > 0 && (
                    <div className="card">
                        <div className="card-header">
                            <h2><FiPackage /> Assigned Assets</h2>
                        </div>
                        <div className="card-body">
                            {/* Desktop Table View */}
                            <div className="table-responsive desktop-table-view">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Asset Tag</th>
                                            <th>Asset Name</th>
                                            <th>Category</th>
                                            <th>Location</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {childAssets.map(child => (
                                            <tr key={child.id}>
                                                <td>{child.asset_tag}</td>
                                                <td>{child.asset_name}</td>
                                                <td>{child.category_name}</td>
                                                <td>{child.location_name || '-'}</td>
                                                <td>
                                                    <span className={`status-badge-sm ${child.status}`}>
                                                        {child.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn-icon"
                                                        onClick={() => navigate(`/asset/items/${child.id}`)}
                                                        title="View Asset"
                                                    >
                                                        <FiArrowLeft style={{ transform: 'rotate(180deg)' }} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile List View */}
                            <div className="mobile-list-view">
                                {childAssets.map(child => (
                                    <div key={child.id} className="maintenance-card-mobile">
                                        <div className="maintenance-card-header">
                                            <div className="maintenance-type">
                                                <FiPackage /> {child.asset_name}
                                            </div>
                                            <span className={`status-badge-sm ${child.status}`}>
                                                {child.status}
                                            </span>
                                        </div>
                                        <div className="maintenance-card-body">
                                            <div className="maintenance-date">
                                                <FiHash /> <span>{child.asset_tag}</span>
                                            </div>
                                            <div className="maintenance-meta">
                                                <span><FiTag /> {child.category_name}</span>
                                                {child.location_name && <span><FiMapPin /> {child.location_name}</span>}
                                            </div>
                                            <button
                                                className="btn btn-outline btn-sm"
                                                onClick={() => navigate(`/asset/items/${child.id}`)}
                                                style={{ marginTop: '0.5rem', width: '100%' }}
                                            >
                                                <FiEye /> View Details
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Assigned Credentials Card - Show in both modes (filtered by backend for public) */}
                {asset.assigned_credentials && asset.assigned_credentials.length > 0 && (
                    <div className="card">
                        <div className="card-header">
                            <h2><FiLock /> Assigned Credentials</h2>
                        </div>
                        <div className="card-body">
                            {/* Desktop Table View */}
                            <div className="table-responsive desktop-table-view">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Platform</th>
                                            <th>Username</th>
                                            <th>URL</th>
                                            <th>Password</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {asset.assigned_credentials.map(cred => (
                                            <tr key={cred.id}>
                                                <td>{cred.platform_name}</td>
                                                <td>{cred.username}</td>
                                                <td>
                                                    {cred.is_public && cred.url ? (
                                                        <a href={cred.url.startsWith('http') ? cred.url : `https://${cred.url}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)' }}>
                                                            {cred.url}
                                                        </a>
                                                    ) : (
                                                        cred.is_public ? '-' : <span style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>Private</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {cred.is_public ? (
                                                        <div style={{ fontFamily: 'monospace' }}>
                                                            <PasswordReveal password={cred.password} />
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>Private</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile List View */}
                            <div className="mobile-list-view">
                                {asset.assigned_credentials.map(cred => (
                                    <div key={cred.id} className="maintenance-card-mobile">
                                        <div className="maintenance-card-header">
                                            <div className="maintenance-type" style={{ wordBreak: 'break-word' }}>
                                                <FiLock style={{ flexShrink: 0 }} /> {cred.platform_name}
                                            </div>
                                        </div>
                                        <div className="maintenance-card-body">
                                            <div className="maintenance-date">
                                                <FiUser style={{ flexShrink: 0 }} />
                                                <span style={{ wordBreak: 'break-word' }}>{cred.username}</span>
                                            </div>
                                            {cred.is_public && cred.url && (
                                                <div className="maintenance-date" style={{ alignItems: 'flex-start' }}>
                                                    <FiArrowLeft style={{ transform: 'rotate(135deg)', marginTop: '4px', flexShrink: 0 }} />
                                                    <a href={cred.url.startsWith('http') ? cred.url : `https://${cred.url}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{ color: 'var(--primary-color)', wordBreak: 'break-all', lineHeight: '1.4' }}>
                                                        {cred.url}
                                                    </a>
                                                </div>
                                            )}
                                            <div className="maintenance-meta" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Password:</span>
                                                <div style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-primary)', borderRadius: '4px', overflowX: 'auto' }}>
                                                    {cred.is_public ? (
                                                        <div style={{ fontFamily: 'monospace' }}>
                                                            <PasswordReveal password={cred.password} />
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>Private</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* System Information Card */}
                <div className="card">
                    <div className="card-header">
                        <h2><FiClock /> System Information</h2>
                    </div>
                    <div className="card-body">
                        <div className="info-grid">
                            <div className="info-item">
                                <label><FiClock /> Created At</label>
                                <p>
                                    {asset.created_at ? new Date(asset.created_at).toLocaleString() : '-'}
                                    {asset.created_by_username && <span className="text-muted"> by {asset.created_by_username}</span>}
                                </p>
                            </div>
                            <div className="info-item">
                                <label><FiClock /> Last Updated</label>
                                <p>
                                    {asset.updated_at && asset.created_at && new Date(asset.updated_at).getTime() > new Date(asset.created_at).getTime()
                                        ? new Date(asset.updated_at).toLocaleString()
                                        : 'No changes yet'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            <AssetModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSuccess={() => handleAssetUpdated('updated')}
                assetId={id}
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
                title="Delete Asset"
                message={`Are you sure you want to delete asset "${asset.asset_name}"? This action cannot be undone.`}
                confirmText="Delete Asset"
                type="danger"
            />

            <CheckOutModal
                isOpen={showCheckOutModal}
                onClose={() => setShowCheckOutModal(false)}
                onSuccess={handleTransactionSuccess}
                assetId={id}
                assetName={asset.asset_name}
            />

            <CheckInModal
                isOpen={showCheckInModal}
                onClose={() => setShowCheckInModal(false)}
                onSuccess={handleTransactionSuccess}
                assetId={id}
                assetName={asset.asset_name}
            />

            <MaintenanceModal
                isOpen={showMaintenanceModal}
                onClose={() => setShowMaintenanceModal(false)}
                onSuccess={handleMaintenanceSuccess}
                assetId={id}
                maintenanceId={maintenanceRecord?.id}
                initialData={maintenanceRecord}
            />

            <MaintenanceRequestModal
                isOpen={showRequestModal}
                onClose={() => setShowRequestModal(false)}
                onSubmit={handleSubmitRequest}
                user={user}
                loading={loading}
            />
        </div >
    );
};

export default AssetDetail;
