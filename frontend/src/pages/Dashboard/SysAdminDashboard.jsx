import './Dashboard.css';
import { FiUsers, FiShield, FiActivity, FiServer } from 'react-icons/fi';

const StatCard = ({ title, value, icon, color, bgColor }) => (
    <div className="stat-card">
        <div className="stat-icon" style={{ backgroundColor: bgColor, color: color }}>
            {icon}
        </div>
        <div className="stat-content">
            <div className="stat-value">{value}</div>
            <div className="stat-title">{title}</div>
        </div>
    </div>
);

const SysAdminDashboard = () => {
    // In a real app, these values would come from an API
    const stats = [
        { title: 'Total Users', value: '12', icon: <FiUsers />, color: '#8b5cf6', bgColor: '#f5f3ff' },
        { title: 'Active Roles', value: '4', icon: <FiShield />, color: '#ec4899', bgColor: '#fdf2f8' },
        { title: 'System Logs (24h)', value: '1,248', icon: <FiActivity />, color: '#6366f1', bgColor: '#eef2ff' },
        { title: 'Server Status', value: 'Online', icon: <FiServer />, color: '#10b981', bgColor: '#ecfdf5' },
    ];

    return (
        <div className="dashboard-container">
            <h1 className="page-title">System Administrator Dashboard</h1>

            <div className="dashboard-grid">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            <div className="card mt-6">
                <h2 className="card-header">Recent System Logs</h2>
                <div className="table-container">
                    <p style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Log stream not connected.</p>
                </div>
            </div>
        </div>
    );
};

export default SysAdminDashboard;
