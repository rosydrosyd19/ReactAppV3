import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiMenu, FiSearch, FiGrid, FiMoon, FiSun, FiUser, FiSettings, FiLogOut } from 'react-icons/fi';
import './ModernHeader.css';

const ModernHeader = ({ onMenuClick, isDark, onThemeToggle }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        setIsDropdownOpen(false);
    };

    const scrollToModules = () => {
        navigate('/modules');
    };

    const getUserInitials = () => {
        if (!user) return 'U';
        const name = user.full_name || user.username || 'User';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <header className="modern-header">
            <div className="header-left">
                <button
                    onClick={onMenuClick}
                    className="mobile-menu-btn"
                    aria-label="Open Menu"
                >
                    <FiMenu />
                </button>
                <h2 className="mobile-title">Nexus Core</h2>
            </div>

            <div className="header-right">
                {/* Search Bar (Desktop) */}
                <div className="search-bar">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search analytics..."
                        className="search-input"
                    />
                </div>

                {/* Module Selector */}
                <button
                    onClick={scrollToModules}
                    className="icon-btn module-btn"
                    aria-label="Pilih Modul"
                    title="Pilih Modul"
                >
                    <FiGrid />
                </button>

                {/* Theme Toggle */}
                <button
                    onClick={onThemeToggle}
                    className="icon-btn theme-btn"
                    aria-label="Toggle Theme"
                >
                    {isDark ? <FiSun className="sun-icon" /> : <FiMoon className="moon-icon" />}
                </button>

                <div className="header-divider"></div>

                {/* User Dropdown */}
                <div className="user-dropdown" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="user-button"
                    >
                        <div className="user-avatar">
                            {getUserInitials()}
                        </div>
                        <div className="user-info">
                            <p className="user-name">{user?.full_name || user?.username || 'User'}</p>
                        </div>
                        <svg
                            className={`chevron-icon ${isDropdownOpen ? 'open' : ''}`}
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {isDropdownOpen && (
                        <div className="dropdown-menu">
                            <div className="dropdown-header">
                                <p className="dropdown-label">Account Profile</p>
                                <p className="dropdown-name">{user?.full_name || user?.username || 'User'}</p>
                            </div>
                            <DropdownItem
                                icon={<FiUser />}
                                label="Detail Profile"
                                onClick={() => {
                                    setIsDropdownOpen(false);
                                    navigate('/profile');
                                }}
                            />
                            <DropdownItem
                                icon={<FiSettings />}
                                label="Settings"
                                onClick={() => {
                                    setIsDropdownOpen(false);
                                    navigate('/sysadmin/settings');
                                }}
                            />
                            <div className="dropdown-divider"></div>
                            <DropdownItem
                                icon={<FiLogOut />}
                                label="Logout"
                                variant="danger"
                                onClick={handleLogout}
                            />
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

const DropdownItem = ({ icon, label, variant = 'default', onClick }) => (
    <button
        onClick={onClick}
        className={`dropdown-item ${variant === 'danger' ? 'danger' : ''}`}
    >
        <span className="dropdown-icon">{icon}</span>
        <span className="dropdown-text">{label}</span>
    </button>
);

export default ModernHeader;
