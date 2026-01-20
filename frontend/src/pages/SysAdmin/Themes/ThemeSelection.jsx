import React, { useState, useEffect } from 'react';
import './ThemeSelection.css'; // We'll create this for specific styles
import { FiCheck, FiMonitor, FiLayout } from 'react-icons/fi';

const ThemeSelection = () => {
    const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('theme') || 'light');

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        setCurrentTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
    }, []);

    const handleThemeChange = (theme) => {
        setCurrentTheme(theme);
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    };

    return (
        <div className="theme-selection-container">
            <h1 className="page-title">Theme Selection</h1>
            <p className="page-subtitle">Choose a display theme for your application.</p>

            <div className="theme-grid">
                {/* Standard Theme (Light) */}
                <div
                    className={`theme-card ${currentTheme === 'light' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('light')}
                >
                    <div className="theme-preview standard-preview">
                        <div className="preview-header"></div>
                        <div className="preview-sidebar"></div>
                        <div className="preview-content"></div>
                    </div>
                    <div className="theme-info">
                        <h3>Standard (Light)</h3>
                        <p>Default appearance with classic blue colors.</p>
                    </div>
                    {currentTheme === 'light' && <div className="check-icon"><FiCheck /></div>}
                </div>

                {/* Standard Theme (Dark) */}
                <div
                    className={`theme-card ${currentTheme === 'dark' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('dark')}
                >
                    <div className="theme-preview dark-preview">
                        <div className="preview-header"></div>
                        <div className="preview-sidebar"></div>
                        <div className="preview-content"></div>
                    </div>
                    <div className="theme-info">
                        <h3>Standard (Dark)</h3>
                        <p>Dark appearance for low-light environments.</p>
                    </div>
                    {currentTheme === 'dark' && <div className="check-icon"><FiCheck /></div>}
                </div>

                {/* Simple Modern Theme (Light) */}
                <div
                    className={`theme-card ${currentTheme === 'simple-modern' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('simple-modern')}
                >
                    <div className="theme-preview modern-preview">
                        <div className="preview-header"></div>
                        <div className="preview-sidebar"></div>
                        <div className="preview-content"></div>
                    </div>
                    <div className="theme-info">
                        <h3>Simple Modern (Light)</h3>
                        <p>Modern appearance with clean slate colors.</p>
                    </div>
                    {currentTheme === 'simple-modern' && <div className="check-icon"><FiCheck /></div>}
                </div>

                {/* Simple Modern Theme (Dark) */}
                <div
                    className={`theme-card ${currentTheme === 'simple-modern-dark' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('simple-modern-dark')}
                >
                    <div className="theme-preview modern-dark-preview">
                        <div className="preview-header"></div>
                        <div className="preview-sidebar"></div>
                        <div className="preview-content"></div>
                    </div>
                    <div className="theme-info">
                        <h3>Simple Modern (Dark)</h3>
                        <p>Elegant dark slate appearance.</p>
                    </div>
                    {currentTheme === 'simple-modern-dark' && <div className="check-icon"><FiCheck /></div>}
                </div>
            </div>
        </div>
    );
};

export default ThemeSelection;
