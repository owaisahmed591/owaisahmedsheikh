(function registerWritingBlocks() {
  function onReady(callback) {
    if (window.CMS && typeof window.CMS.registerEditorComponent === 'function') {
      callback(window.CMS);
      return;
    }

    window.addEventListener('DOMContentLoaded', function () {
      if (window.CMS && typeof window.CMS.registerEditorComponent === 'function') {
        callback(window.CMS);
      }
    });
  }

  function quoteBlock(label, content) {
    return ['> **' + label + ':** ' + content.trim(), ''].join('\n');
  }

  onReady(function (CMS) {
    CMS.registerEditorComponent({
      id: 'seo-tip',
      label: 'SEO Tip',
      icon: 'tips_and_updates',
      fields: [
        { name: 'tip', label: 'Tip', widget: 'text' }
      ],
      pattern: /^> \*\*SEO Tip:\*\* ([\s\S]+?)$/m,
      fromBlock: function (match) {
        return { tip: match[1] };
      },
      toBlock: function (data) {
        return quoteBlock('SEO Tip', data.tip || '');
      },
      toPreview: function (data) {
        return '<blockquote><strong>SEO Tip:</strong> ' + (data.tip || '') + '</blockquote>';
      }
    });

    CMS.registerEditorComponent({
      id: 'example-box',
      label: 'Example',
      icon: 'format_quote',
      fields: [
        { name: 'example', label: 'Example text', widget: 'text' }
      ],
      pattern: /^> \*\*Example:\*\* ([\s\S]+?)$/m,
      fromBlock: function (match) {
        return { example: match[1] };
      },
      toBlock: function (data) {
        return quoteBlock('Example', data.example || '');
      },
      toPreview: function (data) {
        return '<blockquote><strong>Example:</strong> ' + (data.example || '') + '</blockquote>';
      }
    });

    CMS.registerEditorComponent({
      id: 'article-cta',
      label: 'CTA',
      icon: 'ads_click',
      fields: [
        { name: 'text', label: 'CTA text', widget: 'string', default: 'Want help fixing this on your website?' },
        { name: 'url', label: 'Button URL', widget: 'string', default: '/free-seo-audit' }
      ],
      pattern: /^\[([^\]]+)\]\((\/[^)]+|https?:\/\/[^)]+)\)$/m,
      fromBlock: function (match) {
        return { text: match[1], url: match[2] };
      },
      toBlock: function (data) {
        return '[' + (data.text || 'Get a Free SEO Audit') + '](' + (data.url || '/free-seo-audit') + ')';
      },
      toPreview: function (data) {
        var href = data.url || '/free-seo-audit';
        var text = data.text || 'Get a Free SEO Audit';
        return '<p><a href="' + href + '">' + text + '</a></p>';
      }
    });
  });
})();
