import './Login.css';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiUser, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import ModernLogin from './ModernLogin';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentTheme, setCurrentTheme] = useState('light');
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const theme = localStorage.getItem('theme') || 'light';
        setCurrentTheme(theme);

        // Hide loading screen when login page loads with delay
        // Delay ensures smooth transition from logout
        const timer = setTimeout(() => {
            const loader = document.getElementById('app-loader');
            if (loader) {
                loader.classList.add('hidden');
            }
        }, 1000); // Delay to ensure smooth transition from logout

        // Listen for theme changes from header toggle
        const handleStorageChange = (e) => {
            if (e.key === 'theme' || e.type === 'storage') {
                const newTheme = localStorage.getItem('theme') || 'light';
                setCurrentTheme(newTheme);
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // Custom event for same-window changes
        const handleCustomThemeChange = () => {
            const newTheme = localStorage.getItem('theme') || 'light';
            setCurrentTheme(newTheme);
        };

        window.addEventListener('themeChange', handleCustomThemeChange);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('themeChange', handleCustomThemeChange);
        };
    }, [location]); // Re-run when location changes (e.g., after logout redirect)

    // Use ModernLogin for Simple Modern themes
    if (currentTheme === 'simple-modern' || currentTheme === 'simple-modern-dark') {
        return <ModernLogin />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(username, password, rememberMe);

        if (result.success) {
            const from = location.state?.from?.pathname || '/modules';
            navigate(from, { replace: true });
        } else {
            setError(result.message);
        }

        setLoading(false);
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>ReactAppV3</h1>
                    <p>Modular Asset Management System</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && <div className="alert alert-error">{error}</div>}

                    <div className="form-group">
                        <label className="form-label">Username or Email</label>
                        <div className="input-with-icon">
                            <FiUser />
                            <input
                                type="text"
                                className="form-input"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter username or email"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div className="input-with-icon">
                            <FiLock />
                            <input
                                type={showPassword ? "text" : "password"}
                                className="form-input has-toggle"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex="-1"
                            >
                                {showPassword ? <FiEyeOff /> : <FiEye />}
                            </button>
                        </div>
                    </div>

                    <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            Remember Me
                        </label>
                    </div>

                    <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
