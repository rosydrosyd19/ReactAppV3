import { FiUsers, FiShield, FiActivity, FiServer } from 'react-icons/fi';

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

            <div className="grid-container" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', display: 'grid' }}>
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            <div className="card mt-6">
                <h2>Recent System Logs</h2>
                <div className="table-container">
                    <p style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Log stream not connected.</p>
                </div>
            </div>
        </div>
    );
};

export default SysAdminDashboard;
