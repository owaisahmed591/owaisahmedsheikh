type Env = {
  ADMIN_KV?: KVNamespace;
  MEDIA_BUCKET?: R2Bucket;
  GITHUB_TOKEN?: string;
  GITHUB_REPO?: string;
  GITHUB_BRANCH?: string;
  SITE_URL?: string;
};

const SESSION_TTL_SECONDS = 8 * 60 * 60;
const LOGIN_WINDOW_SECONDS = 15 * 60;
const MAX_LOGIN_ATTEMPTS = 5;
const PBKDF2_ITERATIONS = 100000;

function json(status: number, body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      ...headers
    }
  });
}

function text(status: number, message: string) {
  return new Response(message, {
    status,
    headers: { 'Cache-Control': 'no-store' }
  });
}

function requireEnv(env: Env) {
  if (!env.ADMIN_KV) return 'ADMIN_KV binding is required.';
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) return 'GITHUB_TOKEN and GITHUB_REPO are required.';
  return '';
}

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map(item => item.trim()).filter(Boolean).map(item => {
    const index = item.indexOf('=');
    return index === -1 ? [item, ''] : [item.slice(0, index), decodeURIComponent(item.slice(index + 1))];
  }));
}

function cookie(name: string, value: string, maxAge: number) {
  return `${name}=${encodeURIComponent(value)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

function slugify(value: unknown) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function stripQuotes(value: string) {
  const trimmed = String(value || '').trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseValue(raw: string): any {
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

function parseFrontmatter(fileContent: string) {
  if (!fileContent.startsWith('---\n')) return { data: {}, body: fileContent.trim() };
  const end = fileContent.indexOf('\n---', 4);
  if (end === -1) return { data: {}, body: fileContent.trim() };
  const raw = fileContent.slice(4, end).trim();
  const body = fileContent.slice(end + 4).trim();
  const data: Record<string, any> = {};
  const lines = raw.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const index = line.indexOf(':');
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1);
    if (!value.trim()) {
      const list: any[] = [];
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

function yamlScalar(value: any) {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return JSON.stringify(String(value || ''));
}

function yamlArray(values: any[] = []) {
  const items = Array.isArray(values) ? values.filter(Boolean) : [];
  return `[${items.map(item => JSON.stringify(String(item))).join(', ')}]`;
}

function renderMarkdownFile(post: any) {
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
    date: post.date || new Date().toISOString().slice(0, 10),
    updated: new Date().toISOString().slice(0, 10),
    readingTime: Number(post.readingTime || 6),
    image: post.image || '',
    imageAlt: post.imageAlt || '',
    imageCredit: post.imageCredit || '',
    trustNote: post.trustNote || '',
    relatedPosts: Array.isArray(post.relatedPosts) ? post.relatedPosts : [],
    ctaTitle: post.ctaTitle || '',
    ctaText: post.ctaText || '',
    ctaButtonText: post.ctaButtonText || '',
    ctaUrl: post.ctaUrl || '',
    canonical: post.canonical || '',
    noindex: Boolean(post.noindex),
    schemaType: post.schemaType || 'BlogPosting',
    author: post.author || 'Owais Ahmed Sheikh'
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
    `date: ${yamlScalar(data.date)}\n` +
    `updated: ${yamlScalar(data.updated)}\n` +
    `readingTime: ${yamlScalar(data.readingTime)}\n` +
    `image: ${yamlScalar(data.image)}\n` +
    `imageAlt: ${yamlScalar(data.imageAlt)}\n` +
    `imageCredit: ${yamlScalar(data.imageCredit)}\n` +
    `trustNote: ${yamlScalar(data.trustNote)}\n` +
    `relatedPosts: ${yamlArray(data.relatedPosts)}\n` +
    `ctaTitle: ${yamlScalar(data.ctaTitle)}\n` +
    `ctaText: ${yamlScalar(data.ctaText)}\n` +
    `ctaButtonText: ${yamlScalar(data.ctaButtonText)}\n` +
    `ctaUrl: ${yamlScalar(data.ctaUrl)}\n` +
    `canonical: ${yamlScalar(data.canonical)}\n` +
    `noindex: ${yamlScalar(data.noindex)}\n` +
    `schemaType: ${yamlScalar(data.schemaType)}\n` +
    `author: ${yamlScalar(data.author)}\n` +
    `---\n\n${String(post.body || '').trim()}\n`;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToString(value: string) {
  const binary = atob(value.replace(/\n/g, ''));
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function github(env: Env, path: string, init: RequestInit = {}) {
  const branch = env.GITHUB_BRANCH || 'main';
  const url = `https://api.github.com/repos/${env.GITHUB_REPO}${path}${path.includes('?') ? '&' : '?'}ref=${encodeURIComponent(branch)}`;
  return fetch(url, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'owais-admin-cms',
      ...(init.headers || {})
    }
  });
}

