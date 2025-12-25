import './CredentialDetail.css';
import '../../SysAdmin/UserDetail.css'; // Inheritar base styles from UserDetail
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../../utils/axios';
import { useAuth } from '../../../contexts/AuthContext';
import ConfirmationModal from '../../../components/Modal/ConfirmationModal';
import Toast from '../../../components/Toast/Toast';
import CredentialModal from './CredentialModal';
import CredentialCheckOutModal from './CredentialCheckOutModal';
import CredentialCheckInModal from './CredentialCheckInModal';
import {
    FiArrowLeft,
    FiShield,
    FiUser,
    FiGlobe,
    FiLock,
    FiCalendar,
    FiClock,
    FiEdit2,
    FiTrash2,
    FiLogOut,
    FiCheckCircle,
    FiEye,
    FiEyeOff,
    FiCopy,
    FiInfo,
    FiMonitor,
    FiDatabase,
    FiMail,
    FiBox
} from 'react-icons/fi';

const CredentialDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hasPermission } = useAuth();

    // State
    const [credential, setCredential] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Modals
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showCheckOutModal, setShowCheckOutModal] = useState(false);
    const [showCheckInModal, setShowCheckInModal] = useState(false);

    // Password Visibility
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    useEffect(() => {
        fetchCredentialDetail();
    }, [id]);

    const fetchCredentialDetail = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/asset/credentials/${id}`);
            if (response.data.success) {
                setCredential(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching credential detail:', error);
            setError('Failed to load credential details');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async (text, label) => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setToastMessage(`${label} copied to clipboard!`);
            setShowToast(true);
        } catch (err) {
            console.error('Failed to copy code: ', err);
            // Fallback
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                setToastMessage(`${label} copied to clipboard!`);
                setShowToast(true);
            } catch (err) {
                setToastMessage('Failed to copy');
                setShowToast(true);
            }
            document.body.removeChild(textArea);
        }
    };

    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            const response = await axios.delete(`/asset/credentials/${id}`);
            if (response.data.success) {
                navigate('/asset/credentials');
            }
        } catch (error) {
            console.error('Error deleting credential:', error);
            setToastMessage('Failed to delete credential');
            setShowToast(true);
        } finally {
            setShowDeleteModal(false);
        }
    };

    const handleActionSuccess = (message) => {
        setToastMessage(message);
        setShowToast(true);
        fetchCredentialDetail();
        if (message.includes('updated')) setShowEditModal(false);
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'social_media': return <FiMonitor />;
            case 'storage': return <FiDatabase />;
            case 'email': return <FiMail />;
            case 'other':
            default: return <FiBox />;
        }
    };

    if (loading) {
        return (
            <div className="user-detail">
                <div className="loading-container">
                    <div className="loading-spinner" />
                    <p>Loading credential details...</p>
                </div>
            </div>
        );
    }

    if (error || !credential) {
        return (
            <div className="user-detail">
                <div className="error-container">
                    <h3>Error</h3>
                    <p>{error || 'Credential not found'}</p>
                    <button className="btn btn-primary" onClick={() => navigate('/asset/credentials')}>
                        <FiArrowLeft /> Back to Credentials
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="user-detail credential-detail-override">
            <div className="page-header">
                <div className="header-left">
                    <button
                        className="btn btn-outline"
                        onClick={() => navigate('/asset/credentials')}
                    >
                        <FiArrowLeft /> <span>Back</span>
                    </button>
                    <div>
                        <h1>{credential.platform_name}</h1>
                        <p>{credential.username}</p>
                    </div>
                </div>
                <div className="header-actions">
                    {hasPermission('asset.credentials.manage') && (
                        <>
                            {credential.status === 'available' && (
                                <button className="btn btn-primary" onClick={() => setShowCheckOutModal(true)} title="Check Out">
                                    <FiLogOut /> <span>Check Out</span>
                                </button>
                            )}
                            {credential.status !== 'available' && (
                                <button className="btn btn-warning" onClick={() => setShowCheckInModal(true)} title="Check In">
                                    <FiCheckCircle /> <span>Check In</span>
                                </button>
                            )}
                            <button className="btn btn-outline" onClick={() => setShowEditModal(true)} title="Edit">
                                <FiEdit2 /> <span>Edit</span>
                            </button>
                            <button className="btn btn-danger" onClick={handleDeleteClick} title="Delete">
                                <FiTrash2 /> <span>Delete</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="detail-content">
                {/* Credential Information Card */}
                <div className="card">
                    <div className="card-header">
                        <h2><FiShield /> Credential Information</h2>
                        <span className={`badge badge-secondary`} style={{ textTransform: 'capitalize' }}>
                            {getCategoryIcon(credential.category)} {credential.category ? credential.category.replace('_', ' ') : 'Other'}
                        </span>
                    </div>
                    <div className="card-body">
                        <div className="info-grid">
                            <div className="info-item">
                                <label><FiUser /> Username / Email</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <p style={{ margin: 0 }}>{credential.username}</p>
                                    <button
                                        className="btn-icon-small"
                                        onClick={() => handleCopy(credential.username, 'Username')}
                                        title="Copy Username"
                                    >
                                        <FiCopy />
                                    </button>
                                </div>
                            </div>

                            <div className="info-item">
                                <label><FiGlobe /> URL / Login Link</label>
                                {credential.url ? (
                                    <a
                                        href={credential.url.startsWith('http') ? credential.url : `https://${credential.url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="credential-link"
                                    >
                                        {credential.url} <FiGlobe />
                                    </a>
                                ) : (
                                    <p>-</p>
                                )}
                            </div>

                            <div className="info-item" style={{ gridColumn: 'span 2' }}>
                                <label><FiLock /> Password</label>
                                <div className="password-wrapper-detail">
                                    <span className="password-text-detail">
                                        {isPasswordVisible ? credential.password : '••••••••••••••••'}
                                    </span>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button
                                            className="btn-icon-small"
                                            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                            title={isPasswordVisible ? "Hide Password" : "Show Password"}
                                        >
                                            {isPasswordVisible ? <FiEyeOff /> : <FiEye />}
                                        </button>
                                        <button
                                            className="btn-icon-small"
                                            onClick={() => handleCopy(credential.password, 'Password')}
                                            title="Copy Password"
                                        >
                                            <FiCopy />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status & Assignment Card */}
                <div className="card">
                    <div className="card-header">
                        <h2><FiInfo /> Status & Assignment</h2>
                        <span className={`status-badge ${credential.status || 'available'}`}>
                            {credential.status === 'available' && <FiCheckCircle />}
                            {credential.status === 'assigned' && <FiUser />}
                            {credential.status || 'available'}
                        </span>
                    </div>
                    <div className="card-body">
                        <div className="info-grid user-info-grid">
                            <div className="info-item">
                                <label>Assigned Users</label>
                                {credential.assigned_names ? (
                                    <p>{credential.assigned_names}</p>
                                ) : (
                                    <p className="text-muted">-</p>
                                )}
                            </div>
                            <div className="info-item">
                                <label>Assigned Assets</label>
                                {credential.assigned_asset_names ? (
                                    <p>{credential.assigned_asset_names}</p>
                                ) : (
                                    <p className="text-muted">-</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes Card */}
                {credential.description && (
                    <div className="card">
                        <div className="card-header">
                            <h2><FiEdit2 /> Notes</h2>
                        </div>
                        <div className="card-body">
                            <p style={{ whiteSpace: 'pre-wrap' }}>{credential.description}</p>
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
                                    {credential.created_at ? new Date(credential.created_at).toLocaleString() : '-'}
                                    {credential.created_by_name && <span className="text-muted"> by {credential.created_by_name}</span>}
                                </p>
                            </div>
                            <div className="info-item">
                                <label><FiClock /> Last Updated</label>
                                <p>
                                    {credential.updated_at ? new Date(credential.updated_at).toLocaleString() : '-'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Modals */}
            <CredentialModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSuccess={(msg) => handleActionSuccess(msg)}
                credentialId={id}
            />

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="Delete Credential"
                message={`Are you sure you want to delete credential for "${credential.platform_name}"?`}
                confirmText="Delete Credential"
                type="danger"
            />

            <CredentialCheckOutModal
                isOpen={showCheckOutModal}
                onClose={() => setShowCheckOutModal(false)}
                onSuccess={() => handleActionSuccess('Credential checked out successfully')}
                credentialId={credential.id}
                credentialName={credential.platform_name}
                assignedUserIds={credential.assigned_ids ? credential.assigned_ids.toString().split(',') : []}
                assignedAssetIds={credential.assigned_asset_ids ? credential.assigned_asset_ids.toString().split(',') : []}
            />

            <CredentialCheckInModal
                isOpen={showCheckInModal}
                onClose={() => setShowCheckInModal(false)}
                onSuccess={() => handleActionSuccess('Credential checked in successfully')}
                credentialId={credential.id}
                credentialName={credential.platform_name}
                assignedUsers={credential.assigned_users || []}
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

export default CredentialDetail;
