import { FiLayout, FiGrid, FiBell } from 'react-icons/fi';
import './ModernMobileNav.css';

const ModernMobileNav = ({ activeTab, onTabChange }) => {
    return (
        <nav className="modern-mobile-nav">
            <div className="mobile-nav-container">
                <MobileNavItem
                    active={activeTab === 'Dashboard'}
                    icon={<FiLayout size={24} />}
                    label="Home"
                    onClick={() => onTabChange('Dashboard')}
                />
                <MobileNavItem
                    active={activeTab === 'All Modules'}
                    icon={<FiGrid size={24} />}
                    label="Modules"
                    onClick={() => onTabChange('All Modules')}
                />
                <MobileNavItem
                    active={activeTab === 'Notifications'}
                    icon={<FiBell size={24} />}
                    label="Inbox"
                    onClick={() => onTabChange('Notifications')}
                />
            </div>
        </nav>
    );
};

const MobileNavItem = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`mobile-nav-item ${active ? 'active' : ''}`}
    >
        <div className={`nav-item-icon ${active ? 'active' : ''}`}>
            {icon}
            {active && <div className="active-dot"></div>}
        </div>
        <span className={`nav-item-label ${active ? 'active' : ''}`}>{label}</span>
    </button>
);

export default ModernMobileNav;
