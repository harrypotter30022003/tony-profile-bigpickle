import fs from 'fs';
import path from 'path';
import { kv } from '@vercel/kv';

const DATA_FILE = path.join(process.cwd(), 'src/admin/data.json');

const defaultCvData = {
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
  certifications: [{ name: 'IELTS', score: '7.5', issuer: 'British Council' }],
  blog: []
};

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600');

  let portfolioData = defaultCvData;

  try {
    if (process.env.VERCEL && process.env.KV_REST_API_URL) {
      try {
        const cloudData = await kv.get('portfolio_data');
        if (cloudData) {
          portfolioData = cloudData;
        }
      } catch (kvError) {
        console.error('Summary: KV fetch failed, falling back to disk:', kvError);
      }
    }

    if (portfolioData === defaultCvData) {
      try {
        if (fs.existsSync(DATA_FILE)) {
          const fileData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
          if (fileData) {
            portfolioData = fileData;
          }
        }
      } catch (fsError) {
        console.error('Summary: Disk read failed, using default data:', fsError);
      }
    }
  } catch (err) {
    console.error('Summary endpoint error:', err);
  }

  // Map clean, lightweight representation specifically optimized for LLM contextual tokens
  const llmFriendlyOutput = {
    professional_profile: {
      candidate_name: portfolioData.name || 'Do Minh Tuan',
      primary_title: portfolioData.title || 'Senior Project Manager & Tech Leader',
      summary_introduction: portfolioData.summary,
      contact_channels: {
        email: portfolioData.email,
        phone: portfolioData.phone,
        linkedin: portfolioData.linkedin,
        portfolio_url: 'https://me.tony.do'
      }
    },
    core_technical_skills: portfolioData.skills,
    career_milestones: portfolioData.experience ? portfolioData.experience.map(exp => ({
      organization: exp.company,
      role: exp.position,
      duration: exp.period,
      notable_achievements: exp.highlights
    })) : [],
    notable_projects: portfolioData.projects ? portfolioData.projects.map(proj => ({
      project_name: proj.name,
      platform_link: proj.link,
      description: proj.desc,
      technologies_used: proj.tags
    })) : [],
    education_and_certifications: {
      formal_education: portfolioData.education,
      credentials: portfolioData.certifications
    },
    technical_insights_blog_posts: portfolioData.blog ? portfolioData.blog.map(post => ({
      title: post.title,
      category: post.category,
      date_published: post.date,
      estimated_read_time: `${Math.ceil((post.content ? post.content.split(/\s+/).length : 0) / 200)} min read`,
      article_summary: post.summary,
      canonical_url: `https://me.tony.do/#blog/${post.slug}`
    })) : []
  };

  return res.status(200).json(llmFriendlyOutput);
}
