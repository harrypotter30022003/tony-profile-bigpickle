// Shared serverless helpers.
// Imported by data.js to provide RSS, comments, and reactions without consuming
// additional Vercel serverless function slots (Hobby plan limit: 12).

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { kv } from '@vercel/kv';

const DATA_FILE = path.join(process.cwd(), 'src/admin/data.json');

export const defaultBlogArticles = [
  {
    "title": "What I Got Wrong About Managing Vietnamese Engineers (And How I Fixed It)",
    "slug": "building-high-performance-tech-teams-vietnam-blueprint",
    "date": "2026-06-01",
    "author": "Do Minh Tuan",
    "version": 2,
    "category": "Business Hackers 🚀",
    "summary": "After 15 years leading tech teams in Vietnam, here's what I wish someone had told me on day one about hiring, retention, and the cultural dynamics nobody warns you about.",
    "image": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
    "content": "Six years ago I made a hire that cost my team three months of lost productivity. The candidate had a perfect CV — top university, GitHub full of side projects, nailed the technical interview. Three weeks in, it was obvious: he could write code, but he couldn't ship. He'd disappear for half a day when something broke. Refused to talk to the QA team. Eventually left for a 15% raise and a better title.\n\nThat hire taught me more than any management book. Everything I'm sharing here came from screwing it up first.\n\nThe Vietnamese tech market is not what it was in 2015. Back then, you could hire decent React developers for $1,500/month. Today, the same person costs $3,000-4,000 if they're any good, and they're getting five LinkedIn messages a day from recruiters in Singapore, Australia, and the US. The talent is excellent — Vietnam produces world-class engineers — but the market is brutally competitive. If you treat your team like interchangeable resources, they'll be gone in six months.\n\nHere's what actually works after 15 years of doing this.\n\n**Hire for hunger, not credentials.**\n\nI stopped reading CVs after the first line. Instead, I ask one question in every interview: \"Tell me about the last time you built something nobody asked you to build.\" If they light up and start talking for ten minutes about a side project, a hackathon, a weekend experiment — that's the person. If they stare blankly, pass. Technical skills can be taught in a month. Genuine curiosity takes a lifetime to develop.\n\nThe other question I always ask: \"What did you hate about your last job?\" Listen for blame (\"my manager was terrible\") versus self-awareness (\"I wasn't a good fit for that environment\"). Blamers stay blamers. Self-aware people grow.\n\n**Money matters, but it's not first.**\n\nA friend running a 50-person team in Da Nang told me his retention rate jumped from 60% to 88% in one year when he stopped focusing on salary and started focusing on three things: clear career ladders, real ownership, and time to learn.\n\nCareer ladders sound boring until you realize most Vietnamese tech companies don't have them. \"Senior developer\" means different things at different companies. Write it down. Make it transparent. Show people what they need to do to get to Staff, to Principal, to Architect. Without this, your best people will leave for a title bump they could get anywhere.\n\nOwnership means giving someone a real problem, not a Jira ticket. Instead of \"build the checkout page,\" try \"our checkout conversion dropped 8% last month — figure out why and fix it.\" The first is a task. The second is a mission. People stay for missions.\n\nLearning time sounds like a luxury. It's not. One afternoon a week where your engineers can learn something new — a new framework, a new tool, whatever they want — pays for itself in retention within six months. I've watched teams save entire sprints because someone learned about a new debugging technique on a Tuesday afternoon.\n\n**The pushback problem.**\n\nThis is the cultural thing nobody talks about. Vietnamese engineers are, in my experience, exceptionally polite and exceptionally reluctant to push back in sprint planning. They'll say \"yes, we can do that in two weeks\" when it really needs four. They don't want to disappoint authority.\n\nThe fix took me years to figure out. It wasn't training or process. It was psychological safety. I had to make it genuinely safe to say \"I don't know\" or \"that's not realistic.\" Anonymous planning poker helped. Celebrating accurate estimates over early deliveries helped more. The breakthrough moment for me was publicly thanking a junior developer for catching a scope issue in a planning meeting. After that, estimates got honest fast.\n\n**Squads of 5 beat teams of 15.**\n\nWhen you scale past 10 engineers, communication overhead eats you alive. I tried every org structure — pods, tribes, feature teams, matrix organizations. The thing that worked best was small autonomous squads of 4-6 people, each owning a clear domain (payments, onboarding, growth). Weekly demo Fridays where every squad shows what they shipped. Pair every senior with a junior for mentoring.\n\nThis isn't original. Spotify wrote about it a decade ago. But I've now seen it work in three Vietnamese companies and fail in two. The difference was always the same: leadership either trusted the squads to make decisions, or they didn't. If you micro-manage, you've just created extra meetings.\n\n**What I'd tell my younger self.**\n\nIf I could send a message back to the 25-year-old version of me starting his first team lead role in Saigon, it would be this: stop optimizing for code quality and start optimizing for people quality. The code gets thrown away in two years. The people you develop stay with you for decades. Hire slow. Trust your gut after the interview, not before it. And never, ever let a hire happen because you were desperate. The market in Vietnam is good enough that you can wait two more weeks for the right person.\n\nIf you're building a tech team in Vietnam in 2026, the talent is there. The infrastructure is there. The cost is still favorable compared to Singapore or the US. The only thing that will sink you is treating your engineers like they're replaceable. They're not. Build for them, and they'll build the product for you."
  },
  {
    "title": "I Use These 5 Free AI Tools Every Week. Here's What's Actually Worth Your Time.",
    "slug": "save-hours-free-ai-tools-beginners",
    "date": "2026-05-15",
    "author": "Do Minh Tuan",
    "version": 2,
    "category": "Tech Made Simple 💡",
    "summary": "After a year of testing dozens of AI tools, here are the five I actually open every week. No fluff, no affiliate links, no 47-tool lists.",
    "image": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    "content": "I'm skeptical of AI tool lists. Most of them are written by people who tried each tool for 15 minutes and ranked them by which company paid the most for the placement. So I want to be clear about what this is: a year-long test of dozens of AI tools, narrowed down to the five I actually open every single week.\n\nI don't get paid by any of these companies. I don't have affiliate links. If something stops working, I'll say so.\n\n**1. ChatGPT — but only for first drafts, not final work.**\n\nI open ChatGPT probably 15 times a day. The thing nobody tells you is that ChatGPT is bad at finishing thoughts but great at starting them. Blank page syndrome is real. Asking ChatGPT to draft a polite refusal to a meeting invite, or to turn three bullet points into a paragraph, or to suggest five subject lines for an email — that's where it earns its keep. The mistake I see people make is treating the first output as final. It's not. It's clay. You have to shape it.\n\nOne specific use that's saved me hours: I ask ChatGPT to play roles. \"Act as a skeptical CFO reviewing this proposal\" produces much better feedback than just asking \"review this.\" The persona trick works because the AI has been trained on different writing styles, and forcing a specific one cuts down on the generic, everyone-agrees-with-everyone output.\n\nDon't pay for the pro tier unless you actually need image generation or the advanced data analysis. The free tier is fine for 90% of what most people do.\n\n**2. Gamma — for when you need a deck by tomorrow.**\n\nI used to hate making presentations. The thought of opening PowerPoint, fiddling with layouts, trying to find icons — it was enough to make me skip slides entirely. Gamma changed that. I type in a topic (\"Q2 product roadmap review\"), pick a color scheme, and 45 seconds later I have a 12-slide deck that looks like a human designed it.\n\nIt's not perfect. The AI hallucinates sometimes — last week it invented a fake customer quote I had to delete. But for internal presentations, sprint reviews, pitch decks you're going to refine later, it's saved me probably 3-4 hours a week. I used to budget a full afternoon for a 10-slide deck. Now it's 30 minutes.\n\n**3. Canva Magic Studio — for the design work I used to outsource.**\n\nI used to pay a designer $50 per blog post header image. Then $30. Then I tried Canva's Magic Studio and now I do it myself in 10 minutes. The Magic Eraser (remove an object from a photo) is genuinely magical — I cleaned up a conference photo last month by erasing three random people in the background, and you cannot tell. The text-to-image tool is mid — better than DALL-E 1, worse than Midjourney — but it's good enough for blog headers and social posts.\n\nIf you're running a small business, this replaces a part-time designer for most of your needs. For branding-critical work, still hire a human. For everything else, it's fine.\n\n**4. Otter.ai — meeting notes I actually read.**\n\nI've used Otter for two years. It joins my Zoom calls, transcribes everything, and 5 minutes after the call ends, I get an email with a summary plus the action items extracted. I used to take notes during meetings, which meant I was half-listening, half-typing, and missing the actual conversation. Now I just pay attention.\n\nThe transcription isn't perfect — it butchered my colleague's name for the first three months — but it gets good enough that I can search my meeting history by keyword. Last month I needed to remember what we'd decided about a pricing change in March. Searched \"pricing change March\" and found the exact moment in the transcript. That alone has paid for the subscription.\n\nFree tier is 300 minutes/month. The pro tier is $10/month and worth it if you have more than 6 hours of meetings a week.\n\n**5. Goblin Tools — for the days when everything feels overwhelming.**\n\nThis one is weird and specific, but I've recommended it to five people and all five came back to say it changed how they work. You type in a task that feels too big (\"plan my sister's wedding\"), and it breaks the task into tiny checkboxes ordered by what you should do first. That's it. That's the whole feature.\n\nWhy does it work? Because the obstacle to starting most projects isn't knowing what to do — it's that the project feels too big to hold in your head. Breaking it into 8 small checkboxes makes it feel doable. I've used it for non-work stuff too — \"clean the apartment\" became a 12-step list, and I actually did it instead of putting it off for three more weekends.\n\n**What I tried and abandoned.**\n\nNotion AI: cool, but I have 14 years of notes in plain markdown and Notion wants me to migrate. No thanks.\n\nJasper AI: way too expensive for what it does. ChatGPT with the right prompts gets me 80% of the way there for free.\n\nCopy.ai: same problem as Jasper. Generic output.\n\nThe honest truth is that the AI tool landscape changes every three months. What I use today might be obsolete by next year. But the meta-lesson is: pick tools that solve a specific pain you actually have, not tools that promise to revolutionize your workflow. The revolution is mostly in your head. The 5 hours a week I save is real, but it comes from using the same tools consistently, not from chasing the latest shiny thing."
  },
  {
    "title": "Stop Asking Me What Framework to Use. Start With This Question Instead.",
    "slug": "choosing-website-platform-small-business",
    "date": "2026-05-10",
    "author": "Do Minh Tuan",
    "version": 2,
    "category": "Business Hackers 🚀",
    "summary": "Small business owners keep asking WordPress vs Shopify vs Wix. After building 40+ sites for clients, I've realized the real question they're not asking.",
    "image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    "content": "Last month a café owner in District 1 emailed me. She'd spent three weeks comparing WordPress, Shopify, Squarespace, Wix, and Webflow, paralyzed by the choice. By the time she reached out, her competitor across the street had launched a website with online ordering, and she was still reading comparison articles.\n\nI told her to close the comparison tabs and answer one question first: what is the website actually for?\n\nThis is the question I wish more people would ask. Because the framework/builder debate is downstream of a much more important decision. WordPress vs Shopify isn't a tech question. It's a business model question. The right answer depends on whether you sell products, services, or content — and how much of your revenue actually depends on the website.\n\nAfter building (and rebuilding) 40+ websites for clients over the years, here's the framework I actually use.\n\n**If you sell physical products: Shopify, full stop.**\n\nI used to be more nuanced about this. I'd say \"it depends on your catalog size\" or \"if you only have 5 products, WooCommerce on WordPress is fine.\" Then I watched three clients who went the WooCommerce route spend $15,000 and four months building a custom checkout flow, and two of them had security issues within a year.\n\nShopify is not the cheapest option. At $39/month for the basic plan, plus 2% transaction fees if you don't use Shopify Payments, the costs add up. But the time you save on not building payment integration, tax calculation, shipping logic, inventory management, and PCI compliance is worth it. Shopify handles all of that out of the box. They've processed $200 billion in sales. They know what they're doing.\n\nA boutique client of mine sells handmade ceramics. She moved from a Squarespace site to Shopify in 2019. Five years later she's doing $400k/year through the store, and she has never once called me in a panic about her website. That's worth the monthly fee.\n\nThe exception: if you have fewer than 10 products and you're not expecting significant growth, Etsy or a simple Shopify Lite might be enough.\n\n**If you sell services: WordPress, but only if you'll write content.**\n\nThe trap I see business owners fall into is picking WordPress \"because SEO.\" WordPress does have the best SEO capabilities out of any platform. But those capabilities only matter if you're going to publish content. If you're a law firm that updates the website once a year, the SEO advantage of WordPress over Squarespace is theoretical. The maintenance burden is real.\n\nWordPress makes sense if you commit to publishing 2-4 blog posts per month. It does not make sense if you're going to set it up and forget it. WordPress sites that aren't maintained get hacked. It's not a question of if, it's when. I get at least two calls a year from clients whose 3-year-old WordPress sites got injected with malware because nobody updated the plugins.\n\nA consulting client of mine runs a financial advisory firm. We built his site on WordPress, and he's published 80 blog posts over three years. His organic search traffic is now 60% of his leads. The investment in content paid off.\n\nAnother client — same industry, similar budget — wanted WordPress but refused to write. We switched to Squarespace. Three years later, his site is fine, no security issues, and he doesn't get much organic traffic. He's fine with that — most of his business comes from referrals anyway. The right answer for him was the simpler tool.\n\n**If you need a site by Friday: Wix.**\n\nWix is what I recommend when the client needs a website by next week and has zero technical skills. The drag-and-drop editor is genuinely easy. You can have a 5-page site live in a day. The templates are fine. The downside is that Wix sites become hard to scale past 50 pages, and the pricing increases significantly as you add features.\n\nBut for a restaurant, a small consulting firm, a wedding photographer starting out — Wix is the right answer. I've built probably 15 Wix sites and almost all of them are still running three years later, which is honestly better than my WordPress track record for low-maintenance clients.\n\n**The question that actually matters.**\n\nBefore you pick a platform, answer this: how much of your business depends on the website working?\n\nIf the answer is \"most of it\" (e-commerce, online services), invest in the platform that won't break. Shopify, WordPress with proper maintenance, or a custom build.\n\nIf the answer is \"some of it\" (lead generation, brand presence), WordPress or Squarespace.\n\nIf the answer is \"barely at all\" (referral-based business, mostly offline), Wix or Squarespace. Don't overthink it.\n\n**A note on what I won't do anymore.**\n\nI used to take on clients who wanted \"a website just like [famous company].\" Those projects always went badly. The famous company has a team of 30 engineers and a quarterly roadmap. You have a business to run. Match the platform to the business you have, not the business you imagine having in five years.\n\nThe café owner I mentioned at the start? She picked Shopify. Took her two days. Her online ordering launched last week, and she's already gotten more orders in the soft launch than her previous website got in six months. She didn't need a framework debate. She needed to launch."
  },
  {
    "title": "A Month of Running My Team With AI. Here's the Honest Review.",
    "slug": "ai-project-management-chatbots-run-team",
    "date": "2026-05-08",
    "author": "Do Minh Tuan",
    "version": 2,
    "category": "Business Hackers 🚀",
    "summary": "I gave AI tools real responsibilities in my team for a month — drafting standup notes, flagging risks, generating tickets. Some worked. Some failed badly.",
    "image": "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80",
    "content": "There are two camps on AI in project management. The first says AI will replace project managers within five years. The second says AI is a toy and real PMs will always need human judgment. After spending a month running my team with AI tools in real production work, I think both camps are wrong.\n\nHere's what actually happened.\n\n**The setup.**\n\nI manage a 12-person engineering team building a B2B SaaS product. We use Jira for tickets, Slack for communication, and Notion for documentation. For one month, I integrated AI tools into my actual workflow — not as a side experiment, but as a real PM. I wanted to know which of the AI features vendors keep promising actually do something useful.\n\nThe tools I tried: Atlassian Intelligence (the AI built into Jira), Motion (AI scheduling), ChatGPT for drafting, and a custom setup using our own LLM API for sprint analytics.\n\n**What worked.**\n\nDrafting meeting agendas and recap notes. This is the unsexy AI use case that genuinely saved me time. I used to spend 20 minutes before each standup writing an agenda and 30 minutes after writing recap notes. Now I give ChatGPT a few bullet points the night before, and it produces a structured agenda. After the meeting, I paste in the transcript (Otter.ai does this automatically), and ChatGPT produces recap notes with action items, owners, and deadlines. The first version is maybe 70% right, and I edit for 10 minutes. Total time saved: 30+ minutes per day.\n\nThis works because the task is structured and the output is meant to be edited by me. AI doesn't have to be perfect at this — it just needs to be good enough that I'm saving more time than I spend editing.\n\nRisk flagging based on team velocity. We had a sprint that was clearly going to miss its deadline. I could see it from the burndown chart, but I asked Atlassian Intelligence to flag it explicitly. It did, three days before the demo. The flag was specific: \"Three tickets in the integration sprint have been in progress for 7+ days with no commits. Based on team velocity, these are unlikely to complete this sprint.\" I had a one-on-one with the engineer that afternoon, and we descoped the lowest-priority ticket. The sprint shipped on time. The AI didn't catch anything I couldn't have seen, but it surfaced the issue faster than I would have, and that speed mattered.\n\nGenerating first drafts of user stories. I have a running list of feature ideas. I used to spend an hour writing a good user story for each. Now I give ChatGPT the rough idea (\"a feature that lets users bulk-import contacts from CSV\") and it produces a user story with acceptance criteria. About 60% of the time, the draft is usable as-is. The other 40% needs significant editing, especially for edge cases the AI didn't think of. But the time savings is real: from 60 minutes per story to 20 minutes.\n\n**What failed.**\n\nPredicting sprint completion dates. Every AI tool claims it can do this. In my testing, none of them were accurate enough to trust. The predictions were off by 20-40% in both directions, and the predictions didn't improve over time despite the tools saying they \"learn from your team's velocity.\" My manual estimate (which I do by looking at past sprint burndown and gut feel) was more accurate than any of the AI predictions.\n\nI think the problem is that the AI tools only see what's in Jira. They don't see that Sarah is going to take two days off for a family event, or that the backend service we depend on has been flaky this week, or that the product team changed priorities mid-sprint. Real sprint estimation requires context the AI doesn't have access to.\n\nAuto-drafting standup updates. The idea is: instead of engineers typing their standup, the AI reads their recent commits and Slack messages and drafts an update. The drafts were technically correct but missed the actual point. An engineer would commit code, and the AI would say \"I finished the auth refactor today.\" But what the engineer actually needed to communicate was \"I'm stuck on the auth refactor because of a library bug; I'm pairing with Tom tomorrow.\" The AI summarized the work but missed the unblock request. After two weeks of confusing standups, I turned this feature off.\n\nAuto-triaging incoming bug reports. We had AI set up to read new bug reports and assign a priority. It was wrong about 30% of the time, and the 30% of the time it was wrong, it was catastrophically wrong — marking critical bugs as low priority. The cost of getting this wrong (a customer-facing bug sitting for three days) was much higher than the time saved. I turned this off too.\n\n**The honest verdict.**\n\nAI in project management is good at two things: reducing the busywork of communication (agendas, recaps, first drafts), and surfacing patterns from data (velocity, ticket age, completion likelihood). It's bad at the parts of the job that require context, relationships, and judgment — which is, frankly, most of the job.\n\nIf you're a project manager considering AI tools, my advice is this: don't replace anything you're doing. Use AI to draft the things you're already writing, then edit. Use AI to surface the things you should look at, then use your judgment to decide. Don't trust AI to make decisions for you, because the cost of being wrong is usually higher than the time saved.\n\nThe PMs who will thrive in the next five years aren't the ones who adopt AI fastest. They're the ones who figure out which parts of their job are pattern-recognition (good for AI) and which parts are human-relationship (not good for AI), and focus their energy accordingly.\n\nI went into this experiment half-expecting to be replaced. I came out of it more confident that my job is safe, but more efficient at the parts that don't matter as much. That's a win, even if it's not the revolution the AI vendors are promising."
  },
  {
    "title": "Your Website Is Slow Because You Pushed a 6MB Image From Your iPhone. Here's the Fix.",
    "slug": "why-website-slow-non-coder-guide",
    "date": "2026-05-05",
    "author": "Do Minh Tuan",
    "version": 2,
    "category": "Developer Corner 💻",
    "summary": "The fix for slow websites is almost never what you think. After auditing 100+ sites, I can tell you the #1 culprit every single time, and it's a 5-minute fix.",
    "image": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format=80",
    "content": "Last Tuesday I ran a free website audit for a friend who runs a small architecture firm. His site took 8.2 seconds to load on a phone. He was losing clients — he'd been told this by three people and was about to pay a developer $3,000 to \"rebuild the site for speed.\"\n\nI spent 15 minutes on the audit. The site didn't need rebuilding. It needed three things: image compression, browser caching, and one plugin removed. I did all three in 25 minutes. The site now loads in 1.8 seconds. He didn't pay me $3,000 because the fix was too embarrassing — it was the kind of thing he could have done himself if anyone had explained it clearly.\n\nSo let me explain it clearly.\n\n**The thing that is almost certainly making your site slow.**\n\nI'm going to guess right now, before telling you what the audit tool said. Is it:\n\nA) Massive, uncompressed images uploaded straight from your phone or camera\nB) Too many plugins running on every page load\nC) Cheap shared hosting that can't handle your traffic\nD) A web font taking forever to load\n\nIf you guessed A, you're right. About 80% of the time, A is the answer. The other 20%, it's a combination of A and B.\n\nHere's what happens: you take a photo on your iPhone. It's a 4032×3024 pixel image, about 5-6 megabytes. You drag it into your WordPress media library. WordPress keeps the original size by default. Your page now has a 5MB image on it, and the browser has to download all 5MB before the page can render.\n\nA 5MB image on a 4G connection takes about 8 seconds to download. That's your entire page load time, gone.\n\n**The fix, in 5 minutes.**\n\nStep 1: Install a plugin called ShortPixel, Imagify, or Smush. Any of them will work. Free tier is fine.\n\nStep 2: Run the bulk optimization. It will compress all your existing images. On my friend's site, this took 7MB of images and compressed them to 1.2MB. The images look identical to humans, but the file size is 80% smaller.\n\nStep 3: Turn on automatic optimization for new uploads, so you don't have to think about it.\n\nThat's it. 80% chance this is the only fix you need.\n\n**The other things to check.**\n\nIf you do the image fix and your site is still slow, here's the next tier of things to look at.\n\nBrowser caching. Without caching, every time someone visits your site, your server has to rebuild the page from scratch — pull the database, generate the HTML, send it to the browser. With caching, the server stores a pre-built copy and serves it instantly. If you're on WordPress, install a plugin called WP Super Cache or LiteSpeed Cache. Enable it, and your repeat visitors will get a 3-5x speedup.\n\nPlugin audit. Open your WordPress plugins page. Count them. If you have more than 25, you almost certainly have plugins you don't need. Every active plugin runs code on every page load, even if the plugin doesn't do anything visible. I once audited a site with 47 active plugins. The site took 6 seconds to load. We deactivated 30 of them (none of which the owner was using). Site loaded in 2.1 seconds.\n\nHosting. This is rarely the problem for small business sites. Most shared hosting (Bluehost, HostGator, SiteGround) is fine for sites with under 10,000 visitors per month. The exception is if you're on a host that throttles CPU, which cheap EIG brands are notorious for. If your host loads slowly even in incognito mode with no plugins, switch to Cloudways or SiteGround. But try the other fixes first.\n\n**How to check if your site is actually slow.**\n\nOpen your site in an incognito window in Chrome. Right-click, Inspect, then go to the Network tab. Refresh the page. Look at the bottom — it will say \"DOMContentLoaded\" and \"Load\" with times next to them. If \"Load\" is over 4 seconds, you have a real problem.\n\nThe other tool I use: https://pagespeed.web.dev. It's Google's official tool. Plug in your URL. It gives you a score from 0-100 and tells you exactly what's slow. Ignore the score, look at the \"Opportunities\" section — that's the actionable list. The advice is genuinely good.\n\n**The thing nobody tells you.**\n\nSpeed matters for two reasons: user experience and Google rankings. On the user experience side, the research is clear: 53% of mobile users abandon sites that take more than 3 seconds to load. On the Google rankings side, page speed has been an SEO factor since 2018, and it became more important in 2021 with the Core Web Vitals update.\n\nBut the deeper reason speed matters is trust. A slow site feels sketchy. When I audit a small business website and it takes 6 seconds to load, I subconsciously think \"this company is behind the times, are they behind on everything?\" That's unfair, but it's the reality. A fast site signals competence.\n\nMy friend's architecture firm site went from 8.2 seconds to 1.8 seconds. He said the most surprising result wasn't the Google traffic increase (which was 40% over three months) — it was the increase in contact form submissions. He went from 2-3 per month to 8-10 per month. Same website, same content, same design. Just faster. People filled out the form because the experience felt professional, and they trusted him with their project.\n\nIf you take one thing from this: compress your images. That's it. Start there. Everything else is secondary."
  },
  {
    "title": "I Cut My AWS Bill in Half By Making My Site Boring. Here's How.",
    "slug": "green-cloud-computing-save-money-planet",
    "date": "2026-05-01",
    "author": "Do Minh Tuan",
    "version": 2,
    "category": "Future Pulse 🔮",
    "summary": "Green cloud computing sounds like marketing fluff until you see the AWS bill. Here's how I made my site carbon-negative and saved $400/month doing it.",
    "image": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
    "content": "I used to host my personal site on a small EC2 instance, with a Node.js backend and a MongoDB database. It cost me about $80/month. For a site that got maybe 500 visitors a day, that was embarrassing. So I did what any reasonable developer would do: I over-engineered the solution by moving to serverless, then spent three weeks debugging cold starts, and ended up with an $800/month AWS bill.\n\nI learned two things from that year. First, serverless is amazing in theory and brutal in practice if you don't know exactly what you're doing. Second, every line of code I wrote was generating carbon emissions.\n\nLet me explain the carbon thing, because it's the part most developers don't think about.\n\n**Where the emissions actually come from.**\n\nThe cloud isn't in the cloud. It's in a building somewhere, with metal racks full of computers running 24/7, consuming electricity, most of which comes from fossil fuels. The numbers I've seen most often: data centers consume about 1-2% of global electricity, and that percentage is growing faster than renewables can keep up. By some estimates, the data center industry's carbon footprint now exceeds the airline industry.\n\nEvery time you spin up a serverless function, every time you query a database, every time you serve a webpage, you're contributing to that. The amount of CO2 from a single API call is tiny — fractions of a gram — but multiply by billions of API calls per day across the internet, and it adds up.\n\nFor a personal site, my contribution was small. But it was also unnecessary. I was running compute that did nothing useful 90% of the time. The servers were idle, but they were still consuming power. Idle compute is the silent killer of both your cloud bill and your carbon footprint.\n\n**The boring solution.**\n\nI rebuilt my site as a static React app, hosted on Vercel's free tier (which runs on renewable energy in their EU and US regions), with a small serverless function for the contact form. The whole thing is one HTML file, one CSS file, and a few JavaScript bundles. There's no database. There's no always-on server. The pages are pre-built at deploy time and served from the edge.\n\nMy AWS bill went from $800/month to $0. Vercel serves the static assets for free. The contact form hits a serverless function that only runs when someone actually submits the form — so it costs me maybe $0.10/month even with 100 submissions.\n\nThe carbon savings are also real. Pre-built static sites served from edge networks use about 1% of the energy of a traditional server-based deployment, by the estimate of the Green Web Foundation. For my site, that's the difference between running 1 small server 24/7 and using a few kilowatt-hours per month.\n\n**What I learned about the broader pattern.**\n\nThe boring truth is that the greenest code is the code that doesn't run. Every architectural decision you make has both a performance implication and a carbon implication, and they're often the same decision.\n\nStatic sites: green. The page is built once, served infinitely, no compute per request.\n\nCDNs: green. The content is served from a location close to the user, reducing data transfer distance and energy.\n\nServerless functions for occasional tasks: green-ish. They only run when needed, but cold starts and data transfer add up.\n\nAlways-on servers for low-traffic sites: not green. The server runs 24/7 to serve a request that comes once an hour.\n\nSpinning up new VMs or containers for every request: definitely not green. The orchestration overhead alone can exceed the actual work being done.\n\nI see startups with five engineers running multi-region Kubernetes clusters to serve sites that get 200 visitors a day. That's not an engineering achievement, it's a sustainability disaster. The cloud is so cheap and so easy to spin up resources that we've stopped thinking about whether we need them.\n\n**What I'd tell engineering managers.**\n\nIf you run a team, here are three changes you can make this quarter that will both reduce your cloud bill and reduce your carbon footprint, often by 30-50%:\n\n1. Audit your always-on infrastructure. Anything that's running 24/7 to serve less than 1000 requests per day is probably worth replacing with a serverless alternative or a static version.\n\n2. Measure your data transfer. Most cloud bills have a \"data transfer out\" line. If that number is high, you're probably serving large assets inefficiently. Compress images, enable gzip, use modern image formats like WebP and AVIF.\n\n3. Schedule non-production environments to shut down outside business hours. Your staging environment doesn't need to run at 3am. A simple Lambda function that starts and stops EC2 instances on a cron schedule can save 70% of those costs.\n\n**The marketing angle.**\n\nI want to be careful here because I see a lot of \"green tech\" marketing that's just greenwashing. Companies claiming to be carbon-neutral because they bought offsets, while running infrastructure that wastes energy at scale. Don't be that company. Make the engineering changes first, then talk about it.\n\nFor my own site, the green angle is genuine: I rebuilt it as a static site because the engineering case was overwhelming, and the carbon and cost savings are the side effects. If you're going to market sustainability, do the work first. Customers can tell the difference.\n\n**The honest bottom line.**\n\nGoing green isn't really about saving the planet in any individual case. One developer switching from EC2 to Vercel is not going to move the needle on global carbon emissions. But it's a step in the right direction, and the engineering benefits are real: lower costs, faster sites, simpler operations. The sustainability win is just a bonus that happens to align with what you should be doing for business reasons anyway.\n\nThe boring sites are the green sites. The simple architectures are the sustainable architectures. The engineers who obsess over elegance and minimalism are inadvertently also building the most environmentally friendly systems. If you can hold two ideas in your head at once — \"make the site boring\" and \"save the planet\" — both of them might be true."
  }
];

