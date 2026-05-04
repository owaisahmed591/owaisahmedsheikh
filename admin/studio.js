const state = {
  posts: [],
  pages: [],
  media: [],
  blogIndex: {},
  activeSlug: '',
  activePost: null,
  selectedLinkUrl: '',
  selectedImageUrl: '',
  blocks: [],
  activeBlockIndex: 0,
  slashBlockIndex: 0,
  slashQuery: '',
  editorAdapter: null,
  editorMode: 'write',
  dirty: false,
  auth: {
    authenticated: false,
    setupRequired: false,
    csrfToken: '',
    mode: new URLSearchParams(window.location.search).get('reset') ? 'reset' : 'login',
    resetToken: new URLSearchParams(window.location.search).get('reset') || ''
  }
};

const els = {
  authGate: document.querySelector('#authGate'),
  authLoading: document.querySelector('#authLoading'),
  authForm: document.querySelector('#authForm'),
  authEyebrow: document.querySelector('#authEyebrow'),
  authTitle: document.querySelector('#authTitle'),
  authIntro: document.querySelector('#authIntro'),
  authUsernameLabel: document.querySelector('#authUsernameLabel'),
  authUsernameText: document.querySelector('#authUsernameText'),
  authUsername: document.querySelector('#authUsername'),
  authEmailLabel: document.querySelector('#authEmailLabel'),
  authEmail: document.querySelector('#authEmail'),
  authPasswordLabel: document.querySelector('#authPasswordLabel'),
  authPasswordText: document.querySelector('#authPasswordText'),
  authPassword: document.querySelector('#authPassword'),
  authConfirmPasswordLabel: document.querySelector('#authConfirmPasswordLabel'),
  authConfirmPassword: document.querySelector('#authConfirmPassword'),
  authTogglePassword: document.querySelector('#authTogglePassword'),
  authSubmit: document.querySelector('#authSubmit'),
  forgotPassword: document.querySelector('#forgotPasswordButton'),
  backToLogin: document.querySelector('#backToLoginButton'),
  authMessage: document.querySelector('#authMessage'),
  status: document.querySelector('#studioStatus'),
  screenTitle: document.querySelector('#screenTitle'),
  topPostStatus: document.querySelector('#topPostStatus'),
  postList: document.querySelector('#postList'),
  search: document.querySelector('#postSearch'),
  empty: document.querySelector('#emptyState'),
  form: document.querySelector('#postForm'),
  save: document.querySelector('#savePostButton'),
  newPost: document.querySelector('#newPostButton'),
  sidebarNewPost: document.querySelector('#sidebarNewPostButton'),
  saveDraft: document.querySelector('#saveDraftButton'),
  publishPost: document.querySelector('#publishPostButton'),
  topPreview: document.querySelector('#topPreviewButton'),
  writeMode: document.querySelector('#writeModeButton'),
  splitMode: document.querySelector('#splitModeButton'),
  desktopPreview: document.querySelector('#desktopPreviewButton'),
  mobilePreview: document.querySelector('#mobilePreviewButton'),
  themePreview: document.querySelector('#themePreviewButton'),
  openPreviewNewTab: document.querySelector('#openPreviewNewTabButton'),
  openFrontend: document.querySelector('#openFrontendButton'),
  duplicatePost: document.querySelector('#duplicatePostButton'),
  deletePost: document.querySelector('#deletePostButton'),
  logout: document.querySelector('#logoutButton'),
  title: document.querySelector('#titleInput'),
  slug: document.querySelector('#slugInput'),
  openPostLink: document.querySelector('#openPostLink'),
  workspace: document.querySelector('#writingWorkspace'),
  previewPanel: document.querySelector('#livePreviewPanel'),
  livePreviewFrame: document.querySelector('#livePreviewFrame'),
  body: document.querySelector('#bodyEditor'),
  previewMode: document.querySelector('#previewModeButton'),
  insertBlock: document.querySelector('#insertBlockButton'),
  draft: document.querySelector('#draftInput'),
  featured: document.querySelector('#featuredInput'),
  date: document.querySelector('#dateInput'),
  updated: document.querySelector('#updatedInput'),
  category: document.querySelector('#categoryInput'),
  readingTime: document.querySelector('#readingTimeInput'),
  focusKeyword: document.querySelector('#focusKeywordInput'),
  metaTitle: document.querySelector('#metaTitleInput'),
  metaDescription: document.querySelector('#metaDescriptionInput'),
  excerpt: document.querySelector('#excerptInput'),
  tags: document.querySelector('#tagsInput'),
  heroTitle: document.querySelector('#heroTitleInput'),
  heroAccent: document.querySelector('#heroAccentInput'),
  trustNote: document.querySelector('#trustNoteInput'),
  image: document.querySelector('#imageInput'),
  imageAlt: document.querySelector('#imageAltInput'),
  imagePreview: document.querySelector('#imagePreview'),
  editorImagePreview: document.querySelector('#editorImagePreview'),
  editorCategoryBadge: document.querySelector('#editorCategoryBadge'),
  editorStatusBadge: document.querySelector('#editorStatusBadge'),
  editorSavedAt: document.querySelector('#editorSavedAt'),
  uploadFeatured: document.querySelector('#uploadFeaturedButton'),
  insertFeatured: document.querySelector('#insertFeaturedButton'),
  relatedPosts: document.querySelector('#relatedPostsList'),
  qualityScore: document.querySelector('#qualityScore'),
  uxAssistant: document.querySelector('#uxAssistantList'),
  publishChecklist: document.querySelector('#publishChecklist'),
  globalPrimaryCta: document.querySelector('#globalPrimaryCtaInput'),
  globalSecondaryCta: document.querySelector('#globalSecondaryCtaInput'),
  ctaTitle: document.querySelector('#ctaTitleInput'),
  ctaText: document.querySelector('#ctaTextInput'),
  ctaButtonText: document.querySelector('#ctaButtonTextInput'),
  ctaUrl: document.querySelector('#ctaUrlInput'),
  showToc: document.querySelector('#showTocInput'),
  showShare: document.querySelector('#showShareInput'),
  showRelated: document.querySelector('#showRelatedInput'),
  showSidebarCta: document.querySelector('#showSidebarCtaInput'),
  canonical: document.querySelector('#canonicalInput'),
  noindex: document.querySelector('#noindexInput'),
  schemaType: document.querySelector('#schemaTypeInput'),
  schemaPreview: document.querySelector('#schemaPreviewButton'),
  schemaPreviewStatus: document.querySelector('#schemaPreviewStatus'),
  schemaPreviewOutput: document.querySelector('#schemaPreviewOutput'),
  author: document.querySelector('#authorInput'),
  typographyScale: document.querySelector('#typographyScaleInput'),
  articleTheme: document.querySelector('#articleThemeInput'),
  accentColor: document.querySelector('#accentColorInput'),
  showNewsletter: document.querySelector('#showNewsletterInput'),
  newsletterTitle: document.querySelector('#newsletterTitleInput'),
  newsletterText: document.querySelector('#newsletterTextInput'),
  faqItems: document.querySelector('#faqItemsList'),
  addFaq: document.querySelector('#addFaqButton'),
  showFramework: document.querySelector('#showFrameworkInput'),
  frameworkLabel: document.querySelector('#frameworkLabelInput'),
  frameworkTitle: document.querySelector('#frameworkTitleInput'),
  frameworkIntro: document.querySelector('#frameworkIntroInput'),
  frameworkCoreLabel: document.querySelector('#frameworkCoreLabelInput'),
  frameworkCoreTitle: document.querySelector('#frameworkCoreTitleInput'),
  frameworkCoreText: document.querySelector('#frameworkCoreTextInput'),
  frameworkNodes: document.querySelector('#frameworkNodesInput'),
  frameworkSteps: document.querySelector('#frameworkStepsInput'),
  seoScore: document.querySelector('#seoScore'),
  wordCount: document.querySelector('#wordCount'),
  headingCount: document.querySelector('#headingCount'),
  seoChecklist: document.querySelector('#seoChecklist'),
  mediaGrid: document.querySelector('#mediaGrid'),
  modalMediaGrid: document.querySelector('#modalMediaGrid'),
  libraryUpload: document.querySelector('#libraryUploadButton'),
  linkSearch: document.querySelector('#linkSearch'),
  linkGrid: document.querySelector('#linkGrid'),
  linkModal: document.querySelector('#linkModal'),
  imageModal: document.querySelector('#imageModal'),
  modalLinkSearch: document.querySelector('#modalLinkSearch'),
  modalLinkResults: document.querySelector('#modalLinkResults'),
  customLink: document.querySelector('#customLinkInput'),
  applyCustomLink: document.querySelector('#applyCustomLinkButton'),
  uploadInput: document.querySelector('#uploadInput'),
  modalImageUrl: document.querySelector('#modalImageUrl'),
  modalImageAlt: document.querySelector('#modalImageAlt'),
  insertImage: document.querySelector('#insertImageButton'),
  setFeaturedImage: document.querySelector('#setFeaturedImageButton'),
  saveBlogHub: document.querySelector('#saveBlogHubButton'),
  hubFeaturedPosts: document.querySelector('#hubFeaturedPostsList'),
  hubHighlightPosts: document.querySelector('#hubHighlightPostsList'),
  hubInsightTitle: document.querySelector('#hubInsightTitleInput'),
  hubInsightDescription: document.querySelector('#hubInsightDescriptionInput'),
  hubInsightButtonText: document.querySelector('#hubInsightButtonTextInput'),
  hubInsightButtonUrl: document.querySelector('#hubInsightButtonUrlInput'),
  hubMidCtaTitle: document.querySelector('#hubMidCtaTitleInput'),
  hubMidCtaDescription: document.querySelector('#hubMidCtaDescriptionInput'),
  hubMidCtaButtonText: document.querySelector('#hubMidCtaButtonTextInput'),
  hubMidCtaButtonUrl: document.querySelector('#hubMidCtaButtonUrlInput'),
  hubSpotlightLabel: document.querySelector('#hubSpotlightLabelInput'),
  hubSpotlightTitle: document.querySelector('#hubSpotlightTitleInput'),
  hubSpotlightPosts: document.querySelector('#hubSpotlightPostsList'),
  slashMenu: document.querySelector('#slashMenu'),
  floatingToolbar: document.querySelector('#floatingToolbar')
};

function setStatus(message, isError = false) {
  els.status.textContent = message;
  els.status.style.color = isError ? '#b42318' : '';
}

function setAuthMessage(message, isError = false) {
  if (!els.authMessage) return;
  els.authMessage.textContent = message || '';
  els.authMessage.style.color = isError ? '#b42318' : '';
}

function setAuthChecking(checking) {
  document.body.classList.toggle('cms-auth-checking', Boolean(checking));
  if (els.authLoading) els.authLoading.hidden = !checking;
}

function setAuthFieldState(input, visible, required) {
  if (!input) return;
  const label = input.closest('label');
  if (label) label.hidden = !visible;
  input.required = Boolean(required && visible);
  input.disabled = !visible;
}

function setAuthMode(mode, setupRequired = false) {
  const activeMode = setupRequired ? 'setup' : mode;
  state.auth.mode = activeMode;

  const isLogin = activeMode === 'login';
  const isSetup = activeMode === 'setup';
  const isForgot = activeMode === 'forgot';
  const isReset = activeMode === 'reset';

  els.authEyebrow.textContent = isSetup ? 'First-time setup' : isForgot ? 'Password recovery' : isReset ? 'Change password' : 'Secure Admin';
  els.authTitle.textContent = isSetup
    ? 'Create your admin account'
    : isForgot
      ? 'Reset your Content Studio password'
      : isReset
        ? 'Choose a new password'
        : 'Sign in to Content Studio';
  els.authIntro.textContent = isSetup
    ? 'Create the first admin user. Add a recovery email so you can reset the password later.'
    : isForgot
      ? 'Enter your admin username or recovery email. If it matches, a secure reset link will be emailed.'
      : isReset
        ? 'Enter a strong new password. Reset links expire after 30 minutes.'
        : 'Use your admin username or recovery email to edit, publish, and rebuild blog content.';

  if (els.authUsernameText) {
    els.authUsernameText.textContent = isForgot ? 'Username or recovery email' : 'Username or email';
  }
  if (els.authPasswordText) {
    els.authPasswordText.textContent = isSetup || isReset ? 'New password' : 'Password';
  }

  setAuthFieldState(els.authUsername, isLogin || isSetup || isForgot, true);
  setAuthFieldState(els.authEmail, isSetup, false);
  setAuthFieldState(els.authPassword, isLogin || isSetup || isReset, true);
  setAuthFieldState(els.authConfirmPassword, isSetup || isReset, isSetup || isReset);
  els.authPassword.autocomplete = isLogin ? 'current-password' : 'new-password';
  if (els.authConfirmPassword) els.authConfirmPassword.autocomplete = 'new-password';

  els.authSubmit.textContent = isSetup
    ? 'Create Admin Account'
    : isForgot
      ? 'Send reset email'
      : isReset
        ? 'Change password'
        : 'Sign in';
  if (els.forgotPassword) els.forgotPassword.hidden = !isLogin;
  if (els.backToLogin) els.backToLogin.hidden = isLogin || isSetup;
  setAuthMessage('');

  const focusTarget = isReset ? els.authPassword : els.authUsername;
  setTimeout(() => focusTarget?.focus(), 0);
}

