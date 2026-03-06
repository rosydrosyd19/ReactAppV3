import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiPackage, FiCheckCircle, FiAlertCircle, FiXCircle, FiPlus, FiFileText, FiDownload, FiSettings } from 'react-icons/fi';
import './ModernAssetDashboard.css';

const ModernAssetDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        const hour = new Date().getHours();
        const name = user?.full_name || user?.username || 'User';

        if (hour < 12) {
            setGreeting(`Selamat pagi, ${name}! Siap mengelola aset hari ini?`);
        } else if (hour < 18) {
            setGreeting(`Selamat siang, ${name}! Tetap produktif!`);
        } else {
            setGreeting(`Selamat malam, ${name}! Semoga harimu menyenangkan!`);
        }
    }, [user]);

    // Dummy data - in real app, fetch from API
    const metrics = [
        { title: 'Total Assets', value: '124', trend: '+12.5%', icon: <FiPackage size={18} />, color: 'blue' },
        { title: 'Available', value: '86', trend: '+8.2%', icon: <FiCheckCircle size={18} />, color: 'emerald' },
        { title: 'Assigned', value: '32', trend: '-2.4%', icon: <FiAlertCircle size={18} />, color: 'amber' },
        { title: 'Broken/Lost', value: '6', trend: '+0.1%', icon: <FiXCircle size={18} />, color: 'rose' }
    ];

    const recentActivities = [
        { user: 'John D.', action: 'added new laptop', time: '5m ago', color: 'blue' },
        { user: 'Sarah M.', action: 'assigned monitor to IT dept', time: '12m ago', color: 'emerald' },
        { user: 'System', action: 'marked asset #A-245 as broken', time: '1h ago', color: 'rose' },
        { user: 'Mike K.', action: 'updated asset location', time: '2h ago', color: 'amber' }
    ];

    return (
        <div className="modern-asset-dashboard">
            <div className="dashboard-container">
                {/* Header */}
                <div className="dashboard-header">
                    <div>
                        <h1 className="dashboard-title">
                            Asset Management <span className="title-gradient">Dashboard</span>
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
                    {/* Asset Distribution Chart */}
                    <div className="chart-card">
                        <div className="chart-header">
                            <div>
                                <h3 className="chart-title">Asset Distribution</h3>
                                <p className="chart-subtitle">Status breakdown by category</p>
                            </div>
                        </div>
                        <div className="chart-container">
                            {/* Donut Chart */}
                            <svg className="donut-chart" viewBox="0 0 200 200">
                                <circle cx="100" cy="100" r="80" fill="none" stroke="#3b82f6" strokeWidth="30" strokeDasharray="157 314" strokeDashoffset="0" />
                                <circle cx="100" cy="100" r="80" fill="none" stroke="#10b981" strokeWidth="30" strokeDasharray="125 314" strokeDashoffset="-157" />
                                <circle cx="100" cy="100" r="80" fill="none" stroke="#f59e0b" strokeWidth="30" strokeDasharray="62 314" strokeDashoffset="-282" />
                                <circle cx="100" cy="100" r="80" fill="none" stroke="#ef4444" strokeWidth="30" strokeDasharray="31 314" strokeDashoffset="-344" />
                            </svg>
                            <div className="chart-legend">
                                <div className="legend-item">
                                    <span className="legend-dot blue"></span>
                                    <span>Total (124)</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-dot emerald"></span>
                                    <span>Available (86)</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-dot amber"></span>
                                    <span>Assigned (32)</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-dot rose"></span>
                                    <span>Broken (6)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="activity-card">
                        <h3 className="activity-title">Recent Activities</h3>
                        <div className="activity-list">
                            {recentActivities.map((activity, index) => (
                                <ActivityItem key={index} {...activity} />
                            ))}
                        </div>
                        <button className="view-all-btn" onClick={() => navigate('/asset/items')}>
                            View All Assets
                        </button>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="quick-actions-section">
                    <h3 className="section-title">Quick Actions</h3>
                    <div className="quick-actions-grid">
                        <QuickActionButton
                            label="Add Asset"
                            icon={<FiPlus size={18} />}
                            onClick={() => navigate('/asset/items')}
                        />
                        <QuickActionButton
                            label="Generate Report"
                            icon={<FiFileText size={18} />}
                            onClick={() => navigate('/asset/items')}
                        />
                        <QuickActionButton
                            label="Export Data"
                            icon={<FiDownload size={18} />}
                            onClick={() => navigate('/asset/items')}
                        />
                        <QuickActionButton
                            label="Settings"
                            icon={<FiSettings size={18} />}
                            onClick={() => navigate('/asset/categories')}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Sub-components
const MetricCard = ({ title, value, trend, icon, color }) => {
    const isPositive = trend.startsWith('+');
    return (
        <div className="metric-card">
            <div className="metric-header">
                <div className={`metric-icon ${color}`}>
                    {icon}
                </div>
                <span className={`metric-trend ${isPositive ? 'positive' : 'negative'}`}>
                    {trend}
                </span>
            </div>
            <p className="metric-title">{title}</p>
            <p className="metric-value">{value}</p>
        </div>
    );
};

const ActivityItem = ({ user, action, time, color }) => (
    <div className="activity-item">
        <div className={`activity-avatar ${color}`}>
            {user.charAt(0)}
        </div>
        <div className="activity-content">
            <p className="activity-text">
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

export default ModernAssetDashboard;
