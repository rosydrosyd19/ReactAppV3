import React, { useState, useEffect } from 'react';
import axios from '../../../../utils/axios';
import { FiPlus, FiTrash2, FiGlobe, FiInfo } from 'react-icons/fi';

const SubnetList = ({ routerId, onSelectSubnet }) => {
    const [subnets, setSubnets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        subnet_address: '',
        subnet_mask: '',
        gateway: '',
        vlan_id: '',
        description: ''
    });

    useEffect(() => {
        if (routerId) {
            fetchSubnets();
        }
    }, [routerId]);

    const fetchSubnets = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/asset/ip/subnets`);
            const filtered = response.data.filter(s => s.router_id == routerId);
            setSubnets(filtered);
        } catch (error) {
            console.error("Error fetching subnets", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/asset/ip/subnets', { ...formData, router_id: routerId });
            setShowModal(false);
            setFormData({ subnet_address: '', subnet_mask: '', gateway: '', vlan_id: '', description: '' });
            fetchSubnets();
        } catch (error) {
            alert('Failed to create subnet');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure? This will delete all IPs in this subnet.')) {
            try {
                await axios.delete(`/asset/ip/subnets/${id}`);
                fetchSubnets();
                onSelectSubnet(null);
            } catch (error) {
                alert('Failed to delete subnet');
            }
        }
    };

    return (
        <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Subnets</h3>
                <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
                    <FiPlus /> Add Subnet
                </button>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
                {subnets.length === 0 ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <FiGlobe size={32} style={{ marginBottom: '10px', opacity: 0.5 }} />
                        <p>No subnets found for this router.</p>
                        <p style={{ fontSize: '13px' }}>Create a subnet to start assigning IPs.</p>
                    </div>
                ) : (
                    <div>
                        {subnets.map(subnet => (
                            <div key={subnet.id} className="subnet-item-row" onClick={() => onSelectSubnet(subnet)}>
                                <div className="subnet-info">
                                    <h4>
                                        <FiGlobe className="text-primary" />
                                        {subnet.subnet_address}
                                        {subnet.vlan_id && <span className="badge badge-info">VLAN {subnet.vlan_id}</span>}
                                    </h4>
                                    <div className="subnet-meta">
                                        Gateway: {subnet.gateway || '-'} | Mask: {subnet.subnet_mask || '-'}
                                    </div>
                                    {subnet.description && <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{subnet.description}</div>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div className="subnet-stats">
                                        <span className="badge badge-success">{subnet.assigned_ips || 0} / {subnet.total_ips || 0} IPs</span>
                                    </div>
                                    <button
                                        className="btn-icon-danger"
                                        onClick={(e) => { e.stopPropagation(); handleDelete(subnet.id); }}
                                        title="Delete Subnet"
                                    >
                                        <FiTrash2 />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3 className="modal-title">Add Subnet</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Subnet Address (CIDR/Network)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="192.168.1.0/24"
                                        required
                                        value={formData.subnet_address}
                                        onChange={e => setFormData({ ...formData, subnet_address: e.target.value })}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Gateway</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.gateway}
                                            onChange={e => setFormData({ ...formData, gateway: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">VLAN ID</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.vlan_id}
                                            onChange={e => setFormData({ ...formData, vlan_id: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Subnet Mask</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="255.255.255.0"
                                        value={formData.subnet_mask}
                                        onChange={e => setFormData({ ...formData, subnet_mask: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-textarea"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        style={{ height: '80px', minHeight: '80px' }}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Subnet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubnetList;
