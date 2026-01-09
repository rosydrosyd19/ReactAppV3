import { useState, useEffect } from 'react';
import { useConfig } from '../../../contexts/ConfigContext';
import Toast from '../../../components/Toast/Toast';
import { FiSave, FiUpload, FiPlus, FiTrash } from 'react-icons/fi';
import axios from '../../../utils/axios';
import { compressImage } from '../../../utils/imageCompression';

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

    // Message Templates State
    const [templateAdmin, setTemplateAdmin] = useState('');

    const [templateUser, setTemplateUser] = useState('');

    // Notification Toggles
    const [enableUserWa, setEnableUserWa] = useState(false);
    const [enableAdminWa, setEnableAdminWa] = useState(false);

    // Telegram States
    const [telegramBotToken, setTelegramBotToken] = useState('');
    const [telegramChatIds, setTelegramChatIds] = useState([]);
    const [manualChatId, setManualChatId] = useState('');
    const [templateTelegramAdmin, setTemplateTelegramAdmin] = useState('');
    const [enableTelegramAdmin, setEnableTelegramAdmin] = useState(false);
    const [testChatId, setTestChatId] = useState('');

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

            // Load Templates
            setTemplateAdmin(config.whatsapp_template_admin_request || 'New Maintenance Request:\nAsset: {asset_name} ({asset_tag})\nIssue: {issue_description}\nBy: {requester_name}');

            setTemplateUser(config.whatsapp_template_user_request || 'Your maintenance request for {asset_name} has been received.\nTicket: {ticket_number}');

            setEnableUserWa(config.whatsapp_enable_user_notifications === 'true');
            setEnableAdminWa(config.whatsapp_enable_admin_notifications === 'true');

            // Load Telegram Config
            setTelegramBotToken(config.telegram_bot_token || '');
            if (config.telegram_admin_chat_ids) {
                try {
                    const parsed = JSON.parse(config.telegram_admin_chat_ids);
                    setTelegramChatIds(Array.isArray(parsed) ? parsed : []);
                } catch (e) {
                    setTelegramChatIds([]);
                }
            }
            setTemplateTelegramAdmin(config.telegram_template_admin_request || 'New Maintenance Request:\nAsset: {asset_name} ({asset_tag})\nIssue: {issue_description}\nBy: {requester_name}');
            setEnableTelegramAdmin(config.telegram_enable_admin_notifications === 'true');
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

        try {
            const compressedFile = await compressImage(file);

            const formData = new FormData();
            formData.append('file', compressedFile);

            const res = await axios.post('/sysadmin/settings/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success) {
                setAppIcon(res.data.url);
                showToast('Icon uploaded successfully', 'success');
            }
        } catch (error) {
            console.error("Upload/Compression failed:", error);
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
                admin_it_phones: JSON.stringify(adminPhones),
                whatsapp_template_admin_request: templateAdmin,

                whatsapp_template_user_request: templateUser,
                whatsapp_enable_user_notifications: String(enableUserWa),
                whatsapp_enable_admin_notifications: String(enableAdminWa)
            });
            showToast('WhatsApp settings updated successfully', 'success');
        } catch (error) {
            showToast('Failed to update WhatsApp settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleTelegramSave = async () => {
        setLoading(true);
        try {
            await updateConfig({
                telegram_bot_token: telegramBotToken,
                telegram_admin_chat_ids: JSON.stringify(telegramChatIds),
                telegram_template_admin_request: templateTelegramAdmin,
                telegram_enable_admin_notifications: String(enableTelegramAdmin)
            });
            showToast('Telegram settings updated successfully', 'success');
        } catch (error) {
            showToast('Failed to update Telegram settings', 'error');
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
                    <button
                        onClick={() => setActiveTab('telegram')}
                        style={{
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'telegram' ? '2px solid var(--primary-color)' : '2px solid transparent',
                            padding: '0 0 12px 0',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: activeTab === 'telegram' ? '600' : '500',
                            color: activeTab === 'telegram' ? 'var(--primary-color)' : 'var(--text-secondary)',
                            transition: 'all 0.2s'
                        }}
                    >
                        Telegram Configuration
                    </button>
                </div>
            </div>

            <div style={{ paddingTop: '20px' }}>
                {/* System Configuration Tab */}
                {activeTab === 'system' && (
                    <div className="fade-in">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
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
                        </div>

                        <div className="form-group" style={{ marginTop: '20px' }}>
                            <label className="form-label">Browser Favicon</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {appIcon && (
                                    <img
                                        src={appIcon}
                                        alt="Favicon Preview"
                                        style={{ width: '64px', height: '64px', objectFit: 'contain', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px' }}
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

                        <div style={{ marginTop: '30px', marginBottom: '10px' }}>
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
                        {/* API Credentials Section */}
                        <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)' }}>
                            <h3 style={{ fontSize: '16px', marginTop: 0, marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>API Configuration</h3>
                            <div className="form-group">
                                <label className="form-label">WhatsApp API URL</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={whatsappApiUrl}
                                    onChange={(e) => setWhatsappApiUrl(e.target.value)}
                                    placeholder="https://api.whatsapp.com/..."
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '15px' }}>
                                <div className="form-group">
                                    <label className="form-label">WhatsApp API Token</label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        value={whatsappApiToken}
                                        onChange={(e) => setWhatsappApiToken(e.target.value)}
                                        placeholder="*************"
                                    />
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
                            </div>
                        </div>

                        {/* Notification Toggles */}
                        <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)' }}>
                            <h3 style={{ fontSize: '16px', marginTop: 0, marginBottom: '15px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Notification Control</h3>
                            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                                    <input
                                        type="checkbox"
                                        checked={enableUserWa}
                                        onChange={(e) => setEnableUserWa(e.target.checked)}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                    />
                                    <span style={{ fontSize: '14px', fontWeight: '500' }}>Enable User Notifications</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                                    <input
                                        type="checkbox"
                                        checked={enableAdminWa}
                                        onChange={(e) => setEnableAdminWa(e.target.checked)}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                    />
                                    <span style={{ fontSize: '14px', fontWeight: '500' }}>Enable Admin Notifications</span>
                                </label>
                            </div>
                            <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '10px' }}>
                                Uncheck to disable sending WhatsApp messages to the respective groups.
                            </small>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
                            {/* Left Column: Admin Phones */}
                            <div>
                                <div style={{ height: '100%', padding: '20px', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
                                    <h4 style={{ fontSize: '15px', marginBottom: '16px', marginTop: 0 }}>IT Admin Phone Numbers</h4>

                                    <div style={{ flex: 1, marginBottom: '20px' }}>
                                        {/* Add New Number Controls */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                                            {/* Add from User */}
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                                <div style={{ flex: '1 1 200px' }}>
                                                    <label className="form-label" style={{ fontSize: '13px' }}>Add from Registered User</label>
                                                    <select
                                                        className="form-input"
                                                        value={selectedUser}
                                                        onChange={(e) => setSelectedUser(e.target.value)}
                                                        style={{ fontSize: '14px' }}
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
                                                    style={{ marginBottom: '2px', height: '38px', whiteSpace: 'nowrap' }}
                                                >
                                                    <FiPlus /> Add
                                                </button>
                                            </div>

                                            <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>- OR -</div>

                                            {/* Add Manually */}
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                                <div style={{ flex: '1 1 200px' }}>
                                                    <label className="form-label" style={{ fontSize: '13px' }}>Add Manually</label>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        value={manualPhone}
                                                        onChange={(e) => setManualPhone(e.target.value)}
                                                        placeholder="e.g. 62812345678"
                                                        style={{ fontSize: '14px' }}
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
                                                    style={{ marginBottom: '2px', height: '38px', whiteSpace: 'nowrap' }}
                                                >
                                                    <FiPlus /> Add
                                                </button>
                                            </div>
                                        </div>

                                        <label className="form-label" style={{ fontSize: '13px' }}>Registered Admin Numbers:</label>
                                        <div style={{
                                            background: 'var(--bg-secondary)',
                                            borderRadius: '6px',
                                            padding: '10px',
                                            minHeight: '100px',
                                            maxHeight: '200px',
                                            overflowY: 'auto',
                                            border: '1px solid var(--border-color)'
                                        }}>
                                            {adminPhones.length > 0 ? (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                    {adminPhones.map((phone, index) => (
                                                        <div key={index} style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            background: '#fff',
                                                            padding: '6px 12px',
                                                            borderRadius: '20px',
                                                            border: '1px solid var(--border-color)',
                                                            fontSize: '13px',
                                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                                        }}>
                                                            <span style={{ fontWeight: '500' }}>{phone}</span>
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
                                                                    alignItems: 'center',
                                                                    padding: '2px'
                                                                }}
                                                                title="Remove"
                                                            >
                                                                <FiTrash size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0, textAlign: 'center', padding: '20px' }}>No admin numbers added yet.</p>
                                            )}
                                        </div>
                                        <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '8px' }}>
                                            These numbers will receive notifications when a maintenance request is submitted.
                                        </small>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Templates */}
                            <div>
                                <div style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                                    <h4 style={{ fontSize: '15px', marginBottom: '16px', marginTop: 0 }}>Message Templates</h4>

                                    {/* Placeholders Info Compact */}
                                    <div style={{ marginBottom: '20px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '12px', border: '1px solid var(--border-color)' }}>
                                        <strong style={{ display: 'block', marginBottom: '8px', fontSize: '13px' }}>Available Placeholders:</strong>
                                        <p style={{ margin: '0 0 12px 0', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                                            These variables will be replaced with actual data when sending the message.
                                        </p>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', alignItems: 'baseline' }}>
                                            <code style={{ color: 'var(--primary-color)', background: 'transparent', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>{'{asset_tag}'}</code>
                                            <span>The unique tag of the asset (e.g., A-001)</span>

                                            <code style={{ color: 'var(--primary-color)', background: 'transparent', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>{'{asset_name}'}</code>
                                            <span>The name/model of the asset (e.g., Dell Laptop)</span>

                                            <code style={{ color: 'var(--primary-color)', background: 'transparent', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>{'{issue_description}'}</code>
                                            <span>The problem reported by the user</span>

                                            <code style={{ color: 'var(--primary-color)', background: 'transparent', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>{'{ticket_number}'}</code>
                                            <span>The generated ticket ID (e.g., MT-202401-001)</span>

                                            <code style={{ color: 'var(--primary-color)', background: 'transparent', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>{'{requester_name}'}</code>
                                            <span>Name of the person requesting maintenance</span>

                                            <code style={{ color: 'var(--primary-color)', background: 'transparent', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>{'{requester_phone}'}</code>
                                            <span>Phone number of the requester</span>

                                            <code style={{ color: 'var(--primary-color)', background: 'transparent', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>{'{request_date}'}</code>
                                            <span>Date and time of the request</span>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label" style={{ fontSize: '13px', fontWeight: 'bold' }}>To Admins:</label>
                                        <textarea
                                            className="form-input"
                                            value={templateAdmin}
                                            onChange={(e) => setTemplateAdmin(e.target.value)}
                                            rows="5"
                                            placeholder="Message sent to IT Admins..."
                                            style={{ fontSize: '13px', fontFamily: 'inherit', lineHeight: '1.5' }}
                                        />
                                    </div>

                                    <div className="form-group" style={{ marginTop: '16px' }}>
                                        <label className="form-label" style={{ fontSize: '13px', fontWeight: 'bold' }}>To Requester:</label>
                                        <textarea
                                            className="form-input"
                                            value={templateUser}
                                            onChange={(e) => setTemplateUser(e.target.value)}
                                            rows="5"
                                            placeholder="Message sent to Requester..."
                                            style={{ fontSize: '13px', fontFamily: 'inherit', lineHeight: '1.5' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons & Test Section */}
                        <div style={{ marginTop: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', gap: '10px' }}>
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
                                        className="btn btn-outline"
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
                            </div>

                            <div style={{ padding: '20px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <h4 style={{ fontSize: '14px', marginBottom: '15px' }}>Send Test Message</h4>
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                    <div style={{ flex: '1', minWidth: '200px' }}>
                                        <label className="form-label" style={{ fontSize: '12px' }}>Test Phone Number</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={testPhone}
                                            onChange={(e) => setTestPhone(e.target.value)}
                                            placeholder="e.g. 6281234567890"
                                            style={{ fontSize: '13px' }}
                                        />
                                    </div>
                                    <div style={{ flex: '2', minWidth: '300px' }}>
                                        <label className="form-label" style={{ fontSize: '12px' }}>Test Message Content</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={testMessage}
                                            onChange={(e) => setTestMessage(e.target.value)}
                                            placeholder="Test message..."
                                            style={{ fontSize: '13px' }}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        style={{ height: '38px' }}
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
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Telegram Configuration Tab */}
                {activeTab === 'telegram' && (
                    <div className="fade-in">
                        {/* API Credentials Section */}
                        <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)' }}>
                            <h3 style={{ fontSize: '16px', marginTop: 0, marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>API Configuration</h3>
                            <div className="form-group">
                                <label className="form-label">Telegram Bot Token</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={telegramBotToken}
                                    onChange={(e) => setTelegramBotToken(e.target.value)}
                                    placeholder="e.g. 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                                />
                                <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                                    Obtain this token from @BotFather on Telegram.
                                </small>
                            </div>
                        </div>

                        {/* Notification Toggles */}
                        <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)' }}>
                            <h3 style={{ fontSize: '16px', marginTop: 0, marginBottom: '15px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Notification Control</h3>
                            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                                    <input
                                        type="checkbox"
                                        checked={enableTelegramAdmin}
                                        onChange={(e) => setEnableTelegramAdmin(e.target.checked)}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                    />
                                    <span style={{ fontSize: '14px', fontWeight: '500' }}>Enable Admin Notifications</span>
                                </label>
                            </div>
                            <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '10px' }}>
                                Enable to send Telegram messages to registered Chat IDs.
                            </small>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
                            {/* Left Column: Admin Chat IDs */}
                            <div>
                                <div style={{ height: '100%', padding: '20px', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
                                    <h4 style={{ fontSize: '15px', marginBottom: '16px', marginTop: 0 }}>IT Admin Chat IDs</h4>

                                    <div style={{ flex: 1, marginBottom: '20px' }}>
                                        {/* Add New Chat ID Controls */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                                            {/* Add Manually */}
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                                <div style={{ flex: '1 1 200px' }}>
                                                    <label className="form-label" style={{ fontSize: '13px' }}>Add Chat ID</label>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        value={manualChatId}
                                                        onChange={(e) => setManualChatId(e.target.value)}
                                                        placeholder="e.g. 123456789 or -100..."
                                                        style={{ fontSize: '14px' }}
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary btn-sm"
                                                    disabled={!manualChatId}
                                                    onClick={() => {
                                                        if (manualChatId) {
                                                            if (!telegramChatIds.includes(manualChatId)) {
                                                                setTelegramChatIds([...telegramChatIds, manualChatId]);
                                                                setManualChatId('');
                                                            } else {
                                                                showToast('Chat ID already exists in list', 'error');
                                                            }
                                                        }
                                                    }}
                                                    style={{ marginBottom: '2px', height: '38px', whiteSpace: 'nowrap' }}
                                                >
                                                    <FiPlus /> Add
                                                </button>
                                            </div>
                                        </div>

                                        <label className="form-label" style={{ fontSize: '13px' }}>Registered Chat IDs:</label>
                                        <div style={{
                                            background: 'var(--bg-secondary)',
                                            borderRadius: '6px',
                                            padding: '10px',
                                            minHeight: '100px',
                                            maxHeight: '200px',
                                            overflowY: 'auto',
                                            border: '1px solid var(--border-color)'
                                        }}>
                                            {telegramChatIds.length > 0 ? (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                    {telegramChatIds.map((chatId, index) => (
                                                        <div key={index} style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            background: '#fff',
                                                            padding: '6px 12px',
                                                            borderRadius: '20px',
                                                            border: '1px solid var(--border-color)',
                                                            fontSize: '13px',
                                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                                        }}>
                                                            <span style={{ fontWeight: '500' }}>{chatId}</span>
                                                            <button
                                                                onClick={() => {
                                                                    const newIds = telegramChatIds.filter((_, i) => i !== index);
                                                                    setTelegramChatIds(newIds);
                                                                }}
                                                                style={{
                                                                    background: 'none',
                                                                    border: 'none',
                                                                    color: 'var(--error-color)',
                                                                    marginLeft: '8px',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    padding: '2px'
                                                                }}
                                                                title="Remove"
                                                            >
                                                                <FiTrash size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0, textAlign: 'center', padding: '20px' }}>No Chat IDs added yet.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Template */}
                            <div>
                                <div style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                                    <h4 style={{ fontSize: '15px', marginBottom: '16px', marginTop: 0 }}>Message Template</h4>

                                    {/* Placeholders Info Compact (Same as WA) */}
                                    {/* Placeholders Info Compact */}
                                    <div style={{ marginBottom: '20px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '12px', border: '1px solid var(--border-color)' }}>
                                        <strong style={{ display: 'block', marginBottom: '8px', fontSize: '13px' }}>Available Placeholders:</strong>
                                        <p style={{ margin: '0 0 12px 0', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                                            These variables will be replaced with actual data when sending the message.
                                        </p>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', alignItems: 'baseline' }}>
                                            <code style={{ color: 'var(--primary-color)', background: 'transparent', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>{'{asset_tag}'}</code>
                                            <span>The unique tag of the asset (e.g., A-001)</span>

                                            <code style={{ color: 'var(--primary-color)', background: 'transparent', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>{'{asset_name}'}</code>
                                            <span>The name/model of the asset (e.g., Dell Laptop)</span>

                                            <code style={{ color: 'var(--primary-color)', background: 'transparent', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>{'{issue_description}'}</code>
                                            <span>The problem reported by the user</span>

                                            <code style={{ color: 'var(--primary-color)', background: 'transparent', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>{'{ticket_number}'}</code>
                                            <span>The generated ticket ID (e.g., MT-202401-001)</span>

                                            <code style={{ color: 'var(--primary-color)', background: 'transparent', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>{'{requester_name}'}</code>
                                            <span>Name of the person requesting maintenance</span>

                                            <code style={{ color: 'var(--primary-color)', background: 'transparent', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>{'{requester_phone}'}</code>
                                            <span>Phone number of the requester</span>

                                            <code style={{ color: 'var(--primary-color)', background: 'transparent', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>{'{request_date}'}</code>
                                            <span>Date and time of the request</span>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label" style={{ fontSize: '13px', fontWeight: 'bold' }}>To Admins:</label>
                                        <textarea
                                            className="form-input"
                                            value={templateTelegramAdmin}
                                            onChange={(e) => setTemplateTelegramAdmin(e.target.value)}
                                            rows="5"
                                            placeholder="Message sent to IT Admins..."
                                            style={{ fontSize: '13px', fontFamily: 'inherit', lineHeight: '1.5' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons & Test */}
                        <div style={{ marginTop: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        disabled={loading}
                                        onClick={handleTelegramSave}
                                    >
                                        <FiSave style={{ marginRight: '8px' }} />
                                        Save Telegram Settings
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={async (e) => {
                                            if (!telegramBotToken) {
                                                showToast('Please enter Bot Token', 'error');
                                                return;
                                            }
                                            const btn = e.currentTarget;
                                            const originalText = btn.innerText;
                                            btn.innerText = 'Testing...';
                                            btn.disabled = true;
                                            try {
                                                await axios.post('/sysadmin/settings/test-telegram', {
                                                    telegram_bot_token: telegramBotToken
                                                });
                                                showToast('Bot connection successful (getMe)!', 'success');
                                            } catch (err) {
                                                showToast(err.response?.data?.message || 'Connection failed', 'error');
                                            } finally {
                                                btn.innerText = originalText;
                                                btn.disabled = false;
                                            }
                                        }}
                                    >
                                        Test Bot Token
                                    </button>
                                </div>
                            </div>

                            <div style={{ padding: '20px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <h4 style={{ fontSize: '14px', marginBottom: '15px' }}>Send Test Message</h4>
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                    <div style={{ flex: '1', minWidth: '200px' }}>
                                        <label className="form-label" style={{ fontSize: '12px' }}>Test Chat ID</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={testChatId}
                                            onChange={(e) => setTestChatId(e.target.value)}
                                            placeholder="e.g. 123456789"
                                            style={{ fontSize: '13px' }}
                                        />
                                    </div>
                                    <div style={{ flex: '2', minWidth: '300px' }}>
                                        <label className="form-label" style={{ fontSize: '12px' }}>Test Message Content</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={testMessage}
                                            onChange={(e) => setTestMessage(e.target.value)}
                                            placeholder="Test message..."
                                            style={{ fontSize: '13px' }}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        style={{ height: '38px' }}
                                        onClick={async (e) => {
                                            if (!telegramBotToken || !testChatId || !testMessage) {
                                                showToast('Bot Token, Chat ID and Message required', 'error');
                                                return;
                                            }
                                            const btn = e.currentTarget;
                                            const originalText = btn.innerText;
                                            btn.innerText = 'Sending...';
                                            btn.disabled = true;
                                            try {
                                                await axios.post('/sysadmin/settings/send-test-telegram', {
                                                    telegram_bot_token: telegramBotToken,
                                                    test_chat_id: testChatId,
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
                                        Send
                                    </button>
                                </div>
                            </div>
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
