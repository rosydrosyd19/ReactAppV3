import { useState, useEffect } from 'react';
import { useConfig } from '../../../contexts/ConfigContext';
import Toast from '../../../components/Toast/Toast';
import { FiSave, FiUpload, FiPlus, FiTrash } from 'react-icons/fi';
import axios from '../../../utils/axios';

const SettingsPage = () => {
    const { config, updateConfig } = useConfig();
    const [appName, setAppName] = useState('');
    const [pageTitle, setPageTitle] = useState('');
    const [appIcon, setAppIcon] = useState('');
    const [whatsappApiUrl, setWhatsappApiUrl] = useState('');
    const [whatsappApiToken, setWhatsappApiToken] = useState('');
    const [whatsappSecretKey, setWhatsappSecretKey] = useState('');
    const [testPhone, setTestPhone] = useState('');
    const [testMessage, setTestMessage] = useState('Hello from ReactAppV3');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('system');

    // Multi-Admin Phone States
    const [adminPhones, setAdminPhones] = useState([]);
    const [users, setUsers] = useState([]);
    const [manualPhone, setManualPhone] = useState('');
    const [selectedUser, setSelectedUser] = useState('');

    useEffect(() => {
        if (activeTab === 'whatsapp') {
            fetchUsers();
        }
    }, [activeTab]);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/sysadmin/users');
            if (res.data.success) {
                setUsers(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            // Don't show toast to avoid annoyance if it fails silently
        }
    };
    useEffect(() => {
        if (config) {
            setAppName(config.app_name || '');
            setPageTitle(config.page_title || '');
            setAppIcon(config.app_icon || '');
            setWhatsappApiUrl(config.whatsapp_api_url || '');
            setWhatsappApiToken(config.whatsapp_api_token || '');
            setWhatsappSecretKey(config.whatsapp_secret_key || '');

            // Parse admin_it_phones
            if (config.admin_it_phones) {
                try {
                    // Try parsing as JSON array
                    const parsed = JSON.parse(config.admin_it_phones);
                    if (Array.isArray(parsed)) {
                        setAdminPhones(parsed);
                    } else {
                        // If not array, treat as single string (legacy support)
                        setAdminPhones([String(parsed)]);
                    }
                } catch (e) {
                    // If parse fails, treat as simple string
                    setAdminPhones([String(config.admin_it_phones)]);
                }
            } else {
                setAdminPhones([]);
            }
        }
    }, [config]);

    const [toast, setToast] = useState({ show: false, message: '', type: '' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
    };

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

    const handleSystemSave = async () => {
        setLoading(true);
        try {
            await updateConfig({
                app_name: appName,
                page_title: pageTitle,
                app_icon: appIcon
            });
            showToast('System settings updated successfully', 'success');
        } catch (error) {
            showToast('Failed to update system settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleWhatsAppSave = async () => {
        setLoading(true);
        try {
            await updateConfig({
                whatsapp_api_url: whatsappApiUrl,
                whatsapp_api_token: whatsappApiToken,
                whatsapp_secret_key: whatsappSecretKey,
                admin_it_phones: JSON.stringify(adminPhones)
            });
            showToast('WhatsApp settings updated successfully', 'success');
        } catch (error) {
            showToast('Failed to update WhatsApp settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card" style={{ padding: '0px 24px 24px 24px' }}>
            <div className="card-header" style={{ marginBottom: '20px', paddingBottom: '0', paddingTop: '24px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '18px' }}>Global Settings</h2>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 'normal' }}>Manage system and integration settings</p>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div style={{ display: 'flex', gap: '24px' }}>
                    <button
                        onClick={() => setActiveTab('system')}
                        style={{
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'system' ? '2px solid var(--primary-color)' : '2px solid transparent',
                            padding: '0 0 12px 0',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: activeTab === 'system' ? '600' : '500',
                            color: activeTab === 'system' ? 'var(--primary-color)' : 'var(--text-secondary)',
                            transition: 'all 0.2s'
                        }}
                    >
                        System Configuration
                    </button>
                    <button
                        onClick={() => setActiveTab('whatsapp')}
                        style={{
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'whatsapp' ? '2px solid var(--primary-color)' : '2px solid transparent',
                            padding: '0 0 12px 0',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: activeTab === 'whatsapp' ? '600' : '500',
                            color: activeTab === 'whatsapp' ? 'var(--primary-color)' : 'var(--text-secondary)',
                            transition: 'all 0.2s'
                        }}
                    >
                        WhatsApp Configuration
                    </button>
                </div>
            </div>

            <div style={{ maxWidth: '600px', paddingTop: '20px' }}>
                {/* System Configuration Tab */}
                {activeTab === 'system' && (
                    <div className="fade-in">
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
                                        accept="image/*"
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

                        <div style={{ marginTop: '20px', marginBottom: '10px' }}>
                            <button
                                type="button"
                                className="btn btn-primary"
                                disabled={loading}
                                onClick={handleSystemSave}
                            >
                                <FiSave style={{ marginRight: '8px' }} />
                                Save System Settings
                            </button>
                        </div>
                    </div>
                )}

                {/* WhatsApp Configuration Tab */}
                {activeTab === 'whatsapp' && (
                    <div className="fade-in">
                        <div className="form-group">
                            <label className="form-label">WhatsApp API URL</label>
                            <input
                                type="text"
                                className="form-input"
                                value={whatsappApiUrl}
                                onChange={(e) => setWhatsappApiUrl(e.target.value)}
                                placeholder="https://api.whatsapp.com/..."
                            />
                            <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                                The endpoint for sending WhatsApp messages.
                            </small>
                        </div>

                        <div className="form-group">
                            <label className="form-label">WhatsApp API Token</label>
                            <input
                                type="password"
                                className="form-input"
                                value={whatsappApiToken}
                                onChange={(e) => setWhatsappApiToken(e.target.value)}
                                placeholder="*************"
                            />
                            <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                                Security token for authenticating with the API.
                            </small>
                        </div>

                        <div className="form-group">
                            <label className="form-label">WhatsApp Secret Key</label>
                            <input
                                type="password"
                                className="form-input"
                                value={whatsappSecretKey}
                                onChange={(e) => setWhatsappSecretKey(e.target.value)}
                                placeholder="*************"
                            />
                            <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                                Secret Key to bypass IP whitelist (if enabled).
                            </small>
                        </div>

                        {/* Admin IT Phones Section */}
                        <div style={{ marginTop: '24px', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                            <h4 style={{ fontSize: '15px', marginBottom: '16px', marginTop: 0 }}>IT Admin Phone Numbers</h4>

                            {/* List of Numbers */}
                            <div style={{ marginBottom: '16px' }}>
                                {adminPhones.length > 0 ? (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {adminPhones.map((phone, index) => (
                                            <div key={index} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                background: 'var(--bg-secondary)',
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                border: '1px solid var(--border-color)',
                                                fontSize: '13px'
                                            }}>
                                                <span>{phone}</span>
                                                <button
                                                    onClick={() => {
                                                        const newPhones = adminPhones.filter((_, i) => i !== index);
                                                        setAdminPhones(newPhones);
                                                    }}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: 'var(--error-color)',
                                                        marginLeft: '8px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <FiTrash size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No admin numbers added yet.</p>
                                )}
                            </div>

                            {/* Add New Number Controls */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                                {/* Add from User */}
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                                    <div style={{ flex: 1 }}>
                                        <label className="form-label" style={{ fontSize: '12px' }}>Add from Registered User</label>
                                        <select
                                            className="form-input"
                                            value={selectedUser}
                                            onChange={(e) => setSelectedUser(e.target.value)}
                                            style={{ fontSize: '13px' }}
                                        >
                                            <option value="">-- Select User --</option>
                                            {users.map(user => (
                                                <option key={user.id} value={user.id}>
                                                    {user.username} {user.full_name ? `(${user.full_name})` : ''} - {user.phone || 'No Phone'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-secondary btn-sm"
                                        disabled={!selectedUser}
                                        onClick={() => {
                                            const user = users.find(u => u.id == selectedUser);
                                            if (user && user.phone) {
                                                if (!adminPhones.includes(user.phone)) {
                                                    setAdminPhones([...adminPhones, user.phone]);
                                                    setSelectedUser('');
                                                } else {
                                                    showToast('Phone number already exists in list', 'error');
                                                }
                                            } else {
                                                showToast('Selected user has no phone number', 'error');
                                            }
                                        }}
                                        style={{ marginBottom: '2px' }}
                                    >
                                        <FiPlus /> Add
                                    </button>
                                </div>

                                <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>- OR -</div>

                                {/* Add Manually */}
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                                    <div style={{ flex: 1 }}>
                                        <label className="form-label" style={{ fontSize: '12px' }}>Add Manually</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={manualPhone}
                                            onChange={(e) => setManualPhone(e.target.value)}
                                            placeholder="e.g. 62812345678"
                                            style={{ fontSize: '13px' }}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-secondary btn-sm"
                                        disabled={!manualPhone}
                                        onClick={() => {
                                            if (manualPhone) {
                                                if (!adminPhones.includes(manualPhone)) {
                                                    setAdminPhones([...adminPhones, manualPhone]);
                                                    setManualPhone('');
                                                } else {
                                                    showToast('Phone number already exists in list', 'error');
                                                }
                                            }
                                        }}
                                        style={{ marginBottom: '2px' }}
                                    >
                                        <FiPlus /> Add
                                    </button>
                                </div>
                            </div>
                            <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '8px' }}>
                                These numbers will receive maintenance request notifications.
                            </small>
                        </div>

                        <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                            <button
                                type="button"
                                className="btn btn-primary"
                                disabled={loading}
                                onClick={handleWhatsAppSave}
                            >
                                <FiSave style={{ marginRight: '8px' }} />
                                Save WhatsApp Settings
                            </button>

                            <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={async (e) => {
                                    if (!whatsappApiUrl || !whatsappApiToken) {
                                        showToast('Please enter both URL and Token', 'error');
                                        return;
                                    }
                                    const btn = e.currentTarget;
                                    const originalText = btn.innerText;
                                    btn.innerText = 'Testing...';
                                    btn.disabled = true;
                                    try {
                                        await axios.post('/sysadmin/settings/test-whatsapp', {
                                            whatsapp_api_url: whatsappApiUrl,
                                            whatsapp_api_token: whatsappApiToken,
                                            whatsapp_secret_key: whatsappSecretKey
                                        });
                                        showToast('Connection successful!', 'success');
                                    } catch (err) {
                                        showToast(err.response?.data?.message || 'Connection failed', 'error');
                                    } finally {
                                        btn.innerText = originalText;
                                        btn.disabled = false;
                                    }
                                }}
                            >
                                Test Connection
                            </button>
                        </div>

                        <div style={{ marginTop: '20px', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                            <h4 style={{ fontSize: '14px', marginBottom: '12px' }}>Send Test Message</h4>
                            <div className="form-row">
                                <div className="form-group half">
                                    <label className="form-label" style={{ fontSize: '12px' }}>Phone Number</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={testPhone}
                                        onChange={(e) => setTestPhone(e.target.value)}
                                        placeholder="e.g. 6281234567890"
                                        style={{ fontSize: '13px' }}
                                    />
                                </div>
                                <div className="form-group half">
                                    <label className="form-label" style={{ fontSize: '12px' }}>Message</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={testMessage}
                                        onChange={(e) => setTestMessage(e.target.value)}
                                        placeholder="Test message..."
                                        style={{ fontSize: '13px' }}
                                    />
                                </div>
                            </div>
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                style={{ marginTop: '8px' }}
                                onClick={async (e) => {
                                    if (!whatsappApiUrl || !whatsappApiToken || !testPhone || !testMessage) {
                                        showToast('All fields required for test message', 'error');
                                        return;
                                    }
                                    const btn = e.currentTarget;
                                    const originalText = btn.innerText;
                                    btn.innerText = 'Sending...';
                                    btn.disabled = true;
                                    try {
                                        await axios.post('/sysadmin/settings/send-test-whatsapp', {
                                            whatsapp_api_url: whatsappApiUrl,
                                            whatsapp_api_token: whatsappApiToken,
                                            whatsapp_secret_key: whatsappSecretKey,
                                            test_phone: testPhone,
                                            test_message: testMessage
                                        });
                                        showToast('Message sent successfully!', 'success');
                                    } catch (err) {
                                        showToast(err.response?.data?.message || 'Failed to send message', 'error');
                                    } finally {
                                        btn.innerText = originalText;
                                        btn.disabled = false;
                                    }
                                }}
                            >
                                Send Test Message
                            </button>
                        </div>
                    </div>
                )}
            </div>

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
