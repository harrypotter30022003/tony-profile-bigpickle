import { kv } from '@vercel/kv';

// Active RSS Feeds
const RSS_FEEDS = [
  { name: 'InfoQ Architecture', url: 'https://www.infoq.com/feed/' },
  { name: 'Dev.to Feed', url: 'https://dev.to/feed' },
  { name: 'TechCrunch Startups', url: 'https://techcrunch.com/feed/' }
];

// Target Categories to ensure uniform distribution
const TARGET_CATEGORIES = [
  'Tech Made Simple 💡',
  'Business Hackers 🚀',
  'Future Pulse 🔮',
  'Developer Corner 💻'
];

// Helper to extract tag contents from vanilla RSS XML (handles tag attributes and CDATA)
const extractTag = (xml, tag) => {
  const openTag = `<${tag}>`;
  const closeTag = `</${tag}>`;
  
  const regex = new RegExp(`<${tag}(?:\\s+[^>]*)?>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`, 'i');
  const match = xml.match(regex);
  if (match) {
    let content = match[1].trim();
    if (content.startsWith('<![CDATA[')) {
      content = content.replace('<![CDATA[', '').replace(']]>', '').trim();
    }
    return content;
  }
  return '';
};

// Parse items from XML
const parseRssItems = (xml) => {
  const items = [];
  const itemBlocks = xml.split('<item>');
  for (let i = 1; i < itemBlocks.length; i++) {
    const block = itemBlocks[i].split('</item>')[0];
    const title = extractTag(block, 'title');
    const link = extractTag(block, 'link');
    const desc = extractTag(block, 'description');
    const pubDate = extractTag(block, 'pubDate');
    items.push({ title, link, desc, pubDate });
  }
  return items;
};

// Curated high-res cover image presets per category
const coverImagePresets = {
  'Tech Made Simple 💡': [
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=1200&q=80'
  ],
  'Business Hackers 🚀': [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=1200&q=80'
  ],
  'Future Pulse 🔮': [
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80'
  ],
  'Developer Corner 💻': [
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1605379399642-870262d3d051?auto=format&fit=crop&w=1200&q=80'
  ]
};

