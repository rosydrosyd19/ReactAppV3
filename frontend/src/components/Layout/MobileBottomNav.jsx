import './MobileBottomNav.css';
import { Link, useLocation } from 'react-router-dom';
import { useMenu } from '../../hooks/useMenu';

const MobileBottomNav = () => {
    const menuItems = useMenu();
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path;
    };

    // Flatten menu items for bottom nav (including children)
    // Flatten menu items for bottom nav (including children)
    const flattenedItems = [];
    const hiddenPaths = ['/asset/categories', '/asset/locations', '/asset/suppliers', '/asset/credential-categories'];

    menuItems.forEach(item => {
        if (!item.show) return;

        // Add parent if it has a path (like Dashboard)
        if (item.path && !hiddenPaths.includes(item.path)) {
            flattenedItems.push(item);
        }

        // Add children
        if (item.children) {
            item.children.forEach(child => {
                if (child.show && !hiddenPaths.includes(child.path)) {
                    flattenedItems.push(child);
                }
            });
        }
    });

    return (
        <nav className="mobile-bottom-nav">
            <div className="mobile-nav-container">
                {flattenedItems.map((item, index) => (
                    <Link
                        key={index}
                        to={item.path}
                        className={`mobile-nav-item ${isActive(item.path) ? 'active' : ''}`}
                    >
                        {item.icon}
                        <span>{item.title}</span>
                    </Link>
                ))}
            </div>
        </nav>
    );
};

export default MobileBottomNav;
