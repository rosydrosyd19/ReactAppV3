import './Header.css';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FiMenu, FiUser, FiLogOut, FiMoon, FiSun } from 'react-icons/fi';

const Header = ({ onMenuClick }) => {
    const { user, logout } = useAuth();
    const [isDark, setIsDark] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    const toggleTheme = () => {
        setIsDark(!isDark);
        document.documentElement.setAttribute('data-theme', !isDark ? 'dark' : 'light');
    };

    return (
        <header className="header">
            <div className="header-left">
                <button className="menu-button" onClick={onMenuClick}>
                    <FiMenu />
                </button>
            </div>

            <div className="header-right">
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
