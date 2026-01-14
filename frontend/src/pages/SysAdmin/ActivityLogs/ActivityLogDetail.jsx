import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../utils/axios';
import { FiArrowLeft, FiActivity, FiUser, FiCpu, FiClock, FiGlobe } from 'react-icons/fi';
import './ActivityLogs.css';

const ActivityLogDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [log, setLog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchLogDetail();
    }, [id]);

    const fetchLogDetail = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/sysadmin/logs/${id}`);
            if (response.data.success) {
                setLog(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching log detail:', err);
            setError('Failed to load log details');
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (action) => {
        const act = (action || '').toUpperCase();
        if (act.includes('CREATE') || act.includes('ADD') || act.includes('INSERT')) return 'badge-success';
        if (act.includes('UPDATE') || act.includes('EDIT')) return 'badge-info';
        if (act.includes('DELETE') || act.includes('REMOVE')) return 'badge-error';
        if (act.includes('LOGIN')) return 'badge-primary';
        if (act.includes('LOGOUT')) return 'badge-neutral';
        return 'badge-ghost';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="activity-log-detail mt-8 flex justify-center">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (error || !log) {
        return (
            <div className="activity-log-detail">
                <div className="error-container">
                    <h3>Error</h3>
                    <p>{error || 'Log record not found'}</p>
                    <button className="btn btn-outline" onClick={() => navigate('/sysadmin/logs')}>
                        <FiArrowLeft /> Back to Logs
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="activity-log-detail">
            <div className="page-header">
                <div className="header-left">
                    <button className="btn btn-outline" onClick={() => navigate('/sysadmin/logs')}>
                        <FiArrowLeft /> <span>Back</span>
                    </button>
                    <div>
                        <h1>Log Details #{log.id}</h1>
                        <p>Detailed view of system activity</p>
                    </div>
                </div>
            </div>

            <div className="detail-layout">
                {/* Main Content */}
                <div className="detail-main">
                    <div className="card">
                        <div className="card-header">
                            <h2><FiActivity /> General Information</h2>
                        </div>
                        <div className="card-body">
                            <div className="info-grid">
                                <div className="form-control">
                                    <span className="label-text">Action</span>
                                    <div className="value-text">
                                        <span className={`badge ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </div>
                                </div>

                                <div className="form-control">
                                    <span className="label-text">Module</span>
                                    <div className="value-text">
                                        <FiCpu className="text-primary" /> {log.module}
                                    </div>
                                </div>

                                <div className="form-control">
                                    <span className="label-text">Date & Time</span>
                                    <div className="value-text font-mono">
                                        <FiClock /> {formatDate(log.created_at)}
                                    </div>
                                </div>

                                <div className="form-control">
                                    <span className="label-text">IP Address</span>
                                    <div className="value-text font-mono">
                                        <FiGlobe /> {log.ip_address}
                                    </div>
                                </div>
                            </div>

                            <div className="divider my-6"></div>

                            <div className="form-control">
                                <span className="label-text mb-2">Metadata / Details</span>
                                <div className="bg-base-300 p-4 rounded-lg overflow-x-auto">
                                    <pre className="text-sm font-mono" style={{ margin: 0 }}>
                                        {JSON.stringify(
                                            typeof log.details === 'string'
                                                ? JSON.parse(log.details)
                                                : log.details,
                                            null,
                                            2
                                        )}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="detail-sidebar">
                    <div className="card">
                        <div className="card-header">
                            <h2><FiUser /> User Information</h2>
                        </div>
                        <div className="card-body">
                            <div className="user-info-header">
                                <div className="user-avatar-large">
                                    {(log.username || '?').charAt(0).toUpperCase()}
                                </div>
                                <div className="user-details">
                                    <h3>{log.username || 'System'}</h3>
                                    <p>{log.email || '-'}</p>
                                </div>
                            </div>

                            <div className="info-row">
                                <span className="info-label">Full Name</span>
                                <span className="info-val">{log.full_name || '-'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">User ID</span>
                                <span className="info-val font-mono">{log.user_id}</span>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h2>System Info</h2>
                        </div>
                        <div className="card-body">
                            <div className="form-control">
                                <span className="label-text">User Agent</span>
                                <div className="bg-base-200 p-3 rounded text-xs break-all font-mono mt-1">
                                    {log.user_agent}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityLogDetail;
