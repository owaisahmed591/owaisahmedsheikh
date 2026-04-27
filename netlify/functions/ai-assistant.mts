const SITE_CONTEXT = `
You are the website assistant for Owais Ahmed Sheikh, a freelance SEO expert and SEO content writer based in Karachi, Pakistan.

You help visitors understand:
- local SEO Karachi and Pakistan city SEO
- Google Business Profile and Google Maps SEO
- technical SEO audits, crawl issues, indexing, schema, speed, and Core Web Vitals
- on-page SEO, service page structure, internal links, and content gaps
- off-page SEO and safe link building
- SEO content writing, blog writing, landing pages, service pages, and copywriting
- case studies, pricing questions, and the best first step for a business website

Style rules:
- Keep answers short, practical, and clear.
- Write naturally, like a helpful SEO consultant.
- Ask for business type, city, website URL, and main goal when needed.
- Do not guarantee rankings.
- Do not invent client results, prices, or facts.
- If the visitor needs a real review, suggest sending the website on WhatsApp.
- Avoid jargon unless you explain it simply.
- Do not use em dashes.
`;

const FALLBACK_REPLY =
  'I can help with SEO audits, local SEO, technical SEO, content writing, pricing, and the best next step for your website. Tell me your business type, city, website URL, and what you want to improve.';

function json(status, body) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store'
    }
  });
}

function getOutputText(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const chunks = [];
  for (const item of data?.output || []) {
    for (const part of item?.content || []) {
      if (part?.type === 'output_text' && typeof part.text === 'string') {
        chunks.push(part.text);
      }
    }
  }

  return chunks.join('\n').trim();
}

export default async (request) => {
  if (request.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const apiKey = Netlify.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    return json(200, { answer: FALLBACK_REPLY, mode: 'fallback' });
  }

  let payload;

  try {
    payload = await request.json();
  } catch {
    return json(400, { error: 'Invalid JSON request' });
  }

  const message = String(payload.message || '').trim().slice(0, 900);
  if (!message) {
    return json(400, { error: 'Message is required' });
  }

  const pageTitle = String(payload.pageTitle || '').slice(0, 160);
  const pageUrl = String(payload.pageUrl || '').slice(0, 240);
  const model = Netlify.env.get('OPENAI_MODEL') || 'gpt-5.4-nano';

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        max_output_tokens: 320,
        input: [
          {
            role: 'developer',
            content: `${SITE_CONTEXT}\nCurrent page title: ${pageTitle || 'Unknown'}\nCurrent page URL: ${pageUrl || 'Unknown'}`
          },
          {
            role: 'user',
            content: message
          }
        ]
      })
    });

    if (!response.ok) {
      return json(200, { answer: FALLBACK_REPLY, mode: 'fallback' });
    }

    const data = await response.json();
    const answer = getOutputText(data);

    return json(200, {
      answer: answer || FALLBACK_REPLY,
      mode: answer ? 'openai' : 'fallback'
    });
  } catch {
    return json(200, { answer: FALLBACK_REPLY, mode: 'fallback' });
  }
};

export const config = {
  path: '/api/ai-assistant'
};
