// Native comments system for blog articles.
// Storage: Vercel KV with key `comments:<slug>` -> array of comment objects
// Anti-spam: rate limit (1 per minute per IP), honeypot field, content filter
// Moderation: status = 'pending' | 'approved' | 'spam'

import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

const LOCAL_FILE = path.join(process.cwd(), 'src/admin/comments.json');

// In-memory rate limit (per-instance; for production should use KV or edge config)
const rateLimit = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 1; // 1 comment per minute per IP

// Spam words/phrases (very simple, can be expanded)
const SPAM_PATTERNS = [
  /\b(viagra|cialis|casino|crypto|bitcoin|forex|loan)\b/i,
  /\b(buy now|click here|free money|make \$\d+)\b/i,
  /https?:\/\/[^\s]+.*https?:\/\/[^\s]+/i, // multiple URLs
];

// Disposable/temp email domains to block
const DISPOSABLE_EMAIL_DOMAINS = [
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', '10minutemail.com',
  'throwaway.email', 'yopmail.com', 'temp-mail.org', 'fakeinbox.com',
  'maildrop.cc', 'getnada.com', 'sharklasers.com'
];

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  if (email.length > 254) return false;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
  const domain = email.split('@')[1]?.toLowerCase();
  if (DISPOSABLE_EMAIL_DOMAINS.includes(domain)) return false;
  return true;
}

function isSpamContent(content) {
  if (!content || typeof content !== 'string') return true;
  if (content.length < 3 || content.length > 2000) return true;
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(content)) return true;
  }
  // Excessive caps
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (content.length > 20 && capsRatio > 0.6) return true;
  return false;
}

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimit.get(ip);
  if (!record) {
    rateLimit.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }
  if (now > record.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }
  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((record.resetAt - now) / 1000) };
  }
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count };
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'] || req.headers['x-real-ip'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

async function loadComments(slug) {
  if (process.env.VERCEL && process.env.KV_REST_API_URL) {
    try {
      const data = await kv.get(`comments:${slug}`);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('KV load failed:', err);
      return [];
    }
  }
  // Local fallback
  try {
    if (fs.existsSync(LOCAL_FILE)) {
      const all = JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf8'));
      return all[slug] || [];
    }
  } catch (err) {
    console.error('Local load failed:', err);
  }
  return [];
}

async function saveComments(slug, comments) {
  if (process.env.VERCEL && process.env.KV_REST_API_URL) {
    await kv.set(`comments:${slug}`, comments);
    return;
  }
  // Local fallback
  let all = {};
  try {
    if (fs.existsSync(LOCAL_FILE)) {
      all = JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Local read failed:', err);
  }
  all[slug] = comments;
  const dir = path.dirname(LOCAL_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(LOCAL_FILE, JSON.stringify(all, null, 2), 'utf8');
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const { slug } = req.query;
  if (!slug || typeof slug !== 'string' || !/^[a-z0-9-]+$/i.test(slug)) {
    return res.status(400).json({ error: 'Invalid slug' });
  }

  if (req.method === 'GET') {
    // Public: return only approved comments
    const all = await loadComments(slug);
    const approved = all
      .filter(c => c.status === 'approved')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map(c => ({
        id: c.id,
        author: c.author,
        content: c.content,
        createdAt: c.createdAt
        // Don't expose email, IP, status, etc.
      }));
    return res.status(200).json({ comments: approved, count: approved.length });
  }

  if (req.method === 'POST') {
    // Submit new comment
    const ip = getClientIp(req);

    // Rate limit
    const rate = checkRateLimit(ip);
    if (!rate.allowed) {
      res.setHeader('Retry-After', rate.retryAfter);
      return res.status(429).json({
        error: 'Too many comments. Please wait a minute before trying again.',
        retryAfter: rate.retryAfter
      });
    }

    const { author, email, content, honeypot } = req.body || {};

    // Honeypot: if filled, it's a bot
    if (honeypot && honeypot.trim().length > 0) {
      // Silently reject but pretend success
      return res.status(200).json({
        message: 'Comment submitted for review.',
        status: 'pending'
      });
    }

    // Validate
    if (!author || typeof author !== 'string' || author.trim().length < 2 || author.trim().length > 50) {
      return res.status(400).json({ error: 'Name must be 2-50 characters.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address (not disposable).' });
    }
    if (isSpamContent(content)) {
      return res.status(400).json({ error: 'Comment rejected by spam filter. Please rephrase.' });
    }

    // Build comment object
    const comment = {
      id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      slug,
      author: author.trim().slice(0, 50),
      email: email.trim().toLowerCase(),
      content: content.trim().slice(0, 2000),
      createdAt: new Date().toISOString(),
      ip: ip.slice(0, 45), // Truncate for safety; real IPv6 can be long
      userAgent: (req.headers['user-agent'] || '').slice(0, 200),
      status: 'pending', // Always pending — manual moderation
      likes: 0
    };

    // Save
    const all = await loadComments(slug);
    all.push(comment);
    await saveComments(slug, all);

    // Optional: notify admin via SendPulse
    if (process.env.SENDPULSE_API_USER_ID && process.env.SENDPULSE_API_SECRET) {
      try {
        // Lightweight notification
        const { default: sendpulse } = await import('./_sendpulse-notify.js');
        await sendpulse({
          subject: `New comment on /${slug}`,
          text: `From: ${comment.author} (${comment.email})\n\n${comment.content}\n\nApprove: /admin/comments?slug=${slug}`
        });
      } catch (err) {
        // Don't fail the request if notification fails
        console.error('SendPulse notify failed:', err);
      }
    }

    return res.status(201).json({
      message: 'Comment submitted! It will appear after review.',
      status: 'pending',
      id: comment.id
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
