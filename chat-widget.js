(function () {
  'use strict';

  if (window.__oasChatWidgetLoaded) {
    return;
  }
  window.__oasChatWidgetLoaded = true;

  var WA_NUMBER = '923152648247';
  var OWAIS_NAME = 'Owais Ahmed Sheikh';
  var TAGLINE = 'Freelance SEO Expert - Karachi';
  var WELCOME = "Hi. I'm Owais's SEO assistant. I can help with local SEO, technical issues, pricing, audits, and the best next step for your website.";
  var NUDGE_MESSAGE = 'Need help with your SEO? I can point you to the right next step.';
  var NUDGE_DELAY = 7000;
  var QUICK_PROMPTS = [
    'What should I fix first on my website SEO?',
    'How much does SEO cost for my business?',
    'Can local SEO help me rank in Karachi?',
    'Should I start with an SEO audit or monthly SEO?'
  ];

  var sessionId = 'oas_' + Math.random().toString(36).slice(2, 10);
  try {
    sessionId = sessionStorage.getItem('oas_sid') || sessionId;
    sessionStorage.setItem('oas_sid', sessionId);
  } catch (error) {}

  function getSessionValue(key) {
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function setSessionValue(key, value) {
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {}
  }

  function currentTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function escapeHtml(value) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function formatBubbleText(value) {
    return escapeHtml(value).replace(/\n/g, '<br>');
  }

  function normalizeText(value) {
    return (value || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s./:-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function includesAny(text, keywords) {
    return keywords.some(function (keyword) {
      return text.indexOf(keyword) !== -1;
    });
  }

  function buildAssistantReply(message) {
    var raw = message || '';
    var text = normalizeText(raw);
    var hasUrl = /(https?:\/\/|www\.|\.com\b|\.pk\b|\.net\b)/i.test(raw);

    if (hasUrl) {
      return "If you already have a live site, the first review should cover crawlability, page speed, page titles, internal links, and whether your main service pages are strong enough to rank.\n\nIf you send that same link on WhatsApp, Owais can review it directly and tell you the best next step.";
    }

    if (includesAny(text, ['hello', 'hi', 'hey', 'salam', 'assalam'])) {
      return "Hi. I can help with audits, pricing, local SEO, technical issues, and what to do next for your site.\n\nTell me your business type, your city, and whether you already have a website. I will point you to the most useful starting move.";
    }

    if (includesAny(text, ['audit']) && includesAny(text, ['monthly', 'ongoing', 'retainer'])) {
      return "Start with an SEO audit if you do not yet know what is holding the site back. That gives you a clear priority list before you commit to monthly work.\n\nMonthly SEO makes sense after that, when you need ongoing fixes, content, local SEO, link building, and reporting.";
    }

    if (includesAny(text, ['fix first', 'not ranking', 'rank higher', 'why is my website not ranking', 'what should i fix'])) {
      return "For most websites, the first things to check are crawl issues, page speed, weak page targeting, and internal linking.\n\nIf your main service pages are thin or poorly structured, rankings usually stall fast. Tell me your business type and I can narrow down the first priority.";
    }

    if (includesAny(text, ['price', 'pricing', 'cost', 'package', 'budget', 'fee'])) {
      return "SEO cost depends on scope. A one-time audit costs less than monthly SEO because monthly work includes ongoing fixes, content, local SEO, and reporting.\n\nIf you tell me your industry and whether you want Karachi-only rankings or wider Pakistan traffic, I can suggest the better starting option.";
    }

    if (includesAny(text, ['local seo', 'karachi', 'maps', 'map pack', 'google business', 'gmb', 'gbp', 'near me'])) {
      return "Yes. Local SEO can help you rank in Karachi search results and Google Maps if your website, Google Business Profile, reviews, and city pages are aligned.\n\nThe biggest wins usually come from GBP optimization, service plus location pages, citations, and strong internal links.";
    }

    if (includesAny(text, ['technical', 'speed', 'core web vitals', 'crawl', 'index', 'schema', 'redirect', 'broken link', 'canonical'])) {
      return "Technical SEO matters when Google cannot crawl, understand, or trust your pages properly.\n\nThe first areas to review are indexing, page speed, Core Web Vitals, broken links, redirects, canonicals, and schema. If one of those is off, content alone will not carry the site.";
    }

    if (includesAny(text, ['content', 'on page', 'title', 'meta', 'keyword', 'keywords', 'internal linking', 'blog'])) {
      return "On-page SEO means each important page should target a clear topic and match the search intent behind it.\n\nThat usually means better titles, headings, service page structure, internal links, and supporting content around the main keyword.";
    }

    if (includesAny(text, ['backlink', 'backlinks', 'link building', 'off page', 'guest post', 'authority'])) {
      return "Backlinks still matter, but quality matters more than volume.\n\nA few relevant links from real websites help more than a large batch of weak links. The best link building supports your service pages and brand trust, not just raw metrics.";
    }

    if (includesAny(text, ['how long', 'timeline', 'results', 'how many months', 'when will i rank'])) {
      return "Most businesses see early movement in 6 to 12 weeks, but the timeline depends on competition, site quality, and how much work is needed.\n\nTechnical fixes and local SEO often show earlier signals. Bigger ranking gains usually take longer because Google needs time to recrawl and re-evaluate the site.";
    }

    if (includesAny(text, ['ecommerce', 'shopify', 'woocommerce', 'store', 'product page', 'category page'])) {
      return "For e-commerce, the biggest SEO gains usually come from category pages, collection structure, internal linking, and fixing duplicate or thin product pages.\n\nIf your store is on Shopify or WooCommerce, I can tell you what usually matters first.";
    }

    if (includesAny(text, ['call', 'contact', 'hire', 'book', 'meeting', 'whatsapp', 'speak to owais'])) {
      return "The fastest next step is to send Owais your website link and main goal on WhatsApp.\n\nThat lets him review the site properly and tell you whether you need an audit, local SEO, technical fixes, or ongoing monthly work.";
    }

    return "I can help with audits, pricing, local SEO, technical fixes, content, and next steps.\n\nTell me your business type, your city, and whether you already have a website. I will point you to the most useful starting move.";
  }

  function getAssistantReply(message) {
    if (!window.fetch) {
      return Promise.resolve(buildAssistantReply(message));
    }

    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timeoutId = controller ? window.setTimeout(function () {
      controller.abort();
    }, 9000) : null;

    return fetch('/api/ai-assistant', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      signal: controller ? controller.signal : undefined,
      body: JSON.stringify({
        message: message,
        pageTitle: document.title || '',
        pageUrl: window.location.href,
        sessionId: sessionId
      })
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Assistant unavailable');
        }
        return response.json();
      })
      .then(function (data) {
        var answer = data && typeof data.answer === 'string' ? data.answer.trim() : '';
        return answer || buildAssistantReply(message);
      })
      .catch(function () {
        return buildAssistantReply(message);
      })
      .finally(function () {
        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }
      });
  }

  function appendStyles() {
    if (document.getElementById('oas-chat-style')) {
      return;
    }

    var style = document.createElement('style');
    style.id = 'oas-chat-style';
    style.textContent = `
      .whatsapp-float { display: none !important; }

      #oas-chat-fab,
      #oas-chat-panel,
      #oas-chat-panel * {
        box-sizing: border-box;
        font-family: 'Manrope', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      #oas-chat-fab {
        position: fixed;
        right: 24px;
        bottom: 24px;
        z-index: 2147483000;
        width: 62px;
        height: 62px;
        border: 1px solid rgba(49, 255, 140, 0.24);
        border-radius: 22px;
        background:
          radial-gradient(circle at 30% 25%, rgba(255,255,255,.12), transparent 34%),
          linear-gradient(145deg, #31ff8c 0%, #20e97a 55%, #11c965 100%);
        box-shadow:
          0 18px 36px rgba(49, 255, 140, 0.2),
          0 10px 24px rgba(0, 0, 0, 0.34),
          inset 0 1px 0 rgba(255,255,255,.22);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        overflow: hidden;
        transition: transform 0.22s ease, box-shadow 0.22s ease, filter 0.22s ease;
      }
      #oas-chat-fab.is-open {
        opacity: 0;
        transform: translateY(10px) scale(0.92);
        pointer-events: none;
      }
      #oas-chat-fab::before {
        content: '';
        position: absolute;
        inset: -16px;
        background: radial-gradient(circle, rgba(49,255,140,.32), transparent 62%);
        opacity: 0;
        transition: opacity 0.22s ease;
      }
      #oas-chat-fab:hover {
        transform: translateY(-2px) scale(1.03);
        filter: brightness(1.03);
        box-shadow:
          0 22px 42px rgba(49, 255, 140, 0.24),
          0 12px 26px rgba(0, 0, 0, 0.4),
          inset 0 1px 0 rgba(255,255,255,.24);
      }
      #oas-chat-fab:hover::before {
        opacity: 1;
      }
      #oas-chat-fab svg {
        position: relative;
        z-index: 1;
        width: 26px;
        height: 26px;
        stroke: #041008;
      }

      #oas-chat-nudge {
        position: fixed;
        right: 24px;
        bottom: 102px;
        z-index: 2147482998;
        width: min(290px, calc(100vw - 34px));
        padding: 15px 18px 14px;
        border-radius: 20px 20px 8px 20px;
        border: 1px solid rgba(49,255,140,.18);
        background:
          radial-gradient(circle at 18% 18%, rgba(49,255,140,.1), transparent 24%),
          linear-gradient(180deg, rgba(12,28,16,.97), rgba(7,15,9,.99));
        box-shadow:
          0 22px 52px rgba(0, 0, 0, 0.42),
          inset 0 1px 0 rgba(255,255,255,.04);
        color: #eef5ef;
        opacity: 0;
        transform: translateY(10px) scale(0.98);
        pointer-events: none;
        transition: opacity 0.22s ease, transform 0.22s ease;
        cursor: pointer;
      }
      #oas-chat-nudge::after {
        content: '';
        position: absolute;
        right: 22px;
        bottom: -7px;
        width: 16px;
        height: 16px;
        transform: rotate(45deg);
        background: #0a150c;
        border-right: 1px solid rgba(49,255,140,.18);
        border-bottom: 1px solid rgba(49,255,140,.18);
      }
      #oas-chat-nudge.open {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }
      .oas-nudge-label {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: #7fffc1;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .oas-nudge-label i {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #31ff8c;
        box-shadow: 0 0 0 4px rgba(49,255,140,.12);
      }
      .oas-nudge-text {
        margin: 10px 0 0;
        font-size: 14px;
        font-weight: 700;
        line-height: 1.55;
        color: #f3f8f3;
        padding-right: 18px;
      }
      .oas-nudge-cta {
        margin-top: 9px;
        font-size: 12px;
        font-weight: 800;
        color: #7fffc1;
      }
      .oas-nudge-close {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 28px;
        height: 28px;
        border: none;
        border-radius: 10px;
        background: transparent;
        color: #7c8b80;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background 0.18s ease, color 0.18s ease;
      }
      .oas-nudge-close:hover {
        background: rgba(255,255,255,.06);
        color: #f6f8f5;
      }

      #oas-chat-panel {
        position: fixed;
        right: 24px;
        bottom: 100px;
        z-index: 2147482999;
        width: 388px;
        max-width: calc(100vw - 32px);
        max-height: calc(100vh - 120px);
        border-radius: 24px;
        overflow: hidden;
        background:
          radial-gradient(circle at 20% 0%, rgba(49,255,140,.08), transparent 28%),
          radial-gradient(circle at 100% 100%, rgba(49,255,140,.06), transparent 28%),
          linear-gradient(180deg, rgba(10,22,13,.98), rgba(5,11,6,.99));
        border: 1px solid rgba(49,255,140,.16);
        box-shadow:
          0 30px 80px rgba(0, 0, 0, 0.56),
          0 0 0 1px rgba(255,255,255,.03),
          inset 0 1px 0 rgba(255,255,255,.05);
        opacity: 0;
        transform: translateY(14px) scale(0.985);
        pointer-events: none;
        transition: opacity 0.22s ease, transform 0.22s ease;
      }
      #oas-chat-panel::before {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        background:
          linear-gradient(rgba(255,255,255,.03), rgba(255,255,255,0)) top/100% 1px no-repeat,
          linear-gradient(90deg, rgba(49,255,140,.05), transparent 22%, transparent 78%, rgba(49,255,140,.05));
        opacity: .7;
      }
      #oas-chat-panel::after {
        content: '';
        position: absolute;
        inset: auto -20% -30% 18%;
        height: 180px;
        background: radial-gradient(circle, rgba(49,255,140,.14), transparent 66%);
        pointer-events: none;
      }
      #oas-chat-panel.open {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }

      .oas-header {
        display: flex;
        align-items: center;
        gap: 13px;
        padding: 18px 18px 16px;
        position: relative;
        background:
          linear-gradient(180deg, rgba(11,26,16,.98), rgba(9,20,12,.96));
        border-bottom: 1px solid rgba(49,255,140,.12);
      }
      .oas-avatar {
        position: relative;
        width: 48px;
        height: 48px;
        border-radius: 16px;
        overflow: hidden;
        border: 1px solid rgba(49,255,140,.22);
        background:
          radial-gradient(circle at 28% 24%, rgba(49,255,140,.2), transparent 42%),
          linear-gradient(160deg, rgba(12,25,15,.98), rgba(7,14,8,.98));
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.05),
          0 12px 26px rgba(49,255,140,.08);
        flex-shrink: 0;
      }
      .oas-avatar-fallback {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #f6f8f5;
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 0.04em;
      }
      .oas-avatar img {
        position: relative;
        z-index: 1;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center top;
        display: block;
      }
      .oas-header-info {
        min-width: 0;
        flex: 1;
      }
      .oas-header-name {
        margin: 0;
        color: #f6f8f5;
        font-size: 15px;
        font-weight: 800;
        letter-spacing: -0.02em;
      }
      .oas-header-tag {
        margin: 4px 0 0;
        color: #93a196;
        font-size: 12px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .oas-online-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #31ff8c;
        box-shadow: 0 0 0 3px rgba(49, 255, 140, 0.14);
        flex-shrink: 0;
      }
      .oas-ai-badge {
        display: inline-flex;
        margin-left: 6px;
        padding: 3px 8px;
        border: 1px solid rgba(49,255,140,.18);
        border-radius: 999px;
        background: rgba(49,255,140,.08);
        color: #7fffc1;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.08em;
      }
      .oas-close-btn {
        border: none;
        background: transparent;
        color: #7c8b80;
        cursor: pointer;
        padding: 6px;
        border-radius: 12px;
        transition: color 0.18s ease, background 0.18s ease;
      }
      .oas-close-btn:hover {
        color: #f6f8f5;
        background: rgba(255,255,255,.06);
      }

      .oas-messages {
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-height: 102px;
        max-height: 300px;
        overflow-y: auto;
        padding: 18px 18px 12px;
        background:
          linear-gradient(180deg, rgba(255,255,255,.015), rgba(255,255,255,0)),
          linear-gradient(90deg, rgba(49,255,140,.03), transparent 20%, transparent 80%, rgba(49,255,140,.03));
      }
      .oas-messages::-webkit-scrollbar {
        width: 6px;
      }
      .oas-messages::-webkit-scrollbar-thumb {
        background: rgba(49,255,140,.14);
        border-radius: 999px;
      }

      .oas-bubble,
      .oas-bubble-user,
      .oas-bubble-ai {
        max-width: 92%;
        padding: 13px 14px 11px;
        font-size: 14px;
        line-height: 1.65;
        color: #e9f1eb;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.04);
      }
      .oas-bubble,
      .oas-bubble-ai {
        background:
          linear-gradient(180deg, rgba(16,40,25,.92), rgba(11,28,18,.94));
        border: 1px solid rgba(49,255,140,.14);
        border-radius: 18px 18px 18px 8px;
      }
      .oas-bubble-user {
        margin-left: auto;
        color: #041008;
        background:
          linear-gradient(135deg, #31ff8c 0%, #24ef7d 52%, #18d26d 100%);
        border: 1px solid rgba(49,255,140,.28);
        border-radius: 18px 18px 8px 18px;
        box-shadow: 0 10px 24px rgba(49,255,140,.14);
      }
      .oas-time {
        margin-top: 6px;
        color: #7d8e81;
        font-size: 10.5px;
      }
      .oas-bubble-user .oas-time {
        color: rgba(4,16,8,.62);
      }

      .oas-typing {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .oas-typing span {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #31ff8c;
        opacity: 0.35;
        animation: oas-blink 1.2s infinite;
      }
      .oas-typing span:nth-child(2) {
        animation-delay: 0.2s;
      }
      .oas-typing span:nth-child(3) {
        animation-delay: 0.4s;
      }
      @keyframes oas-blink {
        0%, 100% { opacity: 0.35; }
        50% { opacity: 1; }
      }

      .oas-form {
        display: flex;
        flex-direction: column;
        gap: 11px;
        padding: 14px 18px 18px;
        border-top: 1px solid rgba(49,255,140,.1);
        background: linear-gradient(180deg, rgba(10,22,13,.95), rgba(7,15,8,.98));
      }
      .oas-textarea {
        width: 100%;
        height: 72px;
        resize: none;
        border-radius: 16px;
        border: 1px solid rgba(49,255,140,.18);
        background:
          linear-gradient(180deg, rgba(15,31,19,.95), rgba(11,23,14,.98));
        color: #eef5ef;
        font: inherit;
        font-size: 13.5px;
        line-height: 1.55;
        padding: 14px 15px;
        outline: none;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.04),
          0 0 0 3px rgba(49,255,140,.05);
        transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
      }
      .oas-textarea:focus {
        border-color: rgba(49,255,140,.34);
        background: linear-gradient(180deg, rgba(16,35,21,.98), rgba(11,24,14,.99));
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.05),
          0 0 0 4px rgba(49,255,140,.08),
          0 18px 34px rgba(49,255,140,.08);
      }
      .oas-textarea::placeholder {
        color: #738276;
      }
      .oas-quick-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .oas-quick-actions.is-hidden {
        display: none;
      }
      .oas-quick-btn {
        border: 1px solid rgba(49,255,140,.14);
        background: rgba(49,255,140,.05);
        color: #dff4e3;
        border-radius: 999px;
        padding: 8px 11px;
        font: inherit;
        font-size: 12px;
        font-weight: 700;
        line-height: 1.3;
        cursor: pointer;
        transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease, color 0.18s ease;
      }
      .oas-quick-btn:hover {
        transform: translateY(-1px);
        background: rgba(49,255,140,.1);
        border-color: rgba(49,255,140,.24);
        color: #f6fff8;
      }
      .oas-btn-row {
        display: grid;
        grid-template-columns: minmax(0, 1.65fr) minmax(0, 1fr);
        gap: 10px;
      }
      .oas-send-btn,
      .oas-wa-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        min-height: 48px;
        border-radius: 14px;
        padding: 12px 14px;
        font: inherit;
        font-size: 14px;
        font-weight: 800;
        cursor: pointer;
        transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease, border-color 0.18s ease;
      }
      .oas-send-btn {
        border: none;
        color: #041008;
        background: linear-gradient(135deg, #31ff8c 0%, #22ea7b 100%);
        box-shadow:
          0 14px 30px rgba(49,255,140,.18),
          inset 0 1px 0 rgba(255,255,255,.26);
      }
      .oas-send-btn:hover {
        transform: translateY(-1px);
        filter: brightness(1.02);
        box-shadow:
          0 18px 34px rgba(49,255,140,.22),
          inset 0 1px 0 rgba(255,255,255,.28);
      }
      .oas-send-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .oas-wa-btn {
        border: 1px solid rgba(49,255,140,.18);
        background: rgba(49,255,140,.06);
        color: #7fffc1;
      }
      .oas-wa-btn:hover {
        transform: translateY(-1px);
        background: rgba(49,255,140,.1);
        border-color: rgba(49,255,140,.3);
      }
      .oas-footer-note {
        margin: 0;
        color: #738276;
        font-size: 10.5px;
        letter-spacing: 0.01em;
        text-align: center;
      }

      @media (max-width: 480px) {
        #oas-chat-fab {
          right: 16px;
          bottom: 18px;
          width: 58px;
          height: 58px;
          border-radius: 20px;
        }
        #oas-chat-nudge {
          right: 16px;
          bottom: 84px;
          width: min(274px, calc(100vw - 32px));
        }
        #oas-chat-panel {
          right: 16px;
          bottom: 90px;
          width: calc(100vw - 32px);
          max-width: calc(100vw - 32px);
          border-radius: 22px;
        }
        .oas-header {
          padding: 16px 16px 14px;
        }
        .oas-messages {
          padding: 16px 16px 10px;
          max-height: 270px;
        }
        .oas-form {
          padding: 13px 16px 16px;
        }
        .oas-quick-actions {
          gap: 7px;
        }
        .oas-quick-btn {
          width: 100%;
          justify-content: center;
        }
        .oas-btn-row {
          grid-template-columns: 1fr;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function removeDuplicates() {
    var selectors = ['#oas-chat-fab', '#oas-chat-panel', '#oas-chat-nudge'];
    selectors.forEach(function (selector) {
      var nodes = document.querySelectorAll(selector);
      for (var i = 1; i < nodes.length; i += 1) {
        nodes[i].remove();
      }
    });
  }

  function buildWidget() {
    var wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <button id="oas-chat-fab" type="button" aria-label="Chat with Owais" aria-expanded="false" style="position: relative;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>
      <div id="oas-chat-nudge" role="status" aria-live="polite">
        <button class="oas-nudge-close" id="oas-nudge-close" type="button" aria-label="Dismiss help message">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="oas-nudge-label"><i aria-hidden="true"></i>Assistant</div>
        <p class="oas-nudge-text">${NUDGE_MESSAGE}</p>
        <div class="oas-nudge-cta">Tap to open chat</div>
      </div>
      <div id="oas-chat-panel" role="dialog" aria-label="Chat with Owais Ahmed Sheikh" aria-hidden="true">
        <div class="oas-header">
          <div class="oas-avatar">
            <span class="oas-avatar-fallback" aria-hidden="true">OA</span>
            <img src="/owais.png" alt="Owais Ahmed Sheikh" />
          </div>
          <div class="oas-header-info">
            <p class="oas-header-name">${OWAIS_NAME}<span class="oas-ai-badge">AI</span></p>
            <p class="oas-header-tag"><span class="oas-online-dot"></span>${TAGLINE}</p>
          </div>
          <button class="oas-close-btn" id="oas-close" type="button" aria-label="Close chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="oas-messages" id="oas-messages">
          <div class="oas-bubble">
            ${WELCOME}
            <div class="oas-time">${currentTime()}</div>
          </div>
        </div>
        <div class="oas-form">
          <div class="oas-quick-actions">
            ${QUICK_PROMPTS.map(function (prompt, index) {
              return '<button class="oas-quick-btn" type="button" data-oas-prompt="' + index + '">' + prompt + '</button>';
            }).join('')}
          </div>
          <textarea class="oas-textarea" id="oas-msg" placeholder="Ask about rankings, pricing, technical SEO, or your next step..." maxlength="500"></textarea>
          <div class="oas-btn-row">
            <button class="oas-send-btn" id="oas-send" type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M2 21 23 12 2 3v7l15 2-15 2z"></path></svg>
              Ask Assistant
            </button>
            <button class="oas-wa-btn" id="oas-wa" type="button">WhatsApp</button>
          </div>
          <p class="oas-footer-note">Ask here for quick SEO guidance. Use WhatsApp if you want to speak to Owais directly.</p>
        </div>
      </div>
    `;

    while (wrapper.firstChild) {
      document.body.appendChild(wrapper.firstChild);
    }
  }

  function applyDockStyles(fab, panel, nudge) {
    var mobile = window.matchMedia('(max-width: 480px)').matches;
    var right = mobile ? '16px' : '24px';
    var fabBottom = mobile ? '18px' : '24px';
    var panelBottom = mobile ? '90px' : '100px';
    var panelWidth = mobile ? 'calc(100vw - 32px)' : '388px';
    var nudgeBottom = mobile ? '84px' : '102px';

    fab.style.setProperty('position', 'fixed', 'important');
    fab.style.setProperty('left', 'auto', 'important');
    fab.style.setProperty('right', right, 'important');
    fab.style.setProperty('bottom', fabBottom, 'important');
    fab.style.setProperty('top', 'auto', 'important');
    fab.style.setProperty('margin', '0', 'important');
    fab.style.setProperty('transform', 'none', 'important');
    fab.style.setProperty('z-index', '2147483000', 'important');

    panel.style.setProperty('position', 'fixed', 'important');
    panel.style.setProperty('left', 'auto', 'important');
    panel.style.setProperty('right', right, 'important');
    panel.style.setProperty('bottom', panelBottom, 'important');
    panel.style.setProperty('top', 'auto', 'important');
    panel.style.setProperty('margin', '0', 'important');
    panel.style.setProperty('width', panelWidth, 'important');
    panel.style.setProperty('max-width', 'calc(100vw - 20px)', 'important');
    panel.style.setProperty('z-index', '2147482999', 'important');

    if (nudge) {
      nudge.style.setProperty('position', 'fixed', 'important');
      nudge.style.setProperty('left', 'auto', 'important');
      nudge.style.setProperty('right', right, 'important');
      nudge.style.setProperty('bottom', nudgeBottom, 'important');
      nudge.style.setProperty('top', 'auto', 'important');
      nudge.style.setProperty('margin', '0', 'important');
      nudge.style.setProperty('z-index', '2147482998', 'important');
    }
  }

  function mount() {
    appendStyles();
    removeDuplicates();

    if (!document.getElementById('oas-chat-fab') || !document.getElementById('oas-chat-panel')) {
      buildWidget();
    }

    var fab = document.getElementById('oas-chat-fab');
    var nudge = document.getElementById('oas-chat-nudge');
    var panel = document.getElementById('oas-chat-panel');
    var closeBtn = document.getElementById('oas-close');
    var nudgeCloseBtn = document.getElementById('oas-nudge-close');
    var sendBtn = document.getElementById('oas-send');
    var waBtn = document.getElementById('oas-wa');
    var msgInput = document.getElementById('oas-msg');
    var messages = document.getElementById('oas-messages');
    var quickButtons = document.querySelectorAll('.oas-quick-btn');
    var quickActions = panel.querySelector('.oas-quick-actions');
    var isOpen = false;
    var nudgeTimer = null;

    applyDockStyles(fab, panel, nudge);
    window.addEventListener('resize', function () {
      applyDockStyles(fab, panel, nudge);
    });

    function scrollDown() {
      messages.scrollTop = messages.scrollHeight;
    }

    function addBubble(text, className) {
      var el = document.createElement('div');
      el.className = className;
      el.innerHTML = formatBubbleText(text) + '<div class="oas-time">' + currentTime() + '</div>';
      messages.appendChild(el);
      scrollDown();
      return el;
    }

    function addTyping() {
      var el = document.createElement('div');
      el.className = 'oas-bubble';
      el.innerHTML = '<div class="oas-typing"><span></span><span></span><span></span></div>';
      messages.appendChild(el);
      scrollDown();
      return el;
    }

    function hideQuickActions() {
      if (quickActions) {
        quickActions.classList.add('is-hidden');
      }
    }

    function clearNudgeTimer() {
      if (nudgeTimer) {
        window.clearTimeout(nudgeTimer);
        nudgeTimer = null;
      }
    }

    function hideNudge(markSeen) {
      clearNudgeTimer();
      if (nudge) {
        nudge.classList.remove('open');
      }
      if (markSeen) {
        setSessionValue('oas_nudge_seen', '1');
      }
    }

    function showNudge() {
      if (!nudge || isOpen || getSessionValue('oas_nudge_seen') === '1') {
        return;
      }
      nudge.classList.add('open');
      setSessionValue('oas_nudge_seen', '1');
    }

    function scheduleNudge() {
      if (!nudge || getSessionValue('oas_nudge_seen') === '1') {
        return;
      }
      clearNudgeTimer();
      nudgeTimer = window.setTimeout(showNudge, NUDGE_DELAY);
    }

    function sendMessage(message) {
      if (!message) {
        msgInput.focus();
        msgInput.style.borderColor = 'rgba(239, 68, 68, 0.6)';
        setTimeout(function () {
          msgInput.style.borderColor = '';
        }, 1200);
        return;
      }

      hideNudge(true);
      hideQuickActions();
      addBubble(message, 'oas-bubble-user');
      msgInput.value = '';
      sendBtn.disabled = true;

      var typingEl = addTyping();

      getAssistantReply(message).then(function (reply) {
        typingEl.remove();
        addBubble(reply, 'oas-bubble-ai');
        sendBtn.disabled = false;
        msgInput.focus();
      });
    }

    function openPanel() {
      isOpen = true;
      hideNudge(true);
      fab.classList.add('is-open');
      panel.classList.add('open');
      panel.setAttribute('aria-hidden', 'false');
      fab.setAttribute('aria-expanded', 'true');
      setTimeout(function () {
        msgInput.focus();
      }, 150);
    }

    function closePanel() {
      isOpen = false;
      fab.classList.remove('is-open');
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
      fab.setAttribute('aria-expanded', 'false');
    }

    function openWhatsApp(text) {
      hideNudge(true);
      var message = text || msgInput.value.trim() || 'I would like to know more about your SEO services.';
      window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent('Hi Owais, ' + message), '_blank');
    }

    sendBtn.addEventListener('click', function () {
      sendMessage(msgInput.value.trim());
    });

    waBtn.addEventListener('click', function () {
      openWhatsApp(msgInput.value.trim());
    });

    quickButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        var promptIndex = Number(button.getAttribute('data-oas-prompt'));
        var prompt = QUICK_PROMPTS[promptIndex] || '';
        if (!prompt) {
          return;
        }
        openPanel();
        sendMessage(prompt);
      });
    });

    if (nudge) {
      nudge.addEventListener('click', function () {
        openPanel();
      });
    }

    if (nudgeCloseBtn) {
      nudgeCloseBtn.addEventListener('click', function (event) {
        event.stopPropagation();
        hideNudge(true);
      });
    }

    msgInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendBtn.click();
      }
    });

    fab.addEventListener('click', function () {
      if (isOpen) {
        closePanel();
        return;
      }
      openPanel();
    });

    closeBtn.addEventListener('click', closePanel);

    document.addEventListener('click', function (event) {
      if (!isOpen) {
        return;
      }
      if (!panel.contains(event.target) && !fab.contains(event.target)) {
        closePanel();
      }
    });

    scheduleNudge();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
