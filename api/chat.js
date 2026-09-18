import crypto from 'crypto';
import { kv } from '@vercel/kv';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const CRON_SECRET = process.env.CRON_SECRET || '';

const SESSION_SECRET = process.env.ADMIN_PASSWORD || (() => { try { return crypto.randomBytes(32).toString('hex'); } catch { return null; } })();
if (!SESSION_SECRET) throw new Error('Server misconfigured: ADMIN_PASSWORD is not set.');
const RATE_LIMIT_WINDOW = 60;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_DAILY_MAX = 20;

const SYSTEM_PROMPT = `You are Tony Do (Do Minh Tuan) — a Senior Project Manager & Tech Leader with 15+ years experience based in Vietnam. You are helping a visitor to your personal website me.tony.do.

Your personality:
- Direct, honest, no fluff. You share real experiences, not textbook answers.
- You're passionate about building great software teams in Vietnam.
- You speak from 15 years of hands-on experience: managing teams, shipping products, running companies.
- You're warm but professional — you talk to visitors like a colleague at a coffee shop.
- Keep answers concise (2-4 paragraphs max unless they ask for detail).

Topics you can discuss:
- Project management, team leadership, hiring in Vietnam's tech market
- Web/mobile development (PHP, React, iOS, WordPress)
- AI tools in project management
- Cloud infrastructure (AWS, Vercel, serverless)
- Personal branding for developers
- Your experience at Finantaged, CoffeeMug, StratAgile
- Your education at University of Wollongong

Your website features you can mention:
- Blog with articles on tech management, AI tools, web performance
- Portfolio showing projects like Clue-Box, Post-a-Card, EZ Fast Tech
- Newsletter for weekly insights
- Comments and reactions on blog posts

If asked about contacting you: direct them to the contact section on the site or email tonydo.pm@gmail.com.
If asked about something you don't know: say so honestly rather than making it up.
Detect the user's language and always respond in the same language.`;

function haship(ip) {
  return crypto.createHash('sha256').update(ip + SESSION_SECRET).digest('hex').slice(0, 16);
}

function signToken(data) {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return payload + '.' + sig;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  if (sig.length !== expected.length) return null;
  let match = false;
  try {
    match = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch { return null; }
  if (!match) return null;
  try {
    return JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
  } catch { return null; }
}

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.socket?.remoteAddress
    || '0.0.0.0';
}

function makeid(n) {
  return crypto.randomBytes(n).toString('hex');
}

const captchaMemory = new Map();

async function genMathChallenge() {
  const a = Math.floor(Math.random() * 10) + 3;
  const b = Math.floor(Math.random() * 10) + 3;
  const id = makeid(8);
  const answer = String(a + b);
  try {
    if (process.env.VERCEL && process.env.KV_REST_API_URL) {
      await kv.set(`captcha:${id}`, answer, { ex: 300 });
    } else {
      captchaMemory.set(id, { answer, exp: Date.now() + 300000 });
      if (captchaMemory.size > 500) {
        const oldest = captchaMemory.keys().next().value;
        captchaMemory.delete(oldest);
      }
    }
  } catch { /* store failed; verification will issue a fresh challenge */ }
  return { question: `What is ${a} + ${b}?`, id };
}

async function takeCaptchaAnswer(id) {
  try {
    if (process.env.VERCEL && process.env.KV_REST_API_URL) {
      const stored = await kv.get(`captcha:${id}`);
      if (stored != null) {
        try { await kv.del(`captcha:${id}`); } catch { /* ignore */ }
        return String(stored);
      }
      return null;
    }
  } catch { /* fall through to memory */ }
  const entry = captchaMemory.get(id);
  if (entry) captchaMemory.delete(id);
  if (!entry || Date.now() > entry.exp) return null;
  return entry.answer;
}

