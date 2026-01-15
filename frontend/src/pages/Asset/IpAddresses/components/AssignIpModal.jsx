import React, { useState, useEffect } from 'react';
import axios from '../../../../utils/axios';
import { FiSearch, FiX } from 'react-icons/fi';

const AssignIpModal = ({ isOpen, onClose, onSuccess, subnet, ipAddress }) => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedAssetId, setSelectedAssetId] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');

    // State for manual IP enty
    const [manualIp, setManualIp] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchAssets();
            setSearch('');
            setSelectedAssetId('');
            setNotes('');
            setError('');

            // Initialize manual IP if no specific IP was filtered/selected
            if (ipAddress) {
                setManualIp(ipAddress);
            } else if (subnet && subnet.subnet_address) {
                // Try to guess prefix: 192.168.1.0/24 -> 192.168.1.
                const parts = subnet.subnet_address.split('.');
                if (parts.length === 4) {
                    // Remove CIDR if present
                    const lastPart = parts[3].split('/')[0];
                    if (lastPart === '0') {
                        setManualIp(`${parts[0]}.${parts[1]}.${parts[2]}.`);
                    } else {
                        setManualIp('');
                    }
                }
            } else {
                setManualIp('');
            }
        }
    }, [isOpen, ipAddress, subnet]);

    const fetchAssets = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/asset/assets');
            if (response.data.success) {
                setAssets(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch assets", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const finalIp = ipAddress || manualIp;

        if (!finalIp) {
            setError('IP Address is required');
            return;
        }

        try {
            await axios.post('/asset/ip/assign', {
                subnet_id: subnet.id,
                ip_address: finalIp,
                assigned_to_asset_id: selectedAssetId,
                notes
            });
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to assign IP');
        }
    };

    const filteredAssets = assets.filter(asset =>
        asset.asset_name.toLowerCase().includes(search.toLowerCase()) ||
        asset.asset_tag.toLowerCase().includes(search.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <div className="modal-header">
                    <h3 className="modal-title">{ipAddress ? `Assign IP: ${ipAddress}` : 'Assign New IP'}</h3>
                    <button className="modal-close" onClick={onClose}><FiX /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && <div className="alert alert-error">{error}</div>}

                        {!ipAddress && (
                            <div className="form-group">
                                <label className="form-label">IP Address</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={manualIp}
                                    onChange={e => setManualIp(e.target.value)}
                                    placeholder="Ex: 192.168.1.10"
                                    required
                                />
                                {subnet && <p className="text-secondary" style={{ fontSize: '12px', marginTop: '4px' }}>Subnet: {subnet.subnet_address}</p>}
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Search Device</label>
                            <div className="input-with-icon">
                                <FiSearch style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-secondary)' }} />
                                <input
                                    type="text"
                                    className="form-input"
                                    style={{ paddingLeft: '35px' }}
                                    placeholder="Search by name or tag..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Select Device</label>
                            <select
                                className="form-select"
                                value={selectedAssetId}
                                onChange={e => setSelectedAssetId(e.target.value)}
                                required
                                size={5}
                                style={{ height: '150px' }}
                            >
                                <option value="" disabled>Select a device</option>
                                {filteredAssets.map(asset => (
                                    <option key={asset.id} value={asset.id}>
                                        {asset.asset_tag} - {asset.asset_name}
                                    </option>
                                ))}
                            </select>
                            {filteredAssets.length === 0 && <p className="text-secondary" style={{ fontSize: '12px', marginTop: '5px' }}>No devices found matching search.</p>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Notes</label>
                            <textarea
                                className="form-textarea"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Additional notes..."
                                style={{ height: '80px', minHeight: '80px' }}
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={!selectedAssetId || (!ipAddress && !manualIp)}>Assign IP</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AssignIpModal;
