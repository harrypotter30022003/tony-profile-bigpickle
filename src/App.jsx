import React, { useState, useEffect, useRef } from 'react';
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
    { name: 'Le Duy Hotels', link: 'http://leduyhotel.vn', desc: 'Hotel booking platform', tags: ['WordPress'] }
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

function Navigation({ cvData }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <nav>
      <div className="logo">{cvData?.name || 'Tony'}</div>
      <ul className={`nav-links ${isOpen ? 'active' : ''}`}>
        {['About', 'Experience', 'Skills', 'Projects', 'Contact'].map(item => (
          <li key={item}><a href={`#${item.toLowerCase()}`} onClick={() => setIsOpen(false)}>{item}</a></li>
        ))}
      </ul>
      <div className="mobile-menu" onClick={() => setIsOpen(!isOpen)}>
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
            <div className="avatar-ring"></div>
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
  const icons = ['📊', '📮', '🏥', '🎗️', '🏨'];
  
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
  const [spotlightPos, setSpotlightPos] = useState({ x: 50, y: 50 });
  const [currentQuote, setCurrentQuote] = useState(0);
  const sectionRef = useRef(null);
  const [isActive, setIsActive] = useState(false);

  const handleMouseMove = (e) => {
    if (sectionRef.current) {
      const rect = sectionRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setSpotlightPos({ x, y });
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote(prev => (prev + 1) % hiddenMessages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const spotlightStyle = {
    '--spotlight-x': `${spotlightPos.x}%`,
    '--spotlight-y': `${spotlightPos.y}%`
  };

  return (
    <section 
      className={`darkness-section ${isActive ? 'active' : ''}`}
      ref={sectionRef}
      onMouseEnter={() => setIsActive(true)}
      onMouseLeave={() => setIsActive(false)}
      onMouseMove={handleMouseMove}
      style={spotlightStyle}
    >
      <div className="darkness-overlay">
        <div className="darkness-content">
          <div className="darkness-title">
            <h2>✨ Hidden Wisdom ✨</h2>
            <p>{isActive ? 'Shine your light to reveal the message...' : 'Hover to discover...'}</p>
          </div>
          <div className="spotlight-reveal">
            <div className="reveal-glow"></div>
            <p className="reveal-quote">"{hiddenMessages[currentQuote].quote}"</p>
            <p className="reveal-author">— {hiddenMessages[currentQuote].author}</p>
          </div>
        </div>
      </div>
    </section>
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
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };
  
  return (
    <section id="contact" className="contact-section">
      <div className="section-header">
        <h2>{cvData?.contact?.title || 'Get In Touch'}</h2>
        <p>{cvData?.contact?.subtitle || "Let's create something amazing together"}</p>
      </div>
      <div className="contact-grid">
        {[
          { icon: '📧', title: 'Email', value: cvData?.email, link: `mailto:${cvData?.email}` },
          { icon: '📱', title: 'Phone', value: cvData?.phone, link: `tel:${cvData?.phone}` },
          { icon: '💼', title: 'LinkedIn', value: 'Connect', link: cvData?.linkedin },
          { icon: '📍', title: 'Location', value: cvData?.contact?.location || 'Ho Chi Minh City', link: null }
        ].map((c, i) => (
          <div key={i} className="contact-card">
            <div className="contact-icon">{c.icon}</div>
            <h3>{c.title}</h3>
            <p>{c.link ? <a href={c.link} target="_blank" rel="noopener noreferrer">{c.value}</a> : c.value}</p>
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
      <p>© {currentYear} {cvData?.name} • {cvData?.footer?.text || 'Crafted with passion'}</p>

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
  
  return (
    <a 
      href={`https://wa.me/${phone}?text=${message}`}
      className="whatsapp-float"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact on WhatsApp"
    >
      <span className="tooltip">Chat with me</span>
      <span style={{ fontSize: '1.5rem' }}>💬</span>
    </a>
  );
}

function App() {
  const [data, setData] = useState(cvData);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/data')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

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
      <Navigation cvData={data} />
      <Hero cvData={data} />
      <About cvData={data} />
      <Experience cvData={data} />
      <Skills cvData={data} />
      <Projects cvData={data} />
      <HiddenWisdomSection />
      <MysteryCards />
      <Contact cvData={data} />
      <Footer cvData={data} />
      <WhatsAppWidget cvData={data} />
    </div>
  );
}

export default App;
