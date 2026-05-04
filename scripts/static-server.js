const fs = require('fs');
const http = require('http');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const { spawnSync } = require('child_process');
const { pathToFileURL } = require('url');

const root = path.resolve(__dirname, '..');
const blogContentDir = path.join(root, 'content', 'blog');
const blogStructuredDir = path.join(root, 'content', 'blog-json');
const blogIndexSettingsPath = path.join(root, 'content', 'blog-index.json');
const adminUsersPath = path.join(root, 'content', 'admin-users.json');
const adminAuditLogPath = path.join(root, 'content', 'admin-activity.log');
const blogRevisionDir = path.join(root, 'content', 'revisions', 'blog');
const uploadDir = path.join(root, 'uploads', 'blog');
const mediaThumbDir = path.join(uploadDir, 'thumbs');
const mediaOriginalDir = path.join(uploadDir, 'originals');
const port = Number(process.env.PORT || 4174);
const host = process.env.HOST || '127.0.0.1';
const siteUrl = String(process.env.SITE_URL || 'https://owaisahmedsheikh.netlify.app').replace(/\/+$/, '');
const adminSessions = new Map();
const loginAttempts = new Map();
const sessionTtlMs = 8 * 60 * 60 * 1000;
const loginWindowMs = 15 * 60 * 1000;
const maxLoginAttempts = 5;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

function resolveRequest(urlPath) {
  let requestPath = decodeURIComponent(urlPath.split('?')[0]);
  if (requestPath.endsWith('/')) requestPath += 'index.html';
  if (!path.extname(requestPath)) requestPath += '/index.html';

  const filePath = path.resolve(root, requestPath.replace(/^\/+/, ''));
  if (!filePath.startsWith(root)) return null;
  return filePath;
}

function send(res, status, filePath, body) {
  res.writeHead(status, {
    'Content-Type': mime[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function json(res, status, data, headers = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers
  });
  res.end(JSON.stringify(data));
}

async function readJsonBody(req) {
  const body = await readRequestBody(req);
  try {
    return JSON.parse(body.toString('utf8') || '{}');
  } catch (_error) {
    const error = new Error('Invalid JSON request body.');
    error.statusCode = 400;
    throw error;
  }
}

function parseCookies(cookieHeader = '') {
  return Object.fromEntries(String(cookieHeader)
    .split(';')
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => {
      const index = item.indexOf('=');
      if (index === -1) return [item, ''];
      return [item.slice(0, index), decodeURIComponent(item.slice(index + 1))];
    }));
}

function isSecureCookieRequest(req) {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').toLowerCase();
  const requestHost = String(req.headers.host || host).split(':')[0];
  return forwardedProto === 'https' || !['localhost', '127.0.0.1', '::1'].includes(requestHost);
}

function sessionCookie(value, req, maxAgeSeconds) {
  const parts = [
    `admin_session=${encodeURIComponent(value)}`,
    'HttpOnly',
    'SameSite=Strict',
    'Path=/',
    `Max-Age=${maxAgeSeconds}`
  ];
  if (isSecureCookieRequest(req)) parts.push('Secure');
  return parts.join('; ');
}

function loginAttemptKey(req) {
  return String(req.socket.remoteAddress || 'unknown');
}

function checkLoginRateLimit(req) {
  const key = loginAttemptKey(req);
  const now = Date.now();
  const attempt = loginAttempts.get(key);
  if (!attempt || attempt.resetAt <= now) return false;
  return attempt.count >= maxLoginAttempts;
}

function recordFailedLogin(req) {
  const key = loginAttemptKey(req);
  const now = Date.now();
  const current = loginAttempts.get(key);
  if (!current || current.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + loginWindowMs });
    return;
  }
  current.count += 1;
}

function clearFailedLogins(req) {
  loginAttempts.delete(loginAttemptKey(req));
}

function readAdminUsers() {
  if (!fs.existsSync(adminUsersPath)) return [];
  try {
    const users = JSON.parse(fs.readFileSync(adminUsersPath, 'utf8'));
    return Array.isArray(users) ? users : [];
  } catch (_error) {
    return [];
  }
}

