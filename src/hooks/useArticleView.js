import { useEffect, useState } from 'react';

// Stable per-session id (resets when browser storage is cleared)
function getSessionId() {
  if (typeof window === 'undefined') return null;
  let sid = sessionStorage.getItem('tony-session-id');
  if (!sid) {
    sid = `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem('tony-session-id', sid);
  }
  return sid;
}

/**
 * Track a single article view.
 * Increments server counter on mount, dedup'd per session (30 min).
 * Returns the live count.
 */
export function useArticleView(slug) {
  const [count, setCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const sid = getSessionId();

    // Fetch current count
    fetch(`/api/views?slug=${encodeURIComponent(slug)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (!cancelled && d) { setCount(d.count || 0); setLoaded(true); } })
      .catch(() => setLoaded(true));

    // Increment count (with dedup)
    fetch(`/api/view?slug=${encodeURIComponent(slug)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sid }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!cancelled && d) {
          setCount(d.count || 0);
          setLoaded(true);
        }
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [slug]);

  return { count, loaded };
}

/**
 * Get view counts for many slugs (for blog feed cards).
 */
export function useViewCounts(slugs) {
  const [counts, setCounts] = useState({});
  const slugsKey = Array.isArray(slugs) ? slugs.join('|') : '';

  useEffect(() => {
    if (!slugsKey) return;
    let cancelled = false;
    fetch('/api/views')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (!cancelled && d && d.counts) setCounts(d.counts); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [slugsKey]);

  return counts;
}

/**
 * Format count for display: 1234 -> "1.2k", 999 -> "999", 1 -> "1 view"
 */
export function formatViewCount(n) {
  if (n == null) return '';
  if (n < 1000) return `${n}`;
  if (n < 10000) return `${(n / 1000).toFixed(1)}k`;
  return `${Math.floor(n / 1000)}k`;
}

/**
 * Fire a GA4 view event for the blog article (analytics tracking, separate from KV counter).
 */
export function trackBlogViewGA4(slug, title) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  try {
    window.gtag('event', 'blog_view', {
      article_slug: slug,
      article_title: title,
      page_path: window.location.hash,
      page_location: window.location.href,
    });
  } catch { /* ignore */ }
}
