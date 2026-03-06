import './MainLayout.css';
import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileBottomNav from './MobileBottomNav';
import ModernLayout from './ModernLayout';

const MainLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
    const [currentTheme, setCurrentTheme] = useState('light');

    useEffect(() => {
        // Check theme on mount
        const theme = localStorage.getItem('theme') || 'simple-modern';
        setCurrentTheme(theme);

        // Listen for theme changes
        const handleThemeChange = () => {
            const newTheme = localStorage.getItem('theme') || 'simple-modern';
            setCurrentTheme(newTheme);
        };

        window.addEventListener('themeChange', handleThemeChange);
        window.addEventListener('storage', handleThemeChange);

        return () => {
            window.removeEventListener('themeChange', handleThemeChange);
            window.removeEventListener('storage', handleThemeChange);
        };
    }, []);

    // Use ModernLayout for Simple Modern themes
    if (currentTheme === 'simple-modern' || currentTheme === 'simple-modern-dark') {
        return (
            <ModernLayout>
                <Outlet />
            </ModernLayout>
        );
    }

    // Use standard layout for other themes
    return (
        <div className={`main-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="main-content-wrapper">
                <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} isSidebarOpen={sidebarOpen} />
                <main className="main-content">
                    <Outlet />
                </main>
                <MobileBottomNav />
            </div>
        </div>
    );
};

export default MainLayout;
