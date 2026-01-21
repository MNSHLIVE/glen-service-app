// Configuration
const N8N_BASE_URL = 'https://n8n.builderallindia.com';
const WEBHOOK_SUBMIT_PATH = '/webhook/PANDIT-GLEN-SERVICE-25-12-30';
const WEBHOOK_READ_PATH = '/webhook/glen-read-data';

export default async function handler(
  req: any,
  res: any
) {
  try {
    const { action } = req.query;

    // Route to appropriate handler
    if (action === 'read') {
      return await handleRead(req, res);
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

// Handle data reading from Google Sheets (NEW)
async function handleRead(req: any, res: any) {
  try {
    const readUrl = `${N8N_BASE_URL}${WEBHOOK_READ_PATH}`;
    console.log('Reading from webhook:', readUrl);
    
    const response = await fetch(readUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    
    // Return the data with CORS headers for multi-user access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store'); // No caching for live data
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error reading data:', error);
    res.status(500).json({
      success: false,
      message: "Failed to read data from n8n",
      error: error
    });
  }
}