async function readGithubFile(env: Env, filePath: string) {
  const response = await github(env, `/contents/${filePath}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub read failed for ${filePath}`);
  const data: any = await response.json();
  return { content: base64ToString(data.content || ''), sha: data.sha };
}

async function writeGithubFile(env: Env, filePath: string, content: string, message: string) {
  const existing = await readGithubFile(env, filePath).catch(() => null);
  const body: Record<string, unknown> = {
    message,
    content: bytesToBase64(new TextEncoder().encode(content)),
    branch: env.GITHUB_BRANCH || 'main'
  };
  if (existing?.sha) body.sha = existing.sha;
  const response = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/contents/${filePath}`, {
    method: 'PUT',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'owais-admin-cms'
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`GitHub write failed for ${filePath}`);
  return response.json();
}

async function writeGithubBase64File(env: Env, filePath: string, contentBase64: string, message: string) {
  const existing = await readGithubFile(env, filePath).catch(() => null);
  const body: Record<string, unknown> = {
    message,
    content: contentBase64,
    branch: env.GITHUB_BRANCH || 'main'
  };
  if (existing?.sha) body.sha = existing.sha;
  const response = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/contents/${filePath}`, {
    method: 'PUT',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'owais-admin-cms'
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`GitHub write failed for ${filePath}`);
  return response.json();
}

async function listPosts(env: Env) {
  const response = await github(env, '/contents/content/blog');
  if (!response.ok) return [];
  const files: any[] = await response.json();
  const markdownFiles = files.filter(file => file.type === 'file' && file.name.endsWith('.md')).slice(0, 100);
  const posts = await Promise.all(markdownFiles.map(async file => {
    const found = await readGithubFile(env, `content/blog/${file.name}`);
    if (!found) return null;
    const parsed = parseFrontmatter(found.content);
    const slug = parsed.data.slug || file.name.replace(/\.md$/, '');
    return {
      title: parsed.data.title || slug,
      slug,
      category: parsed.data.category || 'SEO',
      date: parsed.data.date || '',
      updated: parsed.data.updated || '',
      readingTime: parsed.data.readingTime || 6,
      draft: Boolean(parsed.data.draft),
      featured: Boolean(parsed.data.featured)
    };
  }));
  return posts.filter(Boolean).sort((a: any, b: any) => String(b.updated || b.date || '').localeCompare(String(a.updated || a.date || '')));
}

async function readPost(env: Env, slug: string) {
  const safeSlug = slugify(slug);
  const found = await readGithubFile(env, `content/blog/${safeSlug}.md`);
  if (!found) return null;
  const parsed = parseFrontmatter(found.content);
  return { ...parsed.data, slug: parsed.data.slug || safeSlug, body: parsed.body };
}

async function getUsers(env: Env) {
  const raw = await env.ADMIN_KV!.get('admin-users', 'json');
  return Array.isArray(raw) ? raw as any[] : [];
}

