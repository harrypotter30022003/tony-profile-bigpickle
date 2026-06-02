// Reactions — lightweight like / insightful / inspired buttons
// No signup required. Tracks dedup per user via localStorage.
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'tony-portfolio-reactions';

function getUserReactions(slug) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return all[slug] || [];
  } catch {
    return [];
  }
}

function setUserReaction(slug, type) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (!all[slug]) all[slug] = [];
    if (!all[slug].includes(type)) all[slug].push(type);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // localStorage unavailable (private mode, quota, etc.) — silently skip dedup
  }
}

const REACTIONS = [
  { type: 'like', emoji: '👍', label: 'Helpful' },
  { type: 'insightful', emoji: '💡', label: 'Insightful' },
  { type: 'inspired', emoji: '🚀', label: 'Inspired' }
];

export default function Reactions({ slug }) {
  const [counts, setCounts] = useState({ like: 0, insightful: 0, inspired: 0 });
  const [myReactions, setMyReactions] = useState([]);

  useEffect(() => {
    if (!slug) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is client-only and must be read after mount to avoid hydration mismatch
    setMyReactions(getUserReactions(slug));

    let cancelled = false;
    fetch(`/api/reactions?slug=${encodeURIComponent(slug)}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data.reactions) setCounts(data.reactions);
      })
      .catch(() => { /* ignore */ });
    return () => { cancelled = true; };
  }, [slug]);

  const handleReact = async (type) => {
    if (myReactions.includes(type)) return; // Already reacted

    // Optimistic update
    const newCounts = { ...counts, [type]: counts[type] + 1 };
    setCounts(newCounts);
    setUserReaction(slug, type);
    setMyReactions([...myReactions, type]);

    // Track conversion
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'article_reaction', {
        event_category: 'engagement',
        event_label: `${slug}_${type}`,
        value: 1
      });
    }

    try {
      const resp = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, type })
      });
      const data = await resp.json();
      if (data.reactions) setCounts(data.reactions);
    } catch {
      // Roll back optimistic update on failure
      setCounts(counts);
      setMyReactions(myReactions.filter(r => r !== type));
    }
  };

  return (
    <div className="article-reactions" style={{
      marginTop: '2.5rem',
      padding: '1.5rem',
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      flexWrap: 'wrap'
    }}>
      <span style={{
        fontSize: '0.9rem',
        color: 'var(--text-muted, #888)',
        fontWeight: 500
      }}>
        Was this useful?
      </span>
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        {REACTIONS.map(({ type, emoji, label }) => {
          const hasReacted = myReactions.includes(type);
          return (
            <button
              key={type}
              onClick={() => handleReact(type)}
              disabled={hasReacted}
              aria-label={label}
              title={label}
              style={{
                padding: '0.5rem 1rem',
                background: hasReacted
                  ? 'rgba(0, 245, 212, 0.15)'
                  : 'rgba(255, 255, 255, 0.04)',
                color: hasReacted
                  ? 'var(--accent, #00f5d4)'
                  : 'var(--text-primary, #fff)',
                border: hasReacted
                  ? '1px solid var(--accent, #00f5d4)'
                  : '1px solid var(--border-color, rgba(255,255,255,0.1))',
                borderRadius: '50px',
                fontSize: '0.9rem',
                cursor: hasReacted ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s',
                fontWeight: 500
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{emoji}</span>
              <span>{label}</span>
              <span style={{ opacity: 0.7, fontSize: '0.85rem' }}>({counts[type] || 0})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
