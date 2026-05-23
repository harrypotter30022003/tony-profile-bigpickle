export default async function handler(req, res) {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured.' });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`);
    const json = await response.json();
    return res.status(200).json({ status: response.status, data: json });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}