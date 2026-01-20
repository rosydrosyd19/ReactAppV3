import './ModuleSelection.css';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiSettings, FiBox, FiUsers, FiLogOut, FiMoon, FiSun } from 'react-icons/fi';
import { useEffect, useState } from 'react';

const ModuleSelection = () => {
    const { user, logout, hasAnyPermission, hasModule } = useAuth();
    const navigate = useNavigate();
    const [isDark, setIsDark] = useState(() => {
        const theme = localStorage.getItem('theme') || 'light';
        return theme === 'dark' || theme === 'simple-modern-dark';
    });

    useEffect(() => {
        // Clear active module when entering selection screen
        localStorage.removeItem('activeModule');

        // Apply theme on mount
        const savedTheme = localStorage.getItem('theme') || 'light';
        setIsDark(savedTheme === 'dark' || savedTheme === 'simple-modern-dark');
        document.documentElement.setAttribute('data-theme', savedTheme);
    }, []);

    const toggleTheme = () => {
        const currentTheme = localStorage.getItem('theme') || 'light';
        let newTheme;

        // Toggle within the same theme family
        if (currentTheme === 'simple-modern') {
            newTheme = 'simple-modern-dark';
            setIsDark(true);
        } else if (currentTheme === 'simple-modern-dark') {
            newTheme = 'simple-modern';
            setIsDark(false);
        } else if (currentTheme === 'dark') {
            newTheme = 'light';
            setIsDark(false);
        } else {
            newTheme = 'dark';
            setIsDark(true);
        }

        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);

        // Dispatch custom event for Login page sync
        window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme: newTheme } }));
    };

    const modules = [
        {
            id: 'asset',
            name: 'Asset Management',
            description: 'Manage assets, components, licenses, and consumables',
            icon: <FiBox />,
            path: '/asset/dashboard',
            show: hasModule('asset') || hasAnyPermission(['VIEW_ASSETS', 'MANAGE_ASSETS'])
        },
        {
            id: 'sysadmin',
            name: 'System Administrator',
            description: 'User management, roles, permissions, and system logs',
            icon: <FiSettings />,
            path: '/sysadmin/dashboard',
            show: hasModule('sysadmin') || hasAnyPermission(['MANAGE_USERS', 'MANAGE_ROLES'])
        },
        {
            id: 'users',
            name: 'User Management',
            description: 'Manage users and their activities',
            icon: <FiUsers />,
            path: '/sysadmin/users',
            show: false
        }
    ];

    const handleModuleClick = (module) => {
        localStorage.setItem('activeModule', module.id);
        navigate(module.path);
    };

    return (
        <div className="module-selection-container">
            <header className="module-header">
                <div className="header-left">
                    <h1>Modular System Application</h1>
                </div>
                <div className="module-header-actions">
                    <button className="icon-button" onClick={toggleTheme} title="Toggle theme">
                        {isDark ? <FiSun /> : <FiMoon />}
                    </button>
                    <div className="user-info">
                        <span>Welcome, {user?.full_name || user?.username}</span>
                    </div>
                    <button className="btn btn-outline" onClick={logout}>
                        <FiLogOut /> Logout
                    </button>
                </div>
            </header>

            <main className="module-content">
                <div className="module-grid">
                    {modules.filter(m => m.show).map((module) => (
                        <div
                            key={module.id}
                            className="module-card"
                            onClick={() => handleModuleClick(module)}
                        >
                            <div className="module-icon">
                                {module.icon}
                            </div>
                            <h3>{module.name}</h3>
                            <p>{module.description}</p>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default ModuleSelection;
