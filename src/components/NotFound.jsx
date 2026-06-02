// NotFound — 404 page shown for unknown routes
// Renders inside the main content area; Navigation + Footer still show.

export default function NotFound({ requestedPath = '' }) {
  return (
    <main id="main-content" className="not-found-page">
      <div aria-hidden="true" className="not-found-code">404</div>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '0.8rem' }}>
        Lost in the Cosmos
      </h1>
      <p
        style={{
          color: 'var(--text-muted, #888)',
          maxWidth: '520px',
          marginBottom: '1.5rem',
          lineHeight: 1.6,
        }}
      >
        The page you're looking for doesn't exist or has been moved.
        {requestedPath && (
          <>
            <br />
            <code style={{
              fontSize: '0.85em',
              background: 'rgba(255,255,255,0.06)',
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
              marginTop: '0.5rem',
              display: 'inline-block',
            }}>
              {requestedPath}
            </code>
          </>
        )}
      </p>
      <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <a href="#" className="btn btn-primary" style={{ padding: '0.7rem 1.4rem' }}>
          ← Back to Home
        </a>
        <a href="#blog" className="btn btn-secondary" style={{ padding: '0.7rem 1.4rem' }}>
          Browse Blog
        </a>
      </div>
    </main>
  );
}
