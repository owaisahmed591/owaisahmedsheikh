const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const contentDir = path.join(root, 'content', 'blog');
const commentsDir = path.join(root, 'content', 'comments');
const blogDir = path.join(root, 'blog');
const siteUrl = 'https://owaisahmedsheikh.netlify.app';
const today = new Date().toISOString().slice(0, 10);

const author = {
  name: 'Owais Ahmed Sheikh',
  url: `${siteUrl}/about`,
  email: 'owaisahmed591@gmail.com',
  phone: '+923152648247'
};

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

function inlineMarkdown(value) {
  let text = escapeHtml(value);
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
    const safeHref = escapeHtml(href);
    const isExternal = /^https?:\/\//.test(href);
    const attrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${safeHref}"${attrs}>${label}</a>`;
  });
  return text;
}

function closeList(html, listType) {
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
    html.push(closeList(html, listType));
    listType = type;
    html.push(`<${type}>`);
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushBlockquote();
      if (listType) {
        html.push(closeList(html, listType));
        listType = null;
      }
      continue;
    }

    if (line.startsWith('> ')) {
      flushParagraph();
      if (listType) {
        html.push(closeList(html, listType));
        listType = null;
      }
      blockquote.push(line.slice(2));
      continue;
    }

    const heading = line.match(/^(#{2,4})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushBlockquote();
      if (listType) {
        html.push(closeList(html, listType));
        listType = null;
      }
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
  if (listType) html.push(closeList(html, listType));

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
      return {
        ...parsed.data,
        slug,
        body: parsed.body,
        contentHtml: rendered.html,
        toc: rendered.toc,
        url: `/blog/${slug}`,
        canonical: `${siteUrl}/blog/${slug}`,
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

function head({ title, description, canonical, type = 'website', image = '/og-image.png', json = [] }) {
  const absoluteImage = image.startsWith('http') ? image : `${siteUrl}${image}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${escapeHtml(canonical)}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:type" content="${type}">
<meta property="og:url" content="${escapeHtml(canonical)}">
<meta property="og:image" content="${escapeHtml(absoluteImage)}">
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
${json.map(jsonLd).join('\n')}
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
document.querySelectorAll('[data-blog-filter]').forEach(button=>{button.addEventListener('click',()=>{const filter=button.dataset.blogFilter;document.querySelectorAll('[data-blog-filter]').forEach(item=>item.classList.toggle('active',item===button));document.querySelectorAll('[data-blog-card]').forEach(card=>{const show=filter==='all'||card.dataset.category===filter;card.hidden=!show;});});});
const search=document.getElementById('blog-search');
if(search){search.addEventListener('input',()=>{const query=search.value.trim().toLowerCase();document.querySelectorAll('[data-blog-card]').forEach(card=>{const text=card.textContent.toLowerCase();card.hidden=query&&!text.includes(query);});});}
const commentForm=document.querySelector('[data-comment-form]');
if(commentForm){commentForm.addEventListener('submit',event=>{event.preventDefault();const data=new FormData(commentForm);const name=(data.get('name')||'').toString().trim();const message=(data.get('comment')||'').toString().trim();const status=commentForm.querySelector('[data-comment-status]');if(!name||!message){if(status)status.textContent='Please add your name and comment.';return;}if(status)status.textContent='Comment received locally. On the live site this will be sent for approval before publishing.';commentForm.reset();});}
</script><a class="back-to-top" href="#top" aria-label="Back to top"></a><script src="/chat-widget.js?v=20260424ai1" defer></script>`;
}

function categoryClass(category = '') {
  return slugify(category || 'General');
}

function postCard(post, featured = false) {
  return `<article class="blog-post-card${featured ? ' is-featured' : ''} reveal" data-blog-card data-category="${categoryClass(post.category)}"><a class="blog-post-media" href="${post.url}" aria-label="${escapeHtml(post.title)}"><img src="${escapeHtml(post.image || '/og-image.png')}" alt="${escapeHtml(post.imageAlt || post.title)}" loading="lazy"></a><div class="blog-post-body"><div class="blog-post-kicker">${escapeHtml(post.category || 'SEO Guide')}</div><h3><a href="${post.url}">${escapeHtml(post.title)}</a></h3><p>${escapeHtml(post.excerpt)}</p><div class="blog-post-meta"><span>${escapeHtml(post.updated || post.date)}</span><span>${escapeHtml(post.readingTime || 6)} min read</span></div><a class="blog-read-more" href="${post.url}">Read article</a></div></article>`;
}

function compactPostCard(post) {
  return `<article class="home-blog-card reveal"><a class="home-blog-image" href="${post.url}" aria-label="${escapeHtml(post.title)}"><img src="${escapeHtml(post.image || '/og-image.png')}" alt="${escapeHtml(post.imageAlt || post.title)}" loading="lazy"></a><div class="home-blog-copy"><span>${escapeHtml(post.category || 'SEO Guide')}</span><h3><a href="${post.url}">${escapeHtml(post.title)}</a></h3><p>${escapeHtml(post.excerpt)}</p><div class="home-blog-meta"><time datetime="${escapeHtml(post.updated || post.date)}">${escapeHtml(post.updated || post.date)}</time><small>${escapeHtml(post.readingTime || 6)} min read</small></div></div></article>`;
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

function shareLinks(post) {
  const url = encodeURIComponent(post.canonical);
  const title = encodeURIComponent(post.title);
  return [
    ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${url}`],
    ['X', `https://twitter.com/intent/tweet?url=${url}&text=${title}`],
    ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${url}`],
    ['WhatsApp', `https://wa.me/?text=${title}%20${url}`]
  ];
}

function buildBlogIndex(posts) {
  const featured = posts.filter(post => post.featured).slice(0, 2);
  const rest = posts.filter(post => !featured.includes(post));
  const categories = [...new Set(posts.map(post => post.category || 'General'))];
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
    title: 'SEO Blog | Practical SEO and Content Writing Advice',
    description: 'Read SEO guides, content writing advice, local search tips, and case studies for Karachi and Pakistan businesses.',
    canonical: `${siteUrl}/blog`,
    json
  })}
<body id="top">
${nav('blog')}
<main>
<section class="blog-hub-hero">
  <div class="container">
    <nav class="breadcrumb"><a href="/">Home</a><span>/</span>Blog</nav>
    <div class="blog-hub-intro">
      <p class="section-label">SEO Learning Hub</p>
      <h1>SEO Blog for <span class="grad-text">Karachi Businesses</span></h1>
      <p class="page-hero-sub">Practical guides on local SEO, technical SEO, content writing, service pages, case studies, and search strategy. Written for business owners who want clear answers before they spend money.</p>
      <div class="blog-hub-actions"><a class="btn-primary" href="/seo-content-writing">Get SEO Content Written</a><a class="btn-secondary" href="/write-for-us">Write for Us</a><a class="btn-secondary" href="/free-seo-audit">Request a Free Audit</a></div>
    </div>
  </div>
</section>
<section class="blog-command-section">
  <div class="container">
    <div class="blog-command-bar">
      <div class="blog-search-wrap"><span aria-hidden="true"></span><input id="blog-search" type="search" placeholder="Search SEO guides, content writing, audits..." aria-label="Search blog posts"></div>
      <div class="blog-filter-pills" aria-label="Filter blog categories"><button class="active" type="button" data-blog-filter="all">All</button>${categories.map(category => `<button type="button" data-blog-filter="${categoryClass(category)}">${escapeHtml(category)}</button>`).join('')}</div>
    </div>
  </div>
</section>
<section class="blog-layout-section">
  <div class="container">
    <div class="blog-section-head">
      <div><p class="section-label">Featured Guides</p><h2>Start with the pages that fix the biggest SEO problems</h2><p class="section-sub">These are the most useful reads for business owners who want rankings, leads, and better website content.</p></div>
    </div>
    <div class="blog-feature-grid">${featured.map(post => postCard(post, true)).join('')}</div>
  </div>
</section>
<section class="blog-layout-section blog-all-posts">
  <div class="container">
    <div class="blog-section-head">
      <div><p class="section-label">All Articles</p><h2>SEO, content, and local search advice</h2><p class="section-sub">Use these posts to understand what to fix, what to write, and how to build pages that can rank.</p></div>
      <a class="blog-section-link" href="/results-case-studies">See case studies</a>
    </div>
    <div class="blog-post-grid">${[...featured, ...rest].map(post => postCard(post)).join('')}</div>
  </div>
</section>
<section class="blog-resource-band">
  <div class="container">
    <div class="blog-resource-grid">
      <article><p class="section-label">Services</p><h2>Need the work done for you?</h2><p>I write SEO blogs, service pages, and landing pages that sound natural, answer search intent, and support your main money pages.</p><a class="btn-primary" href="/seo-content-writing">View Content Writing Service</a></article>
      <article><p class="section-label">Proof</p><h2>See real search work</h2><p>Review case studies built from Search Console screenshots, technical reports, strategy documents, and real project notes.</p><a class="btn-secondary" href="/results-case-studies">Open Results Hub</a></article>
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
  const bySlug = new Map(posts.map(item => [item.slug, item]));
  const selected = (post.relatedPosts || []).map(slug => bySlug.get(slug)).filter(Boolean);
  const fallback = posts.filter(item => item.slug !== post.slug && !selected.includes(item)).slice(0, 2);
  return [...selected, ...fallback].slice(0, 3);
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
  return `<a class="article-related-card" href="${post.url}"><span class="article-related-image"><img src="${escapeHtml(post.image || '/og-image.png')}" alt="${escapeHtml(post.imageAlt || post.title)}" loading="lazy"></span><span class="article-related-copy"><span class="blog-tag">${escapeHtml(post.category || 'SEO')}</span><strong>${escapeHtml(post.title)}</strong><span>${escapeHtml(post.excerpt)}</span></span></a>`;
}

function buildPost(post, posts, commentsByPost) {
  const related = relatedFor(post, posts);
  const postComments = commentsByPost.get(post.slug) || [];
  postComments.postSlug = post.slug;
  const json = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.metaDescription || post.excerpt,
      image: absoluteUrl(post.image || '/og-image.png'),
      datePublished: post.date,
      dateModified: post.updated || post.date,
      author: { '@type': 'Person', name: author.name, url: author.url },
      publisher: { '@type': 'Organization', name: author.name, logo: { '@type': 'ImageObject', url: `${siteUrl}/brand-mark.svg` } },
      mainEntityOfPage: post.canonical,
      keywords: [post.focusKeyword, ...(post.secondaryKeywords || []), ...(post.tags || [])].filter(Boolean).join(', ')
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteUrl}/blog` },
        { '@type': 'ListItem', position: 3, name: post.title, item: post.canonical }
      ]
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

  const toc = post.toc.length
    ? `<nav class="article-toc article-toc-visible" aria-label="Article sections"><p>On this page</p>${post.toc.map(item => `<a href="#${item.id}">${escapeHtml(item.title)}</a>`).join('')}</nav>`
    : '';
  const shares = shareLinks(post);
  const featuredImage = `<figure class="article-featured-image"><img src="${escapeHtml(post.image || '/og-image.png')}" alt="${escapeHtml(post.imageAlt || post.title)}" loading="eager">${post.imageCredit ? `<figcaption>${escapeHtml(post.imageCredit)}</figcaption>` : ''}</figure>`;

  const html = `${head({
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    canonical: post.canonical,
    type: 'article',
    image: post.image || '/og-image.png',
    json
  })}
<body id="top">
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
      ${post.contentHtml}
      ${renderNewsletter(post)}
      ${renderArticleFaq(post)}
      <div class="article-author-box"><img src="/owais.png" alt="Owais Ahmed Sheikh" loading="lazy"><div><p class="section-label">About the author</p><h2>Owais Ahmed Sheikh</h2><p>Freelance SEO expert and content writer based in Karachi. I work on local SEO, technical SEO, on-page SEO, SEO content writing, and audits for Pakistan businesses.</p><a class="blog-read-more" href="/about">Read more about Owais</a></div></div>
      ${renderComments(postComments)}
    </article>
    <aside class="article-related article-related-pro">
      <div class="article-share-card"><p class="section-label">Share</p><div class="article-share-links">${shares.map(([label, href]) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`).join('')}</div></div>
      ${toc}
      <p class="section-label">Related Articles</p>
      <div class="article-related-grid">${related.map(renderRelatedCard).join('')}</div>
      <div class="article-audit-widget"><h3>Find Your SEO Issues in 30 Seconds</h3><p>Free technical audit shows what is blocking your search visibility.</p><form name="quick-seo-audit" method="POST" action="/thank-you" data-netlify="true" netlify-honeypot="bot-field"><input type="hidden" name="form-name" value="quick-seo-audit"><p class="hidden-field"><label>Do not fill this out <input name="bot-field"></label></p><input name="website" type="url" required placeholder="Enter domain or URL"><button class="btn-primary" type="submit">Audit My Site</button></form></div>
      <div class="article-side-cta"><p class="section-label">Next Step</p><h3>${escapeHtml(post.ctaTitle || 'Want help with this?')}</h3><p>${escapeHtml(post.ctaText || 'Send me your site and I will tell you the first fixes I would make.')}</p><a class="btn-primary" href="${escapeHtml(post.ctaUrl || '/free-seo-audit')}">${escapeHtml(post.ctaButtonText || 'Get a Free SEO Audit')}</a></div>
    </aside>
  </div>
</section>
<section class="cta-block">
  <div class="container">
    <p class="section-label" style="display:block;text-align:center">Get Help</p>
    <h2>${escapeHtml(post.ctaTitle || 'Want help with this on your website?')}</h2>
    <p>${escapeHtml(post.ctaText || 'Send me your site and I will tell you the first SEO fixes I would make.')}</p>
    <div class="ctas"><a class="btn-primary" href="${escapeHtml(post.ctaUrl || '/free-seo-audit')}">${escapeHtml(post.ctaButtonText || 'Get a Free SEO Audit')}</a><a class="btn-secondary" href="https://wa.me/923152648247" target="_blank" rel="noopener noreferrer">WhatsApp</a></div>
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
  const locs = [...existing.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  const keep = locs.filter(loc => !/\/blog(\/|$)/.test(loc));
  const urls = [
    ...keep,
    `${siteUrl}/write-for-us`,
    `${siteUrl}/blog`,
    ...posts.map(post => post.canonical)
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

function main() {
  const posts = readPosts();
  const commentsByPost = readComments();
  if (!posts.length) throw new Error('No published blog posts found.');
  buildBlogIndex(posts);
  posts.forEach(post => buildPost(post, posts, commentsByPost));
  updateHomepageRecentPosts(posts);
  updateSitemap(posts);
  console.log(`Built ${posts.length} blog posts and blog index.`);
}

main();
