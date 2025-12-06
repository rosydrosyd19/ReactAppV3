import './Header.css';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FiMenu, FiUser, FiLogOut, FiMoon, FiSun, FiGrid } from 'react-icons/fi';

const Header = ({ onMenuClick, isSidebarOpen }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');
    const [showUserMenu, setShowUserMenu] = useState(false);

    const toggleTheme = () => {
        const newTheme = !isDark ? 'dark' : 'light';
        setIsDark(!isDark);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    return (
        <header className="header">
            <div className="header-left">
                {!isSidebarOpen && (
                    <button className="menu-button" onClick={onMenuClick}>
                        <FiMenu />
                    </button>
                )}
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    {/* ReactAppV3 */}
                    {(() => {
                        const activeModule = localStorage.getItem('activeModule');
                        if (activeModule === 'sysadmin') return <span style={{ fontSize: '0.8em', fontWeight: 'normal', color: 'var(--text-secondary)' }}>System Admin</span>;
                        if (activeModule === 'asset') return <span style={{ fontSize: '0.8em', fontWeight: 'normal', color: 'var(--text-secondary)' }}>Asset Management</span>;
                        return null;
                    })()}
                </h2>
            </div>

            <div className="header-right">
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
