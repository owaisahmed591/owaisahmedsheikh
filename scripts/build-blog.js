const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const contentDir = path.join(root, 'content', 'blog');
const commentsDir = path.join(root, 'content', 'comments');
const blogIndexSettingsPath = path.join(root, 'content', 'blog-index.json');
const blogDir = path.join(root, 'blog');
const siteUrl = normalizeSiteUrl(process.env.SITE_URL || 'https://owaisahmedsheikh-preview.pages.dev');
const today = new Date().toISOString().slice(0, 10);

const author = {
  name: 'Owais Ahmed Sheikh',
  url: `${siteUrl}/about`,
  email: 'owaisahmed591@gmail.com',
  phone: '+923152648247'
};

function normalizeSiteUrl(value) {
  const normalized = String(value || '').trim().replace(/\/+$/, '');
  if (!/^https?:\/\/[^/]+/i.test(normalized)) {
    throw new Error('SITE_URL must be an absolute http(s) URL.');
  }
  return normalized;
}

function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: author.name,
    url: siteUrl,
    logo: { '@type': 'ImageObject', url: `${siteUrl}/brand-mark.svg` },
    email: author.email,
    telephone: author.phone
  };
}

function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: author.name,
    url: siteUrl
  };
}

function baseSchemas() {
  return [organizationSchema(), websiteSchema()];
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripQuotes(value) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseValue(raw) {
  const value = raw.trim();
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
  if (end === -1) {
    throw new Error(`Unclosed frontmatter in ${filePath}`);
  }

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
  return String(value)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function safeUrl(value = '') {
  const url = String(value).trim();
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(url)) return url;
  return '#';
}

function safeColor(value = '#2ff28a') {
  const color = String(value || '').trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color : '#2ff28a';
}

function inlineMarkdown(value) {
  let text = escapeHtml(value);
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
    const safeHref = escapeHtml(safeUrl(href));
    const isExternal = /^https?:\/\//i.test(safeHref);
    const attrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${safeHref}"${attrs}>${label}</a>`;
  });
  return text;
}

function splitMarkdownTableRow(line = '') {
  return String(line)
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map(cell => cell.trim());
}

function isMarkdownTableSeparator(line = '') {
  const cells = splitMarkdownTableRow(line);
  return cells.length > 1 && cells.every(cell => /^:?-{3,}:?$/.test(cell));
}

function renderMarkdownTable(headerLine = '', bodyLines = []) {
  const headers = splitMarkdownTableRow(headerLine);
  if (headers.length < 2) return '';
  const rows = bodyLines.map(splitMarkdownTableRow).filter(row => row.length);
  const width = Math.max(headers.length, ...rows.map(row => row.length));
  const fill = cells => Array.from({ length: width }, (_item, index) => inlineMarkdown(cells[index] || ''));
  const headHtml = fill(headers).map(cell => `<th>${cell}</th>`).join('');
  const bodyHtml = rows
    .map(row => `<tr>${fill(row).map(cell => `<td>${cell}</td>`).join('')}</tr>`)
    .join('');
  return `<div class="article-table-wrap"><table><thead><tr>${headHtml}</tr></thead>${bodyHtml ? `<tbody>${bodyHtml}</tbody>` : ''}</table></div>`;
}

function localMediaMetadata(src = '') {
  if (!src.startsWith('/uploads/blog/')) return {};
  const filePath = path.join(root, src.replace(/^\/+/, ''));
  const metadataPath = `${filePath}.json`;
  if (!fs.existsSync(metadataPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  } catch (_error) {
    return {};
  }
}

function imageAttributes(src, alt, loading = 'lazy') {
  const metadata = localMediaMetadata(src);
  const attrs = [
    `src="${escapeHtml(src)}"`,
    `alt="${escapeHtml(alt)}"`,
    `loading="${loading}"`,
    'decoding="async"'
  ];
  if (metadata.width) attrs.push(`width="${escapeHtml(metadata.width)}"`);
  if (metadata.height) attrs.push(`height="${escapeHtml(metadata.height)}"`);
  if (metadata.thumbnailUrl && metadata.url) {
    attrs.push(`srcset="${escapeHtml(metadata.thumbnailUrl)} 480w, ${escapeHtml(metadata.url)} ${escapeHtml(metadata.width || 1200)}w"`);
    attrs.push('sizes="(max-width: 760px) 100vw, 760px"');
  }
  return attrs.join(' ');
}

function renderImage(line) {
  const image = line.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]+)")?\)$/);
  if (!image) return '';
  const alt = image[1] || '';
  const src = safeUrl(image[2]);
  const caption = image[3] ? `<figcaption>${inlineMarkdown(image[3])}</figcaption>` : '';
  return `<figure class="article-inline-image"><img ${imageAttributes(src, alt, 'lazy')}>${caption}</figure>`;
}

function closeList(listType) {
  if (!listType) return '';
  return `</${listType}>`;
}

