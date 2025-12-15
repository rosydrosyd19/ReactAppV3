import './AssetDetail.css';
import '../../SysAdmin/UserDetail.css';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from '../../../utils/axios';
import { useAuth } from '../../../contexts/AuthContext';
import AssetModal from '../AssetList/AssetModal';
import ConfirmationModal from '../../../components/Modal/ConfirmationModal';
import Toast from '../../../components/Toast/Toast';
import CheckOutModal from '../AssetList/CheckOutModal';
import CheckInModal from '../AssetList/CheckInModal';
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
    FiPrinter
} from 'react-icons/fi';

const AssetDetail = ({ readOnly = false }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { hasPermission, isAuthenticated } = useAuth();
    const [asset, setAsset] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showCheckOutModal, setShowCheckOutModal] = useState(false);
    const [showCheckInModal, setShowCheckInModal] = useState(false);

    useEffect(() => {
        fetchAssetDetail();
    }, [id, isAuthenticated]);

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
        fetchAssetDetail();
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
                        <h2>${asset.asset_name}</h2>
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
                        <button className="btn btn-primary btn-login-guest" onClick={() => navigate('/login', { state: { from: location } })} title="Login">
                            <FiUser /> <span>Login</span>
                        </button>
                    )}

                    {showActions && (
                        <>
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

                            {hasPermission('asset.items.edit') && (
                                <button className="btn btn-outline" onClick={() => setShowEditModal(true)} title="Edit">
                                    <FiEdit2 /> <span>Edit</span>
                                </button>
                            )}
                            {hasPermission('asset.items.delete') && (
                                <button className="btn btn-danger" onClick={handleDeleteClick} title="Delete">
                                    <FiTrash2 /> <span>Delete</span>
                                </button>
                            )}
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
                                        <img src={asset.image_url} alt={asset.asset_name} className="asset-image" />
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
                            <div className="info-item">
                                <label><FiPackage /> Category</label>
                                <p>{asset.category_name || '-'}</p>
                            </div>
                            <div className="info-item">
                                <label><FiPackage /> Model</label>
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

                {/* Asset History Card */}
                {!readOnly && (
                    <div className="card">
                        <div className="card-header">
                            <h2><FiClock /> Asset History</h2>
                        </div>
                        <div className="card-body">
                            {asset.history && asset.history.length > 0 ? (
                                <div className="history-timeline">
                                    {asset.history.map((record, index) => (
                                        <div key={index} className="history-item">
                                            <div className={`history-icon type-${record.action_type}`}>
                                                {record.action_type === 'checkout' && <FiLogOut />}
                                                {record.action_type === 'checkin' && <FiLogIn />}
                                                {record.action_type === 'create' && <FiCheckCircle />}
                                                {record.action_type === 'update' && <FiEdit2 />}
                                                {record.action_type === 'delete' && <FiTrash2 />}
                                                {record.action_type === 'maintenance' && <FiTool />}
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
                )}
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
        </div >
    );
};

export default AssetDetail;
