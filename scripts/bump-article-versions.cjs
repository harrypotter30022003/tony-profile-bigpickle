// One-time script: add `version: 2` to default blog articles that don't have one
// Run from project root: node scripts/bump-article-versions.cjs
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'api', '_lib.js');
let content = fs.readFileSync(file, 'utf8');

const slugs = [
  'building-high-performance-tech-teams-vietnam-blueprint',
  'save-hours-free-ai-tools-beginners',
  'choosing-website-platform-small-business',
  'ai-project-management-chatbots-run-team',
  'why-website-slow-non-coder-guide',
  'green-cloud-computing-save-money-planet',
];

let count = 0;
for (const slug of slugs) {
  const pattern = new RegExp(`("slug":\\s*"${slug.replace(/-/g, '-')}",\\s*"date":\\s*"\\d{4}-\\d{2}-\\d{2}",\\s*"author":\\s*"Do Minh Tuan",)`);
  if (pattern.test(content)) {
    content = content.replace(pattern, `$1\n    "version": 2,`);
    count++;
    console.log(`  ✓ Added version to ${slug}`);
  } else {
    console.log(`  ! Pattern not found for ${slug} (article may already have version)`);
  }
}

fs.writeFileSync(file, content);
console.log(`\nAdded version field to ${count} articles.`);
