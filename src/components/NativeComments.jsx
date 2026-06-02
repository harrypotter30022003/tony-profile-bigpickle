// NativeComments — Self-hosted comments as a fallback/redundancy for Cusdis.
// Stores in Vercel KV via /api/comments. Moderated manually.
import { useState, useEffect, useRef } from 'react';

export default function NativeComments({ slug }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' | 'error'
  const [author, setAuthor] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const honeypotRef = useRef(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/comments?slug=${encodeURIComponent(slug)}`)
      .then(r => r.json())
      .then(data => {
        setComments(data.comments || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // Honeypot
    if (honeypotRef.current && honeypotRef.current.value) {
      setMessage('Comment submitted for review.');
      setMessageType('success');
      return;
    }

    setSubmitting(true);

    try {
      const resp = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          author: author.trim(),
          email: email.trim(),
          content: content.trim(),
          honeypot: honeypotRef.current?.value || ''
        })
      });

      const data = await resp.json();

      if (resp.ok) {
        setMessage(data.message || 'Comment submitted! It will appear after review.');
        setMessageType('success');
        setAuthor('');
        setEmail('');
        setContent('');
        // Track conversion
        if (window.gtag) {
          window.gtag('event', 'comment_submitted', {
            event_category: 'engagement',
            event_label: slug
          });
        }
      } else {
        setMessage(data.error || 'Failed to submit comment.');
        setMessageType('error');
      }
    } catch (err) {
      setMessage('Network error. Please try again.');
      setMessageType('error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return iso; }
  };

  return (
    <div className="native-comments" style={{
      marginTop: '3rem',
      padding: '2rem',
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
      borderRadius: '12px'
    }}>
      <h3 style={{
        fontSize: '1.4rem',
        marginBottom: '0.5rem',
        color: 'var(--text-primary, #fff)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <span>💬</span> Comments ({comments.length})
      </h3>
      <p style={{ color: 'var(--text-muted, #888)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Join the discussion. Comments are reviewed before appearing.
      </p>

      {/* Comment list */}
      {loading ? (
        <p style={{ color: 'var(--text-muted, #888)', fontStyle: 'italic' }}>Loading comments...</p>
      ) : comments.length === 0 ? (
        <p style={{ color: 'var(--text-muted, #888)', fontStyle: 'italic', marginBottom: '1.5rem' }}>
          No comments yet. Be the first to share your thoughts.
        </p>
      ) : (
        <div className="comment-list" style={{ marginBottom: '2rem' }}>
          {comments.map(c => (
            <div key={c.id} style={{
              padding: '1rem 0',
              borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '0.4rem'
              }}>
                <strong style={{ color: 'var(--text-primary, #fff)', fontSize: '0.95rem' }}>
                  {c.author}
                </strong>
                <span style={{ color: 'var(--text-muted, #888)', fontSize: '0.8rem' }}>
                  {formatDate(c.createdAt)}
                </span>
              </div>
              <p style={{
                color: 'var(--text-secondary, #ccc)',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                margin: 0,
                whiteSpace: 'pre-wrap'
              }}>
                {c.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        <div className="nc-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
          <input
            type="text"
            placeholder="Your name"
            value={author}
            onChange={e => setAuthor(e.target.value)}
            required
            minLength={2}
            maxLength={50}
            style={{
              padding: '0.7rem 1rem',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
              borderRadius: '6px',
              color: 'var(--text-primary, #fff)',
              fontSize: '0.95rem'
            }}
          />
          <input
            type="email"
            placeholder="Your email (not shown publicly)"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{
              padding: '0.7rem 1rem',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
              borderRadius: '6px',
              color: 'var(--text-primary, #fff)',
              fontSize: '0.95rem'
            }}
          />
        </div>
        <textarea
          className="nc-textarea"
          placeholder="Share your thoughts..."
          value={content}
          onChange={e => setContent(e.target.value)}
          required
          minLength={3}
          maxLength={2000}
          rows={6}
          style={{
            padding: '0.7rem 1rem',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
            borderRadius: '6px',
            color: 'var(--text-primary, #fff)',
            fontSize: '0.95rem',
            resize: 'vertical',
            fontFamily: 'inherit',
            minHeight: '140px'
          }}
        />
        {/* Honeypot - hidden from real users */}
        <input
          ref={honeypotRef}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          style={{
            position: 'absolute',
            left: '-9999px',
            width: '1px',
            height: '1px',
            opacity: 0
          }}
          aria-hidden="true"
        />
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '0.7rem 1.5rem',
            background: submitting ? 'var(--bg-muted, #555)' : 'var(--accent, #00f5d4)',
            color: '#000',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: submitting ? 'not-allowed' : 'pointer',
            transition: 'opacity 0.2s'
          }}
        >
          {submitting ? 'Submitting...' : 'Post Comment'}
        </button>
      </form>

      {message && (
        <p style={{
          marginTop: '1rem',
          padding: '0.7rem 1rem',
          borderRadius: '6px',
          background: messageType === 'success'
            ? 'rgba(0, 245, 212, 0.1)'
            : 'rgba(255, 0, 110, 0.1)',
          color: messageType === 'success' ? '#00f5d4' : '#ff006e',
          fontSize: '0.9rem'
        }}>
          {message}
        </p>
      )}
    </div>
  );
}
