import React, { useState, useMemo } from 'react';
import { getReadingTime, getFallbackImage, getCategoryColor } from '../utils/blogHelpers';
import { useViewCounts, formatViewCount } from '../hooks/useArticleView';

export default function BlogFeed({ cvData }) {
  const articles = cvData?.blog || [];
  const [selectedCategory, _setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 12;

  // Fetch view counts for all article slugs
  const slugs = useMemo(() => articles.map(a => a.slug), [articles]);
  const viewCounts = useViewCounts(slugs);

  // Change handler that resets pagination atomically (avoids setState-in-effect)
  const setCategory = (cat) => {
    _setSelectedCategory(cat);
    setCurrentPage(1);
  };
  const setQuery = (q) => {
    setSearchQuery(q);
    setCurrentPage(1);
  };
  
  const categories = ['All', 'Tech Made Simple 💡', 'Business Hackers 🚀', 'Future Pulse 🔮', 'Developer Corner 💻'];

  const filteredArticles = useMemo(() => {
    let result = articles;
    if (selectedCategory !== 'All') {
      result = result.filter(a => a.category === selectedCategory);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(a =>
        (a.title || '').toLowerCase().includes(q) ||
        (a.summary || '').toLowerCase().includes(q) ||
        (a.content || '').toLowerCase().includes(q) ||
        (a.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [articles, selectedCategory, searchQuery]);

  const totalPages = Math.ceil(filteredArticles.length / postsPerPage);
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredArticles.slice(indexOfFirstPost, indexOfLastPost);

  const handlePageChange = (pageNumber, e) => {
    if (e) e.preventDefault();
    setCurrentPage(pageNumber);
    const targetEl = document.querySelector('.blog-section');
    if (targetEl) {
      window.scrollTo({
        top: targetEl.offsetTop - 80,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="blog-section" style={{ minHeight: '80vh', paddingTop: '100px', paddingBottom: '100px' }}>
      <div className="section-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📚 Articles & Insights</h1>
        <p style={{ color: 'var(--text-muted)' }}>Simple tech tricks, small business growth hacks, and programming tutorials</p>
      </div>

      {/* Search Box */}
      <div style={{
        maxWidth: '520px',
        margin: '0 auto 1.5rem',
        position: 'relative'
      }}>
        <label htmlFor="blog-search" className="sr-only">Search articles</label>
        <input
          id="blog-search"
          type="search"
          value={searchQuery}
          onChange={e => setQuery(e.target.value)}
          placeholder="🔍 Search articles by title, tag, or content..."
          aria-label="Search articles"
          style={{
            width: '100%',
            padding: '0.8rem 1.2rem',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '30px',
            color: 'var(--text-primary, #fff)',
            fontSize: '0.95rem',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setQuery('')}
            aria-label="Clear search"
            style={{
              position: 'absolute',
              right: '0.8rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              fontSize: '1.2rem',
              padding: '0.2rem 0.5rem',
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Category Filter Navigation */}
      <div className="category-filter" style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '0.8rem',
        flexWrap: 'wrap',
        marginBottom: '3rem',
        padding: '0 1.5rem'
      }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '30px',
              border: '1px solid',
              borderColor: selectedCategory === cat ? getCategoryColor(cat) : 'rgba(255, 255, 255, 0.1)',
              background: selectedCategory === cat ? `${getCategoryColor(cat)}22` : 'rgba(18, 18, 26, 0.6)',
              color: selectedCategory === cat ? '#fff' : '#aaa',
              fontSize: '0.95rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(5px)',
              '--glow-color': getCategoryColor(cat)
            }}
          >
            {cat}
          </button>
        ))}
      </div>
      
      {currentPosts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <p style={{ fontSize: '3rem', margin: '0 0 0.5rem' }} aria-hidden="true">🔍</p>
          <p style={{ fontSize: '1.2rem', color: '#888', margin: 0 }}>
            {searchQuery
              ? <>No articles match "<strong style={{ color: '#fff' }}>{searchQuery}</strong>"</>
              : 'No articles published in this category yet. Check back soon!'}
          </p>
          {(searchQuery || selectedCategory !== 'All') && (
            <button
              onClick={() => { setQuery(''); setCategory('All'); }}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1.2rem',
                background: 'rgba(0, 245, 212, 0.1)',
                border: '1px solid #00f5d4',
                borderRadius: '20px',
                color: '#00f5d4',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <p style={{ textAlign: 'center', color: '#666', fontSize: '0.9rem', margin: '0 0 1rem' }} aria-live="polite">
            Showing {indexOfFirstPost + 1}–{Math.min(indexOfLastPost, filteredArticles.length)} of {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
          </p>
          <div className="blog-feed-grid">
            {currentPosts.map((article, i) => (
              <article 
                key={i} 
                className="blog-card" 
                onClick={() => window.location.hash = `#blog/${article.slug}`}
                style={{
                  '--glow-color': getCategoryColor(article.category)
                }}
              >
                <div>
                  {/* Cover Image with 404 Fallback Bound */}
                  <div style={{ width: '100%', height: '200px', overflow: 'hidden', position: 'relative' }}>
                    <img 
                      src={article.image || getFallbackImage(article.category)} 
                      alt={article.title} 
                      loading="lazy"
                      onError={(e) => { e.target.onerror = null; e.target.src = getFallbackImage(article.category); }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {/* Category Badge */}
                    <span style={{
                      position: 'absolute',
                      top: '1rem',
                      left: '1rem',
                      background: 'rgba(10, 10, 15, 0.85)',
                      border: `1px solid ${getCategoryColor(article.category)}`,
                      color: '#fff',
                      padding: '0.3rem 0.8rem',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      backdropFilter: 'blur(5px)'
                    }}>
                      {article.category || 'General'}
                    </span>
                  </div>

                  <div style={{ padding: '2rem' }}>
                    <div className="blog-card-meta">
                      <span>📅 {article.date}</span>
                      <span>{getReadingTime(article.content)}</span>
                      <span>👁️ {formatViewCount(viewCounts[article.slug]) || '0'}</span>
                      <span>✍️ {article.author || 'Do Minh Tuan'}</span>
                    </div>
                    <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: 'var(--text)', lineHeight: '1.3' }}>{article.title}</h3>
                    <p className="blog-card-summary">{article.summary}</p>
                  </div>
                </div>

                <div style={{ padding: '0 2rem 2rem 2rem' }}>
                  <a 
                    href={`#blog/${article.slug}`} 
                    className="btn btn-secondary" 
                    onClick={(e) => e.stopPropagation()}
                    style={{ width: 'fit-content', fontSize: '0.9rem', padding: '0.6rem 1.2rem' }}
                  >
                    Read Article →
                  </a>
                </div>
              </article>
            ))}
          </div>

          {/* Frosted Glass Newsletter Subscription Widget */}
          <NewsletterSubscribe />

          {/* Pagination Controls bar */}
          {totalPages > 1 && (
            <div className="pagination-container" aria-label="Blog pagination">
              {/* Previous Page Button */}
              <a
                href={`#blog?page=${currentPage - 1}`}
                onClick={(e) => currentPage > 1 && handlePageChange(currentPage - 1, e)}
                className={currentPage === 1 ? 'disabled' : ''}
              >
                ← Prev
              </a>

              {/* Page Numbers */}
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(pageNum => (
                <a
                  key={pageNum}
                  href={`#blog?page=${pageNum}`}
                  onClick={(e) => handlePageChange(pageNum, e)}
                  className={currentPage === pageNum ? 'active' : ''}
                  style={{
                    '--glow-color': getCategoryColor(selectedCategory),
                    '--active-bg': currentPage === pageNum ? `${getCategoryColor(selectedCategory)}22` : undefined
                  }}
                >
                  {pageNum}
                </a>
              ))}

              {/* Next Page Button */}
              <a
                href={`#blog?page=${currentPage + 1}`}
                onClick={(e) => currentPage < totalPages && handlePageChange(currentPage + 1, e)}
                className={currentPage === totalPages ? 'disabled' : ''}
              >
                Next →
              </a>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function NewsletterSubscribe() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [msg, setMsg] = useState('');

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMsg(data.message || 'Successfully subscribed! Welcome aboard.');
        setEmail('');
      } else {
        setStatus('error');
        setMsg(data.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setStatus('error');
      setMsg('Network error. Please try again later.');
    }
  };

  return (
    <div style={{
      margin: '3rem auto',
      maxWidth: '600px',
      padding: '2.5rem',
      borderRadius: '16px',
      background: 'rgba(255, 255, 255, 0.01)',
      border: '1px solid var(--border-color)',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background glow */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'radial-gradient(circle, rgba(0, 245, 212, 0.03) 0%, transparent 60%)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text)' }}>📩 Join the Tech Stream</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
          Subscribe to receive a concise weekly newsletter with premium highlights, developer tips, and business growth hacks from the tech feed.
        </p>

        {status === 'success' ? (
          <div style={{ color: '#00f5d4', fontWeight: '500', padding: '1rem', background: 'rgba(0, 245, 212, 0.05)', borderRadius: '8px', border: '1px solid rgba(0, 245, 212, 0.1)' }}>
            🎉 {msg}
          </div>
        ) : (
          <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: '0.8rem', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your professional email..."
              required
              disabled={status === 'loading'}
              style={{
                flex: '1',
                minWidth: '240px',
                padding: '0.8rem 1.2rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'rgba(10, 10, 15, 0.6)',
                color: '#fff',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="btn btn-primary"
              style={{
                padding: '0.8rem 1.8rem',
                fontSize: '0.95rem',
                fontWeight: 'bold',
                borderRadius: '8px',
                cursor: status === 'loading' ? 'not-allowed' : 'pointer'
              }}
            >
              {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        )}

        {status === 'error' && (
          <p style={{ color: '#ff006e', fontSize: '0.9rem', marginTop: '1rem', fontWeight: '500' }}>⚠️ {msg}</p>
        )}
      </div>
    </div>
  );
}
