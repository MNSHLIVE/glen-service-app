// Configuration
const N8N_BASE_URL = 'https://n8n.builderallindia.com';
const WEBHOOK_SUBMIT_PATH = '/webhook/PANDIT-GLEN-SERVICE-25-12-30';

// Separate read webhooks for each sheet
const WEBHOOK_READ_COMPLAINT = '/webhook/read-complaint';
const WEBHOOK_READ_TECHNICIAN = '/webhook/read-technician';
const WEBHOOK_READ_ATTENDANCE = '/webhook/read-attendance';
const WEBHOOK_READ_JOB_COMPLETED = '/webhook/read-job-completed';

export default async function handler(
  req: any,
  res: any
) {
  try {
    const { action } = req.query;

    // Route to appropriate handler
    if (action === 'read-complaint') {
      return await handleRead(req, res, WEBHOOK_READ_COMPLAINT);
    } else if (action === 'read-technician') {
      return await handleRead(req, res, WEBHOOK_READ_TECHNICIAN);
    } else if (action === 'read-attendance') {
      return await handleRead(req, res, WEBHOOK_READ_ATTENDANCE);
    } else if (action === 'read-job-completed') {
      return await handleRead(req, res, WEBHOOK_READ_JOB_COMPLETED);
    } else if (action === 'read') {
      // Default read - use complaint sheet
      return await handleRead(req, res, WEBHOOK_READ_COMPLAINT);
    } else {
      return await handleWebhook(req, res);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Vercel proxy failed",
    });
  }
}

// Handle webhook submissions (existing functionality)
async function handleWebhook(req: any, res: any) {
  try {
    const webhookUrl = `${N8N_BASE_URL}${WEBHOOK_SUBMIT_PATH}`;
    console.log('Submitting to webhook:', webhookUrl);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await response.text();
    res.status(response.status).send(data);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: "Vercel proxy failed",
      error: error
    });
  }
}

// Handle data reading from Google Sheets (supports multiple sheets)
async function handleRead(req: any, res: any, readPath: string) {
  try {
    const readUrl = `${N8N_BASE_URL}${readPath}`;
    console.log('Reading from webhook:', readUrl);

    const response = await fetch(readUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    // Handle non-200 responses
    if (!response.ok) {
      console.warn(`n8n returned status ${response.status}`);
      // Return empty array instead of failing
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json([]);
    }

    // Safe JSON parsing
    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : [];
    } catch (parseError) {
      console.warn('Failed to parse n8n response, returning empty array:', parseError);
      data = [];
    }

    // Ensure data is an array
    if (!Array.isArray(data)) {
      console.warn('n8n returned non-array data, wrapping or converting to empty array');
      data = [];
    }

    // Return the data with CORS headers for multi-user access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store'); // No caching for live data

    res.status(200).json(data);
  } catch (error) {
    console.error('Error reading data:', error);
    // Return empty array instead of 500 to prevent UI crash
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json([]);
  }
}
