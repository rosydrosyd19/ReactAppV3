import { useState, useEffect } from 'react';
import { FiX, FiCheckCircle, FiUser, FiFileText } from 'react-icons/fi';
import axios from '../../../utils/axios';

const CredentialCheckInModal = ({ isOpen, onClose, onSuccess, credentialId, credentialName, assignedUsers = [] }) => {
    const [submitting, setSubmitting] = useState(false);
    const [notes, setNotes] = useState('');
    const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
    const [assignmentList, setAssignmentList] = useState([]);

    useEffect(() => {
        if (isOpen) {
            setNotes('');
            // assignedUsers now contains objects with { id, name, type: 'user'|'asset' }
            const initialList = assignedUsers || [];
            setAssignmentList(initialList);

            // If only one assignment, auto-select it
            if (initialList.length === 1) {
                // Combine ID and Type to ensure uniqueness if IDs overlap (though they are different tables)
                // Actually, just store the ID and find type later, or store composite key
                setSelectedAssignmentId(`${initialList[0].type}:${initialList[0].id}`);
            } else {
                setSelectedAssignmentId('');
            }
        }
    }, [isOpen, assignedUsers]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (assignmentList.length > 1 && !selectedAssignmentId) {
            alert('Please select an assignment to check in.');
            return;
        }

        try {
            setSubmitting(true);

            const payload = { notes };

            if (selectedAssignmentId) {
                const [type, id] = selectedAssignmentId.split(':');
                if (type === 'user') {
                    payload.user_id = id;
                } else {
                    payload.asset_id = id;
                }
            }

            const response = await axios.post(`/asset/credentials/${credentialId}/checkin`, payload);

            if (response.data.success) {
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error('Error checking in credential:', error);
            // Handle specific backend error for ambiguous checkin
            if (error.response?.data?.requires_selection) {
                // Map backend simplified response to our format
                const rawAssignments = error.response.data.assignments || [];
                const formattedList = rawAssignments.map(a => {
                    if (a.user_id) return { id: a.user_id, name: a.full_name || a.username, type: 'user' };
                    if (a.asset_id) return { id: a.asset_id, name: a.asset_name, type: 'asset' };
                    return null;
                }).filter(Boolean);

                setAssignmentList(formattedList);
            } else {
                alert(error.response?.data?.message || 'Failed to checkin credential');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    // Helper to get selected item details
    const getSelectedItem = () => {
        if (!selectedAssignmentId) return null;
        const [type, id] = selectedAssignmentId.split(':');
        return assignmentList.find(a => a.type == type && a.id == id);
    };

    const selectedItem = getSelectedItem();

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
                        {assignmentList.length > 1 && (
                            <div className="form-group">
                                <label>Select Assignment to Check In <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                                <div className="user-selection-list" style={{
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    overflow: 'hidden',
                                    marginTop: '8px'
                                }}>
                                    {assignmentList.map(item => {
                                        const value = `${item.type}:${item.id}`;
                                        return (
                                            <div key={value}
                                                className={`user-option ${selectedAssignmentId === value ? 'selected' : ''}`}
                                                onClick={() => setSelectedAssignmentId(value)}
                                                style={{
                                                    padding: '10px 12px',
                                                    borderBottom: '1px solid var(--border-color)',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    backgroundColor: selectedAssignmentId === value ? 'var(--bg-highlight)' : 'transparent'
                                                }}
                                            >
                                                <input
                                                    type="radio"
                                                    name="assignment_checkin"
                                                    checked={selectedAssignmentId === value}
                                                    onChange={() => setSelectedAssignmentId(value)}
                                                    style={{ marginRight: '10px' }}
                                                />
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {item.type === 'user' ? <FiUser /> : <FiFileText />}
                                                    {item.name}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {assignmentList.length === 1 && selectedItem && (
                            <div className="summary-card" style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Currently Assigned To:</div>
                                <div style={{ fontWeight: '500', display: 'flex', alignItems: 'center', marginTop: '4px', gap: '6px' }}>
                                    {selectedItem.type === 'user' ? <FiUser /> : <FiFileText />}
                                    {selectedItem.name}
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
                        disabled={submitting || (assignmentList.length > 1 && !selectedAssignmentId)}
                    >
                        {submitting ? 'Saving...' : <><FiCheckCircle style={{ marginRight: '6px' }} /> Check In</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CredentialCheckInModal;