async function putUsers(env: Env, users: any[]) {
  await env.ADMIN_KV!.put('admin-users', JSON.stringify(users));
}

async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' }, key, 256);
  return `pbkdf2$${bytesToBase64(salt)}$${bytesToBase64(new Uint8Array(bits))}`;
}

async function verifyPassword(password: string, stored = '') {
  const [scheme, saltRaw, hashRaw] = stored.split('$');
  if (scheme !== 'pbkdf2' || !saltRaw || !hashRaw) return false;
  const saltBinary = atob(saltRaw);
  const salt = Uint8Array.from(saltBinary, char => char.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' }, key, 256);
  return bytesToBase64(new Uint8Array(bits)) === hashRaw;
}

async function createSession(env: Env, user: any) {
  const id = crypto.randomUUID();
  const csrf = crypto.randomUUID() + crypto.randomUUID();
  const session = { id, csrf, user: { username: user.username, role: user.role || 'super_admin' } };
  await env.ADMIN_KV!.put(`session:${id}`, JSON.stringify(session), { expirationTtl: SESSION_TTL_SECONDS });
  return session;
}

async function getSession(request: Request, env: Env) {
  const sessionId = parseCookies(request.headers.get('Cookie') || '').admin_session;
  if (!sessionId) return null;
  return env.ADMIN_KV!.get(`session:${sessionId}`, 'json') as Promise<any>;
}

async function requireSession(request: Request, env: Env) {
  const session = await getSession(request, env);
  if (!session) return { response: json(401, { error: 'Admin login required.' }) };
  if (!['GET', 'HEAD'].includes(request.method)) {
    const csrf = request.headers.get('X-CSRF-Token') || '';
    if (!csrf || csrf !== session.csrf) return { response: json(403, { error: 'Security token expired. Refresh and sign in again.' }) };
  }
  return { session };
}

async function audit(env: Env, user: any, action: string, details: Record<string, unknown> = {}) {
  const key = `audit:${Date.now()}:${crypto.randomUUID()}`;
  await env.ADMIN_KV!.put(key, JSON.stringify({ timestamp: new Date().toISOString(), user: user?.username || 'anonymous', action, details }), { expirationTtl: 60 * 60 * 24 * 90 });
}

async function loginLimited(request: Request, env: Env) {
  const key = `login:${request.headers.get('CF-Connecting-IP') || 'unknown'}`;
  const count = Number(await env.ADMIN_KV!.get(key) || 0);
  if (count >= MAX_LOGIN_ATTEMPTS) return true;
  await env.ADMIN_KV!.put(key, String(count + 1), { expirationTtl: LOGIN_WINDOW_SECONDS });
  return false;
}

function authResponse(session: any, setupRequired: boolean) {
  return { authenticated: Boolean(session), setupRequired, user: session?.user || null, csrfToken: session?.csrf || '' };
}

function validatePassword(password: string) {
  if (password.length < 12) return 'Password must be at least 12 characters.';
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return 'Password must include uppercase, lowercase, number, and symbol.';
  }
  return '';
}

