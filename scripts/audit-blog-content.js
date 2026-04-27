const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const contentDir = path.join(root, 'content', 'blog');

function parseValue(raw) {
  const value = raw.trim();
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^\d+$/.test(value)) return Number(value);
  if (value.startsWith('[') && value.endsWith(']')) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(',').map(item => item.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  }
  return value.replace(/^["']|["']$/g, '');
}

function parseFrontmatter(fileContent, filePath) {
  if (!fileContent.startsWith('---\n')) throw new Error(`Missing frontmatter: ${filePath}`);
  const end = fileContent.indexOf('\n---', 4);
  if (end === -1) throw new Error(`Unclosed frontmatter: ${filePath}`);
  const raw = fileContent.slice(4, end).trim();
  const body = fileContent.slice(end + 4).trim();
  const data = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const index = line.indexOf(':');
    if (index === -1) continue;
    data[line.slice(0, index).trim()] = parseValue(line.slice(index + 1));
  }
  return { data, body };
}

function assert(condition, message, issues) {
  if (!condition) issues.push(message);
}

function auditPost(filePath) {
  const { data, body } = parseFrontmatter(fs.readFileSync(filePath, 'utf8'), filePath);
  const issues = [];
  const required = ['title', 'slug', 'category', 'excerpt', 'metaTitle', 'metaDescription', 'date', 'updated', 'readingTime', 'ctaTitle', 'ctaText', 'ctaButtonText', 'ctaUrl'];
  required.forEach(field => assert(data[field] !== undefined && data[field] !== '', `${field} is missing`, issues));
  assert(String(data.metaTitle || '').length <= 70, 'metaTitle is longer than 70 characters', issues);
  assert(String(data.metaDescription || '').length >= 90, 'metaDescription is shorter than 90 characters', issues);
  assert(String(data.metaDescription || '').length <= 165, 'metaDescription is longer than 165 characters', issues);
  assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(data.slug || '')), 'slug must use lowercase hyphen format', issues);
  assert((body.match(/^##\s+/gm) || []).length >= 3, 'body should include at least three H2 sections', issues);
  assert(body.length >= 2200, 'body should be at least 2,200 characters for a useful SEO article', issues);
  assert(!/[“”‘’—]/.test(body + JSON.stringify(data)), 'content contains curly quotes or em dash characters', issues);
  assert(!/(streamlined|cutting-edge|leverage|unlock|game-changing)/i.test(body), 'content contains avoidable buzzwords', issues);
  if (data.focusKeyword) {
    const text = `${data.title} ${data.excerpt} ${body}`.toLowerCase();
    assert(text.includes(String(data.focusKeyword).toLowerCase().split(' ')[0]), 'focus keyword topic is not visible in the article text', issues);
  }
  return { filePath, issues };
}

function auditComment(filePath) {
  const { data, body } = parseFrontmatter(fs.readFileSync(filePath, 'utf8'), filePath);
  const issues = [];
  assert(data.postSlug, 'postSlug is missing', issues);
  assert(data.name, 'name is missing', issues);
  assert(data.date, 'date is missing', issues);
  assert(body.length >= 20, 'comment is too short to be useful', issues);
  assert(!/<script|javascript:/i.test(body), 'comment contains unsafe script-like content', issues);
  assert(!/[“”‘’—]/.test(body + JSON.stringify(data)), 'comment contains curly quotes or em dash characters', issues);
  return { filePath, issues };
}

function main() {
  const files = fs.readdirSync(contentDir).filter(file => file.endsWith('.md')).map(file => path.join(contentDir, file));
  const results = files.map(auditPost);
  const commentsDir = path.join(root, 'content', 'comments');
  if (fs.existsSync(commentsDir)) {
    fs.readdirSync(commentsDir)
      .filter(file => file.endsWith('.md'))
      .map(file => path.join(commentsDir, file))
      .forEach(file => results.push(auditComment(file)));
  }
  const failures = results.filter(result => result.issues.length);
  if (failures.length) {
    for (const failure of failures) {
      console.error(`\n${failure.filePath}`);
      failure.issues.forEach(issue => console.error(`- ${issue}`));
    }
    process.exit(1);
  }
  console.log(`Blog content audit passed for ${results.length} content files.`);
}

main();
