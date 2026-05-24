import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';

const BlogFeed = lazy(() => import('./components/BlogFeed'));
const BlogDetail = lazy(() => import('./components/BlogDetail'));
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './App.css';

gsap.registerPlugin(ScrollTrigger);

const cvData = {
  name: 'Do Minh Tuan',
  title: 'Senior Project Manager & Tech Leader',
  phone: '+84 96 288 2315',
  email: 'tonydo.pm@gmail.com',
  linkedin: 'http://tony.do/linkedin',
  summary: 'Lead PHP, Mobile Project Team. Directly involved in project management, controlling timeline and budget. Aim to deliver quality products on time.',
  experience: [
    { company: 'Finantaged', position: 'COO', period: '2022-2023', highlights: ['Build IT team for AI Fintech app', 'Recruitment across IT, Creative, HR'] },
    { company: 'CoffeeMug', position: 'Senior PM', period: '2021-2022', highlights: ['Managing global projects', 'Singapore, Korea, Australia, UK'] },
    { company: 'StratAgile Vietnam', position: 'Technical Director', period: '2015-2021', highlights: ['Managing marketing team', 'Leading PHP & Mobile'] },
    { company: 'StratAgile Pte. Ltd.', position: 'Lead - PHP & Mobile', period: '2014-2015', highlights: ['PHP & Mobile Team Lead'] },
    { company: 'StratAgile Pte. Ltd.', position: 'Senior Developer', period: '2013-2014', highlights: ['Web/iPhone development', 'iOS apps with Xcode'] },
    { company: 'StratAgile Pte. Ltd.', position: 'Developer', period: '2011-2013', highlights: ['PHP/HTML development'] }
  ],
  education: { institution: 'University of Wollongong', degree: 'Computer Science', period: '2007-2010' },
  skills: {
    'Project Management': ['IT Recruitment', 'Team Leadership', 'Budget Control'],
    'Web Development': ['PHP', 'WordPress', 'Magento', 'JavaScript'],
    'Mobile': ['iOS (Xcode)', 'Android Management'],
    'Infrastructure': ['AWS EC2', 'SSL', 'LAMP', 'CentOS']
  },
  projects: [
    { name: 'Clue-Box', link: 'http://clue-box.com/', desc: 'Mobile survey app with rewards', tags: ['iOS', 'PHP', 'AWS'] },
    { name: 'Post-a-Card', link: 'https://www.techinasia.com/postacard-app-singapore', desc: 'SingPost postcard app worldwide', tags: ['iOS', 'Android'] },
    { name: 'Symptom Care', link: 'http://www.ncis.com.sg/', desc: 'Cancer symptom monitoring', tags: ['R&D', 'PM'] },
    { name: 'Smile Asia', link: 'http://smileasia.org', desc: 'Charity eCommerce for Ritz-Carlton', tags: ['WordPress'] },
    { name: 'EZ Fast Tech', link: 'https://ezfasttech.com', desc: 'SEO web design & bespoke software development platform for SMEs', tags: ['WordPress', 'SEO', 'React'] }
  ],
  certifications: [{ name: 'IELTS', score: '7.5', issuer: 'British Council' }]
};