// Isolated parallel worker to fetch and rewrite an article for a specific category
async function generateArticleForCategory(item, category, geminiApiKey) {
  const prompt = `You are Do Minh Tuan, an SEO Expert and Senior Tech Leader. Rewrite this tech news article into an original, high-quality, highly engaging 500-600 word blog post tailored to search intent and readability.

Source Details:
- Title: ${item.title}
- Summary: ${item.desc}
- Source: ${item.feedSource}

Your target category is: "${category}". You must output your response in this exact category.

Writing Style Guidelines:
- Tone: Technical Authority yet incredibly friendly, accessible, and exciting for beginners.
- Formatting: Use structured Markdown headers (###), complete sentences, and clean paragraphs.
- Vocabulary: If you introduce a technical term (like API, database replication, server scaling, or Docker), immediately explain it using a simple real-world analogy.
- Specific Sections:
  1. You MUST include a dedicated section titled "### 👨‍💻 Developer Tip" containing practical programming insights, simple React/Node coding advice, or infrastructure best practices related to the topic.
  2. You MUST include a dedicated section titled "### 💼 Business Growth Takeaway" written in plain, jargon-free English explaining how small-to-medium businesses or beginner founders can use this tech/concept to cut budgets, boost sales, or automate operations.

Return your response in this exact JSON schema:
{
  "title": "A highly catchy, SEO-friendly headline matching search intent",
  "slug": "seo-friendly-url-slug-all-lowercase-hyphenated",
  "category": "${category}",
  "summary": "A rich 2-sentence meta description containing keyword phrases to maximize search engine click-through rates.",
  "content": "The full blog post body in Markdown..."
}

JSON Response:`;

  const modelsToTry = [
    { name: 'gemini-flash-latest', version: 'v1beta' },
    { name: 'gemini-2.5-flash', version: 'v1beta' },
    { name: 'gemini-pro-latest', version: 'v1beta' },
    { name: 'gemini-2.5-flash-lite', version: 'v1beta' }
  ];

  let geminiData = null;
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/${model.version}/models/${model.name}:generateContent?key=${geminiApiKey}`;
      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (response.ok) {
        geminiData = await response.json();
        break;
      } else {
        lastError = await response.text();
      }
    } catch (e) {
      lastError = e.message;
    }
  }

  if (!geminiData) {
    throw new Error(`Failed to generate article for ${category}. Last error: ${lastError}`);
  }

  if (!geminiData.candidates || !geminiData.candidates[0] || !geminiData.candidates[0].content || !geminiData.candidates[0].content.parts || !geminiData.candidates[0].content.parts[0]) {
    throw new Error(`Gemini returned invalid structure for ${category}. Response: ${JSON.stringify(geminiData)}`);
  }

  const rawJsonText = geminiData.candidates[0].content.parts[0].text.trim();
  let cleanJson = rawJsonText;
  if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
  }

  const parsed = JSON.parse(cleanJson);
  return {
    parsed,
    originalItem: item
  };
}

export default async function handler(req, res) {
  // Log request metadata
  console.log('Cron UA:', req.headers['user-agent']);

  // 1. Security Authorization Guard
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;
  const isAuthorized =
    req.headers['x-vercel-cron'] === 'true' ||
    req.headers['x-cron'] === 'true' ||
    req.headers['user-agent'] === 'vercel-cron/1.0' ||
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    !process.env.VERCEL; // Always allow local testing

  if (!isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    return res.status(500).json({ error: 'Gemini API Key is not configured in Vercel.' });
  }

  try {
    // 2. Load current blog data
    const cloudData = await kv.get('portfolio_data') || { blog: [] };
    const existingBlog = cloudData.blog || [];
    const existingSlugs = new Set(existingBlog.map(b => b.slug));

    // 3. Crawl XML feeds in parallel to construct a shared un-imported article pool
    const poolPromises = RSS_FEEDS.map(async (feed) => {
      try {
        const feedRes = await fetch(feed.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        if (!feedRes.ok) return [];
        const xmlText = await feedRes.text();
        const items = parseRssItems(xmlText);
        
        return items
          .filter(item => item.title && item.desc)
          .map(item => ({
            ...item,
            feedSource: feed.name,
            slugHash: item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
          }))
          .filter(item => !existingSlugs.has(item.slugHash));
      } catch (err) {
        console.error(`Crawl error on ${feed.name}:`, err.message);
        return [];
      }
    });

    const poolResults = await Promise.all(poolPromises);
    const unImportedPool = poolResults.flat();

    if (unImportedPool.length === 0) {
      return res.status(200).json({ success: true, message: 'All latest feed items are already published!' });
    }

    // 4. Pair un-imported pool items to each of our 4 target categories and execute in parallel
    const workers = [];
    const processedSlugsThisRun = new Set(existingSlugs);

    for (let i = 0; i < TARGET_CATEGORIES.length; i++) {
      const category = TARGET_CATEGORIES[i];
      // Pick a unique item for each category worker
      const item = unImportedPool[i % unImportedPool.length];
      if (item) {
        workers.push(generateArticleForCategory(item, category, geminiApiKey));
      }
    }

    console.log(`Spawning ${workers.length} Parallel AI Workers to write fresh posts...`);
    const results = await Promise.all(workers);

    // 5. Package imported articles and resolve any slug collisions globally
    const newArticles = [];
    results.forEach(({ parsed, originalItem }) => {
      const presetImages = coverImagePresets[parsed.category] || coverImagePresets['Tech Made Simple 💡'];
      const randomImage = presetImages[Math.floor(Math.random() * presetImages.length)];
      
      let proposedSlug = (parsed.slug || originalItem.slugHash).trim();
      let finalSlug = proposedSlug;
      let counter = 1;
      
      // Loop to prevent slug collisions in the existing DB and within this run batch
      while (processedSlugsThisRun.has(finalSlug)) {
        finalSlug = `${proposedSlug}-${counter}`;
        counter++;
      }
      processedSlugsThisRun.add(finalSlug);

      newArticles.push({
        title: parsed.title || originalItem.title,
        slug: finalSlug,
        category: parsed.category,
        image: randomImage,
        date: new Date().toISOString().split('T')[0],
        author: 'Do Minh Tuan',
        summary: parsed.summary || originalItem.desc.substring(0, 150),
        content: parsed.content || originalItem.desc
      });
    });

    // 6. Prepend new batch, self-clean database, and save to Vercel KV
    const mergedBlog = [...newArticles, ...existingBlog];
    const cleanBlogList = [];
    const uniqueSlugs = new Set();
    
    mergedBlog.forEach(post => {
      if (!uniqueSlugs.has(post.slug)) {
        uniqueSlugs.add(post.slug);
        cleanBlogList.push(post);
      }
    });

    cloudData.blog = cleanBlogList;
    await kv.set('portfolio_data', cloudData);

    return res.status(200).json({
      success: true,
      message: `Successfully generated and imported ${newArticles.length} new articles across all categories!`,
      articles: newArticles.map(a => ({ title: a.title, category: a.category, slug: a.slug }))
    });

  } catch (e) {
    console.error('Parallel Cron Execution Error:', e);
    return res.status(500).json({ error: 'Internal Server Error', details: e.message });
  }
}