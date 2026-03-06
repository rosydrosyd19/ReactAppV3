import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import {
    FiLayout, FiGrid, FiBox, FiUsers, FiSettings, FiShield, FiMessageSquare,
    FiPackage, FiKey, FiMapPin, FiTool, FiFileText, FiTag, FiMap, FiTruck, FiLayers
} from 'react-icons/fi';
import './ModernSidebar.css';

const ModernSidebar = ({ isOpen, onToggle }) => {
    const { config } = useConfig();
    const { hasModule, hasAnyPermission } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeModule, setActiveModule] = useState('dashboard');

    useEffect(() => {
        // Determine active module based on current path
        const path = location.pathname;
        if (path.includes('/asset')) setActiveModule('asset');
        else if (path.includes('/sysadmin')) setActiveModule('sysadmin');
        else if (path.includes('/hr')) setActiveModule('hr');
        else setActiveModule('dashboard');
    }, [location.pathname]);

    const handleNavigation = (path) => {
        navigate(path);
        if (window.innerWidth < 1024) {
            onToggle();
        }
    };

    // Menu items untuk modul Asset
    const assetMenuItems = {
        main: [
            { path: '/asset/dashboard', icon: <FiLayout />, label: 'Dashboard' },
            { path: '/asset/items', icon: <FiPackage />, label: 'Assets' },
            { path: '/asset/credentials', icon: <FiKey />, label: 'Credentials' },
            { path: '/asset/ip-addresses', icon: <FiMapPin />, label: 'List IP Address' },
            { path: '/asset/accessories', icon: <FiTool />, label: 'Accessories' },
            { path: '/asset/licenses', icon: <FiFileText />, label: 'Licenses' }
        ],
        master: [
            { path: '/asset/categories', icon: <FiTag />, label: 'Asset Categories' },
            { path: '/asset/locations', icon: <FiMap />, label: 'Asset Locations' },
            { path: '/asset/suppliers', icon: <FiTruck />, label: 'Asset Suppliers' },
            { path: '/asset/credential-categories', icon: <FiLayers />, label: 'Credential Categories' }
        ],
        transaction: [
            { path: '/asset/maintenance', icon: <FiSettings />, label: 'Maintenance' }
        ]
    };

    // Menu items untuk modul SysAdmin
    const sysadminMenuItems = {
        main: [
            { path: '/sysadmin/dashboard', icon: <FiLayout />, label: 'Dashboard' },
            { path: '/sysadmin/users', icon: <FiUsers />, label: 'Users' },
            { path: '/sysadmin/roles', icon: <FiShield />, label: 'Roles' },
            { path: '/sysadmin/activity-logs', icon: <FiFileText />, label: 'Activity Logs' },
            { path: '/sysadmin/settings', icon: <FiSettings />, label: 'Settings' }
        ]
    };

    // Menu items untuk dashboard utama
    const dashboardMenuItems = {
        master: [
            { path: '/dashboard', icon: <FiLayout />, label: 'Dashboard' },
            { path: '/modules', icon: <FiGrid />, label: 'All Modules' }
        ],
        modules: [
            ...(hasModule('asset') ? [{ path: '/asset/dashboard', icon: <FiBox />, label: 'Asset Management' }] : []),
            ...(hasModule('hr') ? [{ path: '/hr/dashboard', icon: <FiUsers />, label: 'HR Management' }] : []),
            ...(hasModule('sysadmin') ? [{ path: '/sysadmin/dashboard', icon: <FiSettings />, label: 'System Admin' }] : [])
        ]
    };

    // Render menu berdasarkan modul aktif
    const renderMenu = () => {
        if (activeModule === 'asset') {
            return (
                <>
                    {/* MAIN Section */}
                    <div>
                        <SidebarSection label="MAIN" isOpen={isOpen} />
                        <div className="nav-items">
                            {assetMenuItems.main.map((item) => (
                                <SidebarLink
                                    key={item.path}
                                    isOpen={isOpen}
                                    active={location.pathname === item.path}
                                    icon={item.icon}
                                    label={item.label}
                                    onClick={() => handleNavigation(item.path)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* MASTER Section */}
                    <div>
                        <SidebarSection label="MASTER" isOpen={isOpen} />
                        <div className="nav-items">
                            {assetMenuItems.master.map((item) => (
                                <SidebarLink
                                    key={item.path}
                                    isOpen={isOpen}
                                    active={location.pathname === item.path}
                                    icon={item.icon}
                                    label={item.label}
                                    onClick={() => handleNavigation(item.path)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* TRANSACTION Section */}
                    <div>
                        <SidebarSection label="TRANSACTION" isOpen={isOpen} />
                        <div className="nav-items">
                            {assetMenuItems.transaction.map((item) => (
                                <SidebarLink
                                    key={item.path}
                                    isOpen={isOpen}
                                    active={location.pathname === item.path}
                                    icon={item.icon}
                                    label={item.label}
                                    onClick={() => handleNavigation(item.path)}
                                />
                            ))}
                        </div>
                    </div>
                </>
            );
        } else if (activeModule === 'sysadmin') {
            return (
                <div>
                    <SidebarSection label="MAIN" isOpen={isOpen} />
                    <div className="nav-items">
                        {sysadminMenuItems.main.map((item) => (
                            <SidebarLink
                                key={item.path}
                                isOpen={isOpen}
                                active={location.pathname === item.path}
                                icon={item.icon}
                                label={item.label}
                                onClick={() => handleNavigation(item.path)}
                            />
                        ))}
                    </div>
                </div>
            );
        } else {
            // Dashboard utama
            return (
                <>
                    <div>
                        <SidebarSection label="Master" isOpen={isOpen} />
                        <div className="nav-items">
                            {dashboardMenuItems.master.map((item) => (
                                <SidebarLink
                                    key={item.path}
                                    isOpen={isOpen}
                                    active={location.pathname === item.path}
                                    icon={item.icon}
                                    label={item.label}
                                    onClick={() => handleNavigation(item.path)}
                                />
                            ))}
                        </div>
                    </div>

                    {dashboardMenuItems.modules.length > 0 && (
                        <div>
                            <SidebarSection label="Modules" isOpen={isOpen} />
                            <div className="nav-items">
                                {dashboardMenuItems.modules.map((item) => (
                                    <SidebarLink
                                        key={item.path}
                                        isOpen={isOpen}
                                        active={location.pathname === item.path}
                                        icon={item.icon}
                                        label={item.label}
                                        onClick={() => handleNavigation(item.path)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            );
        }
    };

    return (
        <aside
            className={`modern-sidebar ${isOpen ? 'open' : 'closed'}`}
        >
            {/* Logo Section */}
            <div className={`sidebar-logo ${isOpen ? 'expanded' : 'collapsed'}`}>
                <button
                    onClick={onToggle}
                    className="logo-button"
                    aria-label="Toggle Sidebar"
                >
                    <div className="logo-icon">
                        {config?.app_icon ? (
                            <img
                                src={config.app_icon}
                                alt="App Icon"
                                className="logo-image"
                            />
                        ) : (
                            <span className="logo-letter">N</span>
                        )}
                    </div>
                    <div className={`logo-text ${isOpen ? 'visible' : 'hidden'}`}>
                        <span className="app-name">
                            {config?.app_name || 'Nexus Core'}
                        </span>
                    </div>
                </button>
            </div>

            {/* Navigation Menu */}
            <div className="sidebar-nav">
                <nav className="nav-sections">
                    {renderMenu()}

                    {/* Support Section - Always visible */}
                    <div className="nav-support">
                        <SidebarLink
                            isOpen={isOpen}
                            active={false}
                            icon={<FiMessageSquare />}
                            label="Support"
                            onClick={() => { }}
                        />
                    </div>
                </nav>
            </div>

            {/* Status Indicator */}
            <div className="sidebar-footer">
                <div className={`status-indicator ${isOpen ? 'visible' : 'hidden'}`}>
                    <p className="status-label">Status</p>
                    <p className="status-value">CONNECTED</p>
                </div>
            </div>
        </aside>
    );
};

// Sub-components
const SidebarSection = ({ label, isOpen }) => (
    <div className={`sidebar-section ${isOpen ? 'visible' : 'hidden'}`}>
        <p className="section-label">{label}</p>
    </div>
);

const SidebarLink = ({ icon, label, isOpen, active = false, onClick }) => (
    <button
        onClick={onClick}
        className={`sidebar-link ${active ? 'active' : ''} ${isOpen ? 'expanded' : 'collapsed'}`}
    >
        {active && <div className="active-indicator"></div>}
        <div className="link-content">
            <span className={`link-icon ${active ? 'active' : ''}`}>
                {icon}
            </span>
            <span className={`link-label ${isOpen ? 'visible' : 'hidden'}`}>
                {label}
            </span>
        </div>
    </button>
);

export default ModernSidebar;
