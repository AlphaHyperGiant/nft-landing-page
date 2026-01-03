let fetchFn = globalThis.fetch;
if (!fetchFn) {
  try {
    // Fallback for older Node runtimes
    // eslint-disable-next-line global-require
    fetchFn = require('node-fetch');
  } catch (_) {
    fetchFn = null;
  }
}

const PROVIDER = (process.env.LLM_PROVIDER || 'openai').toLowerCase();
const API_KEY = process.env.LLM_API_KEY;
const MODEL =
  process.env.LLM_MODEL ||
  (PROVIDER === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gpt-4o-mini');

const DEFAULT_SPONSOR_URL =
  process.env.SPONSOR_URL || 'https://example.com/sponsor';

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

function safeJsonParse(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (err) {
    return { ok: false, error: err };
  }
}

function buildEmailPrompt(input) {
  const tone = input.tone || 'friendly and concise';
  const signature = input.signature || '';
  const instructions = input.instructions || '';
  const context = input.context || '';
  const userPrompt = input.prompt || '';

  return [
    `Write a high-quality email.`,
    `Tone: ${tone}.`,
    instructions ? `Extra instructions: ${instructions}` : '',
    context ? `Context:\n${context}` : '',
    userPrompt ? `User request:\n${userPrompt}` : '',
    signature ? `Signature to include at end:\n${signature}` : '',
    '',
    `Return ONLY valid JSON with keys: "subject" (string), "body" (string).`,
  ]
    .filter(Boolean)
    .join('\n');
}

async function callOpenAI(prompt) {
  const url = 'https://api.openai.com/v1/chat/completions';
  const res = await fetchFn(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content:
            'You generate email drafts. Output must be strict JSON, no markdown.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    return { ok: false, error: { status: res.status, body: text } };
  }

  const parsed = safeJsonParse(text);
  if (!parsed.ok) return { ok: false, error: { status: 502, body: text } };

  const content = parsed.value?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    return { ok: false, error: { status: 502, body: text } };
  }

  const email = safeJsonParse(content);
  if (!email.ok) return { ok: false, error: { status: 502, body: content } };
  return { ok: true, value: email.value };
}

async function callAnthropic(prompt) {
  const url = 'https://api.anthropic.com/v1/messages';
  const res = await fetchFn(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 700,
      temperature: 0.4,
      system: 'You generate email drafts. Output must be strict JSON, no markdown.',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    return { ok: false, error: { status: res.status, body: text } };
  }

  const parsed = safeJsonParse(text);
  if (!parsed.ok) return { ok: false, error: { status: 502, body: text } };

  const content = parsed.value?.content?.[0]?.text;
  if (typeof content !== 'string') {
    return { ok: false, error: { status: 502, body: text } };
  }

  const email = safeJsonParse(content);
  if (!email.ok) return { ok: false, error: { status: 502, body: content } };
  return { ok: true, value: email.value };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true });
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed. Use POST.' });
  }

  if (!fetchFn) {
    return json(500, {
      error:
        'No fetch implementation available. Use a Node runtime with global fetch (Node 18+) or install node-fetch.',
    });
  }

  if (!API_KEY) {
    return json(500, {
      error:
        'Missing LLM_API_KEY. Set env vars LLM_PROVIDER, LLM_API_KEY, LLM_MODEL.',
    });
  }

  const bodyText = event.body || '';
  const parsedBody = safeJsonParse(bodyText);
  if (!parsedBody.ok) {
    return json(400, { error: 'Invalid JSON body.' });
  }

  const input = parsedBody.value || {};
  const includeSponsor = input.includeSponsor !== false;
  const sponsorUrl = input.sponsorUrl || DEFAULT_SPONSOR_URL;

  const prompt = buildEmailPrompt(input);
  const result =
    PROVIDER === 'anthropic' ? await callAnthropic(prompt) : await callOpenAI(prompt);

  if (!result.ok) {
    // Don’t leak secrets; include minimal diagnostics.
    return json(502, {
      error: 'LLM request failed.',
      provider: PROVIDER,
      status: result.error?.status,
    });
  }

  const subject = String(result.value?.subject || '').trim();
  const emailBody = String(result.value?.body || '').trim();

  if (!subject || !emailBody) {
    return json(502, { error: 'LLM returned an invalid email payload.' });
  }

  return json(200, {
    subject,
    body: includeSponsor
      ? `${emailBody}\n\n—\nSponsored: ${sponsorUrl}`
      : emailBody,
    sponsor: includeSponsor ? { url: sponsorUrl } : null,
  });
};

