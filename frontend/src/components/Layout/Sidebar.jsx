import './Sidebar.css';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    FiHome,
    FiUsers,
    FiShield,
    FiPackage,
    FiMapPin,
    FiTool,
    FiSettings,
    FiActivity,
    FiMenu,
} from 'react-icons/fi';

const Sidebar = ({ isOpen, onClose }) => {
    const location = useLocation();
    const { hasPermission, hasModule } = useAuth();
    const activeModule = localStorage.getItem('activeModule');

    const getDashboardPath = () => {
        if (activeModule === 'sysadmin') return '/sysadmin/dashboard';
        if (activeModule === 'asset') return '/asset/dashboard';
        return '/dashboard'; // Fallback
    };

    const menuItems = [
        {
            title: 'Dashboard',
            path: getDashboardPath(),
            icon: <FiHome />,
            show: true,
        },
        // Sysadmin Module
        {
            title: 'System Admin',
            module: 'sysadmin',
            icon: <FiSettings />,
            show: hasModule('sysadmin') && (!activeModule || activeModule === 'sysadmin'),
            children: [
                {
                    title: 'Users',
                    path: '/sysadmin/users',
                    icon: <FiUsers />,
                    show: hasPermission('sysadmin.users.view'),
                },
                {
                    title: 'Roles',
                    path: '/sysadmin/roles',
                    icon: <FiShield />,
                    show: hasPermission('sysadmin.roles.view'),
                },
                {
                    title: 'Activity Logs',
                    path: '/sysadmin/logs',
                    icon: <FiActivity />,
                    show: hasPermission('sysadmin.logs.view'),
                },
            ],
        },
        // Asset Management Module
        {
            title: 'Asset Management',
            module: 'asset',
            icon: <FiPackage />,
            show: hasModule('asset') && (!activeModule || activeModule === 'asset'),
            children: [
                {
                    title: 'Assets',
                    path: '/asset/items',
                    icon: <FiPackage />,
                    show: hasPermission('asset.items.view'),
                },
                {
                    title: 'Categories',
                    path: '/asset/categories',
                    icon: <FiTool />,
                    show: hasPermission('asset.categories.manage'),
                },
                {
                    title: 'Locations',
                    path: '/asset/locations',
                    icon: <FiMapPin />,
                    show: hasPermission('asset.locations.manage'),
                },
                {
                    title: 'Maintenance',
                    path: '/asset/maintenance',
                    icon: <FiTool />,
                    show: hasPermission('asset.maintenance.view'),
                },
            ],
        },
    ];

    const isActive = (path) => {
        return location.pathname === path;
    };

    const getModuleName = () => {
        if (activeModule === 'sysadmin') return 'System Admin';
        if (activeModule === 'asset') return 'Asset Management';
        return '';
    };

    return (
        <>
            {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h2>ReactAppV3</h2>
                    <button className="sidebar-toggle" onClick={onClose} aria-label="Close sidebar">
                        <FiMenu />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map((item, index) => {
                        if (!item.show) return null;

                        if (item.children) {
                            return (
                                <div key={index} className="menu-section">
                                    {/* Removed Section Title as requested */}
                                    {item.children.map((child, childIndex) => {
                                        if (!child.show) return null;
                                        return (
                                            <Link
                                                key={childIndex}
                                                to={child.path}
                                                className={`menu-item ${isActive(child.path) ? 'active' : ''}`}
                                                onClick={onClose}
                                            >
                                                {child.icon}
                                                <span>{child.title}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={index}
                                to={item.path}
                                className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
                                onClick={onClose}
                            >
                                {item.icon}
                                <span>{item.title}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;