async function checkRateLimit(ip) {
  const key = `ratelimit:chat:${haship(ip)}`;
  const dailyKey = `ratelimit:chat:daily:${haship(ip)}`;
  const now = Date.now();

  let windowRaw = null;
  let dailyRaw = null;
  try {
    [windowRaw, dailyRaw] = await Promise.all([
      kv.get(key),
      kv.get(dailyKey),
    ]);
  } catch {
    return { blocked: false };
  }

  const window = windowRaw ? JSON.parse(windowRaw) : [];
  const daily = dailyRaw ? JSON.parse(dailyRaw) : [];

  const recent = window.filter(t => now - t < RATE_LIMIT_WINDOW * 1000);
  const today = daily.filter(t => now - t < 86400000);

  if (recent.length >= RATE_LIMIT_MAX) return { blocked: true, reason: 'Too many requests. Please wait a moment.' };
  if (today.length >= RATE_LIMIT_DAILY_MAX) return { blocked: true, reason: 'Daily message limit reached. Try again tomorrow.' };

  recent.push(now);
  today.push(now);
  await Promise.all([
    kv.set(key, JSON.stringify(recent), { ex: RATE_LIMIT_WINDOW }),
    kv.set(dailyKey, JSON.stringify(today), { ex: 86400 }),
  ]);

  return { blocked: false };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Access-Control-Allow-Origin', 'https://me.tony.do');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Session-Token');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = getClientIP(req);
  const { message, sessionToken, ...honeypot } = req.body;

  if (honeypot.website_url || honeypot.website) {
    return res.json({ reply: 'Thanks for your message! I\'ll get back to you soon.', entry: null });
  }

  const auth = verifyToken(sessionToken);

  if (!auth) {
    const { name, email, captchaAnswer, captchaId, t } = req.body;

    if (!name || !email) {
      return res.json({ entry: true, challenge: await genMathChallenge() });
    }

    if (typeof name !== 'string' || typeof email !== 'string' || name.length > 100 || email.length > 200) {
      return res.status(400).json({ error: 'Invalid input.' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.json({ entry: true, error: 'Please enter a valid email address.', challenge: await genMathChallenge() });
    }

    if (captchaId && captchaAnswer) {
      const stored = await takeCaptchaAnswer(captchaId);
      if (!stored || stored !== captchaAnswer.trim().toLowerCase()) {
        return res.json({ entry: true, error: 'Incorrect answer. Try again.', challenge: await genMathChallenge() });
      }
    } else {
      return res.json({ entry: true, challenge: await genMathChallenge() });
    }

    if (t && Date.now() - Number(t) < 3000) {
      return res.json({ entry: true, error: 'Please wait a moment before submitting.', challenge: await genMathChallenge() });
    }

    const rl = await checkRateLimit(ip);
    if (rl.blocked) return res.json({ entry: true, error: rl.reason });

    const newToken = signToken({ name, email, ip: haship(ip), ts: Date.now() });
    return res.json({ entry: false, sessionToken: newToken, name });
  }

  if (!message || typeof message !== 'string' || message.length > 2000) {
    return res.status(400).json({ error: 'Message too long or empty.' });
  }

  const rl = await checkRateLimit(ip);
  if (rl.blocked) return res.json({ reply: rl.reason });

  if (!GEMINI_API_KEY) {
    return res.json({ reply: 'Sorry, the chat service is not configured yet. Please check back later.' });
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            {
              role: 'user',
              parts: [{ text: `[Visitor: ${auth.name}, ${auth.email}]\n\n${message}` }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
            topK: 40,
            topP: 0.95,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API error:', geminiRes.status, errText);
      return res.json({ reply: 'Sorry, I hit a technical issue. Please try again in a moment.' });
    }

    const geminiData = await geminiRes.json();
    const reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '...';

    return res.json({ reply, sessionToken });
  } catch (err) {
    console.error('Chat error:', err);
    return res.json({ reply: 'Sorry, something went wrong. Please try again.' });
  }
}
