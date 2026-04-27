const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const contentDir = path.join(root, 'content', 'blog');
const outputDir = path.join(root, 'assets', 'blog');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseFrontmatter(fileContent) {
  const end = fileContent.indexOf('\n---', 4);
  const raw = fileContent.slice(4, end).trim();
  const data = {};
  for (const line of raw.split(/\r?\n/)) {
    const index = line.indexOf(':');
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim().replace(/^["']|["']$/g, '');
    data[key] = value;
  }
  return data;
}

function wrapWords(text, maxChars = 28) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function iconFor(title, category) {
  const haystack = `${title} ${category}`.toLowerCase();
  if (haystack.includes('local') || haystack.includes('profile') || haystack.includes('karachi')) {
    return '<path d="M110 140c0-31 25-56 56-56s56 25 56 56c0 42-56 98-56 98s-56-56-56-98Z"/><circle cx="166" cy="140" r="18"/>';
  }
  if (haystack.includes('content') || haystack.includes('blog') || haystack.includes('writing') || haystack.includes('refresh')) {
    return '<path d="M108 238h116"/><path d="M108 198h88"/><path d="M108 158h116"/><path d="M226 92l38 38-92 92-48 10 10-48 92-92Z"/>';
  }
  if (haystack.includes('technical') || haystack.includes('core web') || haystack.includes('speed')) {
    return '<path d="M114 118h120v92H114z"/><path d="m102 244 18-34h108l18 34"/><path d="m146 151-20 20 20 20"/><path d="m202 151 20 20-20 20"/><path d="m180 145-16 52"/>';
  }
  if (haystack.includes('search console') || haystack.includes('reporting') || haystack.includes('metrics')) {
    return '<path d="M104 230h132"/><path d="M124 206v-42"/><path d="M166 206v-86"/><path d="M208 206v-116"/><path d="M106 124l50 34 42-58 44 26"/>';
  }
  if (haystack.includes('ecommerce')) {
    return '<path d="M96 112h30l20 96h88l22-66H142"/><circle cx="162" cy="236" r="12"/><circle cx="226" cy="236" r="12"/><path d="M166 158h54"/>';
  }
  if (haystack.includes('ai')) {
    return '<circle cx="166" cy="166" r="54"/><path d="M166 92v-28"/><path d="M166 268v-28"/><path d="M92 166H64"/><path d="M268 166h-28"/><path d="M134 154h64"/><path d="M134 184h42"/>';
  }
  return '<path d="M104 214h126"/><path d="M104 168l42-42 42 28 54-74"/><circle cx="146" cy="126" r="10"/><circle cx="188" cy="154" r="10"/><circle cx="242" cy="80" r="10"/>';
}

function svgFor(post) {
  const titleLines = wrapWords(post.title);
  const titleSvg = titleLines
    .map((line, index) => `<text x="392" y="${156 + index * 48}" class="title">${escapeXml(line)}</text>`)
    .join('\n');
  const icon = iconFor(post.title, post.category);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(post.title)}</title>
  <desc id="desc">${escapeXml(post.category || 'SEO guide')} featured image for the Owais Ahmed Sheikh SEO blog.</desc>
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop stop-color="#020905"/>
      <stop offset=".48" stop-color="#061a0c"/>
      <stop offset="1" stop-color="#02100b"/>
    </linearGradient>
    <radialGradient id="glow" cx=".26" cy=".34" r=".58">
      <stop stop-color="#31ff8c" stop-opacity=".42"/>
      <stop offset=".48" stop-color="#23e77b" stop-opacity=".09"/>
      <stop offset="1" stop-color="#23e77b" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="line" x1="0" x2="1">
      <stop stop-color="#31ff8c"/>
      <stop offset="1" stop-color="#37d9ff"/>
    </linearGradient>
    <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="16" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="1200" height="675" fill="url(#bg)"/>
  <rect width="1200" height="675" fill="url(#glow)"/>
  <path d="M0 514c172-74 282-42 402-8 176 50 354 93 798-62v231H0Z" fill="#061b0d" opacity=".82"/>
  <g opacity=".08" stroke="#31ff8c">
    <path d="M0 120h1200M0 240h1200M0 360h1200M0 480h1200"/>
    <path d="M120 0v675M240 0v675M360 0v675M480 0v675M600 0v675M720 0v675M840 0v675M960 0v675M1080 0v675"/>
  </g>
  <rect x="76" y="86" width="262" height="262" rx="56" fill="#092112" stroke="#31ff8c" stroke-opacity=".22"/>
  <g fill="none" stroke="url(#line)" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" filter="url(#softGlow)">
    ${icon}
  </g>
  <rect x="392" y="86" width="236" height="40" rx="20" fill="#12351e" stroke="#31ff8c" stroke-opacity=".35"/>
  <circle cx="420" cy="106" r="7" fill="#31ff8c"/>
  <text x="438" y="112" class="kicker">${escapeXml(post.category || 'SEO Guide')}</text>
  ${titleSvg}
  <text x="392" y="340" class="meta">Owais Ahmed Sheikh</text>
  <text x="392" y="382" class="sub">${escapeXml(post.focusKeyword || 'SEO strategy')}</text>
  <path d="M392 458h410" stroke="url(#line)" stroke-width="10" stroke-linecap="round"/>
  <path d="M392 506h260" stroke="#dff8e7" stroke-width="10" stroke-linecap="round" opacity=".78"/>
  <path d="M392 554h330" stroke="#31ff8c" stroke-width="10" stroke-linecap="round" opacity=".76"/>
  <text x="392" y="616" class="brand">SEO guides, content, and search work for Pakistan businesses</text>
  <style>
    .kicker{font:800 20px Manrope,Arial,sans-serif;fill:#31ff8c;letter-spacing:.08em;text-transform:uppercase}
    .title{font:900 46px Manrope,Arial,sans-serif;fill:#f8fff9}
    .meta{font:800 26px Manrope,Arial,sans-serif;fill:#31ff8c}
    .sub{font:700 23px Manrope,Arial,sans-serif;fill:#c7d8cc}
    .brand{font:700 20px Manrope,Arial,sans-serif;fill:#89a893}
  </style>
</svg>`;
}

function main() {
  ensureDir(outputDir);
  const posts = fs.readdirSync(contentDir)
    .filter(file => file.endsWith('.md'))
    .map(file => parseFrontmatter(fs.readFileSync(path.join(contentDir, file), 'utf8')));

  for (const post of posts) {
    if (!post.slug || !post.title) continue;
    fs.writeFileSync(path.join(outputDir, `${post.slug}.svg`), svgFor(post));
  }

  console.log(`Generated ${posts.length} blog SVG images.`);
}

main();
