export default async function handler(
  req: any,
  res: any
) {
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
