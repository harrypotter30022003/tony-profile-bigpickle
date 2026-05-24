import React, { useState, useEffect } from 'react';
import { getReadingTime, getFallbackImage, getCategoryColor, renderContent } from '../utils/blogHelpers';

export default function BlogDetail({ cvData, slug }) {
  const articles = cvData?.blog || [];
  const article = articles.find(a => a.slug === slug);

  // 1. Scroll Progress Hook
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.pageYOffset / totalHeight) * 100;
        setScrollProgress(progress);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [slug]);

  if (!article) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <h2>🔍 Article Not Found</h2>
        <p style={{ margin: '1rem 0 2rem', color: '#888' }}>The article you are looking for might have been moved or renamed.</p>
        <a href="#blog" className="btn btn-primary">Back to Articles</a>
      </div>
    );
  }

  // 2. Query Related Posts (Same category first, pad with others if needed, exclude current article)
  const categoryArticles = articles.filter(a => a.slug !== slug && a.category === article.category);
  const otherArticles = articles.filter(a => a.slug !== slug && a.category !== article.category);
  const relatedPosts = [...categoryArticles, ...otherArticles].slice(0, 3);

  const activeColor = getCategoryColor(article.category);

  return (
    <article className="blog-detail" style={{ minHeight: '80vh', paddingTop: '120px', paddingBottom: '100px', maxWidth: '900px', margin: '0 auto', paddingLeft: '1.5rem', paddingRight: '1.5rem', position: 'relative' }}>
      
      {/* Scroll Progress Bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: `${scrollProgress}%`,
        height: '4px',
        background: activeColor,
        boxShadow: `0 0 10px ${activeColor}`,
        zIndex: 9999,
        transition: 'width 0.1s ease-out'
      }} />

      {/* Semantic Breadcrumbs navigation */}
      <div className="breadcrumbs-container" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        flexWrap: 'wrap',
        marginBottom: '2rem',
        fontSize: '0.9rem',
        color: 'var(--text-muted)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        paddingBottom: '1rem',
        width: '100%',
        justifyContent: 'flex-start'
      }}>
        <a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = 'var(--text)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}>Home</a>
        <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
        <a href="#blog" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = 'var(--text)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}>Blog</a>
        <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
        <span style={{ color: activeColor, fontWeight: '500', opacity: 0.95 }}>{article.title}</span>
      </div>

      {/* Article Header Metadata panel */}
      <header style={{ marginBottom: '3rem' }}>
        <h1 className="gradient-text-cat" style={{
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          lineHeight: '1.2',
          marginBottom: '1.5rem',
          '--accent-color': activeColor
        }}>{article.title}</h1>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <div className="blog-card-meta" style={{ margin: 0 }}>
            <span>📅 {article.date}</span>
            <span>{getReadingTime(article.content)}</span>
            <span>✍️ {article.author || 'Do Minh Tuan'}</span>
          </div>
          <span style={{
            color: activeColor,
            padding: '0.2rem 0.6rem',
            borderRadius: '15px',
            fontSize: '0.8rem',
            fontWeight: '600',
            background: `${activeColor}11`
          }}>
            {article.category || 'General'}
          </span>
        </div>
      </header>

      {/* Hero Cover Image with 404 Fallback Bound */}
      <div style={{ width: '100%', height: 'clamp(200px, 40vw, 380px)', borderRadius: '16px', overflow: 'hidden', marginBottom: '3rem', border: '1px solid var(--border-color)' }}>
        <img 
          src={article.image || getFallbackImage(article.category)} 
          alt={article.title} 
          loading="lazy"
          onError={(e) => { e.target.onerror = null; e.target.src = getFallbackImage(article.category); }}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
      
      {/* Blog Post Content Body */}
      <div className="blog-body-content box" style={{ padding: '2.5rem', borderRadius: '12px', background: 'rgba(18, 18, 26, 0.4)', border: '1px solid var(--border-color)', backdropFilter: 'blur(10px)' }}>
        {renderContent(article.content)}
      </div>

      {/* Social Share Bar */}
      <div style={{
        marginTop: '2.5rem',
        padding: '1.2rem 2rem',
        borderRadius: '8px',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <span style={{ fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.95rem' }}>📢 Share this insights panel:</span>
        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <button 
            onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank')}
            className="btn"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', background: '#0077b5', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            LinkedIn
          </button>
          <button 
            onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
            className="btn"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', background: '#1877f2', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            Facebook
          </button>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Copied link to clipboard!');
            }}
            className="btn"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', background: activeColor, color: '#000', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Copy Link
          </button>
        </div>
      </div>

      {/* Related Reads Panel */}
      {relatedPosts.length > 0 && (
        <section style={{ marginTop: '5rem', paddingTop: '3rem', borderTop: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1.8rem', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>📚</span> Related Reads
          </h3>
          <div className="blog-feed-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2rem' }}>
            {relatedPosts.map((post, i) => (
              <article 
                key={i} 
                className="blog-card" 
                onClick={() => {
                  window.location.hash = `#blog/${post.slug}`;
                  window.scrollTo(0, 0);
                }}
                style={{
                  cursor: 'pointer',
                  '--glow-color': getCategoryColor(post.category)
                }}
              >
                <div>
                  <div style={{ width: '100%', height: '160px', overflow: 'hidden', position: 'relative' }}>
                    <img 
                      src={post.image || getFallbackImage(post.category)} 
                      alt={post.title} 
                      loading="lazy"
                      onError={(e) => { e.target.onerror = null; e.target.src = getFallbackImage(post.category); }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <span style={{
                      position: 'absolute',
                      top: '0.8rem',
                      left: '0.8rem',
                      background: 'rgba(10, 10, 15, 0.85)',
                      border: `1px solid ${getCategoryColor(post.category)}`,
                      color: '#fff',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '20px',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      backdropFilter: 'blur(5px)'
                    }}>
                      {post.category || 'General'}
                    </span>
                  </div>

                  <div style={{ padding: '1.5rem' }}>
                    <h4 style={{ fontSize: '1.15rem', marginBottom: '0.8rem', color: 'var(--text)', lineHeight: '1.4' }}>{post.title}</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0, display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.summary}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
      
      {/* CTA Footer */}
      <footer style={{ marginTop: '5rem', borderTop: '1px solid var(--border-color)', paddingTop: '3rem', textAlign: 'center' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Interested in working together or discussing tech?</h3>
        <a href="#contact" className="btn btn-primary">Connect with Tony</a>
      </footer>

    </article>
  );
}
