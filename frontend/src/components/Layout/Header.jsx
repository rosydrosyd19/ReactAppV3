import './Header.css';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FiMenu, FiUser, FiLogOut, FiMoon, FiSun, FiGrid } from 'react-icons/fi';

const Header = ({ onMenuClick, isSidebarOpen }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isDark, setIsDark] = useState(() => {
        const theme = localStorage.getItem('theme') || 'light';
        return theme === 'dark' || theme === 'simple-modern-dark';
    });
    const [showUserMenu, setShowUserMenu] = useState(false);

    const toggleTheme = () => {
        const currentTheme = localStorage.getItem('theme') || 'light';
        let newTheme;

        // Toggle within the same theme family
        if (currentTheme === 'simple-modern') {
            // Simple Modern Light -> Simple Modern Dark
            newTheme = 'simple-modern-dark';
            setIsDark(true);
        } else if (currentTheme === 'simple-modern-dark') {
            // Simple Modern Dark -> Simple Modern Light
            newTheme = 'simple-modern';
            setIsDark(false);
        } else if (currentTheme === 'dark') {
            // Standard Dark -> Standard Light
            newTheme = 'light';
            setIsDark(false);
        } else {
            // Standard Light -> Standard Dark
            newTheme = 'dark';
            setIsDark(true);
        }

        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);

        // Dispatch custom event for same-window theme changes
        window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme: newTheme } }));
    };

    const getModuleName = () => {
        const activeModule = localStorage.getItem('activeModule');

        if (activeModule === 'sysadmin') return 'System Administrator';
        if (activeModule === 'asset') return 'Asset Management';
        return 'System';
    };

    return (
        <header className="header">
            <div className="header-left">
                {!isSidebarOpen && (
                    <button className="menu-button" onClick={onMenuClick}>
                        <FiMenu />
                    </button>
                )}
            </div>

            <div className="header-center" style={{ flex: 1 }}></div>

            <div className="header-right">
                <span className="module-name">{getModuleName()}</span>

                <button
                    className="icon-button"
                    onClick={() => navigate('/modules')}
                    title="Switch Module"
                >
                    <FiGrid />
                </button>
                <button className="icon-button" onClick={toggleTheme} title="Toggle theme">
                    {isDark ? <FiSun /> : <FiMoon />}
                </button>

                <div className="user-menu">
                    <button
                        className="user-button"
                        onClick={() => setShowUserMenu(!showUserMenu)}
                    >
                        <FiUser />
                        <span>{user?.full_name || user?.username}</span>
                    </button>

                    {showUserMenu && (
                        <>
                            <div
                                className="user-menu-overlay"
                                onClick={() => setShowUserMenu(false)}
                            />
                            <div className="user-menu-dropdown">
                                <div className="user-info">
                                    <div className="user-name">{user?.full_name}</div>
                                    <div className="user-email">{user?.email}</div>
                                </div>
                                <div className="user-menu-divider" />
                                <button className="user-menu-item" onClick={() => {
                                    setShowUserMenu(false);
                                    navigate('/profile');
                                }}>
                                    <FiUser />
                                    <span>Profile</span>
                                </button>
                                <div className="user-menu-divider" />
                                <button className="user-menu-item" onClick={logout}>
                                    <FiLogOut />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