const hiddenMessages = [
  { quote: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { quote: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { quote: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { quote: "Success is not final, failure is not fatal.", author: "Winston Churchill" },
  { quote: "Teamwork makes the dream work.", author: "John C. Maxwell" }
];

function Navigation({ cvData, currentView }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const menuItems = currentView === 'home' 
    ? [
        { label: 'About', href: '#about' },
        { label: 'Experience', href: '#experience' },
        { label: 'Skills', href: '#skills' },
        { label: 'Projects', href: '#projects' },
        { label: 'Blog', href: '#blog' },
        { label: 'Contact', href: '#contact' }
      ]
    : [
        { label: 'Home', href: '#' },
        { label: 'Blog', href: '#blog' },
        { label: 'Contact', href: '#contact' }
      ];

  return (
    <nav>
      <div className="logo">
        <a href="#" style={{ textDecoration: 'none', color: 'inherit', fontWeight: 'bold' }}>
          {cvData?.name || 'Tony'}
        </a>
      </div>
      
      {/* Desktop & Mobile Menu */}
      <ul className={`nav-links ${isOpen ? 'active' : ''}`}>
        {/* Close button for mobile */}
        <li className="mobile-close" onClick={() => setIsOpen(false)}>✕</li>
        
        {menuItems.map(item => (
          <li key={item.label}>
            <a href={item.href} onClick={() => setIsOpen(false)}>{item.label}</a>
          </li>
        ))}
      </ul>

      {/* Hamburger Icon */}
      <div className="mobile-menu" onClick={() => setIsOpen(true)}>
        <span></span><span></span><span></span>
      </div>
    </nav>
  );
}

function Hero({ cvData }) {
  return (
    <section className="hero">
      <div className="hero-bg">
        <div className="hero-orb hero-orb-1"></div>
        <div className="hero-orb hero-orb-2"></div>
        <div className="hero-orb hero-orb-3"></div>
      </div>
      <div className="hero-content">
        <p className="greeting">{cvData?.hero?.greeting || 'Welcome to my universe'}</p>
        <h1>Hi, I'm <span className="gradient-text">{cvData?.name}</span></h1>
        <p className="subtitle">{cvData?.title} • 15+ Years Building Digital Products</p>
        <div className="cta-buttons">
          <a href="#projects" className="btn btn-primary">{cvData?.hero?.ctaPrimary || 'View Projects'}</a>
          <a href="#contact" className="btn btn-secondary">{cvData?.hero?.ctaSecondary || 'Contact Me'}</a>
        </div>
      </div>
    </section>
  );
}

function About({ cvData }) {
  const statsRef = useRef(null);

  useEffect(() => {
    const stats = statsRef.current.querySelectorAll('.stat-num');
    stats.forEach(stat => {
      const target = parseInt(stat.getAttribute('data-target'));
      if (isNaN(target)) return;
      
      gsap.fromTo(stat, 
        { innerText: 0 },
        { 
          innerText: target, 
          duration: 2, 
          snap: { innerText: 1 },
          ease: 'power1.out',
          scrollTrigger: {
            trigger: stat,
            start: 'top 90%',
          }
        }
      );
    });
  }, [cvData]);

  return (
    <section id="about">
      <div className="section-header">
        <h2>{cvData?.about?.title || 'About Me'}</h2>
        <p>{cvData?.about?.subtitle || 'Building digital products across Southeast Asia'}</p>
      </div>
      <div className="about-grid">
        <div className="about-visual">
          <div className="avatar-container">
            <div className="avatar-ring ring-1"></div>
            <div className="avatar-ring ring-2"></div>
            <div className="avatar-ring ring-3"></div>
            <div className="avatar-emoji">👨‍💻</div>
          </div>
        </div>
        <div className="about-content">
          <h3>{cvData?.title}</h3>
          <p>{cvData?.summary}</p>
          <div className="stats-grid" ref={statsRef}>
            {(cvData?.about?.stats || []).map((s, i) => (
              <div key={i} className="stat-card">
                <div className="stat-num" data-target={parseInt(s.num)}>{s.num}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="edu-section">
            <div className="edu-card">
              <h4>{cvData?.education.institution}</h4>
              <p>{cvData?.education.degree} • {cvData?.education.period}</p>
            </div>
            <div className="cert-badge">📜 {cvData?.certifications[0].name} {cvData?.certifications[0].score} - {cvData?.certifications[0].issuer}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Experience({ cvData }) {
  return (
    <section id="experience">
      <div className="section-header">
        <h2>Experience</h2>
        <p>{cvData?.experienceTitle || 'My journey through the years'}</p>
      </div>
      <div className="timeline">
        {cvData?.experience.map((exp, i) => (
          <div key={i} className="timeline-item">
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <span className="timeline-date">{exp.period}</span>
              <h3>{exp.position}</h3>
              <h4>{exp.company}</h4>
              <ul>{exp.highlights.map((h, j) => <li key={j}>{h}</li>)}</ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Skills({ cvData }) {
  const icons = { 'Project Management': '📊', 'Web Development': '🌐', 'Mobile': '📱', 'Infrastructure': '☁️' };
  const levels = { 'IT Recruitment': 85, 'Team Leadership': 95, 'Budget Control': 90, 'PHP': 92, 'WordPress': 95, 'Magento': 80, 'JavaScript': 85, 'iOS (Xcode)': 82, 'Android Management': 80, 'AWS EC2': 82, 'SSL': 88, 'LAMP': 90, 'CentOS': 85 };
  
  return (
    <section id="skills">
      <div className="section-header">
        <h2>Skills</h2>
        <p>{cvData?.skillsTitle || 'Technologies & expertise'}</p>
      </div>
      <div className="skills-grid">
        {Object.entries(cvData?.skills).map(([cat, skills]) => (
          <div key={cat} className="skill-card">
            <h3>{icons[cat]} {cat}</h3>
            <div className="skill-list">
              {skills.map((s, i) => (
                <div key={i} className="skill-item">
                  <div className="skill-header">
                    <span>{s}</span>
                    <span>{levels[s] || 85}%</span>
                  </div>
                  <div className="skill-bar-bg">
                    <div className="skill-bar-fill" style={{ width: `${levels[s] || 85}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Projects({ cvData }) {
  const icons = ['📊', '📮', '🏥', '🎗️', '💻'];
  
  return (
    <section id="projects">
      <div className="section-header">
        <h2>Projects</h2>
        <p>{cvData?.projectsTitle || 'Featured work & achievements'}</p>
      </div>
      <div className="projects-grid">
        {cvData?.projects.map((p, i) => (
          <div key={i} className="project-card">
            <div className="project-icon">{icons[i]}</div>
            <div className="project-info">
              <h3>{p.name}</h3>
              <p>{p.desc}</p>
              <div className="project-tags">
                {p.tags.map((t, j) => <span key={j} className="tag">{t}</span>)}
              </div>
              <a href={p.link} target="_blank" rel="noopener noreferrer" className="project-link">Visit →</a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HiddenWisdomSection() {
  const [currentQuote, setCurrentQuote] = useState(0);
  const sectionRef = useRef(null);
  const [isActive, setIsActive] = useState(false);

  const updateSpotlight = (clientX, clientY) => {
    if (sectionRef.current) {
      const rect = sectionRef.current.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      sectionRef.current.style.setProperty('--spotlight-x', `${x}%`);
      sectionRef.current.style.setProperty('--spotlight-y', `${y}%`);
    }
  };

  const handleMouseMove = (e) => {
    updateSpotlight(e.clientX, e.clientY);
  };

  const handleTouchMove = (e) => {
    if (e.touches[0]) {
      updateSpotlight(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote(prev => (prev + 1) % hiddenMessages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section 
      className={`darkness-section ${isActive ? 'active' : ''}`}
      ref={sectionRef}
      onMouseEnter={() => setIsActive(true)}
      onMouseLeave={() => setIsActive(false)}
      onMouseMove={handleMouseMove}
      onTouchStart={() => setIsActive(true)}
      onTouchEnd={() => setIsActive(false)}
      onTouchMove={handleTouchMove}
    >
      <div className="darkness-overlay"></div>
      <div className="darkness-content">
        <div className="darkness-title">
          <h2>✨ Hidden Wisdom ✨</h2>
          <p>{isActive ? 'Shine your light to clear the fog...' : 'Touch/Hover to discover...'}</p>
        </div>
        <div className="spotlight-reveal">
          <div className="reveal-glow"></div>
          <p className="reveal-quote">"{hiddenMessages[currentQuote].quote}"</p>
          <p className="reveal-author">— {hiddenMessages[currentQuote].author}</p>
        </div>
      </div>
    </section>
  );
}

function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggleVisible = () => {
      const scrolled = document.documentElement.scrollTop;
      if (scrolled > 300) {
        setVisible(true);
      } else if (scrolled <= 300) {
        setVisible(false);
      }
    };
    window.addEventListener('scroll', toggleVisible);
    return () => window.removeEventListener('scroll', toggleVisible);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <button 
      className={`back-to-top ${visible ? 'visible' : ''}`} 
      onClick={scrollToTop}
      aria-label="Back to top"
    >
      ↑
    </button>
  );
}

function MysteryCards() {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  
  const values = [
    { icon: '🚀', title: 'Innovation', message: 'I believe in pushing boundaries and finding creative solutions that make a real impact.' },
    { icon: '💎', title: 'Quality', message: 'Excellence is non-negotiable. Every detail matters in delivering exceptional results.' },
    { icon: '🤝', title: 'Teamwork', message: 'Great achievements are never solo efforts. I thrive in collaborative environments.' },
    { icon: '🎯', title: 'Results', message: 'I measure success by outcomes, not just activities. Deadlines are sacred.' }
  ];

  return (
    <section className="mystery-section">
      <div className="section-header">
        <h2>🎭 Discover My Values 🎭</h2>
        <p>Hover to reveal the hidden meaning</p>
      </div>
      <div className="mystery-grid">
        {values.map((v, i) => (
          <div 
            key={i} 
            className={`mystery-card ${hoveredIndex === i ? 'hovered' : ''}`}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{ animationDelay: `${i * 0.15}s` }}
          >
            <div className="mystery-icon">{v.icon}</div>
            <h3>{v.title}</h3>
            <div className="mystery-reveal">
              <p>{v.message}</p>
            </div>
            <div className="mystery-shine"></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Contact({ cvData }) {
  const [name, setName] = useState('');
  
  const handleWhatsApp = (e) => {
    e.preventDefault();
    const phone = cvData?.phone?.replace(/\D/g, '') || '84962882315';
    const message = encodeURIComponent(`Hi Tony, I'm ${name || 'interested'}, I saw your portfolio and would like to connect!`);
    
    // GA4 Custom Event tracking for WhatsApp form submission
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'whatsapp_contact_click', {
        event_category: 'Engagement',
        event_label: name ? 'With Name' : 'Anonymous'
      });
    }

    window.location.href = `https://api.whatsapp.com/send?phone=${phone}&text=${message}`;
  };
  
  return (
    <section id="contact" className="contact-section">
      <div className="section-header">
        <h2>{cvData?.contact?.title || 'Get In Touch'}</h2>
        <p>{cvData?.contact?.subtitle || "Let's create something amazing together"}</p>
      </div>
      <div className="contact-grid">
        {[
          { icon: '📧', title: 'Email', value: cvData?.email, link: `mailto:${cvData?.email}`, type: 'email' },
          { icon: '📱', title: 'Phone', value: cvData?.phone, link: `tel:${cvData?.phone}`, type: 'phone' },
          { icon: '💼', title: 'LinkedIn', value: 'Connect', link: cvData?.linkedin, type: 'linkedin' },
          { icon: '📍', title: 'Location', value: cvData?.contact?.location || 'Ho Chi Minh City', link: null, type: 'location' }
        ].map((c, i) => (
          <div key={i} className="contact-card">
            <div className="contact-icon">{c.icon}</div>
            <h3>{c.title}</h3>
            <p>
              {c.link ? (
                <a 
                  href={c.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={() => {
                    if (typeof window.gtag === 'function') {
                      window.gtag('event', 'contact_info_click', {
                        contact_type: c.type,
                        value: c.value
                      });
                    }
                  }}
                >
                  {c.value}
                </a>
              ) : c.value}
            </p>
          </div>
        ))}
      </div>
      
      <div className="whatsapp-connect">
        <div className="contact-form">
          <h3 style={{marginBottom: '1.5rem'}}>Fast Connect via WhatsApp</h3>
          <input 
            type="text" 
            placeholder="Your Name (Optional)" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            style={{textAlign: 'center'}}
          />
          <button onClick={handleWhatsApp} className="btn btn-primary" style={{width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'}}>
            <span style={{fontSize: '1.2rem'}}>💬</span> Message on WhatsApp
          </button>
        </div>
      </div>
    </section>
  );
}

function Footer({ cvData }) {
  const currentYear = cvData?.footer?.year || new Date().getFullYear();
  return (
    <footer>
      <div className="footer-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', alignItems: 'center' }}>
        <p>© {currentYear} {cvData?.name} • {cvData?.footer?.text || 'Crafted with passion'}</p>
        <p style={{ fontSize: '0.95rem' }}>
          <a href="#privacy-policy" style={{ color: 'var(--accent)', textDecoration: 'none', transition: 'opacity 0.2s', fontWeight: '500' }} onMouseOver={e => e.target.style.opacity = 0.8} onMouseOut={e => e.target.style.opacity = 1}>Privacy Policy</a>
        </p>
      </div>

      <div className="social-links">
        <a href={cvData?.linkedin} target="_blank" rel="noopener noreferrer">💼</a>
        <a href={`mailto:${cvData?.email}`}>📧</a>
        <a href={`tel:${cvData?.phone}`}>📱</a>
      </div>
    </footer>
  );
}

function WhatsAppWidget({ cvData }) {
  const phone = cvData?.phone?.replace(/\D/g, '') || '84962882315';
  const message = encodeURIComponent("Hi Tony, I'm interested in connecting with you!");
  
  const handleWidgetClick = () => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'whatsapp_float_click', {
        event_category: 'Engagement'
      });
    }
  };

  return (
    <a 
      href={`https://api.whatsapp.com/send?phone=${phone}&text=${message}`}
      className="whatsapp-float"
      aria-label="Contact on WhatsApp"
      onClick={handleWidgetClick}
    >
      <span className="tooltip">Chat with me</span>
      <span style={{ fontSize: '1.5rem' }}>💬</span>
    </a>
  );
}

function BlogLoadingSpinner() {
  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      background: 'var(--bg)',
      color: 'var(--text)'
    }}>
      <div className="spinner" style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(255, 255, 255, 0.05)',
        borderTop: '3px solid var(--accent)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase' }}>Decoding Stream...</span>
    </div>
  );
}

function PrivacyPolicy() {
  return (
    <div className="privacy-policy-page" style={{ minHeight: '80vh', paddingTop: '120px', paddingBottom: '100px', maxWidth: '800px', margin: '0 auto', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
      <header style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Privacy Policy</h1>
        <p style={{ color: '#888' }}>Last Updated: May 22, 2026</p>
      </header>
      
      <div className="privacy-content box" style={{ padding: '2.5rem', borderRadius: '12px', background: 'rgba(18, 18, 26, 0.4)', border: '1px solid var(--border-color)', backdropFilter: 'blur(10px)', lineHeight: '1.7' }}>
        <p style={{ marginBottom: '1.5rem' }}>At Tony Do Portfolio (me.tony.do), accessible from https://me.tony.do or https://tony.do, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Tony Do Portfolio and how we use it.</p>
        
        <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>Consent</h2>
        <p style={{ marginBottom: '1.5rem' }}>By using our website, you hereby consent to our Privacy Policy and agree to its terms.</p>
        
        <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>Information We Collect</h2>
        <p style={{ marginBottom: '1.5rem' }}>This website is primarily a personal portfolio. If you choose to contact us directly via WhatsApp, email, or any forms, we may receive additional information about you such as your name, email address, phone number, the contents of the message and/or attachments you may send us, and any other information you may choose to provide.</p>
        
        <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>Log Files</h2>
        <p style={{ marginBottom: '1.5rem' }}>Tony Do Portfolio follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this as part of hosting services' analytics. The information collected by log files includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable. The purpose of the information is for analyzing trends, administering the site, tracking users' movement on the website, and gathering demographic information.</p>
        
        <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>Cookies and Web Beacons</h2>
        <p style={{ marginBottom: '1.5rem' }}>Like any other website, Tony Do Portfolio uses 'cookies'. These cookies are used to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience by customizing our web page content based on visitors' browser type and/or other information.</p>
        
        <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>Google DoubleClick DART Cookie</h2>
        <p style={{ marginBottom: '1.5rem' }}>Google is one of the third-party vendors on our site. It also uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to me.tony.do and other sites on the internet. However, visitors may choose to decline the use of DART cookies by visiting the Google ad and content network Privacy Policy at the following URL: <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>https://policies.google.com/technologies/ads</a></p>
        
        <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>Advertising Partners Privacy Policies</h2>
        <p style={{ marginBottom: '1.5rem' }}>Third-party ad servers or ad networks use technologies like cookies, JavaScript, or Web Beacons that are used in their respective advertisements and links that appear on Tony Do Portfolio, which are sent directly to users' browser. They automatically receive your IP address when this occurs. These technologies are used to measure the effectiveness of their advertising campaigns and/or to personalize the advertising content that you see on websites that you visit.</p>
        <p style={{ marginBottom: '1.5rem' }}>Note that Tony Do Portfolio has no access to or control over these cookies that are used by third-party advertisers.</p>
        
        <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>Third Party Privacy Policies</h2>
        <p style={{ marginBottom: '1.5rem' }}>Tony Do Portfolio's Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective Privacy Policies of these third-party ad servers for more detailed information. It may include their practices and instructions about how to opt-out of certain options.</p>
        
        <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>GDPR and CCPA Data Protection Rights</h2>
        <p style={{ marginBottom: '1.5rem' }}>We want to make sure you are fully aware of all of your data protection rights. Every user is entitled to the following: the right to access, the right to rectification, the right to erasure, the right to restrict processing, the right to object to processing, and the right to data portability. If you make a request, we have one month to respond to you.</p>
      </div>
    </div>
  );
}

function App() {
  const [data, setData] = useState(cvData);
  const [loaded, setLoaded] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [currentView, setCurrentView] = useState('home'); // 'home', 'blog', 'blog-detail', 'privacy-policy'
  const [activeSlug, setActiveSlug] = useState('');
  const [activeArticle, setActiveArticle] = useState(null);

  useEffect(() => {
    if (currentView === 'blog-detail' && activeSlug) {
      const art = (data?.blog || []).find(a => a.slug === activeSlug);
      setActiveArticle(art || null);
    } else {
      setActiveArticle(null);
    }
  }, [currentView, activeSlug, data]);

  // SEO & Meta Tag Management (Dynamic Header Injection & JSON-LD Rich Snippets)
  useEffect(() => {
    const metaDescription = document.querySelector('meta[name="description"]');
    let jsonLdScript = document.getElementById('seo-jsonld');
    
    if (!jsonLdScript) {
      jsonLdScript = document.createElement('script');
      jsonLdScript.id = 'seo-jsonld';
      jsonLdScript.type = 'application/ld+json';
      document.head.appendChild(jsonLdScript);
    }

    // Helper to dynamically inject/update social meta property tags
    const setMetaTag = (attrName, attrVal, content) => {
      let element = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    if (currentView === 'blog-detail' && activeArticle) {
      const pageTitle = `${activeArticle.title} | Tony Do - Tech Leader`;
      const pageDesc = activeArticle.summary || '';
      const pageImg = activeArticle.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3";
      const pageUrl = `https://me.tony.do/#blog/${activeSlug}`;

      document.title = pageTitle;
      if (metaDescription) {
        metaDescription.setAttribute('content', pageDesc);
      }

      // Update Facebook/OpenGraph
      setMetaTag('property', 'og:title', pageTitle);
      setMetaTag('property', 'og:description', pageDesc);
      setMetaTag('property', 'og:image', pageImg);
      setMetaTag('property', 'og:url', pageUrl);
      setMetaTag('property', 'og:type', 'article');

      // Update Twitter Card
      setMetaTag('property', 'twitter:title', pageTitle);
      setMetaTag('property', 'twitter:description', pageDesc);
      setMetaTag('property', 'twitter:image', pageImg);
      setMetaTag('property', 'twitter:url', pageUrl);
      setMetaTag('property', 'twitter:card', 'summary_large_image');
      
      const jsonLdData = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "BlogPosting",
            "headline": activeArticle.title,
            "image": pageImg,
            "datePublished": activeArticle.date,
            "author": {
              "@type": "Person",
              "name": activeArticle.author || "Do Minh Tuan",
              "url": "https://me.tony.do"
            },
            "description": activeArticle.summary
          },
          {
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://me.tony.do/"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Blog",
                "item": "https://me.tony.do/#blog"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": activeArticle.title,
                "item": pageUrl
              }
            ]
          }
        ]
      };
      jsonLdScript.textContent = JSON.stringify(jsonLdData);
    } else if (currentView === 'blog') {
      const pageTitle = "Blog & Technical Insights | Tony Do - Tech Leader";
      const pageDesc = "Read beginner-friendly programming tips, everyday technology tutorials, and high-level business growth hacks by Do Minh Tuan.";
      const pageImg = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3";
      const pageUrl = "https://me.tony.do/#blog";

      document.title = pageTitle;
      if (metaDescription) {
        metaDescription.setAttribute('content', pageDesc);
      }

      // Update Facebook/OpenGraph
      setMetaTag('property', 'og:title', pageTitle);
      setMetaTag('property', 'og:description', pageDesc);
      setMetaTag('property', 'og:image', pageImg);
      setMetaTag('property', 'og:url', pageUrl);
      setMetaTag('property', 'og:type', 'website');

      // Update Twitter Card
      setMetaTag('property', 'twitter:title', pageTitle);
      setMetaTag('property', 'twitter:description', pageDesc);
      setMetaTag('property', 'twitter:image', pageImg);
      setMetaTag('property', 'twitter:url', pageUrl);
      setMetaTag('property', 'twitter:card', 'summary_large_image');
      
      const jsonLdData = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Blog & Technical Insights - Tony Do",
        "description": pageDesc
      };
      jsonLdScript.textContent = JSON.stringify(jsonLdData);
    } else {
      const pageTitle = "Do Minh Tuan - Senior Project Manager & Tech Leader";
      const pageDesc = "Portfolio of Do Minh Tuan - Senior Project Manager with 15+ years experience in Web Development, Mobile Apps, and IT Leadership";
      const pageImg = "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d";
      const pageUrl = "https://me.tony.do";

      document.title = pageTitle;
      if (metaDescription) {
        metaDescription.setAttribute('content', pageDesc);
      }

      // Update Facebook/OpenGraph
      setMetaTag('property', 'og:title', pageTitle);
      setMetaTag('property', 'og:description', pageDesc);
      setMetaTag('property', 'og:image', pageImg);
      setMetaTag('property', 'og:url', pageUrl);
      setMetaTag('property', 'og:type', 'profile');

      // Update Twitter Card
      setMetaTag('property', 'twitter:title', pageTitle);
      setMetaTag('property', 'twitter:description', pageDesc);
      setMetaTag('property', 'twitter:image', pageImg);
      setMetaTag('property', 'twitter:url', pageUrl);
      setMetaTag('property', 'twitter:card', 'summary_large_image');

      const jsonLdData = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Person",
            "name": "Do Minh Tuan",
            "jobTitle": "Senior Project Manager & Tech Leader",
            "url": "https://me.tony.do",
            "sameAs": [
              "http://tony.do/linkedin"
            ],
            "description": "Do Minh Tuan is an experienced Senior Project Manager and COO specializing in Agile software development, technical team leadership, and cloud infrastructures with over 15 years of industry experience."
          },
          {
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What is Do Minh Tuan's core project management methodology?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Do Minh Tuan specializes in Agile and Scrum methodologies. He breaks down complex software engineering projects into 2-week sprint iterations to maintain strict budget controls, mitigate delivery risks, and ensure high-quality, on-time releases."
                }
              },
              {
                "@type": "Question",
                "name": "What technical platforms and architectures does Tony Do have experience managing?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Tony Do has 15+ years of extensive hands-on experience managing PHP, WordPress, Magento, iOS (Xcode), and AWS cloud architectures, leading technical teams from initial product scoping to high-scale production deployments."
                }
              },
              {
                "@type": "Question",
                "name": "What are Tony Do's notable achievements as COO and Technical Director?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "As COO at Finantaged, Tony built the complete IT engineering and creative teams for an AI Fintech product. As Technical Director at StratAgile, he led complex PHP and Mobile teams, directly managing multi-national client portfolios and timeline budgets."
                }
              }
            ]
          }
        ]
      };
      if (jsonLdScript) {
        jsonLdScript.textContent = JSON.stringify(jsonLdData);
      }
    }
  }, [currentView, activeSlug, activeArticle]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#blog/')) {
        const slug = hash.replace('#blog/', '');
        setCurrentView('blog-detail');
        setActiveSlug(slug);
        window.scrollTo(0, 0);
      } else if (hash === '#blog') {
        setCurrentView('blog');
        setActiveSlug('');
        window.scrollTo(0, 0);
      } else if (hash === '#privacy-policy') {
        setCurrentView('privacy-policy');
        setActiveSlug('');
        window.scrollTo(0, 0);
      } else {
        setCurrentView('home');
        setActiveSlug('');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Run on mount

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Page View analytics on Hash Route change
  useEffect(() => {
    if (typeof window.gtag === 'function') {
      const pagePath = window.location.hash || '/';
      const pageTitle = currentView === 'home' 
        ? 'Home Portfolio' 
        : currentView === 'blog' 
          ? 'Blog Feed' 
          : currentView === 'blog-detail' 
            ? `Blog: ${activeSlug}` 
            : 'Privacy Policy';

      window.gtag('event', 'page_view', {
        page_path: pagePath,
        page_title: pageTitle,
        page_location: window.location.href
      });
    }
  }, [currentView, activeSlug]);

  useEffect(() => {
    // Load theme preference
    const savedTheme = localStorage.getItem('tony-theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    fetch('/api/data')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('tony-theme', newTheme);
  };

  useEffect(() => {
    if (loaded) {
      setTimeout(() => {
        gsap.fromTo('.hero-content', { opacity: 0, y: 100 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', delay: 0.3 });
        gsap.fromTo('.hero-orb', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.5, stagger: 0.3, delay: 0.5 });
      }, 100);
    }
  }, [loaded]);

  if (!loaded) return <div style={{background:'#0a0a0f',height:'100vh'}}></div>;

  return (
    <div className="app">
      <Navigation cvData={data} currentView={currentView} />
      
      {currentView === 'home' && (
        <>
          <Hero cvData={data} />
          <About cvData={data} />
          <Experience cvData={data} />
          <Skills cvData={data} />
          <Projects cvData={data} />
          <HiddenWisdomSection />
          <MysteryCards />
          <Contact cvData={data} />
        </>
      )}

      <Suspense fallback={<BlogLoadingSpinner />}>
        {currentView === 'blog' && <BlogFeed cvData={data} />}
        {currentView === 'blog-detail' && <BlogDetail cvData={data} slug={activeSlug} />}
      </Suspense>
      
      {currentView === 'privacy-policy' && <PrivacyPolicy />}

      <Footer cvData={data} />
      <WhatsAppWidget cvData={data} />
      <BackToTop />
      
      <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </div>
  );
}

export default App;