function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html = [];
  const toc = [];
  let paragraph = [];
  let listType = null;
  let blockquote = [];
  let codeBlock = null;
  let codeLanguage = '';

  function flushParagraph() {
    if (!paragraph.length) return;
    html.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);
    paragraph = [];
  }

  function flushBlockquote() {
    if (!blockquote.length) return;
    html.push(`<blockquote>${inlineMarkdown(blockquote.join(' '))}</blockquote>`);
    blockquote = [];
  }

  function setList(type) {
    if (listType === type) return;
    html.push(closeList(listType));
    listType = type;
    html.push(`<${type}>`);
  }

  function closeOpenList() {
    if (!listType) return;
    html.push(closeList(listType));
    listType = null;
  }

  for (let i = 0; i < lines.length; i += 1) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (codeBlock) {
      if (line.startsWith('```')) {
        const langClass = codeLanguage ? ` class="language-${escapeHtml(codeLanguage)}"` : '';
        html.push(`<pre><code${langClass}>${escapeHtml(codeBlock.join('\n'))}</code></pre>`);
        codeBlock = null;
        codeLanguage = '';
      } else {
        codeBlock.push(rawLine);
      }
      continue;
    }

    if (!line) {
      flushParagraph();
      flushBlockquote();
      closeOpenList();
      continue;
    }

    if (line.startsWith('```')) {
      flushParagraph();
      flushBlockquote();
      closeOpenList();
      codeLanguage = line.replace(/^```/, '').trim().replace(/[^A-Za-z0-9_-]/g, '');
      codeBlock = [];
      continue;
    }

    if (line.includes('|') && isMarkdownTableSeparator(lines[i + 1] || '')) {
      flushParagraph();
      flushBlockquote();
      closeOpenList();
      const bodyLines = [];
      i += 2;
      while (i < lines.length && lines[i].trim().includes('|')) {
        bodyLines.push(lines[i].trim());
        i += 1;
      }
      i -= 1;
      html.push(renderMarkdownTable(line, bodyLines));
      continue;
    }

    if (/^---+$/.test(line)) {
      flushParagraph();
      flushBlockquote();
      closeOpenList();
      html.push('<hr>');
      continue;
    }

    const imageHtml = renderImage(line);
    if (imageHtml) {
      flushParagraph();
      flushBlockquote();
      closeOpenList();
      html.push(imageHtml);
      continue;
    }

    if (line.startsWith('> ')) {
      flushParagraph();
      closeOpenList();
      blockquote.push(line.slice(2));
      continue;
    }

    const heading = line.match(/^(#{2,4})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushBlockquote();
      closeOpenList();
      const level = heading[1].length;
      const title = heading[2].trim();
      const id = slugify(title);
      if (level === 2) toc.push({ id, title });
      html.push(`<h${level} id="${id}">${inlineMarkdown(title)}</h${level}>`);
      continue;
    }

    const unordered = line.match(/^[-*]\s+(.+)$/);
    if (unordered) {
      flushParagraph();
      flushBlockquote();
      setList('ul');
      html.push(`<li>${inlineMarkdown(unordered[1])}</li>`);
      continue;
    }

    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      flushBlockquote();
      setList('ol');
      html.push(`<li>${inlineMarkdown(ordered[1])}</li>`);
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  flushBlockquote();
  closeOpenList();
  if (codeBlock) {
    const langClass = codeLanguage ? ` class="language-${escapeHtml(codeLanguage)}"` : '';
    html.push(`<pre><code${langClass}>${escapeHtml(codeBlock.join('\n'))}</code></pre>`);
  }

  return { html: html.filter(Boolean).join('\n'), toc };
}

function readPosts() {
  ensureDir(contentDir);
  return fs.readdirSync(contentDir)
    .filter(file => file.endsWith('.md'))
    .map(file => {
      const filePath = path.join(contentDir, file);
      const parsed = parseFrontmatter(fs.readFileSync(filePath, 'utf8'), filePath);
      const slug = parsed.data.slug || slugify(parsed.data.title || file.replace(/\.md$/, ''));
      const rendered = markdownToHtml(parsed.body);
      const canonical = parsed.data.canonical
        ? absoluteUrl(parsed.data.canonical)
        : `${siteUrl}/blog/${slug}`;
      return {
        ...parsed.data,
        slug,
        body: parsed.body,
        contentHtml: rendered.html,
        toc: rendered.toc,
        url: `/blog/${slug}`,
        canonical,
        sourceFile: filePath
      };
    })
    .filter(post => !post.draft)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function readComments() {
  if (!fs.existsSync(commentsDir)) return new Map();
  const comments = fs.readdirSync(commentsDir)
    .filter(file => file.endsWith('.md'))
    .map(file => {
      const filePath = path.join(commentsDir, file);
      const parsed = parseFrontmatter(fs.readFileSync(filePath, 'utf8'), filePath);
      return {
        ...parsed.data,
        body: parsed.body,
        sourceFile: filePath
      };
    })
    .filter(comment => comment.approved && comment.postSlug && comment.name && comment.body)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  return comments.reduce((map, comment) => {
    if (!map.has(comment.postSlug)) map.set(comment.postSlug, []);
    map.get(comment.postSlug).push(comment);
    return map;
  }, new Map());
}

function jsonLd(data) {
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

function normalizeRobots(value = 'index, follow') {
  const raw = String(value || '').toLowerCase();
  if (raw.includes('noindex')) return raw.includes('follow') && !raw.includes('nofollow') ? 'noindex, follow' : 'noindex, nofollow';
  if (raw.includes('nofollow')) return 'index, nofollow';
  return 'index, follow';
}

function optionalMeta(property, value) {
  return value ? `<meta property="${property}" content="${escapeHtml(value)}">` : '';
}

function head({ title, description, canonical, type = 'website', image = '/og-image.png', robots = 'index, follow', article = {}, json = [] }) {
  const absoluteImage = image.startsWith('http') ? image : `${siteUrl}${image}`;
  const structuredData = [...baseSchemas(), ...json];
  const articleTags = Array.isArray(article.tags) ? article.tags : [];
  const articleMeta = type === 'article'
    ? [
        optionalMeta('article:published_time', article.publishedTime),
        optionalMeta('article:modified_time', article.modifiedTime),
        optionalMeta('article:author', author.url),
        optionalMeta('article:section', article.section),
        ...articleTags.map(tag => optionalMeta('article:tag', tag))
      ].filter(Boolean).join('\n')
    : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="robots" content="${normalizeRobots(robots)}">
<link rel="canonical" href="${escapeHtml(canonical)}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:type" content="${type}">
<meta property="og:url" content="${escapeHtml(canonical)}">
<meta property="og:image" content="${escapeHtml(absoluteImage)}">
${articleMeta}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${escapeHtml(absoluteImage)}">
<meta name="author" content="${author.name}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css?v=20260424bloghome1">
<link rel="icon" href="/favicon.svg?v=20260416mark1" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.svg?v=20260416mark1">
<link rel="manifest" href="/site.webmanifest?v=20260416mark1">
<meta name="theme-color" content="#040904">
${structuredData.map(jsonLd).join('\n')}
</head>`;
}

function nav(active = 'blog') {
  const links = [
    ['/', 'Home', 'home'],
    ['/about', 'About', 'about'],
    ['/services', 'Services', 'services'],
    ['/blog', 'Blog', 'blog'],
    ['/results-case-studies', 'Results', 'results'],
    ['/faq', 'FAQ', 'faq']
  ];
  const linkHtml = links.map(([href, label, key]) => `<a${active === key ? ' class="active"' : ''} href="${href}">${label}</a>`).join('');
  return `<nav class="site-nav"><div class="nav-inner"><a href="/" class="nav-logo"><span class="logo-dot"></span>Owais Ahmed Sheikh</a><div class="nav-links">${linkHtml}<a class="nav-cta" href="/free-seo-audit">Free SEO Audit</a></div><button class="nav-burger" id="burger" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button></div><div class="nav-mobile" id="nav-mobile"><a href="/">Home</a><a href="/about">About</a><a href="/services">Services</a><a href="/local-seo-karachi">Local SEO Karachi</a><a href="/seo-content-writing">SEO Content Writing</a><a href="/blog">Blog</a><a href="/results-case-studies">Results</a><a href="/faq">FAQ</a><a href="/free-seo-audit">Free SEO Audit</a></div></nav>`;
}

function footer() {
  return `<footer class="site-footer"><div class="footer-inner"><div class="footer-top"><div><a href="/" class="footer-logo"><span class="logo-dot"></span>Owais Ahmed Sheikh</a><p class="footer-brand-desc">Freelance SEO Expert in Karachi, Pakistan helping local businesses rank higher on Google since 2019.</p></div><nav aria-label="Services"><p class="footer-col-title">Services</p><div class="footer-links-col"><a class="footer-link" href="/local-seo-karachi">Local SEO Karachi</a><a class="footer-link" href="/technical-seo">Technical SEO</a><a class="footer-link" href="/on-page-seo">On-Page SEO</a><a class="footer-link" href="/seo-content-writing">SEO Content Writing</a><a class="footer-link" href="/off-page-seo">Off-Page SEO</a><a class="footer-link" href="/seo-audit">SEO Audit</a></div></nav><nav aria-label="Pages"><p class="footer-col-title">Pages</p><div class="footer-links-col"><a class="footer-link" href="/free-seo-audit">Free SEO Audit</a><a class="footer-link" href="/about">About</a><a class="footer-link" href="/blog">Blog</a><a class="footer-link" href="/write-for-us">Write for Us</a><a class="footer-link" href="/results-case-studies">Results &amp; Case Studies</a><a class="footer-link" href="/faq">FAQ</a><a class="footer-link" href="/contact">Contact</a><a class="footer-link" href="/seo-cost-pakistan">SEO Cost Pakistan</a><a class="footer-link" href="/seo-agency-vs-freelance-pakistan">Agency vs Freelance SEO</a></div></nav><nav aria-label="Contact"><p class="footer-col-title">Contact</p><div class="footer-links-col"><a href="mailto:${author.email}" class="footer-link">${author.email}</a><a href="https://wa.me/923152648247" target="_blank" rel="noopener noreferrer" class="footer-link">+92 315 264 8247</a><span class="footer-link" style="cursor:default">Karachi, Pakistan</span></div></nav></div><div class="footer-bottom"><p class="footer-copy">&copy; 2026 Owais Ahmed Sheikh. All rights reserved.</p></div></div></footer>`;
}

function commonScripts() {
  return `<script>
const burger=document.getElementById('burger'),mobileNav=document.getElementById('nav-mobile');
if(burger&&mobileNav){burger.addEventListener('click',()=>{const open=mobileNav.classList.toggle('open');burger.setAttribute('aria-expanded',open);});}
const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}});},{threshold:0.1});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
const search=document.getElementById('blog-search');
const blogFilters=[...document.querySelectorAll('[data-blog-filter]')];
const blogCards=[...document.querySelectorAll('[data-blog-card]')];
const blogExtras=[...document.querySelectorAll('[data-blog-extra]')];
const blogCount=document.querySelector('[data-blog-count]');
const noResults=document.querySelector('[data-blog-no-results]');
const updateBlogDiscovery=()=>{const active=(document.querySelector('[data-blog-filter].active')||{}).dataset?.blogFilter||'all';const query=search?search.value.trim().toLowerCase():'';let shown=0;blogCards.forEach(card=>{const categoryOk=active==='all'||card.dataset.category===active;const queryOk=!query||card.textContent.toLowerCase().includes(query);const show=categoryOk&&queryOk;card.hidden=!show;if(show)shown+=1;});blogExtras.forEach(extra=>{extra.hidden=active!=='all'||Boolean(query);});if(blogCount)blogCount.textContent=String(shown);if(noResults)noResults.hidden=shown!==0;};
blogFilters.forEach(button=>{button.addEventListener('click',()=>{blogFilters.forEach(item=>item.classList.toggle('active',item===button));updateBlogDiscovery();});});
if(search){search.addEventListener('input',updateBlogDiscovery);}
updateBlogDiscovery();
const commentForm=document.querySelector('[data-comment-form]');
if(commentForm){commentForm.addEventListener('submit',event=>{event.preventDefault();const data=new FormData(commentForm);const name=(data.get('name')||'').toString().trim();const message=(data.get('comment')||'').toString().trim();const status=commentForm.querySelector('[data-comment-status]');if(!name||!message){if(status)status.textContent='Please add your name and comment.';return;}if(status)status.textContent='Comment received locally. On the live site this will be sent for approval before publishing.';commentForm.reset();});}
const progress=document.querySelector('[data-reading-progress]');
const article=document.querySelector('.article-body');
const tocLinks=[...document.querySelectorAll('.article-toc a[href^="#"]')];
if(progress&&article){const updateProgress=()=>{const rect=article.getBoundingClientRect();const total=Math.max(1,article.offsetHeight-window.innerHeight);const read=Math.min(total,Math.max(0,-rect.top));progress.style.transform='scaleX('+(read/total)+')';};updateProgress();document.addEventListener('scroll',updateProgress,{passive:true});window.addEventListener('resize',updateProgress);}
if(tocLinks.length){const sections=tocLinks.map(link=>document.getElementById(decodeURIComponent(link.getAttribute('href').slice(1)))).filter(Boolean);const setActive=id=>{tocLinks.forEach(link=>link.classList.toggle('active',link.getAttribute('href')==='#'+id));};const sectionObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting)setActive(entry.target.id);});},{rootMargin:'-18% 0px -70% 0px',threshold:0});sections.forEach(section=>sectionObserver.observe(section));tocLinks.forEach(link=>link.addEventListener('click',event=>{const target=document.querySelector(link.getAttribute('href'));if(target){event.preventDefault();target.scrollIntoView({behavior:'smooth',block:'start'});history.replaceState(null,'',link.getAttribute('href'));}}));}
</script><a class="back-to-top" href="#top" aria-label="Back to top"></a><script src="/chat-widget.js?v=20260430blogfix1" defer></script>`;
}

function categoryClass(category = '') {
  return slugify(category || 'General');
}

function categoryTone(category = '') {
  const key = categoryClass(category);
  const tones = {
    'local-seo': 'local',
    'technical-seo': 'technical',
    'content-writing': 'content',
    'seo-reporting': 'reporting',
    'on-page-seo': 'onpage',
    'ecommerce-seo': 'ecommerce',
    'ai-seo': 'ai'
  };
  return tones[key] || 'general';
}

function bestFor(post) {
  const map = {
    'Local SEO': 'Best for local service businesses that need Maps, city, and area visibility.',
    'Technical SEO': 'Best for finding crawl, speed, indexing, and performance issues first.',
    'Content Writing': 'Best for turning search intent into pages and blogs that can convert.',
    'SEO Reporting': 'Best for deciding what to fix using real search data.',
    'On-Page SEO': 'Best for improving page structure, internal links, and search clarity.',
    'Ecommerce SEO': 'Best for product and category pages that need buyer traffic.',
    'AI SEO': 'Best for staying visible as AI search changes how customers compare options.'
  };
  return map[post.category] || 'Best for choosing the next practical SEO improvement.';
}

function insightLine(post) {
  const category = post.category || 'SEO';
  if (category === 'Technical SEO') return 'Fix crawl, speed, and indexing friction before publishing more content.';
  if (category === 'Content Writing') return 'Useful content should support service pages, not sit alone.';
  if (category === 'Local SEO') return 'Local rankings improve faster when pages, profiles, reviews, and proof work together.';
  if (category === 'SEO Reporting') return 'Measure decisions, not vanity metrics.';
  if (category === 'AI SEO') return 'AI search still rewards clear answers, trusted pages, and strong topic coverage.';
  return 'Start with the page closest to revenue, then support it with focused guides.';
}

function postCard(post, variant = 'standard') {
  const category = post.category || 'SEO Guide';
  const categoryKey = categoryClass(category);
  const tone = categoryTone(category);
  const filterAttrs = variant === 'featured' ? '' : ` data-blog-card data-category="${categoryKey}"`;
  const meta = `${escapeHtml(post.updated || post.date)} &bull; ${escapeHtml(post.readingTime || 6)} min read`;
  const media = variant === 'insight'
    ? ''
    : `<span class="blog-post-media"><img ${imageAttributes(post.image || '/og-image.png', post.imageAlt || post.title, 'lazy')}></span>`;
  const badge = variant === 'highlight' ? '<span class="blog-card-badge">Recommended</span>' : '';
  const microcopy = variant === 'featured' ? `<p class="blog-card-best">${escapeHtml(bestFor(post))}</p>` : '';
  const insight = variant === 'insight'
    ? `<span class="blog-insight-box"><span>Key insight</span>${escapeHtml(insightLine(post))}</span>`
    : variant === 'highlight'
      ? `<span class="blog-card-takeaway">${escapeHtml(insightLine(post))}</span>`
      : '';

  return `<article class="blog-post-card blog-card-${variant} reveal"${filterAttrs}>
    <a class="blog-card-link" href="${post.url}" aria-label="Read ${escapeHtml(post.title)}">
      ${media}
      <span class="blog-post-body">
        <span class="blog-card-topline"><span class="blog-post-kicker blog-cat-${tone}">${escapeHtml(category)}</span>${badge}</span>
        <h3>${escapeHtml(post.title)}</h3>
        ${microcopy}
        <p>${escapeHtml(post.excerpt)}</p>
        ${insight}
        <span class="blog-post-meta"><span>${meta}</span><span>${escapeHtml(category)}</span></span>
        <span class="blog-read-more">Read article</span>
      </span>
    </a>
  </article>`;
}

function compactPostCard(post) {
  return `<article class="home-blog-card reveal"><a class="home-blog-image" href="${post.url}" aria-label="${escapeHtml(post.title)}"><img ${imageAttributes(post.image || '/og-image.png', post.imageAlt || post.title, 'lazy')}></a><div class="home-blog-copy"><span>${escapeHtml(post.category || 'SEO Guide')}</span><h3><a href="${post.url}">${escapeHtml(post.title)}</a></h3><p>${escapeHtml(post.excerpt)}</p><div class="home-blog-meta"><time datetime="${escapeHtml(post.updated || post.date)}">${escapeHtml(post.updated || post.date)}</time><small>${escapeHtml(post.readingTime || 6)} min read</small></div></div></article>`;
}

function renderHomepageRecentPosts(posts) {
  const recent = [...posts]
    .sort((a, b) => String(b.updated || b.date).localeCompare(String(a.updated || a.date)))
    .slice(0, 3);
  return `<!-- RECENT_BLOG_START -->
<section class="home-blog-section bg-alt" id="latest-seo-guides">
  <div class="container">
    <div class="home-blog-head">
      <div>
        <p class="section-label">Latest Guides</p>
        <h2>Recent SEO Articles for<br><span class="grad-text">Business Owners</span></h2>
        <p class="section-sub">Short, practical reads on SEO, content writing, local search, and technical fixes. Use them to understand what to improve before you spend money.</p>
      </div>
      <a class="btn-secondary" href="/blog">View All Articles</a>
    </div>
    <div class="home-blog-grid">
      ${recent.map(compactPostCard).join('\n      ')}
    </div>
  </div>
</section>
<!-- RECENT_BLOG_END -->`;
}

function updateHomepageRecentPosts(posts) {
  const indexPath = path.join(root, 'index.html');
  if (!fs.existsSync(indexPath)) return;
  const html = fs.readFileSync(indexPath, 'utf8');
  const section = renderHomepageRecentPosts(posts);
  const markerPattern = /<!-- RECENT_BLOG_START -->[\s\S]*?<!-- RECENT_BLOG_END -->/;
  const fallbackMarker = '<!-- FAQ SNAPSHOT -->';
  const nextHtml = markerPattern.test(html)
    ? html.replace(markerPattern, section)
    : html.includes(fallbackMarker)
      ? html.replace(fallbackMarker, `${section}\n${fallbackMarker}`)
      : html.replace('</main>', `${section}\n</main>`);
  fs.writeFileSync(indexPath, nextHtml);
}

function highlightedTitle(post) {
  const title = post.heroTitle || post.title;
  if (!post.heroAccent || !title.includes(post.heroAccent)) return escapeHtml(title);
  return escapeHtml(title).replace(escapeHtml(post.heroAccent), `<span class="grad-text">${escapeHtml(post.heroAccent)}</span>`);
}

function absoluteUrl(url = '') {
  if (!url) return '';
  return url.startsWith('http') ? url : `${siteUrl}${url}`;
}

function schemaImageObject(url, alt = '', caption = '') {
  const metadata = localMediaMetadata(url || '/og-image.png');
  return {
    '@type': 'ImageObject',
    url: absoluteUrl(url || '/og-image.png'),
    width: metadata.width || undefined,
    height: metadata.height || undefined,
    description: alt || undefined,
    caption: caption || undefined
  };
}

function shareLinks(post) {
  const url = encodeURIComponent(post.canonical);
  const title = encodeURIComponent(post.title);
  return [
    ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${url}`, 'in'],
    ['X', `https://twitter.com/intent/tweet?url=${url}&text=${title}`, 'x'],
    ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${url}`, 'f'],
    ['WhatsApp', `https://wa.me/?text=${title}%20${url}`, 'wa']
  ];
}

function shareIcon(label, glyph) {
  const icons = {
    in: '<svg viewBox="0 0 24 24" focusable="false"><path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.36 8.17h4.28V23H.36V8.17zM8.06 8.17h4.1v2.03h.06c.57-1.08 1.96-2.22 4.04-2.22 4.32 0 5.12 2.84 5.12 6.54V23H17.1v-7.53c0-1.8-.03-4.11-2.5-4.11-2.51 0-2.9 1.96-2.9 3.98V23H7.42V8.17h.64z"/></svg>',
    x: '<svg viewBox="0 0 24 24" focusable="false"><path d="M18.9 2h3.3l-7.2 8.23L23.5 22h-6.65l-5.2-6.8L5.7 22H2.4l7.7-8.8L1.9 2h6.82l4.7 6.22L18.9 2zm-1.16 17.93h1.83L7.72 3.96H5.76l11.98 15.97z"/></svg>',
    f: '<svg viewBox="0 0 24 24" focusable="false"><path d="M15.12 5.36h2.22V1.5A28.7 28.7 0 0 0 14.1 1c-3.2 0-5.4 2.02-5.4 5.73v3.42H5.16v4.32H8.7V23h4.34v-8.53h3.4l.54-4.32h-3.94V7.16c0-1.25.34-1.8 2.08-1.8z"/></svg>',
    wa: '<svg viewBox="0 0 24 24" focusable="false"><path d="M20.52 3.48A11.82 11.82 0 0 0 12.1 0C5.54 0 .2 5.34.2 11.9c0 2.1.55 4.15 1.6 5.95L0 24l6.3-1.65a11.9 11.9 0 0 0 5.8 1.48h.01c6.56 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.17-3.49-8.45zM12.1 21.82a9.86 9.86 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.38a9.86 9.86 0 0 1-1.5-5.28c0-5.44 4.43-9.87 9.88-9.87 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.9 6.99c0 5.45-4.43 9.9-9.9 9.9zm5.42-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.04-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.49.71.31 1.27.5 1.7.64.72.23 1.37.2 1.89.12.58-.09 1.76-.72 2-1.41.25-.7.25-1.3.18-1.42-.08-.13-.27-.2-.57-.35z"/></svg>'
  };
  return `<span class="share-icon share-icon-${glyph}" aria-hidden="true">${icons[glyph] || escapeHtml(glyph)}</span><span>${escapeHtml(label)}</span>`;
}

const defaultBlogIndexSettings = {
  featuredPosts: [],
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

function readBlogIndexSettings() {
  if (!fs.existsSync(blogIndexSettingsPath)) return defaultBlogIndexSettings;
  try {
    const parsed = JSON.parse(fs.readFileSync(blogIndexSettingsPath, 'utf8'));
    return {
      ...defaultBlogIndexSettings,
      ...parsed,
      insight: { ...defaultBlogIndexSettings.insight, ...(parsed.insight || {}) },
      midCta: { ...defaultBlogIndexSettings.midCta, ...(parsed.midCta || {}) },
      spotlight: { ...defaultBlogIndexSettings.spotlight, ...(parsed.spotlight || {}) }
    };
  } catch (_error) {
    return defaultBlogIndexSettings;
  }
}

function postsBySlugs(posts, slugs = []) {
  const bySlug = new Map(posts.map(post => [post.slug, post]));
  return (Array.isArray(slugs) ? slugs : []).map(slug => bySlug.get(slug)).filter(Boolean);
}

function renderMiniInsightPanel(settings) {
  const insight = settings.insight || defaultBlogIndexSettings.insight;
  return `<article class="blog-grid-panel blog-mini-insight reveal" data-blog-extra>
    <p class="section-label">Where to start</p>
    <h3>${escapeHtml(insight.title)}</h3>
    <p>${escapeHtml(insight.description)}</p>
    <a class="blog-text-link" href="${escapeHtml(safeUrl(insight.buttonUrl))}">${escapeHtml(insight.buttonText)}</a>
  </article>`;
}

function renderSoftCtaPanel(settings) {
  const cta = settings.midCta || defaultBlogIndexSettings.midCta;
  return `<article class="blog-grid-panel blog-soft-cta reveal" data-blog-extra>
    <p class="section-label">Done for you</p>
    <div><h3>${escapeHtml(cta.title)}</h3><p>${escapeHtml(cta.description)}</p></div>
    <a class="btn-primary" href="${escapeHtml(safeUrl(cta.buttonUrl))}">${escapeHtml(cta.buttonText)}</a>
  </article>`;
}

function renderSpotlightPanel(posts, settings) {
  const spotlightSettings = settings.spotlight || defaultBlogIndexSettings.spotlight;
  const spotlight = postsBySlugs(posts, spotlightSettings.posts);
  if (!spotlight.length) return '';
  return `<article class="blog-grid-panel blog-category-spotlight reveal" data-blog-extra>
    <p class="section-label">${escapeHtml(spotlightSettings.label)}</p>
    <h3>${escapeHtml(spotlightSettings.title)}</h3>
    <div class="blog-spotlight-list">
      ${spotlight.map(post => `<a href="${post.url}"><span>${escapeHtml(post.category || 'SEO')}</span><strong>${escapeHtml(post.title)}</strong></a>`).join('')}
    </div>
  </article>`;
}

function autoFeaturedPosts(posts) {
  const featured = posts.filter(post => post.featured).slice(0, 2);
  if (featured.length >= 2) return featured;
  return [
    ...featured,
    ...posts.filter(post => !featured.includes(post)).slice(0, 2 - featured.length)
  ];
}

function autoHighlightSlugs(posts, featured = []) {
  const seenCategories = new Set();
  return posts
    .filter(post => !featured.includes(post))
    .filter(post => {
      const category = post.category || 'General';
      if (seenCategories.has(category)) return false;
      seenCategories.add(category);
      return true;
    })
    .slice(0, 4)
    .map(post => post.slug);
}

function autoSpotlightSlugs(posts) {
  const priority = ['Content Writing', 'Technical SEO', 'Local SEO', 'On-Page SEO'];
  const picks = priority
    .map(category => posts.find(post => post.category === category))
    .filter(Boolean);
  return [
    ...picks,
    ...posts.filter(post => !picks.includes(post))
  ].slice(0, 3).map(post => post.slug);
}

function renderBlogGrid(posts, settings) {
  const highlightPosts = new Set(Array.isArray(settings.highlightPosts) && settings.highlightPosts.length ? settings.highlightPosts : autoHighlightSlugs(posts));
  const items = [];
  posts.forEach((post, index) => {
    const shouldHighlight = highlightPosts.has(post.slug) && (index === 3 || index === 9);
    const variant = shouldHighlight ? 'highlight' : index === 7 ? 'insight' : 'standard';
    items.push(postCard(post, variant));
    if (index === 5) items.push(renderMiniInsightPanel(settings));
    if (index === 9) items.push(renderSoftCtaPanel(settings));
    if (index === 12) items.push(renderSpotlightPanel(posts, settings));
  });
  return items.join('\n');
}

function buildBlogIndex(posts) {
  const settings = readBlogIndexSettings();
  const featured = autoFeaturedPosts(posts);
  settings.highlightPosts = autoHighlightSlugs(posts, featured);
  const rest = posts.filter(post => !featured.includes(post));
  settings.spotlight = {
    ...(settings.spotlight || defaultBlogIndexSettings.spotlight),
    posts: autoSpotlightSlugs(rest)
  };
  const preferredCategories = ['Local SEO', 'Technical SEO', 'Content Writing', 'SEO Reporting', 'On-Page SEO', 'Ecommerce SEO', 'AI SEO'];
  const categories = [
    ...preferredCategories.filter(category => posts.some(post => (post.category || 'General') === category)),
    ...[...new Set(posts.map(post => post.category || 'General'))].filter(category => !preferredCategories.includes(category))
  ];
  const gridPosts = rest;
  const json = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'SEO Blog for Karachi Businesses',
      url: `${siteUrl}/blog`,
      description: 'Practical SEO guides, content writing advice, case studies, and local search tips for businesses in Karachi and Pakistan.',
      author: { '@type': 'Person', name: author.name, url: author.url },
      publisher: { '@type': 'Organization', name: author.name, logo: { '@type': 'ImageObject', url: `${siteUrl}/brand-mark.svg` } },
      hasPart: posts.map(post => ({ '@type': 'BlogPosting', headline: post.title, url: post.canonical }))
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteUrl}/blog` }
      ]
    }
  ];
  const html = `${head({
    title: 'SEO Blog for Karachi Businesses | Content, Local SEO and Technical Guides',
    description: 'Read practical SEO guides for Karachi businesses that want better rankings, service pages, blog content, local visibility, and real leads from Google.',
    canonical: `${siteUrl}/blog`,
    json
  })}
<body id="top" class="blog-hub-page">
${nav('blog')}
<main>
<section class="blog-hub-hero">
  <div class="container">
    <nav class="breadcrumb"><a href="/">Home</a><span>/</span>Blog</nav>
    <div class="blog-hub-intro">
      <p class="section-label">SEO Learning Hub</p>
      <h1>Get More Karachi Customers from <span class="grad-text">Google</span></h1>
      <p class="page-hero-sub">Practical SEO guides for Karachi businesses that need clearer service pages, stronger blog content, better local visibility, and more qualified leads from search.</p>
      <div class="blog-hub-actions"><a class="btn-primary" href="/seo-content-writing">Get SEO Content Written</a><a class="blog-hero-link" href="/results-case-studies">View Results</a></div>
      <div class="blog-trust-row" aria-label="SEO focus areas"><span>Local SEO</span><span>Content Writing</span><span>Technical SEO</span><span>Search Strategy</span></div>
    </div>
  </div>
</section>
<section class="blog-command-section">
  <div class="container">
    <div class="blog-command-bar">
      <div class="blog-command-copy"><p class="section-label">Find the right guide</p><strong><span data-blog-count>${gridPosts.length}</span> searchable SEO articles</strong></div>
      <label class="blog-search-wrap"><span aria-hidden="true"></span><input id="blog-search" type="search" placeholder="Search SEO guides, content writing, audits..." aria-label="Search blog posts"></label>
      <div class="blog-filter-pills" aria-label="Filter blog categories"><button class="active" type="button" data-blog-filter="all">All Guides</button>${categories.map(category => `<button class="blog-cat-${categoryTone(category)}" type="button" data-blog-filter="${categoryClass(category)}">${escapeHtml(category)}</button>`).join('')}</div>
    </div>
    <p class="blog-no-results" data-blog-no-results hidden>No matching guides yet. Try another search or choose All Guides.</p>
  </div>
</section>
<section class="blog-layout-section">
  <div class="container">
    <div class="blog-section-head">
      <div><p class="section-label">Featured Guides</p><h2>Start with the SEO guides that solve real business problems</h2><p class="section-sub">Begin with practical guides for ranking, leads, and better website performance.</p></div>
    </div>
    <div class="blog-feature-grid">${featured.map(post => postCard(post, 'featured')).join('')}</div>
  </div>
</section>
<section class="blog-layout-section blog-all-posts">
  <div class="container">
    <div class="blog-section-head">
      <div><p class="section-label">All Articles</p><h2>SEO, content, and local search advice</h2><p class="section-sub">Use these posts to understand what to fix, what to write, and how to build pages that can rank.</p></div>
      <a class="blog-section-link" href="/results-case-studies">See case studies</a>
    </div>
    <div class="blog-post-grid">${renderBlogGrid(gridPosts, settings)}</div>
  </div>
</section>
<section class="blog-resource-band">
  <div class="container">
    <div class="blog-resource-grid">
      <article class="blog-final-cta-primary"><p class="section-label">High-intent next step</p><h2>Want these SEO improvements done for you?</h2><p>Get practical SEO content, service pages, blog strategy, and technical fixes built around how your customers search.</p><a class="btn-primary" href="/seo-content-writing">Get SEO Content Written</a></article>
      <article class="blog-final-cta-secondary"><p class="section-label">Proof</p><h2>See real search work</h2><p>Review case studies built from Search Console screenshots, technical reports, strategy documents, and real project notes.</p><a class="btn-secondary" href="/results-case-studies">View Results</a></article>
    </div>
  </div>
</section>
</main>
${footer()}
${commonScripts()}
</body>
</html>`;

  ensureDir(blogDir);
  fs.writeFileSync(path.join(blogDir, 'index.html'), html);
}

function relatedFor(post, posts) {
  const postSignals = new Set([
    post.category,
    post.focusKeyword,
    ...(post.tags || []),
    ...(post.secondaryKeywords || [])
  ].filter(Boolean).map(item => String(item).toLowerCase()));

  return posts
    .filter(item => item.slug !== post.slug)
    .map(item => {
      const signals = [item.category, item.focusKeyword, ...(item.tags || []), ...(item.secondaryKeywords || [])]
        .filter(Boolean)
        .map(value => String(value).toLowerCase());
      const signalScore = signals.reduce((score, value) => score + (postSignals.has(value) ? 3 : 0), 0);
      const categoryScore = item.category && item.category === post.category ? 6 : 0;
      const freshnessScore = String(item.updated || item.date || '').replace(/-/g, '') / 100000000;
      return { item, score: signalScore + categoryScore + freshnessScore };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(result => result.item);
}

function renderComments(postComments) {
  const comments = postComments || [];
  const list = comments.length
    ? comments.map(comment => `<article class="blog-comment"><div class="blog-comment-top"><div><strong>${escapeHtml(comment.name)}</strong>${comment.business ? `<span>${escapeHtml(comment.business)}</span>` : ''}</div><time datetime="${escapeHtml(comment.date || '')}">${escapeHtml(comment.date || '')}</time></div><p>${inlineMarkdown(comment.body)}</p></article>`).join('')
    : `<div class="blog-comment-empty"><strong>No approved comments yet.</strong><p>Be the first to share a useful question or experience. Comments are reviewed before publishing.</p></div>`;

  return `<section class="blog-comments-section" id="comments"><div class="blog-comments-head"><p class="section-label">Discussion</p><h2>Comments and Questions</h2><p>Comments are moderated, so only useful, respectful, and relevant comments appear publicly.</p></div><div class="blog-comments-list">${list}</div><form class="blog-comment-form" data-comment-form name="blog-comment" method="POST" action="/thank-you" data-netlify="true" netlify-honeypot="bot-field"><input type="hidden" name="form-name" value="blog-comment"><input type="hidden" name="postSlug" value="${escapeHtml(postComments?.postSlug || '')}"><p class="hidden-field"><label>Do not fill this out <input name="bot-field"></label></p><div class="comment-form-grid"><label>Name <input name="name" required autocomplete="name"></label><label>Email <input name="email" type="email" autocomplete="email"></label><label>Phone or WhatsApp <input name="phone" autocomplete="tel"></label><label>Business or Role <input name="business" autocomplete="organization"></label><label>Website <input name="website" type="url" placeholder="https://"></label><label>Comment Type <select name="commentType"><option>Question</option><option>Experience</option><option>Feedback</option><option>Result</option></select></label></div><label>Comment <textarea name="comment" rows="5" required placeholder="Ask a question, add your experience, or share what you are trying to fix..."></textarea></label><button class="btn-primary" type="submit">Submit Comment for Review</button><p class="comment-form-note" data-comment-status>Your comment will be reviewed before it appears on the site. Email and phone are only for moderation and are not shown publicly.</p></form></section>`;
}

function renderNewsletter(post) {
  if (post.showNewsletter === false) return '';
  return `<section class="article-newsletter" aria-labelledby="newsletter-title"><div><p class="section-label">Newsletter</p><h2 id="newsletter-title">${escapeHtml(post.newsletterTitle || 'Want practical SEO tips in your inbox?')}</h2><p>${escapeHtml(post.newsletterText || 'Get clear SEO, content, and local search advice written for business owners. No spam.')}</p></div><form name="blog-newsletter" method="POST" action="/thank-you" data-netlify="true" netlify-honeypot="bot-field"><input type="hidden" name="form-name" value="blog-newsletter"><input type="hidden" name="sourcePost" value="${escapeHtml(post.slug)}"><p class="hidden-field"><label>Do not fill this out <input name="bot-field"></label></p><label>Email <input name="email" type="email" required placeholder="you@example.com" autocomplete="email"></label><button class="btn-primary" type="submit">Subscribe</button></form></section>`;
}

function renderArticleFaq(post) {
  const faqs = (post.faqItems || []).filter(item => item.question && item.answer);
  if (!faqs.length) return '';
  return `<section class="article-faq-block" aria-labelledby="article-faq-title"><p class="section-label">Article FAQ</p><h2 id="article-faq-title">Quick Answers</h2><div>${faqs.map(item => `<details><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`).join('')}</div></section>`;
}

function renderArticleTags(post) {
  const tags = [post.category, ...(post.tags || []), ...(post.secondaryKeywords || [])].filter(Boolean);
  const unique = [...new Set(tags)].slice(0, 10);
  if (!unique.length) return '';
  return `<div class="article-tags" aria-label="Article tags">${unique.map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}</div>`;
}

function renderRelatedCard(post) {
  return `<a class="article-related-card" href="${post.url}"><span class="article-related-image"><img ${imageAttributes(post.image || '/og-image.png', post.imageAlt || post.title, 'lazy')}></span><span class="article-related-copy"><span class="blog-tag">${escapeHtml(post.category || 'SEO')}</span><strong>${escapeHtml(post.title)}</strong><span>${escapeHtml(post.excerpt)}</span></span></a>`;
}

function renderTopicalAuthorityMap(post) {
  if (post.showFramework === false || (post.slug !== 'topical-authority-service-businesses' && post.showFramework !== true)) return '';
  const nodes = (post.frameworkNodes && post.frameworkNodes.length ? post.frameworkNodes : [
    { label: 'Guide', title: 'Service page copy' },
    { label: 'Guide', title: 'Internal linking' },
    { label: 'Proof', title: 'Case studies' },
    { label: 'Support', title: 'FAQs and examples' }
  ]).filter(item => item.label && item.title);
  const steps = (post.frameworkSteps && post.frameworkSteps.length ? post.frameworkSteps : [
    { title: 'Choose the money page', text: 'Start with the service page that should generate leads.' },
    { title: 'Map supporting questions', text: 'Turn repeated buyer questions into useful articles.' },
    { title: 'Link every page intentionally', text: 'Connect guides, proof, and service pages with clear next steps.' }
  ]).filter(item => item.title);

  return `<section class="article-framework" aria-labelledby="authority-map-title">
    <p class="section-label">${escapeHtml(post.frameworkLabel || 'Visual Framework')}</p>
    <h2 id="authority-map-title">${escapeHtml(post.frameworkTitle || 'A simple topical authority map')}</h2>
    <p class="article-framework-intro">${escapeHtml(post.frameworkIntro || 'Build one strong service page first, then surround it with helpful articles, proof, FAQs, and internal links. The goal is to make the next click obvious for both readers and search engines.')}</p>
    <div class="topic-map" aria-label="Topical authority content structure">
      <div class="topic-map-core"><span>${escapeHtml(post.frameworkCoreLabel || 'Core service page')}</span><strong>${escapeHtml(post.frameworkCoreTitle || 'SEO Content Writing')}</strong><small>${escapeHtml(post.frameworkCoreText || 'The page that should convert qualified readers.')}</small></div>
      ${nodes.map(node => `<div class="topic-map-node"><span>${escapeHtml(node.label)}</span><strong>${escapeHtml(node.title)}</strong></div>`).join('')}
    </div>
    <div class="framework-steps">
      ${steps.map((step, index) => `<div><span>${index + 1}</span><strong>${escapeHtml(step.title)}</strong>${step.text ? `<p>${escapeHtml(step.text)}</p>` : ''}</div>`).join('')}
    </div>
  </section>`;
}

function buildPost(post, posts, commentsByPost) {
  const related = relatedFor(post, posts);
  const postComments = commentsByPost.get(post.slug) || [];
  postComments.postSlug = post.slug;
  const primaryImage = schemaImageObject(post.image || '/og-image.png', post.imageAlt || post.title, post.imageCredit || '');
  const json = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.metaDescription || post.excerpt,
      image: primaryImage,
      datePublished: post.date,
      dateModified: post.updated || post.date,
      author: { '@type': 'Person', name: author.name, url: author.url },
      publisher: { '@type': 'Organization', name: author.name, logo: { '@type': 'ImageObject', url: `${siteUrl}/brand-mark.svg` } },
      mainEntityOfPage: post.canonical,
      articleSection: post.category || 'SEO',
      wordCount: String(post.body || '').split(/\s+/).filter(Boolean).length,
      inLanguage: 'en',
      keywords: [post.focusKeyword, ...(post.secondaryKeywords || []), ...(post.tags || [])].filter(Boolean).join(', ')
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: post.title,
      url: post.canonical,
      description: post.metaDescription || post.excerpt,
      isPartOf: { '@type': 'WebSite', name: author.name, url: siteUrl },
      primaryImageOfPage: primaryImage,
      about: { '@type': 'Thing', name: post.focusKeyword || post.category || post.title }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteUrl}/blog` },
        { '@type': 'ListItem', position: 3, name: post.title, item: post.canonical }
      ]
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: author.name,
      url: author.url,
      email: author.email,
      telephone: author.phone,
      jobTitle: 'Freelance SEO Expert',
      address: { '@type': 'PostalAddress', addressLocality: 'Karachi', addressCountry: 'PK' }
    }
  ];
  if ((post.faqItems || []).some(item => item.question && item.answer)) {
    json.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: post.faqItems
        .filter(item => item.question && item.answer)
        .map(item => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer }
        }))
    });
  }

  const toc = post.showToc !== false && post.toc.length
    ? `<nav class="article-toc article-toc-visible" aria-label="Article sections"><p>On this page</p>${post.toc.map(item => `<a href="#${item.id}">${escapeHtml(item.title)}</a>`).join('')}</nav>`
    : '';
  const shares = shareLinks(post);
  const featuredImage = `<figure class="article-featured-image"><img ${imageAttributes(post.image || '/og-image.png', post.imageAlt || post.title, 'eager')}>${post.imageCredit ? `<figcaption>${escapeHtml(post.imageCredit)}</figcaption>` : ''}</figure>`;
  const framework = renderTopicalAuthorityMap(post);
  const articleClasses = [
    'blog-post',
    `article-theme-${post.articleTheme === 'light' ? 'light' : 'dark'}`,
    `article-scale-${['compact', 'large'].includes(post.typographyScale) ? post.typographyScale : 'comfortable'}`
  ].join(' ');
  const shareCard = post.showShare === false ? '' : `<div class="article-share-card"><p class="section-label">Share</p><div class="article-share-links">${shares.map(([label, href, glyph]) => `<a href="${href}" target="_blank" rel="noopener noreferrer" aria-label="Share on ${label}">${shareIcon(label, glyph)}</a>`).join('')}</div></div>`;
  const relatedBlock = post.showRelated === false ? '' : `<p class="section-label">Related Articles</p><div class="article-related-grid">${related.map(renderRelatedCard).join('')}</div>`;
  const sidebarCta = post.showSidebarCta === false ? '' : `<div class="article-side-cta"><p class="section-label">Next Step</p><h3>${escapeHtml(post.ctaTitle || 'Want help with this?')}</h3><p>${escapeHtml(post.ctaText || 'Send me your site and I will tell you the first fixes I would make.')}</p><a class="btn-primary" href="${escapeHtml(post.ctaUrl || '/free-seo-audit')}">${escapeHtml(post.ctaButtonText || post.globalPrimaryCta || 'Get a Free SEO Audit')}</a></div>`;
  const auditWidget = post.showSidebarCta === false ? '' : `<div class="article-audit-widget"><h3>Find Your SEO Issues in 30 Seconds</h3><p>Free technical audit shows what is blocking your search visibility.</p><form name="quick-seo-audit" method="POST" action="/thank-you" data-netlify="true" netlify-honeypot="bot-field"><input type="hidden" name="form-name" value="quick-seo-audit"><p class="hidden-field"><label>Do not fill this out <input name="bot-field"></label></p><input name="website" type="url" required placeholder="Enter domain or URL"><button class="btn-primary" type="submit">Audit My Site</button></form></div>`;

  const html = `${head({
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    canonical: post.canonical,
    type: 'article',
    image: post.image || '/og-image.png',
    robots: post.noindex ? 'noindex, nofollow' : 'index, follow',
    article: {
      publishedTime: post.date,
      modifiedTime: post.updated || post.date,
      section: post.category || 'SEO',
      tags: post.tags || []
    },
    json
  })}
<body id="top" class="${articleClasses}" style="--article-accent:${safeColor(post.accentColor)}">
<div class="reading-progress" data-reading-progress></div>
${nav('blog')}
<main>
<section class="article-hero article-page-hero">
  <div class="container">
    <nav class="breadcrumb"><a href="/">Home</a><span>/</span><a href="/blog">Blog</a><span>/</span>${escapeHtml(post.title)}</nav>
    <div class="article-hero-grid">
      <div class="article-hero-main">
        <div class="hero-badge"><span class="hero-badge-dot"></span>${escapeHtml(post.category || 'SEO Guide')}</div>
        <h1>${highlightedTitle(post)}</h1>
        <p class="page-hero-sub">${escapeHtml(post.excerpt)}</p>
        <div class="article-meta"><span>By <a href="/about">${author.name}</a></span><span>Updated ${escapeHtml(post.updated || post.date)}</span><span>${escapeHtml(post.readingTime || 6)} min read</span></div>
        ${renderArticleTags(post)}
      </div>
      <aside class="article-hero-proof"><div class="callout article-trust-box"><div class="callout-title">Why you can trust this guide</div>${escapeHtml(post.trustNote || 'This article is written from hands-on SEO work, audits, content planning, and real client questions.')}</div></aside>
    </div>
  </div>
</section>
<section class="article-main-section">
  <div class="article-page-shell article-page-shell-pro">
    <aside class="article-sidebar">
      ${toc}
      <div class="author-mini-card"><img src="/owais.png" alt="Owais Ahmed Sheikh" loading="lazy"><div><strong>Owais Ahmed Sheikh</strong><span>Freelance SEO Expert in Karachi</span></div><a href="/about">About Owais</a></div>
    </aside>
    <article class="article-body" itemscope itemtype="https://schema.org/BlogPosting">
      ${featuredImage}
      <div class="article-mobile-toc">${toc}</div>
      ${framework}
      ${post.contentHtml}
      ${renderNewsletter(post)}
      ${renderArticleFaq(post)}
      <div class="article-author-box"><img src="/owais.png" alt="Owais Ahmed Sheikh" loading="lazy"><div><p class="section-label">About the author</p><h2>Owais Ahmed Sheikh</h2><p>Freelance SEO expert and content writer based in Karachi. I work on local SEO, technical SEO, on-page SEO, SEO content writing, and audits for Pakistan businesses.</p><a class="blog-read-more" href="/about">Read more about Owais</a></div></div>
      ${renderComments(postComments)}
    </article>
    <aside class="article-related article-related-pro">
      ${shareCard}
      ${toc}
      ${relatedBlock}
      ${auditWidget}
      ${sidebarCta}
    </aside>
  </div>
</section>
<section class="cta-block">
  <div class="container">
    <p class="section-label" style="display:block;text-align:center">Get Help</p>
    <h2>${escapeHtml(post.ctaTitle || 'Want help with this on your website?')}</h2>
    <p>${escapeHtml(post.ctaText || 'Send me your site and I will tell you the first SEO fixes I would make.')}</p>
    <div class="ctas"><a class="btn-primary" href="${escapeHtml(post.ctaUrl || '/free-seo-audit')}">${escapeHtml(post.ctaButtonText || post.globalPrimaryCta || 'Get a Free SEO Audit')}</a><a class="btn-secondary" href="https://wa.me/923152648247" target="_blank" rel="noopener noreferrer">${escapeHtml(post.globalSecondaryCta || 'WhatsApp')}</a></div>
  </div>
</section>
</main>
${footer()}
${commonScripts()}
</body>
</html>`;

  const outDir = path.join(blogDir, post.slug);
  ensureDir(outDir);
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
}

