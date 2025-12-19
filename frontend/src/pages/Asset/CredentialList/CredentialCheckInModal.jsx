import { useState, useEffect } from 'react';
import { FiX, FiCheckCircle, FiUser } from 'react-icons/fi';
import axios from '../../../utils/axios';

const CredentialCheckInModal = ({ isOpen, onClose, onSuccess, credentialId, credentialName, assignedUsers = [] }) => {
    const [submitting, setSubmitting] = useState(false);
    const [notes, setNotes] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [userList, setUserList] = useState([]);

    useEffect(() => {
        if (isOpen) {
            setNotes('');
            const initialList = assignedUsers || [];
            setUserList(initialList);

            // If only one user, auto-select them
            if (initialList.length === 1) {
                setSelectedUserId(initialList[0].id);
            } else {
                setSelectedUserId('');
            }
        }
    }, [isOpen, assignedUsers]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (userList.length > 1 && !selectedUserId) {
            alert('Please select a user to check in.');
            return;
        }

        try {
            setSubmitting(true);
            const response = await axios.post(`/asset/credentials/${credentialId}/checkin`, {
                notes: notes,
                user_id: selectedUserId || undefined
            });

            if (response.data.success) {
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error('Error checking in credential:', error);
            // Handle specific backend error for ambiguous checkin
            if (error.response?.data?.requires_user_selection) {
                const users = error.response.data.assigned_users || [];
                setUserList(users);
                // alert('Multiple users found. Please select who to check in below.'); // Optional: Use toast or inline message
            } else {
                alert(error.response?.data?.message || 'Failed to checkin credential');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Check In Credential</h2>
                    <button className="close-btn" onClick={onClose}>
                        <FiX />
                    </button>
                </div>
                <div className="modal-body">
                    <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
                        Confirm check-in for <strong>{credentialName}</strong>?
                    </p>

                    <form onSubmit={handleSubmit} id="checkin-form">
                        {userList.length > 1 && (
                            <div className="form-group">
                                <label>Select User to Check In <span className="text-danger">*</span></label>
                                <div className="user-selection-list" style={{
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    overflow: 'hidden',
                                    marginTop: '8px'
                                }}>
                                    {userList.map(user => (
                                        <div key={user.id}
                                            className={`user-option ${selectedUserId == user.id ? 'selected' : ''}`}
                                            onClick={() => setSelectedUserId(user.id)}
                                            style={{
                                                padding: '10px 12px',
                                                borderBottom: '1px solid var(--border-color)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                backgroundColor: selectedUserId == user.id ? 'var(--bg-highlight)' : 'transparent'
                                            }}
                                        >
                                            <input
                                                type="radio"
                                                name="user_checkin"
                                                checked={selectedUserId == user.id}
                                                onChange={() => setSelectedUserId(user.id)}
                                                style={{ marginRight: '10px' }}
                                            />
                                            <span>{user.name || user.username || user.full_name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {userList.length === 1 && (
                            <div className="summary-card" style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Currently Assigned To:</div>
                                <div style={{ fontWeight: '500', display: 'flex', alignItems: 'center', marginTop: '4px' }}>
                                    <FiUser style={{ marginRight: '6px' }} />
                                    {userList[0].name || userList[0].username || userList[0].full_name}
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label>Notes</label>
                            <div className="input-with-icon-right">
                                <textarea
                                    className="form-input"
                                    placeholder="Optional notes about return..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows="3"
                                    style={{ resize: 'vertical', minHeight: '80px', paddingRight: '1rem' }}
                                />
                            </div>
                        </div>
                    </form>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-outline" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="checkin-form"
                        className="btn btn-primary"
                        disabled={submitting || (userList.length > 1 && !selectedUserId)}
                    >
                        {submitting ? 'Saving...' : <><FiCheckCircle style={{ marginRight: '6px' }} /> Check In</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CredentialCheckInModal;
