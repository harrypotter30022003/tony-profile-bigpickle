import React, { useState } from 'react';

export default function CookieConsent() {
  const [visible, setVisible] = useState(() => {
    try {
      return !localStorage.getItem('tony-cookie-consent');
    } catch {
      return true;
    }
  });

  if (!visible) return null;

  const choose = (v) => {
    try {
      localStorage.setItem('tony-cookie-consent', v);
    } catch { /* ignore */ }
    setVisible(false);
  };

  return (
    <div role="dialog" aria-live="polite" aria-label="Cookie consent" style={{ position: 'fixed', bottom: '1rem', left: '1rem', right: '1rem', maxWidth: '640px', margin: '0 auto', zIndex: 10000, padding: '1rem 1.25rem', borderRadius: '12px', background: 'rgba(12,12,20,0.96)', border: '1px solid var(--border-color)', color: 'var(--text)', fontSize: '0.9rem', lineHeight: '1.6' }}>
      <div style={{ fontWeight: '700', marginBottom: '0.4rem' }}>We value your privacy</div>
      <div style={{ color: 'var(--text-muted)' }}>
        We use cookies for analytics (GA4, Clarity) and, after approval, Google AdSense ads. See <a href="/privacy-policy" style={{ color: 'var(--accent)' }}>Privacy Policy</a>. You can opt out of personalized ads at policies.google.com/technologies/ads.
      </div>
      <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.8rem', flexWrap: 'wrap' }}>
        <button onClick={() => choose('accepted')} className="btn btn-primary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}>Accept</button>
        <button onClick={() => choose('declined')} className="btn" style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text)' }}>Decline</button>
      </div>
    </div>
  );
}