function schemaFromPost(env: Env, post: any) {
  const siteUrl = String(env.SITE_URL || 'https://owaisahmedsheikh-preview.pages.dev').replace(/\/+$/, '');
  const slug = slugify(post.slug || post.title);
  const canonical = post.canonical || `${siteUrl}/blog/${slug}`;
  const faqs = (post.faqItems || []).filter((item: any) => item.question && item.answer);
  const schemas: any[] = [
    { '@context': 'https://schema.org', '@type': 'Organization', name: 'Owais Ahmed Sheikh', url: siteUrl, logo: { '@type': 'ImageObject', url: `${siteUrl}/brand-mark.svg` } },
    { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Owais Ahmed Sheikh', url: siteUrl },
    {
      '@context': 'https://schema.org',
      '@type': post.schemaType || 'BlogPosting',
      headline: post.title,
      description: post.metaDescription || post.excerpt,
      image: { '@type': 'ImageObject', url: post.image?.startsWith('http') ? post.image : `${siteUrl}${post.image || '/og-image.png'}`, description: post.imageAlt || undefined },
      author: { '@type': 'Person', name: post.author || 'Owais Ahmed Sheikh', url: `${siteUrl}/about` },
      publisher: { '@type': 'Organization', name: 'Owais Ahmed Sheikh', logo: { '@type': 'ImageObject', url: `${siteUrl}/brand-mark.svg` } },
      datePublished: post.date,
      dateModified: post.updated || post.date,
      mainEntityOfPage: canonical,
      articleSection: post.category || 'SEO',
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
  if (faqs.length) schemas.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((item: any) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) });
  return schemas;
}

export const onRequest = async ({ request, env, params }: { request: Request; env: Env; params: any }) => {
  const missing = requireEnv(env);
  if (missing) return json(503, { error: missing });

  const pathParts = Array.isArray(params.path) ? params.path : String(params.path || '').split('/').filter(Boolean);
  const route = pathParts.join('/');
  const users = await getUsers(env);
  const setupRequired = users.length === 0;

  try {
    if (request.method === 'GET' && route === 'session') {
      return json(200, authResponse(await getSession(request, env), setupRequired));
    }

    if (request.method === 'POST' && route === 'setup') {
      if (!setupRequired) return json(409, { error: 'Admin user already exists.' });
      const body: any = await request.json();
      const username = String(body.username || '').trim().toLowerCase();
      const password = String(body.password || '');
      if (!/^[a-z0-9._-]{3,60}$/.test(username)) return json(400, { error: 'Invalid username.' });
      const passwordError = validatePassword(password);
      if (passwordError) return json(400, { error: passwordError });
      const user = { id: crypto.randomUUID(), username, role: 'super_admin', passwordHash: await hashPassword(password), createdAt: new Date().toISOString() };
      await putUsers(env, [user]);
      const session = await createSession(env, user);
      await audit(env, session.user, 'admin.setup', { username });
      return json(200, authResponse(session, false), { 'Set-Cookie': cookie('admin_session', session.id, SESSION_TTL_SECONDS) });
    }

    if (request.method === 'POST' && route === 'login') {
      if (setupRequired) return json(409, { error: 'Create the first admin user before logging in.' });
      if (await loginLimited(request, env)) return json(429, { error: 'Too many failed attempts. Try again later.' });
      const body: any = await request.json();
      const user = users.find(item => String(item.username).toLowerCase() === String(body.username || '').toLowerCase());
      if (!user || !(await verifyPassword(String(body.password || ''), user.passwordHash))) return json(401, { error: 'Invalid username or password.' });
      const session = await createSession(env, user);
      await audit(env, session.user, 'admin.login.success');
      return json(200, authResponse(session, false), { 'Set-Cookie': cookie('admin_session', session.id, SESSION_TTL_SECONDS) });
    }

    const auth = await requireSession(request, env);
    if (auth.response) return auth.response;
    const session = auth.session;

    if (request.method === 'POST' && route === 'logout') {
      const sessionId = parseCookies(request.headers.get('Cookie') || '').admin_session;
      if (sessionId) await env.ADMIN_KV!.delete(`session:${sessionId}`);
      await audit(env, session.user, 'admin.logout');
      return json(200, { ok: true }, { 'Set-Cookie': cookie('admin_session', '', 0) });
    }

    if (request.method === 'GET' && route === 'library') {
      const media = await env.ADMIN_KV!.get('media-list', 'json') as any[] || [];
      const blogIndex = await env.ADMIN_KV!.get('blog-index', 'json') || {};
      return json(200, { posts: await listPosts(env), pages: [], media, blogIndex });
    }

    if (request.method === 'POST' && route === 'schema-preview') {
      const post = await request.json();
      return json(200, { schemas: schemaFromPost(env, post), errors: [], warnings: [] });
    }

    if (request.method === 'GET' && route === 'blog-index') {
      return json(200, await env.ADMIN_KV!.get('blog-index', 'json') || {});
    }

    if (request.method === 'POST' && route === 'blog-index') {
      const body = await request.json();
      await env.ADMIN_KV!.put('blog-index', JSON.stringify(body));
      await writeGithubFile(env, 'content/blog-index.json', `${JSON.stringify(body, null, 2)}\n`, 'Update blog index settings');
      await audit(env, session.user, 'blog_index.update');
      return json(200, body as Record<string, unknown>);
    }

    if (request.method === 'POST' && route === 'upload') {
      const form = await request.formData();
      const file = form.get('image');
      if (!(file instanceof File)) return json(400, { error: 'No image file was uploaded.' });
      if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) return json(400, { error: 'Only PNG, JPG, WEBP, and GIF images are allowed.' });
      if (file.size > 5 * 1024 * 1024) return json(400, { error: 'Image must be 5MB or smaller.' });
      const ext = file.type === 'image/jpeg' ? '.jpg' : `.${file.type.split('/')[1]}`;
      const name = `${slugify(file.name.replace(/\.[^.]+$/, '')) || 'image'}-${Date.now()}${ext}`;
      const bytes = new Uint8Array(await file.arrayBuffer());
      let url = `/uploads/blog/${name}`;
      if (env.MEDIA_BUCKET) {
        await env.MEDIA_BUCKET.put(`uploads/blog/${name}`, bytes, { httpMetadata: { contentType: file.type } });
        url = `/uploads/blog/${name}`;
      } else {
        await writeGithubBase64File(env, `uploads/blog/${name}`, bytesToBase64(bytes), `Upload media ${name}`);
      }
      const media = await env.ADMIN_KV!.get('media-list', 'json') as any[] || [];
      const item = { name, url, thumbnailUrl: url, mimeType: file.type, size: file.size, updated: new Date().toISOString() };
      media.unshift(item);
      await env.ADMIN_KV!.put('media-list', JSON.stringify(media.slice(0, 500)));
      await audit(env, session.user, 'media.upload', { filename: name, size: file.size });
      return json(200, { ...item, media });
    }

    if (request.method === 'DELETE' && pathParts[0] === 'media' && pathParts[1]) {
      const filename = pathParts[1];
      let media = await env.ADMIN_KV!.get('media-list', 'json') as any[] || [];
      media = media.filter(item => item.name !== filename);
      await env.ADMIN_KV!.put('media-list', JSON.stringify(media));
      if (env.MEDIA_BUCKET) await env.MEDIA_BUCKET.delete(`uploads/blog/${filename}`);
      await audit(env, session.user, 'media.delete', { filename });
      return json(200, { ok: true, media });
    }

    if (request.method === 'GET' && route === 'posts') {
      return json(200, { posts: await listPosts(env) });
    }

    if (pathParts[0] === 'posts' && pathParts[1]) {
      const slug = slugify(pathParts[1]);
      if (request.method === 'GET') {
        const post = await readPost(env, slug);
        return post ? json(200, post) : json(404, { error: 'Post not found.' });
      }
      if (request.method === 'POST') {
        const post: any = await request.json();
        const nextSlug = slugify(post.slug || post.title);
        if (!nextSlug || !post.title || !post.body) return json(400, { error: 'Title, slug, and body are required.' });
        await writeGithubFile(env, `content/blog/${nextSlug}.md`, renderMarkdownFile({ ...post, slug: nextSlug }), `${post.draft === false ? 'Publish' : 'Save'} blog post: ${nextSlug}`);
        await audit(env, session.user, post.draft === false ? 'post.publish' : 'post.save', { slug: nextSlug });
        return json(200, { ...post, slug: nextSlug });
      }
    }

    return json(404, { error: 'Admin API route not found.' });
  } catch (error: any) {
    return json(500, { error: error?.message || 'Admin API error.' });
  }
};
