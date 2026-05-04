(function () {
  const READY_EVENT = 'cms:studio-ready';
  const TABLE_BLOT = 'tableEmbed';
  const toolbarOptions = [
    [{ header: [2, 3, 4, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code-block'],
    ['link', 'image'],
    ['clean']
  ];

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

  function sanitizeTableHtml(html = '') {
    const doc = new DOMParser().parseFromString(String(html), 'text/html');
    const table = doc.querySelector('table');
    if (!table) return '';
    table.querySelectorAll('script, style, iframe, object, embed').forEach(node => node.remove());
    table.querySelectorAll('*').forEach(element => {
      Array.from(element.attributes).forEach(attribute => {
        const name = attribute.name.toLowerCase();
        const value = attribute.value || '';
        const allowed = ['colspan', 'rowspan', 'scope', 'headers', 'abbr'].includes(name);
        if (!allowed || name.startsWith('on') || /javascript:/i.test(value)) {
          element.removeAttribute(attribute.name);
        }
      });
    });
    return table.outerHTML;
  }

  function markdownTableToHtml(markdown = '') {
    const lines = String(markdown).trim().split('\n').map(line => line.trim()).filter(Boolean);
    if (lines.length < 2 || !lines[0].includes('|')) return '';
    const split = line => line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim());
    const separator = split(lines[1]);
    if (!separator.every(cell => /^:?-{3,}:?$/.test(cell))) return '';
    const headers = split(lines[0]);
    const rows = lines.slice(2).map(split);
    const width = Math.max(headers.length, ...rows.map(row => row.length));
    const fill = cells => Array.from({ length: width }, (_item, index) => escapeHtml(cells[index] || ''));
    const head = fill(headers).map(cell => `<th>${cell}</th>`).join('');
    const body = rows.map(row => `<tr>${fill(row).map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('');
    return `<table><thead><tr>${head}</tr></thead>${body ? `<tbody>${body}</tbody>` : ''}</table>`;
  }

  function blockToHtml(block = {}) {
    if (block.type === 'heading') {
      const level = Number(String(block.level || 'h2').replace('h', '')) || 2;
      return `<h${Math.min(4, Math.max(2, level))}>${escapeHtml(block.text || '')}</h${Math.min(4, Math.max(2, level))}>`;
    }
    if (block.type === 'image') {
      return block.url
        ? `<figure><img src="${escapeHtml(safeUrl(block.url))}" alt="${escapeHtml(block.alt || '')}">${block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : ''}</figure>`
        : '';
    }
    if (block.type === 'callout') {
      return `<blockquote><strong>${escapeHtml(block.title || 'Insight')}:</strong> ${escapeHtml(block.text || '')}</blockquote>`;
    }
    if (block.type === 'checklist') {
      const title = block.title ? `<h4>${escapeHtml(block.title)}</h4>` : '';
      const items = (block.items || ['List item']).filter(Boolean).map(item => `<li>${escapeHtml(item)}</li>`).join('');
      return `${title}<ul>${items}</ul>`;
    }
    if (block.type === 'takeaway') {
      return `<blockquote><strong>${escapeHtml(block.title || 'Key takeaway')}:</strong> ${escapeHtml(block.text || '')}</blockquote>`;
    }
    if (block.type === 'visual') {
      const items = (block.items || ['Step one']).filter(Boolean).map(item => `<li>${escapeHtml(item)}</li>`).join('');
      return `<h4>${escapeHtml(block.title || 'Visual summary')}</h4>${block.text ? `<p>${escapeHtml(block.text)}</p>` : ''}<ol>${items}</ol>`;
    }
    if (block.type === 'cta') {
      return `<blockquote><strong>${escapeHtml(block.title || 'Need help with this?')}</strong><br>${escapeHtml(block.text || '')}<br><a href="${escapeHtml(safeUrl(block.url || '/free-seo-audit'))}">${escapeHtml(block.buttonText || 'Get help')}</a></blockquote>`;
    }
    if (block.type === 'faq') {
      return `<h4>${escapeHtml(block.question || 'Question')}</h4><p>${escapeHtml(block.answer || '')}</p>`;
    }
    if (block.type === 'table') {
      return markdownTableToHtml(block.text || '');
    }
    if (block.type === 'code') {
      return `<pre><code>${escapeHtml(block.text || '')}</code></pre>`;
    }
    if (block.type === 'divider') {
      return '<hr>';
    }
    if (block.type === 'embed') {
      return block.url ? `<p><a href="${escapeHtml(safeUrl(block.url))}">${escapeHtml(block.caption || block.url)}</a></p>` : '';
    }
    return `<p>${escapeHtml(block.text || '')}</p>`;
  }

  function registerTableBlot(Quill) {
    try {
      const BlockEmbed = Quill.import('blots/block/embed');
      class TableEmbed extends BlockEmbed {
        static create(value) {
          const node = super.create();
          node.setAttribute('contenteditable', 'false');
          node.innerHTML = sanitizeTableHtml(value) || '<table><tbody><tr><td></td></tr></tbody></table>';
          return node;
        }

        static value(node) {
          return node.querySelector('table')?.outerHTML || node.innerHTML;
        }
      }
      TableEmbed.blotName = TABLE_BLOT;
      TableEmbed.tagName = 'div';
      TableEmbed.className = 'cms-quill-table-embed';
      Quill.register(TableEmbed, true);
      return true;
    } catch (error) {
      console.warn('Quill table embed could not be registered.', error);
      return false;
    }
  }

  function initQuillEditor(studio) {
    if (!window.Quill || !studio?.els?.body) {
      studio?.setStatus?.('Quill did not load. Check the admin page connection and reload.', true);
      return;
    }

    const Quill = window.Quill;
    const hasTableEmbed = registerTableBlot(Quill);
    let Delta = null;
    try {
      Delta = Quill.import('delta');
    } catch (error) {
      console.warn('Quill Delta import was unavailable; table paste fallback will still run.', error);
    }
    studio.els.body.classList.add('cms-quill-host');
    studio.els.body.innerHTML = '';

    const quill = new Quill(studio.els.body, {
      theme: 'snow',
      placeholder: 'Write or paste the article here. Use headings, links, images, lists, and tables normally.',
      modules: {
        toolbar: toolbarOptions,
        history: {
          delay: 800,
          maxStack: 120,
          userOnly: true
        }
      }
    });

    if (hasTableEmbed && Delta) {
      quill.clipboard.addMatcher('TABLE', node => new Delta().insert({ [TABLE_BLOT]: sanitizeTableHtml(node.outerHTML) }).insert('\n'));
    }

    const toolbar = quill.getModule('toolbar');
    toolbar.addHandler('image', () => studio.openImageModal());

    let suppressChange = false;
    let slashRange = null;

    function syncToStudio() {
      if (suppressChange) return;
      const html = quill.root.innerHTML;
      const json = quill.getContents();
      if (typeof studio.updateFromRichEditor === 'function') studio.updateFromRichEditor(html, json);
      else studio.updateFromTiptap(html, json);
    }

    function insertHtml(html = '') {
      const range = quill.getSelection(true) || { index: quill.getLength(), length: 0 };
      if (range.length) quill.deleteText(range.index, range.length, 'user');
      quill.clipboard.dangerouslyPasteHTML(range.index, html, 'user');
      quill.setSelection(Math.min(quill.getLength() - 1, range.index + 1), 0, 'silent');
      syncToStudio();
    }

    function insertTable(tableHtml = '') {
      const cleanTable = sanitizeTableHtml(tableHtml);
      if (!cleanTable) return;
      const range = quill.getSelection(true) || { index: quill.getLength(), length: 0 };
      if (range.length) quill.deleteText(range.index, range.length, 'user');
      if (hasTableEmbed) {
        quill.insertEmbed(range.index, TABLE_BLOT, cleanTable, 'user');
        quill.insertText(range.index + 1, '\n', 'user');
        quill.setSelection(range.index + 2, 0, 'silent');
      } else {
        quill.clipboard.dangerouslyPasteHTML(range.index, cleanTable, 'user');
      }
      syncToStudio();
    }

    function insertBlock(block = {}) {
      if (block.type === 'image') {
        if (block.url) insertImage(block.url, block.alt || '');
        else studio.openImageModal();
        return;
      }
      if (block.type === 'table') {
        insertTable(markdownTableToHtml(block.text || '| Item | Detail |\n| --- | --- |\n| Example | Detail |'));
        return;
      }
      insertHtml(blockToHtml(block));
    }

    function deleteSlashTrigger() {
      if (!slashRange) return;
      quill.deleteText(slashRange.index, slashRange.length, 'user');
      quill.setSelection(slashRange.index, 0, 'silent');
      slashRange = null;
    }

    function runSlashCommand(command) {
      deleteSlashTrigger();
      if (command === 'h2' || command === 'h3' || command === 'h4') {
        const level = Number(command.replace('h', ''));
        quill.formatLine(quill.getSelection(true).index, 1, 'header', level, 'user');
        return;
      }
      if (command === 'bullet') {
        quill.formatLine(quill.getSelection(true).index, 1, 'list', 'bullet', 'user');
        return;
      }
      if (command === 'numbered') {
        quill.formatLine(quill.getSelection(true).index, 1, 'list', 'ordered', 'user');
        return;
      }
      if (command === 'quote') {
        quill.formatLine(quill.getSelection(true).index, 1, 'blockquote', true, 'user');
        return;
      }
      if (command === 'image') {
        studio.openImageModal();
        return;
      }
      if (command === 'internal-link') {
        studio.openLinkModal();
        return;
      }
      insertBlock(studio.blockForCommand ? studio.blockForCommand(command) : { type: command });
    }

    function updateSlashMenu() {
      const range = quill.getSelection();
      if (!range || range.length) {
        studio.hideSlashMenu?.();
        slashRange = null;
        return;
      }
      const [line, offset] = quill.getLine(range.index);
      const lineStart = range.index - offset;
      const textBeforeCursor = quill.getText(lineStart, offset);
      const match = textBeforeCursor.match(/\/([\w-]*)$/);
      if (!match) {
        studio.hideSlashMenu?.();
        slashRange = null;
        return;
      }
      slashRange = { index: range.index - match[0].length, length: match[0].length };
      const bounds = quill.getBounds(range.index);
      const editorRect = quill.root.getBoundingClientRect();
      const anchor = {
        getBoundingClientRect: () => ({
          left: editorRect.left + bounds.left,
          right: editorRect.left + bounds.left,
          top: editorRect.top + bounds.top,
          bottom: editorRect.top + bounds.bottom,
          width: 1,
          height: bounds.height || 20
        })
      };
      studio.showSlashMenu?.(0, match[1], anchor);
    }

    function insertLink(href, title = '') {
      const range = quill.getSelection(true) || { index: quill.getLength(), length: 0 };
      if (range.length) {
        quill.format('link', href, 'user');
      } else {
        quill.insertText(range.index, title || href, { link: href }, 'user');
        quill.setSelection(range.index + String(title || href).length, 0, 'silent');
      }
      syncToStudio();
    }

    function setImageAlt(src, alt) {
      if (!alt) return;
      requestAnimationFrame(() => {
        Array.from(quill.root.querySelectorAll('img')).forEach(image => {
          if (image.getAttribute('src') === src) image.setAttribute('alt', alt);
        });
        syncToStudio();
      });
    }

    function insertImage(src, alt = '') {
      const range = quill.getSelection(true) || { index: quill.getLength(), length: 0 };
      if (range.length) quill.deleteText(range.index, range.length, 'user');
      quill.insertEmbed(range.index, 'image', src, 'user');
      quill.insertText(range.index + 1, '\n', 'user');
      quill.setSelection(range.index + 2, 0, 'silent');
      setImageAlt(src, alt);
      syncToStudio();
    }

    function applyFormat(command) {
      const range = quill.getSelection(true);
      if (!range) return;
      const format = quill.getFormat(range);
      if (command === 'bold') quill.format('bold', !format.bold, 'user');
      if (command === 'italic') quill.format('italic', !format.italic, 'user');
      if (command === 'link') studio.openLinkModal();
      if (command === 'h2') quill.formatLine(range.index, range.length || 1, 'header', 2, 'user');
      if (command === 'h3') quill.formatLine(range.index, range.length || 1, 'header', 3, 'user');
      if (command === 'ul') quill.formatLine(range.index, range.length || 1, 'list', format.list === 'bullet' ? false : 'bullet', 'user');
      if (command === 'ol') quill.formatLine(range.index, range.length || 1, 'list', format.list === 'ordered' ? false : 'ordered', 'user');
      if (command === 'quote') quill.formatLine(range.index, range.length || 1, 'blockquote', !format.blockquote, 'user');
      if (command === 'highlight') quill.format('background', format.background ? false : '#dff8e8', 'user');
      if (command === 'code') quill.format('code', !format.code, 'user');
      if (command === 'clear') quill.removeFormat(range.index, range.length || 1, 'user');
      syncToStudio();
    }

    function handleTablePaste(event) {
      const html = event.clipboardData?.getData('text/html') || '';
      if (!/<table[\s>]/i.test(html)) return;
      event.preventDefault();
      const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
      const table = doc.querySelector('table');
      if (table) insertTable(table.outerHTML);
    }

    function setMarkdown(markdown = '') {
      suppressChange = true;
      quill.setContents([{ insert: '\n' }], 'silent');
      const html = studio.markdownToHtml(markdown || '');
      if (html.trim()) quill.clipboard.dangerouslyPasteHTML(0, html, 'silent');
      suppressChange = false;
    }

    quill.on('text-change', () => {
      updateSlashMenu();
      syncToStudio();
    });

    quill.on('selection-change', range => {
      if (!range) studio.hideSlashMenu?.();
      else updateSlashMenu();
    });

    quill.root.addEventListener('paste', handleTablePaste);
    quill.root.addEventListener('keydown', event => {
      if (event.key === 'Escape') studio.hideSlashMenu?.();
    });

    studio.registerEditorAdapter({
      hostClass: 'cms-quill-host',
      isReady: true,
      setMarkdown,
      getMarkdown: () => studio.htmlStringToMarkdown(quill.root.innerHTML),
      getHTML: () => quill.root.innerHTML,
      getJSON: () => quill.getContents(),
      insertText: value => quill.insertText((quill.getSelection(true) || { index: quill.getLength() }).index, value, 'user'),
      insertHtml,
      insertBlock,
      insertLink,
      insertImage,
      runSlashCommand,
      applyFormat
    });

    window.cmsQuillEditor = quill;
  }

  function boot() {
    if (window.cmsStudio) initQuillEditor(window.cmsStudio);
    else window.addEventListener(READY_EVENT, () => initQuillEditor(window.cmsStudio), { once: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}());
