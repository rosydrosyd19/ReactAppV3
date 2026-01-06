import { useState, useEffect } from 'react';
import { useConfig } from '../../../contexts/ConfigContext';
import Toast from '../../../components/Toast/Toast';
import { FiSave, FiUpload } from 'react-icons/fi';
import axios from '../../../utils/axios';

const SettingsPage = () => {
    const { config, updateConfig } = useConfig();
    const [appName, setAppName] = useState('');
    const [pageTitle, setPageTitle] = useState('');
    const [appIcon, setAppIcon] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });

    useEffect(() => {
        if (config.app_name) setAppName(config.app_name);
        if (config.page_title) setPageTitle(config.page_title);
        if (config.app_icon) setAppIcon(config.app_icon);
    }, [config]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post('/sysadmin/settings/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success) {
                setAppIcon(res.data.url);
                showToast('Icon uploaded successfully', 'success');
            }
        } catch (error) {
            showToast('Failed to upload icon', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateConfig({
                app_name: appName,
                page_title: pageTitle,
                app_icon: appIcon
            });
            showToast('Settings updated successfully', 'success');
        } catch (error) {
            showToast('Failed to update settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };

    return (
        <div className="card" style={{ padding: '0px 24px 24px 24px' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', paddingTop: '24px', borderBottom: '1px solid var(--border-color)' }}>
                <h2 style={{ margin: 0, fontSize: '18px' }}>System Configuration</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 'normal' }}>Manage application wide settings</p>
            </div>

            <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
                <div className="form-group">
                    <label className="form-label">Application Name</label>
                    <input
                        type="text"
                        className="form-input"
                        value={appName}
                        onChange={(e) => setAppName(e.target.value)}
                        placeholder="e.g. My Company App"
                        required
                    />
                    <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                        This name will be displayed in the sidebar.
                    </small>
                </div>

                <div className="form-group">
                    <label className="form-label">Browser Tab Title</label>
                    <input
                        type="text"
                        className="form-input"
                        value={pageTitle}
                        onChange={(e) => setPageTitle(e.target.value)}
                        placeholder="e.g. Dashboard - My Company"
                    />
                    <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                        Title shown in the browser tab.
                    </small>
                </div>

                <div className="form-group">
                    <label className="form-label">Browser Favicon</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {appIcon && (
                            <img
                                src={appIcon}
                                alt="Favicon Preview"
                                style={{ width: '128px', height: '128px', objectFit: 'contain', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px' }}
                            />
                        )}
                        <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                            <FiUpload /> Upload Icon
                            <input
                                type="file"
                                accept="image/*" // Corrected from image/x-icon,image/png etc to broader image/* for simplicity or specific types
                                onChange={handleFileUpload}
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>
                    <input type="hidden" value={appIcon} />
                    <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                        Upload an image (PNG, ICO) to be used as the browser tab icon.
                    </small>
                </div>

                <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        <FiSave style={{ marginRight: '8px' }} />
                        {loading ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>

            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}
        </div>
    );
};

export default SettingsPage;