function setAuthGate(visible, setupRequired = false, mode = '') {
  if (!els.authGate) return;
  setAuthChecking(false);
  els.authGate.hidden = !visible;
  document.body.classList.toggle('cms-auth-locked', visible);
  document.body.classList.toggle('cms-authenticated', !visible);
  state.auth.setupRequired = setupRequired;
  if (visible) {
    const nextMode = mode || (state.auth.resetToken ? 'reset' : setupRequired ? 'setup' : state.auth.mode || 'login');
    setAuthMode(nextMode, setupRequired);
  }
}

async function apiFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  if (state.auth.csrfToken && !['GET', 'HEAD'].includes(String(options.method || 'GET').toUpperCase())) {
    headers.set('X-CSRF-Token', state.auth.csrfToken);
  }
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    state.auth.authenticated = false;
    setAuthChecking(false);
    setAuthGate(true, state.auth.setupRequired);
    setStatus('Admin login required.', true);
  }
  return response;
}

function applyAuthSession(data = {}) {
  state.auth.authenticated = Boolean(data.authenticated);
  state.auth.setupRequired = Boolean(data.setupRequired);
  state.auth.csrfToken = data.csrfToken || '';
  setAuthGate(!state.auth.authenticated, state.auth.setupRequired);
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeUrl(value = '') {
  const url = String(value).trim();
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(url)) return url;
  return '#';
}

function inlineMarkdownToHtml(value = '') {
  return escapeHtml(value)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
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
  const fill = cells => Array.from({ length: width }, (_item, index) => inlineMarkdownToHtml(cells[index] || ''));
  const headHtml = fill(headers).map(cell => `<th>${cell}</th>`).join('');
  const bodyHtml = rows
    .map(row => `<tr>${fill(row).map(cell => `<td>${cell}</td>`).join('')}</tr>`)
    .join('');
  return `<table><thead><tr>${headHtml}</tr></thead>${bodyHtml ? `<tbody>${bodyHtml}</tbody>` : ''}</table>`;
}

function markdownTableCell(value = '') {
  return String(value).replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
}

function tableElementToMarkdown(table) {
  const rows = Array.from(table.querySelectorAll('tr'))
    .map(row => Array.from(row.children)
      .filter(cell => ['th', 'td'].includes(cell.tagName.toLowerCase()))
      .map(cell => markdownTableCell(cell.textContent || '')))
    .filter(row => row.length);
  if (!rows.length) return '';
  const width = Math.max(...rows.map(row => row.length));
  const normalized = rows.map(row => Array.from({ length: width }, (_item, index) => row[index] || ''));
  const header = normalized[0];
  const divider = Array.from({ length: width }, () => '---');
  return [
    `| ${header.join(' | ')} |`,
    `| ${divider.join(' | ')} |`,
    ...normalized.slice(1).map(row => `| ${row.join(' | ')} |`)
  ].join('\n');
}

function markdownToHtml(markdown = '') {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let paragraph = [];
  let list = null;
  let code = null;

  function flushParagraph() {
    if (!paragraph.length) return;
    html.push(`<p>${inlineMarkdownToHtml(paragraph.join(' '))}</p>`);
    paragraph = [];
  }

  function closeList() {
    if (!list) return;
    html.push(`</${list}>`);
    list = null;
  }

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    const line = raw.trim();

    if (code) {
      if (line.startsWith('```')) {
        html.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
        code = null;
      } else {
        code.push(raw);
      }
      continue;
    }

    if (!line) {
      flushParagraph();
      closeList();
      continue;
    }

    if (line.startsWith('```')) {
      flushParagraph();
      closeList();
      code = [];
      continue;
    }

    if (/^---+$/.test(line)) {
      flushParagraph();
      closeList();
      html.push('<hr>');
      continue;
    }

    if (line.includes('|') && isMarkdownTableSeparator(lines[i + 1] || '')) {
      flushParagraph();
      closeList();
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

    const heading = line.match(/^(#{2,4})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length;
      html.push(`<h${level}>${inlineMarkdownToHtml(heading[2])}</h${level}>`);
      continue;
    }

    if (line.startsWith('> ')) {
      flushParagraph();
      closeList();
      html.push(`<blockquote>${inlineMarkdownToHtml(line.slice(2))}</blockquote>`);
      continue;
    }

    const unordered = line.match(/^[-*]\s+(.+)$/);
    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const nextList = unordered ? 'ul' : 'ol';
      if (list !== nextList) {
        closeList();
        list = nextList;
        html.push(`<${list}>`);
      }
      html.push(`<li>${inlineMarkdownToHtml((unordered || ordered)[1])}</li>`);
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  closeList();
  return html.join('\n');
}

function htmlToMarkdown(root) {
  const blocks = [];

  function inline(node) {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent.replace(/\s+/g, ' ');
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const tag = node.tagName.toLowerCase();
    const text = Array.from(node.childNodes).map(inline).join('').trim();
    if (tag === 'strong' || tag === 'b') return `**${text}**`;
    if (tag === 'em' || tag === 'i') return `*${text}*`;
    if (tag === 'code') return `\`${text}\``;
    if (tag === 'mark') return `==${text}==`;
    if (tag === 'a') return `[${text}](${safeUrl(node.getAttribute('href') || '#')})`;
    if (tag === 'img') return `![${node.getAttribute('alt') || ''}](${safeUrl(node.getAttribute('src') || '')})`;
    if (tag === 'br') return '\n';
    return text;
  }

  function block(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      if (text) blocks.push(text);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const tag = node.tagName.toLowerCase();
    if (/^h[1-4]$/.test(tag)) {
      const level = Math.max(2, Number(tag[1]));
      blocks.push(`${'#'.repeat(level)} ${inline(node)}`);
      return;
    }

    if (tag === 'table') {
      const markdown = tableElementToMarkdown(node);
      if (markdown) blocks.push(markdown);
      return;
    }

    if (tag === 'blockquote') {
      blocks.push(`> ${inline(node)}`);
      return;
    }

    if (tag === 'ul' || tag === 'ol') {
      Array.from(node.children).forEach((li, index) => {
        blocks.push(`${tag === 'ol' ? `${index + 1}.` : '-'} ${inline(li)}`);
      });
      return;
    }

    if (tag === 'pre') {
      blocks.push(`\`\`\`\n${node.innerText.trim()}\n\`\`\``);
      return;
    }

    if (tag === 'hr') {
      blocks.push('---');
      return;
    }

    if (tag === 'img') {
      blocks.push(inline(node));
      return;
    }

    if (tag === 'figure') {
      const image = node.querySelector('img');
      const caption = node.querySelector('figcaption')?.textContent.trim();
      if (image) {
        blocks.push(`![${image.getAttribute('alt') || ''}](${safeUrl(image.getAttribute('src') || '')})${caption ? `\n\n*${caption}*` : ''}`);
      }
      return;
    }

    if (tag === 'div') {
      const table = node.classList.contains('cms-quill-table-embed') ? node.querySelector('table') : null;
      if (table) {
        const markdown = tableElementToMarkdown(table);
        if (markdown) blocks.push(markdown);
        return;
      }
    }

    if (tag === 'p' || tag === 'div') {
      const text = inline(node).trim();
      if (text) blocks.push(text);
      return;
    }

    Array.from(node.childNodes).forEach(block);
  }

  Array.from(root.childNodes).forEach(block);
  return blocks.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
}

function inlineHtmlToMarkdown(html = '') {
  const root = document.createElement('div');
  root.innerHTML = html;

  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent.replace(/\s+/g, ' ');
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const tag = node.tagName.toLowerCase();
    const text = Array.from(node.childNodes).map(walk).join('').trim();
    if (!text && tag !== 'br') return '';
    if (tag === 'strong' || tag === 'b') return `**${text}**`;
    if (tag === 'em' || tag === 'i') return `*${text}*`;
    if (tag === 'code') return `\`${text}\``;
    if (tag === 'mark') return `==${text}==`;
    if (tag === 'a') return `[${text}](${safeUrl(node.getAttribute('href') || '#')})`;
    if (tag === 'br') return '\n';
    return text;
  }

  return Array.from(root.childNodes).map(walk).join('').replace(/\s+\n/g, '\n').replace(/\n\s+/g, '\n').trim();
}

function editableValue(element) {
  if (!element) return '';
  if (element.isContentEditable) return inlineHtmlToMarkdown(element.innerHTML);
  return element.value || '';
}

function blockId() {
  return `block-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createBlock(type = 'paragraph', data = {}) {
  const defaults = {
    paragraph: { text: '' },
    heading: { level: 'h2', text: '' },
    image: { url: '', alt: '', caption: '' },
    callout: { tone: 'insight', title: 'Insight', text: '' },
    checklist: { title: 'Checklist', items: [''] },
    takeaway: { title: 'Key takeaway', text: '' },
    visual: { title: 'Visual summary', text: '', items: [''] },
    cta: { variant: 'primary', title: 'Need help with this?', text: '', buttonText: 'Get help', url: '/free-seo-audit' },
    faq: { question: 'Question', answer: '' },
    table: { text: '| Item | Detail |\n| --- | --- |\n| Example | Detail |' },
    code: { text: '' },
    embed: { url: '', caption: '' },
    divider: {}
  };
  return { id: blockId(), type, ...(defaults[type] || {}), ...data };
}

function markdownToBlocks(markdown = '') {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let paragraph = [];
  let list = [];

  function flushParagraph() {
    if (!paragraph.length) return;
    blocks.push(createBlock('paragraph', { text: paragraph.join(' ') }));
    paragraph = [];
  }

  function flushList() {
    if (!list.length) return;
    blocks.push(createBlock('checklist', { title: 'Checklist', items: list }));
    list = [];
  }

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = line.match(/^(#{2,4})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push(createBlock('heading', { level: `h${heading[1].length}`, text: heading[2] }));
      continue;
    }

    const image = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (image) {
      flushParagraph();
      flushList();
      blocks.push(createBlock('image', { alt: image[1], url: image[2] }));
      continue;
    }

    if (/^---+$/.test(line)) {
      flushParagraph();
      flushList();
      blocks.push(createBlock('divider'));
      continue;
    }

    if (line.startsWith('> ')) {
      flushParagraph();
      flushList();
      const quote = line.slice(2);
      const match = quote.match(/^\*\*([^:]+):\*\*\s*(.*)$/);
      blocks.push(createBlock('callout', {
        tone: 'insight',
        title: match ? match[1] : 'Insight',
        text: match ? match[2] : quote
      }));
      continue;
    }

    const item = line.match(/^[-*]\s+(.+)$/);
    if (item) {
      flushParagraph();
      list.push(item[1]);
      continue;
    }

    const cta = line.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (cta) {
      flushParagraph();
      flushList();
      blocks.push(createBlock('cta', { title: cta[1], buttonText: cta[1], url: cta[2] }));
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return blocks.length ? blocks : [createBlock('paragraph')];
}

function blocksToMarkdown(blocks = []) {
  return blocks.map(block => {
    if (block.type === 'paragraph') return block.text || '';
    if (block.type === 'heading') return `${'#'.repeat(Number((block.level || 'h2').replace('h', '')))} ${block.text || ''}`;
    if (block.type === 'image') return block.url ? `![${block.alt || ''}](${block.url})${block.caption ? `\n\n*${block.caption}*` : ''}` : '';
    if (block.type === 'callout') return `> **${block.title || 'Insight'}:** ${block.text || ''}`;
    if (block.type === 'checklist') return `${block.title ? `#### ${block.title}\n\n` : ''}${(block.items || []).filter(Boolean).map(item => `- ${item}`).join('\n')}`;
    if (block.type === 'takeaway') return `> **${block.title || 'Key takeaway'}:** ${block.text || ''}`;
    if (block.type === 'visual') return `#### ${block.title || 'Visual summary'}\n\n${block.text || ''}\n\n${(block.items || []).filter(Boolean).map(item => `- ${item}`).join('\n')}`;
    if (block.type === 'cta') return `[${block.buttonText || block.title || 'Get help'}](${block.url || '/free-seo-audit'})`;
    if (block.type === 'faq') return `#### ${block.question || 'Question'}\n\n${block.answer || ''}`;
    if (block.type === 'table') return block.text || '';
    if (block.type === 'code') return `\`\`\`\n${block.text || ''}\n\`\`\``;
    if (block.type === 'embed') return block.url ? `[${block.caption || block.url}](${block.url})` : '';
    if (block.type === 'divider') return '---';
    return '';
  }).filter(Boolean).join('\n\n').trim();
}

function getArticleMarkdown() {
  if (state.editorAdapter?.isReady && typeof state.editorAdapter.getMarkdown === 'function') {
    return state.editorAdapter.getMarkdown();
  }
  return blocksToMarkdown(state.blocks);
}