// Anti-spam patterns
const SPAM_PATTERNS = [
  /\b(viagra|cialis|casino|crypto|bitcoin|forex|loan)\b/i,
  /\b(buy now|click here|free money|make \$\d+)\b/i,
  /https?:\/\/[^\s]+.*https?:\/\/[^\s]+/i, // multiple URLs
];

const DISPOSABLE_EMAIL_DOMAINS = [
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', '10minutemail.com',
  'throwaway.email', 'yopmail.com', 'temp-mail.org', 'fakeinbox.com',
  'maildrop.cc', 'getnada.com', 'sharklasers.com', 'trashmail.com'
];

// Rate limit (per-instance; in-memory)
const rateLimit = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 1;

function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripHtml(str) {
  return String(str || '').replace(/<[^>]+>/g, '').trim();
}

function summarizeContent(content, maxLen = 280) {
  const plain = stripHtml(content);
  if (plain.length <= maxLen) return plain;
  return plain.substring(0, maxLen).replace(/\s+\S*$/, '') + '…';
}

// Load blog articles: prefer Vercel KV, fall back to local file, fall back to seeds
export async function loadBlogArticles() {
  if (process.env.VERCEL && process.env.KV_REST_API_URL) {
    try {
      const cloudData = await kv.get('portfolio_data');
      if (cloudData && cloudData.blog && cloudData.blog.length > 0) {
        return cloudData.blog;
      }
    } catch (e) {
      console.error('KV load error in lib:', e);
    }
  }
  if (fs.existsSync(DATA_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      if (data.blog && data.blog.length > 0) return data.blog;
    } catch (e) {
      console.error('Local file load error:', e);
    }
  }
  return defaultBlogArticles;
}

