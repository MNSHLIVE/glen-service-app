export const config = {
    runtime: 'edge',
};

export default async function handler(req: Request) {
    const n8nUrl = process.env.VITE_N8N_WEBHOOK_URL;

    if (!n8nUrl) {
        return new Response(JSON.stringify({ error: 'N8N Webhook URL not configured' }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
        });
    }

    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });
    }

    try {
        const body = req.method === 'POST' ? await req.json() : null;
        const url = new URL(req.url);
        const searchParams = url.searchParams;

        // Build the final target URL (keeping query params if any)
        const targetUrl = new URL(n8nUrl);
        searchParams.forEach((value, key) => {
            targetUrl.searchParams.set(key, value);
        });

        const response = await fetch(targetUrl.toString(), {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        const data = await response.text();
        let jsonResult;
        try {
            jsonResult = JSON.parse(data);
        } catch (e) {
            jsonResult = { message: data };
        }

        return new Response(JSON.stringify(jsonResult), {
            status: response.status,
            headers: {
                'content-type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
        });
    }
}