function writeAdminUsers(users) {
  fs.mkdirSync(path.dirname(adminUsersPath), { recursive: true });
  fs.writeFileSync(adminUsersPath, `${JSON.stringify(users, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
}

function validatePasswordStrength(password) {
  const value = String(password || '');
  if (value.length < 12) return 'Password must be at least 12 characters.';
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value) || !/[^A-Za-z0-9]/.test(value)) {
    return 'Password must include uppercase, lowercase, number, and symbol.';
  }
  return '';
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('base64url');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('base64url');
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, passwordHash) {
  const [scheme, salt, expectedHash] = String(passwordHash || '').split('$');
  if (scheme !== 'scrypt' || !salt || !expectedHash) return false;
  const actual = Buffer.from(crypto.scryptSync(String(password), salt, 64).toString('base64url'));
  const expected = Buffer.from(expectedHash);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function createAdminSession(user) {
  const id = crypto.randomBytes(32).toString('base64url');
  const csrf = crypto.randomBytes(32).toString('base64url');
  const session = {
    id,
    csrf,
    user: { username: user.username, role: user.role || 'super_admin' },
    expiresAt: Date.now() + sessionTtlMs
  };
  adminSessions.set(id, session);
  return session;
}

function readAdminSession(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  const sessionId = cookies.admin_session;
  if (!sessionId) return null;
  const session = adminSessions.get(sessionId);
  if (!session || session.expiresAt <= Date.now()) {
    if (session) adminSessions.delete(sessionId);
    return null;
  }
  session.expiresAt = Date.now() + sessionTtlMs;
  return session;
}

function authResponse(session, setupRequired = false) {
  return {
    authenticated: Boolean(session),
    setupRequired,
    user: session ? session.user : null,
    csrfToken: session ? session.csrf : ''
  };
}

function auditDetails(details = {}) {
  return Object.fromEntries(Object.entries(details).filter(([, value]) => value !== undefined && value !== ''));
}

function appendAuditLog(user, action, details = {}) {
  fs.mkdirSync(path.dirname(adminAuditLogPath), { recursive: true });
  const entry = {
    timestamp: new Date().toISOString(),
    user: user?.username || 'anonymous',
    role: user?.role || '',
    action,
    details: auditDetails(details)
  };
  fs.appendFileSync(adminAuditLogPath, `${JSON.stringify(entry)}\n`, { encoding: 'utf8', mode: 0o600 });
}

function requireAdminSession(req, res) {
  const session = readAdminSession(req);
  if (!session) {
    json(res, 401, { error: 'Admin login required.' });
    return null;
  }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method || 'GET')) {
    const csrf = String(req.headers['x-csrf-token'] || '');
    if (!csrf || csrf !== session.csrf) {
      json(res, 403, { error: 'Security token expired. Refresh and sign in again.' });
      return null;
    }
  }
  return session;
}

const defaultBlogIndexSettings = {
  featuredPosts: [
    'ai-search-seo-for-small-businesses',
    'google-business-profile-checklist-karachi'
  ],
  highlightPosts: [
    'google-search-console-seo-decisions',
    'seo-service-pages-that-convert'
  ],
  insight: {
    title: 'Not sure which guide to read first?',
    description: 'Begin with technical fixes, then build content around the services that should bring leads.',
    buttonText: 'Start with technical SEO',
    buttonUrl: '/technical-seo'
  },
  midCta: {
    title: 'Need help turning these guides into real SEO work?',
    description: 'Get service pages, blog content, and technical fixes built around how your customers search.',
    buttonText: 'Get SEO Help',
    buttonUrl: '/seo-content-writing'
  },
  spotlight: {
    label: 'Service business picks',
    title: 'Most useful for service businesses',
    posts: [
      'seo-content-writing-for-business-pages',
      'technical-seo-checklist-small-business',
      'google-business-profile-checklist-karachi'
    ]
  }
};

function normalizeSlugList(values = []) {
  return Array.isArray(values) ? values.map(slugify).filter(Boolean) : [];
}

function normalizeBlogIndexSettings(settings = {}) {
  return {
    featuredPosts: normalizeSlugList(settings.featuredPosts || defaultBlogIndexSettings.featuredPosts),
    highlightPosts: normalizeSlugList(settings.highlightPosts || defaultBlogIndexSettings.highlightPosts),
    insight: {
      ...defaultBlogIndexSettings.insight,
      ...(settings.insight || {})
    },
    midCta: {
      ...defaultBlogIndexSettings.midCta,
      ...(settings.midCta || {})
    },
    spotlight: {
      ...defaultBlogIndexSettings.spotlight,
      ...(settings.spotlight || {}),
      posts: normalizeSlugList((settings.spotlight || {}).posts || defaultBlogIndexSettings.spotlight.posts)
    }
  };
}

function readBlogIndexSettings() {
  if (!fs.existsSync(blogIndexSettingsPath)) return normalizeBlogIndexSettings(defaultBlogIndexSettings);
  try {
    return normalizeBlogIndexSettings(JSON.parse(fs.readFileSync(blogIndexSettingsPath, 'utf8')));
  } catch (_error) {
    return normalizeBlogIndexSettings(defaultBlogIndexSettings);
  }
}

function writeBlogIndexSettings(settings) {
  const normalized = normalizeBlogIndexSettings(settings);
  fs.mkdirSync(path.dirname(blogIndexSettingsPath), { recursive: true });
  fs.writeFileSync(blogIndexSettingsPath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
  return normalized;
}

function stripQuotes(value) {
  const trimmed = String(value || '').trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseValue(raw) {
  const value = String(raw || '').trim();
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^\d+$/.test(value)) return Number(value);
  if (value.startsWith('[') && value.endsWith(']')) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(',').map(item => stripQuotes(item.trim())).filter(Boolean);
  }
  return stripQuotes(value);
}

function parseFrontmatter(fileContent, filePath) {
  if (!fileContent.startsWith('---\n')) {
    throw new Error(`Missing frontmatter in ${filePath}`);
  }

  const end = fileContent.indexOf('\n---', 4);
  if (end === -1) throw new Error(`Unclosed frontmatter in ${filePath}`);

  const raw = fileContent.slice(4, end).trim();
  const body = fileContent.slice(end + 4).trim();
  const data = {};
  const lines = raw.split(/\r?\n/);

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const index = line.indexOf(':');
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1);

    if (!value.trim()) {
      const objectList = [];
      let objectNext = i + 1;
      let currentObject = null;

      while (objectNext < lines.length && /^\s+/.test(lines[objectNext])) {
        const objectLine = lines[objectNext];
        const firstProperty = objectLine.match(/^\s*-\s+([A-Za-z0-9_-]+):\s*(.*)$/);
        const nextProperty = objectLine.match(/^\s{4,}([A-Za-z0-9_-]+):\s*(.*)$/);

        if (firstProperty) {
          currentObject = {};
          currentObject[firstProperty[1]] = parseValue(firstProperty[2]);
          objectList.push(currentObject);
          objectNext += 1;
          continue;
        }

        if (nextProperty && currentObject) {
          currentObject[nextProperty[1]] = parseValue(nextProperty[2]);
          objectNext += 1;
          continue;
        }

        break;
      }

      if (objectList.length) {
        data[key] = objectList;
        i = objectNext - 1;
        continue;
      }

      const list = [];
      let next = i + 1;
      while (next < lines.length && /^\s*-\s+/.test(lines[next])) {
        list.push(parseValue(lines[next].replace(/^\s*-\s+/, '')));
        next += 1;
      }

      if (list.length) {
        data[key] = list;
        i = next - 1;
        continue;
      }
    }

    data[key] = parseValue(value);
  }

  return { data, body };
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function stripMarkdown(value = '') {
  return String(value)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]+]\([^)]*\)/g, ' ')
    .replace(/[#>*_`~|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countWords(value = '') {
  return stripMarkdown(value).split(/\s+/).filter(Boolean).length;
}

function hasInternalLink(value = '') {
  const body = String(value || '');
  return /\[[^\]]+]\(\/(?!\/|#)[^)]+\)/.test(body) || /<a\s+[^>]*href=["']\/(?!\/|#)[^"']+["']/i.test(body);
}

function hasH2(value = '') {
  return /^##\s+\S+/m.test(String(value || ''));
}

function isSafeCmsUrl(value = '') {
  const url = String(value || '').trim();
  if (!url) return true;
  if (url.startsWith('/')) return !url.startsWith('//') && !/[\s<>]/.test(url);
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch (_error) {
    return false;
  }
}

function validatePostForPublish(post) {
  const errors = [];
  const warnings = [];
  const wordCount = countWords(post.body);
  const authorName = String(post.author || 'Owais Ahmed Sheikh').trim();

  if (!String(post.metaTitle || '').trim()) errors.push('Meta title is required before publishing.');
  if (!String(post.metaDescription || '').trim()) errors.push('Meta description is required before publishing.');
  if (!String(post.excerpt || '').trim()) errors.push('Excerpt/subtitle is required before publishing.');
  if (!String(post.category || '').trim()) errors.push('Category is required before publishing.');
  if (!authorName) errors.push('Author is required before publishing.');
  if (!String(post.image || '').trim()) errors.push('Featured image is required before publishing.');
  if (!String(post.imageAlt || '').trim()) errors.push('Featured image alt text is required before publishing.');
  if (!hasH2(post.body)) errors.push('Article needs at least one H2 section heading.');
  if (!isSafeCmsUrl(post.ctaUrl)) errors.push('CTA URL must be a site path or an http(s) URL.');
  if (!isSafeCmsUrl(post.canonical)) errors.push('Canonical URL must be empty, a site path, or an http(s) URL.');

  if (!hasInternalLink(post.body)) warnings.push('Add at least one internal link in the article body.');
  if (wordCount < 300) warnings.push('Article is short; aim for at least 300 words before publishing.');
  if (!String(post.ctaButtonText || '').trim() || !String(post.ctaUrl || '').trim()) warnings.push('Add a primary CTA button text and URL.');

  return { errors, warnings };
}

function absoluteSiteUrl(url = '') {
  const value = String(url || '').trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `${siteUrl}${value.startsWith('/') ? value : `/${value}`}`;
}

function schemaFromPost(post) {
  const slug = slugify(post.slug || post.title);
  const canonical = post.canonical ? absoluteSiteUrl(post.canonical) : `${siteUrl}/blog/${slug}`;
  const imageUrl = absoluteSiteUrl(post.image || '/og-image.png');
  const faqItems = (post.faqItems || []).filter(item => item.question && item.answer);
  const keywords = [
    post.focusKeyword,
    ...(Array.isArray(post.secondaryKeywords) ? post.secondaryKeywords : []),
    ...(Array.isArray(post.tags) ? post.tags : [])
  ].filter(Boolean);
  const authorName = post.author || 'Owais Ahmed Sheikh';
  const imageObject = {
    '@type': 'ImageObject',
    url: imageUrl,
    description: post.imageAlt || post.title || undefined,
    caption: post.imageCredit || undefined
  };

  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Owais Ahmed Sheikh',
      url: siteUrl,
      logo: { '@type': 'ImageObject', url: `${siteUrl}/brand-mark.svg` }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Owais Ahmed Sheikh',
      url: siteUrl
    },
    {
      '@context': 'https://schema.org',
      '@type': post.schemaType || 'BlogPosting',
      headline: post.title,
      description: post.metaDescription || post.excerpt,
      image: imageObject,
      author: { '@type': 'Person', name: authorName, url: `${siteUrl}/about` },
      publisher: { '@type': 'Organization', name: 'Owais Ahmed Sheikh', logo: { '@type': 'ImageObject', url: `${siteUrl}/brand-mark.svg` } },
      datePublished: post.date,
      dateModified: post.updated || post.date,
      mainEntityOfPage: canonical,
      articleSection: post.category || 'SEO',
      keywords: keywords.join(', ') || undefined,
      wordCount: countWords(post.body),
      inLanguage: 'en'
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteUrl}/blog` },
        { '@type': 'ListItem', position: 3, name: post.title || 'Article', item: canonical }
      ]
    }
  ];

  if (faqItems.length) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer }
      }))
    });
  }

  return schemas;
}

function revisionTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function prunePostRevisions(dir, keep = 20) {
  if (!fs.existsSync(dir)) return;
  const markdownRevisions = fs.readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
    .map(entry => {
      const filePath = path.join(dir, entry.name);
      return { filePath, base: entry.name.replace(/\.md$/, ''), mtime: fs.statSync(filePath).mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);

  for (const revision of markdownRevisions.slice(keep)) {
    fs.rmSync(revision.filePath, { force: true });
    fs.rmSync(path.join(dir, `${revision.base}.json`), { force: true });
  }
}

function writePostRevision(slug, filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  const safeSlug = slugify(slug || path.basename(filePath, '.md'));
  if (!safeSlug) return null;
  const dir = path.join(blogRevisionDir, safeSlug);
  fs.mkdirSync(dir, { recursive: true });
  const stamp = revisionTimestamp();
  const markdownTarget = path.join(dir, `${stamp}.md`);
  fs.copyFileSync(filePath, markdownTarget);

  const structuredPath = path.join(blogStructuredDir, `${safeSlug}.json`);
  if (fs.existsSync(structuredPath)) {
    fs.copyFileSync(structuredPath, path.join(dir, `${stamp}.json`));
  }
  prunePostRevisions(dir);
  return markdownTarget;
}

function findPostPath(slug) {
  const safeSlug = slugify(slug);
  if (!safeSlug) return null;
  const directPath = path.join(blogContentDir, `${safeSlug}.md`);
  if (fs.existsSync(directPath)) return directPath;

  for (const file of fs.readdirSync(blogContentDir).filter(item => item.endsWith('.md'))) {
    const filePath = path.join(blogContentDir, file);
    const parsed = parseFrontmatter(fs.readFileSync(filePath, 'utf8'), filePath);
    if ((parsed.data.slug || file.replace(/\.md$/, '')) === safeSlug) return filePath;
  }

  return directPath;
}

function readPost(filePath) {
  const parsed = parseFrontmatter(fs.readFileSync(filePath, 'utf8'), filePath);
  const slug = parsed.data.slug || path.basename(filePath, '.md');
  const structuredPath = path.join(blogStructuredDir, `${slugify(slug)}.json`);
  let structured = {};
  if (fs.existsSync(structuredPath)) {
    try {
      structured = JSON.parse(fs.readFileSync(structuredPath, 'utf8'));
    } catch (_error) {
      structured = {};
    }
  }
  const contentBlocks = Array.isArray(structured.contentBlocks)
    ? structured.contentBlocks
    : Array.isArray(structured.blocks) ? structured.blocks : undefined;
  return {
    ...parsed.data,
    slug,
    body: parsed.body,
    ...(contentBlocks ? { contentBlocks } : {}),
    sourceFile: path.basename(filePath)
  };
}

function writeStructuredPost(post) {
  const slug = slugify(post.slug || post.title);
  if (!slug) return;
  fs.mkdirSync(blogStructuredDir, { recursive: true });
  const payload = {
    title: post.title || '',
    slug,
    excerpt: post.excerpt || '',
    category: post.category || 'Local SEO',
    tags: Array.isArray(post.tags) ? post.tags : [],
    featuredImage: {
      url: post.image || '',
      alt: post.imageAlt || '',
      caption: post.imageCredit || ''
    },
    blocks: Array.isArray(post.contentBlocks) ? post.contentBlocks : [],
    contentBlocks: Array.isArray(post.contentBlocks) ? post.contentBlocks : [],
    seo: {
      metaTitle: post.metaTitle || post.title || '',
      metaDescription: post.metaDescription || post.excerpt || '',
      focusKeyword: post.focusKeyword || ''
    },
    cta: {
      primary: post.globalPrimaryCta || 'Get a Free SEO Audit',
      secondary: post.globalSecondaryCta || 'Subscribe to SEO tips',
      title: post.ctaTitle || '',
      text: post.ctaText || '',
      buttonText: post.ctaButtonText || '',
      url: post.ctaUrl || ''
    },
    advanced: {
      canonical: post.canonical || '',
      noindex: Boolean(post.noindex),
      schemaType: post.schemaType || 'BlogPosting',
      author: post.author || 'Owais Ahmed Sheikh'
    },
    relatedPosts: Array.isArray(post.relatedPosts) ? post.relatedPosts : [],
    updated: new Date().toISOString()
  };
  fs.writeFileSync(path.join(blogStructuredDir, `${slug}.json`), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function titleFromHtml(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const raw = h1 ? h1[1] : title ? title[1] : path.basename(path.dirname(filePath));
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s*\|\s*Owais Ahmed Sheikh\s*$/i, '')
    .trim();
}

function listPages() {
  const ignored = new Set(['admin', 'assets', 'blog', 'content', 'dist', 'functions', 'netlify', 'node_modules', 'scripts', 'uploads', '.git', '.wrangler']);
  return fs.readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !ignored.has(entry.name))
    .map(entry => {
      const filePath = path.join(root, entry.name, 'index.html');
      if (!fs.existsSync(filePath)) return null;
      return {
        title: titleFromHtml(filePath) || entry.name,
        url: `/${entry.name}`,
        section: 'Page'
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.title.localeCompare(b.title));
}

function listMedia() {
  if (!fs.existsSync(uploadDir)) return [];
  const allowed = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);
  return fs.readdirSync(uploadDir, { withFileTypes: true })
    .filter(entry => entry.isFile() && allowed.has(path.extname(entry.name).toLowerCase()))
    .map(entry => {
      const filePath = path.join(uploadDir, entry.name);
      const stat = fs.statSync(filePath);
      const metadataPath = `${filePath}.json`;
      let metadata = {};
      if (fs.existsSync(metadataPath)) {
        try {
          metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        } catch (_error) {
          metadata = {};
        }
      }
      return {
        name: entry.name,
        url: `/uploads/blog/${entry.name}`,
        thumbnailUrl: metadata.thumbnailUrl || `/uploads/blog/${entry.name}`,
        width: metadata.width || '',
        height: metadata.height || '',
        mimeType: metadata.mimeType || mime[path.extname(entry.name).toLowerCase()] || '',
        originalName: metadata.originalName || '',
        alt: metadata.alt || '',
        caption: metadata.caption || '',
        size: stat.size,
        updated: stat.mtime.toISOString()
      };
    })
    .sort((a, b) => b.updated.localeCompare(a.updated));
}

function listPostSummaries() {
  return fs.readdirSync(blogContentDir)
    .filter(file => file.endsWith('.md'))
    .map(file => readPost(path.join(blogContentDir, file)))
    .sort((a, b) => String(b.updated || b.date || '').localeCompare(String(a.updated || a.date || '')))
    .map(post => ({
      title: post.title,
      slug: post.slug,
      category: post.category,
      date: post.date,
      updated: post.updated,
      readingTime: post.readingTime,
      draft: post.draft,
      featured: post.featured
    }));
}

function detectImageType(fileBuffer) {
  if (fileBuffer.length >= 8 && fileBuffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { ext: '.png', mimeType: 'image/png' };
  }
  if (fileBuffer.length >= 3 && fileBuffer[0] === 0xff && fileBuffer[1] === 0xd8 && fileBuffer[2] === 0xff) {
    return { ext: '.jpg', mimeType: 'image/jpeg' };
  }
  if (fileBuffer.length >= 12 && fileBuffer.toString('ascii', 0, 4) === 'RIFF' && fileBuffer.toString('ascii', 8, 12) === 'WEBP') {
    return { ext: '.webp', mimeType: 'image/webp' };
  }
  if (fileBuffer.length >= 6) {
    const signature = fileBuffer.toString('ascii', 0, 6);
    if (signature === 'GIF87a' || signature === 'GIF89a') return { ext: '.gif', mimeType: 'image/gif' };
  }
  return null;
}

function parseMultipartFile(buffer, contentType) {
  const boundaryMatch = String(contentType || '').match(/boundary=([^;]+)/i);
  if (!boundaryMatch) throw new Error('Missing upload boundary.');

  const boundary = `--${boundaryMatch[1]}`;
  const body = buffer.toString('binary');
  const parts = body.split(boundary).filter(part => part.includes('Content-Disposition'));
  const part = parts.find(item => /name="?image"?/i.test(item));
  if (!part) throw new Error('No image file was uploaded.');

  const headerEnd = part.indexOf('\r\n\r\n');
  if (headerEnd === -1) throw new Error('Invalid upload payload.');

  const headers = part.slice(0, headerEnd);
  const filenameMatch = headers.match(/filename="([^"]+)"|filename=([^\r\n;]+)/i);
  const typeMatch = headers.match(/Content-Type:\s*([^\r\n]+)/i);
  if (!filenameMatch) throw new Error('Uploaded file needs a filename.');

  const originalName = path.basename(filenameMatch[1] || filenameMatch[2]).replace(/[^A-Za-z0-9._-]/g, '-');
  const ext = path.extname(originalName).toLowerCase();
  const allowedExt = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);
  const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
  const mediaType = (typeMatch ? typeMatch[1] : '').trim().toLowerCase();

  if (!allowedExt.has(ext) || !allowedTypes.has(mediaType)) {
    throw new Error('Only PNG, JPG, WEBP, and GIF images are allowed.');
  }

  const start = headerEnd + 4;
  let content = part.slice(start);
  if (content.endsWith('\r\n')) content = content.slice(0, -2);
  const fileBuffer = Buffer.from(content, 'binary');
  if (!fileBuffer.length) throw new Error('Uploaded image is empty.');
  if (fileBuffer.length > 5 * 1024 * 1024) throw new Error('Image must be 5MB or smaller.');
  const detected = detectImageType(fileBuffer);
  const normalizedExt = ext === '.jpeg' ? '.jpg' : ext;
  if (!detected || detected.ext !== normalizedExt || detected.mimeType !== mediaType) {
    throw new Error('Uploaded file content does not match a safe image type.');
  }

  return { originalName, ext, mediaType, fileBuffer };
}

async function optimizeUploadedImage(upload) {
  fs.mkdirSync(uploadDir, { recursive: true });
  fs.mkdirSync(mediaThumbDir, { recursive: true });
  fs.mkdirSync(mediaOriginalDir, { recursive: true });

  const base = path.basename(upload.originalName, upload.ext);
  const safeBase = slugify(base) || 'image';
  let counter = 1;
  let filename = `${safeBase}.webp`;
  while (fs.existsSync(path.join(uploadDir, filename))) {
    counter += 1;
    filename = `${safeBase}-${counter}.webp`;
  }

  const outputPath = path.join(uploadDir, filename);
  const thumbName = filename.replace(/\.webp$/, '-thumb.webp');
  const thumbPath = path.join(mediaThumbDir, thumbName);
  const originalName = `${path.basename(filename, '.webp')}${upload.ext}`;
  const originalPath = path.join(mediaOriginalDir, originalName);

  fs.writeFileSync(originalPath, upload.fileBuffer);

  const image = sharp(upload.fileBuffer, { failOn: 'warning' }).rotate();
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error('Could not read image dimensions.');
  }

  const optimizedBuffer = await sharp(upload.fileBuffer, { failOn: 'warning' })
    .rotate()
    .resize({ width: 1600, height: 1200, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, effort: 5 })
    .toBuffer();

  const thumbBuffer = await sharp(upload.fileBuffer, { failOn: 'warning' })
    .rotate()
    .resize({ width: 480, height: 320, fit: 'cover', withoutEnlargement: false })
    .webp({ quality: 76, effort: 4 })
    .toBuffer();

  fs.writeFileSync(outputPath, optimizedBuffer);
  fs.writeFileSync(thumbPath, thumbBuffer);

  const optimizedMeta = await sharp(optimizedBuffer).metadata();
  const media = {
    name: filename,
    originalName: upload.originalName,
    url: `/uploads/blog/${filename}`,
    thumbnailUrl: `/uploads/blog/thumbs/${thumbName}`,
    originalUrl: `/uploads/blog/originals/${originalName}`,
    width: optimizedMeta.width || metadata.width,
    height: optimizedMeta.height || metadata.height,
    mimeType: 'image/webp',
    sourceMimeType: upload.mediaType,
    size: optimizedBuffer.length,
    originalSize: upload.fileBuffer.length,
    updated: new Date().toISOString()
  };

  fs.writeFileSync(`${outputPath}.json`, `${JSON.stringify(media, null, 2)}\n`, 'utf8');
  return media;
}

function deleteMediaAsset(filename) {
  const safeName = path.basename(filename || '');
  if (!safeName || !/\.(png|jpe?g|webp|gif)$/i.test(safeName)) {
    throw new Error('Invalid media filename.');
  }
  const target = path.join(uploadDir, safeName);
  if (!target.startsWith(`${uploadDir}${path.sep}`) || !fs.existsSync(target)) {
    throw new Error('Media item not found.');
  }

  let metadata = {};
  const metadataPath = `${target}.json`;
  if (fs.existsSync(metadataPath)) {
    try {
      metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    } catch (_error) {
      metadata = {};
    }
  }

  const linked = [target, metadataPath];
  for (const key of ['thumbnailUrl', 'originalUrl']) {
    if (!metadata[key]) continue;
    const relative = String(metadata[key]).replace(/^\/+/, '');
    const filePath = path.resolve(root, relative);
    if (filePath.startsWith(`${uploadDir}${path.sep}`)) linked.push(filePath);
  }

  for (const filePath of [...new Set(linked)]) {
    if (fs.existsSync(filePath)) fs.rmSync(filePath, { force: true });
  }
}

function yamlScalar(value) {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return JSON.stringify(String(value || ''));
}

function yamlArray(values = []) {
  const items = Array.isArray(values) ? values.filter(Boolean) : [];
  return `[${items.map(item => JSON.stringify(String(item))).join(', ')}]`;
}

function yamlObjectList(values = []) {
  if (!Array.isArray(values) || !values.length) return '[]';
  return values.map(item => {
    const keys = Object.keys(item).filter(key => item[key] !== undefined && item[key] !== null);
    return keys.map((key, index) => {
      const prefix = index === 0 ? '  - ' : '    ';
      return `${prefix}${key}: ${JSON.stringify(String(item[key] || ''))}`;
    }).join('\n');
  }).join('');
}

function renderMarkdownFile(post) {
  const data = {
    draft: Boolean(post.draft),
    featured: Boolean(post.featured),
    title: post.title || '',
    slug: slugify(post.slug || post.title),
    category: post.category || 'Local SEO',
    tags: Array.isArray(post.tags) ? post.tags : [],
    focusKeyword: post.focusKeyword || '',
    secondaryKeywords: Array.isArray(post.secondaryKeywords) ? post.secondaryKeywords : [],
    excerpt: post.excerpt || '',
    metaTitle: post.metaTitle || post.title || '',
    metaDescription: post.metaDescription || post.excerpt || '',
    heroTitle: post.heroTitle || post.title || '',
    heroAccent: post.heroAccent || '',
    date: post.date || new Date().toISOString().slice(0, 10),
    updated: post.updated || new Date().toISOString().slice(0, 10),
    readingTime: Number(post.readingTime || 6),
    image: post.image || '',
    imageAlt: post.imageAlt || '',
    imageCredit: post.imageCredit || '',
    trustNote: post.trustNote || '',
    relatedPosts: Array.isArray(post.relatedPosts) ? post.relatedPosts : [],
    globalPrimaryCta: post.globalPrimaryCta || 'Get a Free SEO Audit',
    globalSecondaryCta: post.globalSecondaryCta || 'Subscribe to SEO tips',
    showToc: post.showToc !== false,
    showShare: post.showShare !== false,
    showRelated: post.showRelated !== false,
    showSidebarCta: post.showSidebarCta !== false,
    canonical: post.canonical || '',
    noindex: Boolean(post.noindex),
    schemaType: post.schemaType || 'BlogPosting',
    author: post.author || 'Owais Ahmed Sheikh',
    typographyScale: post.typographyScale || 'comfortable',
    articleTheme: post.articleTheme || 'dark',
    accentColor: post.accentColor || '#2ff28a',
    showNewsletter: post.showNewsletter !== false,
    newsletterTitle: post.newsletterTitle || 'Want practical SEO tips in your inbox?',
    newsletterText: post.newsletterText || 'Get clear SEO, content, and local search advice written for business owners. No spam.',
    ctaTitle: post.ctaTitle || 'Want help with this on your website?',
    ctaText: post.ctaText || 'Send me your site and I will tell you the first SEO fixes I would make.',
    ctaButtonText: post.ctaButtonText || 'Get a Free SEO Audit',
    ctaUrl: post.ctaUrl || '/free-seo-audit',
    faqItems: Array.isArray(post.faqItems) ? post.faqItems : [],
    showFramework: post.showFramework === true,
    frameworkLabel: post.frameworkLabel || '',
    frameworkTitle: post.frameworkTitle || '',
    frameworkIntro: post.frameworkIntro || '',
    frameworkCoreLabel: post.frameworkCoreLabel || '',
    frameworkCoreTitle: post.frameworkCoreTitle || '',
    frameworkCoreText: post.frameworkCoreText || '',
    frameworkNodes: Array.isArray(post.frameworkNodes) ? post.frameworkNodes : [],
    frameworkSteps: Array.isArray(post.frameworkSteps) ? post.frameworkSteps : []
  };

  return `---\n` +
    `draft: ${yamlScalar(data.draft)}\n` +
    `featured: ${yamlScalar(data.featured)}\n` +
    `title: ${yamlScalar(data.title)}\n` +
    `slug: ${yamlScalar(data.slug)}\n` +
    `category: ${yamlScalar(data.category)}\n` +
    `tags: ${yamlArray(data.tags)}\n` +
    `focusKeyword: ${yamlScalar(data.focusKeyword)}\n` +
    `secondaryKeywords: ${yamlArray(data.secondaryKeywords)}\n` +
    `excerpt: ${yamlScalar(data.excerpt)}\n` +
    `metaTitle: ${yamlScalar(data.metaTitle)}\n` +
    `metaDescription: ${yamlScalar(data.metaDescription)}\n` +
    `heroTitle: ${yamlScalar(data.heroTitle)}\n` +
    `heroAccent: ${yamlScalar(data.heroAccent)}\n` +
    `date: ${yamlScalar(data.date)}\n` +
    `updated: ${yamlScalar(data.updated)}\n` +
    `readingTime: ${yamlScalar(data.readingTime)}\n` +
    `image: ${yamlScalar(data.image)}\n` +
    `imageAlt: ${yamlScalar(data.imageAlt)}\n` +
    `imageCredit: ${yamlScalar(data.imageCredit)}\n` +
    `trustNote: ${yamlScalar(data.trustNote)}\n` +
    `relatedPosts: ${yamlArray(data.relatedPosts)}\n` +
    `globalPrimaryCta: ${yamlScalar(data.globalPrimaryCta)}\n` +
    `globalSecondaryCta: ${yamlScalar(data.globalSecondaryCta)}\n` +
    `showToc: ${yamlScalar(data.showToc)}\n` +
    `showShare: ${yamlScalar(data.showShare)}\n` +
    `showRelated: ${yamlScalar(data.showRelated)}\n` +
    `showSidebarCta: ${yamlScalar(data.showSidebarCta)}\n` +
    `canonical: ${yamlScalar(data.canonical)}\n` +
    `noindex: ${yamlScalar(data.noindex)}\n` +
    `schemaType: ${yamlScalar(data.schemaType)}\n` +
    `author: ${yamlScalar(data.author)}\n` +
    `typographyScale: ${yamlScalar(data.typographyScale)}\n` +
    `articleTheme: ${yamlScalar(data.articleTheme)}\n` +
    `accentColor: ${yamlScalar(data.accentColor)}\n` +
    `showNewsletter: ${yamlScalar(data.showNewsletter)}\n` +
    `newsletterTitle: ${yamlScalar(data.newsletterTitle)}\n` +
    `newsletterText: ${yamlScalar(data.newsletterText)}\n` +
    `ctaTitle: ${yamlScalar(data.ctaTitle)}\n` +
    `ctaText: ${yamlScalar(data.ctaText)}\n` +
    `ctaButtonText: ${yamlScalar(data.ctaButtonText)}\n` +
    `ctaUrl: ${yamlScalar(data.ctaUrl)}\n` +
    `faqItems:${yamlObjectList(data.faqItems)}\n` +
    `showFramework: ${yamlScalar(data.showFramework)}\n` +
    `frameworkLabel: ${yamlScalar(data.frameworkLabel)}\n` +
    `frameworkTitle: ${yamlScalar(data.frameworkTitle)}\n` +
    `frameworkIntro: ${yamlScalar(data.frameworkIntro)}\n` +
    `frameworkCoreLabel: ${yamlScalar(data.frameworkCoreLabel)}\n` +
    `frameworkCoreTitle: ${yamlScalar(data.frameworkCoreTitle)}\n` +
    `frameworkCoreText: ${yamlScalar(data.frameworkCoreText)}\n` +
    `frameworkNodes:${yamlObjectList(data.frameworkNodes)}\n` +
    `frameworkSteps:${yamlObjectList(data.frameworkSteps)}\n` +
    `---\n\n${String(post.body || '').trim()}\n`;
}

function rebuildBlog() {
  const result = spawnSync(process.execPath, [path.join(root, 'scripts', 'build-blog.js')], {
    cwd: root,
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || 'Blog build failed').trim());
  }
}

async function handleAdminApi(req, res) {
  const url = new URL(req.url || '/', `http://${host}:${port}`);
  const parts = url.pathname.split('/').filter(Boolean);
  const users = readAdminUsers();
  const setupRequired = users.length === 0;

  if (parts.length === 3 && parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'session' && req.method === 'GET') {
    json(res, 200, authResponse(readAdminSession(req), setupRequired));
    return;
  }

  if (parts.length === 3 && parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'setup' && req.method === 'POST') {
    if (!setupRequired) {
      json(res, 409, { error: 'Admin user already exists.' });
      return;
    }

    const incoming = await readJsonBody(req);
    const username = String(incoming.username || '').trim().toLowerCase();
    const password = String(incoming.password || '');
    if (!/^[a-z0-9._-]{3,60}$/.test(username)) {
      json(res, 400, { error: 'Username must use 3-60 letters, numbers, dots, dashes, or underscores.' });
      return;
    }
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      json(res, 400, { error: passwordError });
      return;
    }

    const user = {
      id: crypto.randomUUID(),
      username,
      role: 'super_admin',
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString()
    };
    writeAdminUsers([user]);
    const session = createAdminSession(user);
    appendAuditLog(session.user, 'admin.setup', { username });
    json(res, 200, authResponse(session, false), {
      'Set-Cookie': sessionCookie(session.id, req, Math.floor(sessionTtlMs / 1000))
    });
    return;
  }

  if (parts.length === 3 && parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'login' && req.method === 'POST') {
    if (setupRequired) {
      json(res, 409, { error: 'Create the first admin user before logging in.' });
      return;
    }
    if (checkLoginRateLimit(req)) {
      json(res, 429, { error: 'Too many failed attempts. Try again in 15 minutes.' });
      return;
    }

    const incoming = await readJsonBody(req);
    const username = String(incoming.username || '').trim().toLowerCase();
    const password = String(incoming.password || '');
    const user = users.find(item => String(item.username || '').toLowerCase() === username);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      recordFailedLogin(req);
      appendAuditLog({ username, role: '' }, 'admin.login.failed', {});
      json(res, 401, { error: 'Invalid username or password.' });
      return;
    }

    clearFailedLogins(req);
    const session = createAdminSession(user);
    appendAuditLog(session.user, 'admin.login.success', {});
    json(res, 200, authResponse(session, false), {
      'Set-Cookie': sessionCookie(session.id, req, Math.floor(sessionTtlMs / 1000))
    });
    return;
  }

  if (parts.length === 3 && parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'logout' && req.method === 'POST') {
    const session = readAdminSession(req);
    if (session && String(req.headers['x-csrf-token'] || '') !== session.csrf) {
      json(res, 403, { error: 'Security token expired. Refresh and sign in again.' });
      return;
    }
    if (session) appendAuditLog(session.user, 'admin.logout', {});
    if (session) adminSessions.delete(session.id);
    json(res, 200, { ok: true }, {
      'Set-Cookie': sessionCookie('', req, 0)
    });
    return;
  }

  const session = requireAdminSession(req, res);
  if (!session) return;

  if (parts.length === 3 && parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'library' && req.method === 'GET') {
    json(res, 200, {
      posts: listPostSummaries(),
      pages: listPages(),
      media: listMedia(),
      blogIndex: readBlogIndexSettings()
    });
    return;
  }

  if (parts.length === 3 && parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'blog-index') {
    if (req.method === 'GET') {
      json(res, 200, readBlogIndexSettings());
      return;
    }

    if (req.method === 'POST') {
      const incoming = await readJsonBody(req);
      const settings = writeBlogIndexSettings(incoming);
      rebuildBlog();
      appendAuditLog(session.user, 'blog_index.update', {});
      json(res, 200, settings);
      return;
    }
  }

  if (parts.length === 3 && parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'schema-preview' && req.method === 'POST') {
    const post = await readJsonBody(req);
    const validation = validatePostForPublish({ ...post, draft: false });
    json(res, 200, {
      schemas: schemaFromPost(post),
      errors: validation.errors,
      warnings: validation.warnings
    });
    return;
  }

  if (parts.length === 3 && parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'upload' && req.method === 'POST') {
    const body = await readRequestBody(req);
    const upload = parseMultipartFile(body, req.headers['content-type']);
    const media = await optimizeUploadedImage(upload);
    appendAuditLog(session.user, 'media.upload', { filename: media.name, size: media.size, originalSize: media.originalSize });
    json(res, 200, {
      ...media,
      media: listMedia()
    });
    return;
  }

  if (parts.length === 4 && parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'media' && req.method === 'DELETE') {
    const filename = path.basename(parts[3]);
    deleteMediaAsset(filename);
    appendAuditLog(session.user, 'media.delete', { filename });
    json(res, 200, { ok: true, media: listMedia() });
    return;
  }

  if (parts.length === 3 && parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'posts' && req.method === 'GET') {
    json(res, 200, { posts: listPostSummaries() });
    return;
  }

  if (parts.length === 4 && parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'posts') {
    const slug = slugify(parts[3]);
    if (!slug) {
      json(res, 400, { error: 'Invalid slug.' });
      return;
    }

    const filePath = findPostPath(slug);

    if (req.method === 'GET') {
      if (!filePath || !fs.existsSync(filePath)) {
        json(res, 404, { error: 'Post not found.' });
        return;
      }
      json(res, 200, readPost(filePath));
      return;
    }

    if (req.method === 'POST') {
      const incoming = await readJsonBody(req);
      const nextSlug = slugify(incoming.slug || incoming.title);
      if (!nextSlug || !incoming.title || !incoming.body) {
        json(res, 400, { error: 'Title, slug, and body are required.' });
        return;
      }

      const existing = filePath && fs.existsSync(filePath) ? readPost(filePath) : {};
      const post = { ...existing, ...incoming, slug: nextSlug };
      const nextPath = path.join(blogContentDir, `${nextSlug}.md`);
      const duplicatePath = findPostPath(nextSlug);
      if (duplicatePath && fs.existsSync(duplicatePath) && path.resolve(duplicatePath) !== path.resolve(filePath || '')) {
        json(res, 409, { error: 'A post with this slug already exists.' });
        return;
      }
      let publishWarnings = [];
      if (post.draft === false) {
        const validation = validatePostForPublish(post);
        publishWarnings = validation.warnings;
        if (validation.errors.length) {
          json(res, 422, { error: 'Fix publish checks before publishing.', issues: validation.errors });
          return;
        }
      }
      const revisionPath = fs.existsSync(filePath) ? writePostRevision(existing.slug || slug, filePath) : null;
      fs.writeFileSync(nextPath, renderMarkdownFile(post), 'utf8');
      writeStructuredPost(post);

      if (filePath && filePath !== nextPath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      if (slug && slug !== nextSlug) {
        const oldStructuredPath = path.join(blogStructuredDir, `${slug}.json`);
        if (fs.existsSync(oldStructuredPath)) fs.unlinkSync(oldStructuredPath);
      }

      rebuildBlog();
      appendAuditLog(session.user, post.draft === false ? 'post.publish' : 'post.save', {
        slug: nextSlug,
        previousSlug: slug !== nextSlug ? slug : undefined,
        revision: revisionPath ? path.relative(root, revisionPath) : undefined,
        warnings: publishWarnings.length ? publishWarnings : undefined
      });
      json(res, 200, { ...readPost(nextPath), publishWarnings });
      return;
    }
  }

  json(res, 404, { error: 'Admin API route not found.' });
}

async function handleAiAssistant(req, res) {
  globalThis.Netlify = {
    env: {
      get: key => process.env[key] || ''
    }
  };

  const functionUrl = pathToFileURL(path.join(root, 'netlify', 'functions', 'ai-assistant.mts')).href;
  const mod = await import(functionUrl);
  const body = ['GET', 'HEAD'].includes(req.method || '') ? undefined : await readRequestBody(req);
  const request = new Request(`http://${host}:${port}${req.url || '/api/ai-assistant'}`, {
    method: req.method,
    headers: req.headers,
    body
  });
  const response = await mod.default(request);
  const responseBody = Buffer.from(await response.arrayBuffer());
  const headers = {};

  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  res.writeHead(response.status, headers);
  res.end(responseBody);
}

const server = http.createServer((req, res) => {
  if ((req.url || '').split('?')[0].startsWith('/api/admin/')) {
    handleAdminApi(req, res).catch(error => {
      json(res, error.statusCode || 500, { error: error.message || 'Admin API error.' });
    });
    return;
  }

  if ((req.url || '').split('?')[0] === '/api/ai-assistant') {
    handleAiAssistant(req, res).catch(() => {
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      });
      res.end(JSON.stringify({
        answer: 'I can help with SEO audits, local SEO, technical SEO, content writing, pricing, and the best next step for your website. Tell me your business type, city, website URL, and what you want to improve.',
        mode: 'fallback'
      }));
    });
    return;
  }

  const filePath = resolveRequest(req.url || '/');
  if (!filePath) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, body) => {
    if (!error) {
      send(res, 200, filePath, body);
      return;
    }

    const notFound = path.join(root, '404.html');
    fs.readFile(notFound, (notFoundError, notFoundBody) => {
      if (notFoundError) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
        return;
      }
      send(res, 404, notFound, notFoundBody);
    });
  });
});

server.listen(port, host, () => {
  console.log(`Local preview running at http://${host}:${port}/`);
});