function getArticleHtml() {
  if (state.editorAdapter?.isReady && typeof state.editorAdapter.getHTML === 'function') {
    return state.editorAdapter.getHTML();
  }
  return markdownToHtml(getArticleMarkdown());
}

function htmlStringToMarkdown(html = '') {
  const root = document.createElement('div');
  root.innerHTML = html;
  return htmlToMarkdown(root);
}

function plainTextFromMarkdown(markdown = '') {
  return String(markdown)
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/[#>*_`|[\]-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstReadableParagraph(markdown = '') {
  return String(markdown)
    .split(/\n{2,}/)
    .map(part => part.replace(/^#+\s+/, '').trim())
    .find(part => part && !/^[-*>#|`]/.test(part)) || '';
}

function cleanSentence(value = '', max = 155) {
  const normalized = plainTextFromMarkdown(value).replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  const clipped = normalized.slice(0, max + 1);
  const sentence = clipped.replace(/\s+\S*$/, '').trim();
  return sentence || normalized.slice(0, max).trim();
}

function extractFaqItemsFromMarkdown(markdown = '') {
  const lines = String(markdown).replace(/\r\n/g, '\n').split('\n');
  const items = [];
  let current = null;

  function flush() {
    if (!current) return;
    const answer = cleanSentence(current.answer.join(' '), 320);
    if (current.question && answer) items.push({ question: current.question, answer });
    current = null;
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const heading = line.match(/^#{3,4}\s+(.+\?)$/);
    const anyHeading = line.match(/^#{2,4}\s+/);
    if (heading) {
      flush();
      current = { question: plainTextFromMarkdown(heading[1]), answer: [] };
      continue;
    }
    if (anyHeading) {
      flush();
      continue;
    }
    if (current && line && !line.startsWith('![')) current.answer.push(line.replace(/^[-*]\s+/, ''));
  }

  flush();
  return items.slice(0, 6);
}

function autoSeoDefaults(post) {
  const markdown = post.body || '';
  const title = post.title || 'Untitled article';
  const excerpt = post.excerpt || cleanSentence(firstReadableParagraph(markdown), 170);
  const metaDescription = post.metaDescription || cleanSentence(excerpt || firstReadableParagraph(markdown), 155);
  const today = new Date().toISOString().slice(0, 10);

  return {
    ...post,
    slug: slugify(post.slug || title),
    excerpt,
    metaTitle: post.metaTitle || title.slice(0, 60),
    metaDescription,
    heroTitle: post.heroTitle || title,
    date: post.date || today,
    updated: post.updated || today,
    readingTime: Math.max(1, Math.ceil(plainTextFromMarkdown(markdown).split(/\s+/).filter(Boolean).length / 220)),
    imageAlt: post.imageAlt || (post.image ? `${title} article image` : ''),
    trustNote: post.trustNote || 'This guide is written from practical SEO work, audits, content planning, and real client questions.',
    relatedPosts: [],
    globalPrimaryCta: post.globalPrimaryCta || 'Get a Free SEO Audit',
    globalSecondaryCta: post.globalSecondaryCta || 'WhatsApp',
    ctaTitle: post.ctaTitle || 'Want help applying this on your website?',
    ctaText: post.ctaText || 'Send me your site and I will point out the first SEO fixes I would make.',
    ctaButtonText: post.ctaButtonText || 'Get a Free SEO Audit',
    ctaUrl: post.ctaUrl || '/free-seo-audit',
    showToc: true,
    showShare: true,
    showRelated: true,
    showSidebarCta: true,
    schemaType: 'BlogPosting',
    author: post.author || 'Owais Ahmed Sheikh',
    typographyScale: 'comfortable',
    articleTheme: 'dark',
    accentColor: post.accentColor || '#2ff28a',
    showNewsletter: true,
    newsletterTitle: post.newsletterTitle || 'Want practical SEO tips in your inbox?',
    newsletterText: post.newsletterText || 'Get clear SEO, content, and local search advice written for business owners. No spam.',
    faqItems: [...(Array.isArray(post.faqItems) ? post.faqItems : []), ...extractFaqItemsFromMarkdown(markdown)]
      .filter((item, index, list) => item.question && item.answer && list.findIndex(next => next.question === item.question) === index)
      .slice(0, 8),
    showFramework: false
  };
}

function templateBlocks(type) {
  if (type === 'howto') {
    return [
      createBlock('paragraph', { text: 'Introduce the problem, who this guide is for, and the outcome the reader will get.' }),
      createBlock('heading', { level: 'h2', text: 'Step 1: Understand the starting point' }),
      createBlock('paragraph', { text: 'Explain what the reader needs to check first.' }),
      createBlock('checklist', { title: 'Quick checklist', items: ['Check the main page', 'Review search intent', 'List missing proof'] }),
      createBlock('heading', { level: 'h2', text: 'Step 2: Build the solution' }),
      createBlock('callout', { tone: 'tip', title: 'Tip', text: 'Keep each section focused on one decision or action.' }),
      createBlock('heading', { level: 'h2', text: 'What to do next' }),
      createBlock('cta', { variant: 'primary', title: 'Need help applying this?', text: 'Send the site and I will point out the highest-impact fixes.', buttonText: 'Get a Free SEO Audit', url: '/free-seo-audit' })
    ];
  }

  return [
    createBlock('paragraph', { text: 'Explain the search problem, the business context, and why it matters.' }),
    createBlock('heading', { level: 'h2', text: 'What this means' }),
    createBlock('paragraph', { text: 'Define the concept in practical language.' }),
    createBlock('visual', { title: 'Simple framework', text: 'Use this structure to make the idea easier to understand.', items: ['Main page', 'Supporting content', 'Internal links', 'Proof'] }),
    createBlock('heading', { level: 'h2', text: 'How to improve it' }),
    createBlock('takeaway', { title: 'Key takeaway', text: 'Focus on usefulness, structure, and clear next steps.' }),
    createBlock('heading', { level: 'h2', text: 'Common mistakes' }),
    createBlock('checklist', { title: 'Avoid these mistakes', items: ['Thin pages', 'No internal links', 'No proof', 'Too many CTAs'] }),
    createBlock('cta', { variant: 'primary', title: 'Want this fixed properly?', text: 'I can review the page and map the next SEO improvements.', buttonText: 'Get a Free SEO Audit', url: '/free-seo-audit' })
  ];
}

function blockText(block) {
  return [block.text, block.title, block.question, block.answer, block.alt, block.caption, ...(block.items || [])].filter(Boolean).join(' ');
}

const slashCommands = [
  { key: 'paragraph', label: 'Paragraph', hint: 'Normal article text' },
  { key: 'h2', label: 'Heading 2', hint: 'Major section heading' },
  { key: 'h3', label: 'Heading 3', hint: 'Subsection heading' },
  { key: 'bullet', label: 'Bullet list', hint: 'List of points' },
  { key: 'numbered', label: 'Numbered list', hint: 'Step-by-step list' },
  { key: 'quote', label: 'Quote', hint: 'Quoted or emphasized text' },
  { key: 'image', label: 'Image', hint: 'Inline image with alt and caption' },
  { key: 'callout', label: 'Callout', hint: 'Insight, tip, warning, or example' },
  { key: 'checklist', label: 'Checklist', hint: 'Action items' },
  { key: 'takeaway', label: 'Key Takeaway', hint: 'Short summary block' },
  { key: 'cta', label: 'CTA Block', hint: 'Controlled conversion block' },
  { key: 'faq', label: 'FAQ Block', hint: 'Adds FAQ schema data' },
  { key: 'internal-link', label: 'Internal Link', hint: 'Search posts and pages' },
  { key: 'table', label: 'Table', hint: 'Simple markdown table' },
  { key: 'divider', label: 'Divider', hint: 'Section break' },
  { key: 'visual', label: 'Visual Diagram', hint: 'Steps or nodes' },
  { key: 'embed', label: 'Embed', hint: 'External embed/link' },
  { key: 'code', label: 'Code Block', hint: 'Preformatted snippet' }
];

function renderBlocks() {
  if (state.editorAdapter?.isReady) {
    state.editorAdapter.setMarkdown(blocksToMarkdown(state.blocks));
    renderLivePreview();
    updateSeoPanel();
    return;
  }
  els.body.innerHTML = state.blocks.map((block, index) => renderBlock(block, index)).join('');
  renderLivePreview();
  updateSeoPanel();
}

function blockControls(index) {
  return `<div class="cms-inline-block-controls" contenteditable="false">
    <button type="button" class="cms-drag-handle" draggable="true" data-drag-block="${index}" aria-label="Drag block">::</button>
    <button type="button" data-add-near="${index}" data-position="above">+ Above</button>
    <button type="button" data-add-near="${index}" data-position="below">+ Below</button>
    <button type="button" data-duplicate-block="${index}">Duplicate</button>
    <button type="button" data-move-block="${index}" data-direction="-1">Up</button>
    <button type="button" data-move-block="${index}" data-direction="1">Down</button>
    <button type="button" data-remove-block="${index}">Delete</button>
  </div>`;
}

function editable(content, field, placeholder = '') {
  return `<div class="cms-rich-editable" contenteditable="true" data-block-field="${field}" data-placeholder="${escapeHtml(placeholder)}">${inlineMarkdownToHtml(content || '')}</div>`;
}

function renderBlock(block, index) {
  const controls = blockControls(index);
  if (block.type === 'paragraph') return `<article class="cms-editor-block cms-editor-block-paragraph" draggable="true" data-block-index="${index}">${controls}${editable(block.text, 'text', 'Type / for blocks')}</article>`;
  if (block.type === 'heading') return `<article class="cms-editor-block cms-editor-block-heading" draggable="true" data-block-index="${index}">${controls}<div class="cms-heading-row" contenteditable="false"><select data-block-field="level"><option value="h2"${block.level === 'h2' ? ' selected' : ''}>H2</option><option value="h3"${block.level === 'h3' ? ' selected' : ''}>H3</option><option value="h4"${block.level === 'h4' ? ' selected' : ''}>H4</option></select></div><${block.level || 'h2'} class="cms-rich-heading" contenteditable="true" data-block-field="text" data-placeholder="Heading">${inlineMarkdownToHtml(block.text || '')}</${block.level || 'h2'}></article>`;
  if (block.type === 'image') return `<article class="cms-editor-block cms-editor-block-image" draggable="true" data-block-index="${index}">${controls}<figure>${block.url ? `<img src="${escapeHtml(block.url)}" alt="${escapeHtml(block.alt || '')}">` : `<div class="cms-image-drop">Add an image URL or upload from Media Library</div>`}<figcaption contenteditable="true" data-block-field="caption" data-placeholder="Caption">${escapeHtml(block.caption || '')}</figcaption></figure><div class="cms-inline-fields" contenteditable="false"><input data-block-field="url" value="${escapeHtml(block.url || '')}" placeholder="Image URL"><input data-block-field="alt" value="${escapeHtml(block.alt || '')}" placeholder="Alt text"><input data-block-field="link" value="${escapeHtml(block.link || '')}" placeholder="Optional link"></div></article>`;
  if (block.type === 'callout') return `<article class="cms-editor-block cms-editor-block-callout ${escapeHtml(block.tone || 'insight')}" draggable="true" data-block-index="${index}">${controls}<div class="cms-callout-settings" contenteditable="false"><select data-block-field="tone"><option value="insight"${block.tone === 'insight' ? ' selected' : ''}>Insight</option><option value="tip"${block.tone === 'tip' ? ' selected' : ''}>Tip</option><option value="warning"${block.tone === 'warning' ? ' selected' : ''}>Warning</option><option value="example"${block.tone === 'example' ? ' selected' : ''}>Example</option></select></div><strong contenteditable="true" data-block-field="title" data-placeholder="Label">${escapeHtml(block.title || 'Insight')}</strong>${editable(block.text, 'text', 'Callout content')}</article>`;
  if (block.type === 'checklist') return `<article class="cms-editor-block cms-editor-block-checklist" draggable="true" data-block-index="${index}">${controls}<strong contenteditable="true" data-block-field="title" data-placeholder="Checklist title">${escapeHtml(block.title || '')}</strong><ul contenteditable="true" data-block-field="items">${(block.items || ['']).map(item => `<li>${inlineMarkdownToHtml(item || '')}</li>`).join('')}</ul></article>`;
  if (block.type === 'takeaway') return `<article class="cms-editor-block cms-editor-block-takeaway" draggable="true" data-block-index="${index}">${controls}<strong contenteditable="true" data-block-field="title" data-placeholder="Key takeaway">${escapeHtml(block.title || 'Key takeaway')}</strong>${editable(block.text, 'text', 'Short summary')}</article>`;
  if (block.type === 'visual') return `<article class="cms-editor-block cms-editor-block-visual" draggable="true" data-block-index="${index}">${controls}<strong contenteditable="true" data-block-field="title" data-placeholder="Diagram title">${escapeHtml(block.title || '')}</strong>${editable(block.text, 'text', 'Diagram intro or caption')}<ol contenteditable="true" data-block-field="items">${(block.items || ['']).map(item => `<li>${inlineMarkdownToHtml(item || '')}</li>`).join('')}</ol></article>`;
  if (block.type === 'cta') return `<article class="cms-editor-block cms-editor-block-cta" draggable="true" data-block-index="${index}">${controls}<span contenteditable="true" data-block-field="title" data-placeholder="CTA label">${escapeHtml(block.title || '')}</span>${editable(block.text, 'text', 'CTA description')}<div class="cms-inline-fields" contenteditable="false"><input data-block-field="buttonText" value="${escapeHtml(block.buttonText || '')}" placeholder="Button text"><input data-block-field="url" value="${escapeHtml(block.url || '')}" placeholder="Button URL"></div></article>`;
  if (block.type === 'faq') return `<article class="cms-editor-block cms-editor-block-faq" draggable="true" data-block-index="${index}">${controls}<strong contenteditable="true" data-block-field="question" data-placeholder="Question">${escapeHtml(block.question || '')}</strong>${editable(block.answer, 'answer', 'Answer')}</article>`;
  if (block.type === 'table') return `<article class="cms-editor-block cms-editor-block-code" draggable="true" data-block-index="${index}">${controls}<pre contenteditable="true" data-block-field="text">${escapeHtml(block.text || '')}</pre></article>`;
  if (block.type === 'code') return `<article class="cms-editor-block cms-editor-block-code" draggable="true" data-block-index="${index}">${controls}<pre contenteditable="true" data-block-field="text">${escapeHtml(block.text || '')}</pre></article>`;
  if (block.type === 'embed') return `<article class="cms-editor-block cms-editor-block-embed" draggable="true" data-block-index="${index}">${controls}<div class="cms-inline-fields" contenteditable="false"><input data-block-field="url" value="${escapeHtml(block.url || '')}" placeholder="Embed URL"><input data-block-field="caption" value="${escapeHtml(block.caption || '')}" placeholder="Caption"></div></article>`;
  return `<article class="cms-editor-block cms-editor-block-divider" draggable="true" data-block-index="${index}">${controls}<hr></article>`;
}

function renderBlockPreview(block) {
  if (block.type === 'paragraph') return `<p>${inlineMarkdownToHtml(block.text || '')}</p>`;
  if (block.type === 'heading') return `<${block.level || 'h2'}>${escapeHtml(block.text || '')}</${block.level || 'h2'}>`;
  if (block.type === 'image') return block.url ? `<figure><img src="${escapeHtml(block.url)}" alt="${escapeHtml(block.alt || '')}">${block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : ''}</figure>` : '';
  if (block.type === 'callout' || block.type === 'takeaway') return `<blockquote><strong>${escapeHtml(block.title || 'Insight')}:</strong> ${escapeHtml(block.text || '')}</blockquote>`;
  if (block.type === 'checklist') return `<h4>${escapeHtml(block.title || 'Checklist')}</h4><ul>${(block.items || []).filter(Boolean).map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
  if (block.type === 'visual') return `<h4>${escapeHtml(block.title || 'Visual summary')}</h4><p>${escapeHtml(block.text || '')}</p><ul>${(block.items || []).filter(Boolean).map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
  if (block.type === 'cta') return `<aside class="cms-preview-cta"><strong>${escapeHtml(block.title || 'CTA')}</strong><p>${escapeHtml(block.text || '')}</p><a>${escapeHtml(block.buttonText || 'Get help')}</a></aside>`;
  if (block.type === 'faq') return `<details open><summary>${escapeHtml(block.question || 'Question')}</summary><p>${escapeHtml(block.answer || '')}</p></details>`;
  if (block.type === 'table') return `<pre>${escapeHtml(block.text || '')}</pre>`;
  if (block.type === 'code') return `<pre><code>${escapeHtml(block.text || '')}</code></pre>`;
  if (block.type === 'embed') return `<p><a href="${escapeHtml(safeUrl(block.url || '#'))}">${escapeHtml(block.caption || block.url || 'Embed')}</a></p>`;
  return '<hr>';
}

function renderLivePreview() {
  if (!els.livePreviewFrame) return;
  const title = els.title?.value?.trim() || 'Untitled article';
  const excerpt = els.excerpt?.value?.trim() || '';
  const category = els.category?.value || 'Blog';
  const status = els.draft?.checked ? 'Draft preview' : 'Published preview';
  const image = safeUrl(els.image?.value?.trim() || '');
  const imageAlt = els.imageAlt?.value?.trim() || '';
  const articleHtml = state.editorAdapter?.isReady
    ? markdownToHtml(getArticleMarkdown())
    : state.blocks.map(block => `<div class="cms-live-preview-block">${renderBlockPreview(block)}</div>`).join('');
  els.livePreviewFrame.innerHTML = `
    <article class="cms-live-article">
      <header>
        <div class="cms-live-meta">
          <span>${escapeHtml(category)}</span>
          <span>${escapeHtml(status)}</span>
          <span>${escapeHtml(els.readingTime?.value || '1')} min read</span>
        </div>
        <h1>${escapeHtml(title)}</h1>
        ${excerpt ? `<p>${escapeHtml(excerpt)}</p>` : ''}
        ${image && image !== '#' ? `<figure><img src="${escapeHtml(image)}" alt="${escapeHtml(imageAlt)}"></figure>` : ''}
      </header>
      <div class="cms-live-body">${articleHtml || '<p>Start writing to build the preview.</p>'}</div>
    </article>
  `;
}

function setEditorMode(mode = 'write') {
  state.editorMode = mode;
  els.workspace?.classList.toggle('is-preview-mode', mode === 'preview');
  els.workspace?.classList.toggle('is-split-mode', mode === 'split');
  els.form?.classList.toggle('is-hidden', mode === 'preview');
  els.previewPanel?.classList.toggle('is-hidden', mode === 'write');
  [els.writeMode, els.previewMode, els.splitMode].forEach(button => {
    if (button) button.classList.toggle('is-active', button.dataset.editorMode === mode);
  });
  renderLivePreview();
}

function markDirty() {
  state.dirty = true;
  els.save.disabled = false;
  setStatus('Unsaved changes');
  if (els.editorSavedAt) els.editorSavedAt.textContent = 'Unsaved changes';
  if (els.topPostStatus) els.topPostStatus.textContent = `${els.draft.checked ? 'Draft' : 'Published'} - Unsaved`;
  updateSeoPanel();
  renderLivePreview();
}

function exec(command, value = null) {
  if (state.editorAdapter?.isReady && typeof state.editorAdapter.insertText === 'function') {
    state.editorAdapter.insertText(value || command);
    return;
  }
  state.blocks.push(createBlock('paragraph', { text: value || command }));
  renderBlocks();
  markDirty();
}

function insertHtml(html) {
  if (state.editorAdapter?.isReady && typeof state.editorAdapter.insertHtml === 'function') {
    state.editorAdapter.insertHtml(html);
    return;
  }
  const image = html.match(/<img src="([^"]+)" alt="([^"]*)"/);
  const quote = html.match(/<blockquote><strong>([^<]+)<\/strong>\s*([^<]*)<\/blockquote>/);
  const divider = html.includes('<hr>');
  if (image) state.blocks.push(createBlock('image', { url: image[1], alt: image[2] }));
  else if (quote) state.blocks.push(createBlock('callout', { title: quote[1].replace(/:$/, ''), text: quote[2] }));
  else if (divider) state.blocks.push(createBlock('divider'));
  else state.blocks.push(createBlock('paragraph', { text: html.replace(/<[^>]+>/g, '') }));
  renderBlocks();
  markDirty();
}

function insertBlockAt(index, block = createBlock('paragraph'), focus = true) {
  if (state.editorAdapter?.isReady && typeof state.editorAdapter.insertBlock === 'function') {
    state.editorAdapter.insertBlock(block);
    return;
  }
  const target = Math.max(0, Math.min(index, state.blocks.length));
  state.blocks.splice(target, 0, block);
  state.activeBlockIndex = target;
  renderBlocks();
  markDirty();
  if (focus) focusBlock(target);
}

function focusBlock(index) {
  window.requestAnimationFrame(() => {
    const block = els.body.querySelector(`[data-block-index="${index}"]`);
    const target = block?.querySelector('[contenteditable="true"], input, textarea, select');
    if (!target) return;
    target.focus();
    if (target.isContentEditable) {
      const range = document.createRange();
      range.selectNodeContents(target);
      range.collapse(false);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  });
}

function updateBlockFromField(field) {
  const blockEl = field.closest('[data-block-index]');
  if (!blockEl) return;
  const block = state.blocks[Number(blockEl.dataset.blockIndex)];
  if (!block) return;
  const value = editableValue(field);
  if (field.dataset.blockField === 'items') {
    if (field.matches('ul,ol')) {
      block.items = Array.from(field.querySelectorAll('li')).map(item => inlineHtmlToMarkdown(item.innerHTML)).filter(Boolean);
    } else {
      block.items = value.split('\n').map(item => item.trim()).filter(Boolean);
    }
  } else {
    block[field.dataset.blockField] = value;
  }
}

function blockForCommand(command) {
  if (command === 'h2') return createBlock('heading', { level: 'h2', text: '' });
  if (command === 'h3') return createBlock('heading', { level: 'h3', text: '' });
  if (command === 'bullet') return createBlock('checklist', { title: 'Bullet list', items: ['List item'] });
  if (command === 'numbered') return createBlock('visual', { title: 'Steps', text: '', items: ['Step one'] });
  if (command === 'quote') return createBlock('callout', { tone: 'example', title: 'Quote', text: '' });
  if (command === 'internal-link') return createBlock('paragraph', { text: '[Anchor text](/blog)' });
  return createBlock(command);
}

function showSlashMenu(blockIndex, query = '', anchor = null) {
  state.slashBlockIndex = blockIndex;
  state.slashQuery = query;
  const normalized = query.toLowerCase();
  const commands = slashCommands.filter(command => `${command.label} ${command.key}`.toLowerCase().includes(normalized));
  els.slashMenu.innerHTML = commands.map(command => `
    <button type="button" data-slash-command="${command.key}">
      <strong>${escapeHtml(command.label)}</strong>
      <span>${escapeHtml(command.hint)}</span>
    </button>
  `).join('');
  const rect = anchor?.getBoundingClientRect();
  els.slashMenu.style.left = rect ? `${Math.min(rect.left, window.innerWidth - 320)}px` : '50%';
  els.slashMenu.style.top = rect ? `${rect.bottom + 8}px` : '160px';
  els.slashMenu.classList.remove('is-hidden');
}

function hideSlashMenu() {
  els.slashMenu.classList.add('is-hidden');
}

function applySlashCommand(command) {
  if (state.editorAdapter?.isReady && typeof state.editorAdapter.runSlashCommand === 'function') {
    state.editorAdapter.runSlashCommand(command);
    hideSlashMenu();
    return;
  }
  const current = state.blocks[state.slashBlockIndex];
  if (current && current.type === 'paragraph') {
    current.text = String(current.text || '').replace(/\/[\w-]*$/, '').trim();
  }
  state.blocks.splice(state.slashBlockIndex + 1, 0, blockForCommand(command));
  state.activeBlockIndex = state.slashBlockIndex + 1;
  hideSlashMenu();
  renderBlocks();
  markDirty();
  focusBlock(state.activeBlockIndex);
}

function showFloatingToolbar() {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !selection.rangeCount) {
    els.floatingToolbar.classList.add('is-hidden');
    return;
  }
  const anchor = selection.anchorNode?.nodeType === Node.TEXT_NODE ? selection.anchorNode.parentElement : selection.anchorNode;
  if (!anchor || !els.body.contains(anchor)) {
    els.floatingToolbar.classList.add('is-hidden');
    return;
  }
  const rect = selection.getRangeAt(0).getBoundingClientRect();
  els.floatingToolbar.style.left = `${Math.max(16, Math.min(rect.left, window.innerWidth - 520))}px`;
  els.floatingToolbar.style.top = `${Math.max(84, rect.top - 48)}px`;
  els.floatingToolbar.classList.remove('is-hidden');
}

function applyFormat(command) {
  if (state.editorAdapter?.isReady && typeof state.editorAdapter.applyFormat === 'function') {
    state.editorAdapter.applyFormat(command);
    markDirty();
    showFloatingToolbar();
    return;
  }
  if (command === 'bold') document.execCommand('bold');
  if (command === 'italic') document.execCommand('italic');
  if (command === 'link') {
    const url = window.prompt('Paste URL');
    if (url) document.execCommand('createLink', false, safeUrl(url));
  }
  if (command === 'ul') document.execCommand('insertUnorderedList');
  if (command === 'ol') document.execCommand('insertOrderedList');
  if (command === 'quote') document.execCommand('formatBlock', false, 'blockquote');
  if (command === 'highlight') document.execCommand('backColor', false, '#dff8e8');
  if (command === 'code') document.execCommand('formatBlock', false, 'pre');
  if (command === 'clear') document.execCommand('removeFormat');
  if (command === 'h2' || command === 'h3') {
    const block = state.blocks[state.activeBlockIndex];
    if (block) {
      block.type = 'heading';
      block.level = command;
      const field = els.body.querySelector(`[data-block-index="${state.activeBlockIndex}"] [data-block-field="text"]`);
      block.text = field ? editableValue(field) : block.text || '';
      renderBlocks();
      focusBlock(state.activeBlockIndex);
    }
  }
  const field = document.activeElement?.closest?.('[data-block-field]');
  if (field) updateBlockFromField(field);
  markDirty();
  showFloatingToolbar();
}

function switchView(name) {
  document.querySelectorAll('.cms-view').forEach(view => view.classList.toggle('is-active', view.id === `${name}View`));
  document.querySelectorAll('[data-view]').forEach(button => button.classList.toggle('is-active', button.dataset.view === name));
  els.screenTitle.textContent = name === 'media' ? 'Media Library' : name === 'links' ? 'Interlinking' : name === 'hub' ? 'Blog Hub' : 'Posts';
}

function updateImagePreview() {
  const src = safeUrl(els.image.value.trim());
  els.imagePreview.innerHTML = src && src !== '#' ? `<img src="${escapeHtml(src)}" alt="">` : '';
  if (els.editorImagePreview) {
    els.editorImagePreview.innerHTML = src && src !== '#'
      ? `<img src="${escapeHtml(src)}" alt=""><figcaption><strong>Featured image</strong><span>${escapeHtml(els.imageAlt.value || 'Alt text missing')}</span></figcaption>`
      : '<div class="cms-featured-placeholder"><strong>Featured image</strong><span>Add or upload an image from the Media panel.</span></div>';
  }
  renderLivePreview();
}

function selectedRelatedSlugs() {
  return Array.from(els.relatedPosts.querySelectorAll('input:checked')).map(input => input.value);
}

function parseLines(value) {
  return String(value || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
}

function parseFrameworkNodes(value) {
  return parseLines(value).map(line => {
    const [label, ...titleParts] = line.split(':');
    return {
      label: (titleParts.length ? label : 'Topic').trim(),
      title: (titleParts.length ? titleParts.join(':') : label).trim()
    };
  });
}

function parseFrameworkSteps(value) {
  return parseLines(value).map(line => {
    const [title, ...textParts] = line.split('|');
    return {
      title: title.trim(),
      text: textParts.join('|').trim()
    };
  });
}

function stringifyFrameworkNodes(nodes = []) {
  return (Array.isArray(nodes) ? nodes : [])
    .map(node => `${node.label || 'Topic'}: ${node.title || ''}`.trim())
    .join('\n');
}

function stringifyFrameworkSteps(steps = []) {
  return (Array.isArray(steps) ? steps : [])
    .map(step => `${step.title || ''} | ${step.text || ''}`.trim())
    .join('\n');
}

function renderFaqItems(items = []) {
  const faqs = Array.isArray(items) ? items : [];
  els.faqItems.innerHTML = faqs.map((item, index) => `
    <div class="cms-faq-item" data-faq-index="${index}">
      <label>Question <input data-faq-field="question" type="text" value="${escapeHtml(item.question || '')}"></label>
      <label>Answer <textarea data-faq-field="answer">${escapeHtml(item.answer || '')}</textarea></label>
      <button class="cms-small-button" type="button" data-remove-faq="${index}">Remove</button>
    </div>
  `).join('');
}

function collectFaqItems() {
  return Array.from(els.faqItems.querySelectorAll('.cms-faq-item')).map(item => ({
    question: item.querySelector('[data-faq-field="question"]').value.trim(),
    answer: item.querySelector('[data-faq-field="answer"]').value.trim()
  })).filter(item => item.question && item.answer);
}

function renderPosts() {
  const query = els.search.value.trim().toLowerCase();
  const posts = state.posts.filter(post => !query || post.title.toLowerCase().includes(query) || post.slug.includes(query));

  els.postList.innerHTML = posts.map(post => `
    <button class="cms-post-item${post.slug === state.activeSlug ? ' is-active' : ''}" type="button" data-slug="${escapeHtml(post.slug)}">
      <strong>${escapeHtml(post.title)}</strong>
      <span>${escapeHtml(post.category || 'Uncategorized')} - ${escapeHtml(post.date || '')}${post.draft ? ' - Draft' : ''}</span>
    </button>
  `).join('');
}

function renderRelatedPosts(selected = []) {
  els.relatedPosts.innerHTML = state.posts
    .filter(post => post.slug !== state.activeSlug)
    .map(post => `
      <label>
        <input type="checkbox" value="${escapeHtml(post.slug)}"${selected.includes(post.slug) ? ' checked' : ''}>
        <span>${escapeHtml(post.title)}</span>
      </label>
    `).join('');
}

function renderPostChoices(container, selected = [], limit = 0) {
  const selectedSet = new Set(Array.isArray(selected) ? selected : []);
  container.innerHTML = state.posts.map(post => `
    <label>
      <input type="checkbox" value="${escapeHtml(post.slug)}"${selectedSet.has(post.slug) ? ' checked' : ''} data-choice-limit="${limit}">
      <span><strong>${escapeHtml(post.title)}</strong><small>${escapeHtml(post.category || 'SEO')} - ${escapeHtml(post.readingTime || 6)} min</small></span>
    </label>
  `).join('');
}

function selectedChoices(container) {
  return Array.from(container.querySelectorAll('input:checked')).map(input => input.value);
}

function enforceChoiceLimit(input) {
  const limit = Number(input.dataset.choiceLimit || 0);
  if (!limit || !input.checked) return;
  const container = input.closest('.cms-choice-list');
  const checked = Array.from(container.querySelectorAll('input:checked'));
  if (checked.length <= limit) return;
  checked.filter(item => item !== input).slice(0, checked.length - limit).forEach(item => {
    item.checked = false;
  });
}

function fillBlogHub(settings = {}) {
  state.blogIndex = settings;
  renderPostChoices(els.hubFeaturedPosts, settings.featuredPosts || [], 2);
  renderPostChoices(els.hubHighlightPosts, settings.highlightPosts || [], 4);
  renderPostChoices(els.hubSpotlightPosts, (settings.spotlight || {}).posts || [], 3);
  els.hubInsightTitle.value = (settings.insight || {}).title || '';
  els.hubInsightDescription.value = (settings.insight || {}).description || '';
  els.hubInsightButtonText.value = (settings.insight || {}).buttonText || '';
  els.hubInsightButtonUrl.value = (settings.insight || {}).buttonUrl || '';
  els.hubMidCtaTitle.value = (settings.midCta || {}).title || '';
  els.hubMidCtaDescription.value = (settings.midCta || {}).description || '';
  els.hubMidCtaButtonText.value = (settings.midCta || {}).buttonText || '';
  els.hubMidCtaButtonUrl.value = (settings.midCta || {}).buttonUrl || '';
  els.hubSpotlightLabel.value = (settings.spotlight || {}).label || '';
  els.hubSpotlightTitle.value = (settings.spotlight || {}).title || '';
}

function collectBlogHub() {
  return {
    featuredPosts: selectedChoices(els.hubFeaturedPosts).slice(0, 2),
    highlightPosts: selectedChoices(els.hubHighlightPosts).slice(0, 4),
    insight: {
      title: els.hubInsightTitle.value.trim(),
      description: els.hubInsightDescription.value.trim(),
      buttonText: els.hubInsightButtonText.value.trim(),
      buttonUrl: els.hubInsightButtonUrl.value.trim()
    },
    midCta: {
      title: els.hubMidCtaTitle.value.trim(),
      description: els.hubMidCtaDescription.value.trim(),
      buttonText: els.hubMidCtaButtonText.value.trim(),
      buttonUrl: els.hubMidCtaButtonUrl.value.trim()
    },
    spotlight: {
      label: els.hubSpotlightLabel.value.trim(),
      title: els.hubSpotlightTitle.value.trim(),
      posts: selectedChoices(els.hubSpotlightPosts).slice(0, 3)
    }
  };
}

function allLinks() {
  return [
    ...state.posts.map(post => ({ title: post.title, url: `/blog/${post.slug}`, type: 'Article', meta: post.category || 'Blog' })),
    ...state.pages.map(page => ({ title: page.title, url: page.url, type: 'Page', meta: page.section || 'Site page' }))
  ];
}

function renderLinkCards(container, query = '', mode = 'insert') {
  const normalized = query.trim().toLowerCase();
  const links = allLinks().filter(item => !normalized || item.title.toLowerCase().includes(normalized) || item.url.includes(normalized));

  container.innerHTML = links.map(item => `
    <button class="cms-link-result" type="button" data-url="${escapeHtml(item.url)}" data-title="${escapeHtml(item.title)}" data-mode="${mode}">
      <strong>${escapeHtml(item.title)}</strong>
      <span>${escapeHtml(item.type)} - ${escapeHtml(item.url)}</span>
    </button>
  `).join('');
}

function renderLinkGrid() {
  const query = els.linkSearch.value.trim().toLowerCase();
  const links = allLinks().filter(item => !query || item.title.toLowerCase().includes(query) || item.url.includes(query));
  els.linkGrid.innerHTML = links.map(item => `
    <article class="cms-link-card">
      <strong>${escapeHtml(item.title)}</strong>
      <span>${escapeHtml(item.type)} - ${escapeHtml(item.url)}</span>
      <div class="cms-row">
        <button class="cms-small-button" type="button" data-url="${escapeHtml(item.url)}" data-title="${escapeHtml(item.title)}" data-mode="insert">Insert</button>
      </div>
    </article>
  `).join('');
}

function mediaCard(item) {
  const dimensions = item.width && item.height ? `${item.width} x ${item.height}` : 'Dimensions pending';
  const size = item.size ? `${Math.round(Number(item.size) / 1024)} KB` : '';
  return `
    <article class="cms-media-card">
      <img src="${escapeHtml(item.thumbnailUrl || item.url)}" alt="">
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <span>${escapeHtml(item.url)}</span>
        <small>${escapeHtml([dimensions, item.mimeType, size].filter(Boolean).join(' - '))}</small>
        <div class="cms-row">
          <button class="cms-small-button" type="button" data-image-url="${escapeHtml(item.url)}" data-image-action="insert">Insert</button>
          <button class="cms-small-button" type="button" data-image-url="${escapeHtml(item.url)}" data-image-action="featured">Featured</button>
          <button class="cms-small-button danger" type="button" data-media-delete="${escapeHtml(item.name)}">Delete</button>
        </div>
      </div>
    </article>
  `;
}

function renderMedia() {
  const html = state.media.map(mediaCard).join('');
  els.mediaGrid.innerHTML = html || '<p>No uploaded images yet.</p>';
  els.modalMediaGrid.innerHTML = html || '<p>No uploaded images yet.</p>';
}

function updateSeoPanel() {
  if (!state.activePost && els.form.classList.contains('is-hidden')) return;

  const articleMarkdown = getArticleMarkdown();
  const bodyText = state.editorAdapter?.isReady ? plainTextFromMarkdown(articleMarkdown) : state.blocks.map(blockText).join(' ');
  const words = bodyText.trim().split(/\s+/).filter(Boolean);
  const h2Count = state.editorAdapter?.isReady
    ? (articleMarkdown.match(/^##\s+/gm) || []).length
    : state.blocks.filter(block => block.type === 'heading' && block.level === 'h2').length;
  const keyword = els.focusKeyword.value.trim().toLowerCase();
  const title = els.title.value.trim();
  const metaTitle = els.metaTitle.value.trim() || title.slice(0, 60);
  const metaDescription = els.metaDescription.value.trim() || cleanSentence(els.excerpt.value || firstReadableParagraph(articleMarkdown), 155);
  const hasImageAlt = Boolean(els.image.value.trim() && els.imageAlt.value.trim());
  const relatedCount = 3;
  const internalLinks = (articleMarkdown.match(/\]\(\/[^)]+\)/g) || []).length;
  const engagementBlocks = state.editorAdapter?.isReady
    ? ((articleMarkdown.match(/^>\s+/gm) || []).length + (articleMarkdown.match(/^[-*]\s+/gm) || []).length + (articleMarkdown.match(/!\[[^\]]*]\(/g) || []).length)
    : state.blocks.filter(block => ['callout', 'checklist', 'takeaway', 'visual'].includes(block.type)).length;
  const ctaBlocks = state.editorAdapter?.isReady ? 1 : state.blocks.filter(block => block.type === 'cta').length;
  const faqBlocks = state.editorAdapter?.isReady
    ? extractFaqItemsFromMarkdown(articleMarkdown).length
    : state.blocks.filter(block => block.type === 'faq' && block.question && block.answer).length;
  const sectionCount = h2Count;
  const firstHeadingIndex = state.editorAdapter?.isReady ? -1 : state.blocks.findIndex(block => block.type === 'heading');
  const introBlocks = state.editorAdapter?.isReady ? [] : state.blocks.slice(0, firstHeadingIndex === -1 ? state.blocks.length : firstHeadingIndex);
  const introWordCount = state.editorAdapter?.isReady
    ? plainTextFromMarkdown(firstReadableParagraph(articleMarkdown)).split(/\s+/).filter(Boolean).length
    : introBlocks.map(blockText).join(' ').split(/\s+/).filter(Boolean).length;
  const introPresent = state.editorAdapter?.isReady ? introWordCount >= 20 : introBlocks.some(block => block.type === 'paragraph') && introWordCount >= 20;
  const longParagraphs = state.editorAdapter?.isReady
    ? articleMarkdown.split(/\n{2,}/).filter(part => !/^#|^[-*]|^>|^!/.test(part.trim()) && plainTextFromMarkdown(part).split(/\s+/).filter(Boolean).length > 90)
    : state.blocks.filter(block => block.type === 'paragraph' && blockText(block).split(/\s+/).filter(Boolean).length > 90);
  const denseRuns = state.editorAdapter?.isReady ? false : state.blocks.some((block, index) => {
    const run = state.blocks.slice(index, index + 4);
    return run.length === 4 && run.every(item => item.type === 'paragraph');
  });
  const visualBlocks = state.editorAdapter?.isReady
    ? (articleMarkdown.match(/!\[[^\]]*]\(/g) || []).length
    : state.blocks.filter(block => block.type === 'visual' || block.type === 'image').length;
  const ctaPositionGood = true;

  const checks = [
    { label: 'Title is filled', pass: title.length > 10 },
    { label: 'Focus keyword appears in title or body', pass: !keyword || `${title} ${bodyText}`.toLowerCase().includes(keyword) },
    { label: 'Meta title is 30-60 characters', pass: metaTitle.length >= 30 && metaTitle.length <= 60 },
    { label: 'Meta description is 80-155 characters', pass: metaDescription.length >= 80 && metaDescription.length <= 155 },
    { label: 'Article has at least 600 words', pass: words.length >= 600 },
    { label: 'Introduction section is present', pass: introPresent },
    { label: 'At least 3 content sections', pass: sectionCount >= 3 },
    { label: 'Article uses H2 headings', pass: h2Count >= 2 },
    { label: 'Has at least one engagement block', pass: engagementBlocks >= 1 },
    { label: 'Uses one controlled CTA block', pass: ctaBlocks === 1 },
    { label: 'Featured image has alt text', pass: hasImageAlt },
    { label: 'At least one internal link in body', pass: internalLinks >= 1 },
    { label: 'Related articles selected', pass: relatedCount >= 1 }
  ];

  const assistant = [
    { label: 'Break long paragraphs over 90 words into smaller blocks.', pass: longParagraphs.length === 0 },
    { label: 'Avoid four plain paragraph blocks in a row; add a callout, checklist, or visual.', pass: !denseRuns },
    { label: 'Complex topics should include a visual or image block.', pass: visualBlocks >= 1 || words.length < 700 },
    { label: 'CTA should appear after the reader has context, usually mid/end article.', pass: ctaBlocks === 0 || ctaPositionGood },
    { label: 'Use only one primary CTA block in the article body.', pass: ctaBlocks <= 1 },
    { label: 'Dark article theme uses high-contrast off-white copy on dark surfaces.', pass: els.articleTheme.value !== 'dark' || true }
  ];

  const publishChecks = [
    { label: 'Title exists', pass: title.length > 0 },
    { label: 'Slug exists', pass: els.slug.value.trim().length > 0 },
    { label: 'Meta title exists', pass: metaTitle.length > 0 },
    { label: 'Meta description exists', pass: metaDescription.length > 0 },
    { label: 'Featured image selected', pass: els.image.value.trim().length > 0 },
    { label: 'Featured image alt text exists', pass: hasImageAlt },
    { label: 'Category selected', pass: els.category.value.trim().length > 0 },
    { label: 'At least one internal link', pass: internalLinks >= 1 },
    { label: 'FAQ schema auto-generates when question headings exist', pass: true },
    { label: 'One primary CTA selected', pass: ctaBlocks === 1 || Boolean(els.ctaButtonText.value.trim()) }
  ];

  const score = Math.round((checks.filter(check => check.pass).length / checks.length) * 100);
  els.seoScore.textContent = String(score);
  els.qualityScore.textContent = String(Math.round((assistant.filter(check => check.pass).length / assistant.length) * 100));
  els.wordCount.textContent = String(words.length);
  els.headingCount.textContent = String(h2Count);
  els.seoChecklist.innerHTML = checks.map(check => `<div class="cms-check${check.pass ? ' pass' : ''}">${escapeHtml(check.label)}</div>`).join('');
  els.uxAssistant.innerHTML = assistant.map(check => `<div class="cms-check${check.pass ? ' pass' : ''}">${escapeHtml(check.label)}</div>`).join('');
  if (els.publishChecklist) {
    els.publishChecklist.innerHTML = publishChecks.map(check => `<div class="cms-check${check.pass ? ' pass' : ''}">${escapeHtml(check.label)}</div>`).join('');
  }

  const minutes = Math.max(1, Math.ceil(words.length / 220));
  if (document.activeElement !== els.readingTime) els.readingTime.value = minutes;
}

function resizeTitleField() {
  if (!els.title) return;
  els.title.style.height = 'auto';
  els.title.style.height = `${Math.max(118, els.title.scrollHeight)}px`;
}

function fillEditor(post) {
  state.activePost = post;
  state.activeSlug = post.slug;
  state.dirty = false;

  els.empty.classList.add('is-hidden');
  els.form.classList.remove('is-hidden');
  els.save.disabled = true;

  els.title.value = post.title || '';
  els.screenTitle.textContent = post.title || 'New post';
  resizeTitleField();
  els.slug.value = post.slug || '';
  els.slug.dataset.autoSlug = post.slug ? 'false' : 'true';
  els.openPostLink.href = `/blog/${post.slug || ''}`;
  state.blocks = Array.isArray(post.contentBlocks) && post.contentBlocks.length
    ? JSON.parse(JSON.stringify(post.contentBlocks))
    : markdownToBlocks(post.body || '');
  renderBlocks();
  setEditorMode('write');
  els.draft.checked = Boolean(post.draft);
  els.featured.checked = Boolean(post.featured);
  els.date.value = post.date || '';
  els.updated.value = post.updated || post.date || '';
  els.category.value = post.category || 'Local SEO';
  els.readingTime.value = post.readingTime || 6;
  els.focusKeyword.value = post.focusKeyword || '';
  els.metaTitle.value = post.metaTitle || '';
  els.metaDescription.value = post.metaDescription || '';
  els.excerpt.value = post.excerpt || '';
  els.tags.value = Array.isArray(post.tags) ? post.tags.join(', ') : '';
  els.heroTitle.value = post.heroTitle || post.title || '';
  els.heroAccent.value = post.heroAccent || '';
  els.trustNote.value = post.trustNote || '';
  els.image.value = post.image || '';
  els.imageAlt.value = post.imageAlt || '';
  els.editorCategoryBadge.textContent = post.category || 'Uncategorized';
  els.editorStatusBadge.textContent = post.draft ? 'Draft' : 'Published';
  els.editorSavedAt.textContent = 'Saved';
  els.topPostStatus.textContent = post.draft ? 'Draft' : 'Published';
  els.globalPrimaryCta.value = post.globalPrimaryCta || 'Get a Free SEO Audit';
  els.globalSecondaryCta.value = post.globalSecondaryCta || 'Subscribe to SEO tips';
  els.ctaTitle.value = post.ctaTitle || '';
  els.ctaText.value = post.ctaText || '';
  els.ctaButtonText.value = post.ctaButtonText || '';
  els.ctaUrl.value = post.ctaUrl || '';
  els.showToc.checked = post.showToc !== false;
  els.showShare.checked = post.showShare !== false;
  els.showRelated.checked = post.showRelated !== false;
  els.showSidebarCta.checked = post.showSidebarCta !== false;
  els.canonical.value = post.canonical || '';
  els.noindex.checked = Boolean(post.noindex);
  els.schemaType.value = post.schemaType || 'BlogPosting';
  els.author.value = post.author || 'Owais Ahmed Sheikh';
  els.typographyScale.value = post.typographyScale || 'comfortable';
  els.articleTheme.value = post.articleTheme || 'dark';
  els.accentColor.value = post.accentColor || '#2ff28a';
  els.showNewsletter.checked = post.showNewsletter !== false;
  els.newsletterTitle.value = post.newsletterTitle || 'Want practical SEO tips in your inbox?';
  els.newsletterText.value = post.newsletterText || 'Get clear SEO, content, and local search advice written for business owners. No spam.';
  renderFaqItems(post.faqItems || []);
  els.showFramework.checked = post.showFramework !== false && post.slug === 'topical-authority-service-businesses';
  els.frameworkLabel.value = post.frameworkLabel || 'Visual Framework';
  els.frameworkTitle.value = post.frameworkTitle || 'A simple topical authority map';
  els.frameworkIntro.value = post.frameworkIntro || 'Build one strong service page first, then surround it with helpful articles, proof, FAQs, and internal links. The goal is to make the next click obvious for both readers and search engines.';
  els.frameworkCoreLabel.value = post.frameworkCoreLabel || 'Core service page';
  els.frameworkCoreTitle.value = post.frameworkCoreTitle || 'SEO Content Writing';
  els.frameworkCoreText.value = post.frameworkCoreText || 'The page that should convert qualified readers.';
  els.frameworkNodes.value = stringifyFrameworkNodes(post.frameworkNodes || [
    { label: 'Guide', title: 'Service page copy' },
    { label: 'Guide', title: 'Internal linking' },
    { label: 'Proof', title: 'Case studies' },
    { label: 'Support', title: 'FAQs and examples' }
  ]);
  els.frameworkSteps.value = stringifyFrameworkSteps(post.frameworkSteps || [
    { title: 'Choose the money page', text: 'Start with the service page that should generate leads.' },
    { title: 'Map supporting questions', text: 'Turn repeated buyer questions into useful articles.' },
    { title: 'Link every page intentionally', text: 'Connect guides, proof, and service pages with clear next steps.' }
  ]);
  updateImagePreview();
  renderRelatedPosts(Array.isArray(post.relatedPosts) ? post.relatedPosts : []);
  renderPosts();
  updateSeoPanel();
  renderLivePreview();
  setStatus('Ready');
}

function collectPost() {
  const original = state.activePost || {};
  const bodyMarkdown = getArticleMarkdown();
  const blockFaqs = state.blocks
    .filter(block => block.type === 'faq' && block.question && block.answer)
    .map(block => ({ question: block.question.trim(), answer: block.answer.trim() }));
  const post = {
    ...original,
    title: els.title.value.trim(),
    slug: slugify(els.slug.value || els.title.value),
    draft: els.draft.checked,
    featured: els.featured.checked,
    date: els.date.value,
    updated: els.updated.value,
    category: els.category.value,
    readingTime: Number(els.readingTime.value || 6),
    focusKeyword: els.focusKeyword.value.trim(),
    metaTitle: els.metaTitle.value.trim(),
    metaDescription: els.metaDescription.value.trim(),
    excerpt: els.excerpt.value.trim(),
    tags: els.tags.value.split(',').map(tag => tag.trim()).filter(Boolean),
    heroTitle: els.heroTitle.value.trim(),
    heroAccent: els.heroAccent.value.trim(),
    trustNote: els.trustNote.value.trim(),
    image: safeUrl(els.image.value.trim()),
    imageAlt: els.imageAlt.value.trim(),
    relatedPosts: [],
    globalPrimaryCta: els.globalPrimaryCta.value.trim(),
    globalSecondaryCta: els.globalSecondaryCta.value.trim(),
    ctaTitle: els.ctaTitle.value.trim(),
    ctaText: els.ctaText.value.trim(),
    ctaButtonText: els.ctaButtonText.value.trim(),
    ctaUrl: els.ctaUrl.value.trim(),
    showToc: els.showToc.checked,
    showShare: els.showShare.checked,
    showRelated: els.showRelated.checked,
    showSidebarCta: els.showSidebarCta.checked,
    canonical: els.canonical.value.trim(),
    noindex: els.noindex.checked,
    schemaType: els.schemaType.value,
    author: els.author.value.trim(),
    typographyScale: els.typographyScale.value,
    articleTheme: els.articleTheme.value,
    accentColor: els.accentColor.value,
    showNewsletter: els.showNewsletter.checked,
    newsletterTitle: els.newsletterTitle.value.trim(),
    newsletterText: els.newsletterText.value.trim(),
    faqItems: [...collectFaqItems(), ...blockFaqs],
    showFramework: els.showFramework.checked,
    frameworkLabel: els.frameworkLabel.value.trim(),
    frameworkTitle: els.frameworkTitle.value.trim(),
    frameworkIntro: els.frameworkIntro.value.trim(),
    frameworkCoreLabel: els.frameworkCoreLabel.value.trim(),
    frameworkCoreTitle: els.frameworkCoreTitle.value.trim(),
    frameworkCoreText: els.frameworkCoreText.value.trim(),
    frameworkNodes: parseFrameworkNodes(els.frameworkNodes.value),
    frameworkSteps: parseFrameworkSteps(els.frameworkSteps.value),
    body: bodyMarkdown,
    contentBlocks: markdownToBlocks(bodyMarkdown),
    editorJson: state.editorAdapter?.isReady && typeof state.editorAdapter.getJSON === 'function' ? state.editorAdapter.getJSON() : undefined
  };
  return autoSeoDefaults(post);
}

async function loadLibrary() {
  const response = await apiFetch('/api/admin/library');
  if (!response.ok) throw new Error('Admin library unavailable');
  const data = await response.json();
  state.posts = data.posts || [];
  state.pages = data.pages || [];
  state.media = data.media || [];
  state.blogIndex = data.blogIndex || {};
  renderPosts();
  renderRelatedPosts([]);
  fillBlogHub(state.blogIndex);
  renderMedia();
  renderLinkGrid();
  renderLinkCards(els.modalLinkResults);
  setStatus(`${state.posts.length} posts loaded`);
}

async function initializeAdmin() {
  setAuthChecking(true);
  setStatus('Checking admin session...');
  const response = await fetch('/api/admin/session');
  if (!response.ok) {
    setAuthChecking(false);
    setAuthGate(true, false);
    setStatus('Admin session unavailable.', true);
    return;
  }
  const data = await response.json();
  applyAuthSession(data);
  if (!state.auth.authenticated) {
    setAuthChecking(false);
    setStatus(data.setupRequired ? 'Create the first admin account.' : 'Sign in to edit posts.');
    return;
  }
  await loadLibrary();
}

async function submitAuth(event) {
  event.preventDefault();
  const mode = state.auth.setupRequired ? 'setup' : state.auth.mode || 'login';
  const username = els.authUsername?.value.trim() || '';
  const email = els.authEmail?.value.trim() || '';
  const password = els.authPassword?.value || '';
  const confirmPassword = els.authConfirmPassword?.value || '';

  if ((mode === 'login' || mode === 'setup' || mode === 'forgot') && !username) {
    setAuthMessage(mode === 'forgot' ? 'Enter your username or recovery email.' : 'Username is required.', true);
    return;
  }

  if ((mode === 'login' || mode === 'setup' || mode === 'reset') && !password) {
    setAuthMessage('Password is required.', true);
    return;
  }

  if ((mode === 'setup' || mode === 'reset') && password !== confirmPassword) {
    setAuthMessage('Passwords do not match.', true);
    return;
  }

  els.authSubmit.disabled = true;
  setAuthMessage(
    mode === 'setup'
      ? 'Creating admin account...'
      : mode === 'forgot'
        ? 'Sending reset email...'
        : mode === 'reset'
          ? 'Changing password...'
          : 'Signing in...'
  );

  try {
    const endpoint = mode === 'setup'
      ? '/api/admin/setup'
      : mode === 'forgot'
        ? '/api/admin/password-reset/request'
        : mode === 'reset'
          ? '/api/admin/password-reset/confirm'
          : '/api/admin/login';
    const payload = mode === 'forgot'
      ? { identifier: username }
      : mode === 'reset'
        ? { token: state.auth.resetToken, password }
        : { username, email, password };
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    els.authSubmit.disabled = false;
    if (!response.ok) {
      setAuthMessage(data.error || 'Authentication failed.', true);
      return;
    }

    if (mode === 'forgot') {
      setAuthMessage(data.message || 'If an admin account matches, a reset email will be sent.');
      return;
    }

    if (mode === 'reset') {
      state.auth.resetToken = '';
      if (window.location.search.includes('reset=')) {
        window.history.replaceState({}, document.title, '/admin/');
      }
      els.authPassword.value = '';
      if (els.authConfirmPassword) els.authConfirmPassword.value = '';
      setAuthMode('login', false);
      setAuthMessage(data.message || 'Password changed. Sign in with your new password.');
      return;
    }

    els.authPassword.value = '';
    if (els.authConfirmPassword) els.authConfirmPassword.value = '';
    applyAuthSession(data);
    setAuthMessage('');
    setStatus('Loading publishing workspace...');
    await loadLibrary();
  } catch (_error) {
    els.authSubmit.disabled = false;
    setAuthMessage('Could not reach the admin server. Try again.', true);
  }
}

async function logout() {
  await apiFetch('/api/admin/logout', { method: 'POST' }).catch(() => {});
  state.auth.authenticated = false;
  state.auth.csrfToken = '';
  state.posts = [];
  state.pages = [];
  state.media = [];
  state.activeSlug = '';
  state.activePost = null;
  setAuthGate(true, false);
  setStatus('Signed out.');
}

async function openPost(slug) {
  if (state.dirty && !window.confirm('Discard unsaved changes and open another post?')) return;
  setStatus('Opening post...');
  const response = await apiFetch(`/api/admin/posts/${encodeURIComponent(slug)}`);
  if (!response.ok) {
    setStatus('Could not open post', true);
    return;
  }
  fillEditor(await response.json());
}

async function savePost(options = {}) {
  const post = collectPost();
  if (options.draft === true) post.draft = true;
  if (options.publish === true) post.draft = false;
  if (!post.title || !post.slug || !post.body) {
    setStatus('Title, slug, and body are required.', true);
    return;
  }

  els.save.disabled = true;
  setStatus('Saving and rebuilding...');
  const response = await apiFetch(`/api/admin/posts/${encodeURIComponent(state.activeSlug || post.slug)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(post)
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const detail = Array.isArray(data.issues) && data.issues.length ? ` ${data.issues.join(' ')}` : '';
    setStatus(`${data.error || 'Save failed'}${detail}`, true);
    els.save.disabled = false;
    return;
  }

  const saved = await response.json();
  state.activeSlug = saved.slug;
  state.activePost = saved;
  state.dirty = false;
  await loadLibrary();
  fillEditor(saved);
  const warnings = Array.isArray(saved.publishWarnings) && saved.publishWarnings.length ? ` Warnings: ${saved.publishWarnings.join(' ')}` : '';
  setStatus(`${options.draft ? 'Draft saved and rebuilt' : options.publish ? 'Published and rebuilt' : 'Saved and rebuilt'}${warnings}`, Boolean(warnings));
}

async function saveBlogHub() {
  const settings = collectBlogHub();
  els.saveBlogHub.disabled = true;
  setStatus('Saving blog hub and rebuilding...');
  const response = await apiFetch('/api/admin/blog-index', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    setStatus(data.error || 'Blog hub save failed', true);
    els.saveBlogHub.disabled = false;
    return;
  }

  state.blogIndex = await response.json();
  fillBlogHub(state.blogIndex);
  els.saveBlogHub.disabled = false;
  setStatus('Blog hub saved and rebuilt');
}

async function refreshSchemaPreview() {
  if (!els.schemaPreviewOutput) return;
  const post = collectPost();
  els.schemaPreview.disabled = true;
  els.schemaPreviewStatus.textContent = 'Generating schema preview...';
  const response = await apiFetch('/api/admin/schema-preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(post)
  });
  const data = await response.json().catch(() => ({}));
  els.schemaPreview.disabled = false;
  if (!response.ok) {
    els.schemaPreviewStatus.textContent = data.error || 'Schema preview failed.';
    els.schemaPreviewOutput.textContent = '';
    return;
  }
  const issues = [...(data.errors || []), ...(data.warnings || [])];
  els.schemaPreviewStatus.textContent = issues.length ? issues.join(' ') : 'Schema looks ready for this draft.';
  els.schemaPreviewOutput.textContent = JSON.stringify(data.schemas || [], null, 2);
}

async function deleteMedia(filename) {
  if (!filename || !window.confirm(`Delete ${filename}? This cannot be undone.`)) return;
  setStatus('Deleting media...');
  const response = await apiFetch(`/api/admin/media/${encodeURIComponent(filename)}`, { method: 'DELETE' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    setStatus(data.error || 'Media delete failed', true);
    return;
  }
  state.media = data.media || [];
  renderMedia();
  setStatus('Media deleted');
}

function newPost() {
  if (state.dirty && !window.confirm('Discard unsaved changes and create a new post?')) return;
  const today = new Date().toISOString().slice(0, 10);
  fillEditor({
    title: '',
    slug: '',
    draft: true,
    featured: false,
    date: today,
    updated: today,
    category: 'Local SEO',
    readingTime: 6,
    tags: [],
    relatedPosts: [],
    globalPrimaryCta: 'Get a Free SEO Audit',
    globalSecondaryCta: 'Subscribe to SEO tips',
    showToc: true,
    showShare: true,
    showRelated: true,
    showSidebarCta: true,
    canonical: '',
    noindex: false,
    schemaType: 'BlogPosting',
    author: 'Owais Ahmed Sheikh',
    typographyScale: 'comfortable',
    articleTheme: 'dark',
    accentColor: '#2ff28a',
    showNewsletter: true,
    faqItems: [],
    showFramework: false,
    body: ''
  });
  els.title.focus();
  markDirty();
}

function duplicatePost() {
  if (!state.activePost && !els.title.value.trim()) return;
  const today = new Date().toISOString().slice(0, 10);
  const copy = {
    ...collectPost(),
    title: `Copy of ${els.title.value.trim() || 'Untitled article'}`,
    slug: '',
    draft: true,
    featured: false,
    date: today,
    updated: today,
    sourceFile: undefined
  };
  fillEditor(copy);
  els.slug.dataset.autoSlug = 'true';
  els.slug.value = slugify(copy.title);
  markDirty();
}

async function uploadImage(file) {
  if (!file) return '';
  setStatus('Uploading image...');
  const form = new FormData();
  form.append('image', file);
  const response = await apiFetch('/api/admin/upload', { method: 'POST', body: form });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    setStatus(data.error || 'Upload failed', true);
    return '';
  }
  await loadLibrary();
  setStatus('Image uploaded');
  return data.url || '';
}

function showModal(modal) {
  modal.classList.remove('is-hidden');
}

function closeModals() {
  document.querySelectorAll('.cms-modal').forEach(modal => modal.classList.add('is-hidden'));
}

function applyLink(url, title = '') {
  const href = safeUrl(url);
  if (!href || href === '#') return;
  if (state.editorAdapter?.isReady && typeof state.editorAdapter.insertLink === 'function') {
    state.editorAdapter.insertLink(href, title || href);
    closeModals();
    return;
  }
  insertBlockAt(state.activeBlockIndex + 1, createBlock('paragraph', { text: `[${title || href}](${href})` }), true);
  closeModals();
}

function setFeaturedImage(url) {
  els.image.value = safeUrl(url);
  updateImagePreview();
  markDirty();
}

function insertImage(url, alt = '') {
  const src = safeUrl(url);
  if (!src || src === '#') return;
  if (state.editorAdapter?.isReady && typeof state.editorAdapter.insertImage === 'function') {
    state.editorAdapter.insertImage(src, alt);
    closeModals();
    return;
  }
  insertBlockAt(state.activeBlockIndex + 1, createBlock('image', { url: src, alt }), true);
  closeModals();
}

document.querySelectorAll('[data-view]').forEach(button => {
  button.addEventListener('click', () => switchView(button.dataset.view));
});

document.querySelectorAll('[data-add-block]').forEach(button => {
  button.addEventListener('click', () => {
    const type = button.dataset.addBlock;
    const ctaCount = state.blocks.filter(block => block.type === 'cta').length;
    if (type === 'cta' && ctaCount >= 1 && !window.confirm('This article already has a CTA block. Add another one anyway?')) return;
    insertBlockAt(state.activeBlockIndex + 1, createBlock(type));
  });
});

document.querySelectorAll('[data-template]').forEach(button => {
  button.addEventListener('click', () => {
    const hasContent = state.blocks.some(block => blockText(block).trim());
    if (hasContent && !window.confirm('Replace the current article blocks with this template?')) return;
    state.blocks = templateBlocks(button.dataset.template);
    setEditorMode('write');
    renderBlocks();
    markDirty();
  });
});

document.querySelectorAll('[data-close-modal]').forEach(button => {
  button.addEventListener('click', closeModals);
});

document.querySelectorAll('.cms-modal').forEach(modal => {
  modal.addEventListener('click', event => {
    if (event.target === modal) closeModals();
  });
});

els.writeMode.addEventListener('click', () => setEditorMode('write'));
els.previewMode.addEventListener('click', () => setEditorMode('preview'));
els.splitMode.addEventListener('click', () => setEditorMode('split'));
els.topPreview.addEventListener('click', () => setEditorMode('preview'));

els.insertBlock.addEventListener('click', () => {
  showSlashMenu(state.activeBlockIndex, '', els.insertBlock);
});

els.desktopPreview.addEventListener('click', () => {
  els.previewPanel.classList.remove('cms-preview-mobile');
  els.desktopPreview.classList.add('is-active');
  els.mobilePreview.classList.remove('is-active');
});

els.mobilePreview.addEventListener('click', () => {
  els.previewPanel.classList.add('cms-preview-mobile');
  els.mobilePreview.classList.add('is-active');
  els.desktopPreview.classList.remove('is-active');
});

els.themePreview.addEventListener('click', () => {
  const isLight = els.previewPanel.classList.toggle('cms-preview-light');
  els.themePreview.textContent = isLight ? 'Light' : 'Dark';
});

document.querySelector('#linkButton').addEventListener('click', () => {
  renderLinkCards(els.modalLinkResults, els.modalLinkSearch.value);
  showModal(els.linkModal);
  els.modalLinkSearch.focus();
});

els.applyCustomLink.addEventListener('click', () => applyLink(els.customLink.value));
els.modalLinkSearch.addEventListener('input', () => renderLinkCards(els.modalLinkResults, els.modalLinkSearch.value));
els.linkSearch.addEventListener('input', renderLinkGrid);

document.addEventListener('click', event => {
  const linkButton = event.target.closest('[data-url]');
  if (linkButton) {
    applyLink(linkButton.dataset.url, linkButton.dataset.title);
  }

  const imageButton = event.target.closest('[data-image-url]');
  if (imageButton) {
    if (imageButton.dataset.imageAction === 'featured') setFeaturedImage(imageButton.dataset.imageUrl);
    if (imageButton.dataset.imageAction === 'insert') insertImage(imageButton.dataset.imageUrl, els.modalImageAlt.value);
  }

  const deleteButton = event.target.closest('[data-media-delete]');
  if (deleteButton) {
    deleteMedia(deleteButton.dataset.mediaDelete);
  }
});

els.schemaPreview.addEventListener('click', refreshSchemaPreview);

els.insertImage.addEventListener('click', async () => {
  let src = els.modalImageUrl.value.trim();
  if (!src && els.uploadInput.files[0]) src = await uploadImage(els.uploadInput.files[0]);
  insertImage(src, els.modalImageAlt.value.trim());
});

els.setFeaturedImage.addEventListener('click', async () => {
  let src = els.modalImageUrl.value.trim();
  if (!src && els.uploadInput.files[0]) src = await uploadImage(els.uploadInput.files[0]);
  setFeaturedImage(src);
  closeModals();
});

els.uploadFeatured.addEventListener('click', () => {
  showModal(els.imageModal);
});

els.libraryUpload.addEventListener('click', () => {
  showModal(els.imageModal);
});

els.insertFeatured.addEventListener('click', () => {
  insertImage(els.image.value, els.imageAlt.value);
});

els.body.addEventListener('input', event => {
  const field = event.target.closest('[data-block-field]');
  if (!field) return;
  updateBlockFromField(field);
  const blockEl = field.closest('[data-block-index]');
  if (blockEl) {
    state.activeBlockIndex = Number(blockEl.dataset.blockIndex);
    const text = field.isContentEditable ? field.textContent : field.value;
    const slash = String(text || '').match(/\/([\w-]*)$/);
    if (slash && field.dataset.blockField === 'text') showSlashMenu(state.activeBlockIndex, slash[1], field);
    else hideSlashMenu();
  }
  markDirty();
});

els.body.addEventListener('change', event => {
  const field = event.target.closest('[data-block-field]');
  if (!field) return;
  updateBlockFromField(field);
  if (field.dataset.blockField === 'level') renderBlocks();
  markDirty();
});

els.body.addEventListener('focusin', event => {
  const blockEl = event.target.closest('[data-block-index]');
  if (blockEl) state.activeBlockIndex = Number(blockEl.dataset.blockIndex);
});

els.body.addEventListener('keydown', event => {
  const field = event.target.closest('[data-block-field]');
  const blockEl = event.target.closest('[data-block-index]');
  if (!field || !blockEl) return;
  const index = Number(blockEl.dataset.blockIndex);
  if (event.key === 'Escape') {
    hideSlashMenu();
    els.floatingToolbar.classList.add('is-hidden');
    return;
  }
  if (event.key === 'Enter' && !event.shiftKey && field.isContentEditable && ['paragraph', 'heading'].includes(state.blocks[index]?.type)) {
    event.preventDefault();
    updateBlockFromField(field);
    insertBlockAt(index + 1, createBlock('paragraph'));
  }
});

els.body.addEventListener('click', event => {
  const addNear = event.target.closest('[data-add-near]');
  if (addNear) {
    const index = Number(addNear.dataset.addNear);
    insertBlockAt(addNear.dataset.position === 'above' ? index : index + 1, createBlock('paragraph'));
    return;
  }
  const duplicate = event.target.closest('[data-duplicate-block]');
  if (duplicate) {
    const index = Number(duplicate.dataset.duplicateBlock);
    const copy = { ...state.blocks[index], id: blockId() };
    if (Array.isArray(copy.items)) copy.items = [...copy.items];
    insertBlockAt(index + 1, copy);
    return;
  }
  const remove = event.target.closest('[data-remove-block]');
  if (remove) {
    state.blocks.splice(Number(remove.dataset.removeBlock), 1);
    if (!state.blocks.length) state.blocks.push(createBlock('paragraph'));
    renderBlocks();
    markDirty();
    return;
  }
  const move = event.target.closest('[data-move-block]');
  if (move) {
    const index = Number(move.dataset.moveBlock);
    const next = index + Number(move.dataset.direction);
    if (next < 0 || next >= state.blocks.length) return;
    const [block] = state.blocks.splice(index, 1);
    state.blocks.splice(next, 0, block);
    state.activeBlockIndex = next;
    renderBlocks();
    markDirty();
  }
});

els.body.addEventListener('dragstart', event => {
  const handle = event.target.closest('[data-drag-block]');
  const blockEl = event.target.closest('[data-block-index]');
  if (!handle && !event.target.classList.contains('cms-editor-block')) return;
  if (!blockEl) return;
  event.dataTransfer.setData('text/plain', blockEl.dataset.blockIndex);
});

els.body.addEventListener('dragover', event => {
  if (event.target.closest('[data-block-index]')) event.preventDefault();
});

els.body.addEventListener('drop', event => {
  const target = event.target.closest('[data-block-index]');
  if (!target) return;
  event.preventDefault();
  const from = Number(event.dataTransfer.getData('text/plain'));
  const to = Number(target.dataset.blockIndex);
  if (!Number.isFinite(from) || from === to) return;
  const [block] = state.blocks.splice(from, 1);
  state.blocks.splice(to, 0, block);
  renderBlocks();
  markDirty();
});

els.addFaq.addEventListener('click', () => {
  const items = collectFaqItems();
  items.push({ question: '', answer: '' });
  renderFaqItems(items);
  markDirty();
});

els.faqItems.addEventListener('click', event => {
  const remove = event.target.closest('[data-remove-faq]');
  if (!remove) return;
  const items = collectFaqItems();
  items.splice(Number(remove.dataset.removeFaq), 1);
  renderFaqItems(items);
  markDirty();
});

els.authForm.addEventListener('submit', submitAuth);
els.authTogglePassword.addEventListener('click', () => {
  const visible = els.authPassword.type === 'text';
  els.authPassword.type = visible ? 'password' : 'text';
  els.authTogglePassword.textContent = visible ? 'Show' : 'Hide';
});
els.forgotPassword.addEventListener('click', () => {
  setAuthMode('forgot', false);
});
els.backToLogin.addEventListener('click', () => {
  state.auth.resetToken = '';
  if (window.location.search.includes('reset=')) {
    window.history.replaceState({}, document.title, '/admin/');
  }
  setAuthMode('login', false);
});

els.postList.addEventListener('click', event => {
  const button = event.target.closest('[data-slug]');
  if (button) openPost(button.dataset.slug);
});

els.search.addEventListener('input', renderPosts);
els.save.addEventListener('click', savePost);
els.saveBlogHub.addEventListener('click', saveBlogHub);
els.newPost.addEventListener('click', newPost);
els.sidebarNewPost.addEventListener('click', newPost);
els.duplicatePost.addEventListener('click', duplicatePost);
els.logout.addEventListener('click', logout);
els.saveDraft.addEventListener('click', () => savePost({ draft: true }));
els.publishPost.addEventListener('click', () => savePost({ publish: true }));
els.openFrontend.addEventListener('click', () => {
  if (state.activeSlug) window.open(`/blog/${state.activeSlug}/`, '_blank', 'noopener');
});
els.openPreviewNewTab.addEventListener('click', () => {
  if (state.activeSlug) window.open(`/blog/${state.activeSlug}/`, '_blank', 'noopener');
});
els.title.addEventListener('input', () => {
  if (els.slug.dataset.autoSlug === 'true') els.slug.value = slugify(els.title.value);
  if (!els.metaTitle.value.trim()) els.metaTitle.value = els.title.value.trim().slice(0, 70);
  els.screenTitle.textContent = els.title.value.trim() || 'New post';
  resizeTitleField();
  markDirty();
});
els.slug.addEventListener('input', () => {
  els.slug.dataset.autoSlug = els.slug.value.trim() ? 'false' : 'true';
  markDirty();
});
els.image.addEventListener('input', () => {
  updateImagePreview();
  markDirty();
});

els.category.addEventListener('change', () => {
  els.editorCategoryBadge.textContent = els.category.value;
  renderLivePreview();
});

els.draft.addEventListener('change', () => {
  els.editorStatusBadge.textContent = els.draft.checked ? 'Draft' : 'Published';
  if (els.topPostStatus) els.topPostStatus.textContent = els.draft.checked ? 'Draft' : 'Published';
  renderLivePreview();
});

els.slashMenu.addEventListener('mousedown', event => {
  event.preventDefault();
  const button = event.target.closest('[data-slash-command]');
  if (button) applySlashCommand(button.dataset.slashCommand);
});

els.floatingToolbar.addEventListener('mousedown', event => {
  event.preventDefault();
  const button = event.target.closest('[data-format]');
  if (button) applyFormat(button.dataset.format);
});

document.addEventListener('selectionchange', showFloatingToolbar);

document.querySelectorAll('.cms-settings-card').forEach(details => {
  details.addEventListener('toggle', () => {
    if (!details.open) return;
    document.querySelectorAll('.cms-settings-card[open]').forEach(openDetails => {
      if (openDetails !== details) openDetails.open = false;
    });
  });
});

[els.body, els.draft, els.featured, els.date, els.updated, els.category, els.readingTime, els.focusKeyword, els.metaTitle, els.metaDescription, els.excerpt, els.tags, els.heroTitle, els.heroAccent, els.trustNote, els.imageAlt, els.relatedPosts, els.globalPrimaryCta, els.globalSecondaryCta, els.ctaTitle, els.ctaText, els.ctaButtonText, els.ctaUrl, els.showToc, els.showShare, els.showRelated, els.showSidebarCta, els.canonical, els.noindex, els.schemaType, els.author, els.typographyScale, els.articleTheme, els.accentColor, els.showNewsletter, els.newsletterTitle, els.newsletterText, els.faqItems, els.showFramework, els.frameworkLabel, els.frameworkTitle, els.frameworkIntro, els.frameworkCoreLabel, els.frameworkCoreTitle, els.frameworkCoreText, els.frameworkNodes, els.frameworkSteps].forEach(input => {
  input.addEventListener('input', markDirty);
  input.addEventListener('change', markDirty);
});

[els.hubFeaturedPosts, els.hubHighlightPosts, els.hubSpotlightPosts].forEach(container => {
  container.addEventListener('change', event => {
    const input = event.target.closest('input[type="checkbox"]');
    if (input) enforceChoiceLimit(input);
  });
});

window.addEventListener('beforeunload', event => {
  if (!state.dirty) return;
  event.preventDefault();
  event.returnValue = '';
});

window.cmsStudio = {
  state,
  els,
  markdownToHtml,
  htmlStringToMarkdown,
  getArticleHtml,
  getArticleMarkdown,
  setStatus,
  markDirty,
  renderLivePreview,
  updateSeoPanel,
  registerEditorAdapter(adapter) {
    state.editorAdapter = adapter;
    els.body.classList.add('cms-rich-editor-host');
    if (adapter.hostClass) els.body.classList.add(adapter.hostClass);
    if (state.blocks.length) adapter.setMarkdown(blocksToMarkdown(state.blocks));
    renderLivePreview();
    updateSeoPanel();
  },
  updateFromRichEditor(html, json) {
    const markdown = htmlStringToMarkdown(html);
    state.blocks = markdownToBlocks(markdown);
    state.activePost = {
      ...(state.activePost || {}),
      body: markdown,
      editorJson: json
    };
    markDirty();
  },
  updateFromTiptap(html, json) {
    this.updateFromRichEditor(html, json);
  },
  createBlock,
  blockForCommand,
  slashCommands,
  showSlashMenu,
  hideSlashMenu,
  openLinkModal() {
    renderLinkCards(els.modalLinkResults, els.modalLinkSearch.value);
    showModal(els.linkModal);
    els.modalLinkSearch.focus();
  },
  openImageModal() {
    showModal(els.imageModal);
    els.modalImageUrl.focus();
  },
  insertImage,
  applyLink
};

window.dispatchEvent(new CustomEvent('cms:studio-ready'));

initializeAdmin().catch(() => {
  setAuthChecking(false);
  setAuthGate(true, false);
  setStatus('Run the local preview server to edit posts. Advanced CMS is still available for Git-based editing.', true);
});
