import './MainLayout.css';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileBottomNav from './MobileBottomNav';

const MainLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);

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
