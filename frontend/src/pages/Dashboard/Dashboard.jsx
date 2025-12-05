import './Dashboard.css';
import { useAuth } from '../../contexts/AuthContext';
import { FiPackage, FiUsers, FiActivity, FiTrendingUp } from 'react-icons/fi';

const Dashboard = () => {
    const { user, modules } = useAuth();

    const stats = [
        {
            title: 'Total Assets',
            value: '0',
            icon: <FiPackage />,
            color: '#3b82f6',
            show: modules.includes('asset'),
        },
        {
            title: 'Active Users',
            value: '0',
            icon: <FiUsers />,
            color: '#10b981',
            show: modules.includes('sysadmin'),
        },
        {
            title: 'Activities Today',
            value: '0',
            icon: <FiActivity />,
            color: '#f59e0b',
            show: true,
        },
        {
            title: 'System Health',
            value: '100%',
            icon: <FiTrendingUp />,
            color: '#06b6d4',
            show: true,
        },
    ];

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Dashboard</h1>
                <p>Welcome back, {user?.full_name || user?.username}!</p>
            </div>

            <div className="stats-grid">
                {stats.filter(stat => stat.show).map((stat, index) => (
                    <div key={index} className="stat-card">
                        <div className="stat-icon" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
                            {stat.icon}
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">{stat.value}</div>
                            <div className="stat-title">{stat.title}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-content">
                <div className="card">
                    <div className="card-header">Getting Started</div>
                    <div className="dashboard-info">
                        <h3>Welcome to ReactAppV3!</h3>
                        <p>This is a modular asset management system with the following features:</p>
                        <ul>
                            <li>✅ Modular architecture for scalability</li>
                            <li>✅ Role-based access control (RBAC)</li>
                            <li>✅ Asset management with full CRUD operations</li>
                            <li>✅ Maintenance tracking</li>
                            <li>✅ Activity logging</li>
                            <li>✅ Responsive design for all devices</li>
                        </ul>

                        <h4>Available Modules:</h4>
                        <div className="module-list">
                            {modules.map((module, index) => (
                                <div key={index} className="module-badge">
                                    {module === 'sysadmin' && '⚙️ System Administration'}
                                    {module === 'asset' && '📦 Asset Management'}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
