import fs from 'fs';
import path from 'path';
import { kv } from '@vercel/kv';

const DATA_FILE = path.join(process.cwd(), 'src/admin/data.json');

const defaultBlogArticles = [
  {
    "title": "Building High-Performance Tech Teams in Vietnam: A Senior PM's Blueprint for 2026",
    "slug": "building-high-performance-tech-teams-vietnam-blueprint",
    "date": "2026-06-01",
    "author": "Do Minh Tuan",
    "category": "Business Hackers 🚀",
    "summary": "Drawing on 15+ years of experience leading Vietnamese tech teams, this blueprint covers hiring, retaining talent, Agile delivery, and scaling startups in Vietnam's booming tech ecosystem.",
    "image": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
    "content": "Vietnam's tech industry is growing at an unprecedented pace. With over 530,000 developers, a thriving startup ecosystem, and global tech giants setting up engineering hubs in Ho Chi Minh City, Hanoi, and Danang, the demand for skilled project managers and tech leaders has never been higher. But building a high-performance team in Vietnam comes with unique challenges: cultural nuances, talent retention, and bridging the gap between local execution and global expectations.\n\nOver my 15+ years leading teams at StratAgile, CoffeeMug, and Finantaged, I've developed a blueprint that works specifically for Vietnamese tech teams. Here is what I have learned about shipping products successfully in this market.\n\n### 1. Hiring for Attitude, Training for Skill\nIn Vietnam's competitive talent market, you cannot afford to hire purely for technical credentials. The best engineers I have worked with were not the ones with the longest resumes — they were the ones who showed intellectual curiosity and ownership mentality.\n\nWhen hiring, I prioritize three traits above all else:\n- **Communication clarity**: Can they explain a technical problem in simple terms?\n- **Learning velocity**: Do they pick up new tools and frameworks quickly on their own?\n- **Ownership**: When something breaks, do they hide or do they fix?\n\nTechnical skills can be taught in weeks. Attitude takes years to change.\n\n### 2. Retaining Talent Beyond Salary\nVietnamese developers are among the most sought-after in Southeast Asia. Global remote opportunities mean your best engineers get pinged by recruiters on LinkedIn daily. To retain them, salary alone is not enough.\n\nWhat actually works:\n- **Clear career progression paths**: Engineers need to see where they will be in 2 years. Define Senior, Lead, and Architect tracks explicitly.\n- **Meaningful project ownership**: Give them real problems to solve, not just tickets to close.\n- **Learning budgets**: Allocate monthly stipends for courses, conferences, and certifications.\n- **Flexible working**: Trust-based remote or hybrid policies. Vietnamese knowledge workers value flexibility as much as compensation.\n\n### 3. Agile Delivery in the Vietnamese Context\nAgile methodologies work in Vietnam, but they must be adapted. The typical challenge I have seen is that Vietnamese teams can be reluctant to push back on unrealistic deadlines during sprint planning — a cultural tendency to say 'yes' to authority.\n\nThe fix is psychological safety. Create a culture where developers can estimate honestly without fear. Use anonymous planning poker. Celebrate accurate estimates, not just early deliveries. Over six months, the quality of your sprint planning will dramatically improve.\n\n### 4. Scaling Teams Without Breaking Culture\nScaling from 5 to 30 engineers is where most Vietnamese tech companies fail. The bottleneck is rarely technical — it is almost always about communication overhead and cultural dilution.\n\nMy approach:\n- **Divide into squads of 4-6**: Each squad owns a clear domain (payments, user onboarding, analytics).\n- **Weekly demo Fridays**: Every squad presents what they shipped. This creates healthy peer accountability.\n- **Pair senior with junior**: Every senior engineer mentors one junior. This multiplies your leadership capacity.\n\n### 👨‍💻 Developer Tip\nWhen setting up CI/CD pipelines for Vietnamese teams, invest in automation early. Vietnamese developers are quick to adopt tools like GitHub Actions and Vercel. Automate linting, testing, and deployment from day one. This reduces the cognitive load of manual processes and lets your team focus on what matters: building great features.\n\n### 💼 Business Growth Takeaway\nVietnam's tech talent is a competitive advantage if managed well. The companies that invest in structured onboarding, clear career paths, and genuine engineering culture will attract the top 10% of talent. In 2026, with global tech hiring slowing down, now is the perfect time to build your engineering hub in Vietnam — the talent is world-class and the cost structure is favorable compared to Singapore or the US."
  },
  {
    "title": "How to Save 5 Hours Every Week: 5 Free AI Tools Anyone Can Use",
    "slug": "save-hours-free-ai-tools-beginners",
    "date": "2026-05-15",
    "author": "Do Minh Tuan",
    "category": "Tech Made Simple 💡",
    "summary": "A plain-English guide to using free AI tools for beginners to automate writing, designing, scheduling, and repetitive everyday tasks.",
    "image": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    "content": "Artificial Intelligence is no longer just for software engineers and sci-fi movies. Today, AI can act as your personal assistant, saving you hours of work every single week. Best of all, these tools are completely free and require absolutely zero coding knowledge to get started.\n\n### 1. ChatGPT: Your Personal Ghostwriter\nWriting emails, creating meeting summaries, or drafting social media posts often takes up hours of our week. ChatGPT can do this in seconds. Think of ChatGPT as a very fast assistant. To get the best results, give it a clear role: 'Act as a professional copywriter and rewrite this email to make it more polite.'\n\n### 2. Gamma App: Instant Presentations\nNeed to create a presentation for a client or a team meeting? Gamma App uses AI to generate beautiful, structured slideshows, document pages, or webpage mockups in under a minute. You just type in your topic, select a color scheme, and the AI builds it for you.\n\n### 3. Canva Magic Studio: Design Made Easy\nCreating graphics for your small business doesn't require complex software like Photoshop. Canva's built-in AI tools let you erase unwanted objects from photos, generate custom images from a text description, and resize designs instantly.\n\n### 4. Otter.ai: Automatic Meeting Transcripts\nStop wasting time typing notes during meetings. Otter.ai joins your video calls, records the audio, transcribes every word, and automatically emails you a bulleted summary of the key takeaways and action items.\n\n### 5. Goblin Tools: Break Down Hard Tasks\nIf you struggle with organizing a massive project, Goblin Tools is a lifesaver. You type in a major goal (like 'Build a website' or 'Clean the office'), and the AI breaks it down into tiny, manageable checkboxes so you never feel overwhelmed.\n\n### 👨‍💻 Developer Tip\nIf you are building your own tools, you can integrate these AI capabilities into your applications using the official OpenAI or Gemini APIs with standard JavaScript fetch requests. Always handle api key parameters in your Vercel environment variables rather than client-side code to avoid exposing secrets.\n\n### 💼 Business Growth Takeaway\nFor business owners, your time is your most expensive resource. If you can save 5 hours per week by using AI to automate email drafts and meeting notes, you gain over 240 hours of productive business-building time every single year. Encourage your team to experiment with these tools to cut operational bottlenecks."
  },
  {
    "title": "Choosing a Website Platform: A Simple Guide for Small Business Owners",
    "slug": "choosing-website-platform-small-business",
    "date": "2026-05-10",
    "author": "Do Minh Tuan",
    "category": "Business Hackers 🚀",
    "summary": "WordPress, Shopify, or Wix? We compare the website builders for beginners and small businesses to help you launch cheap and secure.",
    "image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    "content": "For any modern business, a website is your virtual storefront. It is the first place potential clients check to see if you are legitimate. However, many business owners get stuck choosing a platform, or worse, spend thousands of dollars on a custom system they don't actually need. Let's break down the best options for beginners in plain language.\n\n### 1. WordPress: The Flexible Powerhouse\nWordPress powers over 43% of all websites on the internet. It is highly customizable, excellent for SEO (search engine rankings), and has thousands of free plugins to add features. However, it requires a little bit of setup and manual maintenance (like updating plugins and backing up your database).\n\n### 2. Wix: The Visual Drag-and-Drop\nIf you have zero technical skills and want a website live by tonight, Wix is a fantastic choice. You can drag and drop text, images, and maps exactly where you want them. However, it can become expensive as your site grows, and moving your site to another platform later is very difficult.\n\n### 3. Shopify: The Ultimate Online Shop\nIf your main goal is to sell physical or digital products online, don't overthink it—use Shopify. It handles secure credit card payments, shipping labels, and inventory automatically. It is extremely secure and handles high traffic with ease, letting you focus on selling instead of server maintenance.\n\n### 👨‍💻 Developer Tip\nWhen setting up client sites on WordPress, always utilize a child theme and keep custom code separated from parent templates. For extreme performance, configure page-caching plugins like LiteSpeed Cache and deliver your media assets globally using a free CDN like Cloudflare.\n\n### 💼 Business Growth Takeaway\nStart small. You do not need a custom-coded website costing $5,000 when starting out. Build a simple 3-page site on Wix or WordPress for under $100. Once your business is validated and making sales, you can reinvest that revenue to hire a developer to build a high-performance system like React/Next.js."
  },
  {
    "title": "AI in Project Management: Can Chatbots Help Run Your Team?",
    "slug": "ai-project-management-chatbots-run-team",
    "date": "2026-05-08",
    "author": "Do Minh Tuan",
    "category": "Business Hackers 🚀",
    "summary": "Can AI replace a Project Manager? Learn how beginners and non-technical business leaders can use simple tools like Trello and AI to stay organized.",
    "image": "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80",
    "content": "Running a project—whether it is building an app, launching a product, or opening a restaurant—requires keeping track of a hundred moving parts. Many non-technical founders struggle to manage their teams without spending massive hours in status meetings. Let's look at how simple AI can make task-tracking easy.\n\n### What is Agile and Scrum? (Simply Explained)\nAgile is not a complex code pattern; it is just a way of working. Instead of trying to build everything at once, you break your project into 2-week blocks called 'sprints'. At the end of each block, you review what was built. This stops you from spending 6 months building something nobody actually wants.\n\n### How AI Speeds Up Your Team\nModern project tools like Trello, Jira, or Monday.com now have AI built right in. \n- **Auto-drafting tasks**: Tell the AI 'Create a list of steps to set up our payment system,' and it will automatically generate detailed cards.\n- **Risk Prediction**: AI can look at your team's velocity and warn you if you are going to miss a deadline, letting you adjust early.\n\n### 👨‍💻 Developer Tip\nWhen designing workflow automations, use webhook hooks in Jira to automatically post updates in Slack when a pull-request is merged in GitHub. This reduces human administrative errors and speeds up release cycles.\n\n### 💼 Business Growth Takeaway\nYou don't need a massive management team. By teaching your existing staff to use basic Agile tools with AI, you can double your output, track precisely where every dollar is going, and avoid missed deadlines that cost valuable clients."
  },
  {
    "title": "Why is My Website Slow? The Non-Coder's Guide to Speeding Up Your Pages",
    "slug": "why-website-slow-non-coder-guide",
    "date": "2026-05-05",
    "author": "Do Minh Tuan",
    "category": "Developer Corner 💻",
    "summary": "Is a slow page hurting your Google rankings and costing you sales? Learn the common website bottlenecks and simple fixes that don't require coding.",
    "image": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    "content": "Did you know that 53% of mobile visitors will leave a website if it takes longer than 3 seconds to load? A slow website doesn't just frustrate your users; it actually pushes your business down in Google's search rankings, costing you free traffic.\n\n### The Three Biggest Slowdown Culprits\n1. **Massive Images**: Pushing high-res raw images straight from your camera to your website is the #1 slowdown cause. Always compress images first.\n2. **Lack of Caching**: Without caching, your server has to build the page from scratch for every single visitor. Caching stores a pre-built copy, serving it instantly.\n3. **Unoptimized Plugins**: Having too many complex features running at once will bog down even the strongest web servers.\n\n### 👨‍💻 Developer Tip\nTo achieve a 100/100 Lighthouse performance score in React/Vite: lazy load heavy route components, utilize dynamic media formats like WebP or Avif instead of png, and execute DOM styling updates directly via CSS variables (e.g. currentStyle.setProperty) to achieve smooth 60fps animations.\n\n### 💼 Business Growth Takeaway\nPage speed is directly tied to cash flow. If your website takes 5 seconds to load, you might be losing half your potential clients before they even see your product. Speeding up your site is one of the easiest ways to immediately increase your conversion rates and organic Google traffic."
  },
  {
    "title": "What is Green Cloud Computing? How Optimizing Servers Saves Your Wallet",
    "slug": "green-cloud-computing-save-money-planet",
    "date": "2026-05-01",
    "author": "Do Minh Tuan",
    "category": "Future Pulse 🔮",
    "summary": "Did you know servers produce more CO2 emissions than the airline industry? Learn how optimizing web structures saves the planet and cuts server bills.",
    "image": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
    "content": "When we upload photos or run apps, we think of the 'cloud' as an abstract, weightless place. In reality, the cloud runs on massive physical data centers packed with thousands of hot servers running 24/7. These centers draw huge amounts of electricity and produce massive carbon footprints.\n\n### Why Green Tech is Great for Business\nSustainable tech isn't just about charity; it is directly tied to your company's expenses. Optimizing your website's server structure means your server works less, draws less power, and requires smaller hosting plans.\n- **Auto-Scaling**: Only run extra servers when traffic is high, shutting them down during quiet hours.\n- **Static Site Delivery**: Pre-rendering pages and serving them via CDNs reduces server compute cycles to practically zero.\n\n### 👨‍💻 Developer Tip\nAlways build serverless or static sites (like using Vite, Astro, or Next.js static exports) and deploy them on edge networks. Edge computing runs code closer to the user, drastically lowering global carbon footprints and database latency.\n\n### 💼 Business Growth Takeaway\nGoing green saves green. Implementing automated scaling and static structures on AWS or Vercel can slash your monthly web hosting fees by up to 30%. Show your customers that your business is forward-thinking and climate-aware, which is a massive marketing selling point for modern millennial and Gen Z clients."
  }
];

