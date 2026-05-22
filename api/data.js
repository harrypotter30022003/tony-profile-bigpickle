import fs from 'fs';
import path from 'path';
import { kv } from '@vercel/kv';

const DATA_FILE = path.join(process.cwd(), 'src/admin/data.json');

const defaultBlogArticles = [
  {
    "title": "Maximizing ROI: Agile Methodologies for Modern Project Teams",
    "slug": "maximizing-roi-agile-methodologies",
    "date": "2026-05-15",
    "author": "Do Minh Tuan",
    "summary": "Discover how project managers can adapt Agile principles to control budgets, optimize resources, and deliver massive ROI in software development.",
    "content": "Agile software development is no longer just a trend; it is the industry standard for delivering high-quality products efficiently. As a Senior Project Manager with over 15 years of experience, I have witnessed firsthand how Agile, when executed correctly, can dramatically improve ROI (Return on Investment) for software teams.\n\n### The Shift from Waterfall to Agile\nHistorically, software projects relied on the Waterfall model—a sequential phase approach. While Waterfall provides clear structures, it often fails in dynamic environments where requirements evolve. Agile shifts the focus to iterative progress and collaborative execution. This flexibility allows project managers to adapt to feedback quickly, ensuring that the final product matches market demands.\n\n### Controlling Timelines and Budgets\nOne common myth is that Agile makes budget tracking difficult because scopes are fluid. In reality, Agile allows for precise budget control by utilizing fixed sprints and resource allocations. Each sprint (typically 2 weeks) has a specific cost based on developer hours. By prioritizing high-value features in the early sprints, we ensure that even if the budget runs tight, the core product (MVP) is fully functional and delivers value immediately.\n\n### Scaling Teams Safely\nWhen managing team sizes of up to 30+ developers across different projects, clear delegation is crucial. Implementing frameworks like Scrum or Kanban helps visualize tasks, resolve bottlenecks, and maintain high standards without micromanagement. Daily standups keep the team aligned, while sprint retrospectives foster a culture of continuous improvement.\n\n### Deliver Value on Time\nUltimately, project management is about delivery. An Agile team can release incremental updates, which means stakeholders can see progress in real-time. This reduces the risk of large-scale project failure and builds solid trust between developers, project managers, and clients."
  },
  {
    "title": "Scaling Web Infrastructure: Best Practices for High-Traffic Applications",
    "slug": "scaling-web-infrastructure-best-practices",
    "date": "2026-05-10",
    "author": "Do Minh Tuan",
    "summary": "An in-depth look at LAMP stack scaling, AWS infrastructure, and caching mechanisms to build responsive and robust web applications.",
    "content": "Building a web application that handles thousands of concurrent requests requires a strategic approach to infrastructure. From standard LAMP (Linux, Apache, MySQL, PHP) setups to cloud-based serverless systems, scaling is about removing single points of failure.\n\n### 1. Database Optimization\nIn most web applications, the database is the primary bottleneck. Unoptimized queries and lack of indexing can bring down powerful servers. \n- **Query Indexing:** Ensure frequently searched columns are indexed properly.\n- **Read/Write Splitting:** Set up replication with a master database for writes and multiple replicas for reads to balance the load.\n- **Object Caching:** Use tools like Redis or Memcached to store heavy database query results, drastically reducing server load.\n\n### 2. Load Balancing on AWS\nDeploying on AWS (Amazon Web Services) provides excellent scalability options. Utilizing an Application Load Balancer (ALB) lets you distribute traffic across multiple EC2 instances. Combining ALB with Auto Scaling Groups ensures that if traffic spikes, new instances are automatically spun up, and then scaled down when the surge passes, optimizing server costs.\n\n### 3. Edge Delivery via CDN\nStatic assets (images, stylesheets, scripts) shouldn't consume your server's bandwidth. Deploying a CDN (Content Delivery Network) like Cloudflare or AWS CloudFront caches these assets globally, delivering them from edge servers closest to your users. This speeds up page load times and cuts server hosting fees.\n\n### 4. Security Practices\nScaling also means securing your platform. Implementing HTTPS/SSL certificates, protecting against DDoS attacks with Cloudflare, and running regular security audits on your Linux servers (CentOS/Ubuntu) are vital steps to ensure 99.9% uptime and keep user data secure."
  },
  {
    "title": "The Art of Remote Team Leadership in Tech",
    "slug": "art-remote-team-leadership-tech",
    "date": "2026-05-01",
    "author": "Do Minh Tuan",
    "summary": "Leading engineering teams remotely requires more than just Zoom meetings. Learn how to foster collaboration, maintain high standards, and scale culture.",
    "content": "Managing engineering teams is complex; managing them remotely across multiple timezones takes deliberate strategy. Over the last decade, remote and hybrid work has become standard. Having led teams across Southeast Asia and internationally, I've refined a remote leadership playbook that focuses on clarity, trust, and output.\n\n### 1. Asynchronous Communication\nConstant video meetings create burnout. Emphasizing written clarity is the first step to successful remote management. Utilizing platforms like Jira, Slack, and Confluence allows engineers to work productively without constant interruptions. Every project requirement must be documented in detail to prevent ambiguity.\n\n### 2. Trust Over Presence\nMeasuring developer productivity by \"hours online\" is an outdated and toxic approach. Instead, focus on clear milestones and outputs. In Agile, velocity metrics and completed ticket points provide an accurate measure of progress. Trusting your team to manage their own schedules boosts morale and creates a positive, self-driven work culture.\n\n### 3. Interactive Code Reviews\nRemote work can isolate developers, leading to divergent code quality. Implementing structured, collaborative Pull Request (PR) processes keeps the codebase clean and acts as an educational tool for junior engineers. Tools like GitHub allow for inline code comments, encouraging constructive technical debates.\n\n### 4. Continuous Integration/Deployment (CI/CD)\nAutomation is the ultimate trust builder in remote teams. A reliable CI/CD pipeline (using GitHub Actions, Vercel, or Jenkins) ensures that whenever a remote developer pushes code, automated tests run instantly. This prevents broken builds, guarantees high quality, and allows teams to deploy new features safely from anywhere in the world."
  }
];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Try Vercel KV if on Vercel
    if (process.env.VERCEL && process.env.KV_REST_API_URL) {
      try {
        const cloudData = await kv.get('portfolio_data');
        if (cloudData) {
          let merged = { ...cloudData };
          let needsKvSave = false;

          if (!merged.blog || merged.blog.length === 0) {
            merged.blog = defaultBlogArticles;
            needsKvSave = true;
          }

          // If we merged new seed data, save it back to Vercel KV permanently
          if (needsKvSave) {
            try {
              await kv.set('portfolio_data', merged);
            } catch (writeErr) {
              console.error('Error auto-persisting merged schema to KV:', writeErr);
            }
          }

          return res.status(200).json(merged);
        }
      } catch (kvError) {
        console.error('KV Error:', kvError);
      }
    }

    // 2. Fallback to Local File
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      if (!data.blog || data.blog.length === 0) {
        data.blog = defaultBlogArticles;
      }
      return res.status(200).json(data);
    }

    // 3. Default Initial Data
    res.status(200).json({
      name: 'Do Minh Tuan',
      title: 'Senior Project Manager',
      phone: '+84 96 288 2315',
      hero: { greeting: 'Welcome to my universe' },
      experience: [],
      skills: {},
      projects: [],
      blog: defaultBlogArticles,
      footer: { text: 'Crafted with passion', year: '2026' }
    });
  } catch (e) {
    res.status(200).json({ error: 'Fallback', name: 'Tony', blog: defaultBlogArticles });
  }
}
