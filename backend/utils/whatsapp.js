const axios = require('axios');
const db = require('../config/database');

/**
 * Send WhatsApp message using the configured API
 * @param {string} to - Phone number (e.g., "62812345678")
 * @param {string} message - Message content
 */
async function sendWhatsAppMessage(to, message) {
    try {
        // Get generic configuration from sysadmin_settings
        const [settings] = await db.query("SELECT * FROM sysadmin_settings");

        let config = {};
        settings.forEach(row => {
            config[row.setting_key] = row.setting_value;
        });

        const apiUrl = config.whatsapp_api_url;
        const apiToken = config.whatsapp_api_token;
        // secret key might be needed depending on the vendor, usually passed in headers or body
        // const secretKey = config.whatsapp_secret_key; 

        if (!apiUrl || !apiToken) {
            console.warn('WhatsApp API URL or Token not configured.');
            return { success: false, error: 'Configuration missing' };
        }

        // Adjust this payload structure based on the specific WhatsApp Gateway Vendor being used
        // Assuming a generic structure often used by unofficial/3rd party gateways like Fonnte, Watsap.id, etc.
        // If using Official WhatsApp Cloud API, the payload is different.
        // Based on "target" context often used in ID gateways:
        const payload = {
            target: to,
            message: message,
            countryCode: '62' // Default to Indonesia if needed
        };

        const headers = {
            'Authorization': apiToken,
            // 'Content-Type': 'application/json' // axios sets this automatically for objects
        };

        const response = await axios.post(apiUrl, payload, { headers });

        console.log(`WhatsApp sent to ${to}:`, response.data);
        return { success: true, response: response.data };

    } catch (error) {
        console.error('Error sending WhatsApp message:', error.response?.data || error.message);
        return { success: false, error: error.message };
    }
}

module.exports = { sendWhatsAppMessage };