// ===== RSS HANDLER =====
export async function handleRss(req, res) {
  try {
    const blog = await loadBlogArticles();
    const SITE_URL = process.env.SITE_URL || 'https://me.tony.do';
    const SITE_TITLE = 'Do Minh Tuan — Senior PM & Tech Leader';
    const SITE_DESC = 'Insights on project management, AI, scaling teams, and Vietnam tech ecosystem.';

    const items = blog
      .slice(0, 30)
      .map(post => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${SITE_URL}/#/${post.slug}</link>
      <guid isPermaLink="false">${SITE_URL}/#/${post.slug}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description>${escapeXml(post.summary || summarizeContent(post.content))}</description>
      <author>${escapeXml(post.author || 'admin@tony.do')} (${escapeXml(post.author || 'Do Minh Tuan')})</author>
      ${post.category ? `<category>${escapeXml(post.category)}</category>` : ''}
    </item>`)
      .join('\n');

    const lastBuild = blog.length > 0 ? new Date(blog[0].date).toUTCString() : new Date().toUTCString();

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESC)}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    return res.status(200).send(xml);
  } catch (e) {
    console.error('RSS error:', e);
    return res.status(500).json({ error: 'Failed to generate RSS' });
  }
}

// ===== COMMENTS HANDLERS =====
function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry) {
    rateLimit.set(ip, [now]);
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }
  const recent = entry.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((RATE_LIMIT_WINDOW_MS - (now - recent[0])) / 1000) };
  }
  recent.push(now);
  rateLimit.set(ip, recent);
  return { allowed: true, remaining: RATE_LIMIT_MAX - recent.length };
}

function isSpam({ author, email, content, honeypot }) {
  if (honeypot) return { spam: true, reason: 'honeypot' };
  const emailDomain = (email || '').split('@')[1]?.toLowerCase() || '';
  if (DISPOSABLE_EMAIL_DOMAINS.includes(emailDomain)) {
    return { spam: true, reason: 'disposable_email' };
  }
  const text = `${author} ${content}`;
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) return { spam: true, reason: 'pattern' };
  }
  return { spam: false };
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function safeEqual(a, b) {
  const ba = Buffer.from(a || '');
  const bb = Buffer.from(b || '');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export async function handleCommentsGet(req, res) {
  const slug = req.query.slug;
  if (!slug) return res.status(400).json({ error: 'slug required' });

  try {
    let comments = [];
    if (process.env.VERCEL && process.env.KV_REST_API_URL) {
      comments = (await kv.get(`comments:${slug}`)) || [];
    }
    // Filter to only approved (unless admin token)
    const token = req.headers['x-admin-token'];
    const isAdmin = token && process.env.ADMIN_PASSWORD && safeEqual(token, process.env.ADMIN_PASSWORD);
    const filtered = isAdmin ? comments : comments.filter(c => c.status === 'approved');
    return res.status(200).json({ comments: filtered, total: filtered.length });
  } catch (e) {
    console.error('Comments GET error:', e);
    return res.status(500).json({ error: 'Failed to load comments' });
  }
}

export async function handleCommentsPost(req, res) {
  const ip = getClientIp(req);
  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(limit.retryAfter || 60));
    return res.status(429).json({ error: 'Too many comments, slow down', retryAfter: limit.retryAfter });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }
  }
  body = body || {};

  const { slug, author, email, content, honeypot } = body;
  if (!slug || !author || !email || !content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (String(content).length < 3 || String(content).length > 2000) {
    return res.status(400).json({ error: 'Content must be 3-2000 characters' });
  }
  if (String(author).length > 100 || String(email).length > 200) {
    return res.status(400).json({ error: 'Author/email too long' });
  }

  const spamCheck = isSpam({ author, email, content, honeypot });
  const newComment = {
    id: genId(),
    slug,
    author: String(author).slice(0, 100),
    email: String(email).slice(0, 200),
    content: String(content).slice(0, 2000),
    date: new Date().toISOString(),
    status: spamCheck.spam ? 'spam' : 'pending',
    flagged: spamCheck.spam ? spamCheck.reason : null,
  };

  try {
    let existing = [];
    if (process.env.VERCEL && process.env.KV_REST_API_URL) {
      existing = (await kv.get(`comments:${slug}`)) || [];
      existing.push(newComment);
      await kv.set(`comments:${slug}`, existing);
    } else {
      // Local file fallback
      const localFile = path.join(process.cwd(), 'src/admin/comments.json');
      let all = {};
      if (fs.existsSync(localFile)) {
        try { all = JSON.parse(fs.readFileSync(localFile, 'utf8')); } catch { all = {}; }
      }
      all[slug] = all[slug] || [];
      all[slug].push(newComment);
      fs.mkdirSync(path.dirname(localFile), { recursive: true });
      fs.writeFileSync(localFile, JSON.stringify(all, null, 2));
    }

    return res.status(201).json({
      ok: true,
      status: newComment.status,
      message: newComment.status === 'spam' ? 'Comment flagged' : 'Comment submitted for review',
    });
  } catch (e) {
    console.error('Comments POST error:', e);
    return res.status(500).json({ error: 'Failed to save comment' });
  }
}

export async function handleCommentsModerate(req, res) {
  const token = req.headers['x-admin-token'];
  if (!token || !process.env.ADMIN_PASSWORD || !safeEqual(token, process.env.ADMIN_PASSWORD)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }
  }
  body = body || {};
  const { action, slug, id, status: filterStatus } = body;

  try {
    if (action === 'list') {
      // List all comments across slugs, optionally filtered by status
      const all = {};
      if (process.env.VERCEL && process.env.KV_REST_API_URL) {
        // Use SCAN to iterate comment keys
        let cursor = '0';
        do {
          const [next, keys] = await kv.scan(cursor, { match: 'comments:*', count: 100 });
          cursor = next;
          for (const k of keys) {
            const slugFromKey = k.replace('comments:', '');
            const list = (await kv.get(k)) || [];
            all[slugFromKey] = list;
          }
        } while (cursor !== '0');
      } else {
        const localFile = path.join(process.cwd(), 'src/admin/comments.json');
        if (fs.existsSync(localFile)) {
          try { all = JSON.parse(fs.readFileSync(localFile, 'utf8')); } catch { all = {}; }
        }
      }
      let flat = [];
      for (const [s, list] of Object.entries(all)) {
        for (const c of list) flat.push({ ...c, slug: c.slug || s });
      }
      if (filterStatus) flat = flat.filter(c => c.status === filterStatus);
      flat.sort((a, b) => new Date(b.date) - new Date(a.date));
      return res.status(200).json({ comments: flat, total: flat.length });
    }

    if (!slug || !id || !action) {
      return res.status(400).json({ error: 'slug, id, action required' });
    }

    if (process.env.VERCEL && process.env.KV_REST_API_URL) {
      const list = (await kv.get(`comments:${slug}`)) || [];
      const idx = list.findIndex(c => c.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Comment not found' });

      if (action === 'delete') {
        list.splice(idx, 1);
      } else if (['approve', 'reject', 'spam'].includes(action)) {
        list[idx].status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'spam';
        list[idx].moderatedAt = new Date().toISOString();
      } else {
        return res.status(400).json({ error: 'Unknown action' });
      }
      await kv.set(`comments:${slug}`, list);
      return res.status(200).json({ ok: true, comment: list[idx] });
    }
    return res.status(501).json({ error: 'Moderation requires KV (Vercel deployment)' });
  } catch (e) {
    console.error('Moderation error:', e);
    return res.status(500).json({ error: 'Moderation failed' });
  }
}

// ===== REACTIONS HANDLERS =====
export async function handleReactionsGet(req, res) {
  const slug = req.query.slug;
  if (!slug) return res.status(400).json({ error: 'slug required' });
  try {
    let counts = { like: 0, insightful: 0, inspired: 0 };
    if (process.env.VERCEL && process.env.KV_REST_API_URL) {
      counts = (await kv.get(`reactions:${slug}`)) || counts;
    }
    return res.status(200).json({ slug, counts });
  } catch (e) {
    console.error('Reactions GET error:', e);
    return res.status(500).json({ error: 'Failed to load reactions' });
  }
}

export async function handleReactionsPost(req, res) {
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }
  }
  body = body || {};
  const { slug, type } = body;
  if (!slug || !type) return res.status(400).json({ error: 'slug and type required' });
  if (!['like', 'insightful', 'inspired'].includes(type)) {
    return res.status(400).json({ error: 'Invalid reaction type' });
  }

  try {
    let counts = { like: 0, insightful: 0, inspired: 0 };
    if (process.env.VERCEL && process.env.KV_REST_API_URL) {
      counts = (await kv.get(`reactions:${slug}`)) || counts;
    }
    counts[type] = (counts[type] || 0) + 1;
    if (process.env.VERCEL && process.env.KV_REST_API_URL) {
      await kv.set(`reactions:${slug}`, counts);
    }
    return res.status(200).json({ ok: true, counts });
  } catch (e) {
    console.error('Reactions POST error:', e);
    return res.status(500).json({ error: 'Failed to save reaction' });
  }
}

// ===== VIEW COUNTERS =====
// Lightweight article view counter. Stores per-slug counts in KV.
// GET  /api/data?type=views[&slug=xxx]   → counts (single slug or all)
// POST /api/data?type=view&slug=xxx      → increment + return new count
//   Body (optional): { sessionId } to dedup per session (1 per 30 min).

const VIEW_DEDUP_TTL_SEC = 30 * 60; // 30 minutes

export async function handleViewsGet(req, res) {
  try {
    const slug = req.query.slug;
    if (process.env.VERCEL && process.env.KV_REST_API_URL) {
      if (slug) {
        const count = (await kv.get(`views:${slug}`)) || 0;
        return res.status(200).json({ slug, count });
      }
      // No slug → return all view counts (for feed display)
      const all = await kv.keys('views:*');
      const counts = {};
      if (all && all.length > 0) {
        const values = await kv.mget(...all);
        all.forEach((k, i) => {
          const s = k.replace(/^views:/, '');
          counts[s] = values[i] || 0;
        });
      }
      return res.status(200).json({ counts });
    }
    // No KV → return empty (graceful degradation)
    if (slug) return res.status(200).json({ slug, count: 0 });
    return res.status(200).json({ counts: {} });
  } catch (e) {
    console.error('Views GET error:', e);
    return res.status(500).json({ error: 'Failed to load views' });
  }
}

export async function handleViewIncrement(req, res) {
  const slug = req.query.slug;
  if (!slug) return res.status(400).json({ error: 'slug required' });

  // Optional dedup via sessionId
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};
  const sessionId = body.sessionId;

  try {
    if (!process.env.VERCEL || !process.env.KV_REST_API_URL) {
      return res.status(200).json({ slug, count: 0, kvDisabled: true });
    }

    // Dedup: if sessionId provided, check if a view was already counted recently
    if (sessionId) {
      const lastView = await kv.get(`view-ts:${slug}:${sessionId}`);
      if (lastView) {
        const count = (await kv.get(`views:${slug}`)) || 0;
        return res.status(200).json({ slug, count, deduped: true });
      }
      await kv.set(`view-ts:${slug}:${sessionId}`, Date.now(), { ex: VIEW_DEDUP_TTL_SEC });
    }

    const newCount = await kv.incr(`views:${slug}`);
    return res.status(200).json({ slug, count: newCount });
  } catch (e) {
    console.error('View increment error:', e);
    return res.status(500).json({ error: 'Failed to increment view' });
  }
}

// ===== GITHUB BACKUP =====
// Backs up portfolio data + comments + reactions + subscribers to a dedicated
// `data-backups` branch in the GitHub repo. Daily snapshots kept for 30 days,
// weekly snapshots for 30 weeks. Uses GitHub Contents API + a classic PAT.
//
// Required env var: GITHUB_BACKUP_TOKEN (classic PAT, scope: repo)
// Optional: GITHUB_REPO_OWNER (default: harrypotter30022003)
//           GITHUB_REPO_NAME  (default: tony-profile-bigpickle)

const GH_API = 'https://api.github.com';
const GH_OWNER = process.env.GITHUB_REPO_OWNER || 'harrypotter30022003';
const GH_REPO = process.env.GITHUB_REPO_NAME || 'tony-profile-bigpickle';
const GH_BRANCH = 'data-backups';
const GH_BASE = process.env.GITHUB_REPO_BASE_BRANCH || 'main';

function ghHeaders() {
  const token = process.env.GITHUB_BACKUP_TOKEN;
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'tony-portfolio-backup-bot',
  };
}

async function gh(path, options = {}) {
  const token = process.env.GITHUB_BACKUP_TOKEN;
  if (!token) throw new Error('GITHUB_BACKUP_TOKEN missing');
  const url = `${GH_API}/repos/${GH_OWNER}/${GH_REPO}${path}`;
  const resp = await fetch(url, {
    ...options,
    headers: { ...ghHeaders(), ...(options.headers || {}) },
  });
  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`GitHub ${resp.status} on ${path}: ${text.slice(0, 200)}`);
  }
  return text ? JSON.parse(text) : null;
}

async function ensureBranch() {
  try {
    await gh(`/branches/${GH_BRANCH}`);
  } catch {
    const mainRef = await gh(`/git/ref/heads/${GH_BASE}`);
    await gh('/git/refs', {
      method: 'POST',
      body: JSON.stringify({
        ref: `refs/heads/${GH_BRANCH}`,
        sha: mainRef.object.sha,
      }),
    });
  }
}

async function getFileSha(filePath) {
  try {
    const file = await gh(`/contents/${encodeURIComponent(filePath)}?ref=${GH_BRANCH}`);
    return file.sha;
  } catch {
    return null;
  }
}

async function commitFile(filePath, contentObj, message) {
  await ensureBranch();
  const sha = await getFileSha(filePath);
  const body = {
    message,
    content: Buffer.from(JSON.stringify(contentObj, null, 2)).toString('base64'),
    branch: GH_BRANCH,
  };
  if (sha) body.sha = sha;
  return gh(`/contents/${encodeURIComponent(filePath)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

async function listDir(dirPath) {
  try {
    const items = await gh(`/contents/${encodeURIComponent(dirPath)}?ref=${GH_BRANCH}`);
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

async function deleteFile(filePath, sha, message) {
  return gh(`/contents/${encodeURIComponent(filePath)}`, {
    method: 'DELETE',
    body: JSON.stringify({ message, sha, branch: GH_BRANCH }),
  });
}

async function pruneOld(dirPath, maxAgeMs) {
  const files = await listDir(dirPath);
  const now = Date.now();
  let removed = 0;
  for (const f of files) {
    if (f.type !== 'file') continue;
    const dateMatch = f.name.match(/(\d{4}-\d{2}-\d{2})/);
    if (!dateMatch) continue;
    const fileTime = new Date(dateMatch[1]).getTime();
    if (now - fileTime > maxAgeMs) {
      try {
        await deleteFile(f.path, f.sha, `chore: prune expired backup ${f.name}`);
        removed++;
      } catch (e) {
        console.error('Prune error for', f.path, e.message);
      }
    }
  }
  return removed;
}

async function gatherAllData() {
  const portfolio = (process.env.VERCEL && process.env.KV_REST_API_URL)
    ? ((await kv.get('portfolio_data')) || {})
    : null;

  // Comments
  const comments = {};
  if (process.env.VERCEL && process.env.KV_REST_API_URL) {
    let cursor = '0';
    do {
      const [next, keys] = await kv.scan(cursor, { match: 'comments:*', count: 100 });
      cursor = next;
      for (const k of keys) {
        const slug = k.replace('comments:', '');
        comments[slug] = (await kv.get(k)) || [];
      }
    } while (cursor !== '0');
  }

  // Reactions
  const reactions = {};
  if (process.env.VERCEL && process.env.KV_REST_API_URL) {
    let cursor = '0';
    do {
      const [next, keys] = await kv.scan(cursor, { match: 'reactions:*', count: 100 });
      cursor = next;
      for (const k of keys) {
        const slug = k.replace('reactions:', '');
        reactions[slug] = (await kv.get(k)) || { like: 0, insightful: 0, inspired: 0 };
      }
    } while (cursor !== '0');
  }

  // Subscribers (just the count, not PII for security)
  let subscribers = [];
  if (process.env.VERCEL && process.env.KV_REST_API_URL) {
    try {
      subscribers = (await kv.get('subscribers')) || [];
    } catch { /* ignore */ }
  }

  return {
    portfolio,
    comments,
    reactions,
    subscriberCount: subscribers.length,
    // Include list (emails are PII; redact in case repo becomes public)
    subscribers: subscribers.map(s => ({
      email: s.email ? s.email.replace(/(?<=.).(?=[^@]*?@)/g, '*') : '',
      createdAt: s.createdAt || null,
    })),
  };
}

// Run a backup snapshot. type = 'daily' | 'weekly'
export async function handleBackup(req, res, type) {
  if (!process.env.GITHUB_BACKUP_TOKEN) {
    return res.status(200).json({
      ok: false,
      skipped: true,
      reason: 'GITHUB_BACKUP_TOKEN not set. Create a classic PAT (scope: repo) and add as Vercel env var to enable backups.',
      help: 'https://github.com/settings/tokens/new?scopes=repo',
    });
  }

  try {
    const data = await gatherAllData();
    const now = new Date();
    const ts = now.toISOString();

    let filePath, label, pruned;
    if (type === 'daily') {
      const date = now.toISOString().split('T')[0];
      filePath = `backups/daily/${date}.json`;
      label = date;
      const payload = { type: 'daily', date, timestamp: ts, ...data };
      await commitFile(filePath, payload, `backup(daily): ${date}`);
      pruned = await pruneOld('backups/daily', 30 * 24 * 60 * 60 * 1000);
    } else if (type === 'weekly') {
      // ISO week label: YYYY-Wxx
      const target = new Date(now.valueOf());
      const dayNr = (target.getDay() + 6) % 7;
      target.setDate(target.getDate() - dayNr + 3);
      const firstThursday = target.valueOf();
      target.setMonth(0, 1);
      if (target.getDay() !== 4) {
        target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
      }
      const weekNum = 1 + Math.ceil((firstThursday - target) / 604800000);
      const weekId = `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
      filePath = `backups/weekly/${weekId}.json`;
      label = weekId;
      const payload = { type: 'weekly', weekId, timestamp: ts, ...data };
      await commitFile(filePath, payload, `backup(weekly): ${weekId}`);
      pruned = await pruneOld('backups/weekly', 30 * 7 * 24 * 60 * 60 * 1000);
    } else {
      return res.status(400).json({ error: 'type must be daily or weekly' });
    }

    return res.status(200).json({
      ok: true,
      type,
      label,
      path: filePath,
      pruned,
      stats: {
        comments: Object.keys(data.comments).length,
        reactions: Object.keys(data.reactions).length,
        subscribers: data.subscriberCount,
        blogPosts: (data.portfolio?.blog || []).length,
      },
    });
  } catch (e) {
    console.error('Backup error:', e);
    return res.status(500).json({ ok: false, error: e.message });
  }
}

// List available backups (for the admin UI to show)
export async function handleBackupList(req, res) {
  if (!process.env.GITHUB_BACKUP_TOKEN) {
    return res.status(200).json({ ok: false, skipped: true, daily: [], weekly: [] });
  }
  try {
    const [daily, weekly] = await Promise.all([
      listDir('backups/daily'),
      listDir('backups/weekly'),
    ]);
    const toInfo = f => ({ name: f.name, size: f.size, sha: f.sha, path: f.path });
    return res.status(200).json({
      ok: true,
      daily: daily.filter(f => f.type === 'file').map(toInfo).sort((a, b) => b.name.localeCompare(a.name)),
      weekly: weekly.filter(f => f.type === 'file').map(toInfo).sort((a, b) => b.name.localeCompare(a.name)),
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
