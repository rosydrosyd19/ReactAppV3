import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Check for existing token on mount
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                setUser(userData.user);
                setPermissions(userData.permissions || []);
                setModules(userData.modules || []);
            } catch (error) {
                console.error('Error parsing saved user:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (username, password, remember = false) => {
        try {
            const response = await axios.post('/auth/login', { username, password, remember });

            if (response.data.success) {
                const { token, user, permissions, modules } = response.data.data;

                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify({ user, permissions, modules }));

                setUser(user);
                setPermissions(permissions || []);
                setModules(modules || []);

                return { success: true };
            }

            return { success: false, message: 'Login failed' };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed',
            };
        }
    };

    const logout = () => {
        // Show loading screen
        const loader = document.getElementById('app-loader');
        if (loader) {
            loader.classList.remove('hidden');
        }

        // Small delay to ensure loader is visible
        setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            setPermissions([]);
            setModules([]);
            navigate('/login');
        }, 300);
    };

    const hasPermission = (permissionKey) => {
        return permissions.includes(permissionKey);
    };

    const hasAnyPermission = (permissionKeys) => {
        return permissionKeys.some((key) => permissions.includes(key));
    };

    const hasModule = (moduleName) => {
        return modules.includes(moduleName);
    };

    const value = {
        user,
        permissions,
        modules,
        loading,
        login,
        logout,
        hasPermission,
        hasAnyPermission,
        hasModule,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
