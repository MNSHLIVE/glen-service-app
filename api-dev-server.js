// Local development server for API routes
// Run this alongside Vite to handle /api/* requests locally

const http = require('http');
const url = require('url');

// Configuration
const N8N_BASE_URL = 'https://n8n.builderallindia.com';
const WEBHOOK_SUBMIT_PATH = '/webhook/PANDIT-GLEN-SERVICE-25-12-30';

// Separate read webhooks for each sheet
const WEBHOOK_READ_COMPLAINT = '/webhook/read-complaint';
const WEBHOOK_READ_TECHNICIAN = '/webhook/read-technician';
const WEBHOOK_READ_ATTENDANCE = '/webhook/read-attendance';
const WEBHOOK_READ_JOB_COMPLETED = '/webhook/read-job-completed';

async function handleWebhook(body) {
  try {
    const webhookUrl = `${N8N_BASE_URL}${WEBHOOK_SUBMIT_PATH}`;
    console.log('📤 Submitting to webhook:', webhookUrl);
    
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.text();
    console.log('✅ Webhook response:', data.substring(0, 100));
    return { status: response.status, data };
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return { status: 500, data: { success: false, message: "Webhook failed", error: error.message } };
  }
}

async function handleRead(readPath) {
  try {
    const readUrl = `${N8N_BASE_URL}${readPath}`;
    console.log('📥 Reading from webhook:', readUrl);
    
    const response = await fetch(readUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    console.log('✅ Read response:', JSON.stringify(data).substring(0, 100));
    return { status: response.status, data };
  } catch (error) {
    console.error('❌ Read error:', error);
    return { status: 500, data: { success: false, message: "Failed to read data from n8n", error: error.message } };
  }
}

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url.startsWith('/api/n8n-proxy')) {
    try {
      // Parse query params
      const parsedUrl = url.parse(req.url, true);
      const query = parsedUrl.query;
      const action = query.action || null;

      // Collect body
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          let result;
          
          if (action === 'read-complaint') {
            result = await handleRead(WEBHOOK_READ_COMPLAINT);
          } else if (action === 'read-technician') {
            result = await handleRead(WEBHOOK_READ_TECHNICIAN);
          } else if (action === 'read-attendance') {
            result = await handleRead(WEBHOOK_READ_ATTENDANCE);
          } else if (action === 'read-job-completed') {
            result = await handleRead(WEBHOOK_READ_JOB_COMPLETED);
          } else if (action === 'read') {
            result = await handleRead(WEBHOOK_READ_COMPLAINT);
          } else {
            // Default: POST to webhook
            const payload = body ? JSON.parse(body) : {};
            result = await handleWebhook(payload);
          }

          res.writeHead(result.status);
          res.end(JSON.stringify(result.data));
        } catch (error) {
          console.error('Error:', error);
          res.writeHead(500);
          res.end(JSON.stringify({ success: false, message: "Internal error", error: error.message }));
        }
      });
    } catch (error) {
      console.error('API error:', error);
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`\n✅ API Dev Server running on http://localhost:${PORT}`);
  console.log(`   Vite runs on http://localhost:3000`);
  console.log(`   All /api requests are proxied to http://localhost:${PORT}\n`);
});

