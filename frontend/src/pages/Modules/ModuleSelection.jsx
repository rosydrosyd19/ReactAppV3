import './ModuleSelection.css';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiSettings, FiBox, FiUsers, FiLogOut, FiMoon, FiSun } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import ModernModuleSelection from './ModernModuleSelection';

const ModuleSelection = () => {
    const { user, logout, hasAnyPermission, hasModule } = useAuth();
    const navigate = useNavigate();
    const [currentTheme, setCurrentTheme] = useState('light');
    const [isLoading, setIsLoading] = useState(true);
    const [isDark, setIsDark] = useState(() => {
        const theme = localStorage.getItem('theme') || 'light';
        return theme === 'dark';
    });

    useEffect(() => {
        // Show loading screen
        const loader = document.getElementById('app-loader');
        if (loader) {
            loader.classList.remove('hidden');
        }

        // Clear active module when entering selection screen
        localStorage.removeItem('activeModule');

        // Apply theme on mount
        const savedTheme = localStorage.getItem('theme') || 'light';
        setCurrentTheme(savedTheme);
        setIsDark(savedTheme === 'dark');
        document.documentElement.setAttribute('data-theme', savedTheme);

        // Listen for theme changes
        const handleThemeChange = () => {
            const newTheme = localStorage.getItem('theme') || 'light';
            setCurrentTheme(newTheme);
            setIsDark(newTheme === 'dark');
        };

        window.addEventListener('themeChange', handleThemeChange);

        return () => {
            window.removeEventListener('themeChange', handleThemeChange);
        };
    }, []);

    // Hide loading screen after component is ready
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
            const loader = document.getElementById('app-loader');
            if (loader) {
                loader.classList.add('hidden');
            }
        }, 500); // Small delay to ensure smooth transition

        return () => clearTimeout(timer);
    }, [currentTheme]);

    // Show loading screen while loading
    if (isLoading) {
        return null;
    }

    // Use ModernModuleSelection for Simple Modern themes
    if (currentTheme === 'simple-modern' || currentTheme === 'simple-modern-dark') {
        return <ModernModuleSelection />;
    }

    const toggleTheme = () => {
        const newTheme = isDark ? 'light' : 'dark';
        setIsDark(!isDark);
        setCurrentTheme(newTheme);
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
            id: 'hr',
            name: 'HR Management',
            description: 'Manage employee data and HR operations',
            icon: <FiUsers />,
            path: '/hr/dashboard',
            show: hasModule('hr') || hasAnyPermission(['MANAGE_HR'])
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
