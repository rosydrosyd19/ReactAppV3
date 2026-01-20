import { createContext, useContext, useState, useEffect } from 'react';
import axios from '../utils/axios';

const ConfigContext = createContext(null);

export const useConfig = () => useContext(ConfigContext);

export const ConfigProvider = ({ children }) => {
    const [config, setConfig] = useState({
        app_name: 'ReactAppV3', // Default
    });
    const [loading, setLoading] = useState(true);

    const fetchConfig = async () => {
        try {
            const response = await axios.get('/sysadmin/settings');
            if (response.data.success) {
                setConfig(prev => ({ ...prev, ...response.data.data }));
            }
        } catch (error) {
            console.error('Failed to fetch config:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    // Apply settings to document
    useEffect(() => {
        if (config.page_title) {
            document.title = config.page_title;
        } else if (config.app_name) {
            document.title = config.app_name;
        }

        // Save to localStorage for index.html loading screen
        if (config.app_name) {
            localStorage.setItem('app_name', config.app_name);
        }
        if (config.app_icon) {
            localStorage.setItem('app_icon', config.app_icon);
        }

        if (config.app_icon) {
            let link = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.getElementsByTagName('head')[0].appendChild(link);
            }
            link.href = config.app_icon;
        }
    }, [config]);

    const updateConfig = async (newSettings) => {
        try {
            const response = await axios.put('/sysadmin/settings', newSettings);
            if (response.data.success) {
                setConfig(prev => ({ ...prev, ...newSettings }));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to update config:', error);
            throw error;
        }
    };

    const value = {
        config,
        loading,
        fetchConfig,
        updateConfig
    };

    return (
        <ConfigContext.Provider value={value}>
            {children}
        </ConfigContext.Provider>
    );
};
