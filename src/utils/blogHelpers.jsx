import React from 'react';

// Utility: Calculate dynamic reading time based on word count
export const getReadingTime = (content) => {
  const words = content ? content.trim().split(/\s+/).length : 0;
  return `⏱️ ${Math.ceil(words / 200)} min read`;
};

// Utility: Extract table of contents from article content (### headers only)
export const getTableOfContents = (content) => {
  if (!content) return [];
  const blocks = content.split('\n\n');
  const toc = [];
  blocks.forEach((block) => {
    const trimmed = block.trim();
    if (trimmed.startsWith('### ')) {
      // Skip special tip sections (they're callouts, not main sections)
      if (trimmed.startsWith('### 👨‍💻') || trimmed.startsWith('### 💼')) return;
      const text = trimmed.replace(/^###\s+/, '').trim();
      // Only include substantial headers (>10 chars)
      if (text.length > 3) {
        const slug = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        toc.push({ text, slug });
      }
    }
  });
  return toc;
};

// Utility: Guaranteed valid fallback images (by category) to prevent broken 404 links
export const getFallbackImage = (category) => {
  switch (category) {
    case 'Tech Made Simple 💡':
      return 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=600&q=80';
    case 'Business Hackers 🚀':
      return 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80';
    case 'Future Pulse 🔮':
      return 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80';
    case 'Developer Corner 💻':
      return 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80';
    default:
      return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80';
  }
};

// Utility: Category-specific color mapping for active neon borders & badges
export const getCategoryColor = (cat) => {
  switch (cat) {
    case 'Tech Made Simple 💡': return '#00f5d4'; // Turquoise
    case 'Business Hackers 🚀': return '#7b2cbf'; // Purple
    case 'Future Pulse 🔮': return '#ff006e';    // Pink
    case 'Developer Corner 💻': return '#3a86ff'; // Blue
    default: return '#00f5d4';
  }
};

// Utility: Custom markdown-like content renderer
export function renderContent(text) {
  if (!text) return null;
  const blocks = text.split('\n\n');
  const slugify = (s) => String(s).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return blocks.map((block, i) => {
    const trimmed = block.trim();
    if (trimmed.startsWith('### ')) {
      if (trimmed.startsWith('### 👨‍💻 Developer Tip') || trimmed.startsWith('### 👨‍💻 Dev Sandbox Tip')) {
        const contentLines = block.split('\n');
        const header = contentLines[0].replace('### ', '');
        const body = contentLines.slice(1).join('\n');
        return (
          <div key={i} style={{
            marginTop: '2rem',
            marginBottom: '2rem',
            padding: '1.5rem',
            borderRadius: '10px',
            background: 'rgba(58, 134, 255, 0.08)',
            borderLeft: '4px solid #3a86ff',
            borderTop: '1px solid rgba(58, 134, 255, 0.1)',
            borderRight: '1px solid rgba(58, 134, 255, 0.1)',
            borderBottom: '1px solid rgba(58, 134, 255, 0.1)'
          }}>
            <h4 style={{ color: '#3a86ff', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem', marginBottom: '0.8rem', marginTop: 0 }}>{header}</h4>
            <p style={{ margin: 0, fontSize: '1rem', lineHeight: '1.6', color: 'var(--text)' }}>{body}</p>
          </div>
        );
      }

      if (trimmed.startsWith('### 💼 Business Growth Takeaway') || trimmed.startsWith('### 💼 Business Takeaway')) {
        const contentLines = block.split('\n');
        const header = contentLines[0].replace('### ', '');
        const body = contentLines.slice(1).join('\n');
        return (
          <div key={i} style={{
            marginTop: '2rem',
            marginBottom: '2rem',
            padding: '1.5rem',
            borderRadius: '10px',
            background: 'rgba(255, 0, 110, 0.08)',
            borderLeft: '4px solid #ff006e',
            borderTop: '1px solid rgba(255, 0, 110, 0.1)',
            borderRight: '1px solid rgba(255, 0, 110, 0.1)',
            borderBottom: '1px solid rgba(255, 0, 110, 0.1)'
          }}>
            <h4 style={{ color: '#ff006e', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem', marginBottom: '0.8rem', marginTop: 0 }}>{header}</h4>
            <p style={{ margin: 0, fontSize: '1rem', lineHeight: '1.6', color: 'var(--text)' }}>{body}</p>
          </div>
        );
      }

      const headerText = trimmed.replace(/^###\s+/, '').trim();
      const headerSlug = slugify(headerText);
      return <h3 key={i} id={`toc-${headerSlug}`} style={{ marginTop: '1.8rem', marginBottom: '0.8rem', color: 'var(--accent)' }}>{headerText}</h3>;
    }
    if (trimmed.startsWith('## ')) {
      const headerText = trimmed.replace(/^##\s+/, '').trim();
      const headerSlug = slugify(headerText);
      return <h2 key={i} id={`toc-${headerSlug}`} style={{ marginTop: '2.2rem', marginBottom: '1rem', color: 'var(--accent)' }}>{headerText}</h2>;
    }
    if (trimmed.startsWith('# ')) {
      const headerText = trimmed.replace(/^#\s+/, '').trim();
      const headerSlug = slugify(headerText);
      return <h1 key={i} id={`toc-${headerSlug}`} style={{ marginTop: '2.8rem', marginBottom: '1.2rem', color: 'var(--accent)' }}>{headerText}</h1>;
    }
    if (trimmed.startsWith('- ')) {
      const items = trimmed.split('\n').map(item => item.replace('- ', '').trim());
      return (
        <ul key={i} style={{ marginLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'disc' }}>
          {items.map((item, j) => <li key={j} style={{ marginBottom: '0.4rem', fontSize: '1rem', lineHeight: '1.6', color: 'var(--text)' }}>{item}</li>)}
        </ul>
      );
    }
    return <p key={i} style={{ marginBottom: '1.2rem', fontSize: '1.05rem', lineHeight: '1.7', color: 'var(--text)' }}>{trimmed}</p>;
  });
}
