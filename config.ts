
// ============================================================================
// APP CONFIGURATION
// ============================================================================
// Your Pandit-Glen production configuration

export const APP_VERSION = '4.6.3';

export const APP_CONFIG = {
    // 1. The Webhook URL from your n8n "Webhook" node
    MASTER_WEBHOOK_URL: "http://213.35.119.68:5678/webhook/PANDIT-GLEN-SERVICE-25-12-30",

    // 2. The URL of your Master Google Sheet
    GOOGLE_SHEET_URL: "https://docs.google.com/spreadsheets/d/1q2aghHvmjxuE8sSRIz8ikkmsFz1hg3VS2_Aqgx-RlEE/edit?gid=0#gid=0",

    // 3. Branding Configuration (White Labeling)
    BRANDING: {
        appNamePrefix: "Pandit",
        appNameSuffix: "Glen Service",
        logoColor: "#007aff", // glen-blue
        companyName: "Pandit Glen Service",
        tagline: "Your Trusted Appliance Experts",
        defaultProductMake: "Glen"
    },

    // 4. Default Credentials
    DEFAULT_CREDENTIALS: {
        admin: { username: "admin", password: "Pglen@2025" },
        developer: { username: "dev", password: "GlenMaster@888" }
    }
};
