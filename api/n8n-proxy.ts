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
    const response = await fetch(
      "https://n8n.builderallindia.com/webhook/PANDIT-GLEN-SERVICE-25-12-30",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      }
    );

    const data = await response.text();
    res.status(response.status).send(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Vercel proxy failed",
    });
  }
}

// Handle data reading from Google Sheets (NEW)
async function handleRead(req: any, res: any) {
  try {
    const response = await fetch(
      "https://n8n.builderallindia.com/webhook/glen-read-data",
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    const data = await response.json();
    
    // Return the data with CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json');
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error reading data:', error);
    res.status(500).json({
      success: false,
      message: "Failed to read data",
      error: error
    });
  }
}
