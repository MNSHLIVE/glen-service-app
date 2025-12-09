
// ============================================================================
// APP CONFIGURATION
// ============================================================================
// You can paste your n8n or Make.com URLs here to make them permanent.
// If these are filled, the app will load them automatically.

export const APP_VERSION = '4.6.3';

export const APP_CONFIG = {
    // 1. The Webhook URL from your n8n "Webhook" node (Production URL)
    MASTER_WEBHOOK_URL: "https://n8n.srv1143492.hstgr.cloud/webhook/Pandit-glen-service", 

    // 2. The URL of your Master Google Sheet (containing 'Complaints' and 'Updates' tabs)
    GOOGLE_SHEET_URL: "https://docs.google.com/spreadsheets/d/1q2aghHvmjxuE8sSRIz8ikkmsFz1hg3VS2_Aqgx-RlEE/edit?gid=0#gid=0",

    // 3. (Optional) Hardcoded Technicians List
    TECHNICIANS: [],

    // 4. Branding Configuration (White Labeling)
    BRANDING: {
        appNamePrefix: "Pandit",
        appNameSuffix: "Glen Service",
        logoColor: "#007aff", // Tailwind 'glen-blue'
        companyName: "Pandit Glen Service",
        tagline: "Your Trusted Appliance Experts",
        defaultProductMake: "Glen"
    },

    // 5. Default Credentials
    DEFAULT_CREDENTIALS: {
        admin: { username: "admin", password: "PanditAdmin@2025" },
        developer: { username: "dev", password: "GlenMaster@888" }
    }
};