function updateSitemap(posts) {
  const sitemapPath = path.join(root, 'sitemap.xml');
  const existing = fs.existsSync(sitemapPath) ? fs.readFileSync(sitemapPath, 'utf8') : '';
  const locs = [...existing.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map(match => normalizeSitemapLoc(match[1]))
    .filter(Boolean);
  const keep = locs.filter(loc => !/\/blog(\/|$)/.test(loc));
  const indexablePosts = posts.filter(post => !post.noindex);
  const urls = [
    ...keep,
    `${siteUrl}/write-for-us`,
    `${siteUrl}/blog`,
    ...indexablePosts.map(post => post.canonical)
  ];
  const unique = [...new Set(urls)];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${unique.map(loc => {
    const isHome = loc === `${siteUrl}/`;
    const isBlog = loc === `${siteUrl}/blog`;
    const isPost = loc.startsWith(`${siteUrl}/blog/`);
    const priority = isHome ? '1.0' : isBlog ? '0.8' : isPost ? '0.7' : loc.includes('/case-studies/') ? '0.9' : '0.8';
    const changefreq = isBlog || isPost ? 'weekly' : 'monthly';
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  }).join('\n')}\n</urlset>\n`;

  fs.writeFileSync(sitemapPath, xml);
}

function normalizeSitemapLoc(loc) {
  try {
    const url = new URL(loc);
    return `${siteUrl}${url.pathname.replace(/\/$/, '')}${url.search}`;
  } catch {
    return '';
  }
}

function updateRobots() {
  const robots = `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`;
  fs.writeFileSync(path.join(root, 'robots.txt'), robots);
}

function main() {
  const posts = readPosts();
  const commentsByPost = readComments();
  if (!posts.length) throw new Error('No published blog posts found.');
  buildBlogIndex(posts);
  posts.forEach(post => buildPost(post, posts, commentsByPost));
  updateHomepageRecentPosts(posts);
  updateSitemap(posts);
  updateRobots();
  console.log(`Built ${posts.length} blog posts and blog index.`);
}

main();
