// HeroNewsletter — compact email signup form for above-the-fold placement
// Tracks conversion via GA4. Posts to /api/subscribe.
import { useState } from 'react';

export default function HeroNewsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || status === 'submitting') return;

    setStatus('submitting');
    setMessage('');

    // GA4 tracking
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'newsletter_submit_attempt', {
        event_category: 'engagement',
        event_label: 'homepage_hero'
      });
    }

    try {
      const resp = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await resp.json();

      if (resp.ok) {
        setStatus('success');
        setMessage(data.message || "You're in! Check your inbox.");
        setEmail('');

        // Conversion event
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'newsletter_signup', {
            event_category: 'conversion',
            event_label: 'homepage_hero',
            value: 1
          });
        }
      } else {
        setStatus('error');
        setMessage(data.error || 'Subscription failed. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }

    // Reset status after a few seconds
    setTimeout(() => {
      setStatus('idle');
    }, 5000);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        gap: '0.5rem',
        maxWidth: '480px',
        margin: '1.5rem auto 0',
        padding: '0.4rem',
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '50px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
      }}
    >
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Your email — get weekly tech insights"
        required
        disabled={status === 'submitting'}
        aria-label="Email address"
        style={{
          flex: 1,
          padding: '0.6rem 1.2rem',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: '#fff',
          fontSize: '0.95rem'
        }}
      />
      <button
        type="submit"
        disabled={status === 'submitting'}
        style={{
          padding: '0.6rem 1.4rem',
          background: status === 'success' ? '#00f5d4' : 'var(--accent, #00f5d4)',
          color: '#000',
          border: 'none',
          borderRadius: '50px',
          fontSize: '0.9rem',
          fontWeight: 600,
          cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
          transition: 'transform 0.15s',
          whiteSpace: 'nowrap'
        }}
      >
        {status === 'submitting' ? '...' : status === 'success' ? '✓ Subscribed' : 'Subscribe'}
      </button>

      {message && (
        <div
          role="status"
          style={{
            position: 'absolute',
            marginTop: '4.5rem',
            padding: '0.5rem 1rem',
            background: status === 'success' ? 'rgba(0, 245, 212, 0.15)' : 'rgba(255, 0, 110, 0.15)',
            color: status === 'success' ? '#00f5d4' : '#ff006e',
            fontSize: '0.85rem',
            borderRadius: '6px',
            textAlign: 'center'
          }}
        >
          {message}
        </div>
      )}
    </form>
  );
}
