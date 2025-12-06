import './Sidebar.css';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiMenu } from 'react-icons/fi';
import { useMenu } from '../../hooks/useMenu';

const Sidebar = ({ isOpen, onClose }) => {
    const location = useLocation();
    const { hasPermission, hasModule } = useAuth(); // kept for potential other uses, though useMenu handles logic
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
                                                onClick={handleItemClick}
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
