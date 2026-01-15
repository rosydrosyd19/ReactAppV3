import React, { useState, useEffect } from 'react';
import axios from '../../../../utils/axios';
import { FiPlus, FiSlash, FiX, FiSearch, FiMonitor, FiUser, FiInfo } from 'react-icons/fi';
import AssignIpModal from './AssignIpModal';
import BlockIpModal from './BlockIpModal';

const IpList = ({ subnet }) => {
    const [ips, setIps] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    // Modal Control
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [selectedIp, setSelectedIp] = useState('');

    useEffect(() => {
        if (subnet) {
            fetchIps();
        }
    }, [subnet]);

    const fetchIps = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/asset/ip/subnets/${subnet.id}/ips`);
            setIps(response.data);
        } catch (error) {
            console.error("Error fetching IPs", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnblock = async (ipAddress) => {
        if (window.confirm(`Are you sure you want to unblock/release IP ${ipAddress}?`)) {
            try {
                await axios.post('/asset/ip/unblock', {
                    subnet_id: subnet.id,
                    ip_address: ipAddress
                });
                fetchIps();
            } catch (error) {
                alert('Failed to unblock IP');
            }
        }
    };

    const filteredIps = ips.filter(ip =>
        ip.ip_address.includes(search) ||
        (ip.device_name && ip.device_name.toLowerCase().includes(search.toLowerCase())) ||
        (ip.device_tag && ip.device_tag.toLowerCase().includes(search.toLowerCase()))
    );

    const openAssign = (ip = '') => {
        setSelectedIp(ip);
        setShowAssignModal(true);
    };

    const openBlock = (ip = '') => {
        setSelectedIp(ip);
        setShowBlockModal(true);
    };

    return (
        <div className="card mt-4 fade-in">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3>IP Addresses for {subnet.subnet_address}</h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>{subnet.description || 'No description'}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-outline btn-sm btn-danger" onClick={() => openBlock()}>
                        <FiSlash /> Block IP
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => openAssign()}>
                        <FiPlus /> Assign New IP
                    </button>
                </div>
            </div>

            <div style={{ padding: '15px', borderBottom: '1px solid var(--border-color)' }}>
                <div className="input-with-icon" style={{ maxWidth: '400px' }}>
                    <FiSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '35px' }}
                        placeholder="Search IPs or devices..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="card-body" style={{ padding: 0 }}>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>IP Address</th>
                                <th>Status</th>
                                <th>Assigned To</th>
                                <th>Notes / Reason</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredIps.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                        No IPs managed yet. Use "Assign New IP" or "Block IP" to start.
                                    </td>
                                </tr>
                            ) : (
                                filteredIps.map(ip => (
                                    <tr key={ip.id}>
                                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{ip.ip_address}</td>
                                        <td>
                                            {ip.status === 'assigned' && <span className="badge badge-primary">Assigned</span>}
                                            {ip.status === 'blocked' && <span className="badge badge-danger">Blocked</span>}
                                            {ip.status === 'available' && <span className="badge badge-success">Available</span>}
                                            {ip.status === 'reserved' && <span className="badge badge-warning">Reserved</span>}
                                        </td>
                                        <td>
                                            {ip.assigned_to_asset_id ? (
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <FiMonitor size={12} /> {ip.device_tag}
                                                    </span>
                                                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{ip.device_name}</span>
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td>
                                            {ip.status === 'blocked' ? (
                                                <span style={{ color: 'var(--danger-color)', fontWeight: 500 }}>{ip.block_reason}</span>
                                            ) : (
                                                <span style={{ color: 'var(--text-secondary)' }}>{ip.notes || '-'}</span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            {(ip.status === 'assigned' || ip.status === 'blocked') && (
                                                <button
                                                    className="btn btn-outline btn-sm btn-icon-danger"
                                                    onClick={() => handleUnblock(ip.ip_address)}
                                                    title={ip.status === 'assigned' ? "Release IP" : "Unblock IP"}
                                                    style={{ padding: '6px', fontSize: '14px', border: '1px solid transparent', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '4px' }}
                                                >
                                                    <FiX />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <AssignIpModal
                isOpen={showAssignModal}
                onClose={() => setShowAssignModal(false)}
                onSuccess={() => { fetchIps(); }}
                subnet={subnet}
                ipAddress={selectedIp}
            />

            <BlockIpModal
                isOpen={showBlockModal}
                onClose={() => setShowBlockModal(false)}
                onSuccess={() => { fetchIps(); }}
                subnet={subnet}
                ipAddress={selectedIp}
            />
        </div>
    );
};

export default IpList;
