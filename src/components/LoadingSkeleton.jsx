// LoadingSkeleton — Animated placeholder shown while blog data is loading
// Prevents layout shift and gives users a sense of progress.

export default function LoadingSkeleton({ type = 'blog' }) {
  if (type === 'home') {
    return (
      <div aria-label="Loading content" role="status" style={{ padding: '2rem' }}>
        <div className="skeleton-hero" />
        <div className="skeleton-section">
          <div className="skeleton-line" style={{ width: '40%' }} />
          <div className="skeleton-line" style={{ width: '60%' }} />
          <div className="skeleton-line" style={{ width: '80%' }} />
        </div>
        <span className="sr-only">Loading…</span>
      </div>
    );
  }

  // Default: blog feed grid
  return (
    <div
      aria-label="Loading blog posts"
      role="status"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '2rem',
        padding: '2rem 0',
      }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-img" />
          <div style={{ padding: '1.2rem' }}>
            <div className="skeleton-line" style={{ width: '30%', marginBottom: '0.7rem' }} />
            <div className="skeleton-line" style={{ width: '90%', height: '1.2rem', marginBottom: '0.5rem' }} />
            <div className="skeleton-line" style={{ width: '70%', height: '1.2rem', marginBottom: '0.8rem' }} />
            <div className="skeleton-line" style={{ width: '100%' }} />
            <div className="skeleton-line" style={{ width: '85%' }} />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading blog posts…</span>
    </div>
  );
}
