import React, { useState, useEffect } from 'react';
import { getReadingTime, getFallbackImage, getCategoryColor } from '../utils/blogHelpers';

export default function BlogFeed({ cvData }) {
  const articles = cvData?.blog || [];
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 12;

  // Reset page back to 1 when changing categories
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);
  
  const categories = ['All', 'Tech Made Simple 💡', 'Business Hackers 🚀', 'Future Pulse 🔮', 'Developer Corner 💻'];
  
  const filteredArticles = selectedCategory === 'All' 
    ? articles 
    : articles.filter(a => a.category === selectedCategory);

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
      <div className="section-header">
        <h2>📚 Articles & Insights</h2>
        <p>Simple tech tricks, small business growth hacks, and programming tutorials</p>
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
            onClick={() => setSelectedCategory(cat)}
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
        <p style={{ textAlign: 'center', fontSize: '1.2rem', color: '#888', marginTop: '2rem' }}>No articles published in this category yet. Check back soon!</p>
      ) : (
        <>
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
