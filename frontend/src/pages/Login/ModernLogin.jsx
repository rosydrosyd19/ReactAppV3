import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiUser, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import './ModernLogin.css';

const ModernLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const theme = localStorage.getItem('theme') || 'light';

        // Set dark mode state
        setIsDark(theme === 'simple-modern-dark');

        // Add dark class to html element for Simple Modern Dark theme
        if (theme === 'simple-modern-dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleTheme = () => {
        const currentTheme = localStorage.getItem('theme') || 'light';
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(username, password, false);

        if (result.success) {
            const from = location.state?.from?.pathname || '/modules';
            navigate(from, { replace: true });
        } else {
            setError(result.message);
        }

        setLoading(false);
    };

    return (
        <div className="h-screen w-full flex items-center justify-center transition-all duration-700 bg-gradient-to-br from-blue-50 via-white to-indigo-100 dark:from-[#020617] dark:via-[#0f172a] dark:to-[#020617] px-4 font-ubuntu relative overflow-hidden">

            {/* Ambient Decorative Background Elements */}
            <div className="absolute top-[-15%] left-[-5%] w-[60%] h-[60%] bg-blue-400/20 dark:bg-blue-500/15 rounded-full blur-[120px] animate-pulse transition-opacity duration-1000 pointer-events-none" />
            <div className="absolute bottom-[-15%] right-[-5%] w-[60%] h-[60%] bg-indigo-400/20 dark:bg-indigo-500/15 rounded-full blur-[120px] animate-pulse transition-opacity duration-1000 pointer-events-none" style={{ animationDelay: '1.5s' }} />
            <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-300/10 dark:bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Center Glow for Dark Mode */}
            <div className="hidden dark:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-blue-900/5 rounded-full blur-[150px] pointer-events-none" />

            {/* Theme Toggle Button */}
            <button
                onClick={toggleTheme}
                className="fixed top-6 right-6 p-3 rounded-2xl bg-white/10 dark:bg-black/20 backdrop-blur-md border border-slate-200 dark:border-slate-800 transition-all duration-300 hover:scale-110 active:scale-95 z-50 shadow-sm"
                aria-label="Toggle Theme"
            >
                {isDark ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                        <circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700">
                        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                    </svg>
                )}
            </button>

            <div className="w-full max-w-md z-10 animate-in fade-in zoom-in duration-500">
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white dark:border-slate-800/50 rounded-[2.5rem] shadow-2xl shadow-blue-200/50 dark:shadow-[0_0_50px_-12px_rgba(59,130,246,0.15)] p-8 md:p-10 transition-all duration-500">

                    {/* Header & Brand */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-500 mb-6 shadow-xl shadow-blue-500/20 dark:shadow-blue-500/10 transform hover:scale-105 transition-transform duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                            ReactAppV3
                        </h1>
                        <p className="mt-2 text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium">
                            Sign in to access your account
                        </p>
                    </div>

                    {/* Feedback Messages */}
                    {error && (
                        <div className="mb-6 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Username/Email Field */}
                        <div className="space-y-1.5 w-full">
                            <label htmlFor="username" className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
                                Email or Username
                            </label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                    <FiUser size={18} />
                                </div>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="name@company.com"
                                    required
                                    className="w-full py-3.5 pl-11 pr-5 rounded-2xl border transition-all duration-200 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300 dark:hover:border-slate-600"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-1.5">
                            <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
                                Password
                            </label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                    <FiLock size={18} />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full py-3.5 pl-11 pr-12 rounded-2xl border transition-all duration-200 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300 dark:hover:border-slate-600"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                </button>
                            </div>
                            <div className="flex flex-col gap-1 px-1 mt-2">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Forgot password? Please contact the <span className="text-blue-600 dark:text-blue-400 font-semibold cursor-help transition-colors hover:text-blue-500">administrator</span>.
                                </p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-2xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 mt-4 ${loading
                                ? 'bg-blue-600/70 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98]'
                                }`}
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ModernLogin;
