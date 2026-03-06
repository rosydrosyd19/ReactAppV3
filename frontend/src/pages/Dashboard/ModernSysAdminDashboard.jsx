import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiUsers, FiShield, FiActivity, FiServer, FiUserPlus, FiSettings, FiFileText, FiDatabase } from 'react-icons/fi';
import './ModernSysAdminDashboard.css';

const ModernSysAdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        const hour = new Date().getHours();
        const name = user?.full_name || user?.username || 'Admin';

        if (hour < 12) {
            setGreeting(`Selamat pagi, ${name}! Sistem berjalan lancar hari ini.`);
        } else if (hour < 18) {
            setGreeting(`Selamat siang, ${name}! Semua sistem operasional.`);
        } else {
            setGreeting(`Selamat malam, ${name}! Monitor sistem tetap stabil.`);
        }
    }, [user]);

    // Dummy data - in real app, fetch from API
    const metrics = [
        { title: 'Total Users', value: '12', trend: '+2 new', icon: <FiUsers size={18} />, color: 'purple' },
        { title: 'Active Roles', value: '4', trend: 'Stable', icon: <FiShield size={18} />, color: 'pink' },
        { title: 'System Logs (24h)', value: '1,248', trend: '+15.3%', icon: <FiActivity size={18} />, color: 'indigo' },
        { title: 'Server Status', value: '99.9%', trend: 'Online', icon: <FiServer size={18} />, color: 'emerald' }
    ];

    const recentLogs = [
        { user: 'System', action: 'User login successful', time: '2m ago', color: 'emerald', severity: 'info' },
        { user: 'Admin', action: 'Updated role permissions', time: '15m ago', color: 'indigo', severity: 'info' },
        { user: 'System', action: 'Failed login attempt detected', time: '1h ago', color: 'amber', severity: 'warning' },
        { user: 'Backup', action: 'Database backup completed', time: '3h ago', color: 'emerald', severity: 'success' }
    ];

    return (
        <div className="modern-sysadmin-dashboard">
            <div className="dashboard-container">
                {/* Header */}
                <div className="dashboard-header">
                    <div>
                        <h1 className="dashboard-title">
                            System Administrator <span className="title-gradient">Dashboard</span>
                        </h1>
                        <p className="dashboard-subtitle">"{greeting}"</p>
                    </div>
                </div>

                {/* Metrics Grid */}
                <section className="metrics-section">
                    <div className="metrics-grid">
                        {metrics.map((metric, index) => (
                            <MetricCard key={index} {...metric} />
                        ))}
                    </div>
                </section>

                {/* Main Content Grid */}
                <div className="content-grid">
                    {/* System Health Chart */}
                    <div className="chart-card">
                        <div className="chart-header">
                            <div>
                                <h3 className="chart-title">System Health</h3>
                                <p className="chart-subtitle">Performance metrics over time</p>
                            </div>
                        </div>
                        <div className="chart-container">
                            {/* Line Chart */}
                            <svg className="line-chart" viewBox="0 0 400 150" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                {/* Grid Lines */}
                                <line x1="0" y1="0" x2="400" y2="0" stroke="rgba(148, 163, 184, 0.2)" strokeWidth="1" />
                                <line x1="0" y1="50" x2="400" y2="50" stroke="rgba(148, 163, 184, 0.2)" strokeWidth="1" />
                                <line x1="0" y1="100" x2="400" y2="100" stroke="rgba(148, 163, 184, 0.2)" strokeWidth="1" />
                                <line x1="0" y1="150" x2="400" y2="150" stroke="rgba(148, 163, 184, 0.2)" strokeWidth="1" />

                                {/* Area Fill */}
                                <path d="M0,150 L0,120 C50,110 100,125 150,100 C200,75 250,85 300,60 C350,35 400,50 400,150 Z" fill="url(#healthGradient)" />

                                {/* Line Path */}
                                <path d="M0,120 C50,110 100,125 150,100 C200,75 250,85 300,60 C350,35 400,50 400,50" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" />

                                {/* Dots */}
                                <circle cx="150" cy="100" r="4" fill="#8b5cf6" stroke="white" strokeWidth="2" />
                                <circle cx="300" cy="60" r="4" fill="#8b5cf6" stroke="white" strokeWidth="2" />
                            </svg>
                            <div className="chart-stats">
                                <div className="stat-item">
                                    <span className="stat-label">CPU</span>
                                    <span className="stat-value">45%</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Memory</span>
                                    <span className="stat-value">62%</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Disk</span>
                                    <span className="stat-value">38%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Logs */}
                    <div className="activity-card">
                        <h3 className="activity-title">Recent System Logs</h3>
                        <div className="activity-list">
                            {recentLogs.map((log, index) => (
                                <LogItem key={index} {...log} />
                            ))}
                        </div>
                        <button className="view-all-btn" onClick={() => navigate('/sysadmin/activity-logs')}>
                            View All Logs
                        </button>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="quick-actions-section">
                    <h3 className="section-title">Quick Actions</h3>
                    <div className="quick-actions-grid">
                        <QuickActionButton
                            label="Add User"
                            icon={<FiUserPlus size={18} />}
                            onClick={() => navigate('/sysadmin/users')}
                        />
                        <QuickActionButton
                            label="Manage Roles"
                            icon={<FiShield size={18} />}
                            onClick={() => navigate('/sysadmin/roles')}
                        />
                        <QuickActionButton
                            label="Activity Logs"
                            icon={<FiFileText size={18} />}
                            onClick={() => navigate('/sysadmin/activity-logs')}
                        />
                        <QuickActionButton
                            label="Settings"
                            icon={<FiSettings size={18} />}
                            onClick={() => navigate('/sysadmin/settings')}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Sub-components
const MetricCard = ({ title, value, trend, icon, color }) => {
    return (
        <div className="metric-card">
            <div className="metric-header">
                <div className={`metric-icon ${color}`}>
                    {icon}
                </div>
                <span className="metric-trend">
                    {trend}
                </span>
            </div>
            <p className="metric-title">{title}</p>
            <p className="metric-value">{value}</p>
        </div>
    );
};

const LogItem = ({ user, action, time, color, severity }) => (
    <div className="activity-item">
        <div className={`activity-avatar ${color}`}>
            {user.charAt(0)}
        </div>
        <div className="activity-content">
            <p className="activity-text">
                <span className={`severity-badge ${severity}`}>{severity}</span>
                {user} <span className="activity-action">{action}</span>
            </p>
            <p className="activity-time">{time}</p>
        </div>
    </div>
);

const QuickActionButton = ({ label, icon, onClick }) => (
    <button className="quick-action-btn" onClick={onClick}>
        <div className="quick-action-icon">{icon}</div>
        <span className="quick-action-label">{label}</span>
    </button>
);

export default ModernSysAdminDashboard;
