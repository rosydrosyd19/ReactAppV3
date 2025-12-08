import './Dashboard.css';
import { FiPackage, FiCheckCircle, FiAlertCircle, FiXCircle } from 'react-icons/fi';

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

const AssetDashboard = () => {
    // In a real app, these values would come from an API
    const stats = [
        { title: 'Total Assets', value: '124', icon: <FiPackage />, color: '#3b82f6', bgColor: '#eff6ff' },
        { title: 'Available', value: '86', icon: <FiCheckCircle />, color: '#10b981', bgColor: '#ecfdf5' },
        { title: 'Assigned', value: '32', icon: <FiAlertCircle />, color: '#f59e0b', bgColor: '#fffbeb' },
        { title: 'Broken/Lost', value: '6', icon: <FiXCircle />, color: '#ef4444', bgColor: '#fef2f2' },
    ];

    return (
        <div className="dashboard-container">
            <h1 className="page-title">Asset Management Dashboard</h1>

            <div className="dashboard-grid">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            <div className="card mt-6">
                <h2 className="card-header">Recent Asset Activity</h2>
                <div className="table-container">
                    <p style={{ padding: '1rem', color: 'var(--text-secondary)' }}>No recent activity to display.</p>
                </div>
            </div>
        </div>
    );
};

export default AssetDashboard;
