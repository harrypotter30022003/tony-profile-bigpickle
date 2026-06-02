// TableOfContents — sticky sidebar TOC for blog articles
// Auto-generated from ### markdown headers in article content
import { useState, useEffect } from 'react';

export default function TableOfContents({ items }) {
  const [activeSlug, setActiveSlug] = useState(null);

  useEffect(() => {
    if (!items || items.length === 0) return;

    // Use IntersectionObserver to highlight active section
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible header
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          const id = visible[0].target.id;
          setActiveSlug(id);
        }
      },
      { rootMargin: '-100px 0px -60% 0px', threshold: 0 }
    );

    items.forEach(({ slug }) => {
      const el = document.getElementById(`toc-${slug}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  if (!items || items.length < 2) return null;

  const handleClick = (e, slug) => {
    e.preventDefault();
    const el = document.getElementById(`toc-${slug}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSlug(slug);
      // Track engagement
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'toc_click', {
          event_category: 'engagement',
          event_label: slug
        });
      }
    }
  };

  return (
    <nav
      className="toc-sidebar"
      aria-label="Table of contents"
      style={{
        position: 'sticky',
        top: '120px',
        padding: '1.2rem 1rem',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
        borderRadius: '10px',
        fontSize: '0.85rem',
        maxHeight: 'calc(100vh - 140px)',
        overflowY: 'auto'
      }}
    >
      <h4 style={{
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--text-muted, #888)',
        marginBottom: '0.8rem',
        fontWeight: 600
      }}>
        📑 On this page
      </h4>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map(({ text, slug }) => (
          <li key={slug} style={{ marginBottom: '0.4rem' }}>
            <a
              href={`#toc-${slug}`}
              onClick={(e) => handleClick(e, slug)}
              style={{
                color: activeSlug === slug
                  ? 'var(--accent, #00f5d4)'
                  : 'var(--text-secondary, #ccc)',
                textDecoration: 'none',
                display: 'block',
                padding: '0.2rem 0',
                paddingLeft: '0.5rem',
                borderLeft: activeSlug === slug
                  ? '2px solid var(--accent, #00f5d4)'
                  : '2px solid transparent',
                transition: 'all 0.15s',
                lineHeight: 1.4
              }}
            >
              {text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
