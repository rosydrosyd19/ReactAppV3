import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ModernSidebar from './ModernSidebar';
import ModernHeader from './ModernHeader';
import ModernMobileNav from './ModernMobileNav';
import './ModernLayout.css';

const ModernLayout = ({ children }) => {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isDark, setIsDark] = useState(false);
    const [activeTab, setActiveTab] = useState('Dashboard');

    useEffect(() => {
        // Check theme on mount
        const theme = localStorage.getItem('theme') || 'simple-modern';
        setIsDark(theme === 'simple-modern-dark');

        // Apply dark class
        if (theme === 'simple-modern-dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.setAttribute('data-theme', 'simple-modern-dark');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.setAttribute('data-theme', 'simple-modern');
        }

        // Responsive sidebar behavior
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const toggleTheme = () => {
        const currentTheme = localStorage.getItem('theme') || 'simple-modern';
        const newTheme = currentTheme === 'simple-modern' ? 'simple-modern-dark' : 'simple-modern';

        setIsDark(newTheme === 'simple-modern-dark');
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);

        if (newTheme === 'simple-modern-dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme: newTheme } }));
    };

    const handleMobileNavChange = (tab) => {
        setActiveTab(tab);
        if (tab === 'Dashboard') {
            navigate('/dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (tab === 'All Modules') {
            navigate('/modules');
        } else if (tab === 'Notifications') {
            // Handle notifications
        }
    };

    return (
        <div className={`modern-layout ${isDark ? 'dark' : ''}`}>
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && window.innerWidth < 1024 && (
                <div
                    className="sidebar-overlay"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <ModernSidebar
                isOpen={isSidebarOpen}
                onToggle={toggleSidebar}
            />

            {/* Main Content Area */}
            <div className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
                {/* Header */}
                <ModernHeader
                    onMenuClick={toggleSidebar}
                    isDark={isDark}
                    onThemeToggle={toggleTheme}
                />

                {/* Content Body */}
                <main className="content-body">
                    {children}
                </main>

                {/* Mobile Bottom Navigation */}
                <ModernMobileNav
                    activeTab={activeTab}
                    onTabChange={handleMobileNavChange}
                />
            </div>
        </div>
    );
};

export default ModernLayout;
