const fetch = require("node-fetch");

function json(statusCode, bodyObj) {
  return {
    statusCode,
    headers: {
      "Cache-Control": "no-cache",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bodyObj),
  };
}

function getEnv(name, fallback = "") {
  const v = process.env[name];
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function buildSystemPrompt({ vibeMode }) {
  const vibe = vibeMode
    ? "Playful, exploratory, and high-energy — but still accurate and safe."
    : "Direct, concise, and practical.";

  return [
    "You are ManagerGPT, an online vibe coder.",
    `Tone: ${vibe}`,
    "",
    "You help users build software quickly.",
    "Rules:",
    "- If you provide code, prefer returning a SINGLE fenced code block that contains the full updated code (not a diff).",
    "- Ask minimal questions; make reasonable assumptions and state them briefly.",
    "- Be honest about uncertainty; do not invent APIs.",
    "- If the user pasted code, propose changes and output the updated code in one code block when possible.",
  ].join("\n");
}

function coerceMessages(inMessages) {
  if (!Array.isArray(inMessages)) return [];
  return inMessages
    .filter((m) => m && typeof m === "object")
    .map((m) => ({
      role: m.role === "user" || m.role === "assistant" || m.role === "system" ? m.role : "user",
      content: typeof m.content === "string" ? m.content : "",
    }))
    .filter((m) => m.content.trim().length > 0)
    .slice(-20);
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Cache-Control": "no-cache",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const apiKey = getEnv("OPENAI_API_KEY");
  if (!apiKey) {
    return json(501, {
      error:
        "OPENAI_API_KEY is not set. Configure it in your host (e.g., Netlify env vars) to enable online responses.",
    });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const vibeMode = !!payload.vibeMode;
  const editor = typeof payload.editor === "string" ? payload.editor : "";
  const inMessages = coerceMessages(payload.messages);

  const baseUrl = getEnv("OPENAI_BASE_URL", "https://api.openai.com");
  const model = getEnv("OPENAI_MODEL", "gpt-4.1-mini");

  const messages = [
    { role: "system", content: buildSystemPrompt({ vibeMode }) },
    ...(editor.trim()
      ? [
          {
            role: "system",
            content: `Current editor content (treat as the source of truth):\n\n${editor}`,
          },
        ]
      : []),
    ...inMessages,
  ];

  try {
    const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: vibeMode ? 0.8 : 0.4,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return json(res.status, { error: "Upstream error", details: text || res.statusText });
    }

    const data = await res.json();
    const reply =
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      typeof data.choices[0].message.content === "string"
        ? data.choices[0].message.content
        : "";

    return json(200, { reply: reply || "I didn't get any content back. Try again." });
  } catch (err) {
    return json(500, { error: "Server error", details: String(err && err.message ? err.message : err) });
  }
};

