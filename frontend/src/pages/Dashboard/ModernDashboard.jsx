import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiUsers, FiDollarSign, FiTrendingUp, FiShield, FiBox, FiSettings, FiClipboard, FiGrid } from 'react-icons/fi';
import './ModernDashboard.css';

const ModernDashboard = () => {
    const { user, hasModule } = useAuth();
    const navigate = useNavigate();
    const [aiMessage, setAiMessage] = useState('Welcome back!');
    const moduleSectionRef = useRef(null);

    useEffect(() => {
        // Generate AI greeting based on time of day
        const hour = new Date().getHours();
        const name = user?.full_name || user?.username || 'User';

        if (hour < 12) {
            setAiMessage(`Selamat pagi, ${name}! Siap memulai hari yang produktif?`);
        } else if (hour < 18) {
            setAiMessage(`Selamat siang, ${name}! Semangat untuk sisa harinya!`);
        } else {
            setAiMessage(`Selamat malam, ${name}! Semoga harimu menyenangkan!`);
        }
    }, [user]);

    const scrollToModules = () => {
        moduleSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // Module data based on user permissions
    const modules = [];

    if (hasModule('asset')) {
        modules.push({
            id: 'asset-management',
            title: 'Asset Management',
            description: 'Track enterprise assets and inventory.',
            icon: <FiBox size={24} />,
            path: '/asset/dashboard',
            color: 'blue'
        });
    }

    if (hasModule('hr')) {
        modules.push({
            id: 'hr-management',
            title: 'HR Management',
            description: 'Manage employee data and payroll.',
            icon: <FiUsers size={24} />,
            path: '/hr/dashboard',
            color: 'emerald'
        });
    }

    if (hasModule('sysadmin')) {
        modules.push({
            id: 'sys-admin',
            title: 'System Administrator',
            description: 'Manage permissions and security.',
            icon: <FiShield size={24} />,
            path: '/sysadmin/dashboard',
            color: 'indigo'
        });
    }

    return (
        <div className="modern-dashboard">
            <div className="dashboard-container">
                {/* Header / Welcome */}
                <div className="dashboard-header">
                    <div>
                        <h1 className="dashboard-title">
                            Dashboard <span className="title-gradient">Overview</span>
                        </h1>
                        <p className="dashboard-subtitle">
                            "{aiMessage}"
                        </p>
                    </div>
                    <div className="header-actions">
                        <div className="user-avatars">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="avatar-item">U{i}</div>
                            ))}
                            <div className="avatar-item avatar-more">+8</div>
                        </div>
                        <button className="invite-btn">Invite Team</button>
                    </div>
                </div>

                {/* Dashboard Analytics Section */}
                <section className="analytics-section">
                    {/* Summary Metrics */}
                    <div className="metrics-grid">
                        <MetricCard
                            title="Total Revenue"
                            value="$42,850"
                            trend="+12.5%"
                            icon={<FiDollarSign size={18} />}
                            color="emerald"
                        />
                        <MetricCard
                            title="Active Sessions"
                            value="1,240"
                            trend="+8.2%"
                            icon={<FiUsers size={18} />}
                            color="blue"
                        />
                        <MetricCard
                            title="Project Velocity"
                            value="84%"
                            trend="-2.4%"
                            icon={<FiTrendingUp size={18} />}
                            color="amber"
                        />
                        <MetricCard
                            title="System Health"
                            value="99.9%"
                            trend="+0.1%"
                            icon={<FiShield size={18} />}
                            color="indigo"
                        />
                    </div>

                    {/* Main Visualizations Grid */}
                    <div className="visualizations-grid">
                        {/* Workflow Efficiency Chart */}
                        <div className="chart-card">
                            <div className="chart-header">
                                <div>
                                    <h3 className="chart-title">Workflow Efficiency</h3>
                                    <p className="chart-subtitle">Performance tracking over the last 30 days</p>
                                </div>
                                <select className="chart-select">
                                    <option>Monthly</option>
                                    <option>Weekly</option>
                                </select>
                            </div>

                            {/* SVG Line Chart */}
                            <div className="chart-container">
                                <svg className="line-chart" viewBox="0 0 800 200" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.4" />
                                            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    {/* Grid Lines */}
                                    <line x1="0" y1="0" x2="800" y2="0" className="grid-line" strokeWidth="1" />
                                    <line x1="0" y1="50" x2="800" y2="50" className="grid-line" strokeWidth="1" />
                                    <line x1="0" y1="100" x2="800" y2="100" className="grid-line" strokeWidth="1" />
                                    <line x1="0" y1="150" x2="800" y2="150" className="grid-line" strokeWidth="1" />
                                    <line x1="0" y1="200" x2="800" y2="200" className="grid-line" strokeWidth="1" />

                                    {/* Area Fill */}
                                    <path d="M0,200 L0,150 C50,140 100,160 150,130 C200,100 250,110 300,70 C350,30 400,60 450,90 C500,120 550,100 600,60 C650,20 700,40 750,30 C800,20 800,20 800,200 Z" fill="url(#chartGradient)" />

                                    {/* Line Path */}
                                    <path d="M0,150 C50,140 100,160 150,130 C200,100 250,110 300,70 C350,30 400,60 450,90 C500,120 550,100 600,60 C650,20 700,40 750,30 C800,20" fill="none" stroke="#4f46e5" strokeWidth="4" strokeLinecap="round" />

                                    {/* Dots */}
                                    <circle cx="150" cy="130" r="4" fill="#4f46e5" stroke="white" strokeWidth="2" />
                                    <circle cx="300" cy="70" r="4" fill="#4f46e5" stroke="white" strokeWidth="2" />
                                    <circle cx="450" cy="90" r="4" fill="#4f46e5" stroke="white" strokeWidth="2" />
                                    <circle cx="600" cy="60" r="4" fill="#4f46e5" stroke="white" strokeWidth="2" />
                                    <circle cx="750" cy="30" r="4" fill="#4f46e5" stroke="white" strokeWidth="2" />
                                </svg>

                                <div className="chart-labels">
                                    <span>Week 1</span>
                                    <span>Week 2</span>
                                    <span>Week 3</span>
                                    <span>Week 4</span>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="activity-card">
                            <h3 className="activity-title">Recent Activities</h3>
                            <div className="activity-list">
                                <ActivityItem user="Alex M." action="uploaded a new asset" time="2m ago" color="blue" />
                                <ActivityItem user="Sarah K." action="updated payroll module" time="15m ago" color="emerald" />
                                <ActivityItem user="System" action="deployed v2.4 hotfix" time="1h ago" color="rose" />
                                <ActivityItem user="James W." action="requested access to CRM" time="3h ago" color="amber" />
                            </div>
                            <button className="view-all-btn">View All Logs</button>
                        </div>
                    </div>

                    {/* Secondary Row: Uptime & Quick Actions */}
                    <div className="secondary-grid">
                        {/* Uptime Radial */}
                        <div className="uptime-card">
                            <h3 className="uptime-title">System Uptime</h3>
                            <div className="radial-chart">
                                <svg className="radial-svg" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="40" className="radial-bg" strokeWidth="10" fill="transparent" />
                                    <circle cx="50" cy="50" r="40" className="radial-progress" strokeWidth="10" fill="transparent" strokeDasharray="251.2" strokeDashoffset="5.2" strokeLinecap="round" />
                                </svg>
                                <div className="radial-content">
                                    <span className="radial-value">98%</span>
                                    <span className="radial-label">Stable</span>
                                </div>
                            </div>
                            <p className="uptime-text">Perfectly operational in all regions.</p>
                        </div>

                        {/* Quick Actions Grid */}
                        <div className="quick-actions-card">
                            <div className="quick-actions-header">
                                <h3 className="quick-actions-title">Quick Access</h3>
                                <FiGrid className="quick-actions-icon" />
                            </div>
                            <div className="quick-actions-grid">
                                <QuickActionButton label="New Report" icon={<FiClipboard size={18} />} />
                                <QuickActionButton label="Add User" icon={<FiUsers size={18} />} />
                                <QuickActionButton label="Payments" icon={<FiDollarSign size={18} />} />
                                <QuickActionButton label="Settings" icon={<FiSettings size={18} />} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Module Selection Section */}
                {modules.length > 0 && (
                    <div ref={moduleSectionRef} className="modules-section">
                        <div className="modules-header">
                            <div>
                                <h2 className="modules-title">
                                    <span className="modules-icon-wrapper">
                                        <FiGrid size={18} />
                                    </span>
                                    Available Modules
                                </h2>
                                <p className="modules-subtitle">Select a workspace to begin management</p>
                            </div>
                            <div className="view-toggle">
                                <button className="toggle-btn active">Grid</button>
                                <button className="toggle-btn">List</button>
                            </div>
                        </div>

                        <div className="modules-grid">
                            {modules.map((module) => (
                                <ModuleCard key={module.id} module={module} onClick={() => navigate(module.path)} />
                            ))}
                        </div>
                    </div>
                )}

                <footer className="dashboard-footer">
                    &copy; 2024 Nexus Core Enterprise Portal. Crafted with precision.
                </footer>
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

const QuickActionButton = ({ label, icon }) => (
    <button className="quick-action-btn">
        <div className="quick-action-icon">{icon}</div>
        <span className="quick-action-label">{label}</span>
    </button>
);

const ModuleCard = ({ module, onClick }) => {
    return (
        <div className="module-card" onClick={onClick}>
            <div className={`module-glow ${module.color}`}></div>

            <div className="module-content">
                <div className="module-icon-wrapper">
                    {module.icon}
                </div>

                <div>
                    <h3 className="module-title">{module.title}</h3>
                    <p className="module-description">{module.description}</p>
                </div>

                <div className="module-footer">
                    Open Module
                    <svg className="module-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default ModernDashboard;
