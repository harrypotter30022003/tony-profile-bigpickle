import { kv } from '@vercel/kv';

// Active RSS Feeds
const RSS_FEEDS = [
  { name: 'InfoQ Architecture', url: 'https://www.infoq.com/feed/' },
  { name: 'Dev.to Feed', url: 'https://dev.to/feed' },
  { name: 'TechCrunch Startups', url: 'https://techcrunch.com/feed/' }
];

// Helper to extract tag contents from vanilla RSS XML
const extractTag = (xml, tag) => {
  const openTag = `<${tag}>`;
  const closeTag = `</${tag}>`;
  if (!xml.includes(openTag)) {
    const regex = new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : '';
  }
  const start = xml.indexOf(openTag) + openTag.length;
  const end = xml.indexOf(closeTag, start);
  let content = xml.substring(start, end).trim();
  if (content.startsWith('<![CDATA[')) {
    content = content.replace('<![CDATA[', '').replace(']]>', '').trim();
  }
  return content;
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

// Curated high-res cover image presets per category to guarantee visual appeal
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

export default async function handler(req, res) {
  // 1. Security Authorization Guard
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;
  const isAuthorized =
    req.headers['x-vercel-cron'] === 'true' ||
    req.headers['x-cron'] === 'true' ||
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    !process.env.VERCEL; // Always allow local testing

  if (!isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Use the secured Gemini Key from Vercel Environment Variables
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    return res.status(500).json({ error: 'Gemini API Key is not configured in Vercel environment variables.' });
  }

  try {
    // 2. Load current blog data to evaluate category distribution and prevent duplication
    const cloudData = await kv.get('portfolio_data') || { blog: [] };
    const existingBlog = cloudData.blog || [];
    const existingSlugs = new Set(existingBlog.map(b => b.slug));

    // Calculate category distribution
    const counts = {
      'Tech Made Simple 💡': 0,
      'Business Hackers 🚀': 0,
      'Future Pulse 🔮': 0,
      'Developer Corner 💻': 0
    };
    existingBlog.forEach(post => {
      if (counts[post.category] !== undefined) {
        counts[post.category]++;
      }
    });

    // Determine target category with the lowest counts (Self-Balancing Logic)
    let targetCategory = 'Tech Made Simple 💡';
    let minCount = Infinity;
    Object.entries(counts).forEach(([cat, count]) => {
      if (count < minCount) {
        minCount = count;
        targetCategory = cat;
      }
    });

    // 3. Fetch from RSS Feeds
    let chosenItem = null;
    let feedSource = '';
    
    // Shuffle feeds to ensure rotation variety
    const shuffledFeeds = [...RSS_FEEDS].sort(() => 0.5 - Math.random());
    
    for (const feed of shuffledFeeds) {
      try {
        const feedRes = await fetch(feed.url);
        if (!feedRes.ok) continue;
        const xmlText = await feedRes.text();
        const items = parseRssItems(xmlText);
        
        // Find the first item that we haven't already published
        for (const item of items) {
          const possibleSlug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          if (!existingSlugs.has(possibleSlug) && item.title && item.desc) {
            chosenItem = item;
            feedSource = feed.name;
            break;
          }
        }
        if (chosenItem) break;
      } catch (e) {
        console.error(`Error parsing feed ${feed.name}:`, e);
      }
    }

    if (!chosenItem) {
      return res.status(200).json({ success: true, message: 'All latest feed items are already published!' });
    }

    // 4. Invoke Google Gemini 1.5 Flash to write original SEO content
    const prompt = `You are Do Minh Tuan, an SEO Expert and Senior Tech Leader. Rewrite this tech news article into an original, high-quality, highly engaging 500-600 word blog post tailored to search intent and readability.

Source Details:
- Title: ${chosenItem.title}
- Summary: ${chosenItem.desc}
- Source: ${feedSource}

Your target category for self-balancing is: "${targetCategory}". You must output your response in this exact category.

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
  "category": "${targetCategory}",
  "summary": "A rich 2-sentence meta description containing keyword phrases to maximize search engine click-through rates.",
  "content": "The full blog post body in Markdown..."
}

JSON Response:`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      return res.status(500).json({ error: 'Gemini API Error', details: errText });
    }

    const geminiData = await geminiResponse.json();
    const rawJsonText = geminiData.candidates[0].content.parts[0].text.trim();
    const generatedArticle = JSON.parse(rawJsonText);

    // 5. Populate cover image and fallback defaults
    const presetImages = coverImagePresets[targetCategory] || coverImagePresets['Tech Made Simple 💡'];
    const randomImage = presetImages[Math.floor(Math.random() * presetImages.length)];
    
    const newArticle = {
      title: generatedArticle.title || chosenItem.title,
      slug: generatedArticle.slug || chosenItem.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      category: generatedArticle.category || targetCategory,
      image: randomImage,
      date: new Date().toISOString().split('T')[0],
      author: 'Do Minh Tuan',
      summary: generatedArticle.summary || chosenItem.desc.substring(0, 150),
      content: generatedArticle.content || chosenItem.desc
    };

    // 6. Prepend new article to the database list and save
    existingBlog.unshift(newArticle);
    cloudData.blog = existingBlog;
    await kv.set('portfolio_data', cloudData);

    return res.status(200).json({
      success: true,
      message: `Successfully generated and imported new article!`,
      article: {
        title: newArticle.title,
        category: newArticle.category,
        slug: newArticle.slug
      }
    });

  } catch (e) {
    console.error('Cron Execution Error:', e);
    return res.status(500).json({ error: 'Internal Server Error', details: e.message });
  }
}