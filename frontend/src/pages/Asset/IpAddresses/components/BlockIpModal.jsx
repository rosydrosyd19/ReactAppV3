import React, { useState, useEffect } from 'react';
import axios from '../../../../utils/axios';
import { FiX, FiAlertTriangle } from 'react-icons/fi';

const BlockIpModal = ({ isOpen, onClose, onSuccess, subnet, ipAddress }) => {
    const [reason, setReason] = useState('');
    const [manualIp, setManualIp] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && !ipAddress && subnet) {
            // Auto-fill prefix
            const parts = subnet.subnet_address.split('/');
            const ipParts = parts[0].split('.');
            if (ipParts.length === 4 && parts[0].endsWith('.0')) {
                // e.g. 192.168.1.0 -> 192.168.1.
                setManualIp(`${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.`);
            }
        } else {
            setManualIp('');
        }
    }, [isOpen, ipAddress, subnet]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const targetIp = ipAddress || manualIp;

        if (!targetIp) {
            setError('IP Address is required');
            return;
        }

        try {
            await axios.post('/asset/ip/block', {
                subnet_id: subnet.id,
                ip_address: targetIp,
                block_reason: reason
            });
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to block IP');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <div className="modal-header">
                    <h3 className="modal-title">{ipAddress ? `Block IP: ${ipAddress}` : 'Block New IP'}</h3>
                    <button className="modal-close" onClick={onClose}><FiX /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && <div className="alert alert-error">{error}</div>}

                        <div className="alert alert-warning">
                            <FiAlertTriangle style={{ fontSize: '18px', flexShrink: 0 }} />
                            <p style={{ margin: 0, fontSize: '13px' }}>Blocking an IP will prevent it from being assigned to any device. It will be marked as "blocked".</p>
                        </div>

                        {!ipAddress && (
                            <div className="form-group">
                                <label className="form-label">
                                    IP Address <span style={{ color: 'var(--danger-color)' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={manualIp}
                                    onChange={e => setManualIp(e.target.value)}
                                    placeholder="e.g. 192.168.1.50"
                                    required
                                />
                                <small style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                                    Enter the full IP address you want to block.
                                </small>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">
                                Reason for Blocking <span style={{ color: 'var(--danger-color)' }}>*</span>
                            </label>
                            <textarea
                                className="form-textarea"
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                placeholder="e.g. Conflict, Reserved for critical infra..."
                                required
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-danger">Block IP</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BlockIpModal;
