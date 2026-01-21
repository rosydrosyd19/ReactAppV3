import './ModernModuleSelection.css';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiSettings, FiBox, FiUsers, FiLogOut, FiMoon, FiSun } from 'react-icons/fi';
import { useEffect, useState } from 'react';

const ModernModuleSelection = () => {
    const { user, logout, hasAnyPermission, hasModule } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isDark, setIsDark] = useState(() => {
        const theme = localStorage.getItem('theme') || 'light';
        return theme === 'simple-modern-dark';
    });

    useEffect(() => {
        // Show loading screen
        const loader = document.getElementById('app-loader');
        if (loader) {
            loader.classList.remove('hidden');
        }

        // Clear active module when entering selection screen
        localStorage.removeItem('activeModule');

        // Apply theme on mount
        const savedTheme = localStorage.getItem('theme') || 'light';
        setIsDark(savedTheme === 'simple-modern-dark');
        document.documentElement.setAttribute('data-theme', savedTheme);

        // Add dark class for Simple Modern Dark theme
        if (savedTheme === 'simple-modern-dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // Hide loading screen after component is ready
        const timer = setTimeout(() => {
            setIsLoading(false);
            const loader = document.getElementById('app-loader');
            if (loader) {
                loader.classList.add('hidden');
            }
        }, 500); // Small delay to ensure smooth transition

        return () => clearTimeout(timer);
    }, []);

    // Show loading screen while loading
    if (isLoading) {
        return null;
    }

    const toggleTheme = () => {
        const currentTheme = localStorage.getItem('theme') || 'simple-modern';
        const newTheme = currentTheme === 'simple-modern' ? 'simple-modern-dark' : 'simple-modern';

        setIsDark(newTheme === 'simple-modern-dark');
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);

        // Add/remove dark class for Simple Modern Dark theme
        if (newTheme === 'simple-modern-dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // Dispatch custom event for Login page sync
        window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme: newTheme } }));
    };

    const modules = [
        {
            id: 'asset',
            name: 'Asset Management',
            description: 'Track, organize, and monitor enterprise assets, hardware, and inventory across all departments.',
            icon: <FiBox className="h-8 w-8" />,
            path: '/asset/dashboard',
            color: 'blue',
            show: hasModule('asset') || hasAnyPermission(['VIEW_ASSETS', 'MANAGE_ASSETS'])
        },
        {
            id: 'sysadmin',
            name: 'System Administrator',
            description: 'Manage user permissions, system configurations, audit logs, and security protocols.',
            icon: <FiSettings className="h-8 w-8" />,
            path: '/sysadmin/dashboard',
            color: 'indigo',
            show: hasModule('sysadmin') || hasAnyPermission(['MANAGE_USERS', 'MANAGE_ROLES'])
        },
        {
            id: 'hr',
            name: 'HR Management',
            description: 'Streamline employee data, manage leave requests, payroll processing, and talent acquisition.',
            icon: <FiUsers className="h-8 w-8" />,
            path: '/hr/dashboard',
            color: 'emerald',
            show: hasModule('hr') || hasAnyPermission(['MANAGE_HR'])
        }
    ];

    const handleModuleClick = (module) => {
        localStorage.setItem('activeModule', module.id);
        navigate(module.path);
    };

    return (
        <div className="min-h-screen transition-colors duration-300 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <span className="text-white font-bold text-xl">0</span>
                    </div>
                    <span className="text-xl font-bold tracking-tight hidden sm:inline-block">OmniSuite</span>
                </div>

                <div className="flex items-center space-x-2 md:space-x-6">
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full transition-all duration-300 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none"
                        aria-label="Toggle Theme"
                    >
                        {isDark ? (
                            <FiSun className="h-5 w-5 text-amber-500" />
                        ) : (
                            <FiMoon className="h-5 w-5 text-slate-600" />
                        )}
                    </button>

                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2 hidden sm:block"></div>

                    <div className="flex items-center space-x-4">
                        <div className="hidden md:block text-right">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">Welcome, {user?.full_name || user?.username}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium capitalize">{user?.role || 'User'}</p>
                        </div>

                        <button
                            onClick={logout}
                            className="group flex items-center space-x-2 px-4 py-2 rounded-full bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-900/20 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300 font-medium text-sm"
                        >
                            <span>Logout</span>
                            <FiLogOut className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-12 md:py-20">
                <div className="mb-12 text-center md:text-left">
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">
                        Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">Destination</span>
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                        Welcome back! Select a module to begin managing your enterprise operations.
                    </p>
                </div>

                {/* Modules Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {modules.filter(m => m.show).map((module) => (
                        <div
                            key={module.id}
                            className="group relative p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-indigo-500 transition-all duration-300 cursor-pointer overflow-hidden"
                            onClick={() => handleModuleClick(module)}
                        >
                            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500 bg-${module.color}-500 rounded-full`}></div>

                            <div className="flex flex-col h-full space-y-4">
                                <div className="p-3 w-fit rounded-xl bg-slate-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                                    {module.icon}
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {module.name}
                                    </h3>
                                    <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                        {module.description}
                                    </p>
                                </div>

                                <div className="mt-auto pt-4 flex items-center text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
                                    Launch Module
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Note */}
                <div className="mt-20 text-center">
                    <p className="text-slate-400 dark:text-slate-600 text-sm">
                        &copy; 2024 OmniSuite Enterprise Solutions. All rights reserved.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default ModernModuleSelection;
