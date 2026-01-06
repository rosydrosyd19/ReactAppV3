import './Sidebar.css';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import { FiMenu } from 'react-icons/fi';
import { useMenu } from '../../hooks/useMenu';

const Sidebar = ({ isOpen, onClose }) => {
    const location = useLocation();
    const { hasPermission, hasModule } = useAuth(); // kept for potential other uses, though useMenu handles logic
    const { config } = useConfig();
    const activeModule = localStorage.getItem('activeModule');

    const menuItems = useMenu();

    const isActive = (path) => {
        return location.pathname === path;
    };

    const handleItemClick = () => {
        if (window.innerWidth <= 768) {
            onClose();
        }
    };

    return (
        <>
            {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h2>{config.app_name || 'ReactAppV3'}</h2>
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

                                        // Check if we need to render a group header
                                        const showGroupHeader = child.group && (
                                            childIndex === 0 ||
                                            item.children[childIndex - 1].group !== child.group
                                        );

                                        return (
                                            <div key={childIndex}>
                                                {showGroupHeader && (
                                                    <div className="menu-group-title">
                                                        {child.group}
                                                    </div>
                                                )}
                                                <Link
                                                    to={child.path}
                                                    className={`menu-item ${isActive(child.path) ? 'active' : ''}`}
                                                    onClick={handleItemClick}
                                                >
                                                    {child.icon}
                                                    <span>{child.title}</span>
                                                </Link>
                                            </div>
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
                                onClick={handleItemClick}
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