export default async function handler(req, res) {
  // Set strict headers to bypass browser, CDN, and edge server caching
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');

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

          // Auto-upgrade projects: Replace Le Duy Hotels with EZ Fast Tech case study in Vercel KV database
          if (merged.projects) {
            let updatedProjects = false;
            merged.projects = merged.projects.map(proj => {
              if (proj.name === 'Le Duy Hotels' || proj.link.includes('leduyhotel.vn')) {
                updatedProjects = true;
                return {
                  name: "EZ Fast Tech",
                  link: "https://ezfasttech.com",
                  desc: "SEO web design & bespoke software development platform for SMEs",
                  tags: ["WordPress", "SEO", "React"]
                };
              }
              return proj;
            });
            if (updatedProjects) {
              needsKvSave = true;
            }
          }

          // Auto-upgrade projects: Add Wizard Chess if missing in Vercel KV
          if (merged.projects) {
            const hasChess = merged.projects.some(p => p.name === 'Wizard Chess' || p.link.includes('chess.tony.do'));
            if (!hasChess) {
              merged.projects.push({
                name: "Wizard Chess",
                icon: "♟️",
                link: "https://chess.tony.do",
                desc: "Harry Potter style wizard chess game built with Firebase Auth, Cloud Firestore, and Stockfish Online API (with random local fallback).",
                tags: ["Firebase", "Firestore", "AI Engine", "CI/CD"]
              });
              needsKvSave = true;
            }
          }

          // Auto-upgrade database schema: Merge our new 5 traffic articles and filter out old categoryless placeholders
          if (!merged.blog || merged.blog.length === 0) {
            merged.blog = defaultBlogArticles;
            needsKvSave = true;
          } else {
            const existingSlugs = new Set((merged.blog || []).map(b => b.slug));
            let addedSeeds = false;
            
            defaultBlogArticles.forEach(seed => {
              if (!existingSlugs.has(seed.slug)) {
                merged.blog.unshift(seed);
                addedSeeds = true;
              }
            });

            const originalLength = merged.blog.length;
            // Clean out old pre-category placeholders
            merged.blog = merged.blog.filter(post => 
              post.category && 
              post.image && 
              post.slug !== 'maximizing-roi-agile-methodologies' &&
              post.slug !== 'scaling-web-infrastructure-best-practices' &&
              post.slug !== 'art-remote-team-leadership-tech'
            );

            if (addedSeeds || merged.blog.length !== originalLength) {
              needsKvSave = true;
            }
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
