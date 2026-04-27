const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const configPath = path.join(root, 'admin', 'config.yml');
const adminPath = path.join(root, 'admin', 'index.html');
const contentPath = path.join(root, 'content', 'blog');

const requiredConfigTokens = [
  'backend:',
  'name: github',
  'collection',
  'name: "blog"',
  'folder: "content/blog"',
  'name: "comments"',
  'folder: "content/comments"',
  'name: "metaTitle"',
  'name: "metaDescription"',
  'name: "image"',
  'name: "faqItems"',
  'name: "relatedPosts"',
  'name: "body"'
];

const errors = [];
if (!fs.existsSync(configPath)) errors.push('Missing admin/config.yml');
if (!fs.existsSync(adminPath)) errors.push('Missing admin/index.html');
if (!fs.existsSync(contentPath)) errors.push('Missing content/blog directory');

if (!errors.length) {
  const config = fs.readFileSync(configPath, 'utf8');
  const admin = fs.readFileSync(adminPath, 'utf8');
  for (const token of requiredConfigTokens) {
    if (!config.includes(token)) errors.push(`admin/config.yml missing ${token}`);
  }
  if (!admin.includes('@sveltia/cms')) errors.push('admin/index.html is not loading Sveltia CMS');
  if (!fs.readdirSync(contentPath).some(file => file.endsWith('.md'))) errors.push('content/blog has no Markdown posts');
}

if (errors.length) {
  console.error(errors.map(error => `- ${error}`).join('\n'));
  process.exit(1);
}

console.log('CMS configuration audit passed.');
