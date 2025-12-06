import { FiPackage, FiCheckCircle, FiAlertCircle, FiXCircle } from 'react-icons/fi';

const StatCard = ({ title, value, icon, color, bgColor }) => (
    <div className="card stat-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
            padding: '1rem',
            borderRadius: '50%',
            backgroundColor: bgColor,
            color: color,
            display: 'flex',
            fontSize: '1.5rem'
        }}>
            {icon}
        </div>
        <div>
            <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{title}</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{value}</p>
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

            <div className="grid-container" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', display: 'grid' }}>
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            <div className="card mt-6">
                <h2>Recent Asset Activity</h2>
                <div className="table-container">
                    <p style={{ padding: '1rem', color: 'var(--text-secondary)' }}>No recent activity to display.</p>
                </div>
            </div>
        </div>
    );
};

export default AssetDashboard;
