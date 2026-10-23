// Vercel serverless endpoint for Vibha Makeover Beauty AI.
// Add GROQ_API_KEY in Vercel Environment Variables. Never put it in public HTML.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Beauty AI is not configured yet. Add GROQ_API_KEY in Vercel Environment Variables.' });
  }

  const message = typeof req.body?.message === 'string'
    ? req.body.message.trim().slice(0, 700)
    : '';

  if (!message) return res.status(400).json({ error: 'Please enter a message.' });

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are the Beauty Concierge for Vibha Makeover, a makeup and hairstyling service in Patna, Bihar, India. Be warm, concise, practical, culturally aware, and respectful. Help users explore bridal, engagement, reception, party makeup, haircuts and styling, hair coloring and highlights, hair extensions, keratin treatments, scalp treatments, hair repair, manicures and pedicures, facials and skin treatments, waxing and threading, and special-occasion services. Tailor suggestions to their event, outfit, preferences, comfort, and budget if they choose to share it. Ask at most one useful follow-up question. Do not invent prices, appointment availability, credentials, product claims, or services not listed. Never diagnose skin or scalp conditions or guarantee a product is safe. For allergies, irritation, or medical skin/scalp concerns, recommend speaking with a qualified clinician and patch testing with a professional. Do not request sensitive personal information. For bookings, tell users to contact Vibha Makeover to confirm prices and availability. You are a text assistant: do not claim to edit a selfie or generate a virtual makeover image. Keep replies under 120 words.`
          },
          { role: 'user', content: message }
        ],
        temperature: 0.65,
        max_tokens: 300,
        stream: false
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      // Avoid logging secrets or full user messages.
      console.error('Groq API error:', response.status, payload?.error?.code || payload?.error?.type || 'unknown');
      if (response.status === 429) {
        return res.status(429).json({ error: 'The Beauty AI is busy right now. Please wait a moment and try again.' });
      }
      return res.status(502).json({ error: 'The AI service could not answer right now. Please try again shortly.' });
    }

    const reply = payload?.choices?.[0]?.message?.content?.trim();
    if (!reply) return res.status(502).json({ error: 'No reply was returned. Please try again.' });
    return res.status(200).json({ reply });
  } catch (error) {
    console.error('Beauty assistant request failed:', error?.message || 'unknown error');
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
